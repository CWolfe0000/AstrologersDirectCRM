"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

const LOADED = process.env.NEXT_PUBLIC_BUILD_ID ?? "";

/**
 * A tab left open keeps running the version it loaded. When a newer version is
 * live, offer a refresh (checked on focus and every 15 minutes).
 */
export function UpdateNotice() {
  const [stale, setStale] = React.useState(false);
  React.useEffect(() => {
    if (!LOADED) return;
    let last = 0;
    const check = async () => {
      if (Date.now() - last < 60_000) return;
      last = Date.now();
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { build } = (await r.json()) as { build?: string };
        if (build && build !== LOADED) setStale(true);
      } catch {}
    };
    const onFocus = () => document.visibilityState === "visible" && void check();
    const id = setInterval(check, 15 * 60_000);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onFocus); window.removeEventListener("focus", onFocus); };
  }, []);
  if (!stale) return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-surface py-2 pl-4 pr-2 text-[13px] text-ink shadow-lg">
      A new version of AstrologersDirect is available.
      <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover"><RefreshCw className="size-3.5" /> Refresh</button>
    </div>
  );
}
