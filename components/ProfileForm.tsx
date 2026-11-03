"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import { updateProfile } from "@/app/actions/member";
import { FormMessage, Submit } from "./AuthForms";

export default function ProfileForm({ locale, t, fullName, phone }: { locale: Locale; t: Dictionary; fullName: string; phone: string }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label className="label" htmlFor="fullName">{t.auth.fullName}</label>
        <input className="input" id="fullName" name="fullName" defaultValue={fullName} required minLength={2} maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="phone">{t.account.phone}</label>
        <input className="input" id="phone" name="phone" defaultValue={phone} maxLength={40} dir="ltr" />
      </div>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <div className="sm:w-40">
        <Submit>{t.common.save}</Submit>
      </div>
    </form>
  );
}
