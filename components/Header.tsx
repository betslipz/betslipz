import Link from "next/link";
import type { Locale } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import { getSession } from "@/lib/auth";
import Logo from "./Logo";
import LanguageSwitch from "./LanguageSwitch";
import MobileMenu from "./MobileMenu";
import { logout } from "@/app/actions/auth";

export default async function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const session = await getSession();
  const links = [
    { href: `/${locale}/slips`, label: t.nav.slips },
    { href: `/${locale}/results`, label: t.nav.results },
    { href: `/${locale}#pricing`, label: t.nav.pricing },
  ];
  if (session) links.push({ href: `/${locale}/account`, label: t.nav.account });
  if (session?.role === "admin") links.push({ href: `/${locale}/admin`, label: t.nav.admin });

  const authArea = session ? (
    <form action={logout}>
      <input type="hidden" name="locale" value={locale} />
      <button className="btn btn-ghost text-sm">{t.nav.logout}</button>
    </form>
  ) : (
    <>
      <Link href={`/${locale}/login`} className="btn btn-ghost text-sm">
        {t.nav.login}
      </Link>
      <Link href={`/${locale}/signup`} className="btn btn-primary text-sm">
        {t.nav.signup}
      </Link>
    </>
  );

  const tierBadge = session?.tier && (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        session.tier === "vip" ? "bg-vip text-[#1a1200]" : "bg-accent/15 text-accent"
      }`}
    >
      {session.tier === "vip" ? t.common.vip : t.common.regular}
    </span>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${locale}`} aria-label={t.nav.home}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-text">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {tierBadge}
          <LanguageSwitch locale={locale} label={t.nav.language} />
          {authArea}
        </div>
        <MobileMenu>
          <div className="flex flex-col gap-3 p-4">
            {tierBadge && <div>{tierBadge}</div>}
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="py-1 text-text">
                {l.label}
              </Link>
            ))}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <LanguageSwitch locale={locale} label={t.nav.language} />
              {authArea}
            </div>
          </div>
        </MobileMenu>
      </div>
    </header>
  );
}
