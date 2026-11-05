-- ONE-TIME SETUP: paste this whole file into Supabase → SQL Editor → Run.
-- Generated from supabase/migrations/0001_schema.sql + supabase/seed.sql + migrations 0002 and 0003

-- =============================================================
-- Betting slips subscription site: schema, RLS and storage rules
-- The paywall is enforced HERE, in Postgres Row-Level Security,
-- so even a bug in the web app cannot leak today's slips.
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- Types ----------
create type public.tier as enum ('regular', 'vip');
create type public.plan_duration as enum ('week', 'month', 'quarter', 'year');
create type public.slip_status as enum ('pending', 'won', 'lost', 'void', 'partial');
create type public.payment_status as enum ('pending', 'approved', 'rejected');
create type public.payment_method as enum ('whish', 'omt', 'cash', 'usdt', 'mock');

-- ---------- Tables ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text check (char_length(full_name) <= 120),
  phone       text check (char_length(phone) <= 40),
  locale      text not null default 'en' check (locale in ('en', 'ar')),
  role        text not null default 'user' check (role in ('user', 'admin')),
  banned      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.plans (
  id          serial primary key,
  tier        public.tier not null,
  duration    public.plan_duration not null,
  price_usd   numeric(10, 2) not null check (price_usd >= 0),
  active      boolean not null default true,
  unique (tier, duration)
);

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  plan_id      int not null references public.plans (id),
  method       public.payment_method not null,
  reference    text not null check (char_length(reference) between 2 and 120),
  proof_path   text,
  amount_usd   numeric(10, 2) not null default 0,
  status       public.payment_status not null default 'pending',
  admin_note   text,
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  plan_id     int references public.plans (id),
  payment_id  uuid references public.payments (id),
  tier        public.tier not null,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on public.subscriptions (user_id, ends_at);

create table public.slips (
  id              uuid primary key default gen_random_uuid(),
  tier            public.tier not null default 'regular',
  title_en        text not null check (char_length(title_en) <= 140),
  title_ar        text check (char_length(title_ar) <= 140),
  total_odds      numeric(10, 2) not null check (total_odds >= 1),
  confidence      int not null check (confidence between 0 and 100),
  stake_units     numeric(4, 1) not null default 1 check (stake_units > 0 and stake_units <= 10),
  notes_en        text,
  notes_ar        text,
  image_path      text,
  betarabia_code  text check (char_length(betarabia_code) <= 60),
  status          public.slip_status not null default 'pending',
  publish_at      timestamptz not null default now(),
  settled_at      timestamptz,
  created_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now()
);
create index on public.slips (publish_at desc);

create table public.slip_legs (
  id          uuid primary key default gen_random_uuid(),
  slip_id     uuid not null references public.slips (id) on delete cascade,
  position    int not null default 0,
  event       text not null check (char_length(event) <= 160),
  market      text not null check (char_length(market) <= 80),
  pick        text not null check (char_length(pick) <= 80),
  odds        numeric(8, 2) not null check (odds >= 1),
  kickoff_at  timestamptz,
  result      public.slip_status not null default 'pending'
);
create index on public.slip_legs (slip_id, position);

-- Public, non-secret settings (payment instructions, contact numbers).
create table public.settings (
  key    text primary key,
  value  jsonb not null
);

create table public.audit_log (
  id          bigserial primary key,
  actor       uuid,
  action      text not null,
  entity      text,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- ---------- Helper functions (SECURITY DEFINER, fixed search_path) ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and not banned
  );
$$;

-- Highest active tier for the current user, or null.
create or replace function public.current_tier()
returns public.tier language sql stable security definer set search_path = public as $$
  select case
    when bool_or(s.tier = 'vip') then 'vip'::public.tier
    when count(*) > 0 then 'regular'::public.tier
  end
  from public.subscriptions s
  join public.profiles p on p.id = s.user_id
  where s.user_id = auth.uid()
    and not s.revoked
    and not p.banned
    and now() >= s.starts_at
    and now() < s.ends_at;
$$;

-- THE paywall rule.
create or replace function public.can_view_slip(p_tier public.tier, p_status public.slip_status, p_publish_at timestamptz)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  t public.tier;
begin
  if public.is_admin() then
    return true;
  end if;
  if p_publish_at > now() then
    return false;                       -- scheduled, not yet published
  end if;
  if p_status <> 'pending' then
    return true;                        -- settled slips form the public track record
  end if;
  t := public.current_tier();
  return t is not null and (p_tier = 'regular' or t = 'vip');
end;
$$;

-- ---------- Triggers ----------
-- Create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, locale)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    case when new.raw_user_meta_data ->> 'locale' = 'ar' then 'ar' else 'en' end
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Payments: price comes from the plan, never from the client; cap pending requests.
create or replace function public.payments_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pending_count int;
begin
  select count(*) into pending_count from public.payments
  where user_id = new.user_id and status = 'pending';
  if pending_count >= 3 then
    raise exception 'Too many pending payments. Please wait for review.';
  end if;
  select price_usd into new.amount_usd from public.plans where id = new.plan_id and active;
  if new.amount_usd is null then
    raise exception 'Plan not available';
  end if;
  new.status := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.admin_note := null;
  return new;
end;
$$;
create trigger payments_before_insert
  before insert on public.payments
  for each row execute function public.payments_before_insert();

-- Slips: stamp settled_at when the result is set.
create or replace function public.slips_before_update()
returns trigger language plpgsql as $$
begin
  if new.status <> 'pending' and old.status = 'pending' then
    new.settled_at := now();
  elsif new.status = 'pending' then
    new.settled_at := null;
  end if;
  return new;
end;
$$;
create trigger slips_before_update
  before update on public.slips
  for each row execute function public.slips_before_update();

-- Audit every admin write to slips.
create or replace function public.audit_slips()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (
    auth.uid(),
    lower(tg_op),
    'slip',
    coalesce(new.id, old.id)::text,
    case when tg_op = 'UPDATE' then jsonb_build_object('status', new.status) else null end
  );
  return coalesce(new, old);
end;
$$;
create trigger audit_slips
  after insert or update or delete on public.slips
  for each row execute function public.audit_slips();

-- ---------- RPCs ----------
create or replace function public.plan_interval(d public.plan_duration)
returns interval language sql immutable as $$
  select case d
    when 'week' then interval '7 days'
    when 'month' then interval '1 month'
    when 'quarter' then interval '3 months'
    when 'year' then interval '1 year'
  end;
$$;

-- Give a user a plan; stacks on top of an existing active plan of the same tier.
create or replace function public.grant_plan(p_user uuid, p_plan int, p_payment uuid default null)
returns public.subscriptions language plpgsql security definer set search_path = public as $$
declare
  pl public.plans;
  start_at timestamptz;
  sub public.subscriptions;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  select * into pl from public.plans where id = p_plan;
  if pl.id is null then
    raise exception 'Unknown plan';
  end if;
  select greatest(now(), coalesce(max(ends_at), now())) into start_at
  from public.subscriptions
  where user_id = p_user and tier = pl.tier and not revoked and ends_at > now();

  insert into public.subscriptions (user_id, plan_id, payment_id, tier, starts_at, ends_at)
  values (p_user, pl.id, p_payment, pl.tier, start_at, start_at + public.plan_interval(pl.duration))
  returning * into sub;

  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'grant_plan', 'subscription', sub.id::text,
          jsonb_build_object('user', p_user, 'plan', p_plan, 'payment', p_payment));
  return sub;
end;
$$;

create or replace function public.approve_payment(p_payment uuid)
returns public.subscriptions language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  select * into pay from public.payments where id = p_payment for update;
  if pay.id is null or pay.status <> 'pending' then
    raise exception 'Payment is not pending';
  end if;
  update public.payments
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_payment;
  return public.grant_plan(pay.user_id, pay.plan_id, pay.id);
end;
$$;

create or replace function public.reject_payment(p_payment uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  update public.payments
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), admin_note = left(p_note, 300)
    where id = p_payment and status = 'pending';
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'reject_payment', 'payment', p_payment::text, jsonb_build_object('note', p_note));
end;
$$;

-- Locked previews of today's slips for non-subscribers: no picks, no confidence.
create or replace function public.slip_teasers()
returns table (id uuid, tier public.tier, legs int, total_odds numeric, publish_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.tier, (select count(*)::int from public.slip_legs l where l.slip_id = s.id), s.total_odds, s.publish_at
  from public.slips s
  where s.status = 'pending' and s.publish_at <= now()
  order by s.publish_at desc
  limit 50;
$$;

-- Public track record numbers.
create or replace function public.track_record(p_days int default 30)
returns table (won int, lost int, void int, partial int, avg_odds_won numeric)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where status = 'won')::int,
    count(*) filter (where status = 'lost')::int,
    count(*) filter (where status = 'void')::int,
    count(*) filter (where status = 'partial')::int,
    round(avg(total_odds) filter (where status = 'won'), 2)
  from public.slips
  where status <> 'pending' and settled_at > now() - make_interval(days => p_days);
$$;

-- ---------- Row-Level Security ----------
alter table public.profiles      enable row level security;
alter table public.plans         enable row level security;
alter table public.payments      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.slips         enable row level security;
alter table public.slip_legs     enable row level security;
alter table public.settings      enable row level security;
alter table public.audit_log     enable row level security;

-- profiles: see/edit yourself; admins see/edit all. Users can only change harmless columns.
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, locale) on public.profiles to authenticated;
-- Admins change role/banned via the admin_set_user RPC below.

-- plans: everyone reads active plans; admins manage.
create policy plans_select on public.plans for select
  using (active or public.is_admin());
create policy plans_admin on public.plans for all
  using (public.is_admin()) with check (public.is_admin());

-- payments: users create & read their own pending requests; admins review via RPCs.
create policy payments_select on public.payments for select
  using (user_id = auth.uid() or public.is_admin());
create policy payments_insert on public.payments for insert
  with check (
    user_id = auth.uid()
    and (proof_path is null or proof_path like auth.uid()::text || '/%')
    and not exists (select 1 from public.profiles where id = auth.uid() and banned));

-- subscriptions: read own; only admin RPCs write.
create policy subs_select on public.subscriptions for select
  using (user_id = auth.uid() or public.is_admin());
create policy subs_admin on public.subscriptions for all
  using (public.is_admin()) with check (public.is_admin());

-- slips & legs: the paywall.
create policy slips_select on public.slips for select
  using (public.can_view_slip(tier, status, publish_at));
create policy slips_admin on public.slips for all
  using (public.is_admin()) with check (public.is_admin());

create policy legs_select on public.slip_legs for select
  using (exists (
    select 1 from public.slips s
    where s.id = slip_id and public.can_view_slip(s.tier, s.status, s.publish_at)));
create policy legs_admin on public.slip_legs for all
  using (public.is_admin()) with check (public.is_admin());

-- settings: public read, admin write.
create policy settings_select on public.settings for select using (true);
create policy settings_admin on public.settings for all
  using (public.is_admin()) with check (public.is_admin());

-- audit_log: admins read only.
create policy audit_select on public.audit_log for select using (public.is_admin());

create or replace function public.admin_set_user(p_user uuid, p_role text, p_banned boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if p_user = auth.uid() and (p_role <> 'admin' or p_banned) then
    raise exception 'You cannot demote or ban yourself';
  end if;
  update public.profiles set role = p_role, banned = p_banned where id = p_user;
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'set_user', 'profile', p_user::text,
          jsonb_build_object('role', p_role, 'banned', p_banned));
end;
$$;

create or replace function public.revoke_subscription(p_sub uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  update public.subscriptions set revoked = true where id = p_sub;
  insert into public.audit_log (actor, action, entity, entity_id)
  values (auth.uid(), 'revoke_subscription', 'subscription', p_sub::text);
end;
$$;

-- Lock RPCs down to signed-in users (anon may only call the public ones).
revoke execute on all functions in schema public from anon, public;
grant execute on function public.slip_teasers() to anon, authenticated;
grant execute on function public.track_record(int) to anon, authenticated;
grant execute on function public.can_view_slip(public.tier, public.slip_status, timestamptz) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.current_tier() to anon, authenticated;
grant execute on function public.plan_interval(public.plan_duration) to anon, authenticated;
grant execute on function public.grant_plan(uuid, int, uuid) to authenticated;
grant execute on function public.approve_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;
grant execute on function public.admin_set_user(uuid, text, boolean) to authenticated;
grant execute on function public.revoke_subscription(uuid) to authenticated;

-- ---------- Storage (private buckets) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('slip-images', 'slip-images', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Slip images: readable only by users allowed to see that slip.
create policy slip_images_read on storage.objects for select
  using (bucket_id = 'slip-images' and exists (
    select 1 from public.slips s
    where s.image_path = name and public.can_view_slip(s.tier, s.status, s.publish_at)));
create policy slip_images_admin on storage.objects for all
  using (bucket_id = 'slip-images' and public.is_admin())
  with check (bucket_id = 'slip-images' and public.is_admin());

-- Payment proofs: users upload into their own folder (<uid>/file); admins read all.
create policy proofs_insert on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy proofs_read on storage.objects for select
  using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Plans (USD). Change prices any time from Admin → Settings.
insert into public.plans (tier, duration, price_usd) values
  ('regular', 'week',    5),
  ('regular', 'month',  15),
  ('regular', 'quarter', 39),
  ('regular', 'year',  129),
  ('vip',     'week',   12),
  ('vip',     'month',  35),
  ('vip',     'quarter', 89),
  ('vip',     'year',  299)
on conflict (tier, duration) do update set price_usd = excluded.price_usd;

-- Payment instructions shown on the Subscribe page (placeholders; edit in Admin → Settings).
insert into public.settings (key, value) values
  ('payment_methods', '{
    "whish": {"enabled": true,  "details": "Send to Whish number +961 XX XXX XXX"},
    "omt":   {"enabled": true,  "details": "OMT transfer to: <your full name>, +961 XX XXX XXX"},
    "usdt":  {"enabled": true,  "details": "USDT (TRC20) wallet: <your wallet address>"},
    "cash":  {"enabled": false, "details": "Contact us on WhatsApp to arrange cash payment"},
    "mock":  {"enabled": true,  "details": "DEV ONLY: simulated payment for local testing"}
  }'::jsonb),
  ('contact', '{"whatsapp": "+961 XX XXX XXX", "email": "support@example.com"}'::jsonb)
on conflict (key) do nothing;

-- =============================================================
-- One login at a time: the newest login on an account is the only
-- one that can see paid slips. Older devices are logged out by the
-- web app, and refused here too. Admins are exempt.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.
-- =============================================================

-- The account's current login (auth.sessions id). Users can't write it: their update grant covers only name, phone and locale.
alter table public.profiles add column if not exists active_session uuid;

-- The login this request comes from (the session_id claim of the access token).
create or replace function public.jwt_session()
returns uuid language sql stable set search_path = public as $$
  select nullif(auth.jwt() ->> 'session_id', '')::uuid;
$$;

-- Called by the web app right after every login: this login becomes the only valid one.
create or replace function public.claim_session()
returns void language sql security definer set search_path = public as $$
  update public.profiles set active_session = public.jwt_session()
  where id = auth.uid() and public.jwt_session() is not null;
$$;

-- False when the account has since logged in somewhere else. Accounts that never claimed a login yet pass.
create or replace function public.session_is_current()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select p.role = 'admin' or p.active_session is null or p.active_session = public.jwt_session()
    from public.profiles p where p.id = auth.uid()
  ), true);
$$;

-- The paywall's tier lookup now also requires the current login, so older devices lose paid slips and slip images.
create or replace function public.current_tier()
returns public.tier language sql stable security definer set search_path = public as $$
  select case
    when bool_or(s.tier = 'vip') then 'vip'::public.tier
    when count(*) > 0 then 'regular'::public.tier
  end
  from public.subscriptions s
  join public.profiles p on p.id = s.user_id
  where s.user_id = auth.uid()
    and not s.revoked
    and not p.banned
    and now() >= s.starts_at
    and now() < s.ends_at
    and public.session_is_current();
$$;

revoke execute on function public.jwt_session() from anon, public;
revoke execute on function public.claim_session() from anon, public;
revoke execute on function public.session_is_current() from anon, public;
grant execute on function public.jwt_session() to authenticated;
grant execute on function public.claim_session() to authenticated;
grant execute on function public.session_is_current() to anon, authenticated;

-- =============================================================
-- Slips no longer carry a bookmaker booking code.
-- Run only AFTER the site version without booking codes is live:
-- the older version still reads this column.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.
-- =============================================================

alter table public.slips drop column if exists betarabia_code;
