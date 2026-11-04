import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import SlipCard from "@/components/SlipCard";

export default async function ResultsPage({ params }: PageProps<"/[locale]/results">) {
  const { locale, t } = await resolveLocale(params);
  const supabase = await createClient();
  // RLS returns only settled slips to the public.
  const { data } = await supabase
    .from("slips")
    .select(SLIP_SELECT)
    .neq("status", "pending")
    .order("settled_at", { ascending: false })
    .limit(60);
  const slips = (data ?? []) as Slip[];
  // Screenshot-only slips need their image to show anything; storage RLS allows it once settled.
  const paths = slips.filter((s) => s.slip_legs.length === 0 && s.image_path).map((s) => s.image_path as string);
  const signed = paths.length ? ((await supabase.storage.from("slip-images").createSignedUrls(paths, 600)).data ?? []) : [];
  const imageFor = (p: string | null) => signed.find((s) => s.path === p)?.signedUrl ?? undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">{t.results.title}</h1>
      <p className="mb-8 mt-2 text-muted">{t.results.subtitle}</p>
      {slips.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t.common.noData}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {slips.map((s) => (
            <SlipCard key={s.id} slip={s} locale={locale} t={t} imageUrl={imageFor(s.image_path)} compact />
          ))}
        </div>
      )}
    </div>
  );
}
