import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { PeriodTally, Tally, TrackRecord } from "@/lib/stats";
import { addDays, daysInMonth } from "@/lib/stats";
import { fmtDay, fmtOdds } from "@/lib/format";

type T = Dictionary["stats"];

// Green from 60%, amber from 40%, red below. Days with only voids stay neutral.
export function tone(rate: number | null) {
  if (rate === null) return { cell: "border-border bg-surface", text: "text-muted", bar: "bg-muted" };
  if (rate >= 60) return { cell: "border-accent/40 bg-accent/15", text: "text-accent", bar: "bg-accent" };
  if (rate >= 40) return { cell: "border-warning/40 bg-warning/10", text: "text-warning", bar: "bg-warning" };
  return { cell: "border-danger/40 bg-danger/10", text: "text-danger", bar: "bg-danger" };
}

const fraction = (t: Tally) => `${t.won}/${t.total}`;
const pct = (t: Tally) => (t.rate === null ? "—" : `${t.rate}%`);

type Insight = { emoji: string; top: string; value: string; bottom: string; rate?: number | null; vip?: boolean };

// Catchy headline cards. `limit` keeps the home page to the strongest few.
export function InsightCards({ record, locale, t, limit }: { record: TrackRecord; locale: Locale; t: T; limit?: number }) {
  const r = record;
  const cards: Insight[] = [];
  if (r.lastDay) {
    const top = r.lastDay.day === r.today ? t.today : r.lastDay.day === r.yesterday ? t.yesterday : fmtDay(r.lastDay.day, locale);
    cards.push({ emoji: "🔥", top, value: fraction(r.lastDay), bottom: `${t.slipsWon} · ${pct(r.lastDay)}`, rate: r.lastDay.rate });
  }
  if (r.last30.total) {
    cards.push({
      emoji: "📈",
      top: t.last30,
      value: pct(r.last30),
      bottom: t.wonOf.replace("{won}", String(r.last30.won)).replace("{total}", String(r.last30.total)),
      rate: r.last30.rate,
    });
  }
  if (r.streak >= 2) cards.push({ emoji: "⚡", top: t.streakTop, value: String(r.streak), bottom: t.streakBottom, rate: 100 });
  else if (r.bestStreak >= 2) cards.push({ emoji: "⚡", top: t.bestStreakTop, value: String(r.bestStreak), bottom: t.streakBottom, rate: 100 });
  if (r.biggestOdds) cards.push({ emoji: "💰", top: t.biggestTop, value: `@${fmtOdds(r.biggestOdds)}`, bottom: t.biggestBottom, vip: true });
  if (r.perfectDays) cards.push({ emoji: "✅", top: t.perfectTop, value: String(r.perfectDays), bottom: t.perfectBottom, rate: 100 });
  if (r.bestWeek) {
    const range = `${fmtDay(r.bestWeek.start, locale)} – ${fmtDay(r.bestWeek.end, locale)}`;
    cards.push({ emoji: "🏆", top: t.bestWeekTop, value: fraction(r.bestWeek), bottom: `${range} · ${pct(r.bestWeek)}`, vip: true });
  }
  const shown = limit ? cards.slice(0, limit) : cards;
  if (!shown.length) return <p className="card p-6 text-center text-muted">{t.noRecord}</p>;

  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${limit ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {shown.map((c) => {
        const color = c.vip ? "text-vip" : tone(c.rate ?? null).text;
        return (
          <div key={c.top} className={`card relative overflow-hidden p-4 sm:p-5 ${c.vip ? "border-vip/40" : ""}`}>
            <span className="pointer-events-none absolute -end-3 -top-4 text-7xl opacity-15 select-none" aria-hidden>
              {c.emoji}
            </span>
            <p className="text-sm font-semibold text-muted">
              <span aria-hidden>{c.emoji}</span> {c.top}
            </p>
            <p className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${color}`} dir="ltr">
              {c.value}
            </p>
            <p className="mt-1 text-sm text-muted">{c.bottom}</p>
          </div>
        );
      })}
    </div>
  );
}

// Home page: the last 7 days as a row of small result tiles.
export function WeekStrip({ record, locale, t }: { record: TrackRecord; locale: Locale; t: T }) {
  const keys = Array.from({ length: 7 }, (_, i) => addDays(record.today, i - 6));
  return (
    <div className="grid grid-cols-7 gap-2">
      {keys.map((k) => {
        const d = record.days.get(k);
        const c = tone(d && d.total ? d.rate : null);
        return (
          <Link key={k} href={`/${locale}/results?month=${k.slice(0, 7)}&day=${k}#slips`} className={`rounded-xl border p-2 text-center transition hover:brightness-125 ${c.cell}`}>
            <p className="text-[11px] text-muted">{fmtDay(k, locale, { weekday: "short" })}</p>
            <p className={`text-base font-black sm:text-lg ${c.text}`} dir="ltr">
              {d?.total ? fraction(d) : d?.open ? "⏳" : "–"}
            </p>
            <p className="hidden text-[11px] text-muted sm:block" dir="ltr">
              {d?.total ? pct(d) : k === record.today ? t.today : " "}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

// Month grid, Monday first. Each day shows slips won out of settled; settled days link to their slips.
export function WinCalendar({
  record,
  month,
  locale,
  t,
  href,
  selected,
}: {
  record: TrackRecord;
  month: string;
  locale: Locale;
  t: T;
  href: (q: { month?: string; day?: string }) => string;
  selected?: string;
}) {
  const first = `${month}-01`;
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const count = daysInMonth(month);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => addDays(first, i))] as (string | null)[];
  const weekdays = Array.from({ length: 7 }, (_, i) => fmtDay(addDays("2024-01-01", i), locale, { weekday: "short" })); // 2024-01-01 is a Monday
  const total = record.sum(first, addDays(first, count - 1));
  const [y, m] = month.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  const hasNext = next <= record.today.slice(0, 7);

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={href({ month: prev })} className="btn btn-ghost px-3 py-1.5" aria-label={t.prevMonth}>
            <span className="inline-block rtl:rotate-180">‹</span>
          </Link>
          <h3 className="min-w-40 text-center text-xl font-black">{fmtDay(first, locale, { month: "long", year: "numeric" })}</h3>
          {hasNext ? (
            <Link href={href({ month: next })} className="btn btn-ghost px-3 py-1.5" aria-label={t.nextMonth}>
              <span className="inline-block rtl:rotate-180">›</span>
            </Link>
          ) : (
            <span className="btn btn-ghost pointer-events-none px-3 py-1.5 opacity-30" aria-hidden>
              <span className="inline-block rtl:rotate-180">›</span>
            </span>
          )}
        </div>
        {total.total > 0 && (
          <p className="text-sm text-muted">
            <b className={tone(total.rate).text} dir="ltr">
              {fraction(total)}
            </b>{" "}
            {t.slipsWon} · <b className={tone(total.rate).text}>{pct(total)}</b>
          </p>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekdays.map((w) => (
          <p key={w} className="truncate pb-1 text-center text-[10px] font-semibold text-muted sm:text-xs">
            {w}
          </p>
        ))}
        {cells.map((k, i) => {
          if (!k) return <span key={`pad-${i}`} />;
          const d = record.days.get(k);
          const settled = !!d && d.total + d.voids > 0;
          const c = tone(d && d.total ? d.rate : null);
          const future = k > record.today;
          const body = (
            <>
              <span className="text-[11px] font-semibold text-muted sm:text-xs" dir="ltr">
                {Number(k.slice(8))}
              </span>
              {d?.total ? (
                <>
                  <span className={`text-base font-black leading-none sm:text-2xl ${c.text}`} dir="ltr">
                    {fraction(d)}
                  </span>
                  <span className={`hidden text-xs font-bold sm:block ${c.text}`} dir="ltr">
                    {pct(d)}
                  </span>
                </>
              ) : d?.voids ? (
                <span className="text-[11px] text-muted">{t.voidOnly}</span>
              ) : null}
              {!!d?.open && (
                <span className="text-[10px] text-muted sm:text-xs" title={t.open.replace("{n}", String(d.open))}>
                  ⏳<span className="hidden sm:inline"> {t.open.replace("{n}", String(d.open))}</span>
                </span>
              )}
            </>
          );
          const cls = `flex flex-col items-center justify-center gap-0.5 rounded-xl border p-1 min-h-16 sm:min-h-22 ${c.cell} ${
            k === record.today ? "ring-2 ring-accent/60" : ""
          } ${k === selected ? "outline outline-2 outline-offset-2 outline-text" : ""} ${future ? "opacity-40" : ""}`;
          return settled ? (
            <Link key={k} href={href({ month, day: k }) + "#slips"} className={`${cls} transition hover:brightness-125`}>
              {body}
            </Link>
          ) : (
            <div key={k} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        {[
          { rate: 80, label: "60%+" },
          { rate: 50, label: "40–59%" },
          { rate: 0, label: "< 40%" },
        ].map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded border ${tone(l.rate).cell}`} /> <span dir="ltr">{l.label}</span>
          </span>
        ))}
        <span>{t.calendarHint}</span>
      </div>
    </div>
  );
}

// Today / this week / this month / last 30 days at a glance.
export function TallyCards({ record, t }: { record: TrackRecord; t: T }) {
  const items = [
    { label: t.today, tally: record.todayTally },
    { label: t.thisWeek, tally: record.thisWeek },
    { label: t.thisMonth, tally: record.thisMonth },
    { label: t.last30, tally: record.last30 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, tally }) => {
        const c = tone(tally.total ? tally.rate : null);
        return (
          <div key={label} className="card p-4">
            <p className="text-sm text-muted">{label}</p>
            <div className="mt-1 flex items-baseline justify-between gap-2" dir="ltr">
              <span className={`text-3xl font-black ${c.text}`}>{tally.total ? fraction(tally) : "—"}</span>
              <span className={`text-lg font-bold ${c.text}`}>{pct(tally)}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${tally.rate ?? 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Daily, weekly or monthly rows: period, progress bar, won/settled and win %.
export function PeriodTotals({
  rows,
  view,
  locale,
  t,
  href,
}: {
  rows: PeriodTally[];
  view: "day" | "week" | "month";
  locale: Locale;
  t: T;
  href: (q: { view: "day" | "week" | "month" }) => string;
}) {
  const label = (p: PeriodTally) =>
    view === "day"
      ? fmtDay(p.key, locale, { weekday: "short", day: "numeric", month: "short" })
      : view === "week"
        ? `${fmtDay(p.start, locale)} – ${fmtDay(p.end, locale)}`
        : fmtDay(p.start, locale, { month: "long", year: "numeric" });
  const tabs = [
    { key: "day", label: t.daily },
    { key: "week", label: t.weekly },
    { key: "month", label: t.monthly },
  ] as const;

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-black">{t.totalsTitle}</h3>
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={href({ view: tab.key }) + "#totals"}
              scroll={false}
              role="tab"
              aria-selected={view === tab.key}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${view === tab.key ? "bg-accent text-[#04130a]" : "text-muted hover:text-text"}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((p) => {
          const c = tone(p.total ? p.rate : null);
          return (
            <li key={p.key} className="grid grid-cols-[minmax(7rem,12rem)_1fr_auto] items-center gap-3 py-2.5 text-sm sm:gap-5">
              <span className="truncate font-semibold">{label(p)}</span>
              <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                <span className={`block h-full rounded-full ${c.bar}`} style={{ width: `${p.rate ?? 0}%` }} />
              </span>
              <span className="flex w-28 items-baseline justify-end gap-3 sm:w-36" dir="ltr">
                {p.total ? (
                  <>
                    <b className={c.text}>{fraction(p)}</b>
                    <b className={`w-11 text-end ${c.text}`}>{pct(p)}</b>
                  </>
                ) : (
                  <span className="text-muted">{t.noSlips}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
