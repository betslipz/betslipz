-- =============================================================
-- Slips no longer carry a bookmaker booking code.
-- Run only AFTER the site version without booking codes is live:
-- the older version still reads this column.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.
-- =============================================================

alter table public.slips drop column if exists betarabia_code;
