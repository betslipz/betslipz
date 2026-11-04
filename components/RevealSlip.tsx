import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Session } from "@/lib/auth";
import type { GiftState } from "@/lib/gift";
import type { Teaser } from "./LockedSlip";
import { fmtOdds } from "@/lib/format";
import { TierBadge } from "./StatusBadge";
import ConfidenceMeter from "./ConfidenceMeter";

// Home page hero: today's slip, blurred, with a Reveal button that leads to payment.
// The preview is blurred on the server (see lib/featured.ts); typed slips show a drawn placeholder instead of real picks.
export default function RevealSlip({
  featured,
  session,
  gift,
  locale,
  t,
}: {
  featured: { teaser: Teaser; preview: string | null } | null;
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
    <div className={`card relative overflow-hidden shadow-2xl shadow-accent/10 ${vip ? "border-vip/50" : ""}`}>
      <div className="pointer-events-none select-none" aria-hidden>
        {featured?.preview ? (
          <div className="relative h-[420px]">
            <Image src={featured.preview} alt="" fill unoptimized className="scale-110 object-cover" />
          </div>
        ) : (
          <div className="p-5 blur-[5px]">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-vip px-2 py-0.5 text-xs font-black text-[#1a1200]">★ VIP</span>
              <ConfidenceMeter value={82} label={t.common.confidence} size={64} />
            </div>
            {["Team A vs Team B", "Team C vs Team D", "Team E vs Team F", "Team G vs Team H"].map((m, i) => (
              <div key={m} className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="font-semibold" dir="ltr">
                    {m}
                  </p>
                  <p className="text-sm text-muted">{["1X2 · Home", "BTTS · Yes", "Over 2.5", "Double chance"][i]}</p>
                </div>
                <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-sm font-bold">{["1.65", "1.80", "1.72", "1.40"][i]}</span>
              </div>
            ))}
            <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted">{t.common.totalOdds}</span>
              <b className="text-accent">7.15</b>
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-bg/30 via-bg/50 to-bg/80 p-6 text-center">
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
