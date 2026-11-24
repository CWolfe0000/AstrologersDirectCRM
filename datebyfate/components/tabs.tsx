import Link from "next/link";

/** Tabs that are plain links (?tab=…), so each tab is its own server-rendered view and can be bookmarked. */
export function Tabs({ base, tabs, current }: { base: string; tabs: { id: string; label: string; count?: number }[]; current: string }) {
  return (
    <nav aria-label="Sections" className="-mx-4 mb-6 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0">
      <ul className="flex gap-1 whitespace-nowrap">
        {tabs.map((t, i) => (
          <li key={t.id}>
            <Link
              href={i === 0 ? base : `${base}?tab=${t.id}`}
              scroll={false}
              aria-current={current === t.id ? "page" : undefined}
              className={`heading -mb-px inline-flex h-10 items-center gap-1.5 border-b-2 px-3 text-[13.5px] font-medium ${current === t.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {t.label}
              {t.count !== undefined && <span className="rounded-full bg-canvas-2 px-1.5 text-[11px] text-muted">{t.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
