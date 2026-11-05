import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import { seesAllSlips, type Session } from "@/lib/auth";
import type { GiftState } from "@/lib/gift";
import { teaserState, type Teaser } from "./LockedSlip";
import { fmtOdds, fmtUsd } from "@/lib/format";
import ConfidenceMeter from "./ConfidenceMeter";
import SlipPaper from "./SlipPaper";

// Stand-in picks drawn under the blur: the real ones never reach visitors who haven't opened the slip.
const PLACEHOLDER_LEGS = [
  { event: "Team A vs Team B", market: "Double chance", pick: "1X", odds: 1.5 },
  { event: "Team C vs Team D", market: "1X2", pick: "Team C", odds: 1.24 },
  { event: "Team E vs Team F", market: "Over/Under", pick: "Over 2.5", odds: 1.72 },
  { event: "Team G vs Team H", market: "Double chance", pick: "X2", odds: 1.32 },
].map((l) => ({ ...l, kickoff_at: null, result: "pending" as const }));

// Home page hero: the newest open slip as a blurred ticket, with a button to buy it (or open it free with the welcome gift).
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
  const entitled = seesAllSlips(session);
  const buyable = !!teaser && teaserState(teaser, false) === "buy";
  // Guests sign up for the welcome gift; new accounts claim it on the Slips page.
  const free = buyable && !entitled && (!session || gift === "available");
  const href = entitled || !buyable ? `/${locale}/slips` : free ? `/${locale}/${session ? "slips" : "signup"}` : `/${locale}/subscribe?slip=${teaser.id}`;
  const label = entitled || !buyable ? t.landing.viewSlip : free ? `🎁 ${t.landing.revealFree}` : t.slips.buy.replace("{price}", fmtUsd(teaser.price_usd));

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-slip-navy shadow-2xl shadow-accent/10">
      <div className="pointer-events-none blur-[5px] select-none" aria-hidden>
        <div className="flex items-center justify-between gap-4 border-b-2 border-slip-gold bg-slip-navy p-4 text-white">
          <p className="text-lg font-bold">{t.landing.todaySlip}</p>
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
        )}
        <span className="text-4xl" aria-hidden>
          {entitled ? "🔓" : "🔒"}
        </span>
        <Link href={href} className={`btn ${free ? "btn-vip" : "btn-primary"} px-8 py-3 text-lg font-black shadow-lg`}>
          {label}
        </Link>
        {!entitled && buyable && <p className="max-w-xs text-sm text-muted">{free ? t.landing.revealFreeHint : t.landing.revealHint}</p>}
      </div>
    </div>
  );
}
