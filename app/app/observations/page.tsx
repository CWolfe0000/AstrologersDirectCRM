"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Filter, NotebookPen, Pin, Plus, Telescope, X } from "lucide-react";
import { ASPECTS, BODIES, CHART_TYPES, PLANET_IDS, type AspectId, type BodyId } from "@/lib/astro";
import type { ChartType, ObservationScope } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, fmtDate, stripHtml } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, SearchInput, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ObservationEditor } from "@/components/observations/observation-editor";
import { ScopeBadge, SCOPE_META, ownershipFor } from "@/components/observations/obs-meta";
import { ChartTypeBadge } from "@/components/chart/chart-helpers";
import { useHydrated } from "@/components/workspace/use-hydrated";

type Filters = {
  client: string;
  scope: ObservationScope | "all";
  chartType: ChartType | "all";
  planets: BodyId[];
  aspect: AspectId | "all";
  house: number | 0;
  from: string;
  to: string;
  tags: string[];
};
const EMPTY: Filters = { client: "all", scope: "all", chartType: "all", planets: [], aspect: "all", house: 0, from: "", to: "", tags: [] };

export default function ObservationsPage() {
  return (
    <React.Suspense>
      <Observations />
    </React.Suspense>
  );
}

function Observations() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const observations = useStore((s) => s.observations);
  const charts = useStore((s) => s.charts);
  const people = useStore((s) => s.people);
  const clients = useStore((s) => s.clients);

  const [q, setQ] = React.useState("");
  const [f, setF] = React.useState<Filters>({ ...EMPTY, client: params.get("client") && !params.get("new") ? params.get("client")! : "all" });
  const [selected, setSelected] = React.useState<string | "new" | null>(params.get("new") ? "new" : params.get("id"));
  const [newKey, setNewKey] = React.useState(0);
  const [mobileDetail, setMobileDetail] = React.useState(!!(params.get("new") || params.get("id")));
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const createdRef = React.useRef<string | null>(null);
  // react to URL changes (e.g. quick-create while already on the page)
  React.useEffect(() => {
    if (params.get("id") && params.get("id") === createdRef.current) return; // created by the open "new" editor
    if (params.get("new")) {
      setSelected("new");
      setNewKey((k) => k + 1);
      setMobileDetail(true);
    } else if (params.get("id")) {
      setSelected(params.get("id"));
      setMobileDetail(true);
    }
  }, [params]);

  const name = (id?: string) => personName(people.find((p) => p.id === id));
  const chartOf = (id: string) => charts.find((c) => c.id === id);
  const allTags = Array.from(new Set(observations.flatMap((o) => o.tags))).sort();

  const results = observations
    .filter((o) => f.client === "all" || o.clientId === f.client)
    .filter((o) => f.scope === "all" || o.scope === f.scope)
    .filter((o) => f.chartType === "all" || chartOf(o.chartId)?.type === f.chartType)
    .filter((o) => f.planets.every((p) => o.planets.includes(p)))
    .filter((o) => f.aspect === "all" || o.aspects.includes(f.aspect))
    .filter((o) => !f.house || o.houses.includes(f.house))
    .filter((o) => !f.from || o.updatedAt.slice(0, 10) >= f.from)
    .filter((o) => !f.to || o.updatedAt.slice(0, 10) <= f.to)
    .filter((o) => f.tags.every((t) => o.tags.includes(t)))
    .filter((o) => {
      const t = q.trim().toLowerCase();
      if (!t) return true;
      return (o.title + " " + stripHtml(o.body) + " " + o.tags.join(" ") + " " + name(o.clientId) + " " + (chartOf(o.chartId)?.title ?? "")).toLowerCase().includes(t);
    })
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (b.updatedAt > a.updatedAt ? 1 : -1));

  // Desktop default selection
  React.useEffect(() => {
    if (hydrated && selected === null && results[0] && window.matchMedia("(min-width: 1024px)").matches) setSelected(results[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const activeFilters = (Object.keys(f) as (keyof Filters)[]).filter((k) => JSON.stringify(f[k]) !== JSON.stringify(EMPTY[k])).length;

  const open = (id: string) => {
    setSelected(id);
    setMobileDetail(true);
    router.replace(`/app/observations?id=${id}`, { scroll: false });
  };
  const startNew = () => {
    setSelected("new");
    setNewKey((k) => k + 1);
    setMobileDetail(true);
  };

  // Initial ownership for a new observation (data rule applied via chart)
  const newInitial = React.useMemo(() => {
    const chartParam = params.get("chart");
    const clientParam = params.get("client") ?? (f.client !== "all" ? f.client : null);
    const chart =
      (chartParam && charts.find((c) => c.id === chartParam)) ||
      (clientParam && (charts.find((c) => c.clientId === clientParam && c.type === "natal") ?? charts.find((c) => c.clientId === clientParam))) ||
      charts.find((c) => c.type === "natal") ||
      charts[0];
    return chart ? ownershipFor(chart) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, charts, f.client, newKey]);

  const filterPanel = (
    <div className="space-y-4 text-[13px]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">Filters</p>
        {activeFilters > 0 && (
          <button onClick={() => setF(EMPTY)} className="text-[12px] text-accent hover:underline">
            Clear all ({activeFilters})
          </button>
        )}
      </div>
      <label className="block">
        <span className="mb-1 block text-[12px] text-muted">Client</span>
        <Select value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })}>
          <option value="all">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{name(c.id)}</option>
          ))}
        </Select>
      </label>
      <div>
        <span className="mb-1 block text-[12px] text-muted">Belongs to</span>
        <div className="flex flex-wrap gap-1">
          {(["all", "natal", "relationship", "timing"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setF({ ...f, scope: s })}
              className={cn("h-7 rounded-md border px-2 text-[12px]", f.scope === s ? "border-accent bg-accent-50 text-accent" : "border-line text-ink-3 hover:border-line-strong")}
            >
              {s === "all" ? "All" : SCOPE_META[s].label}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-[12px] text-muted">Chart type</span>
        <Select value={f.chartType} onChange={(e) => setF({ ...f, chartType: e.target.value as ChartType | "all" })}>
          <option value="all">All chart types</option>
          {CHART_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </label>
      <div>
        <span className="mb-1 block text-[12px] text-muted">Planet</span>
        <div className="flex flex-wrap gap-1">
          {PLANET_IDS.map((p) => (
            <button
              key={p}
              title={BODIES[p].name}
              aria-pressed={f.planets.includes(p)}
              onClick={() => setF({ ...f, planets: f.planets.includes(p) ? f.planets.filter((x) => x !== p) : [...f.planets, p] })}
              className={cn("glyph size-7 rounded-md border text-[14px]", f.planets.includes(p) ? "border-accent bg-accent-50 text-accent" : "border-line text-ink-3 hover:border-line-strong")}
            >
              {BODIES[p].glyph}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted">Aspect</span>
          <Select value={f.aspect} onChange={(e) => setF({ ...f, aspect: e.target.value as AspectId | "all" })}>
            <option value="all">Any</option>
            {(["conjunction", "opposition", "trine", "square", "sextile", "quincunx"] as AspectId[]).map((a) => (
              <option key={a} value={a}>{ASPECTS[a].name}</option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted">House</span>
          <Select value={f.house} onChange={(e) => setF({ ...f, house: Number(e.target.value) })}>
            <option value={0}>Any</option>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </Select>
        </label>
      </div>
      <div>
        <span className="mb-1 block text-[12px] text-muted">Last edited</span>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} aria-label="From date" className="px-2 text-[12px]" />
          <Input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} aria-label="To date" className="px-2 text-[12px]" />
        </div>
      </div>
      <div>
        <span className="mb-1 block text-[12px] text-muted">Tags</span>
        <div className="flex flex-wrap gap-1">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setF({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] })}
              className={cn("rounded-md px-1.5 py-0.5 text-[11.5px]", f.tags.includes(t) ? "bg-accent text-white" : "bg-canvas-2 text-ink-3 hover:bg-canvas-3")}
            >
              #{t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const futureCard = (
    <div className="rounded-xl border border-dashed border-line-strong bg-canvas/60 p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <Telescope className="size-4 text-muted" />
        <p className="text-[12.5px] font-semibold text-ink">Coming later</p>
        <Badge tone="outline" className="ml-auto">Future</Badge>
      </div>
      <p className="text-[12px] leading-snug text-muted">
        Cross-client configuration search (“every client with Saturn square Moon”), research collections, and anonymised pattern analysis across your practice.
      </p>
    </div>
  );

  const editor =
    selected === "new" && !newInitial ? (
      <EmptyState
        icon={<NotebookPen />}
        title="Add a client first"
        body="Every observation belongs to a chart. Add a client and their natal chart, then write your first observation."
        action={<Button size="sm" onClick={() => router.push("/app/clients/new")}><Plus /> Add client</Button>}
      />
    ) : selected === "new" && newInitial ? (
      <ObservationEditor key={`new-${newKey}`} initial={newInitial} onCreated={(id) => {
          createdRef.current = id;
          router.replace(`/app/observations?id=${id}`, { scroll: false });
        }} onDeleted={() => setSelected(null)} />
    ) : selected && observations.some((o) => o.id === selected) ? (
      <ObservationEditor key={selected} observationId={selected} onDeleted={() => { setSelected(null); setMobileDetail(false); }} />
    ) : (
      <EmptyState icon={<NotebookPen />} title={hydrated || !selected ? "Select an observation" : "Loading…"} body="Choose an observation from the list, or start a new one." action={<Button size="sm" onClick={startNew}><Plus /> New observation</Button>} />
    );

  return (
    <div>
      <PageHeader
        title="Notes & Observations"
        description="Your professional knowledge base. Every observation stays attached to the chart and person it interprets."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Notes & Observations" }]}
        actions={
          <Button onClick={startNew}>
            <Plus /> New observation
          </Button>
        }
        className={cn(mobileDetail && "max-lg:hidden")}
      />

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Filter observations" side="left" width="max-w-sm">
        <div className="space-y-5 p-5">
          {filterPanel}
          {futureCard}
        </div>
      </Sheet>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[232px_330px_minmax(0,1fr)]">
        {/* LEFT: filters */}
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">{filterPanel}</div>
            {futureCard}
          </div>
        </aside>

        {/* CENTER: directory */}
        <section className={cn("min-w-0", mobileDetail && "max-lg:hidden")}>
          <div className="mb-3 flex gap-2">
            <SearchInput placeholder="Search observations…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
            <Button variant="secondary" className="relative xl:hidden" onClick={() => setFiltersOpen(true)} aria-label="Filters">
              <Filter />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && <span className="rounded-full bg-accent px-1.5 text-[10.5px] text-white">{activeFilters}</span>}
            </Button>
          </div>
          {activeFilters > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {f.client !== "all" && <FilterChip label={name(f.client)} onClear={() => setF({ ...f, client: "all" })} />}
              {f.scope !== "all" && <FilterChip label={SCOPE_META[f.scope].label} onClear={() => setF({ ...f, scope: "all" })} />}
              {f.chartType !== "all" && <FilterChip label={CHART_TYPES.find((t) => t.id === f.chartType)!.short} onClear={() => setF({ ...f, chartType: "all" })} />}
              {f.planets.map((p) => <FilterChip key={p} label={BODIES[p].name} onClear={() => setF({ ...f, planets: f.planets.filter((x) => x !== p) })} />)}
              {f.aspect !== "all" && <FilterChip label={ASPECTS[f.aspect].name} onClear={() => setF({ ...f, aspect: "all" })} />}
              {f.house > 0 && <FilterChip label={`House ${f.house}`} onClear={() => setF({ ...f, house: 0 })} />}
              {(f.from || f.to) && <FilterChip label={`${f.from || "…"} – ${f.to || "…"}`} onClear={() => setF({ ...f, from: "", to: "" })} />}
              {f.tags.map((t) => <FilterChip key={t} label={`#${t}`} onClear={() => setF({ ...f, tags: f.tags.filter((x) => x !== t) })} />)}
            </div>
          )}
          <p className="mb-2 text-[12px] text-muted">{results.length} observation{results.length === 1 ? "" : "s"}</p>
          <div className="space-y-2">
            {results.length === 0 && (
              <div className="rounded-xl border border-line bg-surface">
                <EmptyState icon={<NotebookPen />} title="No observations found" body="Adjust the filters or search terms." />
              </div>
            )}
            {results.map((o) => {
              const c = chartOf(o.chartId);
              return (
                <button
                  key={o.id}
                  onClick={() => open(o.id)}
                  className={cn(
                    "block w-full rounded-xl border bg-surface p-3.5 text-left shadow-card transition-colors",
                    selected === o.id ? "border-accent/50 ring-1 ring-accent/20" : "border-line hover:border-line-strong",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-medium leading-snug text-ink">
                      {o.pinned && <Pin className="mr-1 inline size-3 fill-accent text-accent" />}
                      {o.title}
                    </p>
                    <ScopeBadge scope={o.scope} className="shrink-0" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] text-muted">{stripHtml(o.body) || "Empty observation"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                    <span className="font-medium text-ink-3">{o.personIds.map(name).join(" & ")}</span>
                    {c && <ChartTypeBadge type={c.type} />}
                    <span>{fmtDate(o.updatedAt)}</span>
                    {o.planets.length > 0 && <span className="glyph text-[13px] text-ink-3">{o.planets.map((p) => BODIES[p].glyph).join(" ")}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* RIGHT: editor */}
        <section className={cn("min-w-0", !mobileDetail && "max-lg:hidden")}>
          <button
            onClick={() => {
              setMobileDetail(false);
              router.replace("/app/observations", { scroll: false });
            }}
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink lg:hidden"
          >
            <ArrowLeft className="size-4" /> All observations
          </button>
          <div className="rounded-xl border border-line bg-surface p-4 shadow-card md:p-6 lg:sticky lg:top-20">{editor}</div>
        </section>
      </div>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface py-0.5 pl-2.5 pr-1 text-[12px] text-ink-3">
      {label}
      <button onClick={onClear} className="rounded-full p-0.5 hover:bg-canvas-2" aria-label={`Remove ${label} filter`}>
        <X className="size-3" />
      </button>
    </span>
  );
}
