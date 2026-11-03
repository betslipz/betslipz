import { resolveLocale } from "@/lib/locale";
import SlipForm from "@/components/admin/SlipForm";

export default async function NewSlip({ params }: PageProps<"/[locale]/admin/slips/new">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">{t.admin.newSlip}</h1>
      <SlipForm locale={locale} t={t} />
    </div>
  );
}
