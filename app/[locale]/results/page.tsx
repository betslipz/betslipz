import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import { addDays, dayKey, trackRecord } from "@/lib/stats";
import { fmtDay } from "@/lib/format";
import SlipCard from "@/components/SlipCard";
import { InsightCards, PeriodTotals, TallyCards, WinCalendar } from "@/components/stats/StatsWidgets";

const VIEWS = ["day", "week", "month"] as const;
type View = (typeof VIEWS)[number];

export default async function ResultsPage({ params, searchParams }: PageProps<"/[locale]/results">) {
  const { locale, t } = await resolveLocale(params);
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const view: View = VIEWS.find((v) => v === one(sp.view)) ?? "day";
  const record = await trackRecord();
  const month = /^\d{4}-\d{2}$/.test(one(sp.month) ?? "") && one(sp.month)! <= record.today.slice(0, 7) ? one(sp.month)! : record.today.slice(0, 7);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.day) ?? "") ? one(sp.day)! : undefined;

  const href = (q: { view?: View; month?: string; day?: string }) => {
    const p = new URLSearchParams();
    const v = q.view ?? view;
    const m = q.month ?? month;
    if (v !== "day") p.set("view", v);
    if (m !== record.today.slice(0, 7)) p.set("month", m);
    const d = "day" in q ? q.day : q.view ? day : undefined;
    if (d) p.set("day", d);
    const s = p.toString();
    return `/${locale}/results${s ? `?${s}` : ""}`;
  };

  const supabase = await createClient();
  // RLS returns only settled slips to the public. A picked day widens the window by a day each side, then filters in Beirut time.
  let query = supabase.from("slips").select(SLIP_SELECT).neq("status", "pending");
  query = day
    ? query.gte("publish_at", `${addDays(day, -1)}T00:00:00Z`).lte("publish_at", `${addDays(day, 1)}T23:59:59Z`).order("publish_at", { ascending: false })
    : query.order("settled_at", { ascending: false }).limit(60);
  const { data } = await query;
  const slips = ((data ?? []) as Slip[]).filter((s) => !day || dayKey(s.publish_at) === day);
  // Screenshot-only slips need their image to show anything; storage RLS allows it once settled.
  const paths = slips.filter((s) => s.slip_legs.length === 0 && s.image_path).map((s) => s.image_path as string);
  const signed = paths.length ? ((await supabase.storage.from("slip-images").createSignedUrls(paths, 600)).data ?? []) : [];
  const imageFor = (p: string | null) => signed.find((s) => s.path === p)?.signedUrl ?? undefined;

  const rows = view === "day" ? record.dailyList(14) : view === "week" ? record.weeks(12) : record.months(12);

  return (
    <div className="page-wrap space-y-10 py-10">
      <div>
        <h1 className="text-3xl font-black">{t.results.title}</h1>
        <p className="mt-2 text-muted">{t.results.subtitle}</p>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-black">{t.stats.insightsTitle}</h2>
        <InsightCards record={record} locale={locale} t={t.stats} />
      </section>

      <section className="space-y-4">
        <TallyCards record={record} t={t.stats} />
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 text-2xl font-black">{t.stats.calendarTitle}</h2>
          <WinCalendar record={record} month={month} locale={locale} t={t.stats} href={href} selected={day} />
        </div>
        <div id="totals" className="scroll-mt-20 xl:pt-12">
          <PeriodTotals rows={rows} view={view} locale={locale} t={t.stats} href={href} />
        </div>
      </section>

      <section id="slips" className="scroll-mt-20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">{day ? t.stats.dayFilter.replace("{day}", fmtDay(day, locale, { weekday: "long", day: "numeric", month: "long" })) : t.stats.recentSlips}</h2>
          {day && (
            <Link href={href({ day: undefined }) + "#slips"} className="btn btn-ghost text-sm">
              {t.stats.showAll}
            </Link>
          )}
        </div>
        {slips.length === 0 ? (
          <p className="card p-8 text-center text-muted">{t.common.noData}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {slips.map((s) => (
              <SlipCard key={s.id} slip={s} locale={locale} t={t} imageUrl={imageFor(s.image_path)} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
