"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";

const SEEN = "welcome_seen=1";

// First-visit offer for guests: create an account to see today's Regular slip once. Shown after the 18+ check.
export default function WelcomeOffer({ locale, t }: { locale: Locale; t: Dictionary["welcome"] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const maybeShow = () => {
      if (document.cookie.includes("age_ok=1") && !document.cookie.includes(SEEN)) setShow(true);
    };
    maybeShow();
    window.addEventListener("age-ok", maybeShow);
    return () => window.removeEventListener("age-ok", maybeShow);
  }, []);

  if (!show) return null;
  const dismiss = () => {
    document.cookie = `${SEEN}; path=/; max-age=31536000; samesite=lax`;
    setShow(false);
  };

  return (
    <div className="drawer-fade fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={dismiss}>
      <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="card w-full max-w-sm overflow-hidden text-center" onClick={(e) => e.stopPropagation()}>
        <div className="hero-glow px-6 pb-2 pt-8">
          <span className="text-6xl" aria-hidden>
            🎁
          </span>
          <h2 id="welcome-title" className="mt-3 text-2xl font-black">
            {t.title}
          </h2>
        </div>
        <div className="px-6 pb-6">
          <p className="text-muted">{t.text}</p>
          <Link href={`/${locale}/signup`} onClick={dismiss} className="btn btn-vip mt-6 w-full py-3 text-base font-black">
            {t.cta}
          </Link>
          <button type="button" onClick={dismiss} className="btn mt-2 w-full text-sm text-muted">
            {t.later}
          </button>
        </div>
      </div>
    </div>
  );
}
