import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import SlipCard from "@/components/SlipCard";
import LockedSlip, { type Teaser } from "@/components/LockedSlip";
import { giftSlips, giftState } from "@/lib/gift";
import { claimWelcomeGift } from "@/app/actions/gift";

export default async function SlipsPage({ params, searchParams }: PageProps<"/[locale]/slips">) {
  const { locale, t } = await resolveLocale(params);
  const { gift: giftNotice } = await searchParams;
  const session = await getSession();
  const gift = giftState(session);
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
  const paths = slips.map((s) => s.image_path).filter((p): p is string => !!p);
  const signed = paths.length ? (await supabase.storage.from("slip-images").createSignedUrls(paths, 600)).data ?? [] : [];
  let imageFor = (path: string | null) => signed.find((s) => s.path === path)?.signedUrl ?? null;

  // Welcome gift: today's Regular slip, shown on top of whatever RLS allows.
  const giftIds = new Set<string>();
  if (gift === "active" && session?.giftSlip) {
    const g = await giftSlips(session.giftSlip);
    for (const s of g.slips) {
      if (!slips.some((x) => x.id === s.id)) slips.unshift(s);
      giftIds.add(s.id);
    }
    const own = imageFor;
    imageFor = (path) => own(path) ?? g.imageFor(path);
  }

  const visibleIds = new Set(slips.map((s) => s.id));
  const locked = ((teasers ?? []) as Teaser[]).filter((x) => !visibleIds.has(x.id));
  const giftReady = gift === "available" && locked.some((x) => x.tier === "regular");

  const activeSub = subs?.[0];

  return (
    <div className="page-wrap py-10">
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

      {giftNotice === "error" && <p className="card mb-6 border-danger/40 bg-danger/10 p-4 text-danger">{t.slips.giftError}</p>}

      {gift === "available" ? (
        <div className="card mb-6 border-vip/50 bg-vip/5 p-5">
          <p className="text-lg font-black">{t.slips.giftTitle}</p>
          <p className="mt-1 text-muted">{giftReady ? t.slips.giftText : t.slips.giftWait}</p>
          {giftReady && (
            <form action={claimWelcomeGift} className="mt-4">
              <input type="hidden" name="locale" value={locale} />
              <button className="btn btn-vip px-6">🎁 {t.slips.giftClaim}</button>
            </form>
          )}
        </div>
      ) : gift === "active" ? (
        <div className="card mb-6 border-vip/50 bg-vip/5 p-5">
          <p className="font-bold">🎁 {t.slips.giftActive}</p>
          <Link href={`/${locale}/subscribe`} className="btn btn-primary mt-4">
            {t.slips.upgrade}
          </Link>
        </div>
      ) : (
        !session?.tier &&
        locked.length > 0 && (
          <div className="card mb-6 border-accent/40 bg-accent/5 p-5">
            <p className="font-bold">🔒 {t.slips.lockedTitle}</p>
            <p className="mt-1 text-muted">{t.slips.lockedText}</p>
          </div>
        )
      )}

      {slips.length === 0 && locked.length === 0 ? (
        <p className="card p-10 text-center text-muted">{t.slips.none}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {slips.map((s) =>
            giftIds.has(s.id) ? (
              <div key={s.id} className="relative">
                <span className="absolute -top-3 start-4 z-10 rounded-full bg-vip px-3 py-1 text-xs font-black text-[#1a1200] shadow">
                  🎁 {t.slips.giftLabel}
                </span>
                <SlipCard slip={s} locale={locale} t={t} imageUrl={imageFor(s.image_path)} />
              </div>
            ) : (
              <SlipCard key={s.id} slip={s} locale={locale} t={t} imageUrl={imageFor(s.image_path)} />
            ),
          )}
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
