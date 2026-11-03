import type { Locale } from "@/lib/config";

export function fmtDate(iso: string | null | undefined, locale: Locale, withTime = true) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-LB" : "en-GB", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Asia/Beirut",
  }).format(new Date(iso));
}

export function fmtOdds(n: number) {
  return Number(n).toFixed(2);
}

export function fmtUsd(n: number) {
  return `$${Number(n).toFixed(Number(n) % 1 === 0 ? 0 : 2)}`;
}
