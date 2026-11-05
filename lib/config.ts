// Change the brand here once you've picked the name.
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "BetSlipz";
export const SITE_TAGLINE = "Daily betting slips";


export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
