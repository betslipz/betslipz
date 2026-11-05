import Link from "next/link";
import { Fragment } from "react";

// Turns the given phrases inside a translated sentence into links, e.g. "…accept the Terms of Service…".
export default function LinkedText({ text, links }: { text: string; links: Record<string, string> }) {
  const phrases = Object.keys(links).filter((p) => text.includes(p));
  if (!phrases.length) return <>{text}</>;
  const pattern = new RegExp(`(${phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`);
  return (
    <>
      {text.split(pattern).map((part, i) =>
        links[part] ? (
          <Link key={i} href={links[part]} target="_blank" className="text-accent underline">
            {part}
          </Link>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
