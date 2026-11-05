"use client";

import { useEffect, useRef, useState } from "react";

// Slip screenshot drawn on a canvas with the viewer's name tiled across it, so a screenshot or photo of it shows who shared it.
// There is no <img> to right-click, drag, long-press or copy. Screenshots themselves can't be blocked by any website.
export default function ProtectedImage({ src, alt, watermark, className = "" }: { src: string; alt: string; watermark: string; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const c = canvas.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx) return;
      const { naturalWidth: w, naturalHeight: h } = img;
      c.width = w;
      c.height = h;
      ctx.drawImage(img, 0, 0);

      const size = Math.max(14, Math.round(w / 26));
      ctx.font = `700 ${size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(2, size / 7);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.fillStyle = "rgba(20,20,40,0.28)";
      const stepX = ctx.measureText(watermark).width + size * 3;
      const stepY = size * 5;
      const diag = Math.hypot(w, h);
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 6);
      for (let y = -diag / 2, row = 0; y < diag / 2; y += stepY, row++) {
        for (let x = -diag / 2 + (row % 2 ? stepX / 2 : 0); x < diag / 2; x += stepX) {
          ctx.strokeText(watermark, x, y);
          ctx.fillText(watermark, x, y);
        }
      }
      setState("ready");
    };
    img.onerror = () => setState("error");
    img.src = src;
    return () => {
      img.onload = img.onerror = null;
    };
  }, [src, watermark]);

  const block = (e: React.SyntheticEvent) => e.preventDefault();

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
      onContextMenu={block}
      onDragStart={block}
      onCopy={block}
    >
      <canvas
        ref={canvas}
        role="img"
        aria-label={alt}
        className={`block h-auto w-full rounded ${state === "ready" ? "" : "hidden"}`}
      />
      {state === "loading" && <div className="aspect-[4/5] w-full animate-pulse rounded bg-slip-line/60" />}
      {state === "error" && <div className="grid aspect-[4/5] w-full place-items-center rounded bg-slip-line/40 text-sm text-slip-ink">⚠ {alt}</div>}
    </div>
  );
}
