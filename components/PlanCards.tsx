import Link from "next/link";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Plan } from "@/lib/types";
import { fmtUsd } from "@/lib/format";

const per = { week: "perWeek", month: "perMonth", quarter: "perQuarter", year: "perYear" } as const;

export default function PlanCards({ plans, locale, t }: { plans: Plan[]; locale: Locale; t: Dictionary }) {
  const tiers = [
    { tier: "regular" as const, name: t.common.regular, features: t.landing.regularFeatures },
    { tier: "vip" as const, name: t.common.vip, features: t.landing.vipFeatures },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {tiers.map(({ tier, name, features }) => {
        const tierPlans = plans.filter((p) => p.tier === tier);
        const monthly = tierPlans.find((p) => p.duration === "month");
        const vip = tier === "vip";
        return (
          <div key={tier} className={`card relative flex flex-col p-6 ${vip ? "border-vip/70 shadow-[0_0_40px_-12px_var(--vip)]" : ""}`}>
            {vip && (
              <span className="absolute -top-3 start-6 rounded-full bg-vip px-3 py-1 text-xs font-black text-[#1a1200]">
                ★ {t.landing.popular}
              </span>
            )}
            <h3 className={`text-2xl font-black ${vip ? "text-vip" : "text-accent"}`}>{name}</h3>
            {monthly && (
              <p className="mt-2">
                <span className="text-4xl font-black" dir="ltr">
                  {fmtUsd(monthly.price_usd)}
                </span>{" "}
                <span className="text-muted">{t.common.perMonth}</span>
              </p>
            )}
            <ul className="mt-5 space-y-2 text-sm">
              {features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className={vip ? "text-vip" : "text-accent"}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {tierPlans.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/subscribe?plan=${p.id}`}
                  className={`rounded-xl border p-3 text-center transition hover:-translate-y-0.5 ${
                    vip ? "border-vip/40 hover:border-vip" : "border-border hover:border-accent"
                  }`}
                >
                  <span className="block text-xs text-muted">{t.common[p.duration]}</span>
                  <span className="block text-lg font-extrabold" dir="ltr">
                    {fmtUsd(p.price_usd)}
                  </span>
                  <span className="block text-[11px] text-muted">{t.common[per[p.duration]]}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
