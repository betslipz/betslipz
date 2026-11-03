import "server-only";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";

export async function resolveLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, t: getDictionary(locale) };
}
