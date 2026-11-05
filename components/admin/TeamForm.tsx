"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Sport } from "@/lib/sports";
import { saveTeam } from "@/app/actions/admin";
import { FormMessage, Submit } from "@/components/AuthForms";

// Add a team or player (or update one with the same name): country code for the flag, optional crest.
export default function TeamForm({ locale, t, sport }: { locale: Locale; t: Dictionary; sport: Sport }) {
  const [state, action] = useActionState(saveTeam, undefined);
  return (
    <form action={action} className="card space-y-4 p-5" key={state?.message}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sport" value={sport} />
      <h2 className="font-bold">
        {t.admin.addTeam} · {t.live.sports[sport]}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="team-name">{t.admin.teamName}</label>
          <input id="team-name" name="name" className="input" required maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="team-country">{t.admin.country}</label>
          <input id="team-country" name="country" className="input" maxLength={6} placeholder="lb, fr, gb-eng" dir="ltr" />
          <p className="mt-1 text-xs text-muted">{t.admin.countryHint}</p>
        </div>
        <div>
          <label className="label" htmlFor="team-league">
            {t.admin.league} ({t.admin.optional})
          </label>
          <input id="team-league" name="league" className="input" maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="team-logo">
            {t.admin.logo} ({t.admin.optional})
          </label>
          <input id="team-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="input" />
        </div>
      </div>
      <FormMessage state={state} />
      <div className="sm:w-48">
        <Submit>{t.common.save}</Submit>
      </div>
    </form>
  );
}
