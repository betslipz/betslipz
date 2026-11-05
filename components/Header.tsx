import Link from "next/link";
import type { Locale } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import { getSession } from "@/lib/auth";
import { pendingPaymentsCount, siteNav } from "@/lib/nav";
import Logo from "./Logo";
import LanguageSwitch from "./LanguageSwitch";
import SideMenu from "./nav/SideMenu";
import Icon from "./nav/Icon";
import { sportEmoji } from "@/lib/sports";

export default async function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const pending = isAdmin ? await pendingPaymentsCount() : 0;
  const vip = !!session?.access.vip;
  const tierLabel = vip ? `★ ${t.common.vip}` : session?.access.sports.length ? session.access.sports.map(sportEmoji).join(" ") : null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="page-wrap flex items-center gap-2 py-3 sm:gap-3">
        <SideMenu
          locale={locale}
          labels={{
            menu: t.nav.menu,
            close: t.nav.close,
            browse: t.nav.browse,
            language: t.nav.language,
            login: t.nav.login,
            signup: t.nav.signup,
            logout: t.nav.logout,
            guest: t.nav.guest,
            noPlan: t.nav.noPlan,
            admin: t.nav.admin,
          }}
          user={session ? { name: session.fullName ?? "", email: session.email, tierLabel, vip, admin: isAdmin } : null}
          items={siteNav(locale, t, session, pending)}
        />
        <Link href={`/${locale}`} aria-label={t.nav.home}>
          <Logo />
        </Link>

        <div className="ms-auto flex items-center gap-2">
          {isAdmin && (
            <Link
              href={`/${locale}/admin`}
              className="relative btn gap-1.5 border border-danger/40 bg-danger/10 px-3 text-sm font-bold text-danger hover:bg-danger/20"
            >
              <Icon name="shield" className="h-4 w-4" />
              <span className="hidden sm:inline">{t.nav.admin}</span>
              {pending > 0 && (
                <span className="absolute -end-2 -top-2 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] font-bold leading-5 text-white" dir="ltr">
                  {pending}
                </span>
              )}
            </Link>
          )}
          {tierLabel && (
            <span
              className={`hidden rounded-full px-2.5 py-1 text-xs font-bold sm:inline ${
                vip ? "bg-vip text-[#1a1200]" : "bg-accent/15 text-accent"
              }`}
            >
              {tierLabel}
            </span>
          )}
          <span className="hidden md:inline-flex">
            <LanguageSwitch locale={locale} label={t.nav.language} />
          </span>
          {session ? (
            <Link href={`/${locale}/predictions`} className="btn btn-primary hidden text-sm sm:inline-flex">
              {t.nav.predictions}
            </Link>
          ) : (
            <>
              <Link href={`/${locale}/login`} className="btn btn-ghost hidden text-sm sm:inline-flex">
                {t.nav.login}
              </Link>
              <Link href={`/${locale}/signup`} className="btn btn-primary text-sm">
                {t.nav.signup}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
