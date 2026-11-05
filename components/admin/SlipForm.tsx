"use client";

import { useActionState, useRef, useState } from "react";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { Slip } from "@/lib/types";
import { saveSlip } from "@/app/actions/admin";
import { FormMessage, Submit } from "@/components/AuthForms";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import { MARKETS as SPORT_MARKETS, OTHER, chip, joinEvent, splitEvent, toIso, toLocalInput } from "./form-helpers";
import TeamPicker from "./TeamPicker";
import type { Team } from "@/lib/team-images";

type LegDraft = { home: string; away: string; market: string; customMarket: string; pick: string; odds: string; kickoff: string };
type Mode = "typed" | "image";

// Slips use the football markets; the "Other…" chip covers anything else.
const MARKETS = SPORT_MARKETS.football;

const emptyLeg = (): LegDraft => ({ home: "", away: "", market: "1X2", customMarket: "", pick: "", odds: "", kickoff: "" });

function toDraft(l: Slip["slip_legs"][number], keepKickoff: boolean): LegDraft {
  const [home, away] = splitEvent(l.event);
  const preset = MARKETS.some((m) => m.name === l.market);
  return {
    home,
    away,
    market: preset ? l.market : OTHER,
    customMarket: preset ? "" : l.market,
    pick: l.pick,
    odds: String(l.odds),
    kickoff: keepKickoff ? toLocalInput(l.kickoff_at) : "",
  };
}

// legs = 0 means a screenshot slip, whose number of picks we don't know.
function autoTitle(names: Dictionary["admin"]["slipNames"], legs: number) {
  const kind =
    legs === 0 ? names.slip : legs === 1 ? names[1] : legs === 2 ? names[2] : legs === 3 ? names[3] : names.n.replace("{n}", String(legs));
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export default function SlipForm({
  locale,
  t,
  slip,
  template,
  teams,
  tAr,
  tEn,
}: {
  locale: Locale;
  t: Dictionary;
  /** Editing an existing slip. */
  slip?: Slip;
  /** "Duplicate": prefill from another slip but save as a new one. */
  template?: Slip;
  /** Teams and players with crest or flag, offered as you type. */
  teams: Team[];
  tAr: Dictionary["admin"]["slipNames"];
  tEn: Dictionary["admin"]["slipNames"];
}) {
  const source = slip ?? template;
  const [state, action] = useActionState(saveSlip, undefined);
  const [mode, setMode] = useState<Mode>(source && source.slip_legs.length === 0 ? "image" : "typed");
  const [confidence, setConfidence] = useState(source?.confidence ?? 70);
  const [publishAt, setPublishAt] = useState(toLocalInput(slip?.publish_at ?? new Date().toISOString()));
  const [manualOdds, setManualOdds] = useState(source && source.slip_legs.length === 0 ? String(source.total_odds) : "");
  const [legs, setLegs] = useState<LegDraft[]>(
    source?.slip_legs.length ? [...source.slip_legs].sort((a, b) => a.position - b.position).map((l) => toDraft(l, !!slip)) : [emptyLeg()],
  );
  const homeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const total = mode === "image" ? Number(manualOdds) || 1 : legs.reduce((acc, l) => acc * (Number(l.odds) >= 1 ? Number(l.odds) : 1), 1);
  const legCount = mode === "image" ? 0 : legs.length;
  const titleEnAuto = autoTitle(tEn, legCount);
  const titleArAuto = autoTitle(tAr, legCount);

  const update = (i: number, patch: Partial<LegDraft>) => setLegs(legs.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const addLeg = () => {
    setLegs([...legs, emptyLeg()]);
    requestAnimationFrame(() => homeRefs.current[legs.length]?.focus());
  };
  const legsJson = JSON.stringify(
    mode === "image"
      ? []
      : legs.map((l) => ({
          event: joinEvent(l.home, l.away),
          market: l.market === OTHER ? l.customMarket : l.market,
          pick: l.pick,
          odds: Number(l.odds),
          kickoff_at: toIso(l.kickoff),
        })),
  );
  const setPublishFromNow = (hours: number) => setPublishAt(toLocalInput(new Date(Date.now() + hours * 3600_000).toISOString()));
  const tomorrowNoon = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    setPublishAt(toLocalInput(d.toISOString()));
  };
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {slip && <input type="hidden" name="id" value={slip.id} />}
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="legs" value={legsJson} />
      <input type="hidden" name="confidence" value={confidence} />
      <input type="hidden" name="publish_at" value={toIso(publishAt) ?? new Date().toISOString()} />
      <input type="hidden" name="title_en_auto" value={titleEnAuto} />
      <input type="hidden" name="title_ar_auto" value={titleArAuto} />

      {/* 1. How to enter the slip */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-1.5">
        {(["typed", "image"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-2.5 text-sm font-bold ${mode === m ? "bg-accent text-[#04130a]" : "text-muted hover:text-text"}`}
          >
            {m === "typed" ? `✍️ ${t.admin.modeTyped}` : `📷 ${t.admin.modeImage}`}
          </button>
        ))}
      </div>

      {/* 2. Price + publish time */}
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="price">{t.admin.price}</label>
          <input id="price" name="price_usd" type="number" step="0.5" min="0" max="1000" defaultValue={source?.price_usd ?? 3} className="input max-w-40 text-lg font-bold" required dir="ltr" />
          <p className="mt-1 text-xs text-muted">{t.admin.priceHint}</p>
        </div>
        <div>
          <label className="label" htmlFor="publish">{t.admin.publishAt}</label>
          <input id="publish" type="datetime-local" className="input" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} required />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={chip(false)} onClick={() => setPublishFromNow(0)}>{t.admin.now}</button>
            <button type="button" className={chip(false)} onClick={() => setPublishFromNow(1)}>{t.admin.inOneHour}</button>
            <button type="button" className={chip(false)} onClick={tomorrowNoon}>{t.admin.tomorrowNoon}</button>
          </div>
        </div>
      </div>

      {/* 3. The picks, or the screenshot */}
      {mode === "typed" ? (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">{t.admin.legsTitle}</h2>
            <span className="text-sm">
              {t.common.totalOdds}: <b className="text-lg text-accent" dir="ltr">{total.toFixed(2)}</b>
            </span>
          </div>
          <div className="space-y-3">
            {legs.map((leg, i) => {
              const preset = MARKETS.find((m) => m.name === leg.market);
              const picks = preset?.picks(leg.home.trim(), leg.away.trim()) ?? [];
              return (
                <div key={i} className="space-y-3 rounded-xl border border-border bg-bg/40 p-3">
                  <div className="flex items-start gap-2 sm:items-center">
                    <span className="mt-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold sm:mt-0">{i + 1}</span>
                    {/* Stacked on phones, side by side from sm up. */}
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <TeamPicker
                        teams={teams}
                        inputRef={(el) => {
                          homeRefs.current[i] = el;
                        }}
                        placeholder={t.admin.home}
                        value={leg.home}
                        onChange={(name) => update(i, { home: name })}
                        noMatch={t.admin.teamNotListed}
                        required
                      />
                      <span className="hidden text-xs font-bold text-muted sm:block">vs</span>
                      <TeamPicker teams={teams} placeholder={t.admin.away} value={leg.away} onChange={(name) => update(i, { away: name })} noMatch={t.admin.teamNotListed} />
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost shrink-0 px-3"
                      aria-label={t.common.delete}
                      disabled={legs.length === 1}
                      onClick={() => setLegs(legs.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {MARKETS.map((m) => (
                      <button key={m.name} type="button" className={chip(leg.market === m.name)} onClick={() => update(i, { market: m.name, pick: "" })}>
                        {m.name}
                      </button>
                    ))}
                    <button type="button" className={chip(leg.market === OTHER)} onClick={() => update(i, { market: OTHER, pick: "" })}>
                      {t.admin.otherMarket}
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1fr_7rem_12rem]">
                    <div className="space-y-2">
                      {leg.market === OTHER && (
                        <input
                          className="input"
                          placeholder={t.admin.marketName}
                          value={leg.customMarket}
                          onChange={(e) => update(i, { customMarket: e.target.value })}
                          required
                        />
                      )}
                      {picks.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {picks.map((p) => (
                            <button key={p} type="button" className={chip(leg.pick === p)} onClick={() => update(i, { pick: p })}>
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                      <input className="input" placeholder={t.admin.pick} value={leg.pick} onChange={(e) => update(i, { pick: e.target.value })} required />
                    </div>
                    <input
                      className="input self-end text-center text-lg font-bold"
                      placeholder={t.common.odds}
                      inputMode="decimal"
                      type="number"
                      step="0.01"
                      min="1"
                      value={leg.odds}
                      onChange={(e) => update(i, { odds: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLeg();
                        }
                      }}
                      required
                      dir="ltr"
                    />
                    <label className="self-end">
                      <span className="mb-1 block text-xs text-muted">
                        {t.common.kickoff} ({t.admin.optional})
                      </span>
                      <input className="input" type="datetime-local" value={leg.kickoff} onChange={(e) => update(i, { kickoff: e.target.value })} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button type="button" className="btn btn-ghost text-sm" onClick={addLeg}>
              + {t.admin.addLeg}
            </button>
            <p className="text-xs text-muted">{t.admin.enterAddsLeg}</p>
          </div>
        </div>
      ) : (
        <div className="card space-y-4 p-5">
          <p className="text-sm text-muted">{t.admin.modeImageHint}</p>
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <div>
              <label className="label" htmlFor="image">
                {t.admin.imageRequired}
                {slip?.image_path && ` (${t.admin.optional})`}
              </label>
              <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" className="input" required={!slip?.image_path} />
            </div>
            <div>
              <label className="label" htmlFor="total_odds">{t.common.totalOdds}</label>
              <input
                id="total_odds"
                name="total_odds"
                className="input text-center text-lg font-bold"
                inputMode="decimal"
                type="number"
                step="0.01"
                min="1"
                value={manualOdds}
                onChange={(e) => setManualOdds(e.target.value)}
                required
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Confidence, stake, code */}
      <div className="card grid gap-5 p-5 md:grid-cols-[auto_1fr_1fr]">
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
        <div>
          <label className="label" htmlFor="stake">{t.common.stake} ({t.common.units})</label>
          <input id="stake" name="stake_units" type="number" step="0.5" min="0.5" max="10" defaultValue={source?.stake_units ?? 1} className="input max-w-40" required />
        </div>
      </div>

      {/* 5. Title and analysis (all optional) */}
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="title_en">
            {t.admin.titleEn} ({t.admin.optional})
          </label>
          <input id="title_en" name="title_en" className="input" defaultValue={slip?.title_en ?? ""} maxLength={140} placeholder={titleEnAuto} />
        </div>
        <div>
          <label className="label" htmlFor="title_ar">
            {t.admin.titleAr} ({t.admin.optional})
          </label>
          <input id="title_ar" name="title_ar" className="input" defaultValue={slip?.title_ar ?? ""} maxLength={140} dir="rtl" placeholder={titleArAuto} />
        </div>
        <div>
          <label className="label" htmlFor="notes_en">
            {t.admin.notesEn} ({t.admin.optional})
          </label>
          <textarea id="notes_en" name="notes_en" rows={3} defaultValue={source?.notes_en ?? ""} className="input" maxLength={4000} />
        </div>
        <div>
          <label className="label" htmlFor="notes_ar">
            {t.admin.notesAr} ({t.admin.optional})
          </label>
          <textarea id="notes_ar" name="notes_ar" rows={3} defaultValue={source?.notes_ar ?? ""} className="input" maxLength={4000} dir="rtl" />
        </div>
        {mode === "typed" && (
          <div className="md:col-span-2">
            <label className="label" htmlFor="image">{t.admin.image}</label>
            <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" className="input" />
          </div>
        )}
      </div>

      <FormMessage state={state} />
      <div className="sticky bottom-3 z-10 sm:w-72">
        <Submit>
          {t.common.save} · <span dir="ltr">{total.toFixed(2)}</span>
        </Submit>
      </div>
    </form>
  );
}
