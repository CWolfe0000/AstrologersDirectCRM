import type { BodyId, Chart } from "@/lib/astro/types";
import { LUMINARY_ORBS, NATAL_ORBS, POINT_NAMES, aspectBetween } from "@/lib/astro/zodiac";

/**
 * A placement is never read alone, and it is never watered down. Every reading of a planet by sign
 * or house has a core (what the placement is and needs, at the strength the source gives it) and
 * several expressions: distinct forms the same placement takes in real lives, ordered from the most
 * constructive to the hardest. All of them are shown. The aspects the planet actually makes in the
 * chart say which way it leans.
 */

export interface Reading {
  core: string;
  /** Three or four forms this placement takes, most constructive first, hardest last. */
  expressions: string[];
}

export interface AspectContext {
  /** e.g. "square Saturn" */
  hard: string[];
  flowing: string[];
}

const PLANETS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const SLOW = new Set<BodyId>(["jupiter", "saturn", "uranus", "neptune", "pluto"]);
/** For conjunctions (Forrest, The Changing Sky, ch. 10): planets of the same kind fuse easily; a hard planet with a soft one is felt as tension. */
const SOFT = new Set<BodyId>(["moon", "venus", "jupiter", "neptune"]);

/** The aspects a planet receives from the rest of the chart. Slow planet to slow planet is left out: a whole generation shares those. */
export function aspectsTo(chart: Chart, point: BodyId): AspectContext {
  const out: AspectContext = { hard: [], flowing: [] };
  if (point === "node") return out;
  for (const other of PLANETS) {
    if (other === point) continue;
    if (SLOW.has(point) && SLOW.has(other)) continue;
    // Without a birth time the Moon can be 6° either way: too loose for aspects.
    if (!chart.houses && (other === "moon" || point === "moon")) continue;
    const luminary = [point, other].some((p) => p === "sun" || p === "moon");
    const asp = aspectBetween(chart.bodies[point].lon, chart.bodies[other].lon, luminary ? LUMINARY_ORBS : NATAL_ORBS);
    if (!asp) continue;
    const label = `${asp.name} ${POINT_NAMES[other]}`;
    const hard = asp.cls === "hard" || (asp.cls === "conjunction" && point !== "mercury" && other !== "mercury" && SOFT.has(point) !== SOFT.has(other));
    (hard ? out.hard : out.flowing).push(label);
  }
  return out;
}

export interface Weighed { body: string; expressions: string[]; lean: string; basis: string }

/** One reading with all its expressions, and which way the planet's aspects lean it. */
export function weigh(reading: Reading, ctx: AspectContext, where = "your chart"): Weighed {
  const { hard, flowing } = ctx;
  const base = { body: reading.core, expressions: reading.expressions };
  if (hard.length && flowing.length) return { ...base, lean: `In ${where} this is both pressed (${hard.join(", ")}) and supported (${flowing.join(", ")}), so expect the whole range, with a way through the harder end.`, basis: `under pressure from ${hard.join(", ")}; supported by ${flowing.join(", ")}` };
  if (hard.length) return { ...base, lean: `In ${where} this is under pressure (${hard.join(", ")}), which pulls toward the harder expressions until the pressure is worked with.`, basis: `under pressure from ${hard.join(", ")}` };
  if (flowing.length) return { ...base, lean: `In ${where} this is supported (${flowing.join(", ")}), which favours the first expressions.`, basis: `supported by ${flowing.join(", ")}` };
  return { ...base, lean: `Nothing in ${where} aspects this closely, so no expression is favoured.`, basis: "no close aspects from the other planets" };
}

/** How a chart ruler in each sign colours the way a person comes across. */
export const SIGN_MANNER = [
  "directly and at speed", "steadily and through the senses", "through talk, wit and curiosity", "protectively and through feeling",
  "warmly and with some theatre", "carefully and by being useful", "gracefully and with an eye to the other person", "intensely and in private",
  "frankly and with humour", "with reserve and self-command", "independently and on your own terms", "gently and by intuition",
];
