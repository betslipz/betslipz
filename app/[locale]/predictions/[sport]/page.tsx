import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/lib/locale";
import { canSeeSport, getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PREDICTION_SPORTS, isSport, sportEmoji } from "@/lib/sports";
import { PREDICTION_SELECT, type Prediction } from "@/lib/types";
import { activePlans, monthlyPrice, openCounts } from "@/lib/predictions";
import { fmtUsd } from "@/lib/format";
import PredictionList from "@/components/PredictionList";

export async function generateMetadata({ params }: PageProps<"/[locale]/predictions/[sport]">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  const { sport } = await params;
  return { title: isSport(sport) ? `${t.live.sports[sport]} · ${t.predictions.title}` : t.predictions.title };
}

export default async function SportPage({ params }: PageProps<"/[locale]/predictions/[sport]">) {
  const { locale, t } = await resolveLocale(params);
  const { sport } = await params;
  if (!isSport(sport)) notFound();
  const name = t.live.sports[sport];
  const session = await getSession();
  const open = canSeeSport(session, sport);
  const supabase = await createClient();

  // RLS returns open predictions only to members with this sport; settled ones are public.
  const [{ data: openRows }, { data: settledRows }, counts, plans] = await Promise.all([
    open
      ? supabase
          .from("predictions")
          .select(PREDICTION_SELECT)
          .eq("sport", sport)
          .eq("status", "pending")
          .lte("publish_at", new Date().toISOString())
          .order("kickoff_at", { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    supabase.from("predictions").select(PREDICTION_SELECT).eq("sport", sport).neq("status", "pending").order("settled_at", { ascending: false }).limit(9),
    openCounts(),
    activePlans(),
  ]);
  const openPredictions = (openRows ?? []) as Prediction[];
  const settled = (settledRows ?? []) as Prediction[];
  const price = monthlyPrice(plans, sport);
  const tab = (active: boolean) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold ${
      active ? "border-accent bg-accent text-[#04130a]" : "border-border bg-surface hover:border-muted"
    }`;

  return (
    <div className="page-wrap py-10">
      <nav aria-label={t.predictions.title} className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max gap-2">
          {PREDICTION_SPORTS.map((s) => (
            <li key={s}>
              <Link href={`/${locale}/predictions/${s}`} aria-current={s === sport ? "page" : undefined} className={tab(s === sport)}>
                <span aria-hidden>{sportEmoji(s)}</span>
                {t.live.sports[s]}
                {!canSeeSport(session, s) && <span aria-hidden>🔒</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <h1 className="flex items-center gap-3 text-3xl font-black">
        <span aria-hidden>{sportEmoji(sport)}</span>
        {name}
      </h1>

      {open ? (
        <section className="mt-6">
          <p className="mb-4 text-muted">{t.predictions.buildHint}</p>
          {openPredictions.length === 0 ? (
            <p className="card p-8 text-center text-muted">{t.predictions.noneOpen}</p>
          ) : (
            <PredictionList predictions={openPredictions} locale={locale} t={t} />
          )}
        </section>
      ) : (
        <section className="card hero-glow mt-6 flex flex-col items-center px-6 py-12 text-center">
          <span className="text-5xl" aria-hidden>
            🔒
          </span>
          <p className="mt-4 text-4xl font-black text-accent" dir="ltr">
            {counts[sport]}
          </p>
          <p className="text-lg font-semibold">{counts[sport] ? (counts[sport] === 1 ? t.predictions.lockedCountOne : t.predictions.lockedCount).replace("{sport}", name) : t.predictions.noneOpen}</p>
          <p className="mt-2 max-w-md text-muted">{t.predictions.lockedText.replaceAll("{sport}", name)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/subscribe?sport=${sport}`} className="btn btn-primary px-6">
              {t.predictions.subscribeTo.replace("{sport}", name)}
              {price !== null && <span className="font-normal opacity-80"> · {t.predictions.fromPerMonth.replace("{price}", fmtUsd(price))}</span>}
            </Link>
            <Link href={`/${locale}/subscribe?tier=vip`} className="btn btn-vip">
              ★ {t.predictions.orVip}
            </Link>
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold">{t.predictions.recent}</h2>
          <Link href={`/${locale}/results?source=${sport}`} className="text-sm font-semibold text-accent">
            {t.stats.fullCalendar} <span className="inline-block rtl:rotate-180">→</span>
          </Link>
        </div>
        {settled.length === 0 ? (
          <p className="card p-6 text-center text-muted">{t.predictions.noRecent.replace("{sport}", name)}</p>
        ) : (
          <PredictionList predictions={settled} locale={locale} t={t} />
        )}
      </section>
    </div>
  );
}
