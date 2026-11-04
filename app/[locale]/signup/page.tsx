import { resolveLocale } from "@/lib/locale";
import AuthShell from "@/components/AuthShell";
import { SignupForm } from "@/components/AuthForms";

export default async function SignupPage({ params }: PageProps<"/[locale]/signup">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <AuthShell title={t.auth.signupTitle}>
      <p className="mb-5 rounded-lg border border-vip/40 bg-vip/10 px-4 py-3 text-sm font-semibold text-vip">{t.auth.signupGift}</p>
      <SignupForm locale={locale} t={t.auth} />
    </AuthShell>
  );
}
