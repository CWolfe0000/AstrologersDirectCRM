import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import type { BodyId } from "@/lib/astro/types";
import { BODIES } from "@/lib/astro/types";

/**
 * Swiss Ephemeris (Astrodienst), file-backed, through the `sweph` package.
 * Adapted from AstrologersDirect's lib/server/swiss.ts: same library, data
 * files and license gate. Missing data files are an error (no fallback model).
 *
 * License gate: in production the calculations only run once
 * SWISS_EPHEMERIS_LICENSE is "confirmed" (a Professional License covers
 * Datebyfate) or "staging" (non-commercial testing).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sw = require("sweph") as typeof import("sweph");
const C = sw.constants;

let ready = false;
function init() {
  if (ready) return;
  const license = process.env.SWISS_EPHEMERIS_LICENSE;
  if (process.env.NODE_ENV === "production" && license !== "confirmed" && license !== "staging")
    throw new Error("Swiss Ephemeris is disabled until SWISS_EPHEMERIS_LICENSE is set to “confirmed” (or “staging” for testing).");
  const dir = process.env.SWEPH_EPHE_PATH || path.join(process.cwd(), ".sweph-ephe");
  for (const f of ["sepl_18.se1", "semo_18.se1", "seas_18.se1"])
    if (!existsSync(path.join(dir, f))) throw new Error(`Ephemeris file ${f} is missing. Run: npm run ephemeris`);
  sw.set_ephe_path(dir);
  ready = true;
}

const BODY_CODES: Record<BodyId, number> = {
  sun: C.SE_SUN, moon: C.SE_MOON, mercury: C.SE_MERCURY, venus: C.SE_VENUS, mars: C.SE_MARS,
  jupiter: C.SE_JUPITER, saturn: C.SE_SATURN, uranus: C.SE_URANUS, neptune: C.SE_NEPTUNE, pluto: C.SE_PLUTO,
  node: C.SE_TRUE_NODE,
};

function julianDay(ms: number) {
  init();
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) throw new RangeError("Invalid date");
  const r = sw.utc_to_jd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), C.SE_GREG_CAL);
  if (r.flag !== C.OK) throw new Error("Time conversion failed: " + r.error);
  return r.data[1];
}

/** Tropical longitude (°) and speed (°/day) of each body at an instant (ms since epoch). */
export function bodiesAt(ms: number, ids: BodyId[] = BODIES) {
  const jd = julianDay(ms);
  const flags = C.SEFLG_SWIEPH | C.SEFLG_SPEED;
  const out = {} as Record<BodyId, { lon: number; speed: number }>;
  for (const id of ids) {
    const r = sw.calc_ut(jd, BODY_CODES[id], flags);
    if (r.flag < 0 || !(r.flag & C.SEFLG_SWIEPH)) throw new Error(`Swiss file-backed calculation unavailable for ${id}: ${r.error || r.flag}`);
    out[id] = { lon: r.data[0], speed: r.data[3] };
  }
  return out;
}

/**
 * Placidus houses for a moment and place. Placidus is undefined above ~66°
 * latitude; there the chart uses Whole Sign houses.
 */
export function housesAt(ms: number, lat: number, lon: number) {
  const system = Math.abs(lat) > 66.5 ? "W" : "P";
  const r = sw.houses_ex2(julianDay(ms), 0, lat, lon, system);
  if (r.flag < 0) throw new RangeError(`Houses are undefined here: ${r.error}`);
  return { cusps: r.data.houses.slice(0, 12) as number[], asc: r.data.points[0]!, mc: r.data.points[1]! };
}

/** Houses from a right ascension of the MC (for the composite chart). */
export function housesFromRamc(ramc: number, lat: number, eps: number) {
  init();
  const r = sw.houses_armc(ramc, lat, eps, Math.abs(lat) > 66.5 ? "W" : "P");
  if (r.flag < 0) throw new RangeError("Houses are undefined here.");
  return { cusps: r.data.houses.slice(0, 12) as number[], asc: r.data.points[0]!, mc: r.data.points[1]! };
}
