import type { ChartType } from "@/lib/data/types";

/**
 * Plans. Standard: natal and synastry charts with their aspects and grids, plus
 * every practice-management feature. Premium adds every other chart technique
 * and the convergence timeline. Enforced on the server (lib/server/plan.ts);
 * the UI only hides and explains.
 */
export type Plan = "standard" | "premium";

export const PREMIUM_CHART_TYPES: ChartType[] = ["composite", "transits", "progressions", "solar-arc", "solar-return", "horary", "astrocartography"];
export const isPremiumChart = (t: ChartType) => PREMIUM_CHART_TYPES.includes(t);

/** Shown wherever a premium feature is locked. */
export const PREMIUM_FEATURES = [
  "Convergence Timeline",
  "Transits",
  "Secondary Progressions",
  "Solar Arc Directions",
  "Solar Returns",
  "Midpoint Composite Charts",
  "Horary Charts",
  "Astrocartography",
];
