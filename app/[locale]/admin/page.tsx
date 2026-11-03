import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtUsd } from "@/lib/format";

export default async function AdminDashboard({ params }: PageProps<"/[locale]/admin">) {
  const { locale, t } = await resolveLocale(params);
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const in3days = new Date(now.getTime() + 3 * 864e5).toISOString();
  const ago30 = new Date(now.getTime() - 30 * 864e5).toISOString();

  const [{ data: active }, { count: pending }, { data: paid }, { data: expiring }, { data: audit }] = await Promise.all([
    supabase.from("subscriptions").select("user_id, tier").eq("revoked", false).lte("starts_at", nowIso).gt("ends_at", nowIso),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("amount_usd").eq("status", "approved").gte("reviewed_at", ago30),
    supabase.from("subscriptions").select("id, tier, ends_at, profiles!subscriptions_user_id_fkey(email)").eq("revoked", false).gt("ends_at", nowIso).lte("ends_at", in3days).order("ends_at"),
    supabase.from("audit_log").select("id, action, entity, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const usersByTier = (tier: string) => new Set((active ?? []).filter((s) => s.tier === tier).map((s) => s.user_id)).size;
  const revenue = (paid ?? []).reduce((sum, p) => sum + Number(p.amount_usd), 0);

  const stats = [
    { label: t.admin.activeRegular, value: usersByTier("regular"), color: "text-accent" },
    { label: t.admin.activeVip, value: usersByTier("vip"), color: "text-vip" },
    { label: t.admin.pendingPayments, value: pending ?? 0, color: pending ? "text-warning" : "", href: `/${locale}/admin/payments` },
    { label: t.admin.revenue30, value: fmtUsd(revenue), color: "" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{t.admin.dashboard}</h1>
        <Link href={`/${locale}/admin/slips/new`} className="btn btn-primary">
          + {t.admin.newSlip}
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-sm text-muted">{s.label}</p>
              <p className={`mt-1 text-3xl font-black ${s.color}`} dir="ltr">
                {s.value}
              </p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="card p-5 hover:border-muted">
              {body}
            </Link>
          ) : (
            <div key={s.label} className="card p-5">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">{t.admin.expiringSoon}</h2>
          {expiring?.length ? (
            <ul className="space-y-2 text-sm">
              {expiring.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span dir="ltr">{(s.profiles as unknown as { email: string } | null)?.email}</span>
                  <span className="text-muted">
                    {s.tier.toUpperCase()} · {fmtDate(s.ends_at, locale)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t.common.noData}</p>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-bold">{t.admin.audit}</h2>
          {audit?.length ? (
            <ul className="space-y-2 text-sm">
              {audit.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span className="font-mono">
                    {a.action} {a.entity}
                  </span>
                  <span className="text-muted">{fmtDate(a.created_at, locale)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t.common.noData}</p>
          )}
        </section>
      </div>
    </div>
  );
}
