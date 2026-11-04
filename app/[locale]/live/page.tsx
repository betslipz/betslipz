import type { Metadata } from "next";
import { resolveLocale } from "@/lib/locale";

// Free SoccersAPI scoreboard (no account needed). Embedded as a sandboxed frame so none of its scripts run on our pages.
const WIDGET_URL = "https://ls.soccersapi.com/?w=w_default";

export async function generateMetadata({ params }: PageProps<"/[locale]/live">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.live.title, description: t.live.subtitle };
}

export default async function LivePage({ params }: PageProps<"/[locale]/live">) {
  const { t } = await resolveLocale(params);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="flex items-center gap-3 text-3xl font-black">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
        </span>
        {t.live.title}
      </h1>
      <p className="mt-2 text-muted">{t.live.subtitle}</p>
      <p className="mb-6 mt-1 text-sm text-muted">{t.live.hint}</p>

      <div className="card overflow-hidden p-0">
        <iframe
          src={WIDGET_URL}
          title={t.live.title}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="block h-[80vh] min-h-[640px] w-full bg-surface-2"
        />
      </div>
      <p className="mt-3 text-xs text-muted">{t.live.credit}</p>
    </div>
  );
}
