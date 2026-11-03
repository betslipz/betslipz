import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Cairo } from "next/font/google";
import "../globals.css";
import { SITE_NAME, SITE_TAGLINE, isLocale, LOCALES } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AgeGate from "@/components/AgeGate";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: { default: `${SITE_NAME}: ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: "Daily betting slips with a confidence score on every pick.",
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${inter.variable} ${cairo.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <Header locale={locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <AgeGate t={t.age} />
      </body>
    </html>
  );
}
