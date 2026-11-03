import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import SlipCard from "@/components/SlipCard";
import LockedSlip, { type Teaser } from "@/components/LockedSlip";

export default async function SlipsPage({ params }: PageProps<"/[locale]/slips">) {
  const { locale, t } = await resolveLocale(params);
  const session = await getSession();
  const supabase = await createClient();

  // RLS decides which open slips come back; teasers carry no picks or confidence.
  const [{ data: visible }, { data: teasers }, { data: subs }] = await Promise.all([
    supabase.from("slips").select(SLIP_SELECT).eq("status", "pending").lte("publish_at", new Date().toISOString()).order("publish_at", { ascending: false }),
    supabase.rpc("slip_teasers"),
    session
      ? supabase.from("subscriptions").select("tier, ends_at").eq("revoked", false).gt("ends_at", new Date().toISOString()).order("ends_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const slips = (visible ?? []) as Slip[];
  const visibleIds = new Set(slips.map((s) => s.id));
  const locked = ((teasers ?? []) as Teaser[]).filter((x) => !visibleIds.has(x.id));

  const paths = slips.map((s) => s.image_path).filter((p): p is string => !!p);
  const signed = paths.length ? (await supabase.storage.from("slip-images").createSignedUrls(paths, 600)).data ?? [] : [];
  const imageFor = (path: string | null) => signed.find((s) => s.path === path)?.signedUrl ?? null;

  const activeSub = subs?.[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{t.slips.title}</h1>
          <p className="mt-1 text-muted">{fmtDate(new Date().toISOString(), locale, false)}</p>
        </div>
        {session?.tier && activeSub ? (
          <div className="card flex items-center gap-3 px-4 py-2 text-sm">
            <span className="text-muted">{t.slips.yourPlan}:</span>
            <b className={session.tier === "vip" ? "text-vip" : "text-accent"}>{session.tier === "vip" ? t.common.vip : t.common.regular}</b>
            <span className="text-muted">
              · {t.slips.expires} {fmtDate(activeSub.ends_at, locale, false)}
            </span>
            {session.tier === "regular" && (
              <Link href={`/${locale}/subscribe?tier=vip`} className="btn btn-vip px-3 py-1 text-xs">
                {t.slips.upgradeVip}
              </Link>
            )}
          </div>
        ) : (
          <Link href={`/${locale}/subscribe`} className="btn btn-primary">
            {t.slips.upgrade}
          </Link>
        )}
      </div>

      {!session?.tier && locked.length > 0 && (
        <div className="card mb-6 border-accent/40 bg-accent/5 p-5">
          <p className="font-bold">🔒 {t.slips.lockedTitle}</p>
          <p className="mt-1 text-muted">{t.slips.lockedText}</p>
        </div>
      )}

      {slips.length === 0 && locked.length === 0 ? (
        <p className="card p-10 text-center text-muted">{t.slips.none}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {slips.map((s) => (
            <SlipCard key={s.id} slip={s} locale={locale} t={t} imageUrl={imageFor(s.image_path)} />
          ))}
          {locked.map((x) => (
            <LockedSlip key={x.id} teaser={x} locale={locale} t={t} needsVip={x.tier === "vip"} />
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href={`/${locale}/results`} className="btn btn-ghost">
          {t.slips.archive} →
        </Link>
      </div>
    </div>
  );
}
