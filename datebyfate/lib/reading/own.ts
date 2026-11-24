import type { BodyId, Chart } from "@/lib/astro/types";
import { LUMINARY_ORBS, NATAL_ORBS, TIGHT_ORBS, POINT_NAMES, SIGNS, aspectBetween, houseOf, ordinal, signIndex, signName } from "@/lib/astro/zodiac";
import { ownStellium } from "./stellium";
import { DESCENDANT, DYNAMICS, KIND_NOTE, type Dynamic, IN_SEVENTH, MARS, MOON, RULER_HOUSE, VENUS, VENUS_HEADLINES } from "./text";

export interface Insight {
  title: string;
  body: string;
  /** The chart factor the text is based on. */
  basis: string;
}

export interface OwnPattern {
  headline: { name: string; line: string };
  core: Insight[];
  /** Needs a birth time. */
  drawnTo: Insight[];
  dynamics: Insight[];
  /** Three or more personal planets in one sign. */
  stellium: Insight | null;
  notes: string[];
}

export interface NatalAspect {
  /** Key into DYNAMICS, e.g. "venus-saturn". */
  key: string;
  x: BodyId;
  y: BodyId;
  dynamic: Dynamic;
  /** "Venus square Saturn" */
  label: string;
  orb: number;
  /** Close enough to be central; wider aspects are background. */
  tight: boolean;
  /** The difficult form of the dynamic. */
  hard: boolean;
  name: string;
  /** The reading said to the member, and about someone else. */
  you: string;
  them: string;
}

/** The aspects in one chart that make relationship dynamics. */
export function aspectsOf(chart: Chart): NatalAspect[] {
  const out: NatalAspect[] = [];
  for (const [key, d] of Object.entries(DYNAMICS)) {
    const [x, y] = key.split("-") as [BodyId, BodyId];
    // Without a birth time the Moon can be 6° either way: too loose for aspects.
    if (!chart.houses && (x === "moon" || y === "moon")) continue;
    const luminary = x === "sun" || x === "moon" || y === "sun" || y === "moon";
    const asp = aspectBetween(chart.bodies[x].lon, chart.bodies[y].lon, luminary ? LUMINARY_ORBS : NATAL_ORBS);
    if (!asp) continue;
    const conj = asp.name === "conjunction";
    const hard = (conj ? d.conj : asp.cls) === "hard";
    const kind = KIND_NOTE[asp.name]!;
    const slower = POINT_NAMES[y];
    // The kind of aspect is spelled out for the difficult form, where it changes how the pair is lived.
    const add = (text: string, note: string) => (hard || asp.name === "trine" ? `${text} ${note.replace("{S}", slower)}` : text);
    out.push({
      key, x, y, dynamic: d, orb: asp.orb, hard,
      label: `${POINT_NAMES[x]} ${asp.name} ${POINT_NAMES[y]}`,
      tight: asp.orb <= TIGHT_ORBS[asp.name],
      name: (conj && d.conjName) || (hard ? d.name : d.easyName),
      you: add((conj && d.conjYou) || (hard ? d.hard : d.flowing), kind.you),
      them: add((conj && d.conjThem) || (hard ? d.them : d.themEasy), kind.them),
    });
  }
  return out;
}

/** "Venus square Saturn, 2.1° from exact, close" */
export const aspectBasis = (a: NatalAspect) => `${a.label}, ${a.orb.toFixed(1)}° from exact, ${a.tight ? "close" : "wide"}`;

const firstSentence = (s: string) => s.slice(0, s.indexOf(". ") + 1 || s.length);

/** Your own relationship pattern, from your birth chart alone. */
export function ownPattern(chart: Chart): OwnPattern {
  const b = chart.bodies;
  const h = chart.houses;
  const notes: string[] = [];
  const place = (id: BodyId) => `${POINT_NAMES[id]} in ${signName(b[id].lon)}${h ? `, ${ordinal(houseOf(b[id].lon, h.cusps))} house` : ""}`;

  const core: Insight[] = [
    { title: "How you love", body: VENUS[signIndex(b.venus.lon)]!, basis: place("venus") },
    { title: "What you need to feel safe", body: MOON[signIndex(b.moon.lon)]!, basis: place("moon") + (chart.moonSignCertain ? "" : " (uncertain without a birth time)") },
    { title: "What you go after", body: MARS[signIndex(b.mars.lon)]!, basis: place("mars") },
  ];
  if (!chart.moonSignCertain) notes.push("The Moon changed sign on the day you were born, so your Moon sign depends on your birth time. The reading above uses noon.");

  const drawnTo: Insight[] = [];
  if (h) {
    const dsc = signIndex(h.asc + 180);
    drawnTo.push({ title: "Who you are drawn to", body: DESCENDANT[dsc]!, basis: `Descendant in ${SIGNS[dsc]!.name}` });
    const ruler = SIGNS[dsc]!.ruler;
    const rulerHouse = houseOf(b[ruler].lon, h.cusps);
    drawnTo.push({
      title: "Where partnership leads",
      body: RULER_HOUSE[rulerHouse - 1]!,
      basis: `${POINT_NAMES[ruler]}, ruler of your 7th house, in your ${ordinal(rulerHouse)} house`,
    });
    for (const id of Object.keys(IN_SEVENTH) as BodyId[])
      if (houseOf(b[id].lon, h.cusps) === 7) drawnTo.push({ title: `${POINT_NAMES[id]} in your house of partnership`, body: IN_SEVENTH[id]!, basis: `${POINT_NAMES[id]} in your 7th house` });
  } else {
    notes.push("Without a birth time we can’t work out your rising sign or houses, so the section on who you are drawn to is missing. Add your birth time to see it.");
  }

  const found: (Insight & { orb: number; hard: boolean })[] = aspectsOf(chart).map((a) => ({ title: a.name, body: a.you, basis: aspectBasis(a), orb: a.orb, hard: a.hard }));
  found.sort((p, q) => p.orb - q.orb);
  const dynamics = found.map(({ title, body, basis }) => ({ title, body, basis }));

  const lead = found.find((f) => f.hard) ?? null;
  const headline = lead
    ? { name: lead.title, line: firstSentence(lead.body) }
    : { name: VENUS_HEADLINES[signIndex(b.venus.lon)]!, line: firstSentence(VENUS[signIndex(b.venus.lon)]!) };

  return { headline, core, drawnTo, dynamics, stellium: ownStellium(chart), notes };
}

export type Placement = { point: string; sign: string };

/** The headline placements, for the strip above a reading. */
export function placementsOf(chart: Chart): Placement[] {
  const out = (["sun", "moon", "venus", "mars"] as const).map((id) => ({ point: POINT_NAMES[id], sign: signName(chart.bodies[id].lon) + (id === "moon" && !chart.moonSignCertain ? "?" : "") }));
  if (chart.houses) out.push({ point: "Rising", sign: signName(chart.houses.asc) });
  return out;
}
