import { resolveLocale } from "@/lib/locale";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";
import SubscribeForm, { type MethodInfo } from "@/components/SubscribeForm";

export default async function SubscribePage({ params, searchParams }: PageProps<"/[locale]/subscribe">) {
  const { locale, t } = await resolveLocale(params);
  const session = await requireUser(locale);
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: plans }, { data: setting }, { count: pending }] = await Promise.all([
    supabase.from("plans").select("*").eq("active", true).order("tier").order("price_usd"),
    supabase.from("settings").select("value").eq("key", "payment_methods").single(),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("user_id", session.userId).eq("status", "pending"),
  ]);

  const all = (setting?.value ?? {}) as Record<string, { enabled: boolean; details: string }>;
  const methods: MethodInfo[] = Object.entries(all)
    .filter(([key, m]) => m.enabled && (key !== "mock" || process.env.NODE_ENV !== "production"))
    .map(([key, m]) => ({ key, details: m.details }));

  const planList = (plans ?? []) as Plan[];
  const requested = Number(sp.plan);
  const wantVip = sp.tier === "vip";
  const initialPlan =
    planList.find((p) => p.id === requested)?.id ??
    planList.find((p) => p.tier === (wantVip ? "vip" : "regular") && p.duration === "month")?.id ??
    planList[0]?.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black">{t.subscribe.title}</h1>
      {!!pending && <p className="card mb-6 border-warning/50 bg-warning/10 p-4 text-warning">⏳ {t.subscribe.pendingNote}</p>}
      <SubscribeForm locale={locale} t={t} plans={planList} methods={methods} initialPlan={initialPlan} />
    </div>
  );
}
