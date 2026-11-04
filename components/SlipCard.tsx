import Image from "next/image";
import { BETARABIA_URL, type Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Slip } from "@/lib/types";
import { fmtDate, fmtOdds } from "@/lib/format";
import ConfidenceMeter from "./ConfidenceMeter";
import StatusBadge, { TierBadge } from "./StatusBadge";
import CopyButton from "./CopyButton";

export default function SlipCard({
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

  return (
    <article className={`card overflow-hidden ${slip.tier === "vip" ? "border-vip/50" : ""}`}>
      <div className="flex items-start justify-between gap-4 border-b border-border p-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TierBadge tier={slip.tier} t={t.common} />
            <StatusBadge status={slip.status} t={t.common} />
            <span className="text-xs text-muted">{fmtDate(slip.publish_at, locale)}</span>
          </div>
          <h3 className="text-lg font-bold leading-snug">{title}</h3>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span>
              <span className="text-muted">{t.common.totalOdds}: </span>
              <b className="text-accent" dir="ltr">
                {fmtOdds(slip.total_odds)}
              </b>
            </span>
            <span>
              <span className="text-muted">{t.common.stake}: </span>
              <b>
                {slip.stake_units} {Number(slip.stake_units) === 1 ? t.common.unit : t.common.units}
              </b>
            </span>
          </div>
        </div>
        <ConfidenceMeter value={slip.confidence} label={t.common.confidence} />
      </div>

      {imageOnly && (
        <div className="p-3">
          <Image src={imageUrl} alt={title} width={800} height={1000} unoptimized className="h-auto w-full rounded-lg border border-border" />
        </div>
      )}

      <ul className="divide-y divide-border">
        {legs.map((leg) => (
          <li key={leg.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{leg.event}</p>
              <p className="text-sm text-muted">
                {leg.market} · <span className="text-text">{leg.pick}</span>
                {leg.kickoff_at && <> · {fmtDate(leg.kickoff_at, locale)}</>}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {leg.result !== "pending" && <StatusBadge status={leg.result} t={t.common} />}
              <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-sm font-bold" dir="ltr">
                {fmtOdds(leg.odds)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {!compact && (notes || (imageUrl && !imageOnly)) && (
        <div className="space-y-3 border-t border-border p-4">
          {notes && (
            <div>
              <p className="label">{t.common.notes}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed">{notes}</p>
            </div>
          )}
          {imageUrl && !imageOnly && (
            <Image src={imageUrl} alt={title} width={800} height={600} unoptimized className="h-auto w-full rounded-lg border border-border" />
          )}
        </div>
      )}

      {slip.status === "pending" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2/50 p-3">
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
