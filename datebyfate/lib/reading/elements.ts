import type { BodyId, Chart, PointId } from "@/lib/astro/types";
import { POINT_NAMES, SIGNS, elementOf, signIndex, type AspectName, type Element } from "@/lib/astro/zodiac";
import type { Insight } from "./own";
import { ELEMENT_PEOPLE } from "./text";

/**
 * The four elements, read the way Stephen Arroyo set out in "Astrology,
 * Psychology, and the Four Elements": each element is a kind of energy a person
 * is attuned to, a chart is judged by which elements it emphasises and which it
 * lacks, and two people are compared planet by planet by whether their elements
 * feed each other (fire with air, earth with water), match, or work at cross
 * purposes. The approach is his; every sentence here is our own wording.
 */

export const ELEMENTS: Element[] = ["fire", "earth", "air", "water"];

/**
 * How much each point counts toward the balance. The Sun, Moon and Ascendant
 * carry most; Uranus, Neptune and Pluto stay in a sign for years and describe
 * a generation, so they are not counted.
 */
const WEIGHTS: [PointId, number][] = [["sun", 3], ["moon", 3], ["asc", 3], ["mercury", 2], ["venus", 2], ["mars", 2], ["jupiter", 1], ["saturn", 1]];

const NAME: Record<Element, string> = { fire: "Fire", earth: "Earth", air: "Air", water: "Water" };

/** What a strong element is like, and what little of it is like, said to the member. */
const EMPHASIS: Record<Element, string> = {
  fire: "You run on enthusiasm and confidence. You need to act, to be direct and to have something to look forward to, and you can be impatient with other people’s feelings and limits.",
  earth: "You run on what is practical and real. You need results, security and physical comfort, and you can be cautious and slow to change.",
  air: "You run on ideas and exchange. You need conversation, perspective and room to think, and you can stay in your head when a feeling is called for.",
  water: "You run on feeling. You need emotional closeness and privacy, you absorb the mood around you, and you protect yourself by withdrawing.",
};
const LACK: Record<Element, string> = {
  fire: "Enthusiasm and self-confidence do not come by themselves, and you can tire or lose heart easily. You are often drawn to fiery people for their spark, and then find them exhausting.",
  earth: "The practical side of life, money, routine and the body, takes deliberate effort. You are often drawn to grounded people, and then feel hemmed in by them.",
  air: "Stepping back to see a situation coolly, or talking it through, does not come naturally. You are often drawn to detached, articulate people, and then find them cold.",
  water: "Your own feelings, and other people’s, can be hard for you to read. You are often drawn to emotional people, and then feel swamped by them.",
};

export interface ElementBalance {
  /** Share of the chart's weight in each element, 0–1. */
  shares: Record<Element, number>;
  /** Elements with the largest share (two when they are close). */
  strong: Element[];
  /** Elements with none of the counted points. */
  lacking: Element[];
  /** Which points are in each element. */
  points: Record<Element, string[]>;
}

export function elementBalance(chart: Chart): ElementBalance {
  const totals: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const points: Record<Element, string[]> = { fire: [], earth: [], air: [], water: [] };
  for (const [id, weight] of WEIGHTS) {
    if (id === "asc" && !chart.houses) continue;
    if (id === "moon" && !chart.moonSignCertain) continue;
    const el = elementOf(id === "asc" ? chart.houses!.asc : chart.bodies[id as BodyId].lon);
    totals[el] += weight;
    points[el].push(id === "asc" ? "Rising" : POINT_NAMES[id]);
  }
  const sum = ELEMENTS.reduce((a, e) => a + totals[e], 0);
  const shares = Object.fromEntries(ELEMENTS.map((e) => [e, totals[e] / sum])) as Record<Element, number>;
  const ranked = [...ELEMENTS].sort((a, b) => totals[b] - totals[a]);
  const strong = ranked.filter((e) => totals[e] > 0 && totals[ranked[0]!] - totals[e] <= 1).slice(0, 2);
  return { shares, strong, lacking: ELEMENTS.filter((e) => totals[e] === 0), points };
}

/** Your own element balance in words. */
export function elementReading(chart: Chart): { balance: ElementBalance; insights: Insight[] } {
  const balance = elementBalance(chart);
  const insights: Insight[] = balance.strong.map((e) => ({ title: `Strong ${NAME[e]}`, body: EMPHASIS[e], basis: `${balance.points[e].join(", ")} in ${e} signs` }));
  for (const e of balance.lacking) insights.push({ title: `Little ${NAME[e]}`, body: LACK[e], basis: `No personal planets in ${e} signs` });
  return { balance, insights };
}

/** One line about someone else's balance. */
export function elementSummary(chart: Chart): string {
  const b = elementBalance(chart);
  const strong = b.strong.map((e) => `${e} (${ELEMENT_PEOPLE[e]})`).join(" and ");
  return `Mostly ${strong}.${b.lacking.length ? ` Little or no ${b.lacking.join(" or ")}.` : ""}`;
}

/* ---------- Two people ---------- */

export type Relation = "same" | "compatible" | "discordant";

/** Fire and air feed each other; so do earth and water. Every other mix works at cross purposes. */
export function relationOf(a: Element, b: Element): Relation {
  if (a === b) return "same";
  const pair = [a, b].sort().join("-");
  return pair === "air-fire" || pair === "earth-water" ? "compatible" : "discordant";
}

const PAIR: Record<string, string> = {
  "fire-fire": "You speed each other up. There is plenty of energy and encouragement, and nobody to slow things down.",
  "earth-earth": "You agree on what is practical and dependable. It is steady, and it can settle into routine.",
  "air-air": "You never run out of things to say. Understanding comes easily, and it can stay in the head.",
  "water-water": "You feel each other without words. The sympathy runs deep, and moods can feed each other.",
  "air-fire": "Air fans fire. Ideas give the enthusiasm somewhere to go, and the enthusiasm brings the ideas to life. You stimulate each other.",
  "earth-water": "Water nourishes earth and earth holds water. One gives feeling and the other gives stability. You settle each other.",
  "earth-fire": "Fire finds earth slow and dampening, and earth finds fire reckless. With effort, one supplies the drive and the other makes it real.",
  "fire-water": "Fire finds water heavy and moody, and water finds fire insensitive. Reactions are strong in both directions.",
  "air-earth": "Air finds earth plodding, and earth finds air impractical. Ideas and practice have to be translated for each other.",
  "air-water": "Air wants to talk about it and water wants it to be felt. Each can leave the other feeling unheard.",
};

const LEVEL: [PointId, string][] = [
  ["sun", "Basic Energy"],
  ["moon", "Feeling Safe"],
  ["mercury", "Talking And Understanding"],
  ["venus", "Affection"],
  ["mars", "Desire And Drive"],
  ["asc", "Approach To Life"],
];

export interface Attunement {
  /** One entry per planet both charts can be read for. */
  levels: (Insight & { relation: Relation })[];
  /** Elements one person lacks and the other is strong in. */
  supplies: string[];
  yours: string;
  theirs: string;
}

/** Two charts compared element by element, planet by planet. */
export function attunement(you: Chart, them: Chart, name: string): Attunement {
  const levels: Attunement["levels"] = [];
  const lonOf = (c: Chart, id: PointId) => (id === "asc" ? c.houses?.asc : id === "moon" && !c.moonSignCertain ? undefined : c.bodies[id as BodyId].lon);
  for (const [id, label] of LEVEL) {
    const a = lonOf(you, id), b = lonOf(them, id);
    if (a === undefined || b === undefined) continue;
    const ea = elementOf(a), eb = elementOf(b);
    const point = id === "asc" ? "Rising sign" : POINT_NAMES[id];
    levels.push({
      title: `${label}: ${NAME[ea]} With ${NAME[eb]}`,
      body: PAIR[[ea, eb].sort().join("-")]!,
      basis: `Your ${point} in ${SIGNS[signIndex(a)]!.name}, ${name}’s in ${SIGNS[signIndex(b)]!.name}`,
      relation: relationOf(ea, eb),
    });
  }
  const mine = elementBalance(you), theirs = elementBalance(them);
  const supplies: string[] = [];
  for (const e of mine.lacking) if (theirs.strong.includes(e)) supplies.push(`${name} has the ${e} your chart lacks. That is a strong draw, and it takes patience: what you admire in them is also what you find hardest to keep up with.`);
  for (const e of theirs.lacking) if (mine.strong.includes(e)) supplies.push(`You have the ${e} ${name}’s chart lacks. They are likely to lean on you for it, and to find it too much at times.`);
  return { levels, supplies, yours: elementSummary(you), theirs: elementSummary(them) };
}

/* ---------- Aspects, defined ---------- */

/** What each aspect is, whatever planets are involved. */
export const ASPECT_DEFINITION: Record<AspectName, string> = {
  conjunction: "A conjunction fuses the two energies. They act as one, intensely, and neither person is neutral about it.",
  opposition: "An opposition is felt across the relationship. Each person stimulates the other and sees in them what they lack, and because the signs are in compatible elements it can become a balance.",
  square: "A square is a challenge. The two energies work at cross purposes, and the tension has to be released through effort and adjustment. It is where a relationship generates the most energy.",
  trine: "A trine is an easy flow. The two energies are in the same element and support each other without effort, which also makes it easy to take for granted.",
  sextile: "A sextile is an opening. The two energies are in compatible elements and cooperate when you make use of it.",
};

/** The elements an aspect normally joins. Near a sign boundary the real elements can differ, which changes the aspect. */
const USUAL: Record<AspectName, Relation> = { conjunction: "same", opposition: "compatible", square: "discordant", trine: "same", sextile: "compatible" };

/** A sentence for an aspect whose signs are not in the usual elements (an out-of-sign aspect), else "". */
export function elementNote(aspect: AspectName, lonA: number, lonB: number): string {
  const ea = elementOf(lonA), eb = elementOf(lonB);
  const actual = relationOf(ea, eb);
  if (actual === USUAL[aspect]) return "";
  const signs = `${SIGNS[signIndex(lonA)]!.name} and ${SIGNS[signIndex(lonB)]!.name}`;
  if (aspect === "square") return `Here the signs, ${signs}, are in ${actual === "same" ? "the same element" : "compatible elements"}, which makes this square easier to work with.`;
  if (aspect === "conjunction") return `Here the two are in different signs, ${signs}, so they blend less completely.`;
  return `Here the signs, ${signs}, are in ${actual === "discordant" ? "elements that do not mix easily" : "different elements"}, so this ${aspect} is less ${aspect === "opposition" ? "balanced" : "automatic"} than usual.`;
}
