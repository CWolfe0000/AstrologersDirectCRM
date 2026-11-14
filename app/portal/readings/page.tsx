"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import type { ReadingKind } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { useMyReadings } from "@/components/portal/portal-data";
import { ReadingCard } from "@/components/portal/reading-card";

const FILTERS: { value: "all" | ReadingKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pdf", label: "PDF" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "document", label: "Documents" },
  { value: "link", label: "Links" },
];

export default function MyReadings() {
  const all = useMyReadings();
  const [q, setQ] = React.useState("");
  const [kind, setKind] = React.useState<"all" | ReadingKind>("all");
  const list = all.filter((r) => (kind === "all" || r.kind === kind) && (!q || (r.title + " " + r.message).toLowerCase().includes(q.toLowerCase())));
  const count = (k: string) => (k === "all" ? all.length : all.filter((r) => r.kind === k).length);

  return (
    <div>
      <h1 className="font-serif text-[34px] leading-tight text-ink md:text-[40px]">My Readings</h1>
      <p className="mt-1.5 text-[15px] text-muted">Every reading, recording and document shared with you, newest first.</p>

      <div className="sticky top-16 z-20 -mx-4 mt-6 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <SearchInput placeholder="Search your readings" value={q} onChange={(e) => setQ(e.target.value)} className="[&_input]:h-11 [&_input]:text-[15px] md:[&_input]:h-10 md:max-w-sm" />
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setKind(f.value)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                kind === f.value ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-3 hover:border-line-strong",
              )}
            >
              {f.label}
              <span className={cn("text-[11px]", kind === f.value ? "text-white/70" : "text-muted")}>{count(f.value)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((r) => (
          <ReadingCard key={r.id} r={r} />
        ))}
      </div>
      {list.length === 0 && (
        <EmptyState className="mt-4 rounded-2xl border border-dashed border-line bg-surface" icon={<BookOpen />} title="No readings match" body="Try a different search or filter." />
      )}
    </div>
  );
}
