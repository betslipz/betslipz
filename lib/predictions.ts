import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PREDICTION_SPORTS, type Sport } from "@/lib/sports";
import type { Plan } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/en";

// How many open predictions each sport has right now. Visible to everyone: it's all a locked sport shows.
export const openCounts = cache(async (): Promise<Record<Sport, number>> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("prediction_counts");
  const counts = Object.fromEntries(PREDICTION_SPORTS.map((s) => [s, 0])) as Record<Sport, number>;
  for (const row of (data ?? []) as { sport: Sport; open: number }[]) counts[row.sport] = row.open;
  return counts;
});

// Active plans for sale, used for "from $X / month" and the plan pickers.
export const activePlans = cache(async (): Promise<Plan[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").eq("active", true).order("price_usd");
  // Leftover Regular plans without a sport aren't sold any more.
  return ((data ?? []) as Plan[]).filter((p) => p.tier === "vip" || p.sport);
});

// "1 open prediction" / "6 open predictions"; 0 reads "No open predictions right now".
export const countText = (n: number, t: Dictionary["predictions"]) => (n === 0 ? t.noneOpen : n === 1 ? t.countOpenOne : t.countOpen.replace("{n}", String(n)));

export const monthlyPrice = (plans: Plan[], sport: Sport | "vip") =>
  plans.find((p) => p.duration === "month" && (sport === "vip" ? p.tier === "vip" : p.sport === sport))?.price_usd ?? null;
