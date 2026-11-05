-- =============================================================
-- Remembers which plans already got their "your plan ends soon"
-- email, so the daily reminder job sends it only once.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.
-- =============================================================

alter table public.subscriptions add column if not exists reminder_sent_at timestamptz;

-- The daily job looks for plans ending soon that haven't been reminded.
create index if not exists subscriptions_reminder_due on public.subscriptions (ends_at) where reminder_sent_at is null and not revoked;
