import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtUsd } from "@/lib/format";
import { approvePayment, rejectPayment } from "@/app/actions/admin";

type Row = {
  id: string;
  created_at: string;
  method: string;
  reference: string;
  proof_path: string | null;
  amount_usd: number;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  user: { email: string; full_name: string | null; phone: string | null } | null;
  plans: { tier: "regular" | "vip"; duration: "week" | "month" | "quarter" | "year" } | null;
};

export default async function AdminPayments({ params, searchParams }: PageProps<"/[locale]/admin/payments">) {
  const { locale, t } = await resolveLocale(params);
  const { status = "pending" } = await searchParams;
  const filter = status === "all" ? null : String(status);
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select("id, created_at, method, reference, proof_path, amount_usd, status, admin_note, user:profiles!payments_user_id_fkey(email, full_name, phone), plans!payments_plan_id_fkey(tier, duration)")
    .order("created_at", { ascending: filter === "pending" })
    .limit(100);
  if (filter) query = query.eq("status", filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];

  // Receipts live in a private bucket; admins get 10-minute links.
  const paths = rows.map((r) => r.proof_path).filter((p): p is string => !!p);
  const signed = paths.length ? (await supabase.storage.from("payment-proofs").createSignedUrls(paths, 600)).data ?? [] : [];
  const proofUrl = (p: string | null) => signed.find((s) => s.path === p)?.signedUrl ?? undefined;
  const methods = t.subscribe.methods as Record<string, string>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t.admin.payments}</h1>
        <div className="flex gap-2 text-sm">
          {["pending", "approved", "rejected", "all"].map((s) => (
            <a key={s} href={`?status=${s}`} className={`rounded-lg px-3 py-1.5 ${s === status ? "bg-surface-2 text-text" : "text-muted"}`}>
              {s === "all" ? "All" : t.common[s as "pending" | "approved" | "rejected"]}
            </a>
          ))}
        </div>
      </div>
      {rows.length === 0 && <p className="card p-8 text-center text-muted">{t.common.noData}</p>}
      {rows.map((p) => (
        <div key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
          <div className="min-w-56 flex-1">
            <p className="font-semibold" dir="ltr">{p.user?.email}</p>
            <p className="text-sm text-muted">
              {p.user?.full_name} {p.user?.phone && <span dir="ltr">· {p.user.phone}</span>}
            </p>
            <p className="text-xs text-muted">{fmtDate(p.created_at, locale)}</p>
          </div>
          <div className="text-sm">
            <p>
              <b className={p.plans?.tier === "vip" ? "text-vip" : "text-accent"}>{p.plans ? t.common[p.plans.tier] : "?"}</b> · {p.plans ? t.common[p.plans.duration] : ""}
            </p>
            <p>
              <b dir="ltr">{fmtUsd(p.amount_usd)}</b> · {methods[p.method] ?? p.method}
            </p>
          </div>
          <div className="text-sm">
            <p className="text-muted">Ref</p>
            <code className="font-mono" dir="ltr">{p.reference}</code>
            {proofUrl(p.proof_path) && (
              <a href={proofUrl(p.proof_path)} target="_blank" rel="noopener noreferrer" className="block text-accent underline">
                {t.admin.viewProof}
              </a>
            )}
          </div>
          {p.status === "pending" ? (
            <div className="flex flex-wrap items-center gap-2">
              <form action={approvePayment}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={p.id} />
                <button className="btn btn-primary text-sm">✓ {t.admin.approve}</button>
              </form>
              <form action={rejectPayment} className="flex gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={p.id} />
                <input name="note" placeholder="Reason (optional)" className="input w-40 py-1.5 text-sm" maxLength={300} />
                <button className="btn btn-danger text-sm">{t.admin.reject}</button>
              </form>
            </div>
          ) : (
            <span className={`text-sm font-bold ${p.status === "approved" ? "text-accent" : "text-danger"}`}>
              {t.common[p.status]}
              {p.admin_note && <span className="block text-xs font-normal text-muted">{p.admin_note}</span>}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
