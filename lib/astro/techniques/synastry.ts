import type { AspectRule, PointSet } from "./types";
import { findAspects, houseOf, type FoundAspect } from "./aspects";

export interface Overlay {
  point: string;
  lon: number;
  /** House in the other person's chart (strict cusps). */
  house: number;
}

export interface SynastryResult {
  /** Person A's points against person B's points. `a` is always A's point. */
  interAspects: FoundAspect[];
  /** A's points placed in B's houses, and B's in A's. */
  aInB: Overlay[];
  bInA: Overlay[];
}

/**
 * Neutral synastry: inter-aspects and house overlays only. No scores,
 * weights, rankings or interpretive labels — the astrologer interprets.
 * Angles (ASC/MC) are included as points when `includeAngles` is set.
 */
export function synastry(A: PointSet, B: PointSet, opts: { rules?: AspectRule[]; includeAngles?: boolean } = {}): SynastryResult {
  const withAngles = (s: PointSet) =>
    opts.includeAngles === false ? s.points : [...s.points, { id: "asc" as const, lon: s.asc, speed: 0 }, { id: "mc" as const, lon: s.mc, speed: 0 }];
  const pa = withAngles(A);
  const pb = withAngles(B);
  return {
    interAspects: findAspects(pa, pb, opts.rules),
    aInB: A.points.map((p) => ({ point: p.id, lon: p.lon, house: houseOf(p.lon, B.cusps) })),
    bInA: B.points.map((p) => ({ point: p.id, lon: p.lon, house: houseOf(p.lon, A.cusps) })),
  };
}
