import "server-only";
import { cache } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Session } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { IconName } from "@/components/nav/Icon";

export type NavItem = { href: string; label: string; icon: IconName; badge?: number; exact?: boolean; primary?: boolean };

export function siteNav(locale: Locale, t: Dictionary, session: Session | null): NavItem[] {
  const items: NavItem[] = [
    { href: `/${locale}`, label: t.nav.home, icon: "home", exact: true },
    { href: `/${locale}/slips`, label: t.nav.slips, icon: "ticket" },
    { href: `/${locale}/live`, label: t.nav.live, icon: "live" },
    { href: `/${locale}/results`, label: t.nav.results, icon: "trophy" },
    { href: `/${locale}#pricing`, label: t.nav.pricing, icon: "tag" },
    { href: `/${locale}/subscribe`, label: t.nav.subscribe, icon: "star" },
  ];
  if (session) items.push({ href: `/${locale}/account`, label: t.nav.account, icon: "user" });
  return items;
}

export function adminNav(locale: Locale, t: Dictionary, pending: number): NavItem[] {
  const base = `/${locale}/admin`;
  return [
    { href: `${base}/slips/new`, label: t.admin.newSlip, icon: "plus", primary: true },
    { href: base, label: t.admin.dashboard, icon: "grid", exact: true },
    { href: `${base}/slips`, label: t.admin.slips, icon: "list", exact: true },
    { href: `${base}/payments`, label: t.admin.payments, icon: "wallet", badge: pending },
    { href: `${base}/users`, label: t.admin.users, icon: "users" },
    { href: `${base}/settings`, label: t.admin.settings, icon: "sliders" },
  ];
}

// Shared by the header and the admin layout within one request. RLS returns 0 for non-admins anyway.
export const pendingPaymentsCount = cache(async () => {
  const supabase = await createClient();
  const { count } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending");
  return count ?? 0;
});
