import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";
import { PricesForm, PaymentMethodsForm, ContactForm } from "@/components/admin/SettingsForms";

export default async function AdminSettings({ params }: PageProps<"/[locale]/admin/settings">) {
  const { locale, t } = await resolveLocale(params);
  const supabase = await createClient();
  const [{ data: plans }, { data: setting }, { data: contact }] = await Promise.all([
    supabase.from("plans").select("*").or("tier.eq.vip,sport.not.is.null").order("tier", { ascending: false }).order("sport").order("price_usd"),
    supabase.from("settings").select("value").eq("key", "payment_methods").single(),
    supabase.from("settings").select("value").eq("key", "contact").maybeSingle(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{t.admin.settings}</h1>
      <PricesForm locale={locale} t={t} plans={(plans ?? []) as Plan[]} />
      <PaymentMethodsForm locale={locale} t={t} methods={(setting?.value ?? {}) as Record<string, { enabled: boolean; details: string }>} />
      <ContactForm locale={locale} t={t} contact={(contact?.value ?? {}) as { email?: string; whatsapp?: string }} />
    </div>
  );
}
