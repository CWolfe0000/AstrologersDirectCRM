import "server-only";
import type { BodyId, Chart, PointId } from "@/lib/astro/types";
import { delta, norm } from "@/lib/astro/spherical";
import { POINT_NAMES, SIGNS, houseOf, ordinal, signIndex, type AspectName } from "@/lib/astro/zodiac";
import { ARRIVES, FUNCTION, HOUSE_TRANSIT, PROGRESSED_MOON_HOUSE, PROGRESSED_OTHER, PROGRESSED_VENUS, TRANSIT_LINE } from "@/lib/reading/forecast";
import { bodiesAt } from "./swiss";
import { MOVERS } from "./timing";

/**
 * The timeline: what transits, secondary progressions and solar arc directions are doing to the
 * relationship points of one chart, month by month, and where the three agree.
 *
 * The three techniques are standard. Transits use the same slow planets and orbs as the calendar
 * (`MOVERS` in timing.ts: Jupiter 5°, Saturn 3.5°, Uranus 3°, Neptune and Pluto 2°), here with the
 * sextile and trine for every planet. Progressions are a day for a year, within 1°. Solar arcs
 * move every natal point forward by the progressed Sun's distance from the natal Sun, within 1°.
 *
 * The romance weighting (0, 1 or 2 for each event, in `romanceOf`) and the convergence rule (a
 * romance window is a run of months in which romance factors from at least two of the three
 * techniques are active at once) are Datebyfate's own method. They are not taken from a book,
 * and nothing here predicts an event.
 */

export type Technique = "transit" | "progression" | "solar-arc";
export type EventAspect = AspectName | "house" | "ingress" | "station";

export interface TimelineEvent {
  id: string;
  technique: Technique;
  /** "Jupiter Trine Your Venus" */
  title: string;
  from: Date;
  to: Date;
  /** The moments it is exact. Empty for a passage through a house, and for a contact that turns back before it is exact. */
  exact: Date[];
  mover: string;
  target: string;
  aspect: EventAspect;
  /** 0 = not a romance factor, 1 = supports, 2 = strongly supports. */
  romance: 0 | 1 | 2;
  body: string;
  /** A solar arc trine or sextile: counted, but quieter than the conjunction, square and opposition. */
  weak: boolean;
  /** Already under way when the range starts, or still going when it ends. */
  openStart: boolean;
  openEnd: boolean;
}

export interface RomanceWindow {
  from: Date;
  to: Date;
  /** 2 = two techniques agree; 3 = all three do, in at least one month of the window. */
  strength: 2 | 3;
  techniques: Technique[];
  factors: TimelineEvent[];
  summary: string;
}

export interface TimelineMonth {
  /** "2027-03" */
  key: string;
  start: Date;
  end: Date;
  transit: TimelineEvent[];
  progression: TimelineEvent[];
  solarArc: TimelineEvent[];
  /** The techniques with a romance factor active this month. */
  techniques: Technique[];
  /** 0 = no window this month. */
  strength: 0 | 2 | 3;
}

export interface Timeline {
  from: Date;
  to: Date;
  months: TimelineMonth[];
  events: TimelineEvent[];
  windows: RomanceWindow[];
  notes: string[];
}

export const TECHNIQUE_NAMES: Record<Technique, string> = { transit: "Transits", progression: "Progressions", "solar-arc": "Solar Arcs" };
const TECHNIQUES: Technique[] = ["transit", "progression", "solar-arc"];

const DAY = 86_400_000;
const YEAR_DAYS = 365.2422;
/** Orb for progressed and solar arc contacts. */
export const DIRECTED_ORB = 1;
/** Sampling: slow planets every 3 days, progressed positions every 12 (the progressed Moon moves 0.4° in that time). */
const TRANSIT_STEP = 3 * DAY;
const DIRECTED_STEP = 12 * DAY;

const ANGLES: [number, AspectName][] = [[0, "conjunction"], [60, "sextile"], [90, "square"], [120, "trine"], [180, "opposition"]];
const ASPECT_WORD: Record<AspectName, string> = { conjunction: "Conjunct", opposition: "Opposite", square: "Square", trine: "Trine", sextile: "Sextile" };
const HOW: Record<AspectName, string> = {
  conjunction: ARRIVES[0]!,
  square: ARRIVES[90]!,
  trine: ARRIVES[120]!,
  opposition: ARRIVES[180]!,
  sextile: "By sextile: an opening that waits for you to take it up.",
};

/** The instant in the ephemeris that stands for a moment of life: a day after birth for each year lived. */
export const progressedMs = (birthUtcMs: number, atMs: number) => birthUtcMs + (atMs - birthUtcMs) / YEAR_DAYS;

/** Secondary progressed positions at a moment of life. */
export function progressedAt(birthUtcMs: number, atMs: number, ids: BodyId[] = ["sun", "moon", "venus", "mars"]) {
  return bodiesAt(progressedMs(birthUtcMs, atMs), ids);
}

const SOLAR_ARC_BODIES: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

/**
 * Solar arc directions at a moment of life. The arc is the progressed Sun's longitude less the
 * natal Sun's; every natal planet, the Ascendant and the Midheaven move forward by it.
 */
export function solarArcAt(chart: Chart, birthUtcMs: number, atMs: number) {
  const arc = norm(progressedAt(birthUtcMs, atMs, ["sun"]).sun.lon - chart.bodies.sun.lon);
  return { arc, points: directed(chart, arc) };
}

function directed(chart: Chart, arc: number) {
  const points: Partial<Record<PointId, number>> = {};
  for (const id of SOLAR_ARC_BODIES) points[id] = norm(chart.bodies[id].lon + arc);
  if (chart.houses) {
    points.asc = norm(chart.houses.asc + arc);
    points.dsc = norm(chart.houses.asc + 180 + arc);
    points.mc = norm(chart.houses.mc + arc);
  }
  return points;
}

/** A natal point that the techniques are read against. The Ascendant stands for the whole Ascendant–Descendant axis. */
interface NatalTarget {
  id: PointId;
  lon: number;
  /** The love houses this planet rules (5, 7), by traditional rulership. */
  rules: number[];
}

/** The traditional rulers of the 5th and 7th houses: planet → the houses it rules. */
export function loveRulers(chart: Chart): Partial<Record<BodyId, number[]>> {
  const out: Partial<Record<BodyId, number[]>> = {};
  if (!chart.houses) return out;
  for (const house of [5, 7]) {
    const ruler = SIGNS[signIndex(chart.houses.cusps[house - 1]!)]!.ruler;
    (out[ruler] ??= []).push(house);
  }
  return out;
}

interface Run {
  from: number;
  to: number;
  exact: number[];
  openStart: boolean;
  openEnd: boolean;
}

/**
 * The spans in which a moving longitude is within `orb` of a fixed point, from samples at times `t`.
 * The ends of a span and the exact moments are found by linear interpolation between samples.
 */
function runsNear(t: number[], lon: number[], point: number, orb: number): Run[] {
  const out: Run[] = [];
  let run: Run | null = null;
  let prev = 0;
  for (let i = 0; i < t.length; i++) {
    const s = delta(point, lon[i]!);
    const inside = Math.abs(s) <= orb;
    if (inside && !run) {
      let from = t[i]!;
      if (i > 0 && Math.abs(prev) < 90) {
        const edge = Math.sign(prev) * orb;
        from = t[i - 1]! + clamp01((prev - edge) / (prev - s)) * (t[i]! - t[i - 1]!);
      }
      run = { from, to: t[i]!, exact: [], openStart: i === 0, openEnd: false };
    }
    if (run && i > 0 && Math.abs(prev) <= orb) {
      if (prev === 0) run.exact.push(t[i - 1]!);
      else if (inside && prev * s < 0) run.exact.push(t[i - 1]! + (prev / (prev - s)) * (t[i]! - t[i - 1]!));
    }
    if (run && !inside) {
      const edge = Math.sign(s) * orb;
      run.to = Math.abs(s) < 90 ? t[i - 1]! + clamp01((prev - edge) / (prev - s)) * (t[i]! - t[i - 1]!) : t[i - 1]!;
      out.push(run);
      run = null;
    } else if (run) run.to = t[i]!;
    prev = s;
  }
  if (run) out.push({ ...run, openEnd: true });
  return out;
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));

/** The spans a moving longitude spends in one natal house. */
function runsInHouse(t: number[], lon: number[], cusps: number[], house: number): Run[] {
  const edges = [cusps[house - 1]!, cusps[house % 12]!];
  const crossing = (i: number) => {
    // Between samples i-1 and i the planet crossed one of the two cusps of the house.
    for (const cusp of edges) {
      const a = delta(cusp, lon[i - 1]!), b = delta(cusp, lon[i]!);
      if (Math.abs(a) < 30 && Math.abs(b) < 30 && a !== b && a * b <= 0) return t[i - 1]! + clamp01(a / (a - b)) * (t[i]! - t[i - 1]!);
    }
    return t[i]!;
  };
  const out: Run[] = [];
  let run: Run | null = null;
  for (let i = 0; i < t.length; i++) {
    const inside = houseOf(lon[i]!, cusps) === house;
    if (inside && !run) run = { from: i === 0 ? t[0]! : crossing(i), to: t[i]!, exact: [], openStart: i === 0, openEnd: false };
    else if (!inside && run) {
      out.push({ ...run, to: crossing(i) });
      run = null;
    } else if (run) run.to = t[i]!;
  }
  if (run) out.push({ ...run, openEnd: true });
  return out;
}

/**
 * How one contact is named. An aspect to the Ascendant is also an aspect to the Descendant, so each
 * is named once, by the closer end of the axis: opposite the Ascendant is conjunct the Descendant,
 * and sextile the Ascendant is trine the Descendant.
 */
function named(mover: PointId, target: PointId, aspect: AspectName): { mover: PointId; target: PointId; aspect: AspectName } {
  const flip = aspect === "opposition" ? "conjunction" : aspect === "sextile" ? "trine" : null;
  if (target === "asc" && flip) return { mover, target: "dsc", aspect: flip };
  if (mover === "asc" && flip) return { mover: "dsc", target, aspect: flip };
  return { mover, target, aspect };
}

const isAxis = (id: string) => id === "asc" || id === "dsc";
const SOFT = new Set<EventAspect>(["conjunction", "trine", "sextile"]);
const MAIN = new Set<EventAspect>(["conjunction", "opposition", "square"]);

/**
 * Datebyfate's own romance weighting. 2 = strongly supports, 1 = supports, 0 = shown on the
 * timeline but not counted toward a romance window. `mover` and `target` are as named by `named`.
 *
 * Strongly supports (2):
 *  - transiting Jupiter conjunct, trine or sextile natal Venus, either end of the Ascendant–Descendant
 *    axis, or the ruler of the 5th or 7th; Jupiter in the 5th or 7th house
 *  - progressed Venus conjunct, trine or sextile natal Sun, Mars, Ascendant or Descendant; progressed
 *    Sun or Mars conjunct, trine or sextile natal Venus; progressed Moon conjunct natal Venus or in
 *    the 5th or 7th house
 *  - solar arc Venus conjunct, opposite or square natal Sun, Moon, Mars, Ascendant or Descendant;
 *    solar arc Ascendant, Descendant, Sun, Moon, Jupiter or 7th ruler conjunct, opposite or square
 *    natal Venus (the same pairs by trine or sextile count 1)
 * Supports (1):
 *  - transiting Uranus in any aspect to Venus or the axis
 *  - transiting Neptune or Pluto conjunct, trine or sextile Venus
 *  - transiting Saturn conjunct, trine or sextile Venus or the Descendant; Saturn in the 7th house
 *  - any other flowing contact to natal Venus, Mars or Moon. Flowing means a trine or sextile, or a
 *    conjunction when the moving planet is Venus or Jupiter.
 * Everything else is 0, including the hard contacts of Saturn, Neptune and Pluto to Venus or the Moon.
 */
export function romanceOf(technique: Technique, mover: string, target: string, aspect: EventAspect, rules: { mover?: number[]; target?: number[] } = {}): 0 | 1 | 2 {
  if (aspect === "ingress" || aspect === "station") return 0;
  if (aspect === "house") {
    if (mover === "jupiter" || mover === "moon") return 2;
    return mover === "saturn" && target === "house-7" ? 1 : 0;
  }
  const soft = SOFT.has(aspect);
  const axis = isAxis(target);
  if (technique === "transit") {
    if (mover === "jupiter" && ((target === "venus" && soft) || (axis && aspect !== "square") || (rules.target?.length && soft))) return 2;
    if (mover === "uranus" && (target === "venus" || axis)) return 1;
    if ((mover === "neptune" || mover === "pluto") && target === "venus" && soft) return 1;
    // Conjunct, trine or sextile the Descendant: trine the Ascendant is sextile the Descendant.
    if (mover === "saturn" && ((target === "venus" && soft) || target === "dsc" || (target === "asc" && aspect === "trine"))) return 1;
  } else if (technique === "progression") {
    if (mover === "venus" && (target === "sun" || target === "mars") && soft) return 2;
    if (mover === "venus" && axis && aspect !== "square") return 2;
    if ((mover === "sun" || mover === "mars") && target === "venus" && soft) return 2;
    if (mover === "moon" && target === "venus" && aspect === "conjunction") return 2;
  } else {
    const pair = (mover === "venus" && (["sun", "moon", "mars"].includes(target) || axis)) || (target === "venus" && (["asc", "dsc", "sun", "moon", "jupiter"].includes(mover) || !!rules.mover?.includes(7)));
    if (pair) return MAIN.has(aspect) ? 2 : 1;
  }
  const flowing = aspect === "trine" || aspect === "sextile" || (aspect === "conjunction" && (mover === "venus" || mover === "jupiter"));
  return flowing && ["venus", "mars", "moon"].includes(target) ? 1 : 0;
}

/* ---------- Wording. Our own, in the manner of lib/reading/forecast.ts. ---------- */

const HOUSE_NAME: Record<number, string> = { 5: "5th house of romance", 7: "7th house of partnership" };
const rulerNote = (id: string, rules: number[] | undefined) =>
  !rules?.length ? "" : ` ${POINT_NAMES[id as PointId]} rules your ${rules.length === 2 ? "5th and 7th houses, of romance and partnership" : HOUSE_NAME[rules[0]!]}.`;

/** A slow planet on the ruler of the 5th house only (forecast.ts has the line for the ruler of the 7th). */
const RULER_5: Record<string, string> = {
  jupiter: "An opening comes through play, dating and the things you do for pleasure.",
  saturn: "Romance and pleasure ask to be taken seriously, and to be given proper time.",
  uranus: "What you find fun, and who you find attractive, is changing.",
  neptune: "Romance turns dreamy, and it is easy to see more than is there.",
  pluto: "Desire and romance go deeper, and bring older feelings up with them.",
};

/** Progressed contacts that forecast.ts has no line for. Keys are mover-target; "axis" is the Ascendant or Descendant. */
const PROGRESSED_LINE: Record<string, string> = {
  "sun-sun": "Your evolving identity comes back into step with the person you started as. What you want from a relationship is easier to name.",
  "sun-mars": "Your evolving identity meets your Mars. You are readier to go after what you want and to say so. In love that means making the first move sooner than waiting to be chosen.",
  "sun-axis": "Your evolving identity reaches your partnership axis. Who you are becoming and who you stand beside come into the same frame, and relationships take more of your attention.",
  "mars-sun": "Your evolving courage meets your Sun. Energy and nerve are up, and so is impatience. Put the drive into what you want, and into the person you want.",
  "mars-mars": "Your evolving courage returns to its own starting note. Desire is plain and direct, and what you go after now you go after wholeheartedly.",
  "mars-axis": "Your evolving courage reaches your partnership axis. You bring more heat to how you meet people: more initiative, and more friction where something has gone unsaid.",
  "moon-venus": "For a couple of months your heart turns toward your Venus. Affection, pleasure and the wish for company are close to the surface, and warmth is easy to give and to take in.",
  "moon-mars": "For a couple of months your heart turns toward your Mars. Feelings run quick and warm, and desire and irritation are both near the surface.",
  "moon-sun": "For a couple of months your feelings and your sense of direction line up. It is easier to know what you want and to let it show.",
  "moon-axis": "For a couple of months your heart turns toward your partnership axis. You notice other people more and want closeness, and time with someone matters more than time alone.",
};

/** What a directed point carries with it. */
const BRINGS: Record<string, string> = {
  sun: "your sense of who you are, and the wish to be seen",
  moon: "your feelings and what you need to feel at home",
  mercury: "how you think and talk",
  venus: "affection, attraction and the wish for partnership",
  mars: "desire, initiative and nerve",
  jupiter: "confidence and the appetite for more",
  saturn: "seriousness, commitment and limits",
  uranus: "the need for freedom and change",
  neptune: "longing and imagination",
  pluto: "intensity and the need for depth",
  asc: "the way you meet the world",
  dsc: "the kind of partner you look for",
  mc: "your public direction",
};
const RECEIVES: Record<string, string> = {
  sun: FUNCTION.sun!,
  moon: FUNCTION.moon!,
  venus: FUNCTION.venus!,
  mars: FUNCTION.mars!,
  asc: "the way you meet the world",
  dsc: "who you choose as a partner",
};

const PROGRESSED_NAME: Record<string, string> = { venus: "way of relating", mars: "courage and desire" };

function transitBody(mover: string, target: string, aspect: AspectName, rules: number[] | undefined) {
  const lines = TRANSIT_LINE[mover]!;
  const line = lines[isAxis(target) ? "axis" : target] ?? (rules?.includes(7) ? lines.ruler! : RULER_5[mover]!);
  return `${line} ${HOW[aspect]}${rulerNote(target, rules)}`;
}

function progressedBody(mover: string, target: string, aspect: AspectName) {
  const key = isAxis(target) ? "axis" : target;
  const line = (mover === "venus" ? PROGRESSED_VENUS[key === "axis" ? "asc" : key] : PROGRESSED_OTHER[`${mover}-${key}`]?.body) ?? PROGRESSED_LINE[`${mover}-${key}`]!;
  return `${line} ${HOW[aspect]}`;
}

function solarArcBody(mover: string, target: string, aspect: AspectName, rules: number[] | undefined, weak: boolean) {
  return `Your directed ${POINT_NAMES[mover as PointId]} reaches your natal ${POINT_NAMES[target as PointId]}. This brings ${BRINGS[mover]} into contact with ${RECEIVES[target]}. ${HOW[aspect]}${weak ? " By solar arc the trine and sextile are quieter than the conjunction, square and opposition." : ""}${rulerNote(mover, rules)}`;
}

const TECHNIQUE_PREFIX: Record<Technique, string> = { transit: "", progression: "Progressed ", "solar-arc": "Solar Arc " };

/* ---------- The engine ---------- */

const monthStart = (d: Date, add = 0) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + add, 1);
const grid = (from: number, to: number, step: number) => {
  const t: number[] = [];
  for (let ms = from; ms < to; ms += step) t.push(ms);
  t.push(to);
  return t;
};

/**
 * Transits, progressions and solar arcs to the relationship points of one chart over a run of
 * months starting with the month of `opts.from`, and the romance windows where they converge.
 * `birthUtcMs` is the birth instant (for a chart without a birth time, the local noon it was cast for).
 */
export function timelineFor(chart: Chart, birthUtcMs: number, opts: { from: Date; months: number }): Timeline {
  const start = monthStart(opts.from);
  const end = monthStart(opts.from, opts.months);
  const timed = !!chart.houses;
  const notes: string[] = [];
  if (!timed) notes.push("Without a birth time this timeline leaves out the Ascendant and Descendant, the houses and their rulers, and every contact that involves the Moon. It reads the Sun, Venus and Mars only.");

  const rulers = loveRulers(chart);
  const targets: NatalTarget[] = (timed ? (["sun", "moon", "venus", "mars"] as const) : (["sun", "venus", "mars"] as const)).map((id) => ({ id, lon: chart.bodies[id].lon, rules: rulers[id] ?? [] }));
  if (chart.houses) {
    targets.push({ id: "asc", lon: chart.houses.asc, rules: [] });
    for (const id of Object.keys(rulers) as BodyId[]) if (!targets.some((t) => t.id === id)) targets.push({ id, lon: chart.bodies[id].lon, rules: rulers[id]! });
  }
  const basic = targets.filter((t) => ["sun", "moon", "venus", "mars", "asc"].includes(t.id));

  const events: TimelineEvent[] = [];
  const push = (technique: Technique, mover: string, target: string, aspect: EventAspect, run: Run, romance: 0 | 1 | 2, title: string, body: string, weak = false) => {
    const from = new Date(run.from), to = new Date(Math.max(run.from, run.to));
    events.push({ id: `${technique}:${mover}:${aspect}:${target}:${from.toISOString().slice(0, 10)}`, technique, title, from, to, exact: run.exact.map((ms) => new Date(Math.min(Math.max(ms, run.from), to.getTime()))), mover, target, aspect, romance, body, weak, openStart: run.openStart, openEnd: run.openEnd });
  };
  /** Every aspect of one moving point to one natal point. */
  const contacts = (technique: Technique, t: number[], lon: number[], moverId: PointId, target: NatalTarget, orb: number, moverRules?: number[]) => {
    for (const [angle, aspectName] of ANGLES)
      for (const point of angle === 0 || angle === 180 ? [target.lon + angle] : [target.lon + angle, target.lon - angle])
        for (const run of runsNear(t, lon, norm(point), orb)) {
          const n = named(moverId, target.id, aspectName);
          const weak = technique === "solar-arc" && !MAIN.has(n.aspect);
          const romance = romanceOf(technique, n.mover, n.target, n.aspect, { mover: moverRules, target: target.rules });
          const title = `${TECHNIQUE_PREFIX[technique]}${POINT_NAMES[n.mover]} ${ASPECT_WORD[n.aspect]} Your ${POINT_NAMES[n.target]}`;
          const body = technique === "transit" ? transitBody(n.mover, n.target, n.aspect, target.rules) : technique === "progression" ? progressedBody(n.mover, n.target, n.aspect) : solarArcBody(n.mover, n.target, n.aspect, moverRules, weak);
          push(technique, n.mover, n.target, n.aspect, run, romance, title, body, weak);
        }
  };

  // Transits: the slow planets of the calendar, with its orbs.
  const tT = grid(start, end, TRANSIT_STEP);
  const sky = tT.map((ms) => bodiesAt(ms, MOVERS.map((m) => m.id)));
  for (const m of MOVERS) {
    const lon = sky.map((s) => s[m.id].lon);
    for (const target of targets) contacts("transit", tT, lon, m.id, target, m.orb);
    if (chart.houses && (m.id === "jupiter" || m.id === "saturn"))
      for (const house of [5, 7])
        for (const run of runsInHouse(tT, lon, chart.houses.cusps, house))
          push("transit", m.id, `house-${house}`, "house", run, romanceOf("transit", m.id, `house-${house}`, "house"), `${POINT_NAMES[m.id]} In Your ${ordinal(house)} House`, HOUSE_TRANSIT[house]!.body.replace("{P}", POINT_NAMES[m.id]));
  }

  // Secondary progressions, and the solar arc taken from the progressed Sun.
  const tD = grid(start, end, DIRECTED_STEP);
  const progressed = tD.map((ms) => progressedAt(birthUtcMs, ms));
  for (const mover of ["sun", "venus", "mars"] as const) {
    const lon = progressed.map((p) => p[mover].lon);
    for (const target of basic) contacts("progression", tD, lon, mover, target, DIRECTED_ORB);
  }
  if (chart.houses) {
    const lon = progressed.map((p) => p.moon.lon);
    for (const target of basic) if (target.id !== "moon") contacts("progression", tD, lon, "moon", target, DIRECTED_ORB);
    for (const house of [5, 7])
      for (const run of runsInHouse(tD, lon, chart.houses.cusps, house))
        push("progression", "moon", `house-${house}`, "house", run, 2, `Progressed Moon In Your ${ordinal(house)} House`, PROGRESSED_MOON_HOUSE[house - 1]!);
  }
  // Progressed Venus and Mars changing sign or direction.
  for (const mover of ["venus", "mars"] as const)
    for (let i = 1; i < tD.length; i++) {
      const a = progressed[i - 1]![mover], b = progressed[i]![mover];
      const name = POINT_NAMES[mover];
      if (signIndex(a.lon) !== signIndex(b.lon)) {
        const forward = delta(a.lon, b.lon) > 0;
        const cusp = (forward ? signIndex(b.lon) : signIndex(a.lon)) * 30;
        const da = delta(cusp, a.lon), db = delta(cusp, b.lon);
        const at = tD[i - 1]! + clamp01(da / (da - db)) * (tD[i]! - tD[i - 1]!);
        const [was, now] = [SIGNS[signIndex(a.lon)]!.name, SIGNS[signIndex(b.lon)]!.name];
        const what = mover === "venus" ? "What you find attractive, and how you show affection," : "How you go after what you want, in love as elsewhere,";
        push("progression", mover, now, "ingress", { from: at, to: at, exact: [at], openStart: false, openEnd: false }, 0, `Progressed ${name} Enters ${now}`, `Your evolving ${PROGRESSED_NAME[mover]} moves from ${was} into ${now}. ${what} takes on the manner of ${now} over the years that follow.`);
      }
      if (a.speed !== b.speed && a.speed * b.speed <= 0 && b.speed !== 0) {
        const at = tD[i - 1]! + clamp01(a.speed / (a.speed - b.speed)) * (tD[i]! - tD[i - 1]!);
        const retro = b.speed < 0;
        const text = mover === "venus"
          ? retro ? "Relating turns inward for the years that follow: you weigh what you value in love privately before acting on it." : "What you have been weighing privately about love starts to move outward again."
          : retro ? "Desire and drive turn inward for the years that follow: you question what you want before going after it." : "What you want becomes easier to act on.";
        push("progression", mover, retro ? "retrograde" : "direct", "station", { from: at, to: at, exact: [at], openStart: false, openEnd: false }, 0, `Progressed ${name} Turns ${retro ? "Retrograde" : "Direct"}`, `Your progressed ${name} turns ${retro ? "retrograde" : "direct"}. ${text}`);
      }
    }

  // Solar arcs: every natal point moved on by the same arc.
  const arcs = progressed.map((p) => norm(p.sun.lon - chart.bodies.sun.lon));
  const natalLon = (id: PointId) => (id === "asc" ? chart.houses!.asc : id === "mc" ? chart.houses!.mc : chart.bodies[id as BodyId].lon);
  const pairs = new Set<string>();
  const direct = (mover: PointId, target: NatalTarget) => {
    if (mover === target.id || pairs.has(`${mover}>${target.id}`)) return;
    pairs.add(`${mover}>${target.id}`);
    const base = natalLon(mover);
    contacts("solar-arc", tD, arcs.map((arc) => norm(base + arc)), mover, target, DIRECTED_ORB, rulers[mover as BodyId]);
  };
  const arcMovers: PointId[] = timed ? ["venus", "mars", "jupiter", "sun", "moon", "asc", ...(Object.keys(rulers) as BodyId[])] : ["venus", "mars", "jupiter", "sun"];
  for (const mover of arcMovers) for (const target of basic) direct(mover, target);
  const venus = basic.find((t) => t.id === "venus")!;
  for (const mover of [...SOLAR_ARC_BODIES, "asc", "mc"] as PointId[]) if (timed || !["moon", "asc", "mc"].includes(mover)) direct(mover, venus);

  events.sort((a, b) => a.from.getTime() - b.from.getTime() || b.romance - a.romance || a.id.localeCompare(b.id));

  // Month by month, and the windows where at least two techniques carry a romance factor at once.
  const months: TimelineMonth[] = [];
  for (let k = 0; k < opts.months; k++) {
    const a = monthStart(opts.from, k), b = monthStart(opts.from, k + 1);
    const active = events.filter((e) => e.from.getTime() < b && e.to.getTime() >= a);
    const of = (technique: Technique) => active.filter((e) => e.technique === technique);
    const techniques = TECHNIQUES.filter((technique) => active.some((e) => e.technique === technique && e.romance > 0));
    months.push({ key: new Date(a).toISOString().slice(0, 7), start: new Date(a), end: new Date(b - 1), transit: of("transit"), progression: of("progression"), solarArc: of("solar-arc"), techniques, strength: techniques.length >= 3 ? 3 : techniques.length === 2 ? 2 : 0 });
  }
  const windows: RomanceWindow[] = [];
  for (let k = 0; k < months.length; k++) {
    if (!months[k]!.strength) continue;
    let last = k;
    while (last + 1 < months.length && months[last + 1]!.strength) last++;
    const span = months.slice(k, last + 1);
    const factors = events.filter((e) => e.romance > 0 && span.some((m) => m.techniques.includes(e.technique) && [...m.transit, ...m.progression, ...m.solarArc].includes(e)));
    const techniques = TECHNIQUES.filter((technique) => span.some((m) => m.techniques.includes(technique)));
    const strength = span.some((m) => m.strength === 3) ? 3 : 2;
    windows.push({ from: span[0]!.start, to: span[span.length - 1]!.end, strength, techniques, factors, summary: summarise(techniques, strength, factors, span.length) });
    k = last;
  }
  return { from: new Date(start), to: new Date(end), months, events, windows, notes };
}

const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

function summarise(techniques: Technique[], strength: 2 | 3, factors: TimelineEvent[], months: number) {
  const strong = factors.filter((f) => f.romance === 2);
  const lead = (strong.length ? strong : factors).slice(0, 3).map((f) => f.title);
  const names = list(techniques.map((t) => TECHNIQUE_NAMES[t].toLowerCase()));
  const head = strength === 3 ? `All three techniques point the same way here: ${names}.` : `${names.charAt(0).toUpperCase()}${names.slice(1)} point the same way here.`;
  return `${head} ${months === 1 ? "One month" : `${months} months`}, ${factors.length === 1 ? "one factor" : `${factors.length} factors`}${lead.length ? `, led by ${list(lead)}` : ""}.`;
}
