import "server-only";
/**
 * Birth-time rectification by life events. Each candidate time (a few minutes
 * apart, inside a window on the birth date) gets its own angles; each event is
 * then checked for contacts to those angles, the part of the chart that the
 * birth time changes:
 *
 *   - slow transits (Jupiter–Pluto, the Node) to the angles       orb 1°
 *   - solar-arc planets to the angles                              orb 1°
 *   - solar-arc angles (angle + arc) to the planets                orb 1°
 *   - progressed angles (RAMC + arc) to the planets                orb 1°
 *   - the progressed Moon to the angles                            orb 1°
 *   - primary directions: planets (with their latitude) to the four
 *     angles, direct and converse, under the pole of the birthplace
 *     (Placidus semi-arc), plus zodiacal squares to the angles; Naibod's
 *     key, 0°59′08″ of right ascension per year                     orb 1° (a year)
 *
 * Only conjunctions, oppositions and squares count. Each hit scores technique
 * weight × aspect weight × how relevant that angle is to the event (marriage →
 * Descendant, career → Midheaven …) × closeness (1 when exact, 0 at the edge
 * of orb). Each event counts its best hit plus a quarter of its second, so the
 * time that explains the most events most tightly ranks first. Provisional
 * weights; every hit is returned so the astrologer can judge.
 *
 * Following Carol A. Tebbs, The Complete Book of Chart Rectification (2008):
 *   - aspect hooks: planets in tight natal hard-aspect networks (≤2°, Moon
 *     and angles left out) are what an angle sets off at major events, so
 *     contacts to them count more
 *   - impact: painful, dramatic events (losses, accidents, divorce) show more
 *     clearly than pleasant milestones, so they weigh more
 *   - stacking: a right time shows an event in directions, progressions and
 *     transits together (Dobyns' rule); agreement across them earns a bonus
 *   - slow transits work before and after the exact date (weeks for Saturn,
 *     months for Pluto) and repeat through retrograde loops: each is checked
 *     over its window around the event, and repeat passes count more
 *   - the solar eclipse before an event, to an angle or the Moon (wide orb,
 *     low weight: a final check rather than a search tool)
 */
import type { BirthData, BodyId, ChartSettings, HouseSystem } from "@/lib/astro/types";
import { zonedToUtc } from "@/lib/timezones";
import { bodiesAt, equatorialAt, housesAt, housesFromRamc, jdToUtc, lunationsBetween, obliquityAt, siderealOffset } from "./swiss";

const DAY = 86_400_000;
const YEAR = 365.2422 * DAY;

export const EVENT_TYPES = {
  marriage: { label: "Marriage or Committed Partnership", angles: { asc: 1, mc: 0.6, dsc: 1.5, ic: 0.6 } },
  separation: { label: "Separation or Divorce", angles: { asc: 1, mc: 0.6, dsc: 1.5, ic: 0.6 } },
  child: { label: "Birth of a Child", angles: { asc: 1, mc: 0.8, dsc: 0.6, ic: 1.2 } },
  career: { label: "Career Change, Promotion or Graduation", angles: { asc: 0.6, mc: 1.5, dsc: 0.6, ic: 0.8 } },
  move: { label: "Move or Change of Home", angles: { asc: 0.8, mc: 0.6, dsc: 0.6, ic: 1.5 } },
  // 9th-house travel and a new start: the IC (home) still leads, with the Ascendant and Midheaven (the 9th sits just below it).
  "long-move": { label: "Long-Distance Move or Emigration", angles: { asc: 1, mc: 1, dsc: 0.6, ic: 1.4 } },
  parent: { label: "Death or Illness of a Parent", angles: { asc: 0.6, mc: 1.3, dsc: 0.6, ic: 1.3 } },
  health: { label: "Accident, Surgery or Illness", angles: { asc: 1.5, mc: 0.6, dsc: 0.8, ic: 0.6 } },
  // 7th house (lawsuits, open opponents) and 10th (authorities, judges).
  legal: { label: "Legal Issue, Lawsuit or Court Case", angles: { asc: 0.8, mc: 1.2, dsc: 1.5, ic: 0.6 } },
  // 12th-house confinement (it borders the Ascendant), the authorities (MC) and loss of home (IC).
  incarceration: { label: "Incarceration or Confinement", angles: { asc: 1.3, mc: 1.2, dsc: 0.8, ic: 1 } },
  // Tebbs' list of the most useful events: losses, crises and sudden reversals.
  loss: { label: "Death of a Child, Partner or Loved One", angles: { asc: 1.2, mc: 0.8, dsc: 1.2, ic: 1.3 } },
  "job-loss": { label: "Job Loss or Business Ending", angles: { asc: 0.8, mc: 1.5, dsc: 0.6, ic: 0.8 } },
  finance: { label: "Bankruptcy or Sudden Financial Loss or Gain", angles: { asc: 0.8, mc: 1.2, dsc: 0.8, ic: 1.2 } },
  crime: { label: "Victim of Crime, Abuse or Arrest", angles: { asc: 1.4, mc: 1, dsc: 1.2, ic: 0.8 } },
  honors: { label: "Honors, Award or Public Recognition", angles: { asc: 1, mc: 1.5, dsc: 0.6, ic: 0.6 } },
  retirement: { label: "Retirement", angles: { asc: 0.8, mc: 1.4, dsc: 0.6, ic: 1.2 } },
  other: { label: "Other Major Event", angles: { asc: 1, mc: 1, dsc: 1, ic: 1 } },
} as const;
export type EventType = keyof typeof EVENT_TYPES;

/** How hard an event hit (Tebbs: painful losses show far more clearly than pleasant milestones). */
export const IMPACT = {
  major: { label: "Major Loss or Crisis", w: 1.8 },
  significant: { label: "Significant", w: 1.3 },
  milestone: { label: "Milestone", w: 1 },
} as const;
export type Impact = keyof typeof IMPACT;
/** The usual impact of each kind of event, when the astrologer doesn't say. */
export const DEFAULT_IMPACT: Record<EventType, Impact> = {
  marriage: "milestone", separation: "major", child: "milestone", career: "milestone", move: "milestone", "long-move": "significant",
  parent: "major", health: "major", legal: "significant", incarceration: "major", loss: "major", "job-loss": "significant",
  finance: "significant", crime: "major", honors: "milestone", retirement: "milestone", other: "significant",
};

/**
 * Birth circumstances and the planets traditionally seen close to the
 * Ascendant (conjunct, opposite or square, within 5°) when they happen: the
 * Ascendant describes the birth itself. Provisional, like the other weights.
 */
export const CIRCUMSTANCES = {
  "c-section": { label: "C-Section", planets: ["mars", "pluto", "uranus"] },
  induced: { label: "Induced Labor", planets: ["mars", "uranus"] },
  instruments: { label: "Forceps or Vacuum", planets: ["mars", "pluto", "saturn"] },
  premature: { label: "Premature", planets: ["uranus", "mars"] },
  overdue: { label: "Overdue or Delayed", planets: ["saturn"] },
  long: { label: "Long or Difficult Labor", planets: ["saturn", "pluto"] },
  quick: { label: "Very Quick Birth", planets: ["uranus", "mars"] },
  anesthesia: { label: "Anesthesia, Epidural or Medication", planets: ["neptune"] },
  breech: { label: "Breech or Unusual Position", planets: ["uranus", "saturn"] },
  breathing: { label: "Cord Around the Neck or Breathing Difficulty", planets: ["saturn", "pluto"] },
  easy: { label: "Easy, Smooth Birth", planets: ["jupiter", "venus"] },
  large: { label: "Large Baby", planets: ["jupiter"] },
} as const satisfies Record<string, { label: string; planets: BodyId[] }>;
export type Circumstance = keyof typeof CIRCUMSTANCES;
const CIRC_ORB = 5;

type Angle = "asc" | "mc" | "dsc" | "ic";
// Hard aspects only: conjunctions (and oppositions, i.e. conjunctions to the opposite angle) and squares.
const ASPECTS = [
  { name: "conjunction", angle: 0, w: 1 },
  { name: "opposition", angle: 180, w: 1 },
  { name: "square", angle: 90, w: 0.6 },
] as const;
const NATAL: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"];
const SLOW: BodyId[] = ["jupiter", "saturn", "uranus", "neptune", "pluto", "node"];
const TECH = {
  transit: { label: "Transit", w: 1, orb: 1 },
  eclipse: { label: "Solar Eclipse", w: 0.5, orb: 3 },
  "sa-planet": { label: "Solar Arc", w: 1.2, orb: 1 },
  "sa-angle": { label: "Solar Arc Angle", w: 1.2, orb: 1 },
  "prog-angle": { label: "Progressed Angle", w: 1, orb: 1 },
  "prog-moon": { label: "Progressed Moon", w: 0.8, orb: 1 },
  primary: { label: "Primary Direction", w: 1.2, orb: 1 },
  "birth-asc": { label: "Birth Circumstance", w: 1, orb: CIRC_ORB },
} as const;
type Tech = keyof typeof TECH;
/** The three families of Dobyns' rule: a right time shows an event in each. */
const FAMILY: Record<Tech, "directions" | "progressions" | "transits" | null> = {
  transit: "transits", eclipse: "transits", "sa-planet": "directions", "sa-angle": "directions", primary: "directions",
  "prog-angle": "progressions", "prog-moon": "progressions", "birth-asc": null,
};
/** Extra weight on a contact to a planet in a natal aspect hook (scaled by how tight the hook is). */
const HOOK_BONUS = 0.5;
/** Each further family that confirms an event adds this share of its best hit. */
const STACK_BONUS = 0.3;
/** A slow transit that crosses the point more than once (a retrograde loop) counts this much more. */
const REPEAT_BONUS = 0.25;
/**
 * How long before and after the exact date a slow transit is felt (days),
 * after Tebbs' durations; retrograde loops stretch these further, which the
 * window search picks up as repeat passes.
 */
const TRANSIT_WINDOW: Partial<Record<BodyId, [number, number]>> = {
  jupiter: [10, 5], saturn: [14, 7], uranus: [30, 14], neptune: [60, 30], pluto: [120, 60], node: [15, 15],
};

const n180 = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;
const RAD = Math.PI / 180;
/** Naibod's key: the Sun's mean daily motion in right ascension, as degrees per year of life. */
export const NAIBOD = 0.985647;

/**
 * Primary-direction arcs from a point (right ascension, declination) to the
 * four angles, under the birthplace latitude. A positive arc is direct (the
 * point reaches the angle by the turning of the sky after birth), negative is
 * converse. Points that never rise or set at this latitude only reach the MC/IC.
 */
export function primaryArcs(ra: number, dec: number, ramc: number, lat: number): Record<Angle, number | null> {
  const x = Math.tan(dec * RAD) * Math.tan(lat * RAD);
  const ad = Math.abs(x) <= 1 ? Math.asin(x) / RAD : null; // ascensional difference
  return {
    mc: n180(ra - ramc),
    ic: n180(ra - ramc - 180),
    asc: ad === null ? null : n180(ra - ad - (ramc + 90)), // oblique ascension against the Ascendant's
    dsc: ad === null ? null : n180(ra + ad - (ramc - 90)), // oblique descension against the Descendant's
  };
}
/** Right ascension and declination of a point on the ecliptic (no latitude). */
function eclToEq(lon: number, eps: number) {
  const l = lon * RAD, e = eps * RAD;
  return { ra: ((Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l)) / RAD) + 360) % 360, dec: Math.asin(Math.sin(e) * Math.sin(l)) / RAD };
}

export interface RectifyEvent {
  date: string;
  type: EventType;
  note?: string;
  impact?: Impact;
}
export interface Hit {
  event: number; // index into events; -1 for a birth circumstance
  circumstance?: Circumstance;
  technique: Tech;
  from: string; // moving point, e.g. "Saturn", "Solar Arc MC"
  to: string; // natal point, e.g. "Ascendant", "Venus"
  aspect: string;
  orb: number;
  points: number;
  /** The natal planet is part of an aspect hook. */
  hook?: boolean;
  /** A slow transit's exact passes over the point in its window (2+ = retrograde loop). */
  passes?: number;
}

export interface AspectHook {
  planets: string[];
  aspects: { a: string; b: string; aspect: string; orb: number }[];
  /** Empty legs: for a T-square, the point opposite the apex; open points that complete a grand cross. */
  sensitive: { lon: number; label: string }[];
  /** The tightest orb in the network, degrees. */
  tightest: number;
}

/**
 * Contacts between a moving longitude and a fixed one: for angles, the
 * conjunction or opposition names the angle hit (an opposition to the
 * Ascendant is a conjunction to the Descendant).
 */
function contact(moving: number, fixed: number, orbMax: number) {
  let best: { aspect: (typeof ASPECTS)[number]; orb: number } | null = null;
  for (const a of ASPECTS) {
    const orb = Math.abs(Math.abs(n180(moving - fixed)) - a.angle);
    if (orb <= orbMax && (!best || orb < best.orb)) best = { aspect: a, orb };
  }
  return best;
}

/**
 * When each sign rises on the birth date (local time at the birthplace),
 * found every 2 minutes and refined to the minute. The first step of
 * rectification: the astrologer judges the rising sign from appearance and
 * manner, which narrows the search to roughly the two hours it rises.
 */
export function risingSpans(birth: BirthData, s: Pick<ChartSettings, "zodiac" | "houseSystem">) {
  const utcOf = (min: number) => zonedToUtc(`${birth.date}T${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}:00`, birth.tz || "UTC").toISOString();
  return spansOf((min) => Math.floor(housesAt(utcOf(min), birth.lat, birth.lon, s.houseSystem as HouseSystem, s.zodiac).asc / 30));
}

/** The Moon's sign through the birth date: one span, or two when it changes sign that day. */
export function moonSpans(birth: BirthData, s: Pick<ChartSettings, "zodiac">) {
  const utcOf = (min: number) => zonedToUtc(`${birth.date}T${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}:00`, birth.tz || "UTC").toISOString();
  return spansOf((min) => Math.floor(bodiesAt(utcOf(min), { zodiac: s.zodiac, bodies: ["moon"] }).moon!.lon / 30));
}

/** Spans of the day (local minutes) over which signAt stays the same, found every 2 minutes and refined to the minute. */
function spansOf(signAt: (min: number) => number) {
  const spans: { sign: number; from: string; to: string }[] = [];
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  let start = 0, cur = signAt(0), prev = 0;
  for (let m = 2; m <= 1440; m += 2) {
    const sg = m === 1440 ? -1 : signAt(m);
    if (sg !== cur) {
      // Refine the change to the minute.
      let change = m;
      if (m < 1440) for (let k = prev + 1; k < m; k++) if (signAt(k) !== cur) { change = k; break; }
      spans.push({ sign: cur, from: hhmm(start), to: hhmm(Math.min(1439, change - 1)) });
      start = change; cur = sg;
    }
    prev = m;
  }
  return spans;
}


const NAME = (b: BodyId) => (b === "node" ? "North Node" : b.charAt(0).toUpperCase() + b.slice(1));

/**
 * Aspect hooks (Tebbs): planets and the Node joined by conjunctions,
 * oppositions and squares of 2° or less, grouped into networks. The Moon and
 * angles are left out: they're what the birth time decides.
 */
export function aspectHooks(lons: Partial<Record<BodyId, number>>, maxOrb = 2): AspectHook[] {
  const ids = NATAL.filter((b) => b !== "moon" && lons[b] !== undefined);
  const edges: { a: BodyId; b: BodyId; aspect: string; orb: number }[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const c = contact(lons[ids[i]!]!, lons[ids[j]!]!, maxOrb);
      if (c) edges.push({ a: ids[i]!, b: ids[j]!, aspect: c.aspect.name, orb: Math.round(c.orb * 100) / 100 });
    }
  // Connected groups.
  const group = new Map<BodyId, number>();
  let next = 0;
  for (const e of edges) {
    const ga = group.get(e.a), gb = group.get(e.b);
    if (ga === undefined && gb === undefined) { group.set(e.a, next); group.set(e.b, next); next++; }
    else if (ga === undefined) group.set(e.a, gb!);
    else if (gb === undefined) group.set(e.b, ga);
    else if (ga !== gb) for (const [k, v] of group) if (v === gb) group.set(k, ga);
  }
  const hooks: AspectHook[] = [];
  for (const g of new Set(group.values())) {
    const members = ids.filter((b) => group.get(b) === g);
    const es = edges.filter((e) => group.get(e.a) === g);
    const sensitive: AspectHook["sensitive"] = [];
    // T-squares: an opposition with a planet square to both ends; the empty leg is opposite that apex.
    for (const o of es.filter((e) => e.aspect === "opposition"))
      for (const apex of members)
        if (apex !== o.a && apex !== o.b && es.some((e) => e.aspect === "square" && [e.a, e.b].includes(apex) && [e.a, e.b].includes(o.a)) && es.some((e) => e.aspect === "square" && [e.a, e.b].includes(apex) && [e.a, e.b].includes(o.b)))
          sensitive.push({ lon: (lons[apex]! + 180) % 360, label: `Empty leg of the T-square (opposite ${NAME(apex)})` });
    hooks.push({ planets: members.map(NAME), aspects: es.map((e) => ({ a: NAME(e.a), b: NAME(e.b), aspect: e.aspect, orb: e.orb })), sensitive, tightest: Math.min(...es.map((e) => e.orb)) });
  }
  return hooks.sort((x, y) => x.tightest - y.tightest);
}

/** How much a contact to a planet counts, for being in a hook: tighter hooks count more. */
function hookFactors(lons: Partial<Record<BodyId, number>>) {
  const f: Partial<Record<BodyId, number>> = {};
  const ids = NATAL.filter((b) => b !== "moon");
  for (const a of ids)
    for (const b of ids) {
      if (a === b || lons[a] === undefined || lons[b] === undefined) continue;
      const c = contact(lons[a]!, lons[b]!, 2);
      if (c) f[a] = Math.max(f[a] ?? 1, 1 + HOOK_BONUS * (1 - c.orb / 2));
    }
  return f;
}

/** A slow planet's positions across its window around an event, for finding exact passes. */
function transitSamples(date: string, b: BodyId, zodiac: ChartSettings["zodiac"]) {
  const [before, after] = TRANSIT_WINDOW[b] ?? [7, 7];
  const step = before > 60 ? 3 : before > 20 ? 2 : 1;
  const mid = Date.parse(`${date}T12:00:00Z`);
  const out: number[] = [];
  for (let d = -before; d <= after; d += step) out.push(bodiesAt(new Date(mid + d * DAY).toISOString(), { zodiac, bodies: [b] })[b]!.lon);
  return out;
}

/** The closest a sampled transit comes to a hard aspect with a point, and how many times it's exact. */
function windowContact(samples: number[], target: number, orbMax: number) {
  let best: { aspect: (typeof ASPECTS)[number]; orb: number; passes: number } | null = null;
  for (const a of ASPECTS) {
    let min = Infinity, passes = 0, prev: number | null = null;
    for (const lon of samples) {
      const d = n180(lon - target - a.angle);
      if (prev !== null && Math.sign(d) !== Math.sign(prev) && Math.abs(d - prev) < 10) { passes++; min = 0; }
      min = Math.min(min, Math.abs(d));
      prev = d;
    }
    if (min <= orbMax && (!best || min < best.orb)) best = { aspect: a, orb: min, passes };
  }
  return best;
}

/** The solar eclipse before an event (within a year): its degree, in the chart's zodiac. */
function eclipseBefore(date: string, zodiac: ChartSettings["zodiac"]) {
  const end = `${date}T12:00:00Z`;
  const start = new Date(Date.parse(end) - 366 * DAY).toISOString();
  const solar = lunationsBetween(start, end).filter((l) => l.eclipse?.includes("solar"));
  const last = solar.at(-1);
  if (!last) return null;
  const utc = jdToUtc(last.jd);
  return { lon: (((last.lon - siderealOffset(utc, zodiac)) % 360) + 360) % 360, date: utc.slice(0, 10), kind: last.eclipse! };
}

/**
 * Hour by hour through the birth date: where the Moon is, its dwad
 * (dwadasamsa, the 2½° twelfth-part of its sign) and the natal planets it
 * aspects within 1°. Tebbs starts every search with this table.
 */
export function moonTable(birth: BirthData, s: Pick<ChartSettings, "zodiac">) {
  const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const ALL = [
    { name: "conjunction", angle: 0 }, { name: "sextile", angle: 60 }, { name: "square", angle: 90 },
    { name: "trine", angle: 120 }, { name: "inconjunct", angle: 150 }, { name: "opposition", angle: 180 },
  ];
  const rows = [];
  for (let h = 0; h < 24; h++) {
    const time = `${String(h).padStart(2, "0")}:00`;
    const utc = zonedToUtc(`${birth.date}T${time}:00`, birth.tz || "UTC").toISOString();
    const p = bodiesAt(utc, { zodiac: s.zodiac, bodies: NATAL });
    const moon = p.moon!.lon;
    const sign = Math.floor(moon / 30);
    const dwad = (sign + Math.floor((moon % 30) / 2.5)) % 12;
    const aspects: { planet: string; aspect: string; orb: number }[] = [];
    for (const b of NATAL) {
      if (b === "moon") continue;
      for (const a of ALL) {
        const orb = Math.abs(Math.abs(n180(moon - p[b]!.lon)) - a.angle);
        if (orb <= 1) aspects.push({ planet: NAME(b), aspect: a.name, orb: Math.round(orb * 100) / 100 });
      }
    }
    rows.push({ time, lon: Math.round(moon * 100) / 100, sign: SIGNS[sign]!, dwad: SIGNS[dwad]!, aspects });
  }
  return rows;
}

export function rectify(birth: BirthData, events: RectifyEvent[], from: string, to: string, stepMin: number, s: Pick<ChartSettings, "zodiac" | "houseSystem">, ascSigns?: number[], moonSigns?: number[], circumstances: Circumstance[] = []) {
  const [fh, fm] = from.split(":").map(Number), [th, tm] = to.split(":").map(Number);
  const start = fh! * 60 + fm!, end = th! * 60 + tm!;
  // The same for every candidate: each slow planet across its window around each event, and the eclipse before it.
  const transits = events.map((e) => Object.fromEntries(SLOW.map((b) => [b, transitSamples(e.date, b, s.zodiac)])) as Record<BodyId, number[]>);
  const eclipses = events.map((e) => eclipseBefore(e.date, s.zodiac));
  const angleNames: Record<Angle, string> = { asc: "Ascendant", mc: "Midheaven", dsc: "Descendant", ic: "IC" };
  // Aspect hooks from the middle of the window: the planets barely move in a day (the Moon is left out).
  const midMin = Math.round((start + end) / 2);
  const midUtc = zonedToUtc(`${birth.date}T${String(Math.floor(midMin / 60)).padStart(2, "0")}:${String(midMin % 60).padStart(2, "0")}:00`, birth.tz || "UTC").toISOString();
  const midLons = Object.fromEntries(Object.entries(bodiesAt(midUtc, { zodiac: s.zodiac, bodies: NATAL })).map(([k, v]) => [k, v!.lon])) as Partial<Record<BodyId, number>>;
  const hooks = aspectHooks(midLons);
  const hookF = hookFactors(midLons);

  const candidates: { time: string; utc: string; asc: number; mc: number; score: number; hits: Hit[] }[] = [];
  for (let min = start; min <= end; min += stepMin) {
    const time = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
    const utc = zonedToUtc(`${birth.date}T${time}:00`, birth.tz || "UTC").toISOString();
    const h = housesAt(utc, birth.lat, birth.lon, s.houseSystem as HouseSystem, s.zodiac);
    // Only times when the chosen rising sign(s) rise.
    if (ascSigns?.length && !ascSigns.includes(Math.floor(h.asc / 30))) continue;
    const natal = bodiesAt(utc, { zodiac: s.zodiac, bodies: NATAL });
    // Only times when the Moon is in the chosen sign(s).
    if (moonSigns?.length && !moonSigns.includes(Math.floor(natal.moon!.lon / 30))) continue;
    const eps = obliquityAt(utc);
    // For primary directions: true equatorial positions, and tropical longitudes for the square points.
    const eq = Object.fromEntries(equatorialAt(utc, NATAL).bodies.map((x) => [x.id, x]));
    const trop = s.zodiac === "tropical" ? natal : bodiesAt(utc, { zodiac: "tropical", bodies: NATAL });
    const angles: Record<Angle, number> = { asc: h.asc, mc: h.mc, dsc: (h.asc + 180) % 360, ic: (h.mc + 180) % 360 };
    const hits: Hit[] = [];
    events.forEach((ev, i) => {
      const rel = EVENT_TYPES[ev.type].angles;
      // `body`: the natal planet involved (hooks count more); `passes`: exact passes of a slow transit in its window.
      const add = (technique: Tech, fromName: string, toName: string, aspect: { name: string; w: number }, orb: number, angle: Angle | null, body?: BodyId, passes?: number) => {
        const t = TECH[technique];
        const hf = body ? (hookF[body] ?? 1) : 1;
        const rf = passes && passes >= 2 ? 1 + REPEAT_BONUS : 1;
        hits.push({
          event: i, technique, from: fromName, to: toName, aspect: aspect.name, orb: Math.round(orb * 1000) / 1000,
          points: Math.round(t.w * aspect.w * (angle ? rel[angle] : 1) * (1 - orb / t.orb) * hf * rf * 100) / 100,
          ...(hf > 1 ? { hook: true } : {}), ...(passes ? { passes } : {}),
        });
      };
      // Which angle an aspect to the ASC or MC point actually touches.
      const angleOf = (base: "asc" | "mc", aspectName: string): Angle => (aspectName === "opposition" ? (base === "asc" ? "dsc" : "ic") : base);
      const toAngles = (technique: Tech, fromName: string, lon: number, body?: BodyId) => {
        for (const base of ["asc", "mc"] as const) {
          const c = contact(lon, angles[base], TECH[technique].orb);
          if (c) {
            const ang = angleOf(base, c.aspect.name);
            add(technique, fromName, angleNames[ang], { name: c.aspect.name === "opposition" ? "conjunction" : c.aspect.name, w: c.aspect.w }, c.orb, ang, body);
          }
        }
      };
      const ageMs = Date.parse(`${ev.date}T12:00:00Z`) - Date.parse(utc);
      if (ageMs <= 0) return;
      // Slow transits to the angles, anywhere in their window around the event.
      for (const b of SLOW)
        for (const base of ["asc", "mc"] as const) {
          const c = windowContact(transits[i]![b]!, angles[base], TECH.transit.orb);
          if (c) {
            const ang = angleOf(base, c.aspect.name);
            add("transit", `Transiting ${NAME(b)}`, angleNames[ang], { name: c.aspect.name === "opposition" ? "conjunction" : c.aspect.name, w: c.aspect.w }, c.orb, ang, undefined, c.passes);
          }
        }
      // The solar eclipse before the event, to the angles and the Moon.
      const ecl = eclipses[i];
      if (ecl) {
        toAngles("eclipse", `Solar Eclipse of ${ecl.date}`, ecl.lon);
        const m = contact(ecl.lon, natal.moon!.lon, TECH.eclipse.orb);
        if (m) add("eclipse", `Solar Eclipse of ${ecl.date}`, "Moon", { name: m.aspect.name, w: m.aspect.w }, m.orb, null);
      }
      // Secondary progressions: one day after birth for each year of life.
      const prog = bodiesAt(new Date(Date.parse(utc) + (ageMs / YEAR) * DAY).toISOString(), { zodiac: s.zodiac, bodies: ["sun", "moon"] });
      const arc = ((prog.sun!.lon - natal.sun!.lon) % 360 + 360) % 360;
      toAngles("prog-moon", "Progressed Moon", prog.moon!.lon);
      // Solar-arc planets to the angles; solar-arc and progressed angles to the planets.
      for (const b of NATAL) toAngles("sa-planet", `Solar Arc ${NAME(b)}`, (natal[b]!.lon + arc) % 360, b);
      const pr = housesFromRamc((h.ramc + arc) % 360, birth.lat, eps, s.houseSystem as HouseSystem);
      const moving: [Tech, string, number, Angle][] = [
        ["sa-angle", "Solar Arc Ascendant", (h.asc + arc) % 360, "asc"],
        ["sa-angle", "Solar Arc Midheaven", (h.mc + arc) % 360, "mc"],
        ["prog-angle", "Progressed Ascendant", pr.asc, "asc"],
        ["prog-angle", "Progressed Midheaven", pr.mc, "mc"],
      ];
      // Primary directions.
      const need = (ageMs / YEAR) * NAIBOD;
      const prim = (name: string, ra: number, dec: number, aspect: (typeof ASPECTS)[number], only?: Angle[], body?: BodyId) => {
        const arcs = primaryArcs(ra, dec, h.ramc, birth.lat);
        for (const ang of (only ?? (["asc", "mc", "dsc", "ic"] as Angle[]))) {
          const a = arcs[ang];
          if (a === null) continue;
          const orb = Math.abs(Math.abs(a) - need);
          if (orb <= TECH.primary.orb) add("primary", `${a < 0 ? "Converse " : ""}Primary Direction of ${name}`, angleNames[ang], { name: aspect.name, w: aspect.w }, orb, ang, body);
        }
      };
      for (const b of NATAL) {
        const p = eq[b];
        if (p) prim(NAME(b), p.ra, p.dec, ASPECTS[0], undefined, b);
        // Zodiacal squares: the points 90° either side, to the Ascendant and Midheaven (the opposite angles repeat them).
        for (const d of [90, 270]) {
          const q = eclToEq((trop[b]!.lon + d) % 360, eps);
          prim(NAME(b), q.ra, q.dec, ASPECTS[2], ["asc", "mc"], b);
        }
      }
      for (const [technique, fromName, lon, ang] of moving) {
        for (const b of NATAL) {
          const c = contact(lon, natal[b]!.lon, TECH[technique].orb);
          if (c) {
            // An opposition from a directed angle is a conjunction from the opposite angle.
            const angle: Angle = c.aspect.name === "opposition" ? (ang === "asc" ? "dsc" : "ic") : ang;
            add(technique, c.aspect.name === "opposition" ? fromName.replace("Ascendant", "Descendant").replace("Midheaven", "IC") : fromName, NAME(b), { name: c.aspect.name === "opposition" ? "conjunction" : c.aspect.name, w: c.aspect.w }, c.orb, angle, b);
          }
        }
      }
    });
    // Birth circumstances: the matching planets close to this candidate's Ascendant.
    for (const c of circumstances) {
      for (const b of CIRCUMSTANCES[c].planets) {
        const k = contact(natal[b]!.lon, h.asc, CIRC_ORB);
        if (k) hits.push({ event: -1, circumstance: c, technique: "birth-asc", from: `Natal ${NAME(b)}`, to: "Ascendant", aspect: k.aspect.name, orb: k.orb, points: Math.round(TECH["birth-asc"].w * k.aspect.w * (1 - k.orb / CIRC_ORB) * 100) / 100 });
      }
    }
    // Each event scores its best hit plus a quarter of its second, plus a bonus for each further family
    // (directions, progressions, transits) that also shows it, all times its impact: explaining many hard
    // events tightly, in several techniques at once, beats many loose contacts. Each birth circumstance scores its best hit.
    let score = 0;
    events.forEach((ev, i) => {
      const own = hits.filter((x) => x.event === i).sort((a, b) => b.points - a.points);
      const best = own[0]?.points ?? 0;
      const families = new Set(own.filter((x) => x.points >= 0.2 * best && x.points > 0).map((x) => FAMILY[x.technique]).filter(Boolean)).size;
      score += IMPACT[ev.impact ?? DEFAULT_IMPACT[ev.type]].w * (best + 0.25 * (own[1]?.points ?? 0) + STACK_BONUS * best * Math.max(0, families - 1));
    });
    for (const c of circumstances) score += Math.max(0, ...hits.filter((x) => x.circumstance === c).map((x) => x.points));
    candidates.push({ time, utc, asc: h.asc, mc: h.mc, score: Math.round(score * 100) / 100, hits });
  }
  const ranked = [...candidates].sort((a, b) => b.score - a.score);
  // Keep the best few with their hits, and every candidate's score for the graph.
  const top: typeof candidates = [];
  for (const c of ranked) {
    if (top.length >= 6) break;
    // Skip near-duplicates of a better candidate (within 6 minutes).
    const m = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3));
    if (top.some((t) => Math.abs(m(t.time) - m(c.time)) < 6)) continue;
    top.push(c);
  }
  // Times about 6 or 12 hours apart that put the same degrees on different angles (Tebbs): the angles are
  // probably right, but which is the Midheaven and which the Ascendant still needs testing.
  const mm = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3));
  const notes: string[] = [];
  for (let i = 0; i < top.length; i++)
    for (let j = i + 1; j < top.length; j++) {
      const a = top[i]!, b = top[j]!;
      const gap = Math.abs(mm(a.time) - mm(b.time));
      // Same axis: within 4° either way round.
      const near = (x: number, y: number) => { const d = Math.abs(n180(x - y)); return d < 4 || d > 176; };
      if (gap >= 300 && gap <= 420 && (near(a.mc, b.asc) || near(a.asc, b.mc))) notes.push(`${a.time} and ${b.time} are about 6 hours apart with the same degrees on swapped angles (one’s Midheaven axis is the other’s Ascendant axis). The angles may be right; test which is the Midheaven.`);
      else if (gap >= 660 && gap <= 780 && near(a.asc, b.asc) && near(a.mc, b.mc)) notes.push(`${a.time} and ${b.time} are about 12 hours apart with the Ascendant and Descendant (and Midheaven and IC) swapped. The axes may be right; test which way round.`);
    }
  return {
    hooks,
    notes,
    curve: candidates.map((c) => ({ time: c.time, score: c.score, asc: Math.round(c.asc * 100) / 100, mc: Math.round(c.mc * 100) / 100 })),
    top,
    weights: { impact: IMPACT, defaultImpact: DEFAULT_IMPACT, hookBonus: HOOK_BONUS, stackBonus: STACK_BONUS, repeatBonus: REPEAT_BONUS, transitWindows: TRANSIT_WINDOW, circumstances: CIRCUMSTANCES, circumstanceOrb: CIRC_ORB, techniques: TECH, aspects: ASPECTS.map((a) => ({ name: a.name, w: a.w })), events: EVENT_TYPES },
  };
}
