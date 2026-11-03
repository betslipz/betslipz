import { resolveLocale } from "@/lib/locale";
import { requireUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import { UpdatePasswordForm } from "@/components/AuthForms";

export default async function UpdatePasswordPage({ params }: PageProps<"/[locale]/update-password">) {
  const { locale, t } = await resolveLocale(params);
  await requireUser(locale);
  return (
    <AuthShell title={t.auth.newPassword}>
      <UpdatePasswordForm locale={locale} t={t.auth} />
    </AuthShell>
  );
}
