// Ring gauge: red-amber below 60, green from 75. The number is always printed, not only colored.
export function confidenceColor(value: number) {
  if (value >= 75) return "var(--accent)";
  if (value >= 60) return "#a3e635";
  if (value >= 45) return "var(--warning)";
  return "var(--danger)";
}

export default function ConfidenceMeter({ value, label, size = 72 }: { value: number; label: string; size?: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center" title={`${label}: ${v}%`}>
      <svg width={size} height={size} viewBox="0 0 72 72" role="img" aria-label={`${label} ${v}%`}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={confidenceColor(v)}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="41" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text)">
          {v}%
        </text>
      </svg>
      <span className="mt-1 text-[11px] uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
