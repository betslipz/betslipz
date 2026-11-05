"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { resetEmail } from "@/lib/emails";
import { sendWelcomeOnce } from "@/lib/welcome";
import { isLocale, type Locale } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";

export type FormState = { error?: string; message?: string } | undefined;

// Links in auth emails always use the configured site URL, never the request Host header.
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function localeOf(formData: FormData): Locale {
  const l = String(formData.get("locale") ?? "en");
  return isLocale(l) ? l : "en";
}

// Only allow same-site relative redirects after login.
function safeNext(value: FormDataEntryValue | null, locale: Locale) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : `/${locale}/slips`;
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const locale = localeOf(formData);
  const t = getDictionary(locale);
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: t.auth.invalid };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.status === 429 ? error.message : t.auth.invalid };
  await supabase.rpc("claim_session");
  await sendWelcomeOnce(data.user.id);
  redirect(safeNext(formData.get("next"), locale));
}

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const locale = localeOf(formData);
  const t = getDictionary(locale);
  if (formData.get("age") !== "on") return { error: t.auth.ageConfirm };

  const parsed = credentials
    .extend({ fullName: z.string().trim().min(2).max(120) })
    .safeParse({ email: formData.get("email"), password: formData.get("password"), fullName: formData.get("fullName") });
  if (!parsed.success) return { error: `${t.common.error} (${t.auth.passwordHint})` };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, locale },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/${locale}/slips`,
    },
  });
  if (error) return { error: error.message };
  if (data.session && data.user) {
    await supabase.rpc("claim_session");
    await sendWelcomeOnce(data.user.id);
    redirect(`/${locale}/slips`);
  }
  return { message: t.auth.checkEmail };
}

export async function requestReset(_: FormState, formData: FormData): Promise<FormState> {
  const locale = localeOf(formData);
  const t = getDictionary(locale);
  const email = z.string().trim().email().safeParse(formData.get("email"));
  if (email.success) {
    if (process.env.RESEND_API_KEY) await sendResetEmail(email.data, locale);
    else {
      // Without Resend, fall back to Supabase's own (heavily rate-limited) mailer.
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(email.data, {
        redirectTo: `${siteUrl()}/auth/callback?next=/${locale}/update-password`,
      });
    }
  }
  // Same answer either way, so the form can't be used to discover registered emails.
  return { message: t.auth.resetSent };
}

// The reset link is made with the service role and emailed through Resend in the visitor's language.
// It opens /auth/confirm, which checks the one-time token and logs the visitor in to choose a new password.
async function sendResetEmail(email: string, locale: Locale) {
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.user || !data.properties?.hashed_token) return; // unknown email: say nothing
  // At most one reset email a minute per account, so the form can't be used to flood someone's inbox.
  const last = Date.parse(String(data.user.app_metadata?.reset_email_at ?? ""));
  if (Date.now() - last < 60_000) return;
  await service.auth.admin.updateUserById(data.user.id, { app_metadata: { ...data.user.app_metadata, reset_email_at: new Date().toISOString() } });
  const link = `${siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=/${locale}/update-password`;
  await sendEmail({ to: email, ...resetEmail(locale, link) });
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const locale = localeOf(formData);
  const t = getDictionary(locale);
  const password = z.string().min(8).max(72).safeParse(formData.get("password"));
  if (!password.success) return { error: t.auth.passwordHint };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: error.message };
  redirect(`/${locale}/account`);
}

export async function logout(formData: FormData) {
  const locale = localeOf(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
