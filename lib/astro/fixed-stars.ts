/**
 * The traditional fixed stars checked against a chart: the brightest stars
 * plus the ones the astrological tradition names most often. Natures follow
 * Ptolemy (as the planets they act like); keywords are the commonly cited
 * traditional associations (Robson, Brady), given as a starting point for
 * interpretation, not a verdict.
 */
import type { ChartPoints } from "./types";

export interface StarInfo { name: string; nature: string; keywords: string }

export const FIXED_STARS: StarInfo[] = [
  { name: "Aldebaran", nature: "Mars", keywords: "Integrity, eloquence, success that lasts while honor is kept" },
  { name: "Regulus", nature: "Mars–Jupiter", keywords: "Leadership, success and fame; downfall if revenge is pursued" },
  { name: "Antares", nature: "Mars–Jupiter", keywords: "Courage, intensity, obsession, bold risk" },
  { name: "Fomalhaut", nature: "Venus–Mercury", keywords: "Vision, idealism, artistic inspiration; needs integrity to last" },
  { name: "Spica", nature: "Venus–Mars", keywords: "Gifts, talent, brilliance, protection" },
  { name: "Arcturus", nature: "Mars–Jupiter", keywords: "Pathfinding, prosperity through enterprise, new directions" },
  { name: "Vega", nature: "Venus–Mercury", keywords: "Charisma, artistic or magical talent, public fame that can be fleeting" },
  { name: "Sirius", nature: "Jupiter–Mars", keywords: "Fame, honor, devotion, burning ambition" },
  { name: "Canopus", nature: "Saturn–Jupiter", keywords: "Navigation, education, long journeys, guiding others" },
  { name: "Capella", nature: "Mars–Mercury", keywords: "Curiosity, learning, civic and military honors" },
  { name: "Rigel", nature: "Jupiter–Saturn", keywords: "Teaching, invention, lasting achievement" },
  { name: "Betelgeuse", nature: "Mars–Mercury", keywords: "Success, honors, good fortune in action" },
  { name: "Procyon", nature: "Mercury–Mars", keywords: "Quick rise, activity; success that needs pacing" },
  { name: "Pollux", nature: "Mars", keywords: "Courage, sharp wit, competitiveness" },
  { name: "Castor", nature: "Mercury", keywords: "Intellect, writing, sudden gains and losses" },
  { name: "Altair", nature: "Mars–Jupiter", keywords: "Boldness, ambition, sudden opportunity" },
  { name: "Deneb Algedi", nature: "Saturn–Jupiter", keywords: "Law and justice, both sorrow and success" },
  { name: "Algol", nature: "Saturn–Jupiter", keywords: "Intensity, raw power, danger and transformation" },
  { name: "Alcyone", nature: "Moon–Mars", keywords: "Ambition and vision, prominence with sorrow" },
  { name: "Mirach", nature: "Venus", keywords: "Beauty, love, fame through art, good fortune in marriage" },
  { name: "Alpheratz", nature: "Jupiter–Venus", keywords: "Independence, freedom, honors" },
  { name: "Markab", nature: "Mars–Mercury", keywords: "Honors and riches, with risk of injury or setback" },
  { name: "Scheat", nature: "Mars–Mercury", keywords: "Independent thought, misfortune if reckless" },
  { name: "Achernar", nature: "Jupiter", keywords: "Success in public office, honors" },
  { name: "Hamal", nature: "Mars–Saturn", keywords: "Independence, headstrong drive" },
  { name: "Menkar", nature: "Saturn", keywords: "Collective burdens, disgrace or illness to be overcome" },
  { name: "Alphecca", nature: "Venus–Mercury", keywords: "Dignity, artistic ability" },
  { name: "Zosma", nature: "Saturn–Venus", keywords: "Strength through hardship, egotism" },
  { name: "Denebola", nature: "Saturn–Venus", keywords: "Going against convention; honors then setbacks" },
  { name: "Vindemiatrix", nature: "Saturn–Mercury", keywords: "Falsity and disgrace; the need for honesty" },
  { name: "Acrux", nature: "Jupiter", keywords: "Ceremony, mysticism, service" },
  { name: "Zuben Elgenubi", nature: "Saturn–Mars", keywords: "Social reform; slander, unforgiving judgments" },
  { name: "Zuben Eschamali", nature: "Jupiter–Mercury", keywords: "Good fortune, honor, ambition" },
  { name: "Rasalhague", nature: "Saturn–Venus", keywords: "Healing knowledge, the healer's path" },
  { name: "Facies", nature: "Sun–Mars", keywords: "Sharp focus, ruthlessness" },
  { name: "Nunki", nature: "Jupiter–Mercury", keywords: "Truthfulness, optimism, faith" },
  { name: "Bellatrix", nature: "Mars–Mercury", keywords: "Quick decisions, early success" },
  { name: "Polaris", nature: "Saturn–Venus", keywords: "Direction, guidance, purpose" },
  { name: "Rigil Kentaurus", nature: "Venus–Jupiter", keywords: "Friendship, refinement, social position" },
  { name: "Agena", nature: "Venus–Jupiter", keywords: "Morality, friendship, honors" },
];

const sep = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);

export interface StarContact { star: StarInfo; point: string; orb: number; starLon: number; starLat: number }

/**
 * Stars conjunct a chart's planets and angles (by ecliptic longitude): within
 * 1.5° of a luminary or angle, 1° of a planet. Parans are not computed.
 */
export function starContacts(p: ChartPoints, stars: { name: string; lon: number; lat: number }[], extra: Record<string, number> = {}): StarContact[] {
  const points: Record<string, number> = { Ascendant: p.asc, Midheaven: p.mc, Descendant: (p.asc + 180) % 360, IC: (p.mc + 180) % 360, ...extra };
  for (const b of p.bodies) if (["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"].includes(b.id)) points[b.id] = b.lon;
  const out: StarContact[] = [];
  for (const s of stars) {
    const info = FIXED_STARS.find((x) => x.name === s.name);
    if (!info) continue;
    for (const [k, v] of Object.entries(points)) {
      const wide = ["sun", "moon", "Ascendant", "Midheaven", "Descendant", "IC"].includes(k);
      const orb = sep(s.lon, v);
      if (orb <= (wide ? 1.5 : 1)) out.push({ star: info, point: k, orb, starLon: s.lon, starLat: s.lat });
    }
  }
  return out.sort((a, b) => a.orb - b.orb);
}
