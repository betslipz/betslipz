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
