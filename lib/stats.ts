import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SlipStatus } from "@/lib/types";
import { isSport, type Sport } from "@/lib/sports";
import type { Dictionary } from "@/lib/i18n/en";

// Track record by day, week and month, for slips or for predictions (all sports or one).
// A slip or prediction counts on the day it was posted (Beirut time).
// "Won" means fully won; partly won and lost count against, voids are left out of the win rate.

export const STATS_TIMEZONE = "Asia/Beirut";

export type StatsSource = "slips" | "predictions" | Sport;
export const isStatsSource = (v: unknown): v is StatsSource => v === "slips" || v === "predictions" || isSport(v);

// The stats texts talk about slips; predictions get the same sentences about picks.
export const statsText = (t: Dictionary, source: StatsSource): Dictionary["stats"] => (source === "slips" ? t.stats : { ...t.stats, ...t.statsPicks });

export type Tally = { won: number; total: number; voids: number; rate: number | null };
export type DayTally = Tally & { day: string; open: number };
export type PeriodTally = Tally & { key: string; start: string; end: string };

type Row = { status: SlipStatus; publish_at: string; settled_at: string | null; total_odds: number };

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: STATS_TIMEZONE });
export const dayKey = (d: Date | string) => dayFmt.format(typeof d === "string" ? new Date(d) : d);

// Day keys are plain YYYY-MM-DD strings; date maths on them runs in UTC so time zones can't shift a day.
const toUtc = (key: string) => new Date(`${key}T00:00:00Z`);
export const addDays = (key: string, n: number) => {
  const d = toUtc(key);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const weekStart = (key: string) => addDays(key, -((toUtc(key).getUTCDay() + 6) % 7)); // Monday
export const monthKey = (key: string) => key.slice(0, 7);
export const daysInMonth = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
export const addMonths = (month: string, n: number) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};

const empty = (): Tally => ({ won: 0, total: 0, voids: 0, rate: null });
function add(t: Tally, status: SlipStatus) {
  if (status === "void") t.voids++;
  else {
    t.total++;
    if (status === "won") t.won++;
  }
  t.rate = t.total ? Math.round((t.won / t.total) * 100) : null;
}

export type TrackRecord = Awaited<ReturnType<typeof trackRecord>>;

export async function trackRecord(source: StatsSource = "predictions") {
  const supabase = await createClient();
  const since = new Date(Date.now() - 400 * 86400_000).toISOString();
  const slips = source === "slips";
  // RLS lets everyone read settled slips and predictions; open ones only come through as counts.
  let settled = supabase
    .from(slips ? "slips" : "predictions")
    .select(slips ? "status, publish_at, settled_at, total_odds" : "status, publish_at, settled_at, total_odds:odds")
    .neq("status", "pending")
    .gte("publish_at", since)
    .order("publish_at", { ascending: false })
    .limit(5000);
  if (isSport(source)) settled = settled.eq("sport", source);
  const [{ data }, { data: open }] = await Promise.all([settled, supabase.rpc(slips ? "slip_teasers" : "prediction_counts")]);
  const rows = (data ?? []) as unknown as Row[];
  const today = dayKey(new Date());

  const days = new Map<string, DayTally>();
  const day = (key: string) => {
    let d = days.get(key);
    if (!d) days.set(key, (d = { ...empty(), day: key, open: 0 }));
    return d;
  };
  for (const r of rows) add(day(dayKey(r.publish_at)), r.status);
  if (slips) for (const t of (open ?? []) as { publish_at: string }[]) day(dayKey(t.publish_at)).open++;
  // Open predictions are only counted per sport, so they all show on today.
  else for (const c of (open ?? []) as { sport: Sport; open: number }[]) if (source === "predictions" || c.sport === source) day(today).open += c.open;

  const sum = (from: string, to: string): Tally => {
    const t = empty();
    for (const r of rows) {
      const k = dayKey(r.publish_at);
      if (k >= from && k <= to) add(t, r.status);
    }
    return t;
  };

  const weeks = (n: number): PeriodTally[] =>
    Array.from({ length: n }, (_, i) => {
      const start = addDays(weekStart(today), -7 * i);
      const end = addDays(start, 6);
      return { ...sum(start, end), key: start, start, end };
    });
  const months = (n: number): PeriodTally[] =>
    Array.from({ length: n }, (_, i) => {
      const m = addMonths(monthKey(today), -i);
      const start = `${m}-01`;
      const end = `${m}-${String(daysInMonth(m)).padStart(2, "0")}`;
      return { ...sum(start, end), key: m, start, end };
    });
  const dailyList = (n: number): PeriodTally[] =>
    Array.from({ length: n }, (_, i) => {
      const k = addDays(today, -i);
      return { ...sum(k, k), key: k, start: k, end: k };
    });

  // Insights for the catchy cards.
  const decided = rows.filter((r) => r.status !== "void").sort((a, b) => (b.settled_at ?? "").localeCompare(a.settled_at ?? ""));
  let streak = 0;
  while (streak < decided.length && decided[streak].status === "won") streak++;
  let bestStreak = 0;
  for (let i = 0, run = 0; i < decided.length; i++) bestStreak = Math.max(bestStreak, (run = decided[i].status === "won" ? run + 1 : 0));

  const last30 = sum(addDays(today, -29), today);
  const lastDay = [...days.values()].filter((d) => d.total > 0).sort((a, b) => b.day.localeCompare(a.day))[0] ?? null;
  const perfectDays = [...days.values()].filter((d) => d.day >= addDays(today, -29) && d.total > 0 && d.won === d.total).length;
  const wins = rows.filter((r) => r.status === "won");
  const biggestOdds = wins.length ? Math.max(...wins.map((r) => Number(r.total_odds))) : null;
  const avgOddsWon = wins.length ? wins.reduce((s, r) => s + Number(r.total_odds), 0) / wins.length : null;
  const bestWeek = weeks(12)
    .filter((w) => w.total >= 3)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || b.won - a.won)[0] ?? null;

  return {
    today,
    yesterday: addDays(today, -1),
    days,
    sum,
    weeks,
    months,
    dailyList,
    thisWeek: sum(weekStart(today), today),
    thisMonth: sum(`${monthKey(today)}-01`, today),
    todayTally: day(today),
    last30,
    lastDay,
    streak,
    bestStreak,
    perfectDays,
    biggestOdds,
    avgOddsWon,
    bestWeek,
  };
}
