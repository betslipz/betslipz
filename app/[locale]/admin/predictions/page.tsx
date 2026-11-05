import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { PREDICTION_SELECT, type Prediction } from "@/lib/types";
import { PREDICTION_SPORTS, isSport, sportEmoji } from "@/lib/sports";
import { fmtDate, fmtOdds } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { settlePrediction, deletePrediction } from "@/app/actions/admin";
import ConfirmButton from "@/components/admin/ConfirmButton";

const RESULTS = ["won", "lost", "void"] as const;

export default async function AdminPredictions({ params, searchParams }: PageProps<"/[locale]/admin/predictions">) {
  const { locale, t } = await resolveLocale(params);
  const { sport } = await searchParams;
  const filter = isSport(sport) ? sport : null;
  const supabase = await createClient();
  let query = supabase.from("predictions").select(PREDICTION_SELECT).order("kickoff_at", { ascending: false, nullsFirst: false }).limit(150);
  if (filter) query = query.eq("sport", filter);
  const { data } = await query;
  const predictions = (data ?? []) as Prediction[];
  // Open ones first, so today's games are on top, ready to settle.
  const open = predictions.filter((p) => p.status === "pending");
  const settled = predictions.filter((p) => p.status !== "pending");
  const tab = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-semibold ${active ? "border-accent bg-accent text-[#04130a]" : "border-border hover:border-muted"}`;

  const row = (p: Prediction) => {
    const scheduled = new Date(p.publish_at) > new Date();
    return (
      <div key={p.id} className="card flex flex-wrap items-center gap-3 p-3">
        <span className="text-xl" aria-hidden>
          {sportEmoji(p.sport)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.event}</p>
          <p className="text-sm text-muted">
            {p.market}: <b className="text-text">{p.pick}</b> @ <span dir="ltr">{fmtOdds(p.odds)}</span> · {p.confidence}%
            {p.kickoff_at && <> · {fmtDate(p.kickoff_at, locale)}</>}
          </p>
        </div>
        {scheduled && <span className="rounded bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">⏱ {fmtDate(p.publish_at, locale)}</span>}
        <StatusBadge status={p.status} t={t.common} />
        <form action={settlePrediction} className="flex gap-1">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={p.id} />
          {RESULTS.map((st) => (
            <button key={st} name="status" value={st} className={`btn px-2.5 py-1 text-xs ${p.status === st ? "btn-primary" : "btn-ghost border border-border"}`}>
              {t.common[st]}
            </button>
          ))}
          {p.status !== "pending" && (
            <button name="status" value="pending" className="btn btn-ghost border border-border px-2.5 py-1 text-xs" aria-label={t.common.pending}>
              ↺
            </button>
          )}
        </form>
        <Link href={`/${locale}/admin/predictions/${p.id}`} className="btn btn-ghost px-2.5 py-1 text-xs">
          {t.common.edit}
        </Link>
        <form action={deletePrediction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="Delete this prediction permanently?" className="btn btn-danger px-2.5 py-1 text-xs">
            ✕
          </ConfirmButton>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{t.admin.predictions}</h1>
        <Link href={`/${locale}/admin/predictions/new${filter ? `?sport=${filter}` : ""}`} className="btn btn-primary">
          + {t.admin.newPrediction}
        </Link>
      </div>
      <nav className="flex flex-wrap gap-2">
        <Link href={`/${locale}/admin/predictions`} className={tab(!filter)}>
          {t.common.allSports}
        </Link>
        {PREDICTION_SPORTS.map((s) => (
          <Link key={s} href={`/${locale}/admin/predictions?sport=${s}`} className={tab(filter === s)}>
            {sportEmoji(s)} {t.live.sports[s]}
          </Link>
        ))}
      </nav>
      {predictions.length === 0 && <p className="card p-8 text-center text-muted">{t.common.noData}</p>}
      {open.length > 0 && <div className="space-y-2">{open.map(row)}</div>}
      {settled.length > 0 && (
        <>
          <h2 className="pt-4 text-lg font-bold">{t.admin.settledPredictions}</h2>
          <div className="space-y-2">{settled.map(row)}</div>
        </>
      )}
    </div>
  );
}
