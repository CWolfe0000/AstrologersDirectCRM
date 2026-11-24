import type { BodyId, Chart } from "@/lib/astro/types";
import { LUMINARY_ORBS, NATAL_ORBS, POINT_NAMES, aspectBetween } from "@/lib/astro/zodiac";

/**
 * A placement is never read alone. Every reading of a planet by sign or house comes in two parts:
 * what the placement is and needs (true whatever its aspects), and the difficult form it can
 * take. Which of the two the person sees depends on the aspects that planet actually makes in
 * their chart: a planet under hard aspect gets the difficult form as written; one with only easy
 * aspects is told the difficult form is unlikely to be their story.
 */

export interface Reading {
  core: string;
  strain: string;
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

/** One reading, weighed by the aspects the planet makes. */
export function weigh(reading: Reading, ctx: AspectContext, where = "your chart"): { body: string; basis: string } {
  const { hard, flowing } = ctx;
  if (hard.length && flowing.length) return { body: `${reading.core} ${reading.strain} It also has support in ${where}, which gives you a way through.`, basis: `under pressure from ${hard.join(", ")}; supported by ${flowing.join(", ")}` };
  if (hard.length) return { body: `${reading.core} ${reading.strain}`, basis: `under pressure from ${hard.join(", ")}` };
  if (flowing.length) return { body: `${reading.core} It is well supported in ${where}, so the harder side of this placement is unlikely to be your story.`, basis: `supported by ${flowing.join(", ")}` };
  return { body: reading.core, basis: "no close aspects from the other planets" };
}

/** How a chart ruler in each sign colours the way a person comes across. */
export const SIGN_MANNER = [
  "directly and at speed", "steadily and through the senses", "through talk, wit and curiosity", "protectively and through feeling",
  "warmly and with some theatre", "carefully and by being useful", "gracefully and with an eye to the other person", "intensely and in private",
  "frankly and with humour", "with reserve and self-command", "independently and on your own terms", "gently and by intuition",
];
