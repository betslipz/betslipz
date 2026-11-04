import "server-only";
import sharp from "sharp";
import { unstable_cache } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Teaser } from "@/components/LockedSlip";

// Blurred so heavily on the server that nothing is readable; the real image never reaches the browser.
const blurredPreview = unstable_cache(
  async (imagePath: string): Promise<string | null> => {
    const { data } = await createServiceClient().storage.from("slip-images").download(imagePath);
    if (!data) return null;
    const tiny = await sharp(Buffer.from(await data.arrayBuffer())).rotate().resize(36).toBuffer();
    const out = await sharp(tiny).resize(360).blur(4).modulate({ brightness: 0.9 }).webp({ quality: 45 }).toBuffer();
    return `data:image/webp;base64,${out.toString("base64")}`;
  },
  ["slip-blurred-preview-v2"],
  { revalidate: 3600 },
);

// Today's slip for the home page teaser: the newest open slip, preferring one that was uploaded as a screenshot.
export async function featuredSlip(): Promise<{ teaser: Teaser; preview: string | null } | null> {
  const supabase = await createClient();
  const { data: teasers } = await supabase.rpc("slip_teasers");
  if (!teasers?.length) return null;

  const { data: images } = await createServiceClient()
    .from("slips")
    .select("id, image_path")
    .in("id", (teasers as Teaser[]).map((t) => t.id))
    .not("image_path", "is", null);
  const withImage = (teasers as Teaser[]).find((t) => images?.some((i) => i.id === t.id));
  const teaser = withImage ?? (teasers[0] as Teaser);
  const path = images?.find((i) => i.id === teaser.id)?.image_path;

  let preview: string | null = null;
  if (path) {
    try {
      preview = await blurredPreview(path);
    } catch {
      preview = null; // fall back to the drawn slip
    }
  }
  return { teaser, preview };
}
