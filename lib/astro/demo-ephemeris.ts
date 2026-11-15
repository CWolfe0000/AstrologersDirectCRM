import type { BodyId } from "./types";
import type { Ephemeris } from "./techniques/types";
import { norm } from "./meta";

/**
 * DEMONSTRATION EPHEMERIS — NOT FOR INTERPRETATION.
 *
 * Smooth, low-precision positions for demo mode: planets on circular orbits
 * around the Sun, seen from the Earth, so the motion and retrograde loops look
 * right while the positions can be off by several degrees. The Moon gets its
 * main periodic term. Real calculations use Swiss Ephemeris on the server.
 */
const J2000 = Date.UTC(2000, 0, 1, 12);
const D = Math.PI / 180;

/** Mean longitude at J2000 (°), semi-major axis (AU), mean motion (°/day). */
const ORBITS: Partial<Record<BodyId, [number, number, number]>> = {
  mercury: [252.25, 0.387, 4.09233],
  venus: [181.98, 0.723, 1.60213],
  mars: [355.45, 1.524, 0.524033],
  jupiter: [34.4, 5.203, 0.083091],
  saturn: [49.94, 9.537, 0.03346],
  uranus: [313.23, 19.19, 0.011732],
  neptune: [304.88, 30.07, 0.005981],
  pluto: [238.93, 39.48, 0.003964],
  chiron: [250.0, 13.7, 0.01955],
};

function sunLon(d: number) {
  const g = norm(357.529 + 0.98560028 * d) * D;
  return norm(280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
}

function lonAt(id: BodyId, d: number): number {
  if (id === "sun") return sunLon(d);
  if (id === "moon") return norm(218.316 + 13.176396 * d + 6.289 * Math.sin(norm(134.963 + 13.064993 * d) * D));
  if (id === "node") return norm(125.04 - 0.052954 * d);
  const o = ORBITS[id];
  if (!o) return NaN;
  const earth = norm(sunLon(d) + 180) * D;
  const L = norm(o[0] + o[2] * d) * D;
  const x = o[1] * Math.cos(L) - Math.cos(earth);
  const y = o[1] * Math.sin(L) - Math.sin(earth);
  return norm(Math.atan2(y, x) / D);
}

const IDS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"];

export function demoBodies(utc: string) {
  const d = (Date.parse(utc) - J2000) / 86_400_000;
  const out: Partial<Record<BodyId, { lon: number; speed: number }>> = {};
  for (const id of IDS) {
    const lon = lonAt(id, d);
    const h = 0.01;
    const a = lonAt(id, d - h), b = lonAt(id, d + h);
    const diff = ((b - a + 540) % 360) - 180;
    out[id] = { lon, speed: diff / (2 * h) };
  }
  return out;
}

export const demoEphemeris: Pick<Ephemeris, "bodies"> = {
  async bodies(utc) {
    return demoBodies(utc);
  },
};
