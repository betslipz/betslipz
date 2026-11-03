import type { Dictionary } from "@/lib/i18n/en";
import type { SlipStatus } from "@/lib/types";

const styles: Record<SlipStatus, string> = {
  pending: "bg-surface-2 text-muted",
  won: "bg-accent/15 text-accent",
  lost: "bg-danger/15 text-danger",
  void: "bg-surface-2 text-muted line-through",
  partial: "bg-warning/15 text-warning",
};

const icons: Record<SlipStatus, string> = { pending: "•", won: "✓", lost: "✕", void: "—", partial: "½" };

export default function StatusBadge({ status, t }: { status: SlipStatus; t: Dictionary["common"] }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[status]}`}>
      <span aria-hidden>{icons[status]}</span>
      {t[status]}
    </span>
  );
}

export function TierBadge({ tier, t }: { tier: "regular" | "vip"; t: Dictionary["common"] }) {
  return tier === "vip" ? (
    <span className="rounded-md bg-vip px-2 py-0.5 text-xs font-black tracking-wide text-[#1a1200]">★ {t.vip}</span>
  ) : (
    <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">{t.regular}</span>
  );
}
