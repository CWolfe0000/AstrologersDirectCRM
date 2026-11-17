import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import type { BodyId, HouseSystem, ZodiacType } from "@/lib/astro/types";
import type { Ephemeris } from "@/lib/astro/techniques/types";

/**
 * Swiss Ephemeris (Astrodienst), file-backed, through the `sweph` package —
 * the same library, version and data files Sky uses. Never falls back to the
 * built-in Moshier model: missing files are an error, as in Sky.
 *
 * License gate (mirrors Sky's): in production the calculations only run once
 * SWISS_EPHEMERIS_LICENSE is "confirmed" (the Professional License covers this
 * entity and product) or "staging" (non-commercial testing).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sw = require("sweph") as typeof import("sweph");
const C = sw.constants;

let ready = false;
function init() {
  if (ready) return;
  const license = process.env.SWISS_EPHEMERIS_LICENSE;
  if (process.env.NODE_ENV === "production" && license !== "confirmed" && license !== "staging")
    throw new Error("Swiss Ephemeris is disabled until SWISS_EPHEMERIS_LICENSE is set to “confirmed” (or “staging” for testing). See docs/DEPLOY.md.");
  const dir = process.env.SWEPH_EPHE_PATH || path.join(process.cwd(), ".sweph-ephe");
  for (const f of ["sepl_18.se1", "semo_18.se1", "seas_18.se1"])
    if (!existsSync(path.join(dir, f))) throw new Error(`Ephemeris file ${f} is missing. Run: npm run ephemeris`);
  sw.set_ephe_path(dir);
  ready = true;
}

export const SWISS_INFO = {
  id: "swiss",
  name: "Swiss Ephemeris",
  version: "2.10.03",
  /** Stays false until results are checked against reference charts (docs/techniques.md). */
  verified: false,
  description: "Swiss Ephemeris 2.10.03 with Astrodienst data files — not yet checked against your reference charts.",
};

const BODY_CODES: Partial<Record<BodyId, number>> = {
  sun: C.SE_SUN, moon: C.SE_MOON, mercury: C.SE_MERCURY, venus: C.SE_VENUS, mars: C.SE_MARS,
  jupiter: C.SE_JUPITER, saturn: C.SE_SATURN, uranus: C.SE_URANUS, neptune: C.SE_NEPTUNE, pluto: C.SE_PLUTO,
  node: C.SE_TRUE_NODE, chiron: C.SE_CHIRON,
};
export const SWISS_BODIES = Object.keys(BODY_CODES) as BodyId[];

const HOUSE_CODES: Record<HouseSystem, string> = {
  placidus: "P", koch: "K", porphyry: "O", regiomontanus: "R", campanus: "C", equal: "E", "whole-sign": "W",
};
/** Systems that are undefined near the poles (Swiss returns an error or falls back). */
const POLAR_LIMITED: HouseSystem[] = ["placidus", "koch"];

function zodiacFlags(zodiac: ZodiacType = "tropical") {
  if (zodiac === "tropical") return 0;
  sw.set_sid_mode(zodiac === "sidereal-lahiri" ? C.SE_SIDM_LAHIRI : C.SE_SIDM_FAGAN_BRADLEY, 0, 0);
  return C.SEFLG_SIDEREAL;
}

/** UTC ISO string → Julian day in UT1 (Swiss handles leap seconds and ΔT). */
export function julianDay(utc: string) {
  init();
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) throw new RangeError("Invalid date");
  const r = sw.utc_to_jd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds() + d.getUTCMilliseconds() / 1000, C.SE_GREG_CAL);
  if (r.flag !== C.OK) throw new Error("Time conversion failed: " + r.error);
  return r.data[1];
}

export function bodiesAt(utc: string, opts: { zodiac?: ZodiacType; bodies?: BodyId[] } = {}) {
  const jd = julianDay(utc);
  const flags = C.SEFLG_SWIEPH | C.SEFLG_SPEED | zodiacFlags(opts.zodiac);
  const out: Partial<Record<BodyId, { lon: number; speed: number }>> = {};
  for (const id of opts.bodies ?? SWISS_BODIES) {
    const code = BODY_CODES[id];
    if (code === undefined) continue;
    const r = sw.calc_ut(jd, code, flags);
    if (r.flag < 0 || !(r.flag & C.SEFLG_SWIEPH)) throw new Error(`Swiss file-backed calculation unavailable for ${id}: ${r.error || r.flag}`);
    out[id] = { lon: r.data[0], speed: r.data[3] };
  }
  return out;
}

/** Right ascension and declination (true equator of date) and Greenwich apparent sidereal time, for astrocartography. */
export function equatorialAt(utc: string, bodies: BodyId[] = SWISS_BODIES) {
  const jd = julianDay(utc);
  const gst = sw.sidtime(jd) * 15;
  const out: { id: BodyId; ra: number; dec: number }[] = [];
  for (const id of bodies) {
    const code = BODY_CODES[id];
    if (code === undefined) continue;
    const r = sw.calc_ut(jd, code, C.SEFLG_SWIEPH | C.SEFLG_EQUATORIAL);
    if (r.flag < 0 || !(r.flag & C.SEFLG_SWIEPH)) throw new Error(`Swiss file-backed calculation unavailable for ${id}: ${r.error || r.flag}`);
    out.push({ id, ra: r.data[0], dec: r.data[1] });
  }
  return { gst, bodies: out };
}

export function obliquityAt(utc: string) {
  const r = sw.calc_ut(julianDay(utc), C.SE_ECL_NUT, 0);
  return r.data[0]; // true obliquity
}

function cuspsResult(r: { flag: number; error?: string; data: { houses: number[]; points: number[] } }, system: HouseSystem) {
  if (r.flag < 0) throw new RangeError(`${system} houses are undefined here: ${r.error}`);
  return { cusps: r.data.houses.slice(0, 12), asc: r.data.points[0]!, mc: r.data.points[1]!, ramc: r.data.points[2]! };
}

/**
 * Houses for a moment and place. Placidus and Koch are undefined above ~66°
 * latitude; there the chart uses Whole Sign and says so (`fallback`), matching
 * Sky's approved polar policy.
 */
export function housesAt(utc: string, lat: number, lon: number, system: HouseSystem, zodiac?: ZodiacType) {
  const jd = julianDay(utc);
  const effective: HouseSystem = POLAR_LIMITED.includes(system) && Math.abs(lat) > 66.5 ? "whole-sign" : system;
  const r = sw.houses_ex2(jd, zodiacFlags(zodiac), lat, lon, HOUSE_CODES[effective]);
  return { ...cuspsResult(r, effective), system: effective, fallback: effective !== system };
}

export function housesFromRamc(ramc: number, lat: number, eps: number, system: HouseSystem) {
  const effective: HouseSystem = POLAR_LIMITED.includes(system) && Math.abs(lat) > 66.5 ? "whole-sign" : system;
  return cuspsResult(sw.houses_armc(ramc, lat, eps, HOUSE_CODES[effective]), effective);
}

/** New and full moons (and whether each is an eclipse) between two dates. */
export function lunationsBetween(fromUtc: string, toUtc: string) {
  const start = julianDay(fromUtc), end = julianDay(toUtc);
  const elong = (jd: number) => {
    const s = sw.calc_ut(jd, C.SE_SUN, C.SEFLG_SWIEPH).data[0];
    const m = sw.calc_ut(jd, C.SE_MOON, C.SEFLG_SWIEPH).data[0];
    return ((m - s) % 360 + 360) % 360;
  };
  const out: { jd: number; kind: "new" | "full"; lon: number; eclipse: null | string }[] = [];
  let prev = elong(start);
  for (let jd = start + 0.25; jd <= end; jd += 0.25) {
    const cur = elong(jd);
    for (const [kind, target] of [["new", 0], ["full", 180]] as const) {
      const a = ((prev - target + 540) % 360) - 180, b = ((cur - target + 540) % 360) - 180;
      if (a < 0 && b >= 0 && Math.abs(a - b) < 90) {
        let lo = jd - 0.25, hi = jd;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2;
          const fm = ((elong(mid) - target + 540) % 360) - 180;
          if (fm < 0) lo = mid;
          else hi = mid;
        }
        const t = (lo + hi) / 2;
        out.push({ jd: t, kind, lon: sw.calc_ut(t, C.SE_MOON, C.SEFLG_SWIEPH).data[0], eclipse: null });
      }
    }
    prev = cur;
  }
  // Eclipse classification from Swiss's own searches.
  for (const lunar of [false, true]) {
    let cursor = start - 1;
    while (cursor < end + 1) {
      const r = lunar ? sw.lun_eclipse_when(cursor, C.SEFLG_SWIEPH, 0, false) : sw.sol_eclipse_when_glob(cursor, C.SEFLG_SWIEPH, 0, false);
      const max = (r.data as number[])[0];
      if (r.flag < 0 || !Number.isFinite(max) || max <= cursor || max > end + 1) break;
      const type = r.flag & C.SE_ECL_TOTAL ? "total" : r.flag & C.SE_ECL_ANNULAR ? "annular" : r.flag & C.SE_ECL_HYBRID ? "hybrid" : r.flag & C.SE_ECL_PARTIAL ? "partial" : "penumbral";
      const hit = out.find((l) => l.kind === (lunar ? "full" : "new") && Math.abs(l.jd - max) < 0.5);
      if (hit) hit.eclipse = `${type} ${lunar ? "lunar" : "solar"} eclipse`;
      cursor = max + 1;
    }
  }
  return out.sort((a, b) => a.jd - b.jd);
}

export function jdToUtc(jd: number) {
  const r = sw.jdut1_to_utc(jd, C.SE_GREG_CAL) as unknown as { year: number; month: number; day: number; hour: number; minute: number; second: number };
  return new Date(Date.UTC(r.year, r.month - 1, r.day, r.hour, r.minute, Math.floor(r.second), Math.round((r.second % 1) * 1000))).toISOString();
}

/** The techniques' Ephemeris interface, backed by Swiss Ephemeris. */
export function swissEphemeris(zodiac: ZodiacType = "tropical"): Ephemeris {
  return {
    async bodies(utc) {
      return bodiesAt(utc, { zodiac });
    },
    async obliquity(utc) {
      return obliquityAt(utc);
    },
    async ramc(utc, lonEast) {
      return housesAt(utc, 0, lonEast, "equal").ramc;
    },
    async houses(utc, lat, lonEast, system) {
      return housesAt(utc, lat, lonEast, system as HouseSystem, zodiac);
    },
    async housesFromRamc(ramc, lat, eps, system) {
      return housesFromRamc(ramc, lat, eps, system as HouseSystem);
    },
  };
}
