import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/config";

export type Tier = "regular" | "vip";

export type Session = {
  userId: string;
  email: string;
  fullName: string | null;
  role: "user" | "admin";
  banned: boolean;
  tier: Tier | null;
  giftDay: string | null; // day the welcome gift was claimed (see lib/gift.ts)
  giftSlip: string | null; // the one slip it unlocked
};

// One lookup per request: who is this, and what can they see?
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: tier }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, banned").eq("id", user.id).single(),
    supabase.rpc("current_tier"),
  ]);

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: profile?.role === "admin" ? "admin" : "user",
    banned: profile?.banned ?? false,
    tier: (tier as Tier | null) ?? null,
    giftDay: typeof user.app_metadata?.welcome_gift_day === "string" ? user.app_metadata.welcome_gift_day : null,
    giftSlip: typeof user.app_metadata?.welcome_gift_slip === "string" ? user.app_metadata.welcome_gift_slip : null,
  };
});

export async function requireUser(locale: Locale) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  return session;
}

export async function requireAdmin(locale: Locale) {
  const session = await requireUser(locale);
  if (session.role !== "admin" || session.banned) redirect(`/${locale}`);
  return session;
}
