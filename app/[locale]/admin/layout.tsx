import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/auth";
import { adminNav, pendingPaymentsCount } from "@/lib/nav";
import NavList from "@/components/nav/NavList";
import AdminTabs from "@/components/nav/AdminTabs";
import Icon from "@/components/nav/Icon";

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale, t } = await resolveLocale(params);
  await requireAdmin(locale);
  const items = adminNav(locale, t, await pendingPaymentsCount());

  return (
    <div className="page-wrap py-6 lg:flex lg:gap-8">
      {/* Desktop: fixed left sidebar. Phones use the ☰ drawer plus the tab row below. */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20 rounded-2xl border border-danger/30 bg-surface p-3">
          <p className="flex items-center gap-2 px-2 pb-3 pt-1 text-xs font-black uppercase tracking-wider text-danger">
            <Icon name="shield" className="h-4 w-4" />
            {t.nav.adminPanel}
          </p>
          <NavList items={items} />
          <Link href={`/${locale}`} className="mt-3 flex items-center gap-2 border-t border-border px-3 pt-3 text-sm text-muted hover:text-text">
            <Icon name="back" className="h-4 w-4 rtl:-scale-x-100" />
            {t.admin.backToSite}
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <AdminTabs items={items} label={t.nav.adminPanel} />
        {children}
      </div>
    </div>
  );
}
