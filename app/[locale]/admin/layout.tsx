import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale, t } = await resolveLocale(params);
  await requireAdmin(locale);
  const base = `/${locale}/admin`;
  const tabs = [
    { href: base, label: t.admin.dashboard },
    { href: `${base}/slips`, label: t.admin.slips },
    { href: `${base}/payments`, label: t.admin.payments },
    { href: `${base}/users`, label: t.admin.users },
    { href: `${base}/settings`, label: t.admin.settings },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <span className="me-4 rounded-md bg-danger/15 px-2 py-1 text-xs font-black uppercase tracking-wider text-danger">{t.admin.title}</span>
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-text">
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
