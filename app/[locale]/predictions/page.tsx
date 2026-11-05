import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { canSeeSport, getSession } from "@/lib/auth";
import { PREDICTION_SPORTS, sportEmoji } from "@/lib/sports";
import { activePlans, countText, monthlyPrice, openCounts } from "@/lib/predictions";
import { fmtUsd } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[locale]/predictions">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.predictions.title, description: t.predictions.subtitle };
}

export default async function PredictionsPage({ params }: PageProps<"/[locale]/predictions">) {
  const { locale, t } = await resolveLocale(params);
  const [session, counts, plans] = await Promise.all([getSession(), openCounts(), activePlans()]);
  const vipPrice = monthlyPrice(plans, "vip");

  return (
    <div className="page-wrap py-10">
      <h1 className="text-3xl font-black">{t.predictions.title}</h1>
      <p className="mb-8 mt-2 max-w-2xl text-muted">{t.predictions.subtitle}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PREDICTION_SPORTS.map((s) => {
          const open = canSeeSport(session, s);
          const price = monthlyPrice(plans, s);
          return (
            <Link key={s} href={`/${locale}/predictions/${s}`} className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-accent">
              <div className="flex items-start justify-between">
                <span className="text-5xl" aria-hidden>
                  {sportEmoji(s)}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${open ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted"}`}>
                  {open ? `✓ ${t.predictions.included}` : `🔒 ${t.predictions.locked}`}
                </span>
              </div>
              <h2 className="text-2xl font-black">{t.live.sports[s]}</h2>
              <p className="text-muted">{countText(counts[s], t.predictions)}</p>
              <span className="mt-auto flex items-center justify-between text-sm font-semibold text-accent">
                {open ? t.predictions.see : price !== null ? t.predictions.fromPerMonth.replace("{price}", fmtUsd(price)) : t.predictions.see}
                <span className="inline-block transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">→</span>
              </span>
            </Link>
          );
        })}
      </div>

      {!session?.access.vip && session?.role !== "admin" && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 border-vip/60 p-5">
          <div>
            <p className="text-lg font-black text-vip">★ {t.common.vip}</p>
            <p className="text-muted">{t.predictions.vipPitch}</p>
          </div>
          <Link href={`/${locale}/subscribe?tier=vip`} className="btn btn-vip">
            {vipPrice !== null ? t.predictions.fromPerMonth.replace("{price}", fmtUsd(vipPrice)) : t.common.vip}
          </Link>
        </div>
      )}
    </div>
  );
}
