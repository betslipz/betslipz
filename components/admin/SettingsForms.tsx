"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Plan } from "@/lib/types";
import { savePrices, savePaymentMethods, saveContact } from "@/app/actions/admin";
import { FormMessage, Submit } from "@/components/AuthForms";

export function PricesForm({ locale, t, plans }: { locale: Locale; t: Dictionary; plans: Plan[] }) {
  const [state, action] = useActionState(savePrices, undefined);
  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="locale" value={locale} />
      <h2 className="font-bold">{t.admin.prices}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-3">
            <p className={`text-sm font-bold ${p.tier === "vip" ? "text-vip" : "text-accent"}`}>
              {t.common[p.tier]} · {t.common[p.duration]}
            </p>
            <input name={`price:${p.id}`} type="number" step="0.01" min="0" defaultValue={p.price_usd} className="input mt-2" dir="ltr" />
            <label className="mt-2 flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name={`active:${p.id}`} defaultChecked={p.active} /> {t.admin.enabled}
            </label>
          </div>
        ))}
      </div>
      <FormMessage state={state} />
      <div className="sm:w-40">
        <Submit>{t.common.save}</Submit>
      </div>
    </form>
  );
}

export function PaymentMethodsForm({
  locale,
  t,
  methods,
}: {
  locale: Locale;
  t: Dictionary;
  methods: Record<string, { enabled: boolean; details: string }>;
}) {
  const [state, action] = useActionState(savePaymentMethods, undefined);
  const labels = t.subscribe.methods as Record<string, string>;
  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="locale" value={locale} />
      <h2 className="font-bold">{t.admin.paymentInstructions}</h2>
      {["whish", "omt", "usdt", "cash", "mock"].map((key) => (
        <div key={key} className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-start">
          <label className="flex items-center gap-2 pt-2 font-semibold">
            <input type="checkbox" name={`enabled:${key}`} defaultChecked={methods[key]?.enabled} />
            {labels[key]}
          </label>
          <textarea name={`details:${key}`} rows={2} defaultValue={methods[key]?.details ?? ""} className="input" maxLength={500} dir="auto" />
        </div>
      ))}
      <FormMessage state={state} />
      <div className="sm:w-40">
        <Submit>{t.common.save}</Submit>
      </div>
    </form>
  );
}

export function ContactForm({ locale, t, contact }: { locale: Locale; t: Dictionary; contact: { email?: string; whatsapp?: string } }) {
  const [state, action] = useActionState(saveContact, undefined);
  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <h2 className="font-bold">{t.admin.contactTitle}</h2>
        <p className="mt-1 text-sm text-muted">{t.admin.contactHint}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-email">{t.admin.contactEmail}</label>
          <input id="contact-email" name="email" type="email" defaultValue={contact.email ?? ""} className="input" maxLength={254} dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="contact-whatsapp">{t.admin.contactWhatsapp}</label>
          <input id="contact-whatsapp" name="whatsapp" type="tel" defaultValue={contact.whatsapp ?? ""} className="input" maxLength={40} dir="ltr" />
        </div>
      </div>
      <FormMessage state={state} />
      <div className="sm:w-40">
        <Submit>{t.common.save}</Submit>
      </div>
    </form>
  );
}
