/**
 * Length-of-life calculations from the traditional texts. These are historical
 * procedures; the sources disagree with one another, and the conventions used
 * here are stated in the UI so they can be checked.
 *
 * 1. Releaser and giver of years (hyleg / alcocoden; Valens' apheta and houseruler):
 *    - Releaser: by day Sun, then Moon; by night Moon, then Sun; then the
 *      Ascendant if the Moon is waxing (birth after a new moon) or the Lot of
 *      Fortune if waning, then the other. A luminary or the Lot must be in a
 *      releasing place (houses 1, 7, 9, 10, 11).
 *    - Giver of years: the planet with most dignity at the releaser's degree
 *      that also aspects it by sign (ties go to the term ruler). A candidate
 *      with no such planet is passed over for the next.
 *    - Years: greater if the giver is angular, middle if succedent, lesser if
 *      cadent. Venus and Jupiter aspecting the giver by sign add their lesser
 *      years; Mars and Saturn conjunct, square or opposite subtract theirs.
 * 2. Vital sector (Valens, Anthology III): from the releaser forward to the
 *    first body, square or opposition of Mars or Saturn, at most a quadrant
 *    (90°), turned into years by the rising times at the birth latitude
 *    (1° of oblique ascension = 1 year).
 */
import { DOMICILE, EXALT, faceRuler, isDayChart, lots, pointsAt, SEVEN, termRuler, triplicityRulers, type Planet7 } from "./traditional";
import type { ChartPoints } from "./types";

const RAD = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
const sign = (lon: number) => Math.floor(norm(lon) / 30);

/** Planetary years: lesser, middle, greater. */
export const PLANET_YEARS: Record<Planet7, [number, number, number]> = {
  saturn: [30, 43.5, 57], jupiter: [12, 45.5, 79], mars: [15, 40.5, 66], sun: [19, 69.5, 120],
  venus: [8, 45, 82], mercury: [20, 48, 76], moon: [25, 66.5, 108],
};

export type ReleaserId = "sun" | "moon" | "asc" | "fortune";
export type Grant = "greater" | "middle" | "lesser";
const RELEASING_HOUSES = [1, 7, 9, 10, 11];
const ASPECT_NAMES: Record<number, string> = { 0: "Conjunction", 2: "Sextile", 3: "Square", 4: "Trine", 6: "Opposition", 8: "Trine", 9: "Square", 10: "Sextile" };

/** Ptolemaic aspect by sign between two longitudes, or null if the signs are averse. */
export const signAspect = (a: number, b: number): string | null => ASPECT_NAMES[(sign(b) - sign(a) + 12) % 12] ?? null;

export function houseOf(lon: number, cusps: number[]) {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i]!, b = cusps[(i + 1) % 12]!;
    if (norm(lon - a) < norm(b - a)) return i + 1;
  }
  return 1;
}

/** The dignities a planet holds at a degree. */
export function dignitiesAt(planet: Planet7, lon: number, day: boolean) {
  const s = sign(lon), out: string[] = [];
  if (DOMICILE[s] === planet) out.push("Domicile");
  if (EXALT[s] === planet) out.push("Exaltation");
  if (triplicityRulers(lon)[day ? 0 : 1] === planet) out.push("Triplicity");
  if (termRuler(lon) === planet) out.push("Term");
  if (faceRuler(lon) === planet) out.push("Face");
  return out;
}

export interface Candidate {
  id: ReleaserId;
  lon: number;
  house: number;
  /** In a releasing place. */
  placed: boolean;
  /** The planet that would give the years, if any has dignity here and aspects the degree. */
  giver: Planet7 | null;
}

export interface LengthOfLife {
  day: boolean;
  waxing: boolean;
  candidates: Candidate[];
  releaser: Candidate;
  giver: { id: Planet7; house: number; dignities: string[]; aspect: string; grant: Grant; years: number } | null;
  changes: { id: Planet7; aspect: string; years: number }[];
  /** Null when no planet qualifies as giver of years. */
  years: number | null;
}

function findGiver(p: ChartPoints, lon: number, day: boolean): Planet7 | null {
  const pts = pointsAt(lon, day);
  const term = termRuler(lon);
  const ok = SEVEN.filter((id) => {
    const b = p.bodies.find((x) => x.id === id);
    return b && pts[id] > 0 && signAspect(b.lon, lon);
  });
  ok.sort((a, b) => pts[b] - pts[a] || Number(b === term) - Number(a === term));
  return ok[0] ?? null;
}

export function lengthOfLife(p: ChartPoints): LengthOfLife | null {
  const sun = p.bodies.find((b) => b.id === "sun"), moon = p.bodies.find((b) => b.id === "moon");
  if (!sun || !moon || p.cusps.length < 12) return null;
  const day = isDayChart(p);
  const waxing = norm(moon.lon - sun.lon) < 180;
  const fortune = lots(p).fortune;
  const points: Record<ReleaserId, { lon: number; house: number }> = {
    sun: { lon: sun.lon, house: sun.house },
    moon: { lon: moon.lon, house: moon.house },
    asc: { lon: p.asc, house: 1 },
    fortune: { lon: fortune, house: houseOf(fortune, p.cusps) },
  };
  const order: ReleaserId[] = [...(day ? ["sun", "moon"] : ["moon", "sun"]), ...(waxing ? ["asc", "fortune"] : ["fortune", "asc"])] as ReleaserId[];
  const candidates: Candidate[] = order.map((id) => {
    const { lon, house } = points[id];
    const placed = id === "asc" || RELEASING_HOUSES.includes(house);
    return { id, lon, house, placed, giver: placed ? findGiver(p, lon, day) : null };
  });
  const releaser = candidates.find((c) => c.placed && c.giver) ?? candidates.find((c) => c.placed)!;
  if (!releaser.giver) return { day, waxing, candidates, releaser, giver: null, changes: [], years: null };

  const g = p.bodies.find((b) => b.id === releaser.giver)!;
  const grant: Grant = [1, 4, 7, 10].includes(g.house) ? "greater" : [2, 5, 8, 11].includes(g.house) ? "middle" : "lesser";
  const base = PLANET_YEARS[releaser.giver][grant === "lesser" ? 0 : grant === "middle" ? 1 : 2];
  const changes: LengthOfLife["changes"] = [];
  for (const id of ["venus", "jupiter", "mars", "saturn"] as Planet7[]) {
    const b = p.bodies.find((x) => x.id === id);
    if (!b || id === releaser.giver) continue;
    const aspect = signAspect(b.lon, g.lon);
    if (!aspect) continue;
    const benefic = id === "venus" || id === "jupiter";
    if (!benefic && !["Conjunction", "Square", "Opposition"].includes(aspect)) continue;
    changes.push({ id, aspect, years: (benefic ? 1 : -1) * PLANET_YEARS[id][0] });
  }
  return {
    day, waxing, candidates, releaser,
    giver: { id: releaser.giver, house: g.house, dignities: dignitiesAt(releaser.giver, releaser.lon, day), aspect: signAspect(g.lon, releaser.lon)!, grant, years: base },
    changes,
    years: Math.max(0, base + changes.reduce((n, c) => n + c.years, 0)),
  };
}

/** Mean obliquity of the ecliptic at a date. */
export const obliquity = (utc: string) => 23.4392911 - 0.0130042 * ((Date.parse(utc) - Date.UTC(2000, 0, 1, 12)) / (36525 * 86_400_000));

/** Oblique ascension of an ecliptic degree at a latitude; null where the degree never rises or sets. */
export function obliqueAscension(lon: number, lat: number, eps: number) {
  const l = lon * RAD, e = eps * RAD;
  const ra = Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l)) / RAD;
  const x = Math.tan(lat * RAD) * Math.tan(Math.asin(Math.sin(e) * Math.sin(l)));
  return Math.abs(x) > 1 ? null : norm(ra - Math.asin(x) / RAD);
}

export interface VitalSector {
  /** Where the sector ends, and what ends it (null: the quadrant, with no malefic in the way). */
  endLon: number;
  arc: number;
  cut: { id: "mars" | "saturn"; aspect: string } | null;
  years: number;
}

export function vitalSector(p: ChartPoints, releaserLon: number, lat: number, eps: number): VitalSector | null {
  let arc = 90;
  let cut: VitalSector["cut"] = null;
  for (const id of ["mars", "saturn"] as const) {
    const b = p.bodies.find((x) => x.id === id);
    if (!b) continue;
    for (const [off, aspect] of [[0, "Body"], [90, "Square"], [180, "Opposition"], [270, "Square"]] as const) {
      const a = norm(b.lon + off - releaserLon);
      if (a > 1e-9 && a < arc) { arc = a; cut = { id, aspect }; }
    }
  }
  const endLon = norm(releaserLon + arc);
  const a = obliqueAscension(releaserLon, lat, eps), b = obliqueAscension(endLon, lat, eps);
  if (a === null || b === null) return null;
  return { endLon, arc, cut, years: norm(b - a) };
}
