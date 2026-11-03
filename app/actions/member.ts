"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import type { FormState } from "./auth";

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function localeOf(formData: FormData): Locale {
  const l = String(formData.get("locale") ?? "en");
  return isLocale(l) ? l : "en";
}

export async function submitPayment(_: FormState, formData: FormData): Promise<FormState> {
  const locale = localeOf(formData);
  const t = getDictionary(locale);
  const session = await getSession();
  if (!session) return { error: t.subscribe.loginFirst };

  const allowedMethods = process.env.NODE_ENV === "production" ? ["whish", "omt", "usdt", "cash"] : ["whish", "omt", "usdt", "cash", "mock"];
  const parsed = z
    .object({
      planId: z.coerce.number().int().positive(),
      method: z.enum(allowedMethods as [string, ...string[]]),
      reference: z.string().trim().min(2).max(120),
    })
    .safeParse({ planId: formData.get("planId"), method: formData.get("method"), reference: formData.get("reference") });
  if (!parsed.success) return { error: t.common.error };

  const supabase = await createClient();

  // Optional receipt upload into the user's own private folder (enforced by storage RLS).
  let proofPath: string | null = null;
  const file = formData.get("proof");
  if (file instanceof File && file.size > 0) {
    const ext = PROOF_TYPES[file.type];
    if (!ext || file.size > MAX_PROOF_BYTES) return { error: `${t.common.error} (PNG/JPG/WEBP/PDF, max 5MB)` };
    proofPath = `${session.userId}/${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("payment-proofs").upload(proofPath, file, { contentType: file.type });
    if (error) return { error: t.common.error };
  }

  // Amount and status are set by a database trigger, not trusted from the form.
  const { error } = await supabase.from("payments").insert({
    user_id: session.userId,
    plan_id: parsed.data.planId,
    method: parsed.data.method,
    reference: parsed.data.reference,
    proof_path: proofPath,
  });
  if (error) return { error: error.message.includes("Too many") ? error.message : t.common.error };

  revalidatePath(`/${locale}/account`);
  return { message: t.subscribe.submitted };
}

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const locale = localeOf(formData);
  const t = getDictionary(locale);
  const session = await getSession();
  if (!session) return { error: t.common.error };

  const parsed = z
    .object({
      full_name: z.string().trim().min(2).max(120),
      phone: z.string().trim().max(40).regex(/^[+\d\s()-]*$/),
    })
    .safeParse({ full_name: formData.get("fullName"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { error: t.common.error };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", session.userId);
  if (error) return { error: t.common.error };
  revalidatePath(`/${locale}/account`);
  return { message: t.account.saved };
}
