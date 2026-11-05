import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import { fmtOdds, fmtUsd } from "@/lib/format";

export type Teaser = { id: string; legs: number; total_odds: number; price_usd: number; first_kickoff: string | null; publish_at: string };

// "closed": its first game has started, so it can't be bought any more.
export type TeaserState = "buy" | "pending" | "closed";

export const teaserState = (teaser: Teaser, pending: boolean): TeaserState =>
  pending ? "pending" : teaser.first_kickoff && new Date(teaser.first_kickoff).getTime() <= Date.now() ? "closed" : "buy";

// What users who haven't bought a slip see: the database never sends them the picks.
export default function LockedSlip({ teaser, state, locale, t }: { teaser: Teaser; state: TeaserState; locale: Locale; t: Dictionary }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border-2 border-slip-navy bg-slip-paper">
      <div className="space-y-3 p-4 opacity-40 blur-[3px] select-none" aria-hidden>
        <div className="h-8 rounded bg-slip-navy" />
        {Array.from({ length: Math.min(teaser.legs || 3, 4) }).map((_, i) => (
          <div key={i} className="flex justify-between rounded bg-slip-row p-3">
            <div className="h-4 w-1/2 rounded bg-slip-line" />
            <div className="h-4 w-10 rounded bg-slip-line" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/70 p-4 text-center">
        <p className="text-sm text-muted">
          {teaser.legs > 0 && (
            <>
              {teaser.legs} {teaser.legs === 1 ? t.common.leg : t.common.legs} ·{" "}
            </>
          )}
          {t.common.totalOdds}{" "}
          <b className="text-text" dir="ltr">
            {fmtOdds(teaser.total_odds)}
          </b>
        </p>
        {state === "buy" ? (
          <>
            <p className="font-semibold">🔒 {t.slips.lockedTitle}</p>
            <Link href={`/${locale}/subscribe?slip=${teaser.id}`} className="btn btn-primary px-5">
              {t.slips.buy.replace("{price}", fmtUsd(teaser.price_usd))}
            </Link>
          </>
        ) : state === "pending" ? (
          <p className="rounded-full bg-warning/15 px-3 py-1.5 text-sm font-bold text-warning">⏳ {t.slips.pendingPayment}</p>
        ) : (
          <p className="max-w-56 text-sm font-semibold text-muted">⏱ {t.slips.closed}</p>
        )}
      </div>
    </article>
  );
}
