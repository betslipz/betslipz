import { notFound } from "next/navigation";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import { knownTeams } from "@/lib/teams";
import SlipForm from "@/components/admin/SlipForm";

export default async function EditSlip({ params }: PageProps<"/[locale]/admin/slips/[id]">) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("slips").select(SLIP_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">{t.admin.editSlip}</h1>
      <SlipForm
        locale={locale}
        t={t}
        slip={data as Slip}
        teams={await knownTeams()}
        tEn={getDictionary("en").admin.slipNames}
        tAr={getDictionary("ar").admin.slipNames}
      />
    </div>
  );
}
