import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";
import { PricesForm, PaymentMethodsForm } from "@/components/admin/SettingsForms";

export default async function AdminSettings({ params }: PageProps<"/[locale]/admin/settings">) {
  const { locale, t } = await resolveLocale(params);
  const supabase = await createClient();
  const [{ data: plans }, { data: setting }] = await Promise.all([
    supabase.from("plans").select("*").order("tier").order("price_usd"),
    supabase.from("settings").select("value").eq("key", "payment_methods").single(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{t.admin.settings}</h1>
      <PricesForm locale={locale} t={t} plans={(plans ?? []) as Plan[]} />
      <PaymentMethodsForm locale={locale} t={t} methods={(setting?.value ?? {}) as Record<string, { enabled: boolean; details: string }>} />
    </div>
  );
}
