import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { requireUser, seesAllSlips } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSport } from "@/lib/sports";
import { activePlans } from "@/lib/predictions";
import { teaserState, type Teaser } from "@/components/LockedSlip";
import SubscribeForm, { type MethodInfo, type Purchase } from "@/components/SubscribeForm";

export default async function SubscribePage({ params, searchParams }: PageProps<"/[locale]/subscribe">) {
  const { locale, t } = await resolveLocale(params);
  const session = await requireUser(locale);
  const sp = await searchParams;
  const supabase = await createClient();
  const slipId = typeof sp.slip === "string" && /^[0-9a-f-]{36}$/i.test(sp.slip) ? sp.slip : null;

  const [plans, { data: setting }, { count: pending }, slipCheck] = await Promise.all([
    activePlans(),
    supabase.from("settings").select("value").eq("key", "payment_methods").single(),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("user_id", session.userId).eq("status", "pending"),
    slipId
      ? Promise.all([
          supabase.rpc("slip_teasers"),
          supabase.from("slip_unlocks").select("slip_id").eq("user_id", session.userId).eq("slip_id", slipId),
          supabase.from("payments").select("id").eq("user_id", session.userId).eq("slip_id", slipId).eq("status", "pending"),
        ])
      : null,
  ]);

  const all = (setting?.value ?? {}) as Record<string, { enabled: boolean; details: string }>;
  const methods: MethodInfo[] = Object.entries(all)
    .filter(([key, m]) => m.enabled && (key !== "mock" || process.env.NODE_ENV !== "production"))
    .map(([key, m]) => ({ key, details: m.details }));

  let purchase: Purchase | null;
  // Right after paying, the page reloads with that payment pending: confirm it rather than saying the slip can't be bought.
  let awaitingReview = false;
  if (slipCheck) {
    const [{ data: teasers }, { data: owned }, { data: pendingForSlip }] = slipCheck;
    const slip = ((teasers ?? []) as Teaser[]).find((x) => x.id === slipId);
    // The database refuses these too; checking here shows a clear message instead of a failed form.
    const buyable = slip && teaserState(slip, !!pendingForSlip?.length) === "buy" && !owned?.length && !seesAllSlips(session);
    purchase = buyable ? { kind: "slip", slip } : null;
    awaitingReview = !!pendingForSlip?.length;
  } else {
    const requested = Number(sp.plan);
    const sport = isSport(sp.sport) ? sp.sport : null;
    const initialPlan =
      plans.find((p) => p.id === requested)?.id ??
      plans.find((p) => (sport ? p.sport === sport : p.tier === "vip") && p.duration === "month")?.id ??
      plans[0]?.id;
    purchase = { kind: "plan", plans, initialPlan };
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black">{slipId ? t.subscribe.buySlipTitle : t.subscribe.title}</h1>
      {!!pending && !awaitingReview && <p className="card mb-6 border-warning/50 bg-warning/10 p-4 text-warning">⏳ {t.subscribe.pendingNote}</p>}
      {awaitingReview ? (
        <div className="card border-accent/50 bg-accent/10 p-6">
          <p className="text-lg text-accent">✓ {t.subscribe.submitted}</p>
          <Link href={`/${locale}/slips`} className="btn btn-primary mt-4">
            {t.nav.slips}
          </Link>
        </div>
      ) : purchase ? (
        <SubscribeForm locale={locale} t={t} purchase={purchase} methods={methods} />
      ) : (
        <div className="card p-6">
          <p className="text-muted">{t.subscribe.slipUnavailable}</p>
          <Link href={`/${locale}/slips`} className="btn btn-primary mt-4">
            {t.nav.slips}
          </Link>
        </div>
      )}
    </div>
  );
}
