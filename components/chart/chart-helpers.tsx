"use client";

import * as React from "react";
import { FlaskConical, Globe2, Lock } from "lucide-react";
import { isPremiumChart } from "@/lib/plan";
import { usePremium } from "@/components/plan/premium";
import { buildChart, chartTypeMeta, getEngine, type ChartSettings, type ChartView } from "@/lib/astro";
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
  return JSON.stringify([getEngine().info.id, chart.type, chart.personIds, chart.refDate, chart.horary ?? null, chart.settings, subjects, overrides ?? null, defaults]);
}

export type ChartViewState = { view: ChartView | null; loading: boolean; error: string | null; locked?: boolean };

/**
 * Calculates a chart through the active engine (asynchronously).
 * While a new result is calculating, the previous one stays on screen.
 * `extraPeople` lets unsaved people (e.g. in the new-client wizard) be charted.
 */
export function useChartViewState(chart: ChartRecord | undefined, overrides?: Partial<ChartSettings>, extraPeople?: Person[]): ChartViewState {
  const storePeople = useStore((s) => s.people);
  const defaults = useStore((s) => s.defaults);
  const people = React.useMemo(() => (extraPeople?.length ? [...storePeople, ...extraPeople] : storePeople), [storePeople, extraPeople]);
  const premium = usePremium();
  const locked = !!chart && !premium && isPremiumChart(chart.type);
  const key = chart && !locked ? cacheKey(chart, people, overrides, defaults) : null;
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

  return locked ? { view: null, loading: false, error: null, locked: true } : state;
}

/** Builds the ChartView for a saved chart using the active engine + practice defaults. */
export function useChartView(chart: ChartRecord | undefined, overrides?: Partial<ChartSettings>, extraPeople?: Person[]): ChartView | null {
  return useChartViewState(chart, overrides, extraPeople).view;
}

export function ChartThumb({ chart, className }: { chart: ChartRecord; className?: string }) {
  const premium = usePremium();
  const isMap = chart.type === "astrocartography";
  const state = useChartViewState(isMap ? undefined : chart);
  const view = state.view;
  const locked = state.locked || (isMap && !premium);
  if (isMap && !locked)
    return (
      <div className={cn("flex aspect-square items-center justify-center rounded-full border border-sage-100 bg-sage-50", className)} title="Astrocartography map">
        <Globe2 className="size-1/3 text-sage-dark" aria-label="Astrocartography map" />
      </div>
    );
  if (locked)
    return (
      <div className={cn("flex aspect-square items-center justify-center rounded-full border border-dashed border-[#E6D3B3] bg-[#FBF4E8]/60", className)} title="Premium chart">
        <Lock className="size-4 text-[#7A5A1E]" aria-label="Premium chart" />
      </div>
    );
  if (!view) return <div className={cn("aspect-square rounded-full bg-canvas-2", className)} />;
  return <ChartWheel view={view} compact className={className} />;
}

/** Required label wherever calculated positions are shown, until results are verified against reference charts. */
export function EngineNotice({ className, compact }: { className?: string; compact?: boolean }) {
  const info = getEngine().info;
  if (info.verified) return null;
  const swiss = info.id === "swiss";
  return (
    <span
      title={info.description}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-warn/50 bg-warn-50 px-2 py-0.5 text-[11px] font-medium text-[#6E4B16]",
        className,
      )}
    >
      <FlaskConical className="size-3" />
      {swiss ? (compact ? "Not yet verified" : "Swiss Ephemeris — not yet checked against reference charts") : compact ? "Demo positions" : "Demonstration positions — not verified calculations"}
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
    horary: "bg-[#EEF1F5] text-[#4B5D73] border-[#DCE3EC]",
    astrocartography: "bg-sage-50 text-sage-dark border-sage-100",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", tone[type], className)}>{chartTypeMeta(type).short}</span>;
}
