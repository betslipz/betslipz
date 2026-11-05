import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { lookupFrom, type Team } from "@/lib/team-images";
import type { Sport } from "@/lib/sports";

function namesFrom(events: { event: string }[]) {
  const names = new Set<string>();
  for (const { event } of events) {
    for (const part of event.split(/\s+vs\.?\s+/i)) {
      const name = part.trim();
      if (name.length >= 2) names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

// Every team and player with their crest/flag (a few hundred rows), once per request.
export const allTeams = cache(async (): Promise<Team[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("id, sport, name, country, logo_url, league, is_player").order("name").limit(5000);
  return (data ?? []) as Team[];
});

export const teamLookup = cache(async () => lookupFrom(await allTeams()));

// Picker options: the teams list plus names typed in earlier slips and predictions that aren't in it yet (shown without a crest).
export async function pickerTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const [teams, { data: legs }, { data: predictions }] = await Promise.all([
    allTeams(),
    supabase.from("slip_legs").select("event").limit(600),
    supabase.from("predictions").select("event, sport").limit(600),
  ]);
  const lookup = lookupFrom(teams);
  const extra = new Map<string, Team>();
  const add = (names: string[], sport: Sport) => {
    for (const name of names) {
      if (lookup(name, sport) || extra.has(`${sport}:${name}`)) continue;
      extra.set(`${sport}:${name}`, { id: `typed:${sport}:${name}`, sport, name, country: null, logo_url: null, league: null, is_player: false });
    }
  };
  add(namesFrom(legs ?? []), "football");
  for (const p of (predictions ?? []) as { event: string; sport: Sport }[]) add(namesFrom([p]), p.sport);
  return [...teams, ...extra.values()];
}
