import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/config";
import { fmtDay } from "@/lib/format";
import { LEGAL_DOCS, LEGAL_UPDATED, legalDoc, type LegalDoc } from "@/lib/legal";

type Params = Promise<{ locale: string }>;

const fill = (s: string) => s.replaceAll("{site}", SITE_NAME);

// Placeholder contact details from the initial setup are never shown to visitors.
const isReal = (v: unknown): v is string => typeof v === "string" && v.trim().length > 3 && !/example\.com|XX/i.test(v);

export async function legalMetadata(params: Params, doc: LegalDoc): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return { title: legalDoc(locale, doc).title };
}

export default async function LegalPage({ params, doc }: { params: Params; doc: LegalDoc }) {
  const { locale, t } = await resolveLocale(params);
  const d = legalDoc(locale, doc);
  const { data: contactRow } = await (await createClient()).from("settings").select("value").eq("key", "contact").maybeSingle();
  const contact = (contactRow?.value ?? {}) as { email?: unknown; whatsapp?: unknown };
  const email = isReal(contact.email) ? contact.email.trim() : null;
  const whatsapp = isReal(contact.whatsapp) ? contact.whatsapp.trim() : null;

  const blocks = (body: (string | string[])[]) =>
    body.map((b, i) =>
      typeof b === "string" ? (
        <p key={i}>{fill(b)}</p>
      ) : (
        <ul key={i} className="list-disc space-y-1.5 ps-5 marker:text-muted">
          {b.map((li, j) => (
            <li key={j}>{fill(li)}</li>
          ))}
        </ul>
      ),
    );

  return (
    <div className="page-wrap py-10">
      <nav className="mb-8 flex flex-wrap gap-2" aria-label={t.legal.nav}>
        {LEGAL_DOCS.map((k) => (
          <Link
            key={k}
            href={`/${locale}/${k}`}
            aria-current={k === doc ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${k === doc ? "border-accent bg-accent text-[#04130a]" : "border-border hover:border-muted"}`}
          >
            {t.legal[k]}
          </Link>
        ))}
      </nav>

      <article className="max-w-3xl space-y-8 leading-relaxed">
        <header>
          <h1 className="text-3xl font-black">{d.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {t.legal.updated.replace("{date}", fmtDay(LEGAL_UPDATED, locale, { day: "numeric", month: "long", year: "numeric" }))}
          </p>
          <div className="mt-4 space-y-3">{blocks(d.intro)}</div>
        </header>

        {d.sections.map((s) => (
          <section key={s.h} className="space-y-3">
            <h2 className="text-lg font-bold">{s.h}</h2>
            {blocks(s.body)}
          </section>
        ))}

        {(email || whatsapp) && (
          <section className="card space-y-2 p-5">
            <h2 className="text-lg font-bold">{t.legal.contactTitle}</h2>
            <p className="text-muted">{t.legal.contactText}</p>
            {email && (
              <p>
                {t.legal.email}:{" "}
                <a href={`mailto:${email}`} className="text-accent underline" dir="ltr">
                  {email}
                </a>
              </p>
            )}
            {whatsapp && (
              <p>
                {t.legal.whatsapp}:{" "}
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-accent underline" dir="ltr">
                  {whatsapp}
                </a>
              </p>
            )}
          </section>
        )}
      </article>
    </div>
  );
}
