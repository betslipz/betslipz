"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/config";
import type { FormState } from "./auth";

// Defense in depth: the app checks admin here, and RLS/RPCs check again in the database.
async function adminContext(formData: FormData) {
  const l = String(formData.get("locale") ?? "en");
  const locale: Locale = isLocale(l) ? l : "en";
  const session = await getSession();
  if (!session || session.role !== "admin" || session.banned) throw new Error("Not allowed");
  return { locale, session, supabase: await createClient() };
}

const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

const legSchema = z.object({
  event: z.string().trim().min(2).max(160),
  market: z.string().trim().min(1).max(80),
  pick: z.string().trim().min(1).max(80),
  odds: z.coerce.number().min(1).max(1000),
  kickoff_at: z.string().datetime().nullable().optional(),
});

const slipSchema = z.object({
  tier: z.enum(["regular", "vip"]),
  title_en: z.string().trim().min(2).max(140),
  title_ar: z.string().trim().max(140).optional().transform((v) => v || null),
  confidence: z.coerce.number().int().min(0).max(100),
  stake_units: z.coerce.number().min(0.5).max(10),
  notes_en: z.string().trim().max(4000).optional().transform((v) => v || null),
  notes_ar: z.string().trim().max(4000).optional().transform((v) => v || null),
  betarabia_code: z.string().trim().max(60).optional().transform((v) => v || null),
  publish_at: z.string().datetime(),
  legs: z.array(legSchema).min(1).max(30),
});

export async function saveSlip(_: FormState, formData: FormData): Promise<FormState> {
  const { locale, session, supabase } = await adminContext(formData);
  const id = formData.get("id") ? String(formData.get("id")) : null;

  let legs: unknown;
  try {
    legs = JSON.parse(String(formData.get("legs") ?? "[]"));
  } catch {
    return { error: "Invalid selections" };
  }
  const parsed = slipSchema.safeParse({
    tier: formData.get("tier"),
    title_en: formData.get("title_en"),
    title_ar: formData.get("title_ar") ?? undefined,
    confidence: formData.get("confidence"),
    stake_units: formData.get("stake_units"),
    notes_en: formData.get("notes_en") ?? undefined,
    notes_ar: formData.get("notes_ar") ?? undefined,
    betarabia_code: formData.get("betarabia_code") ?? undefined,
    publish_at: formData.get("publish_at"),
    legs,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue.path.join(".")}: ${issue.message}` };
  }
  const { legs: legRows, ...fields } = parsed.data;
  const total_odds = Math.round(legRows.reduce((acc, l) => acc * l.odds, 1) * 100) / 100;

  let image_path: string | undefined;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext || file.size > 5 * 1024 * 1024) return { error: "Image must be PNG/JPG/WEBP, max 5MB" };
    image_path = `${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("slip-images").upload(image_path, file, { contentType: file.type });
    if (error) return { error: error.message };
  }

  const row = { ...fields, total_odds, ...(image_path ? { image_path } : {}) };
  let slipId = id;
  if (id) {
    const { error } = await supabase.from("slips").update(row).eq("id", id);
    if (error) return { error: error.message };
    await supabase.from("slip_legs").delete().eq("slip_id", id);
  } else {
    const { data, error } = await supabase.from("slips").insert({ ...row, created_by: session.userId }).select("id").single();
    if (error) return { error: error.message };
    slipId = data.id;
  }
  const { error: legError } = await supabase
    .from("slip_legs")
    .insert(legRows.map((l, i) => ({ ...l, kickoff_at: l.kickoff_at ?? null, slip_id: slipId, position: i })));
  if (legError) return { error: legError.message };

  revalidatePath(`/${locale}/slips`);
  revalidatePath(`/${locale}/admin/slips`);
  redirect(`/${locale}/admin/slips`);
}

const statusSchema = z.enum(["pending", "won", "lost", "void", "partial"]);

export async function settleSlip(formData: FormData) {
  const { locale, supabase } = await adminContext(formData);
  const id = z.string().uuid().parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  await supabase.from("slips").update({ status }).eq("id", id);
  // Optional per-leg results: fields named leg:<uuid>
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("leg:")) continue;
    const legId = z.string().uuid().parse(key.slice(4));
    await supabase.from("slip_legs").update({ result: statusSchema.parse(value) }).eq("id", legId).eq("slip_id", id);
  }
  revalidatePath(`/${locale}/admin/slips`);
  revalidatePath(`/${locale}/results`);
}

export async function deleteSlip(formData: FormData) {
  const { locale, supabase } = await adminContext(formData);
  const id = z.string().uuid().parse(formData.get("id"));
  const { data } = await supabase.from("slips").select("image_path").eq("id", id).single();
  if (data?.image_path) await supabase.storage.from("slip-images").remove([data.image_path]);
  await supabase.from("slips").delete().eq("id", id);
  revalidatePath(`/${locale}/admin/slips`);
}

export async function approvePayment(formData: FormData) {
  const { locale, supabase } = await adminContext(formData);
  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await supabase.rpc("approve_payment", { p_payment: id });
  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/admin/payments`);
  revalidatePath(`/${locale}/admin`);
}

export async function rejectPayment(formData: FormData) {
  const { locale, supabase } = await adminContext(formData);
  const id = z.string().uuid().parse(formData.get("id"));
  const note = z.string().trim().max(300).parse(formData.get("note") ?? "");
  const { error } = await supabase.rpc("reject_payment", { p_payment: id, p_note: note || null });
  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/admin/payments`);
}

export async function grantPlan(formData: FormData) {
  const { locale, supabase } = await adminContext(formData);
  const user = z.string().uuid().parse(formData.get("user"));
  const plan = z.coerce.number().int().positive().parse(formData.get("plan"));
  const { error } = await supabase.rpc("grant_plan", { p_user: user, p_plan: plan });
  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/admin/users`);
}

export async function revokeSubscription(formData: FormData) {
  const { locale, supabase } = await adminContext(formData);
  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await supabase.rpc("revoke_subscription", { p_sub: id });
  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/admin/users`);
}

export async function setUser(formData: FormData) {
  const { locale, supabase } = await adminContext(formData);
  const user = z.string().uuid().parse(formData.get("user"));
  const role = z.enum(["user", "admin"]).parse(formData.get("role"));
  const banned = formData.get("banned") === "true";
  const { error } = await supabase.rpc("admin_set_user", { p_user: user, p_role: role, p_banned: banned });
  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/admin/users`);
}

export async function savePrices(_: FormState, formData: FormData): Promise<FormState> {
  const { locale, supabase } = await adminContext(formData);
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("price:")) continue;
    const id = z.coerce.number().int().positive().parse(key.slice(6));
    const price = z.coerce.number().min(0).max(100000).safeParse(value);
    if (!price.success) return { error: `Invalid price for plan ${id}` };
    const active = formData.get(`active:${id}`) === "on";
    const { error } = await supabase.from("plans").update({ price_usd: price.data, active }).eq("id", id);
    if (error) return { error: error.message };
  }
  revalidatePath(`/${locale}`, "layout");
  return { message: "Saved." };
}

export async function savePaymentMethods(_: FormState, formData: FormData): Promise<FormState> {
  const { locale, supabase } = await adminContext(formData);
  const keys = ["whish", "omt", "usdt", "cash", "mock"];
  const value = Object.fromEntries(
    keys.map((k) => [
      k,
      {
        enabled: formData.get(`enabled:${k}`) === "on",
        details: String(formData.get(`details:${k}`) ?? "").slice(0, 500),
      },
    ]),
  );
  const { error } = await supabase.from("settings").upsert({ key: "payment_methods", value });
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/subscribe`);
  return { message: "Saved." };
}
