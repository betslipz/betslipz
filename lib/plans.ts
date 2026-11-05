import type { Dictionary } from "@/lib/i18n/en";
import { sportEmoji, type Sport } from "@/lib/sports";

type PlanLike = { tier: "regular" | "vip"; sport?: Sport | null; duration?: "week" | "month" | "quarter" | "year" };

// "★ VIP · Month" or "🎾 Tennis · Month"; leftover Regular plans without a sport read "Regular".
export function planLabel(p: PlanLike, t: Dictionary) {
  const name = p.tier === "vip" ? `★ ${t.common.vip}` : p.sport ? `${sportEmoji(p.sport)} ${t.live.sports[p.sport]}` : t.common.regular;
  return p.duration ? `${name} · ${t.common[p.duration]}` : name;
}
