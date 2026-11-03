import { SITE_NAME } from "@/lib/config";

// Placeholder mark; swap for your real logo later.
export default function Logo() {
  return (
    <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-[#04130a]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <path d="M5 4h10l4 4v12H5z" strokeLinejoin="round" />
          <path d="M8.5 12.5l2 2 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span dir="ltr">{SITE_NAME}</span>
    </span>
  );
}
