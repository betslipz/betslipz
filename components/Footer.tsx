import type { Locale } from "@/lib/config";
import { SITE_NAME } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import Link from "next/link";
import Logo from "@/components/Logo";
import { LEGAL_DOCS } from "@/lib/legal";

export default function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <footer className="mt-16 border-t border-border">
      <div className="page-wrap space-y-3 py-8 text-sm text-muted">
        <Logo className="mb-5 h-8 opacity-90" />
        <div className="flex items-start gap-3">
          <span className="shrink-0 rounded-md border border-danger/60 px-2 py-0.5 text-xs font-bold text-danger">18+</span>
          <p>{t.footer.disclaimer}</p>
        </div>
        <p>
          {t.footer.help}{" "}
          <a className="text-accent underline" href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer">
            BeGambleAware
          </a>
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label={t.legal.nav}>
          {LEGAL_DOCS.map((d) => (
            <Link key={d} href={`/${locale}/${d}`} className="text-text hover:text-accent">
              {t.legal[d]}
            </Link>
          ))}
        </nav>
        <p>
          © {new Date().getFullYear()} <span dir="ltr">{SITE_NAME}</span>. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
