import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { getSession, seesAllSlips } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SLIP_SELECT, type Slip } from "@/lib/types";
import SlipCard from "@/components/SlipCard";
import LockedSlip, { teaserState, type Teaser } from "@/components/LockedSlip";
import { giftState } from "@/lib/gift";
import { claimWelcomeGift } from "@/app/actions/gift";

export default async function SlipsPage({ params, searchParams }: PageProps<"/[locale]/slips">) {
  const { locale, t } = await resolveLocale(params);
  const { gift: giftNotice } = await searchParams;
  const session = await getSession();
  const gift = giftState(session);
  const all = seesAllSlips(session);
  const supabase = await createClient();

  // RLS decides which open slips come back (VIP, admin, or bought); teasers carry no picks or confidence.
  const [{ data: visible }, { data: teasers }, { data: unlocks }, { data: pendingPays }] = await Promise.all([
    supabase.from("slips").select(SLIP_SELECT).eq("status", "pending").lte("publish_at", new Date().toISOString()).order("publish_at", { ascending: false }),
    supabase.rpc("slip_teasers"),
    session ? supabase.from("slip_unlocks").select("slip_id, payment_id").eq("user_id", session.userId) : Promise.resolve({ data: [] }),
    session
      ? supabase.from("payments").select("slip_id").eq("user_id", session.userId).eq("status", "pending").not("slip_id", "is", null)
      : Promise.resolve({ data: [] }),
  ]);

  const slips = (visible ?? []) as Slip[];
  const paths = slips.map((s) => s.image_path).filter((p): p is string => !!p);
  const signed = paths.length ? (await supabase.storage.from("slip-images").createSignedUrls(paths, 600)).data ?? [] : [];
  const imageFor = (path: string | null) => signed.find((s) => s.path === path)?.signedUrl ?? null;

  // Slips this member opened themselves: bought (with a payment) or the welcome gift (without).
  const owned = new Map((unlocks ?? []).map((u) => [u.slip_id as string, u.payment_id ? "bought" : "gift"] as const));
  const pending = new Set((pendingPays ?? []).map((p) => p.slip_id as string));
  const visibleIds = new Set(slips.map((s) => s.id));
  const locked = ((teasers ?? []) as Teaser[]).filter((x) => !visibleIds.has(x.id));
  const giftReady = gift === "available" && locked.some((x) => teaserState(x, pending.has(x.id)) === "buy");

  return (
    <div className="page-wrap py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{t.slips.title}</h1>
          <p className="mt-1 max-w-2xl text-muted">{t.slips.subtitle}</p>
        </div>
        {session?.access.vip ? (
          <span className="rounded-full bg-vip px-3 py-1.5 text-sm font-black text-[#1a1200]">★ {t.slips.allOpen}</span>
        ) : (
          !all && (
            <Link href={`/${locale}/subscribe?tier=vip`} className="btn btn-vip">
              ★ {t.slips.getVip}
            </Link>
          )
        )}
      </div>

      {giftNotice === "error" && <p className="card mb-6 border-danger/40 bg-danger/10 p-4 text-danger">{t.slips.giftError}</p>}
      {giftNotice === "opened" && <p className="card mb-6 border-vip/50 bg-vip/5 p-4 font-bold">🎁 {t.slips.giftOpened}</p>}
      {gift === "available" && (
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
      )}

      {slips.length === 0 && locked.length === 0 ? (
        <p className="card p-10 text-center text-muted">{t.slips.none}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {slips.map((s) => {
            const mine = !all ? owned.get(s.id) : undefined;
            return (
              <div key={s.id} id={`slip-${s.id}`} className="relative scroll-mt-24">
                {mine && (
                  <span className="absolute -top-3 start-4 z-10 rounded-full bg-vip px-3 py-1 text-xs font-black text-[#1a1200] shadow">
                    {mine === "gift" ? `🎁 ${t.slips.giftLabel}` : `✓ ${t.slips.bought}`}
                  </span>
                )}
                <SlipCard slip={s} locale={locale} t={t} imageUrl={imageFor(s.image_path)} />
              </div>
            );
          })}
          {locked.map((x) => (
            <LockedSlip key={x.id} teaser={x} state={teaserState(x, pending.has(x.id))} locale={locale} t={t} />
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href={`/${locale}/results?source=slips`} className="btn btn-ghost">
          {t.slips.archive} <span className="inline-block rtl:rotate-180">→</span>
        </Link>
      </div>
    </div>
  );
}
