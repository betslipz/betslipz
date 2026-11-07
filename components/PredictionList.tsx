import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Prediction, SlipStatus } from "@/lib/types";
import { sportEmoji } from "@/lib/sports";
import { addDays, dayKey } from "@/lib/stats";
import { fmtDay, fmtOdds } from "@/lib/format";
import { confidenceColor } from "./ConfidenceMeter";
import TeamBadge from "./TeamBadge";
import { teamLookup } from "@/lib/teams";
import type { TeamLookup } from "@/lib/team-images";

// Predictions as a table: one row per game (time · teams · tip · odds · confidence), grouped by day.
// Rows with analysis open on tap to show it.

// Phones: narrow time, tip, odds and trust columns so the team names keep most of the width.
const COLS =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,4.75rem)_2.5rem_2.5rem] items-center gap-x-1.5 sm:grid-cols-[3.5rem_minmax(0,1fr)_minmax(6rem,11rem)_4rem_5rem] sm:gap-x-4";

const resultStyle: Record<SlipStatus, { row: string; tip: string; icon: string }> = {
  pending: { row: "border-border", tip: "text-text", icon: "" },
  won: { row: "border-accent/60", tip: "text-accent", icon: "✓ " },
  lost: { row: "border-danger/60", tip: "text-danger", icon: "✕ " },
  void: { row: "border-border", tip: "text-muted line-through", icon: "— " },
  partial: { row: "border-warning/60", tip: "text-warning", icon: "½ " },
};

const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Beirut" });

export default async function PredictionList({
  predictions,
  locale,
  t,
  showSport = false,
}: {
  predictions: Prediction[];
  locale: Locale;
  t: Dictionary;
  /** Mixed sports (Results → All predictions): show each game's sport. */
  showSport?: boolean;
}) {
  const today = dayKey(new Date());
  const teams = await teamLookup();
  const dayLabel = (key: string) =>
    key === today
      ? t.stats.today
      : key === addDays(today, 1)
        ? t.predictions.tomorrow
        : key === addDays(today, -1)
          ? t.stats.yesterday
          : fmtDay(key, locale, { weekday: "long", day: "numeric", month: "short" });

  // One group per day, in the order the days first appear (upcoming soonest first, results newest first).
  const byDay = new Map<string, Prediction[]>();
  for (const p of predictions) {
    const key = dayKey(p.kickoff_at ?? p.publish_at);
    byDay.set(key, [...(byDay.get(key) ?? []), p]);
  }
  const groups = [...byDay].map(([key, rows]) => ({ key, rows }));

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="mb-2 text-sm font-bold text-muted">{dayLabel(g.key)}</h3>
          <div className={`${COLS} px-2.5 pb-1.5 text-[11px] font-semibold text-muted sm:px-3 sm:text-xs`} aria-hidden>
            <span>{t.predictions.colTime}</span>
            <span>{t.predictions.colMatch}</span>
            <span>{t.predictions.colTip}</span>
            <span className="text-center">{t.predictions.colOdds}</span>
            <span className="text-center">{t.predictions.colTrust}</span>
          </div>
          <ul className="space-y-3">
            {g.rows.map((p) => (
              <Row key={p.id} p={p} locale={locale} t={t} showSport={showSport} teams={teams} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ p, locale, t, showSport, teams }: { p: Prediction; locale: Locale; t: Dictionary; showSport: boolean; teams: TeamLookup }) {
  const [home, ...rest] = p.event.split(/\s+vs\.?\s+/i);
  const away = rest.join(" vs ");
  const notes = (locale === "ar" && p.notes_ar) || p.notes_en;
  const style = resultStyle[p.status];
  const color = confidenceColor(p.confidence);

  const line = (
    <>
      <span className="text-xs font-bold tabular-nums text-accent sm:text-sm" dir="ltr">
        {p.kickoff_at ? timeFmt.format(new Date(p.kickoff_at)) : "—"}
      </span>
      <span className="min-w-0">
        {[home, away].filter(Boolean).map((name, i) => (
          <span key={name}>
            {i > 0 && <span className="block ps-[1.625rem] text-[10px] font-bold leading-none text-muted">vs</span>}
            <span className="flex min-w-0 items-center gap-1.5 py-px">
              <TeamBadge team={teams(name, p.sport)} name={name} size={18} />
              <span className="truncate text-sm font-semibold leading-snug sm:text-base" dir="auto">
                {name}
              </span>
            </span>
          </span>
        ))}
      </span>
      <span className="min-w-0">
        <b className={`block break-words text-sm leading-snug sm:text-base ${style.tip}`} dir="auto">
          {style.icon}
          {p.pick}
        </b>
        <span className="block truncate text-[11px] text-muted" dir="auto">
          {p.market}
          {notes && <span aria-hidden> · ⓘ</span>}
        </span>
      </span>
      <b className="text-center text-sm tabular-nums sm:text-base" dir="ltr">
        {fmtOdds(p.odds)}
      </b>
      <span className="flex flex-col items-center gap-1">
        <b className="text-sm tabular-nums sm:text-base" style={{ color }} dir="ltr">
          {p.confidence}%
        </b>
        <span className="h-1 w-full max-w-12 overflow-hidden rounded-full bg-border" aria-hidden>
          <span className="block h-full rounded-full" style={{ width: `${p.confidence}%`, background: color }} />
        </span>
      </span>
    </>
  );

  const rowClass = `rounded-xl border bg-surface ${style.row}`;
  return (
    <li>
      {/* League above the game's bubble. */}
      {(showSport || p.competition) && (
        <p className="mb-1 truncate px-1 text-xs font-semibold text-muted" dir="auto">
          {showSport && <span aria-hidden>{sportEmoji(p.sport)} </span>}
          {p.competition || t.live.sports[p.sport]}
        </p>
      )}
      {notes ? (
        <details className={`group ${rowClass}`}>
          <summary className={`${COLS} cursor-pointer list-none px-2.5 py-2.5 sm:px-3 [&::-webkit-details-marker]:hidden`}>{line}</summary>
          <p className="whitespace-pre-line border-t border-border px-3 py-2.5 text-sm text-muted" dir="auto">
            <b className="text-text">{t.common.notes}: </b>
            {notes}
          </p>
        </details>
      ) : (
        <div className={`${COLS} px-2.5 py-2.5 sm:px-3 ${rowClass}`}>{line}</div>
      )}
    </li>
  );
}
