"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { adminEmail, sendEmail } from "@/lib/email";
import { adminPaymentEmail } from "@/lib/emails";
import { planLabel } from "@/lib/plans";
import type { Sport } from "@/lib/sports";
import { fmtUsd } from "@/lib/format";
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
  // Payments are non-refundable, so the buyer must accept the Terms and Refund Policy first.
  if (formData.get("accept") !== "on") return { error: t.subscribe.acceptRequired };

  const allowedMethods = process.env.NODE_ENV === "production" ? ["whish", "omt", "usdt", "cash"] : ["whish", "omt", "usdt", "cash", "mock"];
  // A payment buys either a plan or one slip.
  const parsed = z
    .object({
      planId: z.coerce.number().int().positive().optional(),
      slipId: z.string().uuid().optional(),
      method: z.enum(allowedMethods as [string, ...string[]]),
      reference: z.string().trim().min(2).max(120),
    })
    .refine((v) => !!v.planId !== !!v.slipId)
    .safeParse({
      planId: formData.get("planId") || undefined,
      slipId: formData.get("slipId") || undefined,
      method: formData.get("method"),
      reference: formData.get("reference"),
    });
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

  // Amount and status are set by a database trigger, not trusted from the form. It also refuses slips that started.
  const { error } = await supabase.from("payments").insert({
    user_id: session.userId,
    plan_id: parsed.data.planId ?? null,
    slip_id: parsed.data.slipId ?? null,
    method: parsed.data.method,
    reference: parsed.data.reference,
    proof_path: proofPath,
  });
  if (error) {
    if (error.message.includes("Too many")) return { error: error.message };
    return { error: /Slip/.test(error.message) ? t.subscribe.slipUnavailable : t.common.error };
  }
  await notifyAdmin(session.userId, session.email, parsed.data, proofPath !== null);

  revalidatePath(`/${locale}/account`);
  revalidatePath(`/${locale}/slips`);
  return { message: t.subscribe.submitted };
}

// Emails the admin about every new payment so it can be checked and approved quickly.
async function notifyAdmin(userId: string, email: string, p: { planId?: number; slipId?: string; method: string; reference: string }, hasReceipt: boolean) {
  const service = createServiceClient();
  const en = getDictionary("en");
  const [{ data: profile }, { data: payment }] = await Promise.all([
    service.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle(),
    service
      .from("payments")
      .select("amount_usd, plans(tier, sport, duration), slips(title_en, slip_legs(kickoff_at))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const plan = payment?.plans as unknown as { tier: "regular" | "vip"; sport: Sport | null; duration: "week" | "month" | "quarter" | "year" } | null;
  const slip = payment?.slips as unknown as { title_en: string; slip_legs: { kickoff_at: string | null }[] } | null;
  const firstKickoff = slip?.slip_legs.map((l) => l.kickoff_at).filter((k): k is string => !!k).sort()[0];
  await sendEmail({
    to: adminEmail(),
    ...adminPaymentEmail({
      buyer: email,
      buyerName: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      item: plan ? planLabel(plan, en) : slip ? `Slip: ${slip.title_en}` : p.slipId ? "Slip" : "Plan",
      amount: fmtUsd(Number(payment?.amount_usd ?? 0)),
      method: (en.subscribe.methods as Record<string, string>)[p.method] ?? p.method,
      reference: p.reference,
      hasReceipt,
      warning: firstKickoff ? `The slip's first game starts ${new Date(firstKickoff).toLocaleString("en-GB", { timeZone: "Asia/Beirut", dateStyle: "medium", timeStyle: "short" })} (Beirut time). Approve before then if you can.` : undefined,
    }),
  });
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
