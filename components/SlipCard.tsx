import { getSession } from "@/lib/auth";
import { SITE_NAME, type Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Slip } from "@/lib/types";
import ConfidenceMeter from "./ConfidenceMeter";
import SlipPaper from "./SlipPaper";
import ProtectedImage from "./ProtectedImage";
import { teamLookup } from "@/lib/teams";

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
  const [viewer, teams] = await Promise.all([imageUrl ? getSession() : null, teamLookup()]);
  const watermark = viewer ? `${viewer.email} · ${new Date().toISOString().slice(0, 10)}` : SITE_NAME;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border-2 border-slip-navy bg-slip-paper shadow-lg">
      <div className="flex items-center justify-between gap-4 border-b-2 border-slip-gold bg-slip-navy p-4 text-white">
        <h3 className="min-w-0 text-lg font-bold leading-snug">{title}</h3>
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
        teams={teams}
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

    </article>
  );
}
