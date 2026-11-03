import "server-only";
import en from "./en";
import ar from "./ar";
import type { Locale } from "@/lib/config";

const dictionaries = { en, ar };

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? en;
}

export type { Dictionary } from "./en";
