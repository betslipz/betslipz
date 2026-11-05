import { resolveLocale } from "@/lib/locale";
import AuthShell from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale, t } = await resolveLocale(params);
  const { next, reason } = await searchParams;
  return (
    <AuthShell title={t.auth.loginTitle}>
      {reason === "elsewhere" && <p className="mb-4 rounded-lg bg-warning/10 p-3 text-sm text-warning">{t.auth.loggedOutElsewhere}</p>}
      <LoginForm locale={locale} t={t.auth} next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
