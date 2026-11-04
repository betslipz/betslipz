import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";
import PlanCards from "@/components/PlanCards";
import RevealSlip from "@/components/RevealSlip";
import { featuredSlip } from "@/lib/featured";
import { getSession } from "@/lib/auth";

type Record = { won: number; lost: number; void: number; partial: number; avg_odds_won: number | null };

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale, t } = await resolveLocale(params);
  const supabase = await createClient();
  const [{ data: plans }, { data: record }, featured, session] = await Promise.all([
    supabase.from("plans").select("*").eq("active", true).order("price_usd"),
    supabase.rpc("track_record", { p_days: 30 }).single<Record>(),
    featuredSlip(),
    getSession(),
  ]);

  const decided = (record?.won ?? 0) + (record?.lost ?? 0) + (record?.partial ?? 0);
  const winRate = decided ? Math.round((((record?.won ?? 0) + (record?.partial ?? 0) * 0.5) / decided) * 100) : 0;
  const settled = decided + (record?.void ?? 0);

  return (
    <>
      <section className="hero-glow">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
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

          <RevealSlip featured={featured} session={session} locale={locale} t={t} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-muted">{t.landing.statsTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: t.landing.winRate, value: `${winRate}%`, accent: true },
            { label: t.landing.settled, value: String(settled) },
            { label: t.landing.avgOdds, value: record?.avg_odds_won ? Number(record.avg_odds_won).toFixed(2) : "—" },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-sm text-muted">{s.label}</p>
              <p className={`mt-1 text-3xl font-black ${s.accent ? "text-accent" : ""}`} dir="ltr">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
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

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-3xl font-black">{t.landing.pricingTitle}</h2>
        <p className="mb-8 mt-2 text-muted">{t.landing.pricingSubtitle}</p>
        <PlanCards plans={(plans ?? []) as Plan[]} locale={locale} t={t} />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-6 text-3xl font-black">{t.landing.faqTitle}</h2>
        <div className="space-y-3">
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
