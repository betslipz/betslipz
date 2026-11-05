import { notFound } from "next/navigation";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { PREDICTION_SELECT, type Prediction } from "@/lib/types";
import { pickerTeams } from "@/lib/teams";
import PredictionForm from "@/components/admin/PredictionForm";

export default async function EditPrediction({ params }: PageProps<"/[locale]/admin/predictions/[id]">) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("predictions").select(PREDICTION_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">{t.admin.editPrediction}</h1>
      <PredictionForm locale={locale} t={t} prediction={data as Prediction} teams={await pickerTeams()} />
    </div>
  );
}
