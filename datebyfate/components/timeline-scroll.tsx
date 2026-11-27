"use client";

import { useEffect, useRef } from "react";

/**
 * The timeline's own sideways scroller. The page never scrolls sideways; this box does. On a narrow
 * screen it opens with the given point (today) a quarter of the way across what is visible.
 */
export function TimelineScroll({ focus, gutter, label, children }: { focus: number | null; gutter: number; label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || focus === null) return;
    el.scrollLeft = Math.max(0, focus - (el.clientWidth - gutter) * 0.25);
  }, [focus, gutter]);
  return (
    <div ref={ref} role="region" aria-label={label} tabIndex={0} className="scrollbar-thin w-full max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-line bg-white shadow-card">
      {children}
    </div>
  );
}
