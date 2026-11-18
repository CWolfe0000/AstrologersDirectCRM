"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Real application screenshot inside a refined browser (or phone) frame.
 * Screenshots live in /public/screenshots and are generated from the running application (scripts/screenshots.mjs).
 */
export function ProductShot({
  src,
  alt,
  url = "app.astrologersdirect.com",
  device = "browser",
  className,
  priority,
}: {
  src: string;
  alt: string;
  url?: string;
  device?: "browser" | "phone";
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = React.useState(false);
  const ref = React.useRef<HTMLImageElement>(null);
  // An image that 404s before hydration never fires onError on the client — check once mounted.
  React.useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  const img = failed ? (
    <div className={cn("flex w-full flex-col items-center justify-center gap-2 bg-canvas-2 text-center text-muted", device === "phone" ? "aspect-[9/19]" : "aspect-[16/10]")}>
      <ImageIcon className="size-6 opacity-60" />
      <span className="px-4 text-[12.5px]">{alt}</span>
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <div className={cn("w-full overflow-hidden bg-canvas-2", device === "phone" ? "aspect-[9/19]" : "aspect-[16/10]")}>
      <img ref={ref} src={src} alt={alt} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} className="block size-full object-cover object-top" />
    </div>
  );

  if (device === "phone") {
    return (
      <div className={cn("rounded-[2.2rem] border border-ink/10 bg-ink p-2 shadow-frame", className)}>
        <div className="overflow-hidden rounded-[1.7rem] bg-surface">{img}</div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface shadow-frame", className)}>
      <div className="flex h-9 items-center gap-3 border-b border-line bg-canvas-2/70 px-3.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </div>
        <div className="mx-auto hidden h-5 max-w-xs flex-1 items-center justify-center rounded-md bg-surface px-3 text-[11px] text-muted sm:flex">{url}</div>
        <div className="w-10" />
      </div>
      {img}
    </div>
  );
}
