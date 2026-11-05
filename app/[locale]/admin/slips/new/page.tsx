import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import { pickerTeams } from "@/lib/teams";
import SlipForm from "@/components/admin/SlipForm";

export default async function NewSlip({ params, searchParams }: PageProps<"/[locale]/admin/slips/new">) {
  const { locale, t } = await resolveLocale(params);
  const { from } = await searchParams;
  const supabase = await createClient();
  // ?from=<id> comes from the "Duplicate" button: start from that slip's picks.
  const template =
    typeof from === "string" && /^[0-9a-f-]{36}$/i.test(from)
      ? (((await supabase.from("slips").select(SLIP_SELECT).eq("id", from).maybeSingle()).data as Slip | null) ?? undefined)
      : undefined;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">{t.admin.newSlip}</h1>
      <SlipForm
        locale={locale}
        t={t}
        template={template}
        teams={await pickerTeams()}
        tEn={getDictionary("en").admin.slipNames}
        tAr={getDictionary("ar").admin.slipNames}
      />
    </div>
  );
}
