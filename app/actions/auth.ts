"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.status === 429 ? error.message : t.auth.invalid };
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
  if (data.session) redirect(`/${locale}/slips`);
  return { message: t.auth.checkEmail };
}

export async function requestReset(_: FormState, formData: FormData): Promise<FormState> {
  const locale = localeOf(formData);
  const t = getDictionary(locale);
  const email = z.string().trim().email().safeParse(formData.get("email"));
  if (email.success) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${siteUrl()}/auth/callback?next=/${locale}/update-password`,
    });
  }
  // Same answer either way, so the form can't be used to discover registered emails.
  return { message: t.auth.resetSent };
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
