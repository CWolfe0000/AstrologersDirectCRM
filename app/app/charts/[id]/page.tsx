"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Sparkles, Star, UserRound, Mic, Send, SlidersHorizontal, MousePointerClick, CircleDot } from "lucide-react";
import { ASPECTS, BODIES, HOUSE_SYSTEMS, ZODIACS, bodyIn, chartTypeMeta, dignityOf, fmtDeg, fmtOrb, signOf, type ChartSettings } from "@/lib/astro";
import { useStore, personName } from "@/lib/store";
import { cn, fmtClock, fmtDate } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { ChartTypeBadge, EngineNotice, useChartView } from "@/components/chart/chart-helpers";
import { ChartActionsMenu } from "@/components/chart/chart-actions";
import { ChartControls } from "@/components/workspace/chart-controls";
import { AspectsTable, ConditionTable, HousesTable, PlacementsTable, RingTag } from "@/components/workspace/analysis-tables";
import { WorkspaceObservations } from "@/components/workspace/workspace-observations";
import { AiAssistant } from "@/components/workspace/ai-assistant";
import { ringLabels } from "@/components/workspace/ring-labels";
import { useHydrated } from "@/components/workspace/use-hydrated";

const PRINT_CSS = `@media print {
  @page { margin: 14mm; }
  body { background: #fff !important; }
  aside, header, .ws-noprint, nav[aria-label="Breadcrumb"] { display: none !important; }
  .lg\\:pl-\\[248px\\] { padding-left: 0 !important; }
  .ws-grid { display: block !important; }
  .ws-wheel { border: none !important; box-shadow: none !important; max-width: 640px; margin: 0 auto; }
}`;

export default function ChartWorkspacePage() {
  return (
    <React.Suspense>
      <Workspace />
    </React.Suspense>
  );
}

function Workspace() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const chart = useStore((s) => s.charts.find((c) => c.id === id));
  const people = useStore((s) => s.people);
  const obsCount = useStore((s) => s.observations.filter((o) => o.chartId === id).length);
  const touchChart = useStore((s) => s.touchChart);
  const updateChart = useStore((s) => s.updateChart);
  const toast = useStore((s) => s.toast);

  const [overrides, setOverrides] = React.useState<Partial<ChartSettings>>({});
  const [refDate, setRefDate] = React.useState<string | undefined>(chart?.refDate);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [hoverAspect, setHoverAspect] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("placements");
  const [editing, setEditing] = React.useState<string | "new" | null>(null);
  const [controlsOpen, setControlsOpen] = React.useState(false);
  const [docked, setDocked] = React.useState(true);
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (hydrated && chart) touchChart(chart.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id]);
  React.useEffect(() => {
    setRefDate(chart?.refDate);
  }, [chart?.refDate]);
  React.useEffect(() => {
    if (params.get("print") === "1" && chart) {
      const t = setTimeout(() => window.print(), 700);
      return () => clearTimeout(t);
    }
  }, [params, chart]);

  const effective = React.useMemo(() => (chart ? { ...chart, refDate: refDate ?? chart.refDate } : undefined), [chart, refDate]);
  const view = useChartView(effective, overrides);

  if (!chart || !view) {
    if (!hydrated) return <div className="h-[70vh] animate-pulse rounded-xl bg-canvas-2" />;
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={<CircleDot />} title="Chart not found" body="It may have been removed, or demo data was reset." action={<ButtonLink href="/app/charts" size="sm">Back to charts</ButtonLink>} />
      </div>
    );
  }

  const name = (pid?: string) => personName(people.find((p) => p.id === pid));
  const labels = ringLabels(chart, people);
  const meta = chartTypeMeta(chart.type);
  const subjects = chart.personIds.map((pid) => people.find((p) => p.id === pid)).filter(Boolean);
  const dirty = Object.keys(overrides).length > 0 || (refDate ?? "") !== (chart.refDate ?? "");
  const s = view.settings;

  const controls = (
    <ChartControls
      chart={chart}
      settings={s}
      onChange={(patch) => setOverrides((o) => ({ ...o, ...patch }))}
      refDate={refDate}
      onRefDate={setRefDate}
      dirty={dirty}
      onReset={() => {
        setOverrides({});
        setRefDate(chart.refDate);
      }}
      onSaveConfig={(cfg) => {
        updateChart(chart.id, { settings: { ...chart.settings, ...overrides }, savedConfig: cfg, refDate });
        setOverrides({});
        toast("Configuration saved", `“${cfg}” will open with this chart next time.`, "success");
      }}
    />
  );

  // Selected body detail
  const sel = selected ? { ring: selected.split(":")[0] as "inner" | "outer", id: selected.split(":")[1] as keyof typeof BODIES } : null;
  const selBody = sel ? bodyIn(sel.ring === "outer" && view.outer ? view.outer : view.inner, sel.id) : null;
  const selAspects = selected ? view.aspects.filter((a) => `${a.aRing}:${a.a}` === selected || `${a.bRing}:${a.b}` === selected) : [];

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <Breadcrumbs
        className="mb-2"
        items={[
          { label: "Clients", href: "/app/clients" },
          { label: name(chart.clientId), href: `/app/clients/${chart.clientId}` },
          { label: "Charts", href: `/app/charts?client=${chart.clientId}` },
          { label: chart.title },
        ]}
      />

      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-[28px] leading-tight text-ink md:text-[32px]">{chart.title}</h1>
            <ChartTypeBadge type={chart.type} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
            {subjects.map((p) => (
              <span key={p!.id}>
                <span className="font-medium text-ink-3">{personName(p)}</span> · {fmtDate(p!.birth.date)}, {fmtClock(p!.birth.time)} · {p!.birth.place.split(",")[0]}
              </span>
            ))}
            {meta.timing && refDate && <span>Reference: {fmtDate(refDate)}</span>}
            <span>
              {HOUSE_SYSTEMS.find((h) => h.id === s.houseSystem)?.name} · {ZODIACS.find((z) => z.id === s.zodiac)?.name}
            </span>
          </div>
          <EngineNotice className="mt-2.5" />
        </div>
        <div className="ws-noprint flex flex-wrap items-center gap-2 xl:shrink-0 xl:flex-nowrap">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => updateChart(chart.id, { favorite: !chart.favorite })}
            aria-label={chart.favorite ? "Remove from favorites" : "Add to favorites"}
            title={chart.favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn(chart.favorite && "fill-accent text-accent")} />
          </Button>
          <ButtonLink href={`/app/clients/${chart.clientId}`} variant="secondary">
            <UserRound /> <span className="hidden sm:inline xl:hidden 2xl:inline">Client profile</span>
          </ButtonLink>
          <ButtonLink href={`/app/studio?client=${chart.clientId}&chart=${chart.id}`} variant="secondary">
            <Mic /> <span className="hidden sm:inline">Record reading</span>
          </ButtonLink>
          <ButtonLink href={`/app/delivery?new=1&client=${chart.clientId}&chart=${chart.id}`}>
            <Send /> Deliver
          </ButtonLink>
          <ChartActionsMenu chart={chart} svg={() => svgRef.current} inWorkspace />
        </div>
      </div>

      <div className={cn("ws-noprint mb-4 flex items-center gap-2", docked && "min-[1400px]:hidden")}>
        <Button variant="secondary" size="sm" onClick={() => setControlsOpen(true)} className={cn(!docked && "min-[1400px]:hidden")}>
          <SlidersHorizontal /> Chart controls
        </Button>
        {!docked && (
          <Button variant="secondary" size="sm" onClick={() => setDocked(true)} className="hidden min-[1400px]:inline-flex">
            <PanelLeftOpen /> Show controls
          </Button>
        )}
        {dirty && <span className="text-[12px] text-warn">Unsaved display changes</span>}
      </div>
      <Sheet open={controlsOpen} onOpenChange={setControlsOpen} title="Chart controls" description={chart.title} side="left" width="max-w-sm">
        {controls}
      </Sheet>

      <div className={cn("ws-grid grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]", docked && "min-[1400px]:grid-cols-[236px_minmax(0,1fr)_370px]")}>
        {/* LEFT: controls */}
        {docked && (
          <aside className="ws-noprint hidden min-[1400px]:block">
            <div className="scrollbar-thin sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-line bg-surface shadow-card">
              <button onClick={() => setDocked(false)} className="flex w-full items-center justify-between border-b border-line px-4 py-2.5 text-[12px] text-muted hover:text-ink">
                Controls <PanelLeftClose className="size-4" />
              </button>
              {controls}
            </div>
          </aside>
        )}

        {/* CENTER: wheel */}
        <section className="min-w-0">
          <div className="ws-wheel rounded-xl border border-line bg-surface p-3 shadow-card sm:p-5">
            {view.outer && (
              <div className="mb-2 flex items-center justify-center gap-3 text-[12px] text-muted">
                <span className="flex items-center gap-1.5"><RingTag label={labels.inner} /> inner</span>
                <span className="flex items-center gap-1.5"><RingTag label={labels.outer} outer /> outer</span>
              </div>
            )}
            <div className="mx-auto max-w-[640px]">
              <ChartWheel
                view={view}
                svgRef={svgRef}
                selected={selected}
                onSelect={(k) => {
                  setSelected(k);
                  if (k && tab !== "aspects" && tab !== "placements") setTab("aspects");
                }}
                highlightAspect={hoverAspect}
                showAspects={s.showAspectLines}
                showHouses={s.showHouseCusps}
                showDegrees={s.showDegrees}
              />
            </div>
            <div className="ws-noprint mt-3 border-t border-line pt-3">
              {selBody && sel ? (
                <div className="animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
                      <span className={cn("glyph text-[20px]", sel.ring === "outer" && "text-accent")}>{BODIES[sel.id].glyph}</span>
                      {view.outer && <RingTag label={sel.ring === "outer" ? labels.outer : labels.inner} outer={sel.ring === "outer"} />}
                      {BODIES[sel.id].name} {fmtDeg(selBody.lon)} {signOf(selBody.lon).name}
                      {selBody.speed < 0 && <span className="text-warn">℞</span>}
                    </p>
                    <button onClick={() => setSelected(null)} className="text-[12px] text-muted hover:text-ink">Clear selection</button>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {sel.id !== "asc" && sel.id !== "mc" && <>{selBody.house}th-house placement · </>}
                    {dignityOf(sel.id, selBody.lon) ? `${dignityOf(sel.id, selBody.lon)} · ` : ""}
                    {selAspects.length} aspect{selAspects.length === 1 ? "" : "s"} in orb
                  </p>
                  {selAspects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selAspects.slice(0, 8).map((a) => {
                        const k = `${a.aRing}:${a.a}-${a.bRing}:${a.b}`;
                        const other = `${a.aRing}:${a.a}` === selected ? { id: a.b, ring: a.bRing } : { id: a.a, ring: a.aRing };
                        return (
                          <span key={k} onMouseEnter={() => setHoverAspect(k)} onMouseLeave={() => setHoverAspect(null)} className="inline-flex cursor-default items-center gap-1 rounded-md border border-line bg-canvas/50 px-2 py-1 text-[12px] text-ink-3">
                            <span className="glyph">{ASPECTS[a.type].glyph}</span>
                            <span className={cn("glyph", other.ring === "outer" && "text-accent")}>{BODIES[other.id].glyph}</span>
                            {BODIES[other.id].name} <span className="text-muted">{fmtOrb(a.orb)}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5"><MousePointerClick className="size-3.5" /> Click a planet to isolate its aspects.</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-accent" /> Hard</span>
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-sage-dark" /> Soft</span>
                    <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-muted" /> Minor</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: analysis */}
        <section className="ws-noprint min-w-0">
          <div className="rounded-xl border border-line bg-surface shadow-card xl:sticky xl:top-20 xl:flex xl:max-h-[calc(100vh-6rem)] xl:flex-col">
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
              <TabsList className="shrink-0 px-1.5">
                <TabsTrigger value="placements" className="px-2 text-[13px]">Planets</TabsTrigger>
                <TabsTrigger value="aspects" className="px-2 text-[13px]">Aspects</TabsTrigger>
                <TabsTrigger value="houses" className="px-2 text-[13px]">Houses</TabsTrigger>
                <TabsTrigger value="condition" className="px-2 text-[13px]">Condition</TabsTrigger>
                <TabsTrigger value="observations" className="px-2 text-[13px]">
                  Notes{obsCount > 0 && <span className="rounded-full bg-accent-50 px-1.5 text-[10.5px] text-accent">{obsCount}</span>}
                </TabsTrigger>
                <TabsTrigger value="ai" className="px-2 text-[13px]"><Sparkles className="text-accent" /> AI</TabsTrigger>
              </TabsList>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
                <TabsContent value="placements">
                  <PlacementsTable view={view} labels={labels} selected={selected} onSelect={setSelected} />
                </TabsContent>
                <TabsContent value="aspects">
                  <AspectsTable view={view} labels={labels} hovered={hoverAspect} onHover={setHoverAspect} selected={selected} onSelectBody={setSelected} />
                </TabsContent>
                <TabsContent value="houses">
                  <HousesTable view={view} />
                </TabsContent>
                <TabsContent value="condition">
                  <ConditionTable view={view} />
                </TabsContent>
                <TabsContent value="observations">
                  <WorkspaceObservations chart={chart} editing={editing} setEditing={setEditing} />
                </TabsContent>
                <TabsContent value="ai" forceMount className="data-[state=inactive]:hidden">
                  <AiAssistant
                    chart={chart}
                    view={view}
                    onSaved={(oid) => {
                      setEditing(oid);
                      setTab("observations");
                    }}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
}
