import { resolveLocale } from "@/lib/locale";
import AuthShell from "@/components/AuthShell";
import { ResetForm } from "@/components/AuthForms";

export default async function ResetPage({ params }: PageProps<"/[locale]/reset">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <AuthShell title={t.auth.resetTitle}>
      <ResetForm locale={locale} t={t.auth} />
    </AuthShell>
  );
}
