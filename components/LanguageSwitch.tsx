"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/config";

export default function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const other: Locale = locale === "en" ? "ar" : "en";
  const href = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${other}`);
  return (
    <a
      href={href}
      onClick={() => {
        document.cookie = `locale=${other}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="btn btn-ghost text-sm"
    >
      {label}
    </a>
  );
}
