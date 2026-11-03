import { resolveLocale } from "@/lib/locale";
import AuthShell from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale, t } = await resolveLocale(params);
  const { next } = await searchParams;
  return (
    <AuthShell title={t.auth.loginTitle}>
      <LoginForm locale={locale} t={t.auth} next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
