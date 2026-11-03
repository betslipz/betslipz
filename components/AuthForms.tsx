"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Locale } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n/en";
import { login, signup, requestReset, updatePassword, type FormState } from "@/app/actions/auth";

export function Submit({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={`btn ${className} w-full`} disabled={pending}>
      {pending ? "…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{state.error}</p>;
  if (state.message) return <p className="rounded-lg bg-accent/10 p-3 text-sm text-accent">{state.message}</p>;
  return null;
}

type Props = { locale: Locale; t: Dictionary["auth"]; next?: string };

export function LoginForm({ locale, t, next }: Props) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
      </div>
      <div>
        <div className="flex justify-between">
          <label className="label" htmlFor="password">{t.password}</label>
          <Link href={`/${locale}/reset`} className="text-sm text-accent">{t.forgot}</Link>
        </div>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required minLength={8} dir="ltr" />
      </div>
      <FormMessage state={state} />
      <Submit>{t.loginBtn}</Submit>
      <p className="text-center text-sm text-muted">
        {t.noAccount} <Link href={`/${locale}/signup`} className="text-accent">{t.signupBtn}</Link>
      </p>
    </form>
  );
}

export function SignupForm({ locale, t }: Props) {
  const [state, action] = useActionState(signup, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label className="label" htmlFor="fullName">{t.fullName}</label>
        <input className="input" id="fullName" name="fullName" autoComplete="name" required minLength={2} maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.password}</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} dir="ltr" />
        <p className="mt-1 text-xs text-muted">{t.passwordHint}</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="age" required className="mt-1 accent-[var(--accent)]" />
        {t.ageConfirm}
      </label>
      <FormMessage state={state} />
      <Submit>{t.signupBtn}</Submit>
      <p className="text-center text-sm text-muted">
        {t.haveAccount} <Link href={`/${locale}/login`} className="text-accent">{t.loginBtn}</Link>
      </p>
    </form>
  );
}

export function ResetForm({ locale, t }: Props) {
  const [state, action] = useActionState(requestReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input className="input" id="email" name="email" type="email" required dir="ltr" />
      </div>
      <FormMessage state={state} />
      <Submit>{t.resetBtn}</Submit>
    </form>
  );
}

export function UpdatePasswordForm({ locale, t }: Props) {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label className="label" htmlFor="password">{t.newPassword}</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" required minLength={8} dir="ltr" />
      </div>
      <FormMessage state={state} />
      <Submit>{t.updatePasswordBtn}</Submit>
    </form>
  );
}
