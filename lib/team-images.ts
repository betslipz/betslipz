import type { Sport } from "@/lib/sports";

// Teams and players with their crest or country flag. Safe on both server and client.

export type Team = { id: string; sport: Sport; name: string; country: string | null; logo_url: string | null; league: string | null; is_player: boolean };

// Crests and flags are copied into the public "team-logos" bucket (scripts/import-teams.mjs), so pages only load images from Supabase.
const bucket = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/team-logos`;
export const flagUrl = (country: string) => `${bucket()}/flags/${country}.png`;

// Names compare without accents or case: "Fenerbahce" finds "Fenerbahçe".
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type TeamLookup = (name: string, sport?: Sport | null) => Team | undefined;

// Exact (normalized) name match, preferring the given sport.
export function lookupFrom(teams: Team[]): TeamLookup {
  const bySport = new Map<string, Team>();
  const byName = new Map<string, Team>();
  for (const t of teams) {
    const key = normalize(t.name);
    bySport.set(`${t.sport}:${key}`, t);
    if (!byName.has(key)) byName.set(key, t);
  }
  return (name, sport) => {
    const key = normalize(name);
    return (sport && bySport.get(`${sport}:${key}`)) || byName.get(key);
  };
}

// Picker search: names starting with the query first, then names containing it.
export function searchTeams(teams: Team[], query: string, limit = 8): Team[] {
  const q = normalize(query);
  if (!q) return teams.slice(0, limit);
  const starts: Team[] = [];
  const contains: Team[] = [];
  for (const t of teams) {
    const n = normalize(t.name);
    if (n.startsWith(q) || n.split(" ").some((w) => w.startsWith(q))) starts.push(t);
    else if (n.includes(q)) contains.push(t);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
