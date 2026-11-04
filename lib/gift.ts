import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import type { Session } from "@/lib/auth";

// Welcome gift: a new account without a plan may unlock today's Regular slip (the newest open one), once, for that day.
// The claimed day lives in the user's app_metadata, which only the service role can write.

export const GIFT_TIMEZONE = "Asia/Beirut";

export const giftToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: GIFT_TIMEZONE }).format(new Date());

export type GiftState = "none" | "available" | "active" | "used";

export function giftState(session: Session | null): GiftState {
  if (!session || session.tier || session.role === "admin" || session.banned) return "none";
  if (!session.giftDay) return "available";
  return session.giftDay === giftToday() && session.giftSlip ? "active" : "used";
}

// The gifted slip, read with the service role because RLS doesn't know about the gift.
// Only call this after giftState(session) === "active".
export async function giftSlips(slipId: string): Promise<{ slips: Slip[]; imageFor: (path: string | null) => string | null }> {
  const service = createServiceClient();
  const { data } = await service.from("slips").select(SLIP_SELECT).eq("id", slipId).eq("tier", "regular");
  const slips = (data ?? []) as Slip[];
  const paths = slips.map((s) => s.image_path).filter((p): p is string => !!p);
  const signed = paths.length ? ((await service.storage.from("slip-images").createSignedUrls(paths, 600)).data ?? []) : [];
  return { slips, imageFor: (path) => signed.find((s) => s.path === path)?.signedUrl ?? null };
}

// The slip a claim would unlock: the newest open Regular slip, if any.
export async function newestOpenRegularSlip(): Promise<string | null> {
  const { data } = await createServiceClient()
    .from("slips")
    .select("id")
    .eq("status", "pending")
    .eq("tier", "regular")
    .lte("publish_at", new Date().toISOString())
    .order("publish_at", { ascending: false })
    .limit(1);
  return data?.[0]?.id ?? null;
}
