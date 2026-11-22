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
 * purposes. The approach is his, checked against chapters 10–15 of that book;
 * every sentence here is our own wording.
 */

export const ELEMENTS: Element[] = ["fire", "earth", "air", "water"];

/**
 * How much each point counts toward the balance, in Arroyo's order of
 * importance (Four Elements, ch. 12): the Sun first; then the Moon, Ascendant
 * and Mars; then Venus and Mercury; then Jupiter, then Saturn. Uranus, Neptune
 * and Pluto stay in a sign for years and describe a generation, so they are
 * not counted. He gives the order, not numbers; the numbers are ours.
 */
const WEIGHTS: [PointId, number][] = [["sun", 4], ["moon", 3], ["asc", 3], ["mars", 3], ["venus", 2], ["mercury", 2], ["jupiter", 1.5], ["saturn", 1]];
/** Extra weight for the planet ruling the rising sign and the planet ruling the Sun sign (traditional rulers, never an outer planet). */
const RULER_BOOST = 2;

const NAME: Record<Element, string> = { fire: "Fire", earth: "Earth", air: "Air", water: "Water" };

/** What a strong element is like, said to the member. */
const EMPHASIS: Record<Element, string> = {
  fire: "You run on enthusiasm and faith in yourself. You need to act, to be direct and to be free to follow what inspires you, and you can be impatient with other people’s feelings and limits.",
  earth: "You run on what is practical and real. You are patient, dependable and at home in the material world, and you can be cautious and slow to change.",
  air: "You run on ideas and exchange. You need conversation, perspective and room to think, and you can stay in your head when a feeling is called for.",
  water: "You run on feeling. You are sensitive and intuitive, you need emotional closeness and privacy, and you protect yourself by withdrawing.",
};
/** When one element holds half the chart or more. */
const EXCESS: Record<Element, string> = {
  fire: "So much fire makes you restless and always pushing for something to happen. You can burn yourself out, act before you think, and be blunt with people without noticing. At your best you start things other people would not dare to.",
  earth: "So much earth makes you rely on what you can see and what works. Work can take over, imagination can narrow, and your sense of worth can depend on being useful. You do best with an ideal to work for.",
  air: "So much air keeps you in your head. You can think about a thing until the will to do it is gone, spread yourself over many interests, and wear your nerves out. Rest and a change of scene matter for you. At your best you connect people and ideas.",
  water: "So much water puts you at the mercy of your moods. You take everything in, react strongly, and can withdraw or ask other people to fill a need they cannot fill. At your best you are compassionate, devoted and imaginative.",
};
/** When an element is barely present. The last sentence of each is the relationship pattern that goes with it. */
const LACK: Record<Element, string> = {
  fire: "Confidence, optimism and trust in life do not come by themselves, and setbacks stay with you. You often have great patience instead. You are drawn to fiery people for their spark, and find them hard to live with.",
  earth: "The practical side of life, money, food, routine and the body, takes deliberate effort, and you can feel you have no settled place. Your imagination is free in return. You are drawn to grounded people, and feel hemmed in by them.",
  air: "Stepping back to look at yourself or a situation coolly does not come naturally, so you can get over-involved and find cooperation in close relationships hard. You are drawn to detached, articulate people, and distrust them a little.",
  water: "Your own feelings, and other people’s, are hard for you to reach, and you may dismiss them. That can leave you depending, without knowing it, on people who do show feeling. You are drawn to emotional people, and resist being drawn out by them.",
};
const GROUPS = {
  light: { title: "Air And Fire, Little Water Or Earth", body: "Most of your chart is in the active, expressive elements. You are idealistic, quick, verbal and good company, and you can scatter your energy, burn out, and neglect both your feelings and your body." },
  heavy: { title: "Water And Earth, Little Air Or Fire", body: "Most of your chart is in the receptive, self-contained elements. You are deep, serious and enduring, and you protect what you have. You can be fearful, hold on too tightly, and run short of faith that things will work out." },
};
/** Two of your own planets in elements that do not mix: an inner pull that shapes who you choose. */
const INNER: [BodyId, BodyId, string, string][] = [
  ["sun", "moon", "Sun And Moon In Different Worlds", "What you are aiming for and what makes you feel secure run on different kinds of energy, so part of you is unsatisfied whichever you follow. Partners may get mixed signals from you."],
  ["sun", "venus", "What You Like Against Who You Are", "The way you give and receive affection runs on a different energy from your basic nature. You can attract, and be attracted to, people who do not meet your real needs."],
  ["sun", "mars", "What Excites You Against Who You Are", "What stirs your desire runs on a different energy from your basic nature. You can be physically drawn to a type of person who works against what you most need."],
  ["moon", "venus", "Security Against Romance", "What makes you feel secure and what you find romantic run on different energies. One kind of person meets the first need and another kind meets the second."],
];

export interface ElementBalance {
  /** Share of the chart's weight in each element, 0–1. */
  shares: Record<Element, number>;
  /** Elements that are strongly active: the heaviest (two when close), and always the element of the planet ruling the rising sign. */
  strong: Element[];
  /** Elements with half the chart or more. */
  excess: Element[];
  /** Elements with little or nothing: under 8% of the weight. */
  lacking: Element[];
  /** Which points are in each element. */
  points: Record<Element, string[]>;
  /** The element of the planet ruling the rising sign, when the birth time is known. */
  accented: { element: Element; ruler: BodyId } | null;
}

export function elementBalance(chart: Chart): ElementBalance {
  const totals: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const points: Record<Element, string[]> = { fire: [], earth: [], air: [], water: [] };
  const sunRuler = SIGNS[signIndex(chart.bodies.sun.lon)]!.ruler as BodyId;
  const ascRuler = chart.houses ? (SIGNS[signIndex(chart.houses.asc)]!.ruler as BodyId) : null;
  for (const [id, weight] of WEIGHTS) {
    if (id === "asc" && !chart.houses) continue;
    if (id === "moon" && !chart.moonSignCertain) continue;
    const el = elementOf(id === "asc" ? chart.houses!.asc : chart.bodies[id as BodyId].lon);
    const rules = [id === ascRuler ? "rules your rising sign" : "", id === sunRuler && id !== "sun" ? "rules your Sun sign" : ""].filter(Boolean);
    totals[el] += weight + rules.length * RULER_BOOST;
    points[el].push((id === "asc" ? "Rising" : POINT_NAMES[id]) + (rules.length ? ` (${rules.join(", ")})` : ""));
  }
  const sum = ELEMENTS.reduce((a, e) => a + totals[e], 0);
  const shares = Object.fromEntries(ELEMENTS.map((e) => [e, totals[e] / sum])) as Record<Element, number>;
  const ranked = [...ELEMENTS].sort((a, b) => totals[b] - totals[a]);
  const strong = ranked.filter((e) => totals[e] > 0 && totals[ranked[0]!] - totals[e] <= 1).slice(0, 2);
  const accented = ascRuler && (ascRuler !== "moon" || chart.moonSignCertain) ? { element: elementOf(chart.bodies[ascRuler].lon), ruler: ascRuler } : null;
  if (accented && !strong.includes(accented.element)) strong.push(accented.element);
  return { shares, strong, excess: ELEMENTS.filter((e) => shares[e] >= 0.5), lacking: ELEMENTS.filter((e) => shares[e] < 0.08 && !strong.includes(e)), points, accented };
}

/** Your own element balance in words. */
export function elementReading(chart: Chart): { balance: ElementBalance; insights: Insight[] } {
  const balance = elementBalance(chart);
  const insights: Insight[] = [];
  for (const e of balance.strong) {
    const basis = `${balance.points[e].join(", ")} in ${e} signs`;
    const onlyRuler = balance.accented?.element === e && balance.shares[e] < 0.2;
    if (balance.excess.includes(e)) insights.push({ title: `Very Strong ${NAME[e]}`, body: `${EMPHASIS[e]} ${EXCESS[e]}`, basis });
    else if (onlyRuler) insights.push({ title: `${NAME[e]} Through Your Chart Ruler`, body: `${POINT_NAMES[balance.accented!.ruler]} rules your rising sign, so its element shows in how you come across even though little else in your chart is there. ${EMPHASIS[e]}`, basis });
    else insights.push({ title: `Strong ${NAME[e]}`, body: EMPHASIS[e], basis });
  }
  for (const e of balance.lacking) insights.push({ title: `Little ${NAME[e]}`, body: LACK[e], basis: balance.points[e].length ? `Only ${balance.points[e].join(", ")} in ${e} signs` : `No personal planets in ${e} signs` });
  const light = balance.shares.fire + balance.shares.air;
  if (light >= 0.75) insights.push({ ...GROUPS.light, basis: `${Math.round(light * 100)}% of your chart in air and fire` });
  if (light <= 0.25) insights.push({ ...GROUPS.heavy, basis: `${Math.round((1 - light) * 100)}% of your chart in water and earth` });
  for (const [a, b, title, body] of INNER) {
    if ((a === "moon" || b === "moon") && !chart.moonSignCertain) continue;
    const la = chart.bodies[a].lon, lb = chart.bodies[b].lon;
    if (relationOf(elementOf(la), elementOf(lb)) === "discordant")
      insights.push({ title, body, basis: `${POINT_NAMES[a]} in ${SIGNS[signIndex(la)]!.name} (${elementOf(la)}), ${POINT_NAMES[b]} in ${SIGNS[signIndex(lb)]!.name} (${elementOf(lb)})` });
  }
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

/**
 * Fire and air are the active, expressive pair; earth and water the receptive,
 * self-contained pair. The same element is the closest harmony, the other
 * element of the same pair comes next, and a mix across the pairs grinds.
 */
export function relationOf(a: Element, b: Element): Relation {
  if (a === b) return "same";
  const pair = [a, b].sort().join("-");
  return pair === "air-fire" || pair === "earth-water" ? "compatible" : "discordant";
}

/** How two elements meet between two people (Four Elements, ch. 10 and 15), in our words. */
const PAIR: Record<string, string> = {
  "fire-fire": "You recharge each other. There is plenty of energy and encouragement, and nobody to slow things down.",
  "earth-earth": "You recharge each other. You agree on what is practical and dependable, and it can settle into routine.",
  "air-air": "You recharge each other. Understanding comes easily and there is always something to say, and it can stay in the head.",
  "water-water": "You recharge each other. You feel each other without words, and moods can feed each other too.",
  "air-fire": "Air fans fire with ideas, and fire gives air the confidence to say them. You stimulate each other, though fire can be too brash for air’s nerves and gets bored with talk it cannot act on.",
  "earth-water": "Earth gives water a form and something solid to rely on, and water refreshes earth and makes it more fruitful. You both hold on to what matters and protect it.",
  "earth-fire": "Fire feels smothered, and earth finds fire too fast and forceful to trust. It takes effort, and when it works one supplies the drive and the other makes it real.",
  "fire-water": "Fire fears being put out and tires of emotion, and water shrinks from so much force. This is the most draining mix, and each needs time apart to recover.",
  "air-earth": "Earth thinks air has its head in the clouds, and is a little fascinated by it. Air will not be pinned down. You complement each other in what you notice and differ in how you go about things.",
  "air-water": "Water weighs on air’s lightness, and air dries water out. One wants it talked about and the other wants it felt, and each can leave the other feeling unheard.",
};
const SAME_SIGN = " You share the sign itself, which blends more than it feeds: comfortable, and it can go flat without other links between you.";

export type Level = Insight & { relation: Relation };

export interface Attunement {
  /** The core test: each person's Sun and Moon against the other's Sun and Moon. */
  lights: Level[];
  lightsVerdict: string;
  /** Venus and Mars against the other person's Sun and Moon, and against each other's Venus and Mars. */
  attraction: string;
  /** Mercury, Venus, Mars and rising sign, same planet to same planet. */
  levels: Level[];
  /** Elements one person lacks and the other is strong in. */
  supplies: string[];
  yours: string;
  theirs: string;
}

/** Two charts compared by element (Four Elements, ch. 15). */
export function attunement(you: Chart, them: Chart, name: string): Attunement {
  const lonOf = (c: Chart, id: PointId) => (id === "asc" ? c.houses?.asc : id === "moon" && !c.moonSignCertain ? undefined : c.bodies[id as BodyId].lon);
  const label = (id: PointId) => (id === "asc" ? "Rising Sign" : POINT_NAMES[id]);
  const level = (mine: PointId, theirs: PointId, title: string | null): Level | null => {
    const a = lonOf(you, mine), b = lonOf(them, theirs);
    if (a === undefined || b === undefined) return null;
    const ea = elementOf(a), eb = elementOf(b);
    const sameSign = signIndex(a) === signIndex(b) && mine === theirs;
    return {
      title: `${title ?? `Your ${label(mine)}, ${name}’s ${label(theirs)}`}: ${NAME[ea]} With ${NAME[eb]}`,
      body: PAIR[[ea, eb].sort().join("-")]! + (sameSign ? SAME_SIGN : ""),
      basis: `Your ${label(mine)} in ${SIGNS[signIndex(a)]!.name}, ${name}’s ${label(theirs)} in ${SIGNS[signIndex(b)]!.name}`,
      relation: relationOf(ea, eb),
    };
  };
  const some = (xs: (Level | null)[]) => xs.filter((x): x is Level => !!x);

  const lights = some([level("sun", "sun", "Sun With Sun"), level("sun", "moon", null), level("moon", "sun", null), level("moon", "moon", "Moon With Moon")]);
  const inTune = lights.filter((l) => l.relation !== "discordant").length;
  const lightsVerdict =
    inTune === 0
      ? `None of these is in harmony. This is the link that most supports lasting love, because it lets each of you be yourself with the other. Without it, a couple depends on strong specific contacts between the charts and on what you choose to build.`
      : inTune === lights.length
        ? `All of these are in harmony. Each of you can be yourself with the other, which is the best base for getting through the harder contacts between your charts.`
        : `${inTune} of ${lights.length} are in harmony. Where they are, each of you encourages the other’s basic nature, and that is the resource you draw on for the harder contacts between your charts.`;

  const links = (from: Chart, to: Chart) => {
    let ok = 0, all = 0;
    for (const p of ["venus", "mars"] as const)
      for (const l of ["sun", "moon"] as const) {
        const b = lonOf(to, l);
        if (b === undefined) continue;
        all++;
        if (relationOf(elementOf(from.bodies[p].lon), elementOf(b)) !== "discordant") ok++;
      }
    return { ok, all };
  };
  const mine = links(you, them), theirs = links(them, you);
  let desire = 0;
  for (const [a, b] of [["venus", "venus"], ["mars", "mars"], ["venus", "mars"], ["mars", "venus"]] as const) if (relationOf(elementOf(you.bodies[a].lon), elementOf(them.bodies[b].lon)) !== "discordant") desire++;
  const pull = mine.ok + theirs.ok;
  const attraction =
    `Your Venus and Mars are in tune with ${name}’s Sun and Moon on ${mine.ok} of ${mine.all} links, and theirs with yours on ${theirs.ok} of ${theirs.all}. Your Venus and Mars are in tune with each other’s on ${desire} of 4. ` +
    (pull * 2 >= mine.all + theirs.all && inTune === 0
      ? "That is a common and difficult combination: strong attraction, without the Sun and Moon harmony that lets it last comfortably."
      : pull * 2 >= mine.all + theirs.all
        ? "That is a good deal of attraction and liking on top of the Sun and Moon picture."
        : "Attraction here depends more on specific contacts between your charts than on your elements.") +
    (desire <= 1 ? " With so little in tune between your Venus and Mars, physical ease is something to look after." : "");

  const levels = some([level("mercury", "mercury", "Talking And Understanding"), level("venus", "venus", "Affection"), level("mars", "mars", "Desire And Drive"), level("asc", "asc", "Approach To Life")]);

  const mb = elementBalance(you), tb = elementBalance(them);
  const supplies: string[] = [];
  const tail = "The draw is real and there is a lot to learn from it. It is rarely easy to live with for long, because what you admire is also what you cannot keep up with, and the difference tends to grow. It goes best with some distance and a wish to grow from it.";
  for (const e of mb.lacking) if (tb.strong.includes(e)) supplies.push(`${name} has the ${e} your chart lacks. ${tail}`);
  for (const e of tb.lacking) if (mb.strong.includes(e)) supplies.push(`You have the ${e} ${name}’s chart lacks, so the same is true for them about you. ${supplies.length ? "" : tail}`.trim());
  return { lights, lightsVerdict, attraction, levels, supplies, yours: elementSummary(you), theirs: elementSummary(them) };
}

/* ---------- Aspects, defined ---------- */

/**
 * What each kind of aspect is, whatever planets are involved. The framing follows Sue Tompkins,
 * "Aspects in Astrology", ch. 3 (unity, polarity and projection, challenge, ease, opportunity),
 * checked against the book, with the element relationship of the signs from Arroyo. Her book
 * reads aspects within one chart; applying them between two charts is our extension. The wording
 * is our own.
 */
export const ASPECT_DEFINITION: Record<AspectName, string> = {
  conjunction: "A conjunction is the strongest aspect: the two planets act as one. It is so much a part of the person that it is hard to see from the inside, and between two people it is felt at once.",
  opposition: "An opposition is a polarity. The two planets pull against each other, and one side is often handed to the other person to carry. The signs are in compatible elements, so with awareness it becomes a balance.",
  square: "A square is a challenge. The two planets are in elements that do not mix, so they work at cross purposes and create tension that pushes for action. It is the aspect people work hardest at and build the most from.",
  trine: "A trine is ease. The two planets are in the same element and accept each other, so this comes naturally and is easy to take for granted.",
  sextile: "A sextile is an opportunity. The two planets are in compatible elements and work together well, with a little effort.",
};

/** The elements an aspect normally joins. Near a sign boundary the real elements can differ, which changes the aspect. */
const USUAL: Record<AspectName, Relation> = { conjunction: "same", opposition: "compatible", square: "discordant", trine: "same", sextile: "compatible" };

/** A sentence for an aspect whose signs are not in the usual elements (an out-of-sign aspect), else "". */
export function elementNote(aspect: AspectName, lonA: number, lonB: number): string {
  const ea = elementOf(lonA), eb = elementOf(lonB);
  const actual = relationOf(ea, eb);
  if (actual === USUAL[aspect]) return "";
  const signs = `${SIGNS[signIndex(lonA)]!.name} and ${SIGNS[signIndex(lonB)]!.name}`;
  if (aspect === "square") return `Here the signs, ${signs}, are in ${actual === "same" ? "the same element" : "compatible elements"}, so this square is much less intense than usual, though its theme is still there.`;
  if (aspect === "conjunction") return `Here the two are in different signs, ${signs}, so they blend less completely.`;
  if (aspect === "trine") return `Here the signs, ${signs}, are in different elements, so this trine is less easy and more dynamic than usual.`;
  return `Here the signs, ${signs}, are in ${actual === "discordant" ? "elements that do not mix easily" : "different elements"}, so this ${aspect} is less ${aspect === "opposition" ? "balanced" : "automatic"} than usual.`;
}
