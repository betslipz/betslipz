import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtUsd } from "@/lib/format";
import ProfileForm from "@/components/ProfileForm";

export default async function AccountPage({ params }: PageProps<"/[locale]/account">) {
  const { locale, t } = await resolveLocale(params);
  const session = await requireUser(locale);
  const supabase = await createClient();

  const now = new Date().toISOString();
  const [{ data: profile }, { data: subs }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", session.userId).single(),
    supabase.from("subscriptions").select("id, tier, starts_at, ends_at").eq("revoked", false).gt("ends_at", now).order("ends_at"),
    supabase.from("payments").select("id, created_at, method, amount_usd, status, admin_note, plans!payments_plan_id_fkey(tier, duration)").order("created_at", { ascending: false }).limit(20),
  ]);

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
                <b className={s.tier === "vip" ? "text-vip" : "text-accent"}>{s.tier === "vip" ? `★ ${t.common.vip}` : t.common.regular}</b>
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
                  const plan = p.plans as unknown as { tier: "regular" | "vip"; duration: "week" | "month" | "quarter" | "year" } | null;
                  return (
                    <tr key={p.id}>
                      <td className="py-2">{fmtDate(p.created_at, locale, false)}</td>
                      <td className="py-2">{plan ? `${t.common[plan.tier]} · ${t.common[plan.duration]}` : "—"}</td>
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
