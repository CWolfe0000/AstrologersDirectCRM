/**
 * Traditional techniques, using the common Hellenistic / medieval conventions
 * (stated in the UI so they can be checked):
 *
 * - Essential dignities: domicile, exaltation, Dorothean triplicity (day,
 *   night, participating), Egyptian terms, Chaldean faces; Lilly's points
 *   (5 / 4 / 3 / 2 / 1, detriment −5, fall −4, peregrine −5); almuten of a degree.
 * - Annual profections from the Ascendant, one sign per year; Lord of the Year
 *   is the sign's traditional ruler.
 * - Firdaria: diurnal Sun 10, Venus 8, Mercury 13, Moon 9, Saturn 11,
 *   Jupiter 12, Mars 7, North Node 3, South Node 2; nocturnal starts with the
 *   Moon (nodes at the end). Planetary periods split into 7 equal sub-periods
 *   starting with the period's lord, in Chaldean order.
 * - Zodiacal releasing from the Lot of Spirit or Fortune: minor years of each
 *   sign's ruler, 360-day years; level 2 in 30-day months; Valens' loosing of
 *   the bond when level 2 has gone through all twelve signs.
 */
import { SIGNS } from "./meta";
import type { BodyId, ChartPoints } from "./types";

export type Planet7 = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn";
export const SEVEN: Planet7[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];
const CHALDEAN: Planet7[] = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"];
const DAY_MS = 86_400_000;

const sign = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const deg = (lon: number) => (((lon % 360) + 360) % 360) % 30;

export const DOMICILE: Planet7[] = ["mars", "venus", "mercury", "moon", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "saturn", "jupiter"];
const EXALT: Partial<Record<number, Planet7>> = { 0: "sun", 1: "moon", 5: "mercury", 11: "venus", 9: "mars", 3: "jupiter", 6: "saturn" };
/** Dorothean triplicity rulers by element (fire, earth, air, water): day, night, participating. */
const TRIPLICITY: [Planet7, Planet7, Planet7][] = [
  ["sun", "jupiter", "saturn"],
  ["venus", "moon", "mars"],
  ["saturn", "mercury", "jupiter"],
  ["venus", "mars", "moon"],
];
/** Egyptian terms: [ruler, end degree] for each sign. */
const TERMS: [Planet7, number][][] = [
  [["jupiter", 6], ["venus", 12], ["mercury", 20], ["mars", 25], ["saturn", 30]],
  [["venus", 8], ["mercury", 14], ["jupiter", 22], ["saturn", 27], ["mars", 30]],
  [["mercury", 6], ["jupiter", 12], ["venus", 17], ["mars", 24], ["saturn", 30]],
  [["mars", 7], ["venus", 13], ["mercury", 19], ["jupiter", 26], ["saturn", 30]],
  [["jupiter", 6], ["venus", 11], ["saturn", 18], ["mercury", 24], ["mars", 30]],
  [["mercury", 7], ["venus", 17], ["jupiter", 21], ["mars", 28], ["saturn", 30]],
  [["saturn", 6], ["mercury", 14], ["jupiter", 21], ["venus", 28], ["mars", 30]],
  [["mars", 7], ["venus", 11], ["mercury", 19], ["jupiter", 24], ["saturn", 30]],
  [["jupiter", 12], ["venus", 17], ["mercury", 21], ["saturn", 26], ["mars", 30]],
  [["mercury", 7], ["jupiter", 14], ["venus", 22], ["saturn", 26], ["mars", 30]],
  [["mercury", 7], ["venus", 13], ["jupiter", 20], ["mars", 25], ["saturn", 30]],
  [["venus", 12], ["jupiter", 16], ["mercury", 19], ["mars", 28], ["saturn", 30]],
];
const FACE_ORDER: Planet7[] = ["mars", "sun", "venus", "mercury", "moon", "saturn", "jupiter"];

export const termRuler = (lon: number) => TERMS[sign(lon)]!.find(([, end]) => deg(lon) < end)![0];
export const faceRuler = (lon: number) => FACE_ORDER[(sign(lon) * 3 + Math.floor(deg(lon) / 10)) % 7]!;
export const triplicityRulers = (lon: number) => TRIPLICITY[sign(lon) % 4]!;

/** A day chart has the Sun above the horizon (houses 7–12). */
export function isDayChart(p: ChartPoints) {
  const sun = p.bodies.find((b) => b.id === "sun");
  return !!sun && sun.house >= 7;
}

export interface DignityRow {
  id: Planet7;
  lon: number;
  domicile: Planet7;
  exaltation: Planet7 | null;
  triplicity: [Planet7, Planet7, Planet7];
  term: Planet7;
  face: Planet7;
  /** This planet's own dignities where it stands, and its Lilly score. */
  has: string[];
  score: number;
  /** The planet with most essential dignity at this degree. */
  almuten: Planet7[];
}

/** Dignity points each of the seven planets holds at a degree (sect decides the triplicity ruler). */
export function pointsAt(lon: number, day: boolean) {
  const s = sign(lon);
  const pts = Object.fromEntries(SEVEN.map((p) => [p, 0])) as Record<Planet7, number>;
  pts[DOMICILE[s]!] += 5;
  if (EXALT[s]) pts[EXALT[s]!] += 4;
  const [d, n] = triplicityRulers(lon);
  pts[day ? d : n] += 3;
  pts[termRuler(lon)] += 2;
  pts[faceRuler(lon)] += 1;
  return pts;
}

export function dignityTable(p: ChartPoints): DignityRow[] {
  const day = isDayChart(p);
  return SEVEN.flatMap((id) => {
    const b = p.bodies.find((x) => x.id === id);
    if (!b) return [];
    const s = sign(b.lon);
    const has: string[] = [];
    let score = 0;
    if (DOMICILE[s] === id) { has.push("Domicile"); score += 5; }
    if (EXALT[s] === id) { has.push("Exaltation"); score += 4; }
    const [d, n] = triplicityRulers(b.lon);
    if ((day ? d : n) === id) { has.push("Triplicity"); score += 3; }
    if (termRuler(b.lon) === id) { has.push("Term"); score += 2; }
    if (faceRuler(b.lon) === id) { has.push("Face"); score += 1; }
    if (DOMICILE[(s + 6) % 12] === id) { has.push("Detriment"); score -= 5; }
    if (EXALT[(s + 6) % 12] === id) { has.push("Fall"); score -= 4; }
    if (!has.some((h) => ["Domicile", "Exaltation", "Triplicity", "Term", "Face"].includes(h))) { has.push("Peregrine"); score -= 5; }
    const pts = pointsAt(b.lon, day);
    const best = Math.max(...Object.values(pts));
    return [{ id, lon: b.lon, domicile: DOMICILE[s]!, exaltation: EXALT[s] ?? null, triplicity: triplicityRulers(b.lon), term: termRuler(b.lon), face: faceRuler(b.lon), has, score, almuten: SEVEN.filter((x) => pts[x] === best) }];
  });
}

// ---------------------------------------------------------------------------
// Profections

export function profection(ascLon: number, age: number) {
  const s = (sign(ascLon) + age) % 12;
  return { age, house: (age % 12) + 1, sign: s, lord: DOMICILE[s]! };
}

/** Age in completed years on a date. */
export function ageOn(birthUtc: string, dateIso: string) {
  const b = new Date(birthUtc), d = new Date(`${dateIso}T12:00:00Z`);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  if (d.getUTCMonth() < b.getUTCMonth() || (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

// ---------------------------------------------------------------------------
// Firdaria

type FirdarLord = Planet7 | "node" | "southnode";
const DIURNAL: [FirdarLord, number][] = [["sun", 10], ["venus", 8], ["mercury", 13], ["moon", 9], ["saturn", 11], ["jupiter", 12], ["mars", 7], ["node", 3], ["southnode", 2]];
const NOCTURNAL: [FirdarLord, number][] = [["moon", 9], ["saturn", 11], ["jupiter", 12], ["mars", 7], ["sun", 10], ["venus", 8], ["mercury", 13], ["node", 3], ["southnode", 2]];

export interface Firdar {
  lord: FirdarLord;
  start: number;
  end: number;
  subs: { lord: Planet7; start: number; end: number }[];
}

/** Firdaria from birth, repeating after 75 years. Years are Julian years (365.25 days). */
export function firdaria(birthUtc: string, day: boolean, untilYears = 90): Firdar[] {
  const seq = day ? DIURNAL : NOCTURNAL;
  const yr = 365.25 * DAY_MS;
  const out: Firdar[] = [];
  let t = Date.parse(birthUtc);
  const stop = t + untilYears * yr;
  for (let cycle = 0; t < stop; cycle++) {
    for (const [lord, years] of seq) {
      if (t >= stop) break;
      const end = t + years * yr;
      const subs: Firdar["subs"] = [];
      if (lord !== "node" && lord !== "southnode") {
        const i0 = CHALDEAN.indexOf(lord);
        const len = (end - t) / 7;
        for (let k = 0; k < 7; k++) subs.push({ lord: CHALDEAN[(i0 + k) % 7]!, start: t + k * len, end: t + (k + 1) * len });
      }
      out.push({ lord, start: t, end, subs });
      t = end;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Zodiacal releasing

/** Minor years of each sign's (traditional) ruler. */
const MINOR_YEARS: Record<Planet7, number> = { saturn: 30, jupiter: 12, mars: 15, sun: 19, venus: 8, mercury: 20, moon: 25 };
export const signYears = (s: number) => (s === 9 ? 27 : MINOR_YEARS[DOMICILE[s]!]); // Capricorn: 27 (Valens), not Saturn's 30

/** Lot of Fortune and Lot of Spirit (reversed by night). */
export function lots(p: ChartPoints) {
  const sun = p.bodies.find((b) => b.id === "sun")!.lon, moon = p.bodies.find((b) => b.id === "moon")!.lon;
  const day = isDayChart(p);
  const n = (x: number) => ((x % 360) + 360) % 360;
  return { fortune: n(day ? p.asc + moon - sun : p.asc + sun - moon), spirit: n(day ? p.asc + sun - moon : p.asc + moon - sun), day };
}

export interface ReleasingPeriod {
  sign: number;
  start: number;
  end: number;
  /** Level 2 only: this period follows a loosing of the bond. */
  loosed?: boolean;
}

const YEAR360 = 360 * DAY_MS;

/** Level 1 periods from the lot's sign, in 360-day years. */
export function releasingL1(lotLon: number, birthUtc: string, untilYears = 90): ReleasingPeriod[] {
  const out: ReleasingPeriod[] = [];
  let t = Date.parse(birthUtc);
  const stop = t + untilYears * 365.25 * DAY_MS;
  for (let s = sign(lotLon); t < stop; s = (s + 1) % 12) {
    const end = t + signYears(s) * YEAR360;
    out.push({ sign: s, start: t, end });
    t = end;
  }
  return out;
}

/** Level 2 inside a level-1 period: 30-day months per sign year; after twelve signs, jump to the sign opposite (loosing of the bond). */
export function releasingL2(l1: ReleasingPeriod): ReleasingPeriod[] {
  const month = YEAR360 / 12;
  const out: ReleasingPeriod[] = [];
  let t = l1.start;
  let s = l1.sign;
  let count = 0;
  let loosed = false;
  while (t < l1.end - 1) {
    if (count === 12) {
      s = (l1.sign + 6) % 12;
      loosed = true;
      count = 13;
    }
    const end = Math.min(l1.end, t + signYears(s) * month);
    out.push({ sign: s, start: t, end, ...(loosed && out.every((x) => !x.loosed) ? { loosed: true } : {}) });
    t = end;
    s = (s + 1) % 12;
    if (count < 12) count++;
  }
  return out;
}

export const signName = (s: number) => SIGNS[s]!.name;
export type { BodyId };
