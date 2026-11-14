"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as D from "@radix-ui/react-dialog";
import { Search, User, CircleDot, NotebookPen, CalendarDays, Send, CornerDownLeft } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { cn, fmtDate, stripHtml } from "@/lib/utils";
import { Kbd } from "@/components/ui/misc";

type Result = { id: string; group: string; title: string; sub?: string; href: string; icon: React.ElementType };

export function GlobalSearch({ trigger }: { trigger: (open: () => void) => React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [idx, setIdx] = React.useState(0);
  const router = useRouter();
  const s = useStore();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = React.useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const name = (id?: string) => personName(s.people.find((p) => p.id === id));
    const out: Result[] = [];
    const m = (str: string) => !term || str.toLowerCase().includes(term);
    s.clients.forEach((c) => {
      const n = name(c.id);
      if (m(n + " " + c.email)) out.push({ id: c.id, group: "Clients", title: n, sub: c.email, href: `/app/clients/${c.id}`, icon: User });
    });
    s.charts.forEach((c) => {
      if (m(c.title)) out.push({ id: c.id, group: "Charts", title: c.title, sub: c.type, href: `/app/charts/${c.id}`, icon: CircleDot });
    });
    s.observations.forEach((o) => {
      if (m(o.title + " " + stripHtml(o.body) + " " + o.tags.join(" "))) out.push({ id: o.id, group: "Observations", title: o.title, sub: name(o.clientId), href: `/app/observations?id=${o.id}`, icon: NotebookPen });
    });
    s.consultations.forEach((k) => {
      if (term && m(k.type + " " + name(k.clientId))) out.push({ id: k.id, group: "Consultations", title: `${k.type} — ${name(k.clientId)}`, sub: fmtDate(k.start), href: `/app/consultations?id=${k.id}`, icon: CalendarDays });
    });
    s.readings.forEach((r) => {
      if (term && m(r.title)) out.push({ id: r.id, group: "Readings", title: r.title, sub: name(r.clientId), href: `/app/delivery?id=${r.id}`, icon: Send });
    });
    // cap per group
    const groups: Record<string, number> = {};
    return out.filter((r) => (groups[r.group] = (groups[r.group] ?? 0) + 1) <= (term ? 6 : 4));
  }, [q, s.clients, s.charts, s.observations, s.consultations, s.readings, s.people]);

  React.useEffect(() => setIdx(0), [q]);

  const go = (r?: Result) => {
    if (!r) return;
    setOpen(false);
    setQ("");
    router.push(r.href);
  };

  let lastGroup = "";
  return (
    <>
      {trigger(() => setOpen(true))}
      <D.Root open={open} onOpenChange={setOpen}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] animate-fade-in" />
          <D.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-slide-up focus:outline-none">
            <D.Title className="sr-only">Search</D.Title>
            <D.Description className="sr-only">Search clients, charts, observations, consultations and readings</D.Description>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-[18px] text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
                  if (e.key === "Enter") go(results[idx]);
                }}
                placeholder="Search clients, charts, observations…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
              />
              <Kbd>Esc</Kbd>
            </div>
            <div className="scrollbar-thin max-h-[55vh] overflow-y-auto p-2">
              {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">No results for “{q}”.</p>}
              {results.map((r, i) => {
                const header = r.group !== lastGroup ? r.group : null;
                lastGroup = r.group;
                return (
                  <React.Fragment key={r.group + r.id}>
                    {header && <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{header}</div>}
                    <button
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => go(r)}
                      className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === idx && "bg-canvas-2")}
                    >
                      <r.icon className="size-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-ink">{r.title}</span>
                        {r.sub && <span className="block truncate text-[12px] capitalize text-muted">{r.sub}</span>}
                      </span>
                      {i === idx && <CornerDownLeft className="size-3.5 text-muted" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="flex items-center gap-3 border-t border-line bg-canvas px-4 py-2 text-[11.5px] text-muted">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
              <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
              <span className="ml-auto flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd> toggle</span>
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    </>
  );
}
