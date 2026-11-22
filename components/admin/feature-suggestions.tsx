"use client";

import * as React from "react";
import { Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type S = { id: string; name: string; email: string; area: string; text: string; createdAt: string };

/** Admin: what practitioners have asked for, newest first. */
export function FeatureSuggestions() {
  const [list, setList] = React.useState<S[] | null>(null);
  const [all, setAll] = React.useState(false);
  React.useEffect(() => { api<{ suggestions: S[] }>("/api/admin/feedback").then((r) => setList(r.suggestions), () => setList([])); }, []);
  if (!list) return null;
  const shown = all ? list : list.slice(0, 5);
  return (
    <section className="mb-8 rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <Lightbulb className="size-4 text-accent" />
        <h2 className="text-[15px] font-semibold text-ink">Feature Suggestions</h2>
        <Badge tone="neutral">{list.length}</Badge>
      </div>
      {list.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-muted">No suggestions yet. Practitioners send them from the Help menu or the sidebar.</p>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((s) => (
            <li key={s.id} className="px-5 py-3 text-[13px]">
              <p className="flex flex-wrap items-baseline gap-x-2"><span className="font-medium text-ink">{s.name}</span><span className="text-muted">{s.email} · {fmtDate(s.createdAt)}</span><Badge tone="accent">{s.area}</Badge></p>
              <p className="mt-1 whitespace-pre-line text-ink-3">{s.text}</p>
            </li>
          ))}
        </ul>
      )}
      {list.length > 5 && <button type="button" onClick={() => setAll(!all)} className="w-full border-t border-line px-5 py-2.5 text-[12.5px] font-medium text-accent hover:bg-canvas-2">{all ? "Show Fewer" : `Show All ${list.length}`}</button>}
    </section>
  );
}
