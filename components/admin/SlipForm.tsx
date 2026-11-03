"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Slip } from "@/lib/types";
import { saveSlip } from "@/app/actions/admin";
import { FormMessage, Submit } from "@/components/AuthForms";
import ConfidenceMeter from "@/components/ConfidenceMeter";

type LegDraft = { event: string; market: string; pick: string; odds: string; kickoff: string };

// <input type="datetime-local"> works in the browser's local time; convert at the edges.
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

const emptyLeg: LegDraft = { event: "", market: "1X2", pick: "", odds: "", kickoff: "" };

export default function SlipForm({ locale, t, slip }: { locale: Locale; t: Dictionary; slip?: Slip }) {
  const [state, action] = useActionState(saveSlip, undefined);
  const [confidence, setConfidence] = useState(slip?.confidence ?? 70);
  const [publishAt, setPublishAt] = useState(toLocalInput(slip?.publish_at ?? new Date().toISOString()));
  const [legs, setLegs] = useState<LegDraft[]>(
    slip?.slip_legs.length
      ? [...slip.slip_legs]
          .sort((a, b) => a.position - b.position)
          .map((l) => ({ event: l.event, market: l.market, pick: l.pick, odds: String(l.odds), kickoff: toLocalInput(l.kickoff_at) }))
      : [{ ...emptyLeg }],
  );

  const total = legs.reduce((acc, l) => acc * (Number(l.odds) >= 1 ? Number(l.odds) : 1), 1);
  const update = (i: number, field: keyof LegDraft, value: string) => setLegs(legs.map((l, j) => (j === i ? { ...l, [field]: value } : l)));
  const legsJson = JSON.stringify(
    legs.map((l) => ({ event: l.event, market: l.market, pick: l.pick, odds: Number(l.odds), kickoff_at: toIso(l.kickoff) })),
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {slip && <input type="hidden" name="id" value={slip.id} />}
      <input type="hidden" name="legs" value={legsJson} />
      <input type="hidden" name="confidence" value={confidence} />
      <input type="hidden" name="publish_at" value={toIso(publishAt) ?? new Date().toISOString()} />

      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <div>
          <span className="label">{t.admin.tier}</span>
          <div className="flex gap-2">
            {(["regular", "vip"] as const).map((tier) => (
              <label key={tier} className="flex-1 cursor-pointer">
                <input type="radio" name="tier" value={tier} defaultChecked={(slip?.tier ?? "regular") === tier} className="peer sr-only" />
                <span
                  className={`block rounded-lg border border-border p-2 text-center font-bold ${
                    tier === "vip" ? "peer-checked:border-vip peer-checked:bg-vip/15 peer-checked:text-vip" : "peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:text-accent"
                  }`}
                >
                  {tier === "vip" ? `★ ${t.common.vip}` : t.common.regular}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="publish">{t.admin.publishAt}</label>
          <input id="publish" type="datetime-local" className="input" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="title_en">{t.admin.titleEn}</label>
          <input id="title_en" name="title_en" className="input" defaultValue={slip?.title_en} required maxLength={140} placeholder="Saturday Premier League treble" />
        </div>
        <div>
          <label className="label" htmlFor="title_ar">{t.admin.titleAr}</label>
          <input id="title_ar" name="title_ar" className="input" defaultValue={slip?.title_ar ?? ""} maxLength={140} dir="rtl" />
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">{t.admin.legsTitle}</h2>
          <span className="text-sm">
            {t.common.totalOdds}: <b className="text-accent" dir="ltr">{total.toFixed(2)}</b>
          </span>
        </div>
        <div className="space-y-3">
          {legs.map((leg, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[2fr_1fr_1fr_0.7fr_1.2fr_auto]">
              <input className="input" placeholder={t.admin.event} value={leg.event} onChange={(e) => update(i, "event", e.target.value)} required />
              <input className="input" placeholder={t.admin.market} value={leg.market} onChange={(e) => update(i, "market", e.target.value)} required />
              <input className="input" placeholder={t.admin.pick} value={leg.pick} onChange={(e) => update(i, "pick", e.target.value)} required />
              <input className="input" placeholder={t.common.odds} type="number" step="0.01" min="1" value={leg.odds} onChange={(e) => update(i, "odds", e.target.value)} required dir="ltr" />
              <input className="input" type="datetime-local" title={t.common.kickoff} value={leg.kickoff} onChange={(e) => update(i, "kickoff", e.target.value)} />
              <button type="button" className="btn btn-ghost px-3" aria-label="Remove" disabled={legs.length === 1} onClick={() => setLegs(legs.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost mt-3 text-sm" onClick={() => setLegs([...legs, { ...emptyLeg }])}>
          + {t.admin.addLeg}
        </button>
      </div>

      <div className="card grid gap-5 p-5 md:grid-cols-[auto_1fr_1fr]">
        <ConfidenceMeter value={confidence} label={t.common.confidence} size={88} />
        <div>
          <label className="label" htmlFor="confidence">
            {t.common.confidence}: <b className="text-text">{confidence}%</b>
          </label>
          <input id="confidence" type="range" min={0} max={100} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="stake">{t.common.stake} ({t.common.units})</label>
            <input id="stake" name="stake_units" type="number" step="0.5" min="0.5" max="10" defaultValue={slip?.stake_units ?? 1} className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="code">{t.common.bookingCode}</label>
            <input id="code" name="betarabia_code" defaultValue={slip?.betarabia_code ?? ""} className="input font-mono" maxLength={60} dir="ltr" />
          </div>
        </div>
      </div>

      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="notes_en">{t.admin.notesEn}</label>
          <textarea id="notes_en" name="notes_en" rows={4} defaultValue={slip?.notes_en ?? ""} className="input" maxLength={4000} />
        </div>
        <div>
          <label className="label" htmlFor="notes_ar">{t.admin.notesAr}</label>
          <textarea id="notes_ar" name="notes_ar" rows={4} defaultValue={slip?.notes_ar ?? ""} className="input" maxLength={4000} dir="rtl" />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="image">{t.admin.image}</label>
          <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" className="input" />
        </div>
      </div>

      <FormMessage state={state} />
      <div className="sm:w-60">
        <Submit>{t.common.save}</Submit>
      </div>
    </form>
  );
}
