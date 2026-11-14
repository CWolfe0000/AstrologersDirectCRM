import type { Aspect, AspectId, AstrologyEngine, BodyId, BodyPosition, ChartPoints, ChartSettings } from "./types";
import type { ChartRecord, ChartType, Person } from "@/lib/data/types";
import { ASPECTS, DEFAULT_SETTINGS, norm } from "./meta";
import { DemoEngine, houseOf } from "./demo-engine";

export * from "./types";
export * from "./meta";

/**
 * Engine registry. In production, register the adapter for the existing
 * calculation engine here and make it the active engine. The UI never imports
 * a concrete engine directly.
 */
const engines: Record<string, AstrologyEngine> = { demo: DemoEngine };
let activeEngineId = "demo";

export function getEngine(): AstrologyEngine {
  return engines[activeEngineId]!;
}
export function registerEngine(engine: AstrologyEngine, makeActive = false) {
  engines[engine.info.id] = engine;
  if (makeActive) activeEngineId = engine.info.id;
}

export const CHART_TYPES: { id: ChartType; name: string; short: string; people: 1 | 2; timing: boolean; description: string }[] = [
  { id: "natal", name: "Natal", short: "Natal", people: 1, timing: false, description: "Birth chart for one person." },
  { id: "synastry", name: "Synastry", short: "Synastry", people: 2, timing: false, description: "Bi-wheel comparing two natal charts." },
  { id: "composite", name: "Midpoint composite", short: "Composite", people: 2, timing: false, description: "Single chart of midpoints between two natal charts." },
  { id: "transits", name: "Transits", short: "Transits", people: 1, timing: true, description: "Current or future planetary positions against the natal chart." },
  { id: "progressions", name: "Secondary progressions", short: "Progressions", people: 1, timing: true, description: "Day-for-a-year progressed positions." },
  { id: "solar-arc", name: "Solar arc directions", short: "Solar arcs", people: 1, timing: true, description: "Natal chart directed by the solar arc." },
  { id: "solar-return", name: "Solar return", short: "Solar return", people: 1, timing: true, description: "Chart for the Sun's return to its natal position." },
];

export function chartTypeMeta(t: ChartType) {
  return CHART_TYPES.find((c) => c.id === t)!;
}

export function resolveSettings(partial?: Partial<ChartSettings>, base: ChartSettings = DEFAULT_SETTINGS): ChartSettings {
  return { ...base, ...partial, orbs: { ...base.orbs, ...(partial?.orbs ?? {}) } };
}

export interface ChartView {
  engine: AstrologyEngine["info"];
  type: ChartType;
  /** Inner wheel (natal / person A / composite). */
  inner: ChartPoints;
  /** Outer wheel for bi-wheels (transits, progressions, synastry person B …). */
  outer?: ChartPoints;
  aspects: Aspect[];
  settings: ChartSettings;
}

function midpoint(a: number, b: number) {
  const d = norm(b - a);
  return d > 180 ? norm(a + (d - 360) / 2) : norm(a + d / 2);
}

function composite(a: ChartPoints, b: ChartPoints): ChartPoints {
  const cusps = a.cusps.map((c, i) => midpoint(c, b.cusps[i]!));
  const bodies: BodyPosition[] = a.bodies
    .map((x) => {
      const y = b.bodies.find((q) => q.id === x.id);
      if (!y) return null;
      const lon = midpoint(x.lon, y.lon);
      return { id: x.id, lon, speed: (x.speed + y.speed) / 2, house: houseOf(lon, cusps) };
    })
    .filter(Boolean) as BodyPosition[];
  return { bodies, cusps, asc: midpoint(a.asc, b.asc), mc: midpoint(a.mc, b.mc) };
}

function withAngles(p: ChartPoints): BodyPosition[] {
  return [...p.bodies, { id: "asc", lon: p.asc, speed: 0, house: 1 }, { id: "mc", lon: p.mc, speed: 0, house: 10 }];
}

function sep(a: number, b: number) {
  const d = Math.abs(norm(a - b));
  return d > 180 ? 360 - d : d;
}

export function computeAspects(inner: ChartPoints, settings: ChartSettings, outer?: ChartPoints): Aspect[] {
  const out: Aspect[] = [];
  const A = withAngles(inner);
  const types = settings.aspects;
  const check = (x: BodyPosition, y: BodyPosition, xr: "inner" | "outer", yr: "inner" | "outer") => {
    if ((x.id === "asc" || x.id === "mc") && (y.id === "asc" || y.id === "mc")) return;
    const s = sep(x.lon, y.lon);
    for (const t of types) {
      const orbMax = settings.orbs[t] ?? ASPECTS[t].defaultOrb;
      const orb = Math.abs(s - ASPECTS[t].angle);
      if (orb <= orbMax) {
        const s2 = sep(x.lon + x.speed * 0.1, y.lon + y.speed * 0.1);
        const orb2 = Math.abs(s2 - ASPECTS[t].angle);
        out.push({ a: x.id, b: y.id, aRing: xr, bRing: yr, type: t, orb, applying: orb2 < orb });
        break;
      }
    }
  };
  if (outer) {
    const B = withAngles(outer).filter((b) => b.id !== "asc" && b.id !== "mc");
    for (const y of B) for (const x of A) check(y, x, "outer", "inner");
  } else {
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) check(A[i]!, A[j]!, "inner", "inner");
  }
  return out.sort((p, q) => p.orb - q.orb);
}

/** Build everything the UI needs for a saved chart. */
export function buildChart(chart: ChartRecord, people: Person[], overrides?: Partial<ChartSettings>, base?: ChartSettings): ChartView {
  const engine = getEngine();
  const settings = resolveSettings({ ...chart.settings, ...overrides }, base);
  const pa = people.find((p) => p.id === chart.personIds[0]);
  const pb = people.find((p) => p.id === chart.personIds[1]);
  if (!pa) throw new Error("Chart subject not found");
  const natalA = engine.natal(pa.birth, settings);
  const ref = chart.refDate ?? "2026-11-14";
  let inner = natalA;
  let outer: ChartPoints | undefined;
  switch (chart.type) {
    case "synastry":
      if (pb) outer = engine.natal(pb.birth, settings);
      break;
    case "composite":
      if (pb) inner = composite(natalA, engine.natal(pb.birth, settings));
      break;
    case "transits":
      outer = engine.positionsAt(ref + "T12:00", settings, natalA);
      break;
    case "progressions":
      outer = engine.progressed(pa.birth, ref, settings);
      break;
    case "solar-arc":
      outer = engine.solarArc(pa.birth, ref, settings);
      break;
    case "solar-return": {
      const yr = ref.slice(0, 4);
      inner = engine.natal({ ...pa.birth, date: `${yr}${pa.birth.date.slice(4)}` }, settings);
      break;
    }
  }
  return { engine: engine.info, type: chart.type, inner, outer, aspects: computeAspects(inner, settings, outer), settings };
}

/** Natal positions only — used for quick previews & thumbnails. */
export function natalPoints(person: Person, settings: ChartSettings = DEFAULT_SETTINGS) {
  return getEngine().natal(person.birth, settings);
}

export function bodyIn(points: ChartPoints, id: BodyId) {
  if (id === "asc") return { id, lon: points.asc, speed: 0, house: 1 } as BodyPosition;
  if (id === "mc") return { id, lon: points.mc, speed: 0, house: 10 } as BodyPosition;
  return points.bodies.find((b) => b.id === id);
}

export function aspectKey(a: Aspect) {
  return `${a.aRing}:${a.a}-${a.bRing}:${a.b}`;
}

export type { AspectId };
