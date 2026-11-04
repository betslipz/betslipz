"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { NavItem } from "@/lib/nav";
import { logout } from "@/app/actions/auth";
import Logo from "@/components/Logo";
import LanguageSwitch from "@/components/LanguageSwitch";
import NavList from "./NavList";
import Icon from "./Icon";

type Labels = {
  menu: string;
  close: string;
  browse: string;
  language: string;
  login: string;
  signup: string;
  logout: string;
  guest: string;
  noPlan: string;
  admin: string;
};
type MenuUser = {
  name: string;
  email: string;
  tierLabel: string | null;
  vip: boolean;
  admin: boolean;
};

// Slide-out drawer from the start side (left in English, right in Arabic), opened by the ☰ button.
export default function SideMenu({
  locale,
  labels,
  user,
  items,
}: {
  locale: Locale;
  labels: Labels;
  user: MenuUser | null;
  items: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const pending = items.reduce((n, i) => n + (i.badge ?? 0), 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);
  const siteSection = (
    <section>
      <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-muted">
        {labels.browse}
      </p>
      <NavList items={items} onNavigate={close} />
    </section>
  );

  return (
    <>
      <button
        type="button"
        className="relative btn btn-ghost px-2.5"
        aria-label={labels.menu}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" className="h-6 w-6" />
        {pending > 0 && (
          <span
            className="absolute -end-1 -top-1 h-3 w-3 rounded-full border-2 border-bg bg-danger"
            aria-hidden
          />
        )}
      </button>

      {/* Portalled to <body>: the header's backdrop blur would otherwise trap this fixed layer inside the header. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              className="drawer-fade absolute inset-0 bg-black/60"
              onClick={close}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label={labels.menu}
              className="drawer-panel absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col border-e border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <Link href={`/${locale}`} onClick={close}>
                  <Logo className="h-8" />
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost px-2.5"
                  aria-label={labels.close}
                  onClick={close}
                >
                  <Icon name="close" />
                </button>
              </div>

              <div className="border-b border-border p-4">
                {user ? (
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 font-bold uppercase">
                      {(user.name || user.email)[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {user.name || user.email}
                      </p>
                      <p className="truncate text-xs text-muted" dir="ltr">
                        {user.email}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        user.vip
                          ? "bg-vip text-[#1a1200]"
                          : user.tierLabel
                            ? "bg-accent/15 text-accent"
                            : user.admin
                              ? "bg-danger/15 text-danger"
                              : "bg-surface-2 text-muted"
                      }`}
                    >
                      {user.tierLabel ?? (user.admin ? labels.admin : labels.noPlan)}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/${locale}/login`}
                      onClick={close}
                      className="btn btn-ghost text-sm"
                    >
                      {labels.login}
                    </Link>
                    <Link
                      href={`/${locale}/signup`}
                      onClick={close}
                      className="btn btn-primary text-sm"
                    >
                      {labels.signup}
                    </Link>
                  </div>
                )}
              </div>

              <nav className="flex-1 space-y-5 overflow-y-auto p-3">
                {siteSection}
              </nav>

              <div className="flex items-center gap-2 border-t border-border p-3">
                <LanguageSwitch locale={locale} label={labels.language} />
                {user && (
                  <form action={logout} className="ms-auto">
                    <input type="hidden" name="locale" value={locale} />
                    <button className="btn btn-ghost gap-2 text-sm">
                      <Icon
                        name="logout"
                        className="h-4 w-4 rtl:-scale-x-100"
                      />
                      {labels.logout}
                    </button>
                  </form>
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
