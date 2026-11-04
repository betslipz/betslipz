import "server-only";
import { createClient } from "@/lib/supabase/server";

// Team names from recent slips ("Home vs Away"), offered as suggestions in the slip form.
export async function knownTeams() {
  const supabase = await createClient();
  const { data } = await supabase.from("slip_legs").select("event").limit(600);
  const names = new Set<string>();
  for (const { event } of data ?? []) {
    for (const part of event.split(/\s+vs\.?\s+/i)) {
      const name = part.trim();
      if (name.length >= 2) names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
