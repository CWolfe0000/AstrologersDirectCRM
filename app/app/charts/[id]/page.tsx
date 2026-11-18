"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Sparkles, Star, UserRound, Mic, Send, SlidersHorizontal, MousePointerClick, CircleDot, Waves, Maximize2 } from "lucide-react";
import { ASPECTS, BODIES, HOUSE_SYSTEMS, ZODIACS, bodyIn, chartTypeMeta, dignityOf, fmtDeg, fmtOrb, housesRuledBy, ordinal, signOf, type ChartSettings } from "@/lib/astro";
import { useStore, personName } from "@/lib/store";
import { isPremiumChart } from "@/lib/plan";
import { PremiumGate, usePremium } from "@/components/plan/premium";
import { cn, fmtClock, fmtDate } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { ExpandedWheel } from "@/components/chart/expanded-wheel";
import { ChartTypeBadge, EngineNotice, useChartView } from "@/components/chart/chart-helpers";
import { AstroMap } from "@/components/workspace/astro-map";
import { HoraryPanel } from "@/components/workspace/horary-panel";
import { ElectionPanel } from "@/components/workspace/election-panel";
import { ChartActionsMenu } from "@/components/chart/chart-actions";
import { ChartControls } from "@/components/workspace/chart-controls";
import { AspectsTable, ConditionTable, HousesTable, PlacementsTable, RingTag } from "@/components/workspace/analysis-tables";
import { AspectGrid, OverlaysTable } from "@/components/workspace/synastry-tables";
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
  // ?date=YYYY-MM-DD opens a timing chart at another date (unsaved until "Save"), e.g. from the timeline.
  const dateParam = params.get("date");
  const linkedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;
  const [refDate, setRefDate] = React.useState<string | undefined>(linkedDate ?? chart?.refDate);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [hoverAspect, setHoverAspect] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("placements");
  const [expanded, setExpanded] = React.useState(false);
  const [editing, setEditing] = React.useState<string | "new" | null>(null);
  const [controlsOpen, setControlsOpen] = React.useState(false);
  const [docked, setDocked] = React.useState(true);
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (hydrated && chart) touchChart(chart.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id]);
  React.useEffect(() => {
    setRefDate(linkedDate ?? chart?.refDate);
  }, [chart?.refDate, linkedDate]);
  // ?note=1 starts a new observation (title, planets, aspect and house prefilled from the link).
  const noteDraft = React.useMemo(() => {
    if (params.get("note") !== "1") return undefined;
    const planets = (params.get("planets") ?? "").split(",").filter((x): x is keyof typeof BODIES => x in BODIES);
    const aspect = params.get("aspect");
    const house = Number(params.get("house"));
    return {
      title: (params.get("title") ?? "").slice(0, 200),
      planets,
      aspects: aspect && aspect in ASPECTS ? [aspect as keyof typeof ASPECTS] : [],
      houses: house >= 1 && house <= 12 ? [house] : [],
    };
  }, [params]);
  React.useEffect(() => {
    if (noteDraft) {
      setTab("observations");
      setEditing("new");
    }
  }, [noteDraft]);
  React.useEffect(() => {
    if (params.get("print") === "1" && chart) {
      const t = setTimeout(() => window.print(), 700);
      return () => clearTimeout(t);
    }
  }, [params, chart]);

  const effective = React.useMemo(() => (chart ? { ...chart, refDate: refDate ?? chart.refDate } : undefined), [chart, refDate]);
  const view = useChartView(effective, overrides);
  const premium = usePremium();

  if (chart && !premium && isPremiumChart(chart.type)) {
    return (
      <div>
        <Breadcrumbs
          className="mb-2"
          items={[
            { label: "Clients", href: "/app/clients" },
            { label: personName(people.find((p) => p.id === chart.clientId)), href: `/app/clients/${chart.clientId}` },
            { label: "Charts", href: `/app/charts?client=${chart.clientId}` },
            { label: chart.title },
          ]}
        />
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-[28px] leading-tight text-ink md:text-[32px]">{chart.title}</h1>
          <ChartTypeBadge type={chart.type} />
        </div>
        <PremiumGate feature={chartTypeMeta(chart.type).name} />
      </div>
    );
  }

  if (!chart || !view) {
    if (!hydrated || chart) return <div className="h-[70vh] animate-pulse rounded-xl bg-canvas-2" />;
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={<CircleDot />} title="Chart Not Found" body="It may have been removed, or demo data was reset." action={<ButtonLink href="/app/charts" size="sm">Back to Charts</ButtonLink>} />
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
        toast("Configuration Saved", `“${cfg}” will open with this chart next time.`, "success");
      }}
    />
  );

  // Selected body detail
  const sel = selected ? { ring: selected.split(":")[0] as "inner" | "outer", id: selected.split(":")[1] as keyof typeof BODIES } : null;
  const selBody = sel ? bodyIn(sel.ring === "outer" && view.outer ? view.outer : view.inner, sel.id) : null;
  const selAspects = selected ? view.aspects.filter((a) => `${a.aRing}:${a.a}` === selected || `${a.bRing}:${a.b}` === selected) : [];
  // The selected planet: placement, the houses it rules, dignity and aspects (shown under the wheel and in the expanded view).
  const selRules = sel && sel.id !== "asc" && sel.id !== "mc" ? housesRuledBy(sel.id, (sel.ring === "outer" && view.outer ? view.outer : view.inner).cusps, s.rulership ?? "traditional") : [];
  const selectionDetail = selBody && sel ? (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
          <span className={cn("glyph text-[20px]", sel.ring === "outer" && "text-accent")}>{BODIES[sel.id].glyph}</span>
          {view.outer && <RingTag label={sel.ring === "outer" ? labels.outer : labels.inner} outer={sel.ring === "outer"} />}
          {BODIES[sel.id].name} {fmtDeg(selBody.lon)} {signOf(selBody.lon).name}
          {selBody.speed < 0 && <span className="text-warn">℞</span>}
        </p>
        <button onClick={() => setSelected(null)} className="text-[12px] text-muted hover:text-ink">Clear Selection</button>
      </div>
      <p className="mt-0.5 text-[12.5px] text-muted">
        {sel.id === "asc" ? <>1st-house cusp; the Descendant is opposite · </> : sel.id === "mc" ? <>10th-house cusp; the IC is opposite · </> : <>{ordinal(selBody.house)}-house placement · </>}
      {selRules.length > 0 && <>Rules the {selRules.map(ordinal).join(" & ")} · </>}
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
  ) : null;

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
            {chart.type === "election" && chart.election ? (
              <span>
                <span className="font-medium text-ink-3">For {name(chart.clientId)}</span> · {fmtDate(chart.election.at.slice(0, 10))}, {fmtClock(chart.election.at.slice(11, 16))} · {chart.election.place.split(",")[0]}
              </span>
            ) : chart.type === "horary" && chart.horary ? (
              <span>
                <span className="font-medium text-ink-3">Querent: {name(chart.personIds[0])}</span> · Asked {fmtDate(chart.horary.at.slice(0, 10))}, {fmtClock(chart.horary.at.slice(11, 16))} · {chart.horary.place.split(",")[0]}
              </span>
            ) : subjects.map((p) => (
              <span key={p!.id}>
                <span className="font-medium text-ink-3">{personName(p)}</span> · {fmtDate(p!.birth.date)}, {fmtClock(p!.birth.time)} · {p!.birth.place.split(",")[0]}
              </span>
            ))}
            {meta.timing && refDate && <span>Reference: {fmtDate(refDate)}</span>}
            {chart.type !== "astrocartography" && (
              <span>
                {HOUSE_SYSTEMS.find((h) => h.id === s.houseSystem)?.name} · {ZODIACS.find((z) => z.id === s.zodiac)?.name}
              </span>
            )}
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
          <ButtonLink href={`/app/clients/${chart.clientId}`} variant="secondary" aria-label="Client profile">
            <UserRound /> <span className="hidden sm:inline xl:hidden 2xl:inline">Client Profile</span>
          </ButtonLink>
          {chart.personIds.length === 1 && chart.personIds[0] === chart.clientId && chart.type !== "horary" && chart.type !== "election" && (
            <ButtonLink href={`/app/timeline?client=${chart.personIds[0]}`} variant="secondary" aria-label="Timeline">
              <Waves /> <span className="hidden sm:inline xl:hidden 2xl:inline">Timeline</span>
            </ButtonLink>
          )}
          <ButtonLink href={`/app/studio?client=${chart.clientId}&chart=${chart.id}`} variant="secondary" aria-label="Record reading">
            <Mic /> <span className="hidden sm:inline">Record Reading</span>
          </ButtonLink>
          <ButtonLink href={`/app/delivery?new=1&client=${chart.clientId}&chart=${chart.id}`}>
            <Send /> Deliver
          </ButtonLink>
          <ChartActionsMenu chart={chart} svg={() => svgRef.current ?? document.querySelector<SVGSVGElement>('svg[aria-label^="Astrocartography map"]')} inWorkspace />
        </div>
      </div>

      {chart.type === "astrocartography" && subjects[0] ? (
        <div className="rounded-xl border border-line bg-surface p-3 shadow-card sm:p-5">
          <AstroMap birth={subjects[0].birth} settings={s} />
          {subjects[0].birth.timeAccuracy !== "exact" && (
            <p className="mt-3 text-[12.5px] text-warn">Birth time is {subjects[0].birth.timeAccuracy}: lines move about 15° of longitude for each hour of error.</p>
          )}
        </div>
      ) : (
      <>
      <div className={cn("ws-noprint mb-4 flex items-center gap-2", docked && "min-[1400px]:hidden")}>
        <Button variant="secondary" size="sm" onClick={() => setControlsOpen(true)} className={cn(!docked && "min-[1400px]:hidden")}>
          <SlidersHorizontal /> Chart Controls
        </Button>
        {!docked && (
          <Button variant="secondary" size="sm" onClick={() => setDocked(true)} className="hidden min-[1400px]:inline-flex">
            <PanelLeftOpen /> Show Controls
          </Button>
        )}
        {dirty && <span className="text-[12px] text-warn">Unsaved display changes</span>}
      </div>
      <Sheet open={controlsOpen} onOpenChange={setControlsOpen} title="Chart Controls" description={chart.title} side="left" width="max-w-sm">
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
          {chart.type === "horary" && chart.horary && <HoraryPanel horary={chart.horary} view={view} className="mb-4" />}
          {chart.type === "election" && chart.election && <ElectionPanel election={chart.election} view={view} client={people.find((p) => p.id === chart.clientId)} className="mb-4" />}
          <div className="ws-wheel relative rounded-xl border border-line bg-surface p-3 shadow-card sm:p-5">
            <Button variant="secondary" size="sm" className="ws-noprint absolute right-3 top-3 z-10 sm:right-4 sm:top-4" onClick={() => setExpanded(true)} aria-label="Expand chart wheel" title="Expand">
              <Maximize2 /> <span className="hidden sm:inline">Expand</span>
            </Button>
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
            <ExpandedWheel
              open={expanded}
              onOpenChange={setExpanded}
              title={chart.title}
              caption={selectionDetail ?? <span className="text-muted">Select a planet or angle to see its aspects.</span>}
            >
              <ChartWheel
                view={view}
                selected={selected}
                onSelect={setSelected}
                highlightAspect={hoverAspect}
                showAspects={s.showAspectLines}
                showHouses={s.showHouseCusps}
                showDegrees={s.showDegrees}
              />
            </ExpandedWheel>
            <div className="ws-noprint mt-3 border-t border-line pt-3">
              {selBody && sel ? (
                selectionDetail
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5"><MousePointerClick className="size-3.5" /> Click a planet or angle to isolate its aspects.</span>
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
              <TabsList className="scrollbar-thin flex shrink-0 gap-0 overflow-x-auto px-1">
                <TabsTrigger value="placements" className="shrink-0 justify-center gap-1 whitespace-nowrap px-2 text-[12.5px]">Planets</TabsTrigger>
                <TabsTrigger value="aspects" className="shrink-0 justify-center gap-1 whitespace-nowrap px-2 text-[12.5px]">Aspects</TabsTrigger>
                <TabsTrigger value="grid" className="shrink-0 justify-center gap-1 whitespace-nowrap px-2 text-[12.5px]">Grid</TabsTrigger>
                <TabsTrigger value="houses" className="shrink-0 justify-center gap-1 whitespace-nowrap px-2 text-[12.5px]">{chart.type === "synastry" ? "Overlays" : "Houses"}</TabsTrigger>
                <TabsTrigger value="condition" className="shrink-0 justify-center gap-1 whitespace-nowrap px-2 text-[12.5px]">Condition</TabsTrigger>
                <TabsTrigger value="observations" className="shrink-0 justify-center gap-1 whitespace-nowrap px-2 text-[12.5px]">
                  Notes{obsCount > 0 && <span className="text-[10.5px] text-accent">{obsCount}</span>}
                </TabsTrigger>
                <TabsTrigger value="ai" className="shrink-0 justify-center gap-1 whitespace-nowrap px-2 text-[12.5px]"><Sparkles className="!size-3.5 text-accent" /> AI</TabsTrigger>
              </TabsList>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
                <TabsContent value="placements">
                  <PlacementsTable view={view} labels={labels} selected={selected} onSelect={setSelected} />
                </TabsContent>
                <TabsContent value="aspects">
                  <AspectsTable view={view} labels={labels} hovered={hoverAspect} onHover={setHoverAspect} selected={selected} onSelectBody={setSelected} />
                </TabsContent>
                <TabsContent value="grid">
                  <AspectGrid view={view} labels={labels} hovered={hoverAspect} onHover={setHoverAspect} outerAngles={chart.type === "synastry"} />
                </TabsContent>
                <TabsContent value="houses">
                  {chart.type === "synastry" ? (
                    <OverlaysTable
                      view={view}
                      labels={labels}
                      timeKnown={{
                        inner: people.find((p) => p.id === chart.personIds[0])?.birth.timeAccuracy !== "unknown",
                        outer: people.find((p) => p.id === chart.personIds[1])?.birth.timeAccuracy !== "unknown",
                      }}
                    />
                  ) : (
                    <HousesTable view={view} />
                  )}
                </TabsContent>
                <TabsContent value="condition">
                  <ConditionTable view={view} />
                </TabsContent>
                <TabsContent value="observations">
                  <WorkspaceObservations chart={chart} editing={editing} setEditing={setEditing} draft={noteDraft} />
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
      </>
      )}
    </div>
  );
}
