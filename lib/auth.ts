import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/config";
import { isSport, type Sport } from "@/lib/sports";

// What this login can open: VIP opens every sport and every slip; each sport plan opens one sport.
export type Access = { vip: boolean; sports: Sport[] };

export type Session = {
  userId: string;
  email: string;
  fullName: string | null;
  role: "user" | "admin";
  banned: boolean;
  access: Access;
  giftClaimed: boolean; // the one free slip (see lib/gift.ts)
};

// One lookup per request: who is this, and what can they see?
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: access }, { data: current }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, banned").eq("id", user.id).single(),
    supabase.rpc("my_access"),
    supabase.rpc("session_is_current"),
  ]);
  // One login at a time: this account has since logged in on another device, so this one is logged out.
  if (current === false) {
    const locale = (await headers()).get("x-locale");
    redirect(`/auth/elsewhere${locale ? `?locale=${locale}` : ""}`);
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: profile?.role === "admin" ? "admin" : "user",
    banned: profile?.banned ?? false,
    access: {
      vip: access?.vip === true,
      sports: Array.isArray(access?.sports) ? access.sports.filter(isSport) : [],
    },
    giftClaimed: typeof user.app_metadata?.welcome_gift_day === "string",
  };
});

// Admins see everything; members see the sports their plans cover.
export const canSeeSport = (session: Session | null, sport: Sport) =>
  !!session && (session.role === "admin" || session.access.vip || session.access.sports.includes(sport));
export const seesAllSlips = (session: Session | null) => !!session && (session.role === "admin" || session.access.vip);

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
