-- =============================================================
-- Predictions by sport, and slips sold one at a time.
--   * Single-game predictions in four sports. A sport plan opens one
--     sport; VIP opens every sport and every slip.
--   * Everyone else buys slips one by one (manual payment, approved
--     by the admin), at a price set per slip.
-- This migration only ADDS, so the site version before it keeps
-- working. The old pieces are removed by 0005 after the deploy.
-- Paste into Supabase → SQL Editor → Run.
-- =============================================================

create type public.sport as enum ('football', 'basketball', 'tennis', 'darts');

-- ---------- Predictions ----------
create table public.predictions (
  id          uuid primary key default gen_random_uuid(),
  sport       public.sport not null,
  competition text check (char_length(competition) <= 120),
  event       text not null check (char_length(event) <= 160),
  kickoff_at  timestamptz,
  market      text not null check (char_length(market) <= 80),
  pick        text not null check (char_length(pick) <= 80),
  odds        numeric(8, 2) not null check (odds >= 1),
  confidence  int not null check (confidence between 0 and 100),
  notes_en    text check (char_length(notes_en) <= 4000),
  notes_ar    text check (char_length(notes_ar) <= 4000),
  status      public.slip_status not null default 'pending',
  publish_at  timestamptz not null default now(),
  settled_at  timestamptz,
  created_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now()
);
create index on public.predictions (sport, publish_at desc);
alter table public.predictions enable row level security;

-- Same settled_at stamping as slips.
create trigger predictions_before_update
  before update on public.predictions
  for each row execute function public.slips_before_update();

create or replace function public.audit_predictions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (
    auth.uid(),
    lower(tg_op),
    'prediction',
    coalesce(new.id, old.id)::text,
    case when tg_op = 'UPDATE' then jsonb_build_object('status', new.status) else null end
  );
  return coalesce(new, old);
end;
$$;
create trigger audit_predictions
  after insert or update or delete on public.predictions
  for each row execute function public.audit_predictions();

-- ---------- Plans per sport ----------
-- A sport plan is tier 'regular' with a sport; VIP plans have no sport.
-- Old Regular plans (no sport) are switched off here and deleted by 0005.
alter table public.plans add column if not exists sport public.sport;
alter table public.plans drop constraint if exists plans_tier_duration_key;
alter table public.plans add constraint plans_tier_duration_sport_key unique nulls not distinct (tier, duration, sport);
alter table public.plans add constraint plans_vip_has_no_sport check (tier = 'regular' or sport is null);
update public.plans set active = false where tier = 'regular' and sport is null;

-- Placeholder prices (USD); change them in Admin → Settings.
insert into public.plans (tier, duration, price_usd, sport)
select 'regular', d.duration, d.price, s.sport
from (values ('week'::public.plan_duration, 3), ('month', 9), ('quarter', 24), ('year', 79)) as d (duration, price)
cross join unnest(enum_range(null::public.sport)) as s (sport)
on conflict (tier, duration, sport) do nothing;

alter table public.subscriptions add column if not exists sport public.sport;

-- Plans stack on top of remaining time of the same plan (same tier and sport).
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
  where user_id = p_user and tier = pl.tier and sport is not distinct from pl.sport and not revoked and ends_at > now();

  insert into public.subscriptions (user_id, plan_id, payment_id, tier, sport, starts_at, ends_at)
  values (p_user, pl.id, p_payment, pl.tier, pl.sport, start_at, start_at + public.plan_interval(pl.duration))
  returning * into sub;

  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'grant_plan', 'subscription', sub.id::text,
          jsonb_build_object('user', p_user, 'plan', p_plan, 'payment', p_payment));
  return sub;
end;
$$;

-- ---------- Slips sold one by one ----------
alter table public.slips add column if not exists price_usd numeric(10, 2) not null default 3 check (price_usd >= 0);

-- Buying a slip closes when its first game starts (slips with no kick-off times stay on sale until settled).
create or replace function public.slip_first_kickoff(p_slip uuid)
returns timestamptz language sql stable security definer set search_path = public as $$
  select min(kickoff_at) from public.slip_legs where slip_id = p_slip;
$$;

create table public.slip_unlocks (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  slip_id     uuid not null references public.slips (id) on delete cascade,
  payment_id  uuid references public.payments (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (user_id, slip_id)
);
create index on public.slip_unlocks (slip_id);
alter table public.slip_unlocks enable row level security;
-- Read your own; rows are written only by approve_payment() and the welcome gift (service role).
create policy unlocks_select on public.slip_unlocks for select
  using (user_id = auth.uid() or public.is_admin());

-- A payment buys either a plan or one slip.
alter table public.payments alter column plan_id drop not null;
alter table public.payments add column if not exists slip_id uuid references public.slips (id) on delete set null;
alter table public.payments add constraint payments_plan_or_slip check (plan_id is null or slip_id is null);

-- ---------- Who can see what ----------
create or replace function public.user_has_vip(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    join public.profiles p on p.id = s.user_id
    where s.user_id = p_user and s.tier = 'vip' and not s.revoked and not p.banned
      and now() >= s.starts_at and now() < s.ends_at);
$$;

create or replace function public.has_vip()
returns boolean language sql stable security definer set search_path = public as $$
  select public.user_has_vip(auth.uid()) and public.session_is_current();
$$;

-- VIP, or an active plan for this sport.
create or replace function public.has_sport(p_sport public.sport)
returns boolean language sql stable security definer set search_path = public as $$
  select public.session_is_current() and exists (
    select 1 from public.subscriptions s
    join public.profiles p on p.id = s.user_id
    where s.user_id = auth.uid() and not s.revoked and not p.banned
      and now() >= s.starts_at and now() < s.ends_at
      and (s.tier = 'vip' or s.sport = p_sport));
$$;

create or replace function public.can_view_prediction(p_sport public.sport, p_status public.slip_status, p_publish_at timestamptz)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if public.is_admin() then
    return true;
  end if;
  if p_publish_at > now() then
    return false;                       -- scheduled, not yet published
  end if;
  if p_status <> 'pending' then
    return true;                        -- settled predictions form the public track record
  end if;
  return public.has_sport(p_sport);
end;
$$;

create or replace function public.can_view_slip_v2(p_slip uuid, p_status public.slip_status, p_publish_at timestamptz)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if public.is_admin() then
    return true;
  end if;
  if p_publish_at > now() then
    return false;
  end if;
  if p_status <> 'pending' then
    return true;
  end if;
  if public.has_vip() then
    return true;
  end if;
  return public.session_is_current() and exists (
    select 1 from public.slip_unlocks u
    join public.profiles p on p.id = u.user_id
    where u.user_id = auth.uid() and u.slip_id = p_slip and not p.banned);
end;
$$;

-- What the current login can open: {"vip": bool, "sports": [...]}.
create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'vip', public.has_vip(),
    'sports', coalesce((
      select jsonb_agg(distinct s.sport)
      from public.subscriptions s
      join public.profiles p on p.id = s.user_id
      where s.user_id = auth.uid() and s.sport is not null and not s.revoked and not p.banned
        and now() >= s.starts_at and now() < s.ends_at
        and public.session_is_current()
    ), '[]'::jsonb));
$$;

-- Locked view of a sport: only how many open predictions there are.
create or replace function public.prediction_counts()
returns table (sport public.sport, open int)
language sql stable security definer set search_path = public as $$
  select p.sport, count(*)::int
  from public.predictions p
  where p.status = 'pending' and p.publish_at <= now()
  group by p.sport;
$$;

-- Locked previews of open slips: no picks, no confidence. Columns only grow here, so the previous site version keeps working.
drop function if exists public.slip_teasers();
create function public.slip_teasers()
returns table (id uuid, tier public.tier, legs int, total_odds numeric, price_usd numeric, first_kickoff timestamptz, publish_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.tier, (select count(*)::int from public.slip_legs l where l.slip_id = s.id), s.total_odds, s.price_usd,
         public.slip_first_kickoff(s.id), s.publish_at
  from public.slips s
  where s.status = 'pending' and s.publish_at <= now()
  order by s.publish_at desc
  limit 50;
$$;

-- ---------- Payments for plans and slips ----------
create or replace function public.payments_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pending_count int;
  s public.slips;
begin
  select count(*) into pending_count from public.payments
  where user_id = new.user_id and status = 'pending';
  if pending_count >= 3 then
    raise exception 'Too many pending payments. Please wait for review.';
  end if;
  if (new.plan_id is null) = (new.slip_id is null) then
    raise exception 'Choose a plan or a slip';
  end if;

  if new.plan_id is not null then
    select price_usd into new.amount_usd from public.plans where id = new.plan_id and active;
    if new.amount_usd is null then
      raise exception 'Plan not available';
    end if;
  else
    select * into s from public.slips where id = new.slip_id;
    if s.id is null or s.status <> 'pending' or s.publish_at > now() then
      raise exception 'Slip not available';
    end if;
    if coalesce(public.slip_first_kickoff(s.id) <= now(), false) then
      raise exception 'Slip already started';
    end if;
    if public.user_has_vip(new.user_id)
       or exists (select 1 from public.slip_unlocks where user_id = new.user_id and slip_id = s.id) then
      raise exception 'Slip already unlocked';
    end if;
    if exists (select 1 from public.payments where user_id = new.user_id and slip_id = s.id and status = 'pending') then
      raise exception 'Slip payment already pending';
    end if;
    new.amount_usd := s.price_usd;
  end if;

  new.status := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.admin_note := null;
  return new;
end;
$$;

-- Approving a slip payment unlocks that slip; approving a plan payment grants the plan.
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
  if pay.slip_id is not null then
    insert into public.slip_unlocks (user_id, slip_id, payment_id)
    values (pay.user_id, pay.slip_id, pay.id)
    on conflict (user_id, slip_id) do nothing;
    insert into public.audit_log (actor, action, entity, entity_id, details)
    values (auth.uid(), 'unlock_slip', 'slip', pay.slip_id::text, jsonb_build_object('user', pay.user_id, 'payment', pay.id));
    return null;
  end if;
  return public.grant_plan(pay.user_id, pay.plan_id, pay.id);
end;
$$;

-- ---------- Row-level security ----------
create policy predictions_select on public.predictions for select
  using (public.can_view_prediction(sport, status, publish_at));
create policy predictions_admin on public.predictions for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists slips_select on public.slips;
create policy slips_select on public.slips for select
  using (public.can_view_slip_v2(id, status, publish_at));

drop policy if exists legs_select on public.slip_legs;
create policy legs_select on public.slip_legs for select
  using (exists (
    select 1 from public.slips s
    where s.id = slip_id and public.can_view_slip_v2(s.id, s.status, s.publish_at)));

drop policy if exists slip_images_read on storage.objects;
create policy slip_images_read on storage.objects for select
  using (bucket_id = 'slip-images' and exists (
    select 1 from public.slips s
    where s.image_path = name and public.can_view_slip_v2(s.id, s.status, s.publish_at)));

-- ---------- Function access ----------
revoke execute on function public.user_has_vip(uuid) from anon, authenticated, public;
revoke execute on function public.audit_predictions() from anon, authenticated, public;
revoke execute on function public.has_vip() from anon, public;
revoke execute on function public.has_sport(public.sport) from anon, public;
revoke execute on function public.my_access() from anon, public;
grant execute on function public.has_vip() to authenticated;
grant execute on function public.has_sport(public.sport) to authenticated;
grant execute on function public.my_access() to authenticated;
grant execute on function public.can_view_prediction(public.sport, public.slip_status, timestamptz) to anon, authenticated;
grant execute on function public.can_view_slip_v2(uuid, public.slip_status, timestamptz) to anon, authenticated;
grant execute on function public.prediction_counts() to anon, authenticated;
grant execute on function public.slip_teasers() to anon, authenticated;
grant execute on function public.slip_first_kickoff(uuid) to anon, authenticated;
