import type { BodyId, Chart } from "@/lib/astro/types";
import { delta, midpoint, separation } from "@/lib/astro/spherical";
import { POINT_NAMES, SIGNS, houseOf, ordinal, signIndex, type AspectName } from "@/lib/astro/zodiac";
import { aspectsTo, weigh, type Reading } from "./context";
import type { Insight } from "./own";
import { C_MARS_HOUSE, C_MARS_SIGN, C_MOON_HOUSE, C_MOON_SIGN, C_NODES_HOUSE, C_NODES_SIGN, C_OTHER_HOUSE, C_PATTERNS, C_RISING_SIGN, C_SATURN_HOUSE, C_SUN_HOUSE, C_SUN_SIGN, C_VENUS_HOUSE, C_VENUS_SIGN } from "./composite-love";

/**
 * The composite chart: the relationship as a thing in its own right.
 *
 * Construction and the readings of each planet by sign and house, of the rising sign and of the
 * lunar nodes follow Steven and Jodie Forrest, "Skymates, Volume Two": each planet is the midpoint
 * on the shorter arc, with no exceptions; the houses come from the midpoint of the two Midheavens,
 * cast for the place the couple first met; and no placement is a verdict. The reading of a house
 * that holds four or more planets, and of the aspects to the composite Sun and Moon, follow Robert
 * Hand, "Planets in Composite", chs. 2–6. The wording is our own (composite-love.ts and below).
 */

const PLANETS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

/** What a crowd of planets in one house means for a relationship (four or more: it outranks everything else). */
const HOUSE_EMPHASIS = [
  "This is a relationship people notice. You come across as a unit and have more effect together than apart. The risk is caring more about how it looks than what it is.",
  "What you both value, and what you own together, is at the centre. You are drawn together over shared values, and a clash of values or money would be serious.",
  "Talk is the centre of this relationship: ideas, opinions and everyday exchange. The risk is that talking takes the place of feeling.",
  "This relationship goes down to the roots. You share your inner lives, a background in common, and most likely a home.",
  "This relationship is about enjoyment and being yourself with the other person. You stay two individuals, so staying power has to come from elsewhere in the chart.",
  "This relationship is built around duties and tasks. Between lovers it can feel like work, and it is at its best when there is real work to do together.",
  "This relationship is a partnership in the full sense: you think of yourselves as “we”. If it goes wrong, it turns into rivalry.",
  "This relationship changes both of you. It feels fated, it goes deep, and shared resources matter in it.",
  "This relationship widens both your worlds. A shared outlook and good conversation are essential to it, and losing them is the main risk.",
  "This relationship asks what it is for. You share a direction, and how you stand in the world as a couple matters to you both.",
  "This is friendship and shared hopes as much as romance. You like each other, share a great deal of life, and it suits a long relationship.",
  "This relationship brings up what each of you keeps hidden, and habits neither of you is aware of can undermine it. It is intense, and it needs complete honesty to work.",
];

type Tone = "easy" | "hard" | "mixed";
/** Aspects to the composite Sun and Moon: how the two of you handle what the relationship is about. */
const ASPECTS: Record<string, { conj: [Tone, string]; soft: [Tone, string]; hard: [Tone, string] }> = {
  "sun-moon": {
    conj: ["easy", "You are single-minded as a pair, complement each other, and the attraction is strong. It feels like the start of something."],
    soft: ["easy", "Basic compatibility. You are at ease, accept each other, and swap roles easily. Lovers who are also friends."],
    hard: ["mixed", "There is a tension at the root and you are not quite at ease, yet you fascinate each other. It is intense, and differences have to be aired."],
  },
  "sun-mercury": { conj: ["easy", "You talk a great deal and think alike, and can discuss the relationship itself calmly. Talking is not the same as emotional contact."], soft: ["easy", ""], hard: ["mixed", ""] },
  "sun-venus": { conj: ["easy", "One of the strongest signs of love itself, as distinct from attraction. The feeling runs deep enough that a serious conflict would hurt badly."], soft: ["easy", ""], hard: ["mixed", ""] },
  "sun-mars": {
    conj: ["mixed", "High energy and plenty of friction that can be put to use. Air grievances as they come, and be physically active together."],
    soft: ["easy", "You have more energy together than apart and work well as a team. Your competitiveness points outward."],
    hard: ["hard", "Your egos compete and you fight. It goes best when the energy is turned outward into something you do together."],
  },
  "sun-jupiter": {
    conj: ["easy", "Growth, contentment and good fortune. Among the most helpful things a relationship can have."],
    soft: ["easy", "Ease, optimism and big plans. You open doors for each other."],
    hard: ["mixed", "Restless and inclined to overreach, or to ask a great deal of each other. It works when you help more than you demand."],
  },
  "sun-saturn": {
    conj: ["mixed", "A serious relationship that teaches you both. It can feel confining, and it lasts when the discipline is wanted."],
    soft: ["easy", "Sober, stable and durable. You are reserved about showing feeling, and should guard against getting rigid."],
    hard: ["hard", "You work at cross purposes and criticise, and one can hold the other down. It needs breathing space, tolerance and real affection to last."],
  },
  "sun-uranus": {
    conj: ["mixed", "This relationship shakes you both and follows no usual pattern. Permanence is not guaranteed."],
    soft: ["easy", "Stimulating and open. You make your own rules and try new things, and it needs honesty and freedom."],
    hard: ["hard", "Restless and unstable, with a nervous charge between you. Possessiveness is impossible here."],
  },
  "sun-neptune": {
    conj: ["mixed", "Either a high ideal or a shared illusion. It can be close without being physical, and one of you may play rescuer."],
    soft: ["easy", "An idealised, unspoken rapport and generous giving. Weak on the practical side."],
    hard: ["hard", "It is hard to see each other clearly, and disappointment follows. It needs realism and equal footing."],
  },
  "sun-pluto": {
    conj: ["mixed", "A deep and lasting change in both of you. Crises in this relationship are really turning points."],
    soft: ["easy", "Depth, intensity and staying power. It matters a great deal to you both and is never light."],
    hard: ["hard", "Power struggles: each tries to remake the other. One of you can end up overpowered."],
  },
  "moon-venus": {
    conj: ["easy", "One of the best things a relationship can have: love that is openly shown."],
    soft: ["easy", "Relaxed, steady affection. Friends and lovers, and good for the long term."],
    hard: ["easy", "A strong, compelling attraction that carries you through bad times, with some emotional ups and downs."],
  },
  "moon-mars": {
    conj: ["mixed", "Very strong feelings in both directions: fights and intense reconciliations, and a lot of physical energy."],
    soft: ["easy", "Emotionally engaged with good physical energy. It needs active outlets and free expression."],
    hard: ["hard", "Touchy, with quick anger; each feels their individuality challenged. Say what you feel, and keep it under control."],
  },
  "moon-jupiter": {
    conj: ["easy", "You feel good together: warm, protective, generous and fair in a dispute."],
    soft: ["easy", "You feel good together: warm, protective, generous and fair in a dispute."],
    hard: ["easy", "Still a kind influence: high spirits, tolerance and indulgence, sometimes too much of each."],
  },
  "moon-saturn": {
    conj: ["hard", "There is an emotional barrier between you. Duty comes before joy, and you analyse where you could feel."],
    soft: ["easy", "Serious, careful and emotionally steady. Undemonstrative and durable."],
    hard: ["hard", "A lack of emotional warmth: you can be lonely in each other’s company, and criticism comes easily."],
  },
  "moon-uranus": {
    conj: ["mixed", "Exciting and unsettled. An unusual pairing that needs freedom."],
    soft: ["easy", "Open and unconventional, close in an on-and-off way. Freedom comes first."],
    hard: ["hard", "Sudden flare-ups and cooling off. Unstable for love and easier as friendship."],
  },
};

/** Between two points of the composite: tighter than natal orbs, since both ends are already averages. */
const ORBS: [AspectName, number, number, "conj" | "soft" | "hard"][] = [
  ["conjunction", 0, 6, "conj"], ["opposition", 180, 6, "hard"], ["square", 90, 6, "hard"], ["trine", 120, 6, "soft"], ["sextile", 60, 3, "soft"],
];

export interface Composite {
  /** How the composite relates to the two people's own charts. */
  pattern: string | null;
  /** Readings in order: the story between you, the Sun, the Moon, how you come across, affection and desire, where the work is. */
  sections: { title: string; intro: string; items: Insight[] }[];
  /** The other planets by house, one line each. */
  others: Insight[];
  /** Aspects to the composite Sun and Moon. */
  easy: Insight[];
  hard: Insight[];
  notes: string[];
  /** Longitudes for timing. */
  points: { sun: number; moon: number | null; venus: number; asc: number | null; mc: number | null };
  /** The composite as a chart, for drawing its wheel and tables. */
  chart: Chart;
}

const five = (c: Chart): number[] => [c.bodies.sun.lon, c.bodies.venus.lon, c.bodies.mars.lon, ...(c.houses ? [c.bodies.moon.lon, c.houses.asc] : [])].map(signIndex);

/**
 * @param houses composite houses, derived on the server from the midpoint of the two Midheavens
 *               (lib/server/readings.ts); null when either birth time is unknown.
 */
export function composite(you: Chart, them: Chart, houses: { cusps: number[]; asc: number; mc: number; located?: boolean } | null, name: string): Composite {
  const moonOk = !!you.houses && !!them.houses;
  const notes: string[] = [];
  const lon = {} as Record<BodyId, number>;
  for (const id of [...PLANETS, "node"] as BodyId[]) lon[id] = midpoint(you.bodies[id].lon, them.bodies[id].lon);
  const used = PLANETS.filter((id) => id !== "moon" || moonOk);

  for (const id of ["sun", "moon"] as const)
    if (used.includes(id) && Math.abs(delta(you.bodies[id].lon, them.bodies[id].lon)) > 150)
      notes.push(`Your two ${POINT_NAMES[id]}s are nearly opposite each other, so the composite ${POINT_NAMES[id]} could almost as easily sit at the opposite point. Read its opposite sign and house as well.`);
  if (!houses) notes.push("The houses and rising sign of the relationship’s chart need both birth times. Without them it is read by sign only.");
  else if (!houses.located) notes.push(`These houses use the average of your two birthplaces. Add where you first met, on ${name}’s details, to cast them for that place.`);

  const chart: Chart = {
    bodies: Object.fromEntries(([...PLANETS, "node"] as BodyId[]).map((id) => [id, { lon: lon[id], speed: 0 }])) as Chart["bodies"],
    houses: houses ? { cusps: houses.cusps, asc: houses.asc, mc: houses.mc } : null,
    moonSignCertain: moonOk,
    utc: "",
  };
  const house = (at: number) => (houses ? houseOf(at, houses.cusps) : null);
  // Each composite placement is weighed by the aspects that planet makes within the composite chart.
  const read = (entry: Reading, id: BodyId | null): { body: string; expressions: string[]; lean?: string; basis: string } =>
    id ? weigh(entry, aspectsTo(chart, id), "the relationship’s chart") : { body: entry.core, expressions: entry.expressions, basis: "" };
  const bySign = (label: string, at: number, texts: Reading[], id: BodyId | null): Insight => {
    const r = read(texts[signIndex(at)]!, id);
    return { title: `${label} In ${SIGNS[signIndex(at)]!.name}`, body: r.body, expressions: r.expressions, lean: r.lean, basis: `Composite ${label} by sign${r.basis ? `; ${r.basis}` : ""}` };
  };
  const byHouse = (label: string, at: number, texts: Reading[], id: BodyId | null): Insight[] => {
    const h = house(at);
    if (!h) return [];
    const r = read(texts[h - 1]!, id);
    return [{ title: `${label} In The ${ordinal(h)} House`, body: r.body, expressions: r.expressions, lean: r.lean, basis: `Composite ${label} by house${r.basis ? `; ${r.basis}` : ""}` }];
  };

  const sections: Composite["sections"] = [];
  const south = (lon.node + 180) % 360;
  sections.push({
    title: "The story between you",
    intro: "The lunar nodes of the relationship’s chart: the familiar pattern the two of you fall into, and what you are growing toward together.",
    items: [{ title: `South Node In ${SIGNS[signIndex(south)]!.name}`, body: C_NODES_SIGN[signIndex(south)]!.core, expressions: C_NODES_SIGN[signIndex(south)]!.expressions, basis: "Composite nodes by sign" }, ...byHouse("South Node", south, C_NODES_HOUSE, null)],
  });
  sections.push({ title: "What keeps you alive", intro: "The composite Sun: what the relationship runs on.", items: [bySign("Sun", lon.sun, C_SUN_SIGN, "sun"), ...byHouse("Sun", lon.sun, C_SUN_HOUSE, "sun")] });
  if (moonOk) sections.push({ title: "What your hearts need", intro: "The composite Moon: what the two of you need in order to feel at home together.", items: [bySign("Moon", lon.moon, C_MOON_SIGN, "moon"), ...byHouse("Moon", lon.moon, C_MOON_HOUSE, "moon")] });
  if (houses) sections.push({ title: "How you come across", intro: "The composite rising sign: how the two of you meet the world as a pair.", items: [{ title: `${SIGNS[signIndex(houses.asc)]!.name} Rising`, body: C_RISING_SIGN[signIndex(houses.asc)]!.core, expressions: C_RISING_SIGN[signIndex(houses.asc)]!.expressions, basis: "Composite Ascendant by sign" }] });
  sections.push({
    title: "Affection and desire",
    intro: "Composite Venus and Mars: how affection is kept alive, and how desire and tension are handled.",
    items: [bySign("Venus", lon.venus, C_VENUS_SIGN, "venus"), ...byHouse("Venus", lon.venus, C_VENUS_HOUSE, "venus"), bySign("Mars", lon.mars, C_MARS_SIGN, "mars"), ...byHouse("Mars", lon.mars, C_MARS_HOUSE, "mars")],
  });

  const work: Insight[] = byHouse("Saturn", lon.saturn, C_SATURN_HOUSE, "saturn");
  if (houses) {
    const counts = Array.from({ length: 12 }, () => [] as string[]);
    for (const id of used) counts[houseOf(lon[id], houses.cusps) - 1]!.push(POINT_NAMES[id]);
    counts.forEach((names, i) => {
      if (names.length >= 4) work.unshift({ title: `Centred On The ${ordinal(i + 1)} House`, body: HOUSE_EMPHASIS[i]!, basis: `${names.join(", ")} in the composite ${ordinal(i + 1)} house` });
    });
  }
  if (work.length) sections.push({ title: "Where the work is", intro: "Composite Saturn, and any house that holds four or more planets.", items: work });

  const others: Insight[] = (["mercury", "jupiter", "uranus", "neptune", "pluto"] as const).flatMap((id) => byHouse(POINT_NAMES[id], lon[id], C_OTHER_HOUSE[id], id));

  const found: (Insight & { tone: Tone; orb: number })[] = [];
  for (const [key, texts] of Object.entries(ASPECTS)) {
    const [a, b] = key.split("-") as [BodyId, BodyId];
    if (!used.includes(a) || !used.includes(b)) continue;
    const sep = separation(lon[a], lon[b]);
    let hit = ORBS.find(([, angle, orb]) => Math.abs(sep - angle) <= orb);
    if (!hit) continue;
    // The inner planets never really oppose the Sun: such a composite opposition is read as a conjunction.
    if (hit[0] === "opposition" && (key === "sun-venus" || key === "sun-mercury")) hit = ["conjunction", 180, hit[2], "conj"];
    const [tone, body] = texts[hit[3]];
    if (!body) continue;
    found.push({ title: `${POINT_NAMES[a]} ${hit[0]} ${POINT_NAMES[b]}`.replace(/\b\w/g, (c) => c.toUpperCase()), body, basis: `Composite ${POINT_NAMES[a]} ${hit[0]} ${POINT_NAMES[b]}, ${Math.abs(sep - hit[1]).toFixed(1)}° from exact`, tone, orb: Math.abs(sep - hit[1]) });
  }
  found.sort((p, q) => p.orb - q.orb);
  const strip = ({ title, body, basis }: Insight) => ({ title, body, basis });

  // Which of you the relationship's chart resembles: its Sun, Moon, rising sign, Venus and Mars against your own. A guideline.
  const mine = new Set(five(you)), theirs = new Set(five(them));
  const key = [signIndex(lon.sun), signIndex(lon.venus), signIndex(lon.mars), ...(moonOk ? [signIndex(lon.moon)] : []), ...(houses ? [signIndex(houses.asc)] : [])];
  const a = key.filter((x) => mine.has(x)).length, b = key.filter((x) => theirs.has(x)).length;
  const pattern = a >= 2 && b >= 2 ? C_PATTERNS.shared : a >= 2 || b >= 2 ? C_PATTERNS.lopsided.replaceAll("{A}", a > b ? "you" : name).replaceAll("{B}", a > b ? name : "you") : C_PATTERNS.apart;

  return {
    pattern,
    sections,
    others,
    easy: found.filter((f) => f.tone === "easy").map(strip),
    hard: found.filter((f) => f.tone !== "easy").map(strip),
    notes,
    chart,
    points: { sun: lon.sun, moon: moonOk ? lon.moon : null, venus: lon.venus, asc: houses?.asc ?? null, mc: houses?.mc ?? null },
  };
}
