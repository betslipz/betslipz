import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { PREDICTION_SELECT, SLIP_SELECT, type Prediction, type Slip } from "@/lib/types";
import { PREDICTION_SPORTS, isSport, sportEmoji } from "@/lib/sports";
import { addDays, dayKey, isStatsSource, statsText, trackRecord, type StatsSource } from "@/lib/stats";
import { fmtDay } from "@/lib/format";
import SlipCard from "@/components/SlipCard";
import PredictionList from "@/components/PredictionList";
import { InsightCards, PeriodTotals, TallyCards, WinCalendar } from "@/components/stats/StatsWidgets";

const VIEWS = ["day", "week", "month"] as const;
type View = (typeof VIEWS)[number];

export default async function ResultsPage({ params, searchParams }: PageProps<"/[locale]/results">) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const view: View = VIEWS.find((v) => v === one(sp.view)) ?? "day";
  const source: StatsSource = isStatsSource(one(sp.source)) ? (one(sp.source) as StatsSource) : "predictions";
  const ts = statsText(t, source);
  const record = await trackRecord(source);
  const month = /^\d{4}-\d{2}$/.test(one(sp.month) ?? "") && one(sp.month)! <= record.today.slice(0, 7) ? one(sp.month)! : record.today.slice(0, 7);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.day) ?? "") ? one(sp.day)! : undefined;

  const href = (q: { view?: View; month?: string; day?: string; source?: StatsSource }) => {
    const p = new URLSearchParams();
    const src = q.source ?? source;
    const v = q.view ?? view;
    const m = q.month ?? month;
    if (src !== "predictions") p.set("source", src);
    if (v !== "day") p.set("view", v);
    if (m !== record.today.slice(0, 7)) p.set("month", m);
    const d = "day" in q ? q.day : q.view ? day : undefined;
    if (d && !q.source) p.set("day", d);
    const s = p.toString();
    return `/${locale}/results${s ? `?${s}` : ""}`;
  };

  const supabase = await createClient();
  // RLS returns only settled slips and predictions to the public. A picked day widens the window by a day each side, then filters in Beirut time.
  const table: string = source === "slips" ? "slips" : "predictions";
  const columns: string = source === "slips" ? SLIP_SELECT : PREDICTION_SELECT;
  let query = supabase.from(table).select(columns).neq("status", "pending");
  if (isSport(source)) query = query.eq("sport", source);
  query = day
    ? query.gte("publish_at", `${addDays(day, -1)}T00:00:00Z`).lte("publish_at", `${addDays(day, 1)}T23:59:59Z`).order("publish_at", { ascending: false })
    : query.order("settled_at", { ascending: false }).limit(60);
  const { data } = await query;
  const items = ((data ?? []) as unknown as { publish_at: string }[]).filter((x) => !day || dayKey(x.publish_at) === day);
  const slips = source === "slips" ? (items as Slip[]) : [];
  const predictions = source === "slips" ? [] : (items as Prediction[]);

  // Screenshot-only slips need their image to show anything; storage RLS allows it once settled.
  const paths = slips.filter((s) => s.slip_legs.length === 0 && s.image_path).map((s) => s.image_path as string);
  const signed = paths.length ? ((await supabase.storage.from("slip-images").createSignedUrls(paths, 600)).data ?? []) : [];
  const imageFor = (p: string | null) => signed.find((s) => s.path === p)?.signedUrl ?? undefined;

  const rows = view === "day" ? record.dailyList(14) : view === "week" ? record.weeks(12) : record.months(12);
  const sources: { key: StatsSource; label: string }[] = [
    { key: "predictions", label: t.results.allPredictions },
    ...PREDICTION_SPORTS.map((s) => ({ key: s, label: `${sportEmoji(s)} ${t.live.sports[s]}` })),
    { key: "slips", label: `🎟 ${t.nav.slips}` },
  ];
  const empty = items.length === 0;

  return (
    <div className="page-wrap space-y-10 py-10">
      <div>
        <h1 className="text-3xl font-black">{t.results.title}</h1>
        <p className="mt-2 text-muted">{t.results.subtitle}</p>
        <nav aria-label={t.results.title} className="-mx-4 mt-5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-2">
            {sources.map((s) => (
              <li key={s.key}>
                <Link
                  href={href({ source: s.key })}
                  scroll={false}
                  aria-current={s.key === source ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold ${
                    s.key === source ? "border-accent bg-accent text-[#04130a]" : "border-border bg-surface hover:border-muted"
                  }`}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-black">{ts.insightsTitle}</h2>
        <InsightCards record={record} locale={locale} t={ts} />
      </section>

      <section className="space-y-4">
        <TallyCards record={record} t={ts} />
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 text-2xl font-black">{ts.calendarTitle}</h2>
          <WinCalendar record={record} month={month} locale={locale} t={ts} href={href} selected={day} />
        </div>
        <div id="totals" className="scroll-mt-20 xl:pt-12">
          <PeriodTotals rows={rows} view={view} locale={locale} t={ts} href={href} />
        </div>
      </section>

      <section id="slips" className="scroll-mt-20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">{day ? ts.dayFilter.replace("{day}", fmtDay(day, locale, { weekday: "long", day: "numeric", month: "long" })) : ts.recentSlips}</h2>
          {day && (
            <Link href={href({ day: undefined }) + "#slips"} className="btn btn-ghost text-sm">
              {ts.showAll}
            </Link>
          )}
        </div>
        {empty ? (
          <p className="card p-8 text-center text-muted">{t.common.noData}</p>
        ) : source === "slips" ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {slips.map((s) => (
              <SlipCard key={s.id} slip={s} locale={locale} t={t} imageUrl={imageFor(s.image_path)} compact />
            ))}
          </div>
        ) : (
          <PredictionList predictions={predictions} locale={locale} t={t} showSport={source === "predictions"} />
        )}
      </section>
    </div>
  );
}
