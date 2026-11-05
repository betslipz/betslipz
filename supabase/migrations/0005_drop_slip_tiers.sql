-- =============================================================
-- Removes what the old Regular/VIP slip model left behind.
-- Run only AFTER the site version with predictions by sport is
-- live: the older version still reads these.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.
-- =============================================================

-- Teasers without the slip tier.
drop function if exists public.slip_teasers();
create function public.slip_teasers()
returns table (id uuid, legs int, total_odds numeric, price_usd numeric, first_kickoff timestamptz, publish_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, (select count(*)::int from public.slip_legs l where l.slip_id = s.id), s.total_odds, s.price_usd,
         public.slip_first_kickoff(s.id), s.publish_at
  from public.slips s
  where s.status = 'pending' and s.publish_at <= now()
  order by s.publish_at desc
  limit 50;
$$;
grant execute on function public.slip_teasers() to anon, authenticated;

-- The old paywall rule and the helpers only it used.
drop function if exists public.can_view_slip(public.tier, public.slip_status, timestamptz);
drop function if exists public.current_tier();
drop function if exists public.track_record(int);

alter table public.slips drop column if exists tier;

-- Old Regular plans (no sport) stay switched off; payments and subscriptions from before still point at them.
