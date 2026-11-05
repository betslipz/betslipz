import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Session } from "@/lib/auth";
import type { GiftState } from "@/lib/gift";
import type { Teaser } from "./LockedSlip";
import { fmtOdds } from "@/lib/format";
import { TierBadge } from "./StatusBadge";
import ConfidenceMeter from "./ConfidenceMeter";
import SlipPaper from "./SlipPaper";

// Stand-in picks drawn under the blur: the real ones never reach visitors who haven't unlocked them.
const PLACEHOLDER_LEGS = [
  { event: "Team A vs Team B", market: "Double chance", pick: "1X", odds: 1.5 },
  { event: "Team C vs Team D", market: "1X2", pick: "Team C", odds: 1.24 },
  { event: "Team E vs Team F", market: "Over/Under", pick: "Over 2.5", odds: 1.72 },
  { event: "Team G vs Team H", market: "Double chance", pick: "X2", odds: 1.32 },
].map((l) => ({ ...l, kickoff_at: null, result: "pending" as const }));

// Home page hero: today's slip as a blurred ticket, with a Reveal button that leads to payment.
export default function RevealSlip({
  featured,
  session,
  gift,
  locale,
  t,
}: {
  featured: { teaser: Teaser } | null;
  session: Session | null;
  gift: GiftState;
  locale: Locale;
  t: Dictionary;
}) {
  const teaser = featured?.teaser;
  const vip = teaser?.tier === "vip";
  const entitled =
    !!session &&
    !!teaser &&
    (session.role === "admin" || session.tier === "vip" || (!vip && (session.tier === "regular" || gift === "active")));
  // Regular slips can be revealed free once with the welcome gift: guests sign up, new accounts claim it on Today's slips.
  const free = !!teaser && !vip && !entitled && (!session || gift === "available");
  const href = entitled ? `/${locale}/slips` : free ? `/${locale}/${session ? "slips" : "signup"}` : `/${locale}/subscribe${vip ? "?tier=vip" : ""}`;

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 shadow-2xl shadow-accent/10 ${vip ? "border-vip" : "border-slip-navy"}`}>
      <div className="pointer-events-none blur-[5px] select-none" aria-hidden>
        <div className="flex items-center justify-between gap-4 border-b-2 border-slip-gold bg-slip-navy p-4 text-white">
          <div className="space-y-2">
            <TierBadge tier={teaser?.tier ?? "vip"} t={t.common} />
            <p className="text-lg font-bold">{t.landing.todaySlip}</p>
          </div>
          <ConfidenceMeter value={82} label={t.common.confidence} size={56} />
        </div>
        <SlipPaper
          status="pending"
          legs={PLACEHOLDER_LEGS.slice(0, Math.min(Math.max(teaser?.legs || 4, 2), 4))}
          publishAt={new Date().toISOString()}
          totalOdds={teaser?.total_odds ?? 7.15}
          stakeUnits={1}
          locale={locale}
          t={t.common}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-bg/50 via-bg/75 to-bg/90 p-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-danger px-3 py-1 text-xs font-bold text-white shadow">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          {teaser ? t.landing.todaySlip : t.landing.sampleSlip}
        </span>
        {teaser && (
          <div className="flex items-center gap-2 text-sm">
            <TierBadge tier={teaser.tier} t={t.common} />
            <span className="text-muted">
              {teaser.legs > 0 && (
                <>
                  {teaser.legs} {teaser.legs === 1 ? t.common.leg : t.common.legs} ·{" "}
                </>
              )}
              {t.common.totalOdds}{" "}
              <b className="text-text" dir="ltr">
                {fmtOdds(teaser.total_odds)}
              </b>
            </span>
          </div>
        )}
        <span className="text-4xl" aria-hidden>
          {entitled ? "🔓" : "🔒"}
        </span>
        <Link href={href} className={`btn ${vip || free ? "btn-vip" : "btn-primary"} px-8 py-3 text-lg font-black shadow-lg`}>
          {entitled ? t.landing.viewSlip : free ? `🎁 ${t.landing.revealFree}` : t.landing.reveal}
        </Link>
        {!entitled && <p className="max-w-xs text-sm text-muted">{free ? t.landing.revealFreeHint : t.landing.revealHint}</p>}
      </div>
    </div>
  );
}
