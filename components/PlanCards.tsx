import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Plan } from "@/lib/types";
import { PREDICTION_SPORTS, sportEmoji } from "@/lib/sports";
import { fmtUsd } from "@/lib/format";

const per = { week: "perWeek", month: "perMonth", quarter: "perQuarter", year: "perYear" } as const;

// Pricing: VIP (everything), one plan per sport, and single slips without any plan.
export default function PlanCards({ plans, locale, t }: { plans: Plan[]; locale: Locale; t: Dictionary }) {
  const vipPlans = plans.filter((p) => p.tier === "vip");
  const vipMonth = vipPlans.find((p) => p.duration === "month");
  const monthly = (sport: string) => plans.find((p) => p.sport === sport && p.duration === "month");

  return (
    <div className="space-y-6">
      <div className="card relative flex flex-col gap-6 border-vip/70 p-6 shadow-[0_0_40px_-12px_var(--vip)] lg:flex-row lg:items-center">
        <span className="absolute -top-3 start-6 rounded-full bg-vip px-3 py-1 text-xs font-black text-[#1a1200]">★ {t.landing.popular}</span>
        <div className="lg:w-80">
          <h3 className="text-2xl font-black text-vip">★ {t.common.vip}</h3>
          {vipMonth && (
            <p className="mt-2">
              <span className="text-4xl font-black" dir="ltr">
                {fmtUsd(vipMonth.price_usd)}
              </span>{" "}
              <span className="text-muted">{t.common.perMonth}</span>
            </p>
          )}
          <ul className="mt-4 space-y-2 text-sm">
            {t.landing.vipFeatures.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-vip">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          {vipPlans.map((p) => (
            <Link key={p.id} href={`/${locale}/subscribe?plan=${p.id}`} className="rounded-xl border border-vip/40 p-3 text-center transition hover:-translate-y-0.5 hover:border-vip">
              <span className="block text-xs text-muted">{t.common[p.duration]}</span>
              <span className="block text-lg font-extrabold" dir="ltr">
                {fmtUsd(p.price_usd)}
              </span>
              <span className="block text-[11px] text-muted">{t.common[per[p.duration]]}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-black">{t.landing.sportPlanTitle}</h3>
        <p className="mb-4 mt-1 text-muted">{t.landing.sportPlanText}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PREDICTION_SPORTS.map((s) => {
            const month = monthly(s);
            return (
              <Link
                key={s}
                href={`/${locale}/subscribe?sport=${s}`}
                className="card flex flex-col items-center gap-1 p-5 text-center transition hover:-translate-y-0.5 hover:border-accent"
              >
                <span className="text-4xl" aria-hidden>
                  {sportEmoji(s)}
                </span>
                <span className="mt-1 font-black">{t.live.sports[s]}</span>
                {month && (
                  <span className="text-sm text-muted">
                    <b className="text-lg text-accent" dir="ltr">
                      {fmtUsd(month.price_usd)}
                    </b>{" "}
                    {t.common.perMonth}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h3 className="text-lg font-black">🎟 {t.landing.slipsTitle}</h3>
          <p className="mt-1 text-muted">{t.landing.slipsText}</p>
        </div>
        <Link href={`/${locale}/slips`} className="btn btn-ghost border border-border">
          {t.nav.slips} <span className="inline-block rtl:rotate-180">→</span>
        </Link>
      </div>
    </div>
  );
}
