import { resolveLocale } from "@/lib/locale";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtUsd } from "@/lib/format";
import type { Plan } from "@/lib/types";
import { grantPlan, revokeSubscription, setUser } from "@/app/actions/admin";
import ConfirmButton from "@/components/admin/ConfirmButton";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "user" | "admin";
  banned: boolean;
  created_at: string;
  subscriptions: { id: string; tier: "regular" | "vip"; ends_at: string; revoked: boolean }[];
};

export default async function AdminUsers({ params, searchParams }: PageProps<"/[locale]/admin/users">) {
  const { locale, t } = await resolveLocale(params);
  const session = await getSession();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, banned, created_at, subscriptions!subscriptions_user_id_fkey(id, tier, ends_at, revoked)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (search) {
    // Strip characters that have meaning in PostgREST filter syntax.
    const safe = search.replace(/[,()*%\\]/g, "");
    query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`);
  }
  const [{ data }, { data: plans }] = await Promise.all([query, supabase.from("plans").select("*").order("tier").order("price_usd")]);
  const users = (data ?? []) as UserRow[];
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t.admin.users}</h1>
        <form className="w-full sm:w-80">
          <input name="q" defaultValue={search} placeholder={t.admin.search} className="input" />
        </form>
      </div>
      {users.map((u) => {
        const active = u.subscriptions.filter((s) => !s.revoked && new Date(s.ends_at) > now);
        const isSelf = u.id === session?.userId;
        return (
          <div key={u.id} className={`card space-y-3 p-4 ${u.banned ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-56 flex-1">
                <p className="font-semibold" dir="ltr">
                  {u.email} {u.role === "admin" && <span className="ms-1 rounded bg-danger/15 px-1.5 text-xs text-danger">ADMIN</span>}
                  {u.banned && <span className="ms-1 rounded bg-danger px-1.5 text-xs text-white">BANNED</span>}
                </p>
                <p className="text-sm text-muted">
                  {u.full_name} {u.phone && <span dir="ltr">· {u.phone}</span>} · {fmtDate(u.created_at, locale, false)}
                </p>
              </div>
              {!isSelf && (
                <div className="flex gap-2">
                  <form action={setUser}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="user" value={u.id} />
                    <input type="hidden" name="role" value={u.role} />
                    <input type="hidden" name="banned" value={String(!u.banned)} />
                    <ConfirmButton message={u.banned ? "Unban this user?" : "Ban this user? They lose access immediately."} className="btn btn-ghost py-1 text-xs">
                      {u.banned ? t.admin.unban : t.admin.ban}
                    </ConfirmButton>
                  </form>
                  <form action={setUser}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="user" value={u.id} />
                    <input type="hidden" name="role" value={u.role === "admin" ? "user" : "admin"} />
                    <input type="hidden" name="banned" value={String(u.banned)} />
                    <ConfirmButton message={u.role === "admin" ? "Remove admin rights?" : "Give this user FULL admin rights?"} className="btn btn-ghost py-1 text-xs">
                      {u.role === "admin" ? t.admin.removeAdmin : t.admin.makeAdmin}
                    </ConfirmButton>
                  </form>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {active.map((s) => (
                <form key={s.id} action={revokeSubscription} className="flex items-center gap-1 rounded-lg bg-surface-2 py-1 ps-3 pe-1">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={s.id} />
                  <b className={s.tier === "vip" ? "text-vip" : "text-accent"}>{t.common[s.tier]}</b>
                  <span className="text-muted">→ {fmtDate(s.ends_at, locale, false)}</span>
                  <ConfirmButton message="Revoke this subscription?" className="rounded px-1.5 text-muted hover:text-danger">
                    ✕
                  </ConfirmButton>
                </form>
              ))}
              <form action={grantPlan} className="ms-auto flex items-center gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="user" value={u.id} />
                <select name="plan" className="input w-auto py-1 text-sm">
                  {((plans ?? []) as Plan[]).map((p) => (
                    <option key={p.id} value={p.id}>
                      {t.common[p.tier]} · {t.common[p.duration]} ({fmtUsd(p.price_usd)})
                    </option>
                  ))}
                </select>
                <button className="btn btn-ghost py-1 text-xs">{t.admin.grant}</button>
              </form>
            </div>
          </div>
        );
      })}
      {users.length === 0 && <p className="card p-8 text-center text-muted">{t.common.noData}</p>}
    </div>
  );
}
