import type { AspectId, BodyId } from "./types";
import type { Ephemeris } from "./techniques/types";
import { delta, norm, separation } from "./techniques/spherical";
import { TROPICAL_YEAR } from "./techniques/directions";
import { houseOf } from "./techniques/aspects";
import { RULERS, signOf } from "./meta";

/**
 * Convergence timeline: every contact from moving points (transits, secondary
 * progressions, solar arcs) and lunations/eclipses to a natal chart over a
 * date range, with orb windows, exact hits (every pass of a retrograde) and a
 * day-by-day density score that picks out periods where many contacts overlap.
 *
 * Engine-independent: it only needs `Ephemeris.bodies`. Positions are sampled
 * on a regular grid and refined with cubic Hermite interpolation (position and
 * speed at each sample), so exact times are accurate to minutes for the
 * planets and well under an hour for the Moon.
 *
 * The score counts and weights contacts. It does not interpret them, and the
 * weights are a provisional default (see WEIGHTS below and docs/techniques.md).
 */

const DAY = 86_400_000;

export type TimelineTechnique = "transit" | "progressed" | "solar-arc" | "lunation" | "eclipse";
export type TargetId = BodyId | "asc" | "mc";
export type SourceId = BodyId | "asc" | "mc" | "new-moon" | "full-moon";

export interface TimelineOptions {
  transits: boolean;
  progressions: boolean;
  solarArcs: boolean;
  lunations: boolean;
  /** Transiting bodies to include. */
  transitBodies: BodyId[];
  /** Secondary-progressed bodies to include (the slow planets barely move by progression). Solar arcs direct every natal point. */
  progressedBodies: BodyId[];
  aspects: AspectId[];
  orbs: { transit: number; directed: number; lunation: number; eclipse: number };
  /** Per-planet transit orbs, overriding orbs.transit. */
  transitOrbs?: Partial<Record<BodyId, number>>;
  /** Natal points to aim at. Defaults to every natal point available. */
  targets?: TargetId[];
}

export const TIMELINE_ASPECTS: { id: AspectId; angle: number }[] = [
  { id: "conjunction", angle: 0 },
  { id: "sextile", angle: 60 },
  { id: "square", angle: 90 },
  { id: "trine", angle: 120 },
  { id: "opposition", angle: 180 },
  { id: "quincunx", angle: 150 },
  { id: "semisquare", angle: 45 },
  { id: "sesquiquadrate", angle: 135 },
  { id: "semisextile", angle: 30 },
];

/** Lunations and eclipses are checked with the hard aspects only (conjunction, opposition, square). */
const LUNATION_ASPECTS: AspectId[] = ["conjunction", "opposition", "square"];

export const DEFAULT_TIMELINE_OPTIONS: TimelineOptions = {
  transits: true,
  progressions: true,
  solarArcs: true,
  lunations: true,
  transitBodies: ["sun", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"],
  progressedBodies: ["sun", "moon", "mercury", "venus", "mars"],
  aspects: ["conjunction", "sextile", "square", "trine", "opposition"],
  orbs: { transit: 1, directed: 1, lunation: 3, eclipse: 5 },
};

/**
 * Provisional weights for the density score. Slow movers, hard aspects, and
 * the luminaries, angles and chart ruler count for more.
 */
export const WEIGHTS = {
  transit: { moon: 0.3, sun: 0.6, mercury: 0.5, venus: 0.5, mars: 0.8, jupiter: 1.1, saturn: 1.5, uranus: 1.6, neptune: 1.6, pluto: 1.7, node: 0.7, chiron: 0.9 } as Partial<Record<BodyId, number>>,
  progressed: 1.6,
  progressedMoon: 1.2,
  solarArc: 1.6,
  lunation: 0.7,
  eclipse: 1.4,
  aspect: { conjunction: 1.3, opposition: 1.2, square: 1.2, trine: 0.8, sextile: 0.6 } as Partial<Record<AspectId, number>>,
  minorAspect: 0.5,
  keyTarget: 1.3,
  /** How long a lunation / eclipse counts toward the density score after it happens. */
  lunationSpanDays: 7,
  eclipseSpanDays: 28,
};

export interface NatalTargets {
  /** Birth moment, UTC. */
  birthUtc: string;
  bodies: { id: BodyId; lon: number }[];
  /** Omit when the birth time is unknown: angles, houses and the chart ruler are then left out. */
  asc?: number;
  mc?: number;
  cusps?: number[];
}

export interface TimelineExact {
  utc: string;
  /** 1-based number of this exact hit within the range, for the same contact. */
  pass: number;
  retrograde: boolean;
}

export interface TimelineStation {
  utc: string;
  /** "retrograde": the planet turns retrograde; "direct": it turns direct. */
  kind: "retrograde" | "direct";
}

export interface TimelineWindow {
  start: string;
  end: string;
  /** The orb window began before / continues after the range. */
  startOpen: boolean;
  endOpen: boolean;
  exacts: TimelineExact[];
  /** Closest approach inside the range (0 when exact), and when it happens. */
  minOrb: number;
  closest: string;
  stations: TimelineStation[];
}

export interface LunationEvent {
  utc: string;
  kind: "new" | "full";
  /** Longitude of the Moon at the lunation. */
  lon: number;
  /** "total solar eclipse", … or null. */
  eclipse: string | null;
  /** True when the eclipse label is the rough "near a node" estimate, not a real eclipse search. */
  eclipseApproximate?: boolean;
}

export interface TimelineContact {
  id: string;
  technique: TimelineTechnique;
  source: SourceId;
  aspect: AspectId;
  target: TargetId;
  targetHouse: number | null;
  weight: number;
  windows: TimelineWindow[];
  /** Lunations/eclipses: the individual events (each also has a zero-length window). */
  events?: (LunationEvent & { orb: number })[];
}

export interface ConvergenceWindow {
  start: string;
  end: string;
  peak: string;
  peakScore: number;
  /** Contact ids active during the window: those exact inside it first, then by weight. */
  contacts: string[];
  /** How many of them are exact inside the window. */
  exactCount: number;
  /** The natal point and house most contacts aim at during the window. */
  focus: { target: TargetId | null; targetCount: number; house: number | null; houseCount: number };
}

export interface TimelineDay {
  date: string;
  score: number;
  count: number;
}

export interface TimelineResult {
  from: string;
  to: string;
  days: TimelineDay[];
  contacts: TimelineContact[];
  convergences: ConvergenceWindow[];
  natal: { id: TargetId; lon: number; house: number | null; key: boolean }[];
  lunations: LunationEvent[];
  notes: string[];
}

// ---------------------------------------------------------------------------
// Sampling and interpolation

interface Track {
  t: number[]; // ms
  lon: number[];
  speed: number[]; // deg per real day
  hDays: number; // sample spacing in real days
}

/** Unwrapped displacement from sample i at fraction u ∈ [0, 1] (cubic Hermite). */
function hermite(tr: Track, i: number, u: number) {
  const d1 = delta(tr.lon[i]!, tr.lon[i + 1]!);
  const m0 = tr.speed[i]! * tr.hDays;
  const m1 = tr.speed[i + 1]! * tr.hDays;
  const u2 = u * u, u3 = u2 * u;
  return (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * d1 + (u3 - u2) * m1;
}

const lonAt = (tr: Track, i: number, u: number) => norm(tr.lon[i]! + hermite(tr, i, u));
const iso = (ms: number) => new Date(Math.round(ms / 1000) * 1000).toISOString().replace(".000Z", "Z");

function bisect(g: (u: number) => number) {
  let lo = 0, hi = 1;
  const glo = g(0);
  for (let k = 0; k < 32; k++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(g(mid)) === Math.sign(glo)) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

async function sampleTransits(eph: Pick<Ephemeris, "bodies">, fromMs: number, toMs: number, stepDays: number, ids: BodyId[]) {
  const tracks = new Map<BodyId, Track>(ids.map((id) => [id, { t: [], lon: [], speed: [], hDays: stepDays }]));
  const n = Math.ceil((toMs - fromMs) / (stepDays * DAY));
  for (let k = 0; k <= n; k++) {
    const t = fromMs + k * stepDays * DAY;
    const pos = await eph.bodies(iso(t));
    for (const id of ids) {
      const p = pos[id];
      if (!p) continue;
      const tr = tracks.get(id)!;
      tr.t.push(t); tr.lon.push(p.lon); tr.speed.push(p.speed);
    }
  }
  for (const [id, tr] of tracks) if (tr.t.length !== n + 1) tracks.delete(id);
  return tracks;
}

/** Secondary-progressed positions as a function of real time (one day after birth per year of life). */
async function sampleProgressions(eph: Pick<Ephemeris, "bodies">, birthMs: number, fromMs: number, toMs: number, stepDays: number) {
  const out = new Map<BodyId, Track>();
  const n = Math.ceil((toMs - fromMs) / (stepDays * DAY));
  for (let k = 0; k <= n; k++) {
    const t = fromMs + k * stepDays * DAY;
    const progMs = birthMs + (t - birthMs) / TROPICAL_YEAR;
    const pos = await eph.bodies(iso(progMs));
    for (const [id, p] of Object.entries(pos) as [BodyId, { lon: number; speed: number }][]) {
      if (!out.has(id)) out.set(id, { t: [], lon: [], speed: [], hDays: stepDays });
      const tr = out.get(id)!;
      tr.t.push(t); tr.lon.push(p.lon); tr.speed.push(p.speed / TROPICAL_YEAR);
    }
  }
  for (const [id, tr] of out) if (tr.t.length !== n + 1) out.delete(id);
  return out;
}

// ---------------------------------------------------------------------------
// Orb windows and exact hits along one track against one target longitude

interface ScanHooks {
  /** Called for each sample inside orb with its closeness (1 when exact, falling toward the orb's edge). */
  sample(tMs: number, hDays: number, closeness: number): void;
}

/** Closeness taper: transits keep half weight at the orb's edge; slow directed contacts fall to zero there. */
function scan(tr: Track, targetLon: number, orb: number, hooks: ScanHooks, fromMs: number, toMs: number, edge = 0.5) {
  const windows: (Omit<TimelineWindow, "exacts" | "stations" | "start" | "end" | "closest"> & { s: number; e: number; ct: number; ex: { t: number; retro: boolean }[] })[] = [];
  const f0 = (i: number) => delta(targetLon, tr.lon[i]!); // signed: point − target
  let cur: (typeof windows)[number] | null = null;
  const first = f0(0);
  if (Math.abs(first) <= orb) cur = { s: tr.t[0]!, e: tr.t[0]!, ct: tr.t[0]!, startOpen: true, endOpen: false, minOrb: Math.abs(first), ex: [] };

  for (let i = 0; i < tr.t.length - 1; i++) {
    const fa = f0(i);
    const f = (u: number) => fa + hermite(tr, i, u);
    const fb = f(1);
    const span = tr.t[i + 1]! - tr.t[i]!;
    if (Math.abs(fa) <= orb) hooks.sample(tr.t[i]!, tr.hDays, 1 - (1 - edge) * (Math.abs(fa) / orb));
    // Skip intervals far from the target: neither end within orb + one step of motion.
    const reach = Math.abs(fb - fa) + orb + 1e-9;
    if (Math.abs(fa) > reach && Math.abs(fb) > reach && Math.sign(fa) === Math.sign(fb)) continue;

    const events: { u: number; kind: "enter" | "exit" | "exact" }[] = [];
    for (const c of [-orb, orb]) {
      const ga = fa - c, gb = fb - c;
      if (ga === 0 || Math.sign(ga) === Math.sign(gb)) continue;
      const u = bisect((x) => f(x) - c);
      const rising = gb > ga;
      // Crossing +orb upward or −orb downward leaves the orb; the reverse enters it.
      const exiting = (c > 0 && rising) || (c < 0 && !rising);
      events.push({ u, kind: exiting ? "exit" : "enter" });
    }
    if (fa !== 0 && Math.sign(fa) !== Math.sign(fb)) events.push({ u: bisect(f), kind: "exact" });
    else if (fa === 0 && i === 0) events.push({ u: 0, kind: "exact" });
    events.sort((a, b) => a.u - b.u);

    for (const ev of events) {
      const t = tr.t[i]! + ev.u * span;
      if (ev.kind === "enter") {
        if (!cur) cur = { s: t, e: t, ct: t, startOpen: false, endOpen: false, minOrb: orb, ex: [] };
      } else if (ev.kind === "exit") {
        if (cur) {
          cur.e = t;
          windows.push(cur);
          cur = null;
        }
      } else {
        const speed = tr.speed[i]! + (tr.speed[i + 1]! - tr.speed[i]!) * ev.u;
        if (!cur) cur = { s: t, e: t, ct: t, startOpen: false, endOpen: false, minOrb: 0, ex: [] };
        cur.ex.push({ t, retro: speed < 0 });
        if (cur.minOrb > 0) cur.ct = t;
        cur.minOrb = 0;
      }
    }
    if (cur && Math.abs(fb) < cur.minOrb && tr.t[i + 1]! >= fromMs && tr.t[i + 1]! <= toMs) {
      cur.minOrb = Math.abs(fb);
      cur.ct = tr.t[i + 1]!;
    }
  }
  if (cur) {
    cur.e = tr.t[tr.t.length - 1]!;
    cur.endOpen = true;
    windows.push(cur);
  }
  // Clip to the requested range (samples may extend past it).
  return windows
    .filter((w) => w.e >= fromMs && w.s <= toMs)
    .map((w) => ({
      ...w,
      startOpen: w.startOpen || w.s < fromMs,
      endOpen: w.endOpen || w.e > toMs,
      ct: Math.min(Math.max(w.ct, fromMs), toMs),
      s: Math.max(w.s, fromMs),
      e: Math.min(w.e, toMs),
      ex: w.ex.filter((x) => x.t >= fromMs && x.t <= toMs),
    }));
}

function stationsOf(tr: Track) {
  const out: { t: number; kind: TimelineStation["kind"] }[] = [];
  for (let i = 0; i < tr.t.length - 1; i++) {
    const a = tr.speed[i]!, b = tr.speed[i + 1]!;
    if (a === 0 || Math.sign(a) === Math.sign(b)) continue;
    const u = a / (a - b);
    out.push({ t: tr.t[i]! + u * (tr.t[i + 1]! - tr.t[i]!), kind: a > 0 ? "retrograde" : "direct" });
  }
  return out;
}

// ---------------------------------------------------------------------------

function lunationsFromTracks(sun: Track, moon: Track): LunationEvent[] {
  const out: LunationEvent[] = [];
  for (let i = 0; i < moon.t.length - 1; i++) {
    for (const [kind, angle] of [["new", 0], ["full", 180]] as const) {
      const g = (u: number) => delta(norm(lonAt(sun, i, u) + angle), lonAt(moon, i, u));
      const ga = g(0), gb = g(1);
      if (ga < 0 && gb >= 0 && gb - ga < 90) {
        const u = bisect(g);
        out.push({ utc: iso(moon.t[i]! + u * (moon.t[i + 1]! - moon.t[i]!)), kind, lon: lonAt(moon, i, u), eclipse: null });
      }
    }
  }
  return out;
}

/** Rough eclipse estimate for engines without an eclipse search: lunation close to the lunar node. */
function approximateEclipses(lunations: LunationEvent[], node: Track | undefined) {
  if (!node) return;
  for (const l of lunations) {
    const t = Date.parse(l.utc);
    const i = Math.max(0, Math.min(node.t.length - 2, Math.floor((t - node.t[0]!) / (node.hDays * DAY))));
    const u = Math.max(0, Math.min(1, (t - node.t[i]!) / (node.hDays * DAY)));
    const sunLon = l.kind === "new" ? l.lon : norm(l.lon + 180);
    const d = Math.min(separation(sunLon, lonAt(node, i, u)), separation(sunLon, norm(lonAt(node, i, u) + 180)));
    if ((l.kind === "new" && d < 15.4) || (l.kind === "full" && d < 11.8)) {
      l.eclipse = l.kind === "new" ? "solar eclipse" : "lunar eclipse";
      l.eclipseApproximate = true;
    }
  }
}

export interface TimelineInput {
  natal: NatalTargets;
  /** Range in UTC, ISO dates or date-times. `to` is inclusive of that whole day when a bare date. */
  from: string;
  to: string;
  eph: Pick<Ephemeris, "bodies">;
  options?: Partial<TimelineOptions>;
  /** Eclipses from a real eclipse search (Swiss Ephemeris). Matched to the lunations by time. */
  eclipses?: { utc: string; label: string }[];
}

const MAX_RANGE_DAYS = 3 * 366 + 1;

export async function convergenceTimeline(input: TimelineInput): Promise<TimelineResult> {
  const o: TimelineOptions = { ...DEFAULT_TIMELINE_OPTIONS, ...input.options, orbs: { ...DEFAULT_TIMELINE_OPTIONS.orbs, ...input.options?.orbs } };
  const toMsOf = (s: string, endOfDay: boolean) => (s.length === 10 ? Date.parse(`${s}T00:00:00Z`) + (endOfDay ? DAY : 0) : Date.parse(s));
  const fromMs = toMsOf(input.from, false);
  const toMs = toMsOf(input.to, true);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) throw new Error("Invalid date range");
  if ((toMs - fromMs) / DAY > MAX_RANGE_DAYS) throw new Error("Date range is limited to three years");

  const natal = input.natal;
  const birthMs = Date.parse(natal.birthUtc);
  const hasTime = natal.asc !== undefined && natal.mc !== undefined;
  const cusps = hasTime ? natal.cusps : undefined;
  const ruler = hasTime ? RULERS[signOf(natal.asc!).id].traditional : null;
  const notes: string[] = [];
  if (!hasTime) notes.push("Birth time unknown: the Ascendant, Midheaven, houses and chart ruler are left out.");

  const allTargets: { id: TargetId; lon: number }[] = [...natal.bodies.map((b) => ({ id: b.id as TargetId, lon: b.lon }))];
  if (hasTime) allTargets.push({ id: "asc", lon: natal.asc! }, { id: "mc", lon: natal.mc! });
  const targets = allTargets.filter((t) => !o.targets || o.targets.includes(t.id));
  const isKey = (id: TargetId) => id === "sun" || id === "moon" || id === "asc" || id === "mc" || id === ruler;
  const houseOfTarget = (lon: number) => (cusps && cusps.length === 12 ? houseOf(lon, cusps) : null);

  const aspects = TIMELINE_ASPECTS.filter((a) => o.aspects.includes(a.id));
  const aspectWeight = (a: AspectId) => WEIGHTS.aspect[a] ?? WEIGHTS.minorAspect;

  const nDays = Math.round((toMs - fromMs) / DAY);
  const score = new Float64Array(nDays);
  const activeSets: Set<string>[] = Array.from({ length: nDays }, () => new Set());
  const dayOf = (t: number) => Math.floor((t - fromMs) / DAY);
  const addScore = (t: number, hDays: number, w: number) => {
    if (hDays >= 1) {
      const d0 = dayOf(t);
      for (let d = Math.max(0, d0); d < Math.min(nDays, d0 + Math.round(hDays)); d++) score[d] += w;
    } else {
      const d = dayOf(t);
      if (d >= 0 && d < nDays) score[d] += w * hDays;
    }
  };

  const contacts: TimelineContact[] = [];

  function addTrackContacts(technique: "transit" | "progressed" | "solar-arc", source: SourceId, tr: Track, orb: number, sourceWeight: number, stations: { t: number; kind: TimelineStation["kind"] }[]) {
    for (const target of targets) {
      for (const a of aspects) {
        if (technique !== "transit" && source === target.id && a.angle === 0) continue; // a point directed onto itself only at birth
        const weight = sourceWeight * aspectWeight(a.id) * (isKey(target.id) ? WEIGHTS.keyTarget : 1);
        const id = `${technique}:${source}:${a.id}:${target.id}`;
        const sides = a.angle === 0 || a.angle === 180 ? [a.angle] : [a.angle, -a.angle];
        const edge = technique === "transit" ? 0.5 : 0;
        const raw = sides.flatMap((s) => scan(tr, norm(target.lon + s), orb, { sample: (t, h, c) => addScore(t, h, weight * c) }, fromMs, toMs, edge));
        if (raw.length === 0) continue;
        raw.sort((x, y) => x.s - y.s);
        let pass = 0;
        const windows: TimelineWindow[] = raw.map((w) => ({
          start: iso(w.s),
          end: iso(w.e),
          startOpen: w.startOpen,
          endOpen: w.endOpen,
          minOrb: Math.round(w.minOrb * 1000) / 1000,
          closest: iso(w.ct),
          exacts: w.ex.map((x) => ({ utc: iso(x.t), pass: ++pass, retrograde: x.retro })),
          stations: stations.filter((s) => s.t >= w.s && s.t <= w.e).map((s) => ({ utc: iso(s.t), kind: s.kind })),
        }));
        for (const w of raw) for (let d = Math.max(0, dayOf(w.s)); d <= Math.min(nDays - 1, dayOf(w.e)); d++) activeSets[d]!.add(id);
        contacts.push({ id, technique, source, aspect: a.id, target: target.id, targetHouse: houseOfTarget(target.lon), weight: Math.round(weight * 100) / 100, windows });
      }
    }
  }

  // Transits (and the Sun/Moon/node tracks used for lunations).
  const needMoon = o.lunations || (o.transits && o.transitBodies.includes("moon"));
  const transitIds = new Set<BodyId>(o.transits ? o.transitBodies : []);
  if (o.lunations) ["sun", "moon", "node"].forEach((b) => transitIds.add(b as BodyId));
  const step = needMoon ? 0.25 : 1;
  const tracks = transitIds.size ? await sampleTransits(input.eph, fromMs - step * DAY, toMs + step * DAY, step, [...transitIds]) : new Map<BodyId, Track>();
  if (o.transits) {
    for (const id of o.transitBodies) {
      const tr = tracks.get(id);
      if (!tr) continue;
      addTrackContacts("transit", id, tr, o.transitOrbs?.[id] ?? o.orbs.transit, WEIGHTS.transit[id] ?? 1, id === "node" || id === "moon" ? [] : stationsOf(tr));
    }
  }

  // Secondary progressions and solar arcs (slow: sampled every 5 days).
  if ((o.progressions || o.solarArcs) && Number.isFinite(birthMs)) {
    const prog = await sampleProgressions(input.eph, birthMs, fromMs - 5 * DAY, toMs + 5 * DAY, 5);
    if (o.progressions) {
      for (const b of natal.bodies.filter((x) => o.progressedBodies.includes(x.id))) {
        const tr = prog.get(b.id);
        if (!tr) continue;
        addTrackContacts("progressed", b.id, tr, o.orbs.directed, b.id === "moon" ? WEIGHTS.progressedMoon : WEIGHTS.progressed, stationsOf(tr));
      }
    }
    const progSun = prog.get("sun");
    const natalSun = natal.bodies.find((b) => b.id === "sun");
    if (o.solarArcs && progSun && natalSun) {
      const arcAt = progSun.lon.map((l) => norm(l - natalSun.lon));
      const directed = (lon0: number): Track => ({ t: progSun.t, lon: arcAt.map((a) => norm(lon0 + a)), speed: progSun.speed, hDays: progSun.hDays });
      const sources: { id: SourceId; lon: number }[] = natal.bodies.map((b) => ({ id: b.id, lon: b.lon }));
      if (hasTime) sources.push({ id: "asc", lon: natal.asc! }, { id: "mc", lon: natal.mc! });
      for (const s of sources) addTrackContacts("solar-arc", s.id, directed(s.lon), o.orbs.directed, WEIGHTS.solarArc, []);
    }
  }

  // Lunations and eclipses landing on natal points.
  let lunations: LunationEvent[] = [];
  if (o.lunations && tracks.get("sun") && tracks.get("moon")) {
    lunations = lunationsFromTracks(tracks.get("sun")!, tracks.get("moon")!).filter((l) => {
      const t = Date.parse(l.utc);
      return t >= fromMs && t < toMs;
    });
    if (input.eclipses) {
      for (const l of lunations) {
        const hit = input.eclipses.find((e) => Math.abs(Date.parse(e.utc) - Date.parse(l.utc)) < DAY / 2);
        if (hit) l.eclipse = hit.label;
      }
    } else {
      approximateEclipses(lunations, tracks.get("node"));
      if (lunations.some((l) => l.eclipse)) notes.push("Eclipses are estimated from the distance to the lunar node (no eclipse search in this engine).");
    }
    const byId = new Map<string, TimelineContact>();
    for (const l of lunations) {
      const technique = l.eclipse ? "eclipse" : "lunation";
      const orb = l.eclipse ? o.orbs.eclipse : o.orbs.lunation;
      for (const target of targets) {
        for (const a of TIMELINE_ASPECTS.filter((x) => LUNATION_ASPECTS.includes(x.id) && o.aspects.includes(x.id))) {
          const off = Math.abs(separation(l.lon, target.lon) - a.angle);
          if (off > orb) continue;
          const source: SourceId = l.kind === "new" ? "new-moon" : "full-moon";
          const id = `${technique}:${source}:${a.id}:${target.id}`;
          const weight = (l.eclipse ? WEIGHTS.eclipse : WEIGHTS.lunation) * aspectWeight(a.id) * (isKey(target.id) ? WEIGHTS.keyTarget : 1);
          let c = byId.get(id);
          if (!c) {
            c = { id, technique, source, aspect: a.id, target: target.id, targetHouse: houseOfTarget(target.lon), weight: Math.round(weight * 100) / 100, windows: [], events: [] };
            byId.set(id, c);
            contacts.push(c);
          }
          c.events!.push({ ...l, orb: Math.round(off * 1000) / 1000 });
          c.windows.push({ start: l.utc, end: l.utc, closest: l.utc, startOpen: false, endOpen: false, minOrb: Math.round(off * 1000) / 1000, exacts: [{ utc: l.utc, pass: c.events!.length, retrograde: false }], stations: [] });
          const t = Date.parse(l.utc);
          const spanDays = l.eclipse ? WEIGHTS.eclipseSpanDays : WEIGHTS.lunationSpanDays;
          const closeness = 1 - 0.5 * (off / orb);
          for (let d = Math.max(0, dayOf(t)); d < Math.min(nDays, dayOf(t) + spanDays); d++) {
            score[d] += weight * closeness;
            activeSets[d]!.add(id);
          }
        }
      }
    }
  }

  const days: TimelineDay[] = Array.from({ length: nDays }, (_, d) => ({
    date: new Date(fromMs + d * DAY).toISOString().slice(0, 10),
    score: Math.round(score[d]! * 100) / 100,
    count: activeSets[d]!.size,
  }));

  contacts.sort((a, b) => firstTime(a) - firstTime(b) || b.weight - a.weight);
  const byContact = new Map(contacts.map((c) => [c.id, c]));

  return {
    from: iso(fromMs),
    to: iso(toMs),
    days,
    contacts,
    convergences: findConvergences(days, activeSets, byContact),
    natal: allTargets.map((t) => ({ id: t.id, lon: t.lon, house: houseOfTarget(t.lon), key: isKey(t.id) })),
    lunations,
    notes,
  };
}

function firstTime(c: TimelineContact) {
  const w = c.windows[0];
  return w ? Date.parse(w.exacts[0]?.utc ?? w.start) : 0;
}

/**
 * Periods where the density score stands out from the rest of the range:
 * days above mean + 0.75 σ with at least three contacts, merged across gaps of
 * up to five days. The six strongest are returned, in date order.
 */
function findConvergences(days: TimelineDay[], active: Set<string>[], contacts: Map<string, TimelineContact>): ConvergenceWindow[] {
  if (days.length === 0) return [];
  const scores = days.map((d) => d.score);
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  const sd = Math.sqrt(scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length);
  const threshold = mean + 0.75 * sd;
  const hot = days.map((d) => d.score > threshold && d.count >= 3);

  const runs: [number, number][] = [];
  for (let i = 0; i < hot.length; i++) {
    if (!hot[i]) continue;
    const last = runs[runs.length - 1];
    if (last && i - last[1] <= 6) last[1] = i;
    else runs.push([i, i]);
  }

  const windows = runs
    .filter(([a, b]) => b - a >= 2)
    .map(([a, b]) => {
      const ids = new Set<string>();
      let peak = a;
      let total = 0;
      for (let d = a; d <= b; d++) {
        active[d]!.forEach((id) => ids.add(id));
        total += days[d]!.score;
        if (days[d]!.score > days[peak]!.score) peak = d;
      }
      const lo = Date.parse(`${days[a]!.date}T00:00:00Z`), hi = Date.parse(`${days[b]!.date}T00:00:00Z`) + DAY;
      const exactIn = (id: string) => contacts.get(id)!.windows.some((w) => w.exacts.some((e) => Date.parse(e.utc) >= lo && Date.parse(e.utc) < hi));
      // Focus: count contacts per natal point, and per natal house.
      const perTarget = new Map<TargetId, number>();
      const perHouse = new Map<number, number>();
      for (const id of ids) {
        const c = contacts.get(id)!;
        perTarget.set(c.target, (perTarget.get(c.target) ?? 0) + 1);
        if (c.targetHouse) perHouse.set(c.targetHouse, (perHouse.get(c.targetHouse) ?? 0) + 1);
      }
      const top = <K,>(m: Map<K, number>) => [...m.entries()].sort((x, y) => y[1] - x[1])[0];
      const t = top(perTarget), h = top(perHouse);
      return {
        total,
        w: {
          start: days[a]!.date,
          end: days[b]!.date,
          peak: days[peak]!.date,
          peakScore: days[peak]!.score,
          contacts: [...ids].sort((x, y) => Number(exactIn(y)) - Number(exactIn(x)) || contacts.get(y)!.weight - contacts.get(x)!.weight),
          exactCount: [...ids].filter(exactIn).length,
          focus: { target: t && t[1] >= 2 ? t[0] : null, targetCount: t?.[1] ?? 0, house: h && h[1] >= 2 ? h[0] : null, houseCount: h?.[1] ?? 0 },
        } satisfies ConvergenceWindow,
      };
    });

  return windows
    .sort((x, y) => y.total - x.total)
    .slice(0, 6)
    .map((x) => x.w)
    .sort((x, y) => x.start.localeCompare(y.start));
}
