import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { SPORTS, flashscoreUrl } from "@/lib/sports";

// Free SoccersAPI scoreboard (no account needed). Embedded as a sandboxed frame so none of its scripts run on our pages.
const WIDGET_URL = "https://ls.soccersapi.com/?w=w_default";

export async function generateMetadata({ params }: PageProps<"/[locale]/live">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.live.title, description: t.live.subtitle };
}

export default async function LivePage({ params, searchParams }: PageProps<"/[locale]/live">) {
  const { locale, t } = await resolveLocale(params);
  const { sport: requested } = await searchParams;
  const sport = SPORTS.find((s) => s.key === requested) ?? SPORTS[0];
  const name = t.live.sports[sport.key];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="flex items-center gap-3 text-3xl font-black">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
        </span>
        {t.live.title}
      </h1>
      <p className="mb-6 mt-2 text-muted">{t.live.subtitle}</p>

      <nav aria-label={t.live.sport} className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max gap-2">
          {SPORTS.map((s) => {
            const active = s.key === sport.key;
            return (
              <li key={s.key}>
                <Link
                  href={s.key === "football" ? `/${locale}/live` : `/${locale}/live?sport=${s.key}`}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                    active ? "border-accent bg-accent text-[#04130a]" : "border-border bg-surface text-text hover:border-muted"
                  }`}
                >
                  <span aria-hidden>{s.emoji}</span>
                  {t.live.sports[s.key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {sport.key === "football" ? (
        <>
          <p className="mb-3 text-sm text-muted">{t.live.hint}</p>
          <div className="card overflow-hidden p-0">
            <iframe
              src={WIDGET_URL}
              title={`${t.live.title}: ${name}`}
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              // The scoreboard can't report its height, so the frame is taller than a full day's list (~6,000px desktop,
              // ~6,600px phone) and the page scrolls instead of the frame.
              className="block h-[7400px] w-full bg-surface-2 md:h-[6600px]"
            />
          </div>
          <p className="mt-3 text-xs text-muted">{t.live.credit}</p>
        </>
      ) : (
        <div className="card hero-glow flex flex-col items-center px-6 py-14 text-center">
          <span className="text-6xl" aria-hidden>
            {sport.emoji}
          </span>
          <h2 className="mt-4 text-2xl font-black">{name}</h2>
          <p className="mt-2 max-w-md text-muted">{t.live.external.replace("{sport}", name)}</p>
          <a
            href={flashscoreUrl(sport.flashscore)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-6 px-6 py-3 text-base"
          >
            {t.live.openOn} <span className="rtl:-scale-x-100">↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
