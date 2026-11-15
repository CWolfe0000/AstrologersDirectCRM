import type { AspectRule, Point } from "./types";
import { DEFAULT_ASPECT_RULES } from "./types";
import { delta, separation } from "./spherical";

export type Phase = "applying" | "separating" | "exact";

export interface FoundAspect {
  a: string;
  b: string;
  aspect: AspectRule["id"];
  angle: number;
  /** |separation − aspect angle| in degrees. */
  orb: number;
  phase: Phase;
}

/**
 * Applying/separating from the points' speeds: is the orb shrinking?
 * For two natal charts (synastry) this reflects the natal speeds only — shown
 * because practitioners expect it, but it is a convention, not a motion.
 */
function phaseOf(a: Point, b: Point, angle: number): Phase {
  const sep = separation(a.lon, b.lon);
  const orb = Math.abs(sep - angle);
  if (orb < 1 / 60 / 6) return "exact"; // within 10 arc-seconds
  const dt = 0.01;
  const later = Math.abs(separation(a.lon + a.speed * dt, b.lon + b.speed * dt) - angle);
  return later < orb ? "applying" : "separating";
}

/**
 * Aspects between two sets of points (or within one set when `b` is omitted).
 * Each pair gets at most one aspect: the tightest that fits its orb.
 */
export function findAspects(a: Point[], b?: Point[], rules: AspectRule[] = DEFAULT_ASPECT_RULES): FoundAspect[] {
  const out: FoundAspect[] = [];
  const pairs: [Point, Point][] = [];
  if (b) for (const x of a) for (const y of b) pairs.push([x, y]);
  else for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) pairs.push([a[i]!, a[j]!]);
  for (const [x, y] of pairs) {
    const sep = separation(x.lon, y.lon);
    let best: { rule: AspectRule; orb: number } | null = null;
    for (const rule of rules) {
      const orb = Math.abs(sep - rule.angle);
      if (orb <= rule.orb && (!best || orb < best.orb)) best = { rule, orb };
    }
    if (best) out.push({ a: x.id, b: y.id, aspect: best.rule.id, angle: best.rule.angle, orb: best.orb, phase: phaseOf(x, y, best.rule.angle) });
  }
  return out.sort((p, q) => p.orb - q.orb);
}

/** Which house (1–12) a longitude falls in. Strict cusps: a point exactly on a cusp is in that house. */
export function houseOf(lon: number, cusps: number[]) {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const end = cusps[(i + 1) % 12]!;
    const span = ((end - start) % 360 + 360) % 360;
    const pos = ((lon - start) % 360 + 360) % 360;
    if (pos < span || (span === 0 && pos === 0)) return i + 1;
  }
  return 1;
}

export { delta };
