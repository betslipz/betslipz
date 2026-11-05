import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Teaser } from "@/components/LockedSlip";

// Today's slip for the home page teaser: the newest open slip. Only its tier, number of picks and total odds leave the database.
export async function featuredSlip(): Promise<{ teaser: Teaser } | null> {
  const supabase = await createClient();
  const { data: teasers } = await supabase.rpc("slip_teasers");
  if (!teasers?.length) return null;
  return { teaser: teasers[0] as Teaser };
}
