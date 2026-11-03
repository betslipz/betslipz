"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/en";

export default function AgeGate({ t }: { t: Dictionary["age"] }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cookie is only readable after hydration
    if (!document.cookie.includes("age_ok=1")) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="card w-full max-w-sm p-6 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border-2 border-danger text-lg font-black text-danger">
          18+
        </div>
        <h2 className="text-xl font-bold">{t.title}</h2>
        <p className="mt-2 text-muted">{t.text}</p>
        <div className="mt-6 flex gap-3">
          <button
            className="btn btn-primary flex-1"
            onClick={() => {
              document.cookie = "age_ok=1; path=/; max-age=31536000; samesite=lax";
              setShow(false);
            }}
          >
            {t.yes}
          </button>
          <a className="btn btn-ghost flex-1" href="https://www.google.com">
            {t.no}
          </a>
        </div>
      </div>
    </div>
  );
}
