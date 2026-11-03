import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import { fmtOdds } from "@/lib/format";
import { TierBadge } from "./StatusBadge";

export type Teaser = { id: string; tier: "regular" | "vip"; legs: number; total_odds: number };

// What non-entitled users see: the database never sends them the picks.
export default function LockedSlip({ teaser, locale, t, needsVip }: { teaser: Teaser; locale: Locale; t: Dictionary; needsVip: boolean }) {
  return (
    <article className={`card relative overflow-hidden ${teaser.tier === "vip" ? "border-vip/50" : ""}`}>
      <div className="space-y-3 p-4 opacity-40 blur-[3px] select-none" aria-hidden>
        <div className="h-4 w-24 rounded bg-surface-2" />
        <div className="h-5 w-3/4 rounded bg-surface-2" />
        {Array.from({ length: Math.min(teaser.legs || 2, 4) }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-1/2 rounded bg-surface-2" />
            <div className="h-4 w-10 rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/40 p-4 text-center">
        <TierBadge tier={teaser.tier} t={t.common} />
        <p className="text-sm text-muted">
          {teaser.legs} {t.common.legs} · {t.common.totalOdds}{" "}
          <b className="text-text" dir="ltr">
            {fmtOdds(teaser.total_odds)}
          </b>
        </p>
        <p className="font-semibold">🔒 {needsVip ? t.slips.lockedVipText : t.slips.lockedTitle}</p>
        <Link href={`/${locale}/subscribe${needsVip ? "?tier=vip" : ""}`} className={`btn ${needsVip ? "btn-vip" : "btn-primary"} text-sm`}>
          {needsVip ? t.slips.upgradeVip : t.slips.upgrade}
        </Link>
      </div>
    </article>
  );
}
