/* eslint-disable @next/next/no-img-element -- tiny crests and flags from our own bucket; no resizing needed */
import { flagUrl, type Team } from "@/lib/team-images";

// A club crest, else the country flag, else the name's first letter. Same size everywhere so names line up.
export default function TeamBadge({ team, name, size = 20 }: { team?: Pick<Team, "logo_url" | "country"> | null; name: string; size?: number }) {
  const box = { width: size, height: size };
  if (team?.logo_url) {
    return <img src={team.logo_url} alt="" width={size} height={size} loading="lazy" className="shrink-0 object-contain" style={box} />;
  }
  if (team?.country) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center" style={box}>
        <img src={flagUrl(team.country)} alt="" width={size} height={Math.round(size * 0.7)} loading="lazy" className="rounded-[2px] object-cover shadow-sm" style={{ width: size, height: Math.round(size * 0.7) }} />
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-muted" style={box} aria-hidden>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
