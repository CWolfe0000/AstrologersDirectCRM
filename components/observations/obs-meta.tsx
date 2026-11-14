import type { ChartRecord, Observation, ObservationScope, Person } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { personName } from "@/lib/store";

export const SCOPE_META: Record<ObservationScope, { label: string; cls: string; long: string }> = {
  natal: { label: "Natal", cls: "bg-accent-50 text-accent border-accent-100", long: "Natal observation" },
  relationship: { label: "Relationship", cls: "bg-[#F2ECF2] text-[#6E4F6E] border-[#E6DAE6]", long: "Relationship observation" },
  timing: { label: "Timing", cls: "bg-sage-50 text-sage-dark border-sage-100", long: "Timing observation" },
};

export function ScopeBadge({ scope, className }: { scope: ObservationScope; className?: string }) {
  const m = SCOPE_META[scope];
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", m.cls, className)}>{m.label}</span>;
}

export function scopeForChart(chart: ChartRecord): ObservationScope {
  if (chart.type === "natal") return "natal";
  if (chart.type === "synastry" || chart.type === "composite") return "relationship";
  return "timing";
}

/** Applies the data rule: who an observation written in this chart belongs to. */
export function ownershipFor(chart: ChartRecord): Pick<Observation, "scope" | "chartId" | "clientId" | "personIds"> {
  const scope = scopeForChart(chart);
  return {
    scope,
    chartId: chart.id,
    clientId: chart.clientId,
    personIds: scope === "relationship" ? chart.personIds.slice(0, 2) : chart.personIds.slice(0, 1),
  };
}

export function ownershipSentence(scope: ObservationScope, chart: ChartRecord | undefined, people: Person[]) {
  const n = (id?: string) => personName(people.find((p) => p.id === id));
  if (!chart) return "";
  if (scope === "natal") return `Belongs to ${n(chart.personIds[0])}'s natal chart. It appears wherever that natal chart is used.`;
  if (scope === "relationship")
    return `Belongs to the relationship chart “${chart.title}” — it is not merged into ${n(chart.personIds[0])}'s or ${n(chart.personIds[1])}'s natal records.`;
  return `Belongs to the timing chart “${chart.title}”${chart.refDate ? ` (reference date ${chart.refDate})` : ""}.`;
}
