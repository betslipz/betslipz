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
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
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
  tennis: "00000000-0000-0000-0000-00000000000c",
  free: "00000000-0000-0000-0000-00000000000d",
  expired: "00000000-0000-0000-0000-00000000000e",
  banned: "00000000-0000-0000-0000-00000000000f",
};
const S = {
  open: "10000000-0000-0000-0000-000000000001",
  started: "10000000-0000-0000-0000-000000000002",
  scheduled: "10000000-0000-0000-0000-000000000003",
  settled: "10000000-0000-0000-0000-000000000004",
};
for (const [name, id] of Object.entries(U)) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{"full_name":"x"}')`, [id, `${name}@t.test`]);
}
await db.exec(`
  update public.profiles set role = 'admin' where id = '${U.admin}';
  update public.profiles set banned = true where id = '${U.banned}';
  insert into public.subscriptions (user_id, tier, sport, starts_at, ends_at) values
    ('${U.vip}', 'vip', null, now() - interval '1 day', now() + interval '10 days'),
    ('${U.tennis}', 'regular', 'tennis', now() - interval '1 day', now() + interval '10 days'),
    ('${U.expired}', 'regular', 'tennis', now() - interval '40 days', now() - interval '10 days'),
    ('${U.banned}', 'vip', null, now() - interval '1 day', now() + interval '10 days');
  insert into public.predictions (sport, event, market, pick, odds, confidence, status, publish_at) values
    ('football', 'open football', '1X2', 'Home', 1.6, 70, 'pending', now() - interval '1 hour'),
    ('tennis', 'open tennis', 'Winner', 'Player A', 1.4, 75, 'pending', now() - interval '1 hour'),
    ('tennis', 'scheduled tennis', 'Winner', 'Player B', 1.9, 60, 'pending', now() + interval '5 hours'),
    ('darts', 'settled darts', 'Winner', 'Player C', 2.1, 65, 'won', now() - interval '2 days');
  insert into public.slips (id, title_en, total_odds, confidence, status, publish_at, image_path, price_usd) values
    ('${S.open}', 'open slip', 2.5, 70, 'pending', now() - interval '1 hour', 'o.png', 4),
    ('${S.started}', 'started slip', 4.1, 85, 'pending', now() - interval '3 hours', 's.png', 5),
    ('${S.scheduled}', 'scheduled slip', 1.8, 60, 'pending', now() + interval '5 hours', null, 3),
    ('${S.settled}', 'settled slip', 3.0, 80, 'won', now() - interval '3 days', null, 3);
  insert into public.slip_legs (slip_id, event, market, pick, odds, kickoff_at) values
    ('${S.open}', 'A vs B', '1X2', 'A', 1.5, now() + interval '3 hours'),
    ('${S.started}', 'C vs D', '1X2', 'C', 1.5, now() - interval '1 hour'),
    ('${S.scheduled}', 'E vs F', '1X2', 'E', 1.5, now() + interval '8 hours'),
    ('${S.settled}', 'G vs H', '1X2', 'G', 1.5, now() - interval '3 days');
  insert into storage.objects (bucket_id, name) values ('slip-images', 'o.png'), ('slip-images', 's.png');
`);

// Run a block of SQL as a given user (or anon), like PostgREST does. `session` is the login's session_id claim.
async function as(user, fn, session = null) {
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
  const claims = user ? JSON.stringify({ sub: user, ...(session ? { session_id: session } : {}) }) : "";
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims]);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role`);
  }
}
const list = (table, col) => async () => (await db.query(`select ${col} from public.${table} order by ${col}`)).rows.map((r) => r[col]).join(", ");
const predictions = list("predictions", "event");
const slips = list("slips", "title_en");
const fails = async (q, params) => {
  try {
    await db.query(q, params);
    return false;
  } catch {
    return true;
  }
};
const who = (name) => (name === "anon" ? null : U[name]);

console.log("\nWho can see which predictions");
const wantPredictions = {
  anon: "settled darts",
  free: "settled darts",
  expired: "settled darts",
  banned: "settled darts",
  tennis: "open tennis, settled darts",
  vip: "open football, open tennis, settled darts",
  admin: "open football, open tennis, scheduled tennis, settled darts",
};
for (const [name, want] of Object.entries(wantPredictions)) {
  const got = await as(who(name), predictions);
  check(`${name.padEnd(8)} sees [${want}]`, got === want, `got [${got}]`);
}
const counts = (await as(null, () => db.query(`select sport, open from public.prediction_counts() order by sport`))).rows;
check("locked view: anon gets only counts per sport", JSON.stringify(counts) === JSON.stringify([{ sport: "football", open: 1 }, { sport: "tennis", open: 1 }]), JSON.stringify(counts));

console.log("\nWho can see which slips");
const wantSlips = {
  anon: "settled slip",
  free: "settled slip",
  tennis: "settled slip",
  banned: "settled slip",
  vip: "open slip, settled slip, started slip",
  admin: "open slip, scheduled slip, settled slip, started slip",
};
for (const [name, want] of Object.entries(wantSlips)) {
  const got = await as(who(name), slips);
  check(`${name.padEnd(8)} sees [${want}]`, got === want, `got [${got}]`);
}
const legCount = async (user) => (await as(user, () => db.query(`select count(*)::int n from public.slip_legs`))).rows[0].n;
check("slip picks follow the same rule (free: 1, vip: 3)", (await legCount(U.free)) === 1 && (await legCount(U.vip)) === 3);
const teasers = await as(null, () => db.query(`select id, price_usd from public.slip_teasers()`));
check("teasers list the 2 open slips with their price", teasers.rows.length === 2 && teasers.rows.some((r) => Number(r.price_usd) === 4));
const imgs = async (user) => (await as(user, () => db.query(`select name from storage.objects where bucket_id = 'slip-images' order by name`))).rows.map((r) => r.name).join(",");
check("vip can fetch both slip images", (await imgs(U.vip)) === "o.png,s.png");
check("free user can fetch no slip images", (await imgs(U.free)) === "");

console.log("\nBuying one slip");
const buy = (user, slip, ref = "REF") =>
  as(user, () => db.query(`insert into public.payments (user_id, slip_id, method, reference, amount_usd, status) values ($1, $2, 'whish', $3, 0.01, 'approved') returning id, amount_usd, status`, [user, slip, ref]));
const p1 = await buy(U.free, S.open);
check("price comes from the slip, not the form", Number(p1.rows[0].amount_usd) === 4, `got ${p1.rows[0].amount_usd}`);
check("status forced to pending", p1.rows[0].status === "pending");
check("a second payment for the same slip is refused while one is pending", await as(U.free, () => fails(`insert into public.payments (user_id, slip_id, method, reference) values ($1, $2, 'omt', 'R')`, [U.free, S.open])));
check("buying a slip whose first game started is refused", await as(U.free, () => fails(`insert into public.payments (user_id, slip_id, method, reference) values ($1, $2, 'omt', 'R')`, [U.free, S.started])));
check("buying a scheduled slip is refused", await as(U.free, () => fails(`insert into public.payments (user_id, slip_id, method, reference) values ($1, $2, 'omt', 'R')`, [U.free, S.scheduled])));
check("VIP can't buy a slip they already see", await as(U.vip, () => fails(`insert into public.payments (user_id, slip_id, method, reference) values ($1, $2, 'omt', 'R')`, [U.vip, S.open])));
check("a payment can't be for both a plan and a slip", await as(U.free, () => fails(`insert into public.payments (user_id, plan_id, slip_id, method, reference) values ($1, 1, $2, 'omt', 'R')`, [U.free, S.open])));
check("user can't unlock a slip directly", await as(U.free, () => fails(`insert into public.slip_unlocks (user_id, slip_id) values ($1, $2)`, [U.free, S.open])));
check("user can't approve own payment", await as(U.free, () => fails(`select public.approve_payment($1)`, [p1.rows[0].id])));
await as(U.admin, () => db.query(`select public.approve_payment($1)`, [p1.rows[0].id]));
check("after approval the buyer sees that slip", (await as(U.free, slips)) === "open slip, settled slip");
check("…and its image", (await imgs(U.free)) === "o.png");
check("…but other users still don't", (await as(U.tennis, slips)) === "settled slip");
check("buying the same slip again is refused", await as(U.free, () => fails(`insert into public.payments (user_id, slip_id, method, reference) values ($1, $2, 'omt', 'R')`, [U.free, S.open])));

console.log("\nSport plans");
const tennisMonth = (await db.query(`select id, price_usd from public.plans where sport = 'tennis' and duration = 'month' and active`)).rows[0];
check("each sport has its own active plans", (await db.query(`select count(*)::int n from public.plans where sport is not null and active`)).rows[0].n === 16);
check("old Regular plans are switched off", (await db.query(`select count(*)::int n from public.plans where tier = 'regular' and sport is null and active`)).rows[0].n === 0);
const p2 = await as(U.free, () => db.query(`insert into public.payments (user_id, plan_id, method, reference) values ($1, $2, 'omt', 'T1') returning id, amount_usd`, [U.free, tennisMonth.id]));
check("plan price comes from the plan", Number(p2.rows[0].amount_usd) === Number(tennisMonth.price_usd));
await as(U.admin, () => db.query(`select public.approve_payment($1)`, [p2.rows[0].id]));
check("a Tennis plan opens tennis predictions only", (await as(U.free, predictions)) === "open tennis, settled darts");
const access = (await as(U.free, () => db.query(`select public.my_access() a`))).rows[0].a;
check("my_access reports tennis, not VIP", access.vip === false && JSON.stringify(access.sports) === '["tennis"]', JSON.stringify(access));
const p3 = await as(U.free, () => db.query(`insert into public.payments (user_id, plan_id, method, reference) values ($1, $2, 'omt', 'T2') returning id`, [U.free, tennisMonth.id]));
await as(U.admin, () => db.query(`select public.approve_payment($1)`, [p3.rows[0].id]));
const subs = (await db.query(`select starts_at, ends_at from public.subscriptions where user_id = $1 order by starts_at`, [U.free])).rows;
check("renewing a sport plan stacks on top of remaining time", subs.length === 2 && +subs[1].starts_at === +subs[0].ends_at);
check("cannot approve the same payment twice", await as(U.admin, () => fails(`select public.approve_payment($1)`, [p2.rows[0].id])));

console.log("\nOne login at a time");
const current = "20000000-0000-0000-0000-000000000001";
await db.query(`update public.profiles set active_session = $1 where id in ($2, $3)`, [current, U.tennis, U.vip]);
check("current login still sees tennis", (await as(U.tennis, predictions, current)) === "open tennis, settled darts");
check("older login loses tennis predictions", (await as(U.tennis, predictions, "20000000-0000-0000-0000-000000000002")) === "settled darts");
check("older VIP login loses open slips", (await as(U.vip, slips, "20000000-0000-0000-0000-000000000002")) === "settled slip");
check("user can't clear their own login record", await as(U.tennis, () => fails(`update public.profiles set active_session = null where id = $1`, [U.tennis]), current));

console.log("\nTampering attempts are blocked");
check("user cannot make themselves admin", await as(U.tennis, () => fails(`update public.profiles set role = 'admin' where id = $1`, [U.tennis])));
check("user cannot insert a subscription", await as(U.free, () => fails(`insert into public.subscriptions (user_id, tier, ends_at) values ($1, 'vip', now() + interval '1 year')`, [U.free])));
check("user cannot grant themselves a plan", await as(U.free, () => fails(`select public.grant_plan($1, 1)`, [U.free])));
check("user cannot add predictions", await as(U.free, () => fails(`insert into public.predictions (sport, event, market, pick, odds, confidence) values ('football', 'x', '1X2', 'x', 2, 50)`)));
check("anon cannot insert slips", await as(null, () => fails(`insert into public.slips (title_en, total_odds, confidence) values ('x', 2, 50)`)));
check("user cannot read others' profiles", (await as(U.tennis, () => db.query(`select id from public.profiles`))).rows.length === 1);
check("user cannot upload a receipt into someone else's folder", await as(U.free, () => fails(`insert into storage.objects (bucket_id, name) values ('payment-proofs', $1)`, [`${U.vip}/x.png`])));
for (let i = 0; i < 3; i++) await as(U.tennis, () => db.query(`insert into public.payments (user_id, plan_id, method, reference) values ($1, $2, 'omt', 'RR')`, [U.tennis, tennisMonth.id]));
check("4th pending payment is refused", await as(U.tennis, () => fails(`insert into public.payments (user_id, plan_id, method, reference) values ($1, $2, 'omt', 'RR')`, [U.tennis, tennisMonth.id])));

console.log(failures ? `\n✗ ${failures} check(s) failed\n` : "\n✓ All paywall checks passed\n");
process.exit(failures ? 1 : 0);
