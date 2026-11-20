/**
 * Midpoints (Ebertin / Uranian method). The midpoint of two points is the
 * nearer of the two halfway points. A third point "on" a midpoint makes a
 * midpoint picture (A = B/C) when it falls on the 90° dial within orb: a
 * conjunction, square or opposition (multiples of 90°), or, on the 45° dial,
 * a semisquare or sesquiquadrate.
 */
import type { ChartPoints } from "./types";

export const n360 = (x: number) => ((x % 360) + 360) % 360;
/** The nearer midpoint of two longitudes. */
export function midpoint(a: number, b: number) {
  const d = n360(b - a);
  const m = n360(a + d / 2);
  return d > 180 ? n360(m + 180) : m;
}

export const MIDPOINT_POINTS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "asc", "mc"] as const;
export type MidPointId = (typeof MIDPOINT_POINTS)[number];

export function pointsOf(p: ChartPoints): Partial<Record<MidPointId, number>> {
  const o: Partial<Record<MidPointId, number>> = { asc: p.asc, mc: p.mc };
  for (const b of p.bodies) if ((MIDPOINT_POINTS as readonly string[]).includes(b.id)) o[b.id as MidPointId] = b.lon;
  return o;
}

export interface Midpoint { a: MidPointId; b: MidPointId; lon: number }
export function allMidpoints(pts: Partial<Record<MidPointId, number>>): Midpoint[] {
  const ids = MIDPOINT_POINTS.filter((x) => pts[x] !== undefined);
  const out: Midpoint[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) out.push({ a: ids[i]!, b: ids[j]!, lon: midpoint(pts[ids[i]!]!, pts[ids[j]!]!) });
  return out;
}

const HARD = [
  { angle: 0, name: "conjunction" }, { angle: 45, name: "semisquare" }, { angle: 90, name: "square" }, { angle: 135, name: "sesquiquadrate" },
  { angle: 180, name: "opposition" }, { angle: 225, name: "sesquiquadrate" }, { angle: 270, name: "square" }, { angle: 315, name: "semisquare" },
] as const;

/** The hard aspect (on the 45° dial) between a point and a midpoint, if within orb. */
export function hardContact(lon: number, mid: number, orb: number) {
  const d = n360(lon - mid);
  let best: { aspect: string; orb: number } | null = null;
  for (const h of HARD) {
    const o = Math.abs(((d - h.angle + 540) % 360) - 180);
    if (o <= orb && (!best || o < best.orb)) best = { aspect: h.name, orb: o };
  }
  return best;
}

export interface Picture { point: MidPointId; mid: Midpoint; aspect: string; orb: number }
/** Every point sitting on another pair's midpoint (orb 1.5° for conjunction/square/opposition, 1° for semisquare/sesquiquadrate). */
export function midpointPictures(pts: Partial<Record<MidPointId, number>>, orb = 1.5): Picture[] {
  const mids = allMidpoints(pts);
  const out: Picture[] = [];
  for (const m of mids) for (const id of MIDPOINT_POINTS) {
    if (pts[id] === undefined || id === m.a || id === m.b) continue;
    const c = hardContact(pts[id]!, m.lon, orb);
    if (c && (c.aspect === "conjunction" || c.aspect === "square" || c.aspect === "opposition" || c.orb <= orb * (2 / 3))) out.push({ point: id, mid: m, aspect: c.aspect, orb: c.orb });
  }
  return out.sort((a, b) => a.orb - b.orb);
}

/** Position on the 90° dial (0–90°), where conjunctions, squares and oppositions coincide. */
export const dial90 = (lon: number) => n360(lon) % 90;
