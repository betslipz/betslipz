import type { Sport } from "@/lib/sports";

// Shared by the slip and prediction forms.

export type Market = { name: string; picks: (home: string, away: string) => string[] };

// Common markets and their one-tap picks, per sport. Stored text stays in English so picks read the same everywhere.
export const MARKETS: Record<Sport, Market[]> = {
  football: [
    { name: "1X2", picks: (h, a) => [h || "Home", "Draw", a || "Away"] },
    { name: "Double chance", picks: () => ["1X", "X2", "12"] },
    { name: "Over/Under", picks: () => ["Over 1.5", "Over 2.5", "Over 3.5", "Under 2.5", "Under 3.5"] },
    { name: "BTTS", picks: () => ["Yes", "No"] },
    { name: "Draw no bet", picks: (h, a) => [h || "Home", a || "Away"] },
    { name: "Handicap", picks: () => [] },
  ],
  basketball: [
    { name: "Moneyline", picks: (h, a) => [h || "Home", a || "Away"] },
    { name: "Handicap", picks: () => [] },
    { name: "Total points", picks: () => [] },
  ],
  tennis: [
    { name: "Match winner", picks: (h, a) => [h || "Player 1", a || "Player 2"] },
    { name: "Set handicap", picks: () => [] },
    { name: "Total games", picks: () => [] },
  ],
  darts: [
    { name: "Match winner", picks: (h, a) => [h || "Player 1", a || "Player 2"] },
    { name: "Handicap", picks: () => [] },
    { name: "Total 180s", picks: () => [] },
  ],
};
export const OTHER = "__other";

// <input type="datetime-local"> works in the browser's local time; convert at the edges.
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

export const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
    active ? "border-accent bg-accent/15 text-accent" : "border-border text-muted hover:border-muted hover:text-text"
  }`;

// "Arsenal vs Chelsea" → ["Arsenal", "Chelsea"].
export function splitEvent(event: string): [string, string] {
  const [home, ...rest] = event.split(/\s+vs\.?\s+/i);
  return [home, rest.join(" vs ")];
}
export const joinEvent = (home: string, away: string) => (away.trim() ? `${home.trim()} vs ${away.trim()}` : home.trim());
