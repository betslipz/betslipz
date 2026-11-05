import "server-only";
import { createClient } from "@/lib/supabase/server";
import { teaserState, type Teaser } from "@/components/LockedSlip";

// The slip for the home page teaser: the newest open slip that can still be bought (else the newest open one).
// Only its number of picks, total odds and price leave the database.
export async function featuredSlip(): Promise<{ teaser: Teaser } | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("slip_teasers");
  const teasers = (data ?? []) as Teaser[];
  const teaser = teasers.find((x) => teaserState(x, false) === "buy") ?? teasers[0];
  return teaser ? { teaser } : null;
}
