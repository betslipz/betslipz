import { getSession } from "@/lib/auth";
import { BETARABIA_URL, SITE_NAME, type Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Slip } from "@/lib/types";
import ConfidenceMeter from "./ConfidenceMeter";
import { TierBadge } from "./StatusBadge";
import CopyButton from "./CopyButton";
import SlipPaper from "./SlipPaper";
import ProtectedImage from "./ProtectedImage";

export default async function SlipCard({
  slip,
  locale,
  t,
  imageUrl,
  compact = false,
}: {
  slip: Slip;
  locale: Locale;
  t: Dictionary;
  imageUrl?: string | null;
  compact?: boolean;
}) {
  const title = (locale === "ar" && slip.title_ar) || slip.title_en;
  const notes = (locale === "ar" && slip.notes_ar) || slip.notes_en;
  const legs = [...slip.slip_legs].sort((a, b) => a.position - b.position);
  // Screenshot-only slips have no typed picks: the image takes their place.
  const imageOnly = legs.length === 0 && !!imageUrl;
  // Tiled across slip screenshots, so a leaked picture points back to the account it came from.
  const viewer = imageUrl ? await getSession() : null;
  const watermark = viewer ? `${viewer.email} · ${new Date().toISOString().slice(0, 10)}` : SITE_NAME;

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-slip-paper shadow-lg ${slip.tier === "vip" ? "border-vip" : "border-slip-navy"}`}>
      <div className="flex items-center justify-between gap-4 border-b-2 border-slip-gold bg-slip-navy p-4 text-white">
        <div className="min-w-0 space-y-2">
          <TierBadge tier={slip.tier} t={t.common} />
          <h3 className="text-lg font-bold leading-snug">{title}</h3>
        </div>
        <ConfidenceMeter value={slip.confidence} label={t.common.confidence} size={64} />
      </div>

      <SlipPaper
        status={slip.status}
        legs={legs}
        publishAt={slip.publish_at}
        totalOdds={slip.total_odds}
        stakeUnits={slip.stake_units}
        locale={locale}
        t={t.common}
      >
        {imageOnly ? (
          <div className="border-t border-slip-line bg-slip-row p-2">
            <ProtectedImage src={imageUrl} alt={title} watermark={watermark} />
          </div>
        ) : undefined}
      </SlipPaper>

      {!compact && (notes || (imageUrl && !imageOnly)) && (
        <div className="space-y-3 border-t border-border bg-surface p-4">
          {notes && (
            <div>
              <p className="label">{t.common.notes}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed">{notes}</p>
            </div>
          )}
          {imageUrl && !imageOnly && (
            <ProtectedImage src={imageUrl} alt={title} watermark={watermark} className="overflow-hidden rounded-lg border border-border" />
          )}
        </div>
      )}

      {slip.status === "pending" && (
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border bg-surface p-3">
          {slip.betarabia_code && (
            <>
              <span className="text-sm text-muted">{t.common.bookingCode}:</span>
              <code className="rounded bg-bg px-2 py-1 font-mono text-sm font-bold" dir="ltr">
                {slip.betarabia_code}
              </code>
              <CopyButton text={slip.betarabia_code} label={t.common.copy} copiedLabel={t.common.copied} />
            </>
          )}
          <a href={BETARABIA_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary ms-auto px-3 py-1.5 text-sm">
            {t.common.openBetArabia} ↗
          </a>
        </div>
      )}
    </article>
  );
}
