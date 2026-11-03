"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Plan } from "@/lib/types";
import { fmtUsd } from "@/lib/format";
import { submitPayment } from "@/app/actions/member";
import { FormMessage, Submit } from "./AuthForms";

export type MethodInfo = { key: string; details: string };

export default function SubscribeForm({
  locale,
  t,
  plans,
  methods,
  initialPlan,
}: {
  locale: Locale;
  t: Dictionary;
  plans: Plan[];
  methods: MethodInfo[];
  initialPlan?: number;
}) {
  const [state, action] = useActionState(submitPayment, undefined);
  const [planId, setPlanId] = useState(initialPlan);
  const [method, setMethod] = useState(methods[0]?.key);
  const plan = plans.find((p) => p.id === planId);
  const methodInfo = methods.find((m) => m.key === method);
  const methodLabels = t.subscribe.methods as Record<string, string>;

  if (state?.message) {
    return <p className="card border-accent/50 bg-accent/10 p-6 text-lg text-accent">✓ {state.message}</p>;
  }

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="planId" value={planId ?? ""} />

      <section>
        <h2 className="mb-4 text-lg font-bold">{t.subscribe.choosePlan}</h2>
        {(["regular", "vip"] as const).map((tier) => (
          <div key={tier} className="mb-4">
            <p className={`mb-2 text-sm font-bold ${tier === "vip" ? "text-vip" : "text-accent"}`}>
              {tier === "vip" ? `★ ${t.common.vip}` : t.common.regular}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {plans
                .filter((p) => p.tier === tier)
                .map((p) => {
                  const selected = p.id === planId;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPlanId(p.id)}
                      aria-pressed={selected}
                      className={`rounded-xl border p-3 text-center transition ${
                        selected ? (tier === "vip" ? "border-vip bg-vip/10" : "border-accent bg-accent/10") : "border-border hover:border-muted"
                      }`}
                    >
                      <span className="block text-xs text-muted">{t.common[p.duration]}</span>
                      <span className="block text-xl font-black" dir="ltr">
                        {fmtUsd(p.price_usd)}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

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

        {plan && methodInfo && (
          <div className="rounded-xl border border-dashed border-accent/50 bg-bg p-4">
            <p className="text-sm text-muted">{t.subscribe.amount}</p>
            <p className="text-3xl font-black text-accent" dir="ltr">
              {fmtUsd(plan.price_usd)}
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
        <FormMessage state={state} />
        <Submit>{t.subscribe.submit}</Submit>
      </section>
    </form>
  );
}
