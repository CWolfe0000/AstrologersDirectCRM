import type { BodyId, Chart } from "@/lib/astro/types";
import { delta, midpoint, separation } from "@/lib/astro/spherical";
import { POINT_NAMES, SIGNS, houseOf, ordinal, signIndex, type AspectName } from "@/lib/astro/zodiac";
import type { Insight } from "./own";
import { SIGN_QUALITY } from "./text";

/**
 * The composite chart: the relationship as a thing in its own right.
 *
 * The method follows Robert Hand, "Planets in Composite", chapters 1, 2 and 4–6 (the part of the
 * book we could read): each planet is the nearer midpoint of the two natal planets, the houses
 * come from the midpoint of the two Midheavens, and the chart is read by house emphasis, the
 * houses of the Sun and Moon, and the aspects to the Sun and Moon. He does not read composite
 * planets by sign, beyond a later note that the signs of the Sun, Moon and Ascendant matter, so
 * signs are a supplement here. His Venus, Mars and Saturn chapters were not available, so those
 * planets are read only through their aspects to the Sun and Moon. The wording is our own.
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

/** The composite Sun by house: what the relationship is for and where its main issues lie. */
const SUN_HOUSE = [
  "An unusually important relationship. You are stronger as a pair than apart and are seen as a unit. Very good for love and for marriage; watch for caring too much about appearances.",
  "The focus is on what you value and own together. A good base for practical partnership and neutral for romance. A difference in values would go deep.",
  "The focus is on communication and ideas. You have real mental rapport, more naturally as friends than lovers, and a habit of talking about feelings instead of having them.",
  "The focus is on home, roots and private life, with strong emotional involvement. One of the best placements for living together. The risk is losing perspective.",
  "The focus is on enjoyment and being yourselves. One of the best placements for a love affair and for friendship. Each of you needs room, and it is not in itself a sign of the long haul.",
  "A harder placement: one tends to give and the other to take, and either can feel used. It works when you serve something together, or each other equally.",
  "An equal partnership working as a unit, and usually the best placement for marriage. The other side of it is competing with each other.",
  "A relationship that feels fated and changes both of you. Sex matters and is not casual, and so do shared resources.",
  "The focus is on growing: ideals, a shared philosophy, travel. It can lean toward the platonic or the intellectual.",
  "A significant relationship with a shared purpose and direction. The risk is fixing how things look from outside while problems inside go unattended.",
  "The focus is on friendship and shared hopes. Excellent for almost any relationship, especially marriage, though it does not in itself show physical attraction.",
  "A challenging placement that brings out hidden sides of you both, and the relationship itself may be kept private or misunderstood. It needs total honesty before any commitment.",
];

/** The composite Moon by house: where you feel most in common. */
const MOON_HOUSE = [
  "Feelings are out in the open and you sense you belong together. The risk is losing your objectivity about each other.",
  "You are drawn together by a need for security, emotional and material. You may stay together for that security.",
  "You communicate through feeling and share opinions. Talking a problem through coolly is the hard part.",
  "The most natural placement for the Moon: shared background, a home, and emotional security in each other. Do not swallow grievances to keep the peace.",
  "You are together because it feels good: fun, easy emotional expression, and often a wish for children. Getting serious is the hard part.",
  "It can feel like a task, with one of you in the lesser role. It needs an equal exchange of looking after each other.",
  "You share feelings so closely that you can feel like one person. Very good for marriage; under stress you lose perspective together.",
  "The relationship turns you both inward and changes you, a little like therapy. It can get heavy and moody.",
  "You share an outlook and teach each other, often with travel or another culture involved. It leans toward friendship of the mind.",
  "You share a wish to get on in the world and make a good impression together. The risk is blaming outside things for emotional problems.",
  "There is a steady emotional sympathy under everything, with shared goals and friends. One of the better placements for love and friendship together.",
  "A demanding placement: feelings are hidden, even from yourselves, and can come out later all at once. It needs honest looking at yourselves together.",
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
  /** House emphasis and the Sun and Moon by house (needs both birth times). */
  core: Insight[];
  /** Aspects to the composite Sun and Moon. */
  easy: Insight[];
  hard: Insight[];
  /** Sun and Moon by sign: a supplement. */
  signs: Insight[];
  notes: string[];
  /** Longitudes for timing. */
  points: { sun: number; moon: number | null; venus: number; asc: number | null; mc: number | null };
}

/**
 * @param houses composite houses, derived on the server from the midpoint of the two Midheavens
 *               (lib/server/readings.ts); null when either birth time is unknown.
 */
export function composite(you: Chart, them: Chart, houses: { cusps: number[]; asc: number; mc: number } | null): Composite {
  const moonOk = !!you.houses && !!them.houses;
  const notes: string[] = [];
  const lon = {} as Record<BodyId, number>;
  for (const id of PLANETS) lon[id] = midpoint(you.bodies[id].lon, them.bodies[id].lon);
  // The inner planets can never really oppose the Sun: such a composite opposition is read as a conjunction.
  for (const id of ["mercury", "venus"] as const) if (separation(lon.sun, lon[id]) > 90) lon[id] = (lon[id] + 180) % 360;
  const used = PLANETS.filter((id) => id !== "moon" || moonOk);

  for (const id of ["sun", "moon"] as const)
    if (used.includes(id) && Math.abs(delta(you.bodies[id].lon, them.bodies[id].lon)) > 150)
      notes.push(`Your two ${POINT_NAMES[id]}s are nearly opposite each other, so the composite ${POINT_NAMES[id]} works from the opposite point as well: read its opposite house and sign too.`);

  const core: Insight[] = [];
  if (houses) {
    const counts = Array.from({ length: 12 }, () => [] as string[]);
    for (const id of used) counts[houseOf(lon[id], houses.cusps) - 1]!.push(POINT_NAMES[id]);
    counts.forEach((names, i) => {
      if (names.length >= 4) core.push({ title: `Centred On The ${ordinal(i + 1)} House`, body: HOUSE_EMPHASIS[i]!, basis: `${names.join(", ")} in the composite ${ordinal(i + 1)} house` });
    });
    const sunHouse = houseOf(lon.sun, houses.cusps);
    core.push({ title: "What This Relationship Is For", body: SUN_HOUSE[sunHouse - 1]!, basis: `Composite Sun in the ${ordinal(sunHouse)} house` });
    if (moonOk) {
      const moonHouse = houseOf(lon.moon, houses.cusps);
      core.push({ title: "Where You Feel Most In Common", body: MOON_HOUSE[moonHouse - 1]!, basis: `Composite Moon in the ${ordinal(moonHouse)} house` });
    }
  } else {
    notes.push("The houses of the relationship’s chart need both birth times. Without them, it is read from the aspects to its Sun and from its Sun sign.");
  }

  const found: (Insight & { tone: Tone; orb: number })[] = [];
  for (const [key, texts] of Object.entries(ASPECTS)) {
    const [a, b] = key.split("-") as [BodyId, BodyId];
    if (!used.includes(a) || !used.includes(b)) continue;
    const sep = separation(lon[a], lon[b]);
    const hit = ORBS.find(([, angle, orb]) => Math.abs(sep - angle) <= orb);
    if (!hit) continue;
    const [tone, body] = texts[hit[3]];
    if (!body) continue;
    found.push({ title: `${POINT_NAMES[a]} ${hit[0]} ${POINT_NAMES[b]}`.replace(/\b\w/g, (c) => c.toUpperCase()), body, basis: `Composite ${POINT_NAMES[a]} ${hit[0]} ${POINT_NAMES[b]}, ${Math.abs(sep - hit[1]).toFixed(1)}° from exact`, tone, orb: Math.abs(sep - hit[1]) });
  }
  found.sort((p, q) => p.orb - q.orb);
  const strip = ({ title, body, basis }: Insight) => ({ title, body, basis });

  const sign = (label: string, at: number, lead: string): Insight => {
    const [like, needs] = SIGN_QUALITY[signIndex(at)]!;
    return { title: `${label} In ${SIGNS[signIndex(at)]!.name}`, body: `${lead} ${like}. It does best with ${needs}.`, basis: `Composite ${label} by sign` };
  };
  const signs = [sign("Sun", lon.sun, "The basic character of the relationship is")];
  if (moonOk) signs.push(sign("Moon", lon.moon, "The emotional climate between you is"));

  return {
    core,
    easy: found.filter((f) => f.tone === "easy").map(strip),
    hard: found.filter((f) => f.tone !== "easy").map(strip),
    signs,
    notes,
    points: { sun: lon.sun, moon: moonOk ? lon.moon : null, venus: lon.venus, asc: houses?.asc ?? null, mc: houses?.mc ?? null },
  };
}
