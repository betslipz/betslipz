"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Plan } from "@/lib/types";
import { PREDICTION_SPORTS, sportEmoji, type Sport } from "@/lib/sports";
import { fmtOdds, fmtUsd } from "@/lib/format";
import { submitPayment } from "@/app/actions/member";
import { FormMessage, Submit } from "./AuthForms";
import LinkedText from "./LinkedText";
import type { Teaser } from "./LockedSlip";

export type MethodInfo = { key: string; details: string };

// What is being bought: one slip, or a plan (VIP, or one sport) for a period.
export type Purchase = { kind: "slip"; slip: Teaser } | { kind: "plan"; plans: Plan[]; initialPlan?: number };

type Choice = "vip" | Sport;
const choiceOf = (p: Plan | undefined): Choice => (p?.tier === "vip" || !p?.sport ? "vip" : p.sport);

export default function SubscribeForm({ locale, t, purchase, methods }: { locale: Locale; t: Dictionary; purchase: Purchase; methods: MethodInfo[] }) {
  const [state, action] = useActionState(submitPayment, undefined);
  const plans = purchase.kind === "plan" ? purchase.plans : [];
  const [planId, setPlanId] = useState(purchase.kind === "plan" ? purchase.initialPlan : undefined);
  const [choice, setChoice] = useState<Choice>(choiceOf(plans.find((p) => p.id === planId)));
  const [method, setMethod] = useState(methods[0]?.key);
  const plan = plans.find((p) => p.id === planId);
  const amount = purchase.kind === "slip" ? purchase.slip.price_usd : plan?.price_usd;
  const methodInfo = methods.find((m) => m.key === method);
  const methodLabels = t.subscribe.methods as Record<string, string>;
  const periods = plans.filter((p) => choiceOf(p) === choice);

  if (state?.message) {
    return <p className="card border-accent/50 bg-accent/10 p-6 text-lg text-accent">✓ {state.message}</p>;
  }

  const pickChoice = (c: Choice) => {
    setChoice(c);
    const same = plans.filter((p) => choiceOf(p) === c);
    setPlanId((same.find((p) => p.duration === plan?.duration) ?? same.find((p) => p.duration === "month") ?? same[0])?.id);
  };
  const option = (active: boolean, vip = false) =>
    `rounded-xl border p-3 text-center transition ${active ? (vip ? "border-vip bg-vip/10" : "border-accent bg-accent/10") : "border-border hover:border-muted"}`;

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {purchase.kind === "slip" ? <input type="hidden" name="slipId" value={purchase.slip.id} /> : <input type="hidden" name="planId" value={planId ?? ""} />}

      {purchase.kind === "slip" ? (
        <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="text-lg font-bold">{t.subscribe.slipTitle}</h2>
            <p className="mt-1 text-muted">
              {purchase.slip.legs > 0 && (
                <>
                  {purchase.slip.legs} {purchase.slip.legs === 1 ? t.common.leg : t.common.legs} ·{" "}
                </>
              )}
              {t.common.totalOdds}{" "}
              <b className="text-text" dir="ltr">
                {fmtOdds(purchase.slip.total_odds)}
              </b>
            </p>
            <p className="mt-1 text-sm text-muted">{t.subscribe.slipNote}</p>
          </div>
          <p className="text-3xl font-black text-accent" dir="ltr">
            {fmtUsd(purchase.slip.price_usd)}
          </p>
        </section>
      ) : (
        <section className="space-y-5">
          <h2 className="text-lg font-bold">{t.subscribe.choosePlan}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <button type="button" onClick={() => pickChoice("vip")} aria-pressed={choice === "vip"} className={`${option(choice === "vip", true)} col-span-2 sm:col-span-1`}>
              <span className="block text-lg font-black text-vip">★ {t.common.vip}</span>
              <span className="block text-xs text-muted">{t.subscribe.vipShort}</span>
            </button>
            {PREDICTION_SPORTS.map((s) => (
              <button key={s} type="button" onClick={() => pickChoice(s)} aria-pressed={choice === s} className={option(choice === s)}>
                <span className="block text-2xl" aria-hidden>
                  {sportEmoji(s)}
                </span>
                <span className="block text-sm font-bold">{t.live.sports[s]}</span>
              </button>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-muted">{t.subscribe.period}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {periods.map((p) => (
                <button key={p.id} type="button" onClick={() => setPlanId(p.id)} aria-pressed={p.id === planId} className={option(p.id === planId, choice === "vip")}>
                  <span className="block text-xs text-muted">{t.common[p.duration]}</span>
                  <span className="block text-xl font-black" dir="ltr">
                    {fmtUsd(p.price_usd)}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted">{choice === "vip" ? t.subscribe.vipIncludes : t.subscribe.sportIncludes.replace("{sport}", t.live.sports[choice])}</p>
        </section>
      )}

      <section className="card space-y-5 p-5">
        <h2 className="text-lg font-bold">{t.subscribe.payTitle}</h2>
        <div>
          <span className="label">{t.subscribe.method}</span>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <label
                key={m.key}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${method === m.key ? "border-accent bg-accent/10" : "border-border"}`}
              >
                <input type="radio" name="method" value={m.key} checked={method === m.key} onChange={() => setMethod(m.key)} className="sr-only" />
                {methodLabels[m.key] ?? m.key}
              </label>
            ))}
          </div>
        </div>

        {amount !== undefined && methodInfo && (
          <div className="rounded-xl border border-dashed border-accent/50 bg-bg p-4">
            <p className="text-sm text-muted">{t.subscribe.amount}</p>
            <p className="text-3xl font-black text-accent" dir="ltr">
              {fmtUsd(amount)}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm" dir="auto">
              {methodInfo.details}
            </p>
          </div>
        )}

        <div>
          <label className="label" htmlFor="reference">{t.subscribe.reference}</label>
          <input className="input" id="reference" name="reference" required minLength={2} maxLength={120} dir="ltr" />
          <p className="mt-1 text-xs text-muted">{t.subscribe.referenceHint}</p>
        </div>
        <div>
          <label className="label" htmlFor="proof">{t.subscribe.proof}</label>
          <input className="input" id="proof" name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="accept" required className="mt-1 accent-[var(--accent)]" />
          <span>
            <LinkedText text={t.subscribe.acceptRefund} links={{ [t.legal.terms]: `/${locale}/terms`, [t.legal.refunds]: `/${locale}/refunds` }} />
          </span>
        </label>
        <FormMessage state={state} />
        <Submit>{t.subscribe.submit}</Submit>
      </section>
    </form>
  );
}
