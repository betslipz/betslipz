import { resolveLocale } from "@/lib/locale";
import { isSport } from "@/lib/sports";
import { pickerTeams } from "@/lib/teams";
import PredictionForm from "@/components/admin/PredictionForm";

export default async function NewPrediction({ params, searchParams }: PageProps<"/[locale]/admin/predictions/new">) {
  const { locale, t } = await resolveLocale(params);
  const { sport, saved } = await searchParams;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">{t.admin.newPrediction}</h1>
      {saved && <p className="mb-4 rounded-lg bg-accent/10 p-3 text-sm text-accent">✓ {t.admin.predictionSaved}</p>}
      <PredictionForm locale={locale} t={t} initialSport={isSport(sport) ? sport : undefined} teams={await pickerTeams()} />
    </div>
  );
}
