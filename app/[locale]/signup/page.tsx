import { resolveLocale } from "@/lib/locale";
import AuthShell from "@/components/AuthShell";
import { SignupForm } from "@/components/AuthForms";

export default async function SignupPage({ params }: PageProps<"/[locale]/signup">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <AuthShell title={t.auth.signupTitle}>
      <SignupForm locale={locale} t={t.auth} />
    </AuthShell>
  );
}
