import { approxAcg } from "./acg";
import type { AstrologyEngine, BirthData, BodyId, BodyPosition, ChartPoints, ChartSettings } from "./types";
import { norm } from "./meta";

/**
 * DEMONSTRATION ENGINE — NOT FOR INTERPRETATION.
 *
 * Produces deterministic, *approximate* positions from mean-motion formulas
 * and a seeded generator so the interface can be evaluated with plausible
 * data. It does not compute true geocentric positions, real house cusps, or
 * real retrograde stations. Replace with an adapter around the production
 * calculation engine (see lib/astro/index.ts).
 */

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return (s % 100000) / 100000;
  };
}

const J2000 = Date.UTC(2000, 0, 1, 12);
/** mean longitude at J2000 (deg) and mean motion (deg/day) — rough */
const MEAN: Partial<Record<BodyId, [number, number]>> = {
  mars: [355.45, 0.524],
  jupiter: [34.4, 0.0831],
  saturn: [49.9, 0.0335],
  uranus: [314.1, 0.0117],
  neptune: [303.9, 0.006],
  pluto: [251.5, 0.004],
  node: [125.04, -0.05295],
  chiron: [250.0, 0.0195],
};

function daysSinceJ2000(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "12:00").split(":").map(Number);
  return (Date.UTC(y!, m! - 1, d!, hh!, mm!) - J2000) / 86400000;
}

function sunLon(days: number) {
  // Mean anomaly + equation of center (low precision solar formula)
  const g = norm(357.529 + 0.98560028 * days) * (Math.PI / 180);
  const q = norm(280.459 + 0.98564736 * days);
  return norm(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
}

function ayanamsa(settings: ChartSettings) {
  if (settings.zodiac === "sidereal-lahiri") return 24.1;
  if (settings.zodiac === "sidereal-fagan-bradley") return 24.9;
  return 0;
}

function houseOf(lon: number, cusps: number[]) {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i]!;
    const b = cusps[(i + 1) % 12]!;
    const span = norm(b - a);
    if (norm(lon - a) < span) return i + 1;
  }
  return 1;
}

function makeCusps(asc: number, mc: number, settings: ChartSettings, r: () => number) {
  const sys = settings.houseSystem;
  if (sys === "whole-sign") {
    const start = Math.floor(norm(asc) / 30) * 30;
    return Array.from({ length: 12 }, (_, i) => norm(start + i * 30));
  }
  if (sys === "equal") return Array.from({ length: 12 }, (_, i) => norm(asc + i * 30));
  // Quadrant systems: trisect each quadrant (Porphyry-like) with small
  // system-specific distortion so switching systems visibly changes cusps.
  const ic = norm(mc + 180);
  const dsc = norm(asc + 180);
  const quads: [number, number][] = [[asc, ic], [ic, dsc], [dsc, mc], [mc, asc]];
  const skew = { placidus: 0.06, koch: 0.08, porphyry: 0, regiomontanus: 0.04, campanus: 0.05 }[sys] ?? 0;
  const cusps: number[] = [];
  quads.forEach(([a, b], qi) => {
    const span = norm(b - a);
    const s = (qi % 2 === 0 ? 1 : -1) * skew;
    cusps.push(norm(a));
    cusps.push(norm(a + span * (1 / 3 + s * (0.5 + r() * 0.2))));
    cusps.push(norm(a + span * (2 / 3 + s * (0.3 + r() * 0.2))));
  });
  return cusps;
}

function compute(days: number, seedKey: string, settings: ChartSettings, angles?: { asc: number; mc: number }, refCusps?: number[]): ChartPoints {
  const r = rng(hash(seedKey));
  const ay = ayanamsa(settings);
  const sun = sunLon(days);
  const lons: Partial<Record<BodyId, number>> = { sun };
  const speeds: Partial<Record<BodyId, number>> = { sun: 0.9856 };

  // Moon: mean motion from J2000 plus seeded perturbation
  lons.moon = norm(218.316 + 13.176396 * days + (r() - 0.5) * 10);
  speeds.moon = 12 + r() * 3;

  // Inner planets constrained to max elongation from the Sun
  lons.mercury = norm(sun + (r() - 0.5) * 2 * 27);
  const mercRetro = r() < 0.19;
  speeds.mercury = mercRetro ? -(0.3 + r() * 0.6) : 0.8 + r() * 1.2;
  lons.venus = norm(sun + (r() - 0.5) * 2 * 45);
  const venRetro = r() < 0.07;
  speeds.venus = venRetro ? -(0.2 + r() * 0.4) : 0.9 + r() * 0.3;

  (Object.keys(MEAN) as BodyId[]).forEach((id) => {
    const [l0, n] = MEAN[id]!;
    lons[id] = norm(l0 + n * days + (r() - 0.5) * 6);
    const elong = Math.abs(((norm(lons[id]! - sun) + 180) % 360) - 180);
    const retro = id === "node" ? true : id !== "mars" ? elong > 115 : elong > 145;
    speeds[id] = retro ? -Math.abs(n) * (0.4 + r() * 0.6) : Math.abs(n) * (0.8 + r() * 0.6);
  });

  let asc: number, mc: number;
  if (angles) {
    asc = angles.asc; mc = angles.mc;
  } else {
    const hour = (days - Math.floor(days)) * 24; // UTC hour fraction — approximation
    asc = norm(sun + (hour - 6) * 15 + (r() - 0.5) * 30);
    mc = norm(asc - 90 + (r() - 0.5) * 30);
  }

  const cusps = refCusps ?? makeCusps(asc, mc, settings, r);
  const ids = [...settings.bodies.filter((b) => b !== "asc" && b !== "mc")];
  const bodies: BodyPosition[] = ids
    .filter((id) => lons[id] !== undefined)
    .map((id) => {
      const lon = norm(lons[id]! - ay);
      return { id, lon, speed: speeds[id] ?? 0, house: houseOf(lon, cusps) };
    });
  return { bodies, cusps: cusps.map((c) => (refCusps ? c : norm(c - ay))), asc: refCusps ? asc : norm(asc - ay), mc: refCusps ? mc : norm(mc - ay) };
}

function birthKey(b: BirthData) {
  return `${b.date}|${b.time}|${b.lat.toFixed(2)}|${b.lon.toFixed(2)}`;
}

/** Synchronous implementation (also handy for tests). */
export const DemoEngineSync = {
  natal(birth: BirthData, settings: ChartSettings): ChartPoints {
    return compute(daysSinceJ2000(birth.date, birth.time), birthKey(birth) + settings.houseSystem, settings);
  },
  positionsAt(iso: string, settings: ChartSettings, reference?: ChartPoints): ChartPoints {
    const [date, t] = iso.split("T");
    return compute(daysSinceJ2000(date!, (t ?? "12:00").slice(0, 5)), "transit" + date, settings, reference ? { asc: reference.asc, mc: reference.mc } : undefined, reference?.cusps);
  },
  progressed(birth: BirthData, targetDate: string, settings: ChartSettings): ChartPoints {
    const birthDays = daysSinceJ2000(birth.date, birth.time);
    const age = (daysSinceJ2000(targetDate, "12:00") - birthDays) / 365.25;
    const natal = DemoEngineSync.natal(birth, settings);
    const prog = compute(birthDays + age, birthKey(birth) + "prog", settings);
    const arc = norm(prog.bodies.find((b) => b.id === "sun")!.lon - natal.bodies.find((b) => b.id === "sun")!.lon);
    const asc = norm(natal.asc + arc);
    const mc = norm(natal.mc + arc);
    return { ...prog, bodies: prog.bodies.map((b) => ({ ...b, house: houseOf(b.lon, natal.cusps) })), asc, mc, cusps: natal.cusps };
  },
  solarArc(birth: BirthData, targetDate: string, settings: ChartSettings): ChartPoints {
    const natal = DemoEngineSync.natal(birth, settings);
    const birthDays = daysSinceJ2000(birth.date, birth.time);
    const age = (daysSinceJ2000(targetDate, "12:00") - birthDays) / 365.25;
    const arc = norm(sunLon(birthDays + age) - sunLon(birthDays));
    return {
      bodies: natal.bodies.map((b) => {
        const lon = norm(b.lon + arc);
        return { ...b, lon, house: houseOf(lon, natal.cusps) };
      }),
      cusps: natal.cusps,
      asc: norm(natal.asc + arc),
      mc: norm(natal.mc + arc),
    };
  },
};

export const DemoEngine: AstrologyEngine = {
  info: {
    id: "demo",
    name: "Demonstration engine",
    verified: false,
    description:
      "Approximate, illustrative positions generated for interface evaluation. Not calculated with an ephemeris — do not use for interpretation.",
  },
  natal: async (birth, settings) => DemoEngineSync.natal(birth, settings),
  positionsAt: async (iso, settings, reference) => DemoEngineSync.positionsAt(iso, settings, reference),
  progressed: async (birth, targetDate, settings) => DemoEngineSync.progressed(birth, targetDate, settings),
  solarArc: async (birth, targetDate, settings) => DemoEngineSync.solarArc(birth, targetDate, settings),
  // Illustrative only: demo longitudes, ecliptic latitude taken as 0, birth time read as UTC.
  acg: async (birth, settings) => approxAcg(`${birth.date}T${birth.time || "12:00"}:00Z`, DemoEngineSync.natal(birth, settings).bodies),
};

export { houseOf };
