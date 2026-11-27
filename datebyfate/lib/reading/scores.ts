import type { BodyId, Chart, PointId } from "@/lib/astro/types";
import { COUPLE_ORBS, POINT_NAMES, SIGNS, aspectBetween, elementOf, signIndex } from "@/lib/astro/zodiac";
import { relationOf } from "./elements";

/**
 * Compatibility scores between two charts.
 *
 * The basis is Stephen Arroyo's method of comparing two charts planet by planet through the
 * elements ("Astrology, Psychology and the Four Elements", chs. 10 and 15): the same element is
 * the closest harmony, the other element of the same pair (fire with air, earth with water) is
 * compatible, and a mix across the pairs is discordant. Arroyo describes these as levels of
 * energy attunement and does not put numbers on them. The numbers, the choice of which planets
 * feed which area, and the weight given to exact aspects between the charts are Datebyfate's own.
 *
 * Each area is a weighted average of its links, 0 to 100. A link is either an element comparison
 * (same 100, compatible 75, discordant 15) or an aspect actually made between the two planets
 * (conjunction 100, trine 90, sextile 80, opposition 35, square 20). In the physical area any
 * aspect is a charge, so hard aspects score 70 there. The values are set so that two charts
 * picked at random average close to 50.
 * A link that cannot be computed (no birth time: Moon sign uncertain, no rising sign) is left out.
 */

export type AreaId = "identity" | "emotional" | "love" | "intellectual" | "physical" | "lasting";

export interface Factor {
  /** "Your Venus in Pisces, Sam’s Moon in Cancer: water with water" */
  label: string;
  value: number;
  weight: number;
}

export interface AreaScore {
  id: AreaId;
  title: string;
  /** What this area measures, one line. */
  about: string;
  score: number;
  band: string;
  factors: Factor[];
}

export interface Scores {
  overall: number;
  band: string;
  areas: AreaScore[];
  notes: string[];
}

type Link = { mine: PointId; theirs: PointId; weight: number; both?: boolean };

const AREAS: { id: AreaId; title: string; about: string; links: Link[]; aspects: [PointId, PointId][]; charge?: boolean; anyAspect?: boolean }[] = [
  {
    id: "identity",
    title: "Core Harmony",
    about: "Sun and Moon against Sun and Moon: whether each of you can be yourself with the other. Arroyo treats this as the base of lasting love.",
    links: [{ mine: "sun", theirs: "sun", weight: 2 }, { mine: "sun", theirs: "moon", weight: 3, both: true }, { mine: "moon", theirs: "moon", weight: 3 }, { mine: "asc", theirs: "asc", weight: 1 }, { mine: "asc", theirs: "sun", weight: 1, both: true }],
    aspects: [["sun", "sun"], ["sun", "moon"], ["moon", "moon"], ["sun", "asc"], ["moon", "asc"]],
  },
  {
    id: "emotional",
    title: "Emotional Compatibility",
    about: "The Moon: how each of you reacts, what you need in order to feel safe, and whether the other’s way of caring reaches you.",
    links: [{ mine: "moon", theirs: "moon", weight: 3 }, { mine: "moon", theirs: "venus", weight: 2, both: true }, { mine: "moon", theirs: "sun", weight: 2, both: true }, { mine: "moon", theirs: "asc", weight: 1, both: true }],
    aspects: [["moon", "moon"], ["moon", "venus"], ["moon", "sun"], ["moon", "saturn"], ["moon", "neptune"], ["moon", "pluto"], ["moon", "jupiter"]],
  },
  {
    id: "love",
    title: "Love Language",
    about: "Venus: how each of you gives and takes in affection, what feels like love, and whether the other’s way of showing it lands.",
    links: [{ mine: "venus", theirs: "venus", weight: 3 }, { mine: "venus", theirs: "moon", weight: 2, both: true }, { mine: "venus", theirs: "sun", weight: 2, both: true }, { mine: "venus", theirs: "asc", weight: 1, both: true }],
    aspects: [["venus", "venus"], ["venus", "moon"], ["venus", "sun"], ["venus", "asc"], ["venus", "jupiter"], ["venus", "saturn"], ["venus", "neptune"]],
  },
  {
    id: "intellectual",
    title: "Intellectual Compatibility",
    about: "Mercury: how each of you thinks and talks, and whether you understand each other without translating.",
    links: [{ mine: "mercury", theirs: "mercury", weight: 3 }, { mine: "mercury", theirs: "sun", weight: 1.5, both: true }, { mine: "mercury", theirs: "moon", weight: 1.5, both: true }],
    aspects: [["mercury", "mercury"], ["mercury", "sun"], ["mercury", "moon"], ["mercury", "jupiter"], ["mercury", "uranus"], ["mercury", "saturn"]],
  },
  {
    id: "physical",
    title: "Physical Compatibility",
    about: "Mars and Venus: desire, pursuit and physical ease. Between these planets any aspect is a charge, the hard ones included.",
    links: [{ mine: "mars", theirs: "venus", weight: 3, both: true }, { mine: "mars", theirs: "mars", weight: 2 }, { mine: "mars", theirs: "moon", weight: 1, both: true }, { mine: "mars", theirs: "asc", weight: 1, both: true }],
    aspects: [["mars", "venus"], ["mars", "mars"], ["venus", "pluto"], ["mars", "pluto"], ["mars", "asc"], ["venus", "uranus"], ["mars", "sun"], ["mars", "moon"]],
    charge: true,
  },
  {
    id: "lasting",
    title: "Staying Power",
    about: "Saturn: one person’s Saturn in aspect to the other’s Sun, Moon, Venus or rising sign binds a couple. Close contacts count here whatever the aspect; none at all leaves this low.",
    links: [],
    aspects: [["saturn", "sun"], ["saturn", "moon"], ["saturn", "venus"], ["saturn", "asc"]],
    anyAspect: true,
  },
];

const ELEMENT_VALUE = { same: 100, compatible: 75, discordant: 15 } as const;
const ASPECT_VALUE = { conjunction: 100, trine: 90, sextile: 80, opposition: 35, square: 20 } as const;
const WORD = { conjunction: "conjunct", opposition: "opposite", square: "square", trine: "trine", sextile: "sextile" } as const;

/** Bands for one area. Across random pairs an area runs from about 40 (lowest tenth) to about 75 (highest tenth). */
export const bandOf = (score: number) => (score >= 78 ? "Very High" : score >= 65 ? "High" : score >= 45 ? "Mixed" : score >= 30 ? "Low" : "Very Low");
/** The overall score averages six areas, so it bunches: random pairs run from about 49 (lowest tenth) to about 66 (highest tenth), median 57. */
export const overallBandOf = (score: number) => (score >= 70 ? "Very High" : score >= 62 ? "High" : score >= 52 ? "Mixed" : score >= 45 ? "Low" : "Very Low");

/** `you` is the member, `them` the other person. */
export function scoresBetween(you: Chart, them: Chart, name: string): Scores {
  const lonOf = (c: Chart, id: PointId) => (id === "asc" ? c.houses?.asc : id === "moon" && !c.moonSignCertain ? undefined : c.bodies[id as BodyId].lon);
  const label = (id: PointId) => (id === "asc" ? "rising sign" : POINT_NAMES[id]);
  const owner = (mineIsYou: boolean) => (mineIsYou ? ["Your", `${name}’s`] : [`${name}’s`, "your"]) as [string, string];

  const areas: AreaScore[] = AREAS.map((area) => {
    const factors: Factor[] = [];
    const element = (a: PointId, b: PointId, weight: number, mineIsYou: boolean) => {
      const la = lonOf(mineIsYou ? you : them, a), lb = lonOf(mineIsYou ? them : you, b);
      if (la === undefined || lb === undefined) return;
      const ea = elementOf(la), eb = elementOf(lb);
      const [p, q] = owner(mineIsYou);
      factors.push({ label: `${p} ${label(a)} in ${SIGNS[signIndex(la)]!.name}, ${q} ${label(b)} in ${SIGNS[signIndex(lb)]!.name}: ${ea} with ${eb}`, value: ELEMENT_VALUE[relationOf(ea, eb)], weight });
    };
    for (const l of area.links) {
      element(l.mine, l.theirs, l.weight, true);
      if (l.both) element(l.mine, l.theirs, l.weight, false);
    }
    const aspect = (a: PointId, b: PointId, mineIsYou: boolean) => {
      const la = lonOf(mineIsYou ? you : them, a), lb = lonOf(mineIsYou ? them : you, b);
      if (la === undefined || lb === undefined) return;
      const asp = aspectBetween(la, lb, COUPLE_ORBS);
      if (!asp) return;
      const hard = asp.name === "square" || asp.name === "opposition";
      const closeness = 1 - asp.orb / (COUPLE_ORBS[asp.name] + 1); // closer aspects weigh more
      const value = area.anyAspect ? (hard ? 75 : 100) : area.charge && hard ? 70 : ASPECT_VALUE[asp.name];
      const [p, q] = owner(mineIsYou);
      factors.push({ label: `${p} ${label(a)} ${WORD[asp.name]} ${q} ${label(b)}, ${asp.orb.toFixed(1)}° from exact`, value, weight: 1.5 + 2.5 * closeness });
    };
    for (const [a, b] of area.aspects) {
      aspect(a, b, true);
      if (a !== b) aspect(a, b, false);
    }
    let score: number;
    if (area.anyAspect) {
      // Saturn: each close contact adds; none leaves the couple without this glue.
      const sum = factors.reduce((t, f) => t + (f.value / 100) * (f.weight / 4), 0);
      score = Math.round(Math.min(100, 20 + 22 * sum));
    } else {
      const w = factors.reduce((t, f) => t + f.weight, 0);
      score = w ? Math.round(factors.reduce((t, f) => t + f.value * f.weight, 0) / w) : 0;
    }
    factors.sort((p, q) => q.weight - p.weight);
    return { id: area.id, title: area.title, about: area.about, score, band: bandOf(score), factors };
  });

  const usable = areas.filter((a) => a.factors.length || a.id === "lasting");
  const weightOf: Record<AreaId, number> = { identity: 3, emotional: 2, love: 2, intellectual: 1.5, physical: 1.5, lasting: 1 };
  const total = usable.reduce((t, a) => t + weightOf[a.id], 0);
  const overall = Math.round(usable.reduce((t, a) => t + a.score * weightOf[a.id], 0) / total);
  const notes: string[] = [];
  if (!you.houses || !them.houses) notes.push("Without both birth times the rising signs are left out, and a Moon that changed sign that day is left out too, so these scores rest on fewer links.");
  return { overall, band: overallBandOf(overall), areas: usable, notes };
}
