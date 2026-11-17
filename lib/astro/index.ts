import type { Aspect, AspectId, AstrologyEngine, BirthData, BodyId, BodyPosition, ChartPoints, ChartSettings } from "./types";
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
  { id: "composite", name: "Midpoint Composite", short: "Composite", people: 2, timing: false, description: "Single chart of midpoints between two natal charts." },
  { id: "transits", name: "Transits", short: "Transits", people: 1, timing: true, description: "Current or future planetary positions against the natal chart." },
  { id: "progressions", name: "Secondary Progressions", short: "Progressions", people: 1, timing: true, description: "Day-for-a-year progressed positions." },
  { id: "solar-arc", name: "Solar Arc Directions", short: "Solar Arcs", people: 1, timing: true, description: "Natal chart directed by the solar arc." },
  { id: "solar-return", name: "Solar Return", short: "Solar Return", people: 1, timing: true, description: "Chart for the Sun's return to its natal position." },
  { id: "horary", name: "Horary", short: "Horary", people: 1, timing: false, description: "Chart for the moment and place a question is asked." },
  { id: "astrocartography", name: "Astrocartography", short: "Astrocartography", people: 1, timing: false, description: "World map of where each planet rises, sets and culminates." },
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

/**
 * Aspects within one chart, or between two rings. Each pair gets its tightest aspect within orb.
 * `outerAngles`: include the outer ring's ASC/MC (synastry — both are real natal angles). Transit,
 * progressed and directed rings borrow the natal angles, so theirs are left out.
 */
export function computeAspects(inner: ChartPoints, settings: ChartSettings, outer?: ChartPoints, opts: { outerAngles?: boolean } = {}): Aspect[] {
  const out: Aspect[] = [];
  const A = withAngles(inner);
  const types = settings.aspects;
  const check = (x: BodyPosition, y: BodyPosition, xr: "inner" | "outer", yr: "inner" | "outer") => {
    const angles = (x.id === "asc" || x.id === "mc") && (y.id === "asc" || y.id === "mc");
    // Within one chart, ASC–MC is always a fixed relation; between two people it is a real contact.
    if (angles && !(outer && opts.outerAngles)) return;
    const s = sep(x.lon, y.lon);
    let best: { t: AspectId; orb: number } | null = null;
    for (const t of types) {
      const orbMax = settings.orbs[t] ?? ASPECTS[t].defaultOrb;
      const orb = Math.abs(s - ASPECTS[t].angle);
      if (orb <= orbMax && (!best || orb < best.orb)) best = { t, orb };
    }
    if (!best) return;
    const s2 = sep(x.lon + x.speed * 0.1, y.lon + y.speed * 0.1);
    const orb2 = Math.abs(s2 - ASPECTS[best.t].angle);
    out.push({ a: x.id, b: y.id, aRing: xr, bRing: yr, type: best.t, orb: best.orb, applying: orb2 < best.orb });
  };
  if (outer) {
    const B = opts.outerAngles ? withAngles(outer) : outer.bodies;
    for (const y of B) for (const x of A) check(y, x, "outer", "inner");
  } else {
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) check(A[i]!, A[j]!, "inner", "inner");
  }
  return out.sort((p, q) => p.orb - q.orb);
}

/** Build everything the UI needs for a saved chart. */
/** A horary question's moment and place, as birth data for the engine. */
export function horaryBirth(h: NonNullable<ChartRecord["horary"]>): BirthData {
  return { date: h.at.slice(0, 10), time: h.at.slice(11, 16), timeAccuracy: "exact", place: h.place, lat: h.lat, lon: h.lon, tz: h.tz };
}

export async function buildChart(chart: ChartRecord, people: Person[], overrides?: Partial<ChartSettings>, base?: ChartSettings): Promise<ChartView> {
  const engine = getEngine();
  const settings = resolveSettings({ ...chart.settings, ...overrides }, base);
  if (chart.type === "horary") {
    if (!chart.horary) throw new Error("This horary chart has no question time and place.");
    const inner = await engine.natal(horaryBirth(chart.horary), settings);
    return { engine: engine.info, type: chart.type, inner, aspects: computeAspects(inner, settings), settings };
  }
  const pa = people.find((p) => p.id === chart.personIds[0]);
  const pb = people.find((p) => p.id === chart.personIds[1]);
  if (!pa) throw new Error("Chart subject not found");
  const natalA = await engine.natal(pa.birth, settings);
  const ref = chart.refDate ?? "2026-11-14";
  let inner = natalA;
  let outer: ChartPoints | undefined;
  switch (chart.type) {
    case "synastry":
      if (pb) outer = await engine.natal(pb.birth, settings);
      break;
    case "composite":
      if (pb) inner = composite(natalA, await engine.natal(pb.birth, settings));
      break;
    case "transits":
      outer = await engine.positionsAt(ref + "T12:00", settings, natalA);
      break;
    case "progressions":
      outer = await engine.progressed(pa.birth, ref, settings);
      break;
    case "solar-arc":
      outer = await engine.solarArc(pa.birth, ref, settings);
      break;
    case "solar-return": {
      const yr = ref.slice(0, 4);
      inner = engine.solarReturn
        ? await engine.solarReturn(pa.birth, Number(yr), settings)
        : await engine.natal({ ...pa.birth, date: `${yr}${pa.birth.date.slice(4)}` }, settings);
      break;
    }
  }
  return { engine: engine.info, type: chart.type, inner, outer, aspects: computeAspects(inner, settings, outer, { outerAngles: chart.type === "synastry" }), settings };
}

/** Natal positions only — used for quick previews & thumbnails. */
export function natalPoints(person: Person, settings: ChartSettings = DEFAULT_SETTINGS): Promise<ChartPoints> {
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
