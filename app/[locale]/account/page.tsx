import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtUsd } from "@/lib/format";
import ProfileForm from "@/components/ProfileForm";
import StatusBadge from "@/components/StatusBadge";
import { planLabel } from "@/lib/plans";
import type { Sport } from "@/lib/sports";
import type { SlipStatus } from "@/lib/types";

type PlanRef = { tier: "regular" | "vip"; sport: Sport | null; duration: "week" | "month" | "quarter" | "year" };
type SlipRef = { id: string; title_en: string; title_ar: string | null; status: SlipStatus; publish_at: string };

export default async function AccountPage({ params }: PageProps<"/[locale]/account">) {
  const { locale, t } = await resolveLocale(params);
  const session = await requireUser(locale);
  const supabase = await createClient();

  const now = new Date().toISOString();
  const [{ data: profile }, { data: subs }, { data: payments }, { data: unlocks }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", session.userId).single(),
    supabase.from("subscriptions").select("id, tier, sport, starts_at, ends_at").eq("revoked", false).gt("ends_at", now).order("ends_at"),
    supabase
      .from("payments")
      .select("id, created_at, method, amount_usd, status, admin_note, plans!payments_plan_id_fkey(tier, sport, duration), slips!payments_slip_id_fkey(id, title_en, title_ar, status, publish_at)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("slip_unlocks").select("created_at, slips(id, title_en, title_ar, status, publish_at)").eq("user_id", session.userId).order("created_at", { ascending: false }).limit(30),
  ]);
  const slipTitle = (s: SlipRef) => (locale === "ar" && s.title_ar) || s.title_en;
  const bought = (unlocks ?? []).map((u) => u.slips as unknown as SlipRef | null).filter((x): x is SlipRef => !!x);

  const statusStyle = { pending: "text-warning", approved: "text-accent", rejected: "text-danger" } as const;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-black">{t.account.title}</h1>

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t.account.activePlans}</h2>
          <Link href={`/${locale}/subscribe`} className="btn btn-primary text-sm">
            {t.account.renew}
          </Link>
        </div>
        {subs?.length ? (
          <ul className="space-y-2">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
                <b className={s.tier === "vip" ? "text-vip" : "text-accent"}>{planLabel({ tier: s.tier, sport: s.sport }, t)}</b>
                <span className="text-sm text-muted">
                  {new Date(s.starts_at) > new Date() ? `${fmtDate(s.starts_at, locale, false)} → ` : ""}
                  {t.account.validUntil} {fmtDate(s.ends_at, locale)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t.account.noPlan}</p>
        )}
      </section>

      {bought.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold">{t.account.boughtSlips}</h2>
          <ul className="space-y-2">
            {bought.map((s) => (
              <li key={s.id}>
                <Link href={s.status === "pending" ? `/${locale}/slips#slip-${s.id}` : `/${locale}/results?source=slips`} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3 hover:bg-surface-2/70">
                  <span className="min-w-0 truncate font-semibold">{slipTitle(s)}</span>
                  <span className="flex shrink-0 items-center gap-2 text-sm text-muted">
                    {fmtDate(s.publish_at, locale, false)} <StatusBadge status={s.status} t={t.common} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-6">
        <h2 className="mb-4 text-lg font-bold">{t.account.payments}</h2>
        {payments?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-start text-muted">
                <tr>
                  <th className="py-2 text-start">{t.account.date}</th>
                  <th className="py-2 text-start">{t.account.plan}</th>
                  <th className="py-2 text-start">{t.subscribe.method}</th>
                  <th className="py-2 text-start">{t.subscribe.amount}</th>
                  <th className="py-2 text-start">{t.common.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => {
                  const plan = p.plans as unknown as PlanRef | null;
                  const slip = p.slips as unknown as SlipRef | null;
                  return (
                    <tr key={p.id}>
                      <td className="py-2">{fmtDate(p.created_at, locale, false)}</td>
                      <td className="py-2">{plan ? planLabel(plan, t) : slip ? `🎟 ${slipTitle(slip)}` : "—"}</td>
                      <td className="py-2">{(t.subscribe.methods as Record<string, string>)[p.method] ?? p.method}</td>
                      <td className="py-2" dir="ltr">{fmtUsd(p.amount_usd)}</td>
                      <td className={`py-2 font-semibold ${statusStyle[p.status as keyof typeof statusStyle]}`}>
                        {t.common[p.status as "pending" | "approved" | "rejected"]}
                        {p.admin_note && <span className="block text-xs font-normal text-muted">{p.admin_note}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">{t.common.noData}</p>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-lg font-bold">{t.account.profile}</h2>
        <p className="mb-4 text-sm text-muted" dir="ltr">{session.email}</p>
        <ProfileForm locale={locale} t={t} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
        <Link href={`/${locale}/reset`} className="mt-4 inline-block text-sm text-accent">
          {t.auth.forgot}
        </Link>
      </section>
    </div>
  );
}
