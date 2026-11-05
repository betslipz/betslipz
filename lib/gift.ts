import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { seesAllSlips, type Session } from "@/lib/auth";

// Welcome gift: every new account may open one slip for free, once. Claiming it writes a slip_unlocks row
// (with no payment) and marks the account in app_metadata, which only the service role can write.

export const GIFT_TIMEZONE = "Asia/Beirut";

export const giftToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: GIFT_TIMEZONE }).format(new Date());

export type GiftState = "none" | "available" | "used";

export function giftState(session: Session | null): GiftState {
  if (!session || seesAllSlips(session) || session.banned) return "none";
  return session.giftClaimed ? "used" : "available";
}

// The slip a claim would open: the newest open slip whose games haven't started and that this user doesn't own yet.
export async function giftableSlip(userId: string): Promise<string | null> {
  const service = createServiceClient();
  const [{ data: teasers }, { data: owned }] = await Promise.all([
    service.rpc("slip_teasers"),
    service.from("slip_unlocks").select("slip_id").eq("user_id", userId),
  ]);
  const mine = new Set((owned ?? []).map((u) => u.slip_id as string));
  const now = Date.now();
  const slip = ((teasers ?? []) as { id: string; first_kickoff: string | null }[]).find(
    (s) => !mine.has(s.id) && (!s.first_kickoff || new Date(s.first_kickoff).getTime() > now),
  );
  return slip?.id ?? null;
}
