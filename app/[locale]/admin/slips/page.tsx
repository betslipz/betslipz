import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import { fmtDate, fmtOdds } from "@/lib/format";
import StatusBadge, { TierBadge } from "@/components/StatusBadge";
import { settleSlip, deleteSlip } from "@/app/actions/admin";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default async function AdminSlips({ params }: PageProps<"/[locale]/admin/slips">) {
  const { locale, t } = await resolveLocale(params);
  const supabase = await createClient();
  const { data } = await supabase.from("slips").select(SLIP_SELECT).order("publish_at", { ascending: false }).limit(100);
  const slips = (data ?? []) as Slip[];
  const statuses = ["pending", "won", "lost", "void", "partial"] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{t.admin.slips}</h1>
        <Link href={`/${locale}/admin/slips/new`} className="btn btn-primary">
          + {t.admin.newSlip}
        </Link>
      </div>
      {slips.length === 0 && <p className="card p-8 text-center text-muted">{t.common.noData}</p>}
      {slips.map((s) => {
        const scheduled = new Date(s.publish_at) > new Date();
        return (
          <details key={s.id} className="card group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
              <TierBadge tier={s.tier} t={t.common} />
              <StatusBadge status={s.status} t={t.common} />
              {scheduled && <span className="rounded bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">⏱ {fmtDate(s.publish_at, locale)}</span>}
              <b className="min-w-0 flex-1 truncate">{s.title_en}</b>
              <span className="text-sm text-muted" dir="ltr">
                {s.slip_legs.length ? `${s.slip_legs.length} ×` : "📷"} · {fmtOdds(s.total_odds)} · {s.confidence}%
              </span>
              <span className="text-xs text-muted">{fmtDate(s.publish_at, locale)}</span>
            </summary>
            <div className="border-t border-border p-4">
              <form action={settleSlip} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={s.id} />
                {[...s.slip_legs]
                  .sort((a, b) => a.position - b.position)
                  .map((leg) => (
                    <div key={leg.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>
                        {leg.event} · <span className="text-muted">{leg.market}</span> · <b>{leg.pick}</b> @ {fmtOdds(leg.odds)}
                      </span>
                      <select name={`leg:${leg.id}`} defaultValue={leg.result} className="input w-auto py-1">
                        {statuses.map((st) => (
                          <option key={st} value={st}>
                            {t.common[st]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <span className="text-sm text-muted">{t.admin.settle}:</span>
                  <select name="status" defaultValue={s.status} className="input w-auto py-1">
                    {statuses.map((st) => (
                      <option key={st} value={st}>
                        {t.common[st]}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary py-1.5 text-sm">{t.common.save}</button>
                  <Link href={`/${locale}/admin/slips/${s.id}`} className="btn btn-ghost py-1.5 text-sm">
                    {t.common.edit}
                  </Link>
                  <Link href={`/${locale}/admin/slips/new?from=${s.id}`} className="btn btn-ghost py-1.5 text-sm">
                    ⧉ {t.admin.duplicate}
                  </Link>
                </div>
              </form>
              <form action={deleteSlip} className="mt-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={s.id} />
                <ConfirmButton message="Delete this slip permanently?" className="btn btn-danger py-1.5 text-sm">
                  {t.common.delete}
                </ConfirmButton>
              </form>
            </div>
          </details>
        );
      })}
    </div>
  );
}
