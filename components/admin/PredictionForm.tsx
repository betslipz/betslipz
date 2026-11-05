"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Prediction } from "@/lib/types";
import { PREDICTION_SPORTS, sportEmoji, type Sport } from "@/lib/sports";
import { savePrediction } from "@/app/actions/admin";
import { FormMessage, Submit } from "@/components/AuthForms";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import { MARKETS, OTHER, chip, joinEvent, splitEvent, toIso, toLocalInput } from "./form-helpers";

// Tennis and darts are player against player; football and basketball are team against team.
const isDuel = (sport: Sport) => sport === "tennis" || sport === "darts";

export default function PredictionForm({
  locale,
  t,
  prediction,
  initialSport,
  names,
}: {
  locale: Locale;
  t: Dictionary;
  /** Editing an existing prediction. */
  prediction?: Prediction;
  /** "Save and add another" keeps the sport of the last one. */
  initialSport?: Sport;
  /** Team and player names used before, offered as suggestions. */
  names: string[];
}) {
  const [state, action] = useActionState(savePrediction, undefined);
  const [sport, setSport] = useState<Sport>(prediction?.sport ?? initialSport ?? "football");
  const [home0, away0] = prediction ? splitEvent(prediction.event) : ["", ""];
  const [home, setHome] = useState(home0);
  const [away, setAway] = useState(away0);
  const markets = MARKETS[sport];
  const presetMarket = prediction && markets.some((m) => m.name === prediction.market);
  const [market, setMarket] = useState(prediction ? (presetMarket ? prediction.market : OTHER) : markets[0].name);
  const [customMarket, setCustomMarket] = useState(prediction && !presetMarket ? prediction.market : "");
  const [pick, setPick] = useState(prediction?.pick ?? "");
  const [confidence, setConfidence] = useState(prediction?.confidence ?? 70);
  const [kickoff, setKickoff] = useState(toLocalInput(prediction?.kickoff_at));
  const [publishAt, setPublishAt] = useState(toLocalInput(prediction?.publish_at ?? new Date().toISOString()));

  const picks = markets.find((m) => m.name === market)?.picks(home.trim(), away.trim()) ?? [];
  const duel = isDuel(sport);
  const changeSport = (s: Sport) => {
    setSport(s);
    setMarket(MARKETS[s][0].name);
    setPick("");
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {prediction && <input type="hidden" name="id" value={prediction.id} />}
      <input type="hidden" name="sport" value={sport} />
      <input type="hidden" name="event" value={joinEvent(home, away)} />
      <input type="hidden" name="market" value={market === OTHER ? customMarket : market} />
      <input type="hidden" name="confidence" value={confidence} />
      <input type="hidden" name="kickoff_at" value={toIso(kickoff) ?? ""} />
      <input type="hidden" name="publish_at" value={toIso(publishAt) ?? new Date().toISOString()} />

      {/* 1. Sport */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-1.5 sm:grid-cols-4">
        {PREDICTION_SPORTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => changeSport(s)}
            aria-pressed={sport === s}
            className={`rounded-lg px-3 py-2.5 text-sm font-bold ${sport === s ? "bg-accent text-[#04130a]" : "text-muted hover:text-text"}`}
          >
            {sportEmoji(s)} {t.live.sports[s]}
          </button>
        ))}
      </div>

      {/* 2. The game */}
      <div className="card space-y-4 p-5">
        <datalist id="names">
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <input className="input" list="names" placeholder={duel ? t.admin.player1 : t.admin.home} value={home} onChange={(e) => setHome(e.target.value)} required />
          <span className="hidden text-xs font-bold text-muted sm:block">vs</span>
          <input className="input" list="names" placeholder={duel ? t.admin.player2 : t.admin.away} value={away} onChange={(e) => setAway(e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="competition">
              {t.admin.competition} ({t.admin.optional})
            </label>
            <input id="competition" name="competition" className="input" defaultValue={prediction?.competition ?? ""} maxLength={120} placeholder={t.admin.competitionHint} />
          </div>
          <div>
            <label className="label" htmlFor="kickoff">{t.common.kickoff}</label>
            <input id="kickoff" type="datetime-local" className="input" value={kickoff} onChange={(e) => setKickoff(e.target.value)} required />
          </div>
        </div>
      </div>

      {/* 3. The pick */}
      <div className="card space-y-3 p-5">
        <span className="label">{t.admin.market}</span>
        <div className="flex flex-wrap gap-2">
          {markets.map((m) => (
            <button key={m.name} type="button" className={chip(market === m.name)} onClick={() => (setMarket(m.name), setPick(""))}>
              {m.name}
            </button>
          ))}
          <button type="button" className={chip(market === OTHER)} onClick={() => (setMarket(OTHER), setPick(""))}>
            {t.admin.otherMarket}
          </button>
        </div>
        {market === OTHER && (
          <input className="input" placeholder={t.admin.marketName} value={customMarket} onChange={(e) => setCustomMarket(e.target.value)} required />
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-2">
            {picks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {picks.map((p) => (
                  <button key={p} type="button" className={chip(pick === p)} onClick={() => setPick(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}
            <input name="pick" className="input" placeholder={t.admin.pick} value={pick} onChange={(e) => setPick(e.target.value)} required maxLength={80} />
          </div>
          <input
            name="odds"
            className="input self-end text-center text-lg font-bold"
            placeholder={t.common.odds}
            inputMode="decimal"
            type="number"
            step="0.01"
            min="1"
            defaultValue={prediction?.odds ?? ""}
            required
            dir="ltr"
          />
        </div>
      </div>

      {/* 4. Confidence */}
      <div className="card grid gap-5 p-5 md:grid-cols-[auto_1fr]">
        <ConfidenceMeter value={confidence} label={t.common.confidence} size={88} />
        <div>
          <label className="label" htmlFor="confidence">
            {t.common.confidence}: <b className="text-text">{confidence}%</b>
          </label>
          <input id="confidence" type="range" min={0} max={100} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          <div className="mt-2 flex flex-wrap gap-2">
            {[60, 70, 80, 90].map((v) => (
              <button key={v} type="button" className={chip(confidence === v)} onClick={() => setConfidence(v)} dir="ltr">
                {v}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Publish time and analysis */}
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label" htmlFor="publish">{t.admin.publishAt}</label>
          <input id="publish" type="datetime-local" className="input max-w-xs" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} required />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={chip(false)} onClick={() => setPublishAt(toLocalInput(new Date().toISOString()))}>
              {t.admin.now}
            </button>
            <button type="button" className={chip(false)} onClick={() => setPublishAt(toLocalInput(new Date(Date.now() + 3600_000).toISOString()))}>
              {t.admin.inOneHour}
            </button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes_en">
            {t.admin.notesEn} ({t.admin.optional})
          </label>
          <textarea id="notes_en" name="notes_en" rows={3} defaultValue={prediction?.notes_en ?? ""} className="input" maxLength={4000} />
        </div>
        <div>
          <label className="label" htmlFor="notes_ar">
            {t.admin.notesAr} ({t.admin.optional})
          </label>
          <textarea id="notes_ar" name="notes_ar" rows={3} defaultValue={prediction?.notes_ar ?? ""} className="input" maxLength={4000} dir="rtl" />
        </div>
      </div>

      <FormMessage state={state} />
      <div className="sticky bottom-3 z-10 flex flex-wrap gap-2">
        <div className="sm:w-56">
          <Submit>{t.common.save}</Submit>
        </div>
        {!prediction && (
          <button name="next" value="new" className="btn btn-ghost border border-border bg-surface">
            {t.admin.saveAndAdd}
          </button>
        )}
      </div>
    </form>
  );
}
