import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { PREDICTION_SPORTS, sportEmoji } from "@/lib/sports";
import { activePlans, countText, openCounts } from "@/lib/predictions";
import PlanCards from "@/components/PlanCards";
import RevealSlip from "@/components/RevealSlip";
import { featuredSlip } from "@/lib/featured";
import { getSession } from "@/lib/auth";
import { giftState } from "@/lib/gift";
import { trackRecord } from "@/lib/stats";
import { InsightCards, WeekStrip } from "@/components/stats/StatsWidgets";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale, t } = await resolveLocale(params);
  const [plans, record, featured, session, counts] = await Promise.all([activePlans(), trackRecord("predictions"), featuredSlip(), getSession(), openCounts()]);

  return (
    <>
      <section className="hero-glow">
        <div className="page-wrap grid items-center gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> {t.landing.badge}
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{t.landing.title}</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">{t.landing.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#pricing" className="btn btn-primary px-6 py-3">
                {t.landing.ctaPrimary}
              </a>
              <Link href={`/${locale}/results`} className="btn btn-ghost px-6 py-3">
                {t.landing.ctaSecondary}
              </Link>
            </div>
          </div>

          <RevealSlip featured={featured} session={session} gift={giftState(session)} locale={locale} t={t} />
        </div>
      </section>

      <section className="page-wrap pt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl font-black">{t.predictions.homeTitle}</h2>
          <Link href={`/${locale}/predictions`} className="btn btn-ghost">
            {t.predictions.title} <span className="inline-block rtl:rotate-180">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PREDICTION_SPORTS.map((s) => (
            <Link key={s} href={`/${locale}/predictions/${s}`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-accent">
              <span className="text-3xl" aria-hidden>
                {sportEmoji(s)}
              </span>
              <span className="min-w-0">
                <span className="block font-black">{t.live.sports[s]}</span>
                <span className="block truncate text-sm text-muted">
                  {countText(counts[s], t.predictions)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-wrap py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-accent">{t.stats.homeKicker}</p>
            <h2 className="mt-1 text-3xl font-black">{t.stats.insightsTitle}</h2>
          </div>
          <Link href={`/${locale}/results`} className="btn btn-ghost">
            {t.stats.fullCalendar} <span className="inline-block rtl:rotate-180">→</span>
          </Link>
        </div>
        <InsightCards record={record} locale={locale} t={t.stats} limit={4} />
        <div className="card mt-4 p-4">
          <p className="mb-3 text-sm font-semibold text-muted">{t.stats.last7}</p>
          <WeekStrip record={record} locale={locale} t={t.stats} />
        </div>
      </section>

      <section className="page-wrap py-12">
        <h2 className="mb-8 text-3xl font-black">{t.landing.howTitle}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {t.landing.how.map((step, i) => (
            <div key={step.title} className="card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 font-black text-accent">{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-1 text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="page-wrap scroll-mt-20 py-12">
        <h2 className="text-3xl font-black">{t.landing.pricingTitle}</h2>
        <p className="mb-8 mt-2 text-muted">{t.landing.pricingSubtitle}</p>
        <PlanCards plans={plans} locale={locale} t={t} />
      </section>

      <section className="page-wrap py-12">
        <h2 className="mb-6 text-3xl font-black">{t.landing.faqTitle}</h2>
        <div className="grid items-start gap-3 lg:grid-cols-2">
          {t.landing.faq.map((f) => (
            <details key={f.q} className="card group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {f.q}
                <span className="text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
