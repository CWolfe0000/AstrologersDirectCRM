"use client";

import * as React from "react";
import { FlaskConical } from "lucide-react";
import { buildChart, chartTypeMeta, type ChartSettings, type ChartView } from "@/lib/astro";
import type { ChartRecord } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChartWheel } from "./chart-wheel";

/** Builds the ChartView for a saved chart using the active engine + practice defaults. */
export function useChartView(chart: ChartRecord | undefined, overrides?: Partial<ChartSettings>): ChartView | null {
  const people = useStore((s) => s.people);
  const defaults = useStore((s) => s.defaults);
  return React.useMemo(() => {
    if (!chart) return null;
    try {
      return buildChart(chart, people, overrides, defaults);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, people, defaults, JSON.stringify(overrides ?? {})]);
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
