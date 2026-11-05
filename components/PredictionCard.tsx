import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Prediction, SlipStatus } from "@/lib/types";
import { sportEmoji } from "@/lib/sports";
import { fmtDate, fmtOdds } from "@/lib/format";
import ConfidenceMeter from "./ConfidenceMeter";

// One game and our pick, in the same ticket colors as the slips.

const ink: Record<SlipStatus, string> = {
  pending: "text-slip-ink",
  won: "text-slip-win",
  lost: "text-slip-loss",
  void: "text-slip-ink/50",
  partial: "text-slip-amber",
};
const icon: Record<SlipStatus, string> = { pending: "", won: "✓", lost: "✕", void: "—", partial: "½" };

export default function PredictionCard({ p, locale, t }: { p: Prediction; locale: Locale; t: Dictionary }) {
  const notes = (locale === "ar" && p.notes_ar) || p.notes_en;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border-2 border-slip-navy bg-slip-paper text-slip-ink shadow-lg">
      <div className="flex items-center gap-2 border-b-2 border-slip-gold bg-slip-navy px-4 py-2 text-sm text-white">
        <span aria-hidden>{sportEmoji(p.sport)}</span>
        <span className="min-w-0 flex-1 truncate font-semibold" dir="auto">
          {p.competition || t.live.sports[p.sport]}
        </span>
        {p.kickoff_at && <span className="shrink-0 text-white/80">{fmtDate(p.kickoff_at, locale)}</span>}
      </div>
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-bold leading-snug" dir="auto">
            {p.event.replace(/\s+vs\.?\s+/i, " - ")}
          </p>
          <div className={`flex items-center justify-between gap-3 rounded-md bg-slip-row px-3 py-2 ${ink[p.status]}`}>
            <span className="min-w-0" dir="auto">
              <span className="text-sm opacity-70">{p.market}: </span>
              <b>{p.pick}</b>
            </span>
            <b className="shrink-0 text-lg" dir="ltr">
              {fmtOdds(p.odds)}
            </b>
          </div>
          {p.status !== "pending" && (
            <p className={`text-sm font-bold ${ink[p.status]}`}>
              {t.common.result}: {icon[p.status]} {t.common[p.status]}
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-xl bg-slip-navy px-2 py-1.5">
          <ConfidenceMeter value={p.confidence} label={t.common.confidence} size={60} />
        </div>
      </div>
      {notes && <p className="border-t border-slip-line px-4 py-3 text-sm whitespace-pre-line text-slip-ink/80">{notes}</p>}
    </article>
  );
}
