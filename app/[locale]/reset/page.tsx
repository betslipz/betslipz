import { resolveLocale } from "@/lib/locale";
import AuthShell from "@/components/AuthShell";
import { ResetForm } from "@/components/AuthForms";

export default async function ResetPage({ params, searchParams }: PageProps<"/[locale]/reset">) {
  const { locale, t } = await resolveLocale(params);
  const { expired } = await searchParams;
  return (
    <AuthShell title={t.auth.resetTitle}>
      {expired && <p className="mb-4 rounded-lg bg-warning/10 p-3 text-sm text-warning">{t.auth.resetExpired}</p>}
      <ResetForm locale={locale} t={t.auth} />
    </AuthShell>
  );
}
