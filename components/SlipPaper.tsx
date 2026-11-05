import type { ReactNode } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { SlipLeg, SlipStatus } from "@/lib/types";
import { fmtDate, fmtOdds } from "@/lib/format";
import type { TeamLookup } from "@/lib/team-images";
import TeamBadge from "./TeamBadge";

// The ticket itself, laid out like a sportsbook bet slip: status banner, one row per pick, totals table.
// Shared by slip cards and the blurred home teaser, so both look the same.

type Leg = Pick<SlipLeg, "event" | "market" | "pick" | "odds" | "kickoff_at" | "result">;

// Markets whose pick reads fine on its own ("1X", "Over 2.5", a team name); others get the market in front.
const SELF_EXPLANATORY = ["1X2", "Double chance", "Over/Under"];

const ink: Record<SlipStatus, string> = {
  pending: "text-slip-ink",
  won: "text-slip-win",
  lost: "text-slip-loss",
  void: "text-slip-ink/50",
  partial: "text-slip-amber",
};
const banner: Record<SlipStatus, string> = {
  pending: "border-slip-line bg-slip-row text-slip-ink",
  won: "border-slip-win/50 bg-slip-win/10 text-slip-win",
  lost: "border-slip-loss/50 bg-slip-loss/10 text-slip-loss",
  void: "border-slip-line bg-slip-row text-slip-ink/60",
  partial: "border-slip-gold/60 bg-slip-gold/10 text-slip-amber",
};
const icon: Record<SlipStatus, string> = { pending: "⏳", won: "✓", lost: "✕", void: "—", partial: "½" };

export default function SlipPaper({
  status,
  legs,
  publishAt,
  totalOdds,
  stakeUnits,
  locale,
  t,
  children,
  teams,
}: {
  status: SlipStatus;
  legs: Leg[];
  publishAt: string;
  totalOdds: number;
  stakeUnits: number;
  locale: Locale;
  t: Dictionary["common"];
  children?: ReactNode; // shown instead of the pick rows, e.g. an uploaded screenshot
  teams?: TeamLookup; // crests/flags next to team names
}) {
  const units = (n: number) => `${Number(n.toFixed(2))} ${n === 1 ? t.unit : t.units}`;
  const rows = [
    { label: t.totalOdds, value: fmtOdds(totalOdds) },
    { label: t.stake, value: units(Number(stakeUnits)) },
    { label: status === "won" ? t.returned : t.potentialReturn, value: units(Number(stakeUnits) * Number(totalOdds)) },
  ];

  return (
    <div className="space-y-3 bg-slip-paper p-3 text-slip-ink">
      <p className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-lg font-bold ${banner[status]}`}>
        <span aria-hidden>{icon[status]}</span>
        {t[status]}
      </p>

      <div className="overflow-hidden border border-slip-line">
        <div className="flex items-center justify-between gap-3 bg-slip-paper px-3 py-2.5">
          <span className="flex items-center gap-2 font-bold">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-slip-gold text-xs text-white" aria-hidden>
              ✓
            </span>
            {legs.length === 0 ? t.betSlip : legs.length === 1 ? t.single : t.multibet}
          </span>
          <span className="text-sm font-bold">
            {fmtDate(publishAt, locale)}
          </span>
        </div>
        {children ?? (
          <ul className="divide-y divide-slip-line border-t border-slip-line bg-slip-row">
            {legs.map((leg, i) => (
              <li key={i} className={`space-y-0.5 px-3 py-2 text-sm font-semibold ${ink[leg.result]}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0" dir="auto">{SELF_EXPLANATORY.includes(leg.market) ? leg.pick : `${leg.market}: ${leg.pick}`}</span>
                  <span dir="ltr">{fmtOdds(leg.odds)}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  {teams ? (
                    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      {leg.event.split(/\s+vs\.?\s+/i).map((name, j) => (
                        <span key={j} className="flex items-center gap-1">
                          {j > 0 && <span className="text-slip-ink/50">-</span>}
                          <TeamBadge team={teams(name)} name={name} size={16} />
                          <span dir="auto">{name}</span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="min-w-0" dir="auto">
                      {leg.event.replace(/\s+vs\.?\s+/i, " - ")}
                    </span>
                  )}
                  {leg.kickoff_at && (
                    <span className="shrink-0">
                      {fmtDate(leg.kickoff_at, locale)}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span>{t.result}</span>
                  <span>{leg.result === "pending" ? "—" : `${icon[leg.result]} ${t[leg.result]}`}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="divide-y divide-slip-line border border-slip-line text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2.5 font-bold">
            <dt>{r.label}:</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
