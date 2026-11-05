-- =============================================================
-- Teams and players, with a club crest or a country flag, for the
-- admin pickers and for showing next to names on the site.
-- Images live in the public "team-logos" storage bucket.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.
-- =============================================================

create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  sport       public.sport not null,
  name        text not null check (char_length(name) between 1 and 80),
  -- Country flag code as used by flagcdn: ISO 3166-1 alpha-2, or gb-eng / gb-sct / gb-wls / gb-nir.
  country     text check (country ~ '^[a-z]{2}(-[a-z]{3})?$'),
  logo_url    text check (char_length(logo_url) <= 500),
  league      text check (char_length(league) <= 80),
  is_player   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (sport, name)
);
create index if not exists teams_sport_name on public.teams (sport, lower(name));
alter table public.teams enable row level security;

drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select using (true);
drop policy if exists teams_admin on public.teams;
create policy teams_admin on public.teams for all using (public.is_admin()) with check (public.is_admin());

-- Crests and flags: anyone can view them (public bucket); only admins upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-logos', 'team-logos', true, 512000, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists team_logos_admin on storage.objects;
create policy team_logos_admin on storage.objects for all
  using (bucket_id = 'team-logos' and public.is_admin())
  with check (bucket_id = 'team-logos' and public.is_admin());
