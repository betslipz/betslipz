// Offline paywall test: runs supabase/setup.sql on an in-memory Postgres (PGlite) with
// minimal stand-ins for Supabase's auth/storage schemas, then checks what each user can see/do.
// Usage: npm run test:rls
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failures++;
};

// ---- Supabase stand-ins ----
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
  -- Supabase's default privileges: API roles get table/function grants, RLS does the filtering.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);

const sql = readFileSync(new URL("../supabase/setup.sql", import.meta.url), "utf8").replace(/create extension[^;]*;/gi, "");
await db.exec(sql);

// ---- Fixtures (as superuser) ----
const U = {
  admin: "00000000-0000-0000-0000-00000000000a",
  vip: "00000000-0000-0000-0000-00000000000b",
  regular: "00000000-0000-0000-0000-00000000000c",
  free: "00000000-0000-0000-0000-00000000000d",
  expired: "00000000-0000-0000-0000-00000000000e",
  banned: "00000000-0000-0000-0000-00000000000f",
};
for (const [name, id] of Object.entries(U)) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{"full_name":"x"}')`, [id, `${name}@t.test`]);
}
await db.exec(`
  update public.profiles set role = 'admin' where id = '${U.admin}';
  update public.profiles set banned = true where id = '${U.banned}';
  insert into public.subscriptions (user_id, tier, starts_at, ends_at) values
    ('${U.vip}', 'vip', now() - interval '1 day', now() + interval '10 days'),
    ('${U.regular}', 'regular', now() - interval '1 day', now() + interval '10 days'),
    ('${U.expired}', 'regular', now() - interval '40 days', now() - interval '10 days'),
    ('${U.banned}', 'vip', now() - interval '1 day', now() + interval '10 days');
  insert into public.slips (id, tier, title_en, total_odds, confidence, status, publish_at, image_path) values
    ('10000000-0000-0000-0000-000000000001', 'regular', 'open regular', 2.5, 70, 'pending', now() - interval '1 hour', 'r.png'),
    ('10000000-0000-0000-0000-000000000002', 'vip', 'open vip', 4.1, 85, 'pending', now() - interval '1 hour', 'v.png'),
    ('10000000-0000-0000-0000-000000000003', 'regular', 'scheduled', 1.8, 60, 'pending', now() + interval '5 hours', null),
    ('10000000-0000-0000-0000-000000000004', 'vip', 'settled vip', 3.0, 80, 'won', now() - interval '3 days', null);
  insert into public.slip_legs (slip_id, event, market, pick, odds)
    select id, 'A vs B', '1X2', 'A', 1.5 from public.slips;
  insert into storage.objects (bucket_id, name) values ('slip-images', 'r.png'), ('slip-images', 'v.png');
`);

// Run a block of SQL as a given user (or anon), like PostgREST does.
async function as(user, fn) {
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role`);
  }
}
const titles = async () => (await db.query(`select title_en from public.slips order by title_en`)).rows.map((r) => r.title_en).join(", ");
const fails = async (q, params) => {
  try {
    await db.query(q, params);
    return false;
  } catch {
    return true;
  }
};

console.log("\nWho can see which slips");
const expect = {
  anon: "settled vip",
  free: "settled vip",
  expired: "settled vip",
  banned: "settled vip",
  regular: "open regular, settled vip",
  vip: "open regular, open vip, settled vip",
  admin: "open regular, open vip, scheduled, settled vip",
};
for (const [who, want] of Object.entries(expect)) {
  const got = await as(who === "anon" ? null : U[who], titles);
  check(`${who.padEnd(8)} sees [${want}]`, got === want, `got [${got}]`);
}

console.log("\nSlip legs (the picks) follow the same rule");
const legCount = async (who) => (await as(who, () => db.query(`select count(*)::int n from public.slip_legs`))).rows[0].n;
check("anon sees legs of 1 slip", (await legCount(null)) === 1);
check("regular sees legs of 2 slips", (await legCount(U.regular)) === 2);
check("vip sees legs of 3 slips", (await legCount(U.vip)) === 3);

console.log("\nLocked teasers & images");
const teasers = await as(null, () => db.query(`select tier from public.slip_teasers()`));
check("teasers list 2 open slips (not the scheduled one)", teasers.rows.length === 2);
const imgs = async (who) => (await as(who, () => db.query(`select name from storage.objects where bucket_id = 'slip-images' order by name`))).rows.map((r) => r.name).join(",");
check("regular can fetch only the regular slip image", (await imgs(U.regular)) === "r.png");
check("vip can fetch both images", (await imgs(U.vip)) === "r.png,v.png");
check("free user can fetch no images", (await imgs(U.free)) === "");

console.log("\nTampering attempts are blocked");
check("user cannot make themselves admin", await as(U.regular, () => fails(`update public.profiles set role = 'admin' where id = $1`, [U.regular])));
const roleAfter = (await db.query(`select role from public.profiles where id = $1`, [U.regular])).rows[0].role;
check("…role is still 'user'", roleAfter === "user");
check("user can edit own name", !(await as(U.regular, () => fails(`update public.profiles set full_name = 'New' where id = $1`, [U.regular]))));
check("user cannot insert a subscription", await as(U.free, () => fails(`insert into public.subscriptions (user_id, tier, ends_at) values ($1, 'vip', now() + interval '1 year')`, [U.free])));
check("user cannot grant themselves a plan", await as(U.free, () => fails(`select public.grant_plan($1, 1)`, [U.free])));
check("anon cannot insert slips", await as(null, () => fails(`insert into public.slips (title_en, total_odds, confidence) values ('x', 2, 50)`)));
check("regular cannot read others' profiles", (await as(U.regular, () => db.query(`select id from public.profiles`))).rows.length === 1);
check(
  "user cannot upload a receipt into someone else's folder",
  await as(U.free, () => fails(`insert into storage.objects (bucket_id, name) values ('payment-proofs', $1)`, [`${U.vip}/x.png`])),
);
check(
  "user can upload a receipt into own folder",
  !(await as(U.free, () => fails(`insert into storage.objects (bucket_id, name) values ('payment-proofs', $1)`, [`${U.free}/x.png`]))),
);

console.log("\nPayment flow");
const vipMonth = (await db.query(`select id, price_usd from public.plans where tier = 'vip' and duration = 'month'`)).rows[0];
const pay = await as(U.free, () =>
  db.query(
    `insert into public.payments (user_id, plan_id, method, reference, amount_usd, status) values ($1, $2, 'whish', 'REF123', 0.01, 'approved') returning id, amount_usd, status`,
    [U.free, vipMonth.id],
  ),
);
check("price comes from the plan, not the form", Number(pay.rows[0].amount_usd) === Number(vipMonth.price_usd), `got ${pay.rows[0].amount_usd}`);
check("status forced to pending", pay.rows[0].status === "pending");
check("user cannot approve own payment", await as(U.free, () => fails(`select public.approve_payment($1)`, [pay.rows[0].id])));
await as(U.admin, () => db.query(`select public.approve_payment($1)`, [pay.rows[0].id]));
check("after admin approval the user sees VIP slips", (await as(U.free, titles)) === "open regular, open vip, settled vip");
const pay2 = await as(U.free, () => db.query(`insert into public.payments (user_id, plan_id, method, reference) values ($1, $2, 'omt', 'R2') returning id`, [U.free, vipMonth.id]));
await as(U.admin, () => db.query(`select public.approve_payment($1)`, [pay2.rows[0].id]));
const subs = (await db.query(`select starts_at, ends_at from public.subscriptions where user_id = $1 order by starts_at`, [U.free])).rows;
check("renewal stacks on top of remaining time", subs.length === 2 && +subs[1].starts_at === +subs[0].ends_at);
check("cannot approve the same payment twice", await as(U.admin, () => fails(`select public.approve_payment($1)`, [pay.rows[0].id])));
for (let i = 0; i < 3; i++) await as(U.regular, () => db.query(`insert into public.payments (user_id, plan_id, method, reference) values ($1, 1, 'omt', 'RR')`, [U.regular]));
check("4th pending payment is refused", await as(U.regular, () => fails(`insert into public.payments (user_id, plan_id, method, reference) values ($1, 1, 'omt', 'RR')`, [U.regular])));

console.log(failures ? `\n✗ ${failures} check(s) failed\n` : "\n✓ All paywall checks passed\n");
process.exit(failures ? 1 : 0);
