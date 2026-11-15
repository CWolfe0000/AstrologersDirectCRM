"use client";

import * as React from "react";
import { FlaskConical } from "lucide-react";
import { buildChart, chartTypeMeta, type ChartSettings, type ChartView } from "@/lib/astro";
import type { ChartRecord, Person } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChartWheel } from "./chart-wheel";

/** Results cache shared by every chart on screen (keyed by everything the result depends on). */
const cache = new Map<string, Promise<ChartView>>();
const resolved = new Map<string, ChartView>();
const CACHE_LIMIT = 300;

function cacheKey(chart: ChartRecord, people: Person[], overrides: Partial<ChartSettings> | undefined, defaults: ChartSettings) {
  const subjects = chart.personIds.map((id) => people.find((p) => p.id === id)?.birth ?? null);
  return JSON.stringify([chart.type, chart.personIds, chart.refDate, chart.settings, subjects, overrides ?? null, defaults]);
}

export type ChartViewState = { view: ChartView | null; loading: boolean; error: string | null };

/**
 * Calculates a chart through the active engine (asynchronously).
 * While a new result is calculating, the previous one stays on screen.
 * `extraPeople` lets unsaved people (e.g. in the new-client wizard) be charted.
 */
export function useChartViewState(chart: ChartRecord | undefined, overrides?: Partial<ChartSettings>, extraPeople?: Person[]): ChartViewState {
  const storePeople = useStore((s) => s.people);
  const defaults = useStore((s) => s.defaults);
  const people = React.useMemo(() => (extraPeople?.length ? [...storePeople, ...extraPeople] : storePeople), [storePeople, extraPeople]);
  const key = chart ? cacheKey(chart, people, overrides, defaults) : null;
  const [state, setState] = React.useState<ChartViewState>(() => ({ view: key ? resolved.get(key) ?? null : null, loading: !!key && !resolved.has(key), error: null }));

  React.useEffect(() => {
    if (!chart || !key) {
      setState({ view: null, loading: false, error: null });
      return;
    }
    const hit = resolved.get(key);
    if (hit) {
      setState({ view: hit, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    let p = cache.get(key);
    if (!p) {
      p = buildChart(chart, people, overrides, defaults);
      if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
      cache.set(key, p);
    }
    p.then(
      (view) => {
        resolved.set(key, view);
        if (resolved.size > CACHE_LIMIT) resolved.delete(resolved.keys().next().value!);
        if (!cancelled) setState({ view, loading: false, error: null });
      },
      (err: Error) => {
        cache.delete(key);
        if (!cancelled) setState({ view: null, loading: false, error: err.message || "Calculation failed" });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

/** Builds the ChartView for a saved chart using the active engine + practice defaults. */
export function useChartView(chart: ChartRecord | undefined, overrides?: Partial<ChartSettings>, extraPeople?: Person[]): ChartView | null {
  return useChartViewState(chart, overrides, extraPeople).view;
}

export function ChartThumb({ chart, className }: { chart: ChartRecord; className?: string }) {
  const view = useChartView(chart);
  if (!view) return <div className={cn("aspect-square rounded-full bg-canvas-2", className)} />;
  return <ChartWheel view={view} compact className={className} />;
}

/** Required label wherever calculated positions are shown in the prototype. */
export function EngineNotice({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span
      title="Positions come from the prototype's demonstration engine. They are approximate and illustrative — not verified ephemeris calculations."
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-warn/50 bg-warn-50 px-2 py-0.5 text-[11px] font-medium text-[#7C5A22]",
        className,
      )}
    >
      <FlaskConical className="size-3" />
      {compact ? "Demo positions" : "Demonstration positions — not verified calculations"}
    </span>
  );
}

export function ChartTypeBadge({ type, className }: { type: ChartRecord["type"]; className?: string }) {
  const tone: Record<string, string> = {
    natal: "bg-accent-50 text-accent border-accent-100",
    synastry: "bg-[#F2ECF2] text-[#6E4F6E] border-[#E6DAE6]",
    composite: "bg-[#F2ECF2] text-[#6E4F6E] border-[#E6DAE6]",
    transits: "bg-sage-50 text-sage-dark border-sage-100",
    progressions: "bg-[#ECEEF3] text-[#4D5A70] border-[#DCE3EC]",
    "solar-arc": "bg-[#ECEEF3] text-[#4D5A70] border-[#DCE3EC]",
    "solar-return": "bg-[#F3EDE4] text-[#7A6145] border-[#E8DCCB]",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", tone[type], className)}>{chartTypeMeta(type).short}</span>;
}
