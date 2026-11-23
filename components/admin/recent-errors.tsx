"use client";

import * as React from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { cn, relTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type E = { id: string; source: string; message: string; stack: string | null; url: string | null; count: number; firstAt: string; lastAt: string };

/** Admin: what's gone wrong lately (built-in error monitoring). */
export function RecentErrors() {
  const [list, setList] = React.useState<E[] | null>(null);
  const [open, setOpen] = React.useState<string | null>(null);
  React.useEffect(() => { api<{ errors: E[] }>("/api/admin/errors").then((r) => setList(r.errors), () => setList([])); }, []);
  if (!list) return null;
  return (
    <section className="mb-8 rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <AlertTriangle className="size-4 text-accent" />
        <h2 className="text-[15px] font-semibold text-ink">Recent Errors</h2>
        <Badge tone={list.length ? "warn" : "sage"}>{list.length}</Badge>
        <span className="ml-auto text-[12px] text-muted">You’re emailed the first time each one happens.</span>
      </div>
      {list.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-muted">No errors recorded.</p>
      ) : (
        <ul className="divide-y divide-line">
          {list.slice(0, 20).map((e) => (
            <li key={e.id} className="text-[13px]">
              <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-canvas-2">
                <Badge tone={e.source === "server" ? "danger" : "warn"}>{e.source === "server" ? "Server" : "Browser"}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{e.message}</span>
                  <span className="block text-[12px] text-muted">{e.count} time{e.count === 1 ? "" : "s"} · last {relTime(e.lastAt, new Date())}{e.url ? ` · ${e.url}` : ""}</span>
                </span>
                <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted transition-transform", open === e.id && "rotate-180")} />
              </button>
              {open === e.id && e.stack && <pre className="mx-5 mb-3 max-h-60 overflow-auto rounded-lg bg-canvas-2 p-3 text-[11px] leading-snug text-ink-3">{e.stack}</pre>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
