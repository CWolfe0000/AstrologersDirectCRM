/**
 * Planetary condition: the shared engine every natal-promise module uses.
 * One of the seven traditional planets is judged for:
 *
 * - essential dignity (Lilly's points: domicile 5, exaltation 4, triplicity 3,
 *   term 2, face 1; detriment −5, fall −4; peregrine −5 only where the planet
 *   has neither dignity nor debility; Dorothean triplicities, Egyptian terms,
 *   Chaldean faces);
 * - house (Lilly's accidental points: 1st and 10th +5; 4th, 7th, 11th +4; 2nd
 *   and 5th +3; 9th +2; 3rd +1; 6th and 8th −2; 12th −5);
 * - sect (the benefic of the sect +2; the malefic contrary to the sect −2);
 * - the Sun's rays (Lilly: cazimi within 17′ +5; combust within 8°30′ −5;
 *   under the beams within 17° −4);
 * - motion, when speeds are known (retrograde −5);
 * - aspects (conjunction, trine or sextile from Venus or Jupiter +2;
 *   conjunction, square or opposition from Mars or Saturn −3, or −1 where
 *   there is reception by domicile or exaltation between the two);
 * - mutual reception by domicile +5.
 *
 * A net of +6 or more reads as strong, −4 or less as weak. The thresholds are
 * working conventions. Every finding is kept with its points so the judgment
 * can be checked: dignity says what a planet can do, rulership what it
 * answers for, aspects how it works with the rest.
 */
import { BODIES, SIGNS, ordinal } from "../index";
import type { NatalModel } from "../activation";
import { DOMICILE, EXALT, faceRuler, SEVEN, termRuler, triplicityRulers, type Planet7 } from "../traditional";
import type { TargetId } from "../timeline";

export type Level = "strong" | "mixed" | "weak";
export interface ConditionNote {
  text: string;
  points: number;
}
export interface Condition {
  id: Planet7;
  notes: ConditionNote[];
  net: number;
  level: Level;
}
export interface PromiseContext {
  n: NatalModel;
  day: boolean;
  /** Daily motion by planet, where the chart carries it (for retrogradation). */
  speeds?: Partial<Record<TargetId, number>>;
}

export const norm = (x: number) => ((x % 360) + 360) % 360;
export const signIdx = (lon: number) => Math.floor(norm(lon) / 30);
export const sep = (a: number, b: number) => { const d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d; };
export const nameOf = (id: TargetId) => BODIES[id].name;
export const isSeven = (id: TargetId | null | undefined): id is Planet7 => !!id && (SEVEN as string[]).includes(id);
export const place = (lon: number) => `${Math.floor(norm(lon) % 30)}°${String(Math.floor((norm(lon) % 1) * 60)).padStart(2, "0")}′ ${SIGNS[signIdx(lon)]!.name}`;
export const VERB: Record<string, string> = { conjunction: "conjunct", trine: "trine", sextile: "sextile", square: "square", opposition: "opposite" };

const HOUSE_POINTS: Record<number, number> = { 1: 5, 10: 5, 4: 4, 7: 4, 11: 4, 2: 3, 5: 3, 9: 2, 3: 1, 6: -2, 8: -2, 12: -5 };
const EASY = ["conjunction", "trine", "sextile"], HARD = ["conjunction", "square", "opposition"];

/** The context for a chart, or null when the birth time (and so the houses and sect) is unknown. */
export function promiseContext(n: NatalModel, speeds?: PromiseContext["speeds"]): PromiseContext | null {
  const sun = n.byId.get("sun");
  if (!n.cusps || !sun?.house || !n.byId.get("moon") || !n.byId.get("asc")) return null;
  return { n, day: sun.house >= 7, speeds };
}

/** A receives B: B is in A's domicile or exaltation. */
export function receives(n: NatalModel, a: Planet7, b: Planet7) {
  const p = n.byId.get(b);
  return !!p && (DOMICILE[signIdx(p.lon)] === a || EXALT[signIdx(p.lon)] === a);
}

export function conditionOf(ctx: PromiseContext, id: Planet7): Condition | null {
  const { n, day } = ctx;
  const p = n.byId.get(id);
  if (!p) return null;
  const s = signIdx(p.lon);
  const notes: ConditionNote[] = [];
  const add = (points: number, text: string) => notes.push({ points, text });
  let dignified = false, debilitated = false;
  if (DOMICILE[s] === id) { add(5, `in its domicile, ${SIGNS[s]!.name}`); dignified = true; }
  if (EXALT[s] === id) { add(4, `exalted in ${SIGNS[s]!.name}`); dignified = true; }
  if (triplicityRulers(p.lon)[day ? 0 : 1] === id) { add(3, "in its triplicity"); dignified = true; }
  if (termRuler(p.lon) === id) { add(2, "in its own term"); dignified = true; }
  if (faceRuler(p.lon) === id) { add(1, "in its own face"); dignified = true; }
  if (DOMICILE[(s + 6) % 12] === id) { add(-5, `in its detriment, ${SIGNS[s]!.name}`); debilitated = true; }
  if (EXALT[(s + 6) % 12] === id) { add(-4, `in its fall, ${SIGNS[s]!.name}`); debilitated = true; }
  if (!dignified && !debilitated) add(-5, "peregrine (no essential dignity)");
  if (p.house) add(HOUSE_POINTS[p.house] ?? 0, `in the ${ordinal(p.house)} House`);
  if ((id === "jupiter" && day) || (id === "venus" && !day)) add(2, "the benefic of the sect");
  if ((id === "mars" && day) || (id === "saturn" && !day)) add(-2, "the malefic contrary to the sect");
  const sun = n.byId.get("sun");
  if (sun && id !== "sun") {
    const d = sep(p.lon, sun.lon);
    if (d <= 17 / 60) add(5, "cazimi, in the heart of the Sun");
    else if (d <= 8.5) add(-5, "combust");
    else if (d <= 17) add(-4, "under the Sun's beams");
  }
  const speed = ctx.speeds?.[id];
  if (speed !== undefined && speed < 0 && id !== "sun" && id !== "moon") add(-5, "retrograde");
  for (const o of SEVEN) {
    if (o === id) continue;
    const a = n.natalAspect(o, id);
    if (a && (o === "venus" || o === "jupiter") && EASY.includes(a)) add(2, `${VERB[a]} ${nameOf(o)}`);
    if (a && (o === "mars" || o === "saturn") && HARD.includes(a)) {
      const rec = receives(n, o, id) || receives(n, id, o);
      add(rec ? -1 : -3, `${VERB[a]} ${nameOf(o)}${rec ? ", with reception" : ""}`);
    }
    const op = n.byId.get(o);
    if (DOMICILE[s] === o && op && DOMICILE[signIdx(op.lon)] === id) add(5, `in mutual reception with ${nameOf(o)}`);
  }
  const net = notes.reduce((x, y) => x + y.points, 0);
  return { id, notes, net, level: net >= 6 ? "strong" : net <= -4 ? "weak" : "mixed" };
}

/** How two planets are tied, strongest tie first, or null. */
export function tie(n: NatalModel, a: TargetId | null | undefined, b: TargetId | null | undefined): string | null {
  if (!isSeven(a) || !isSeven(b) || !n.byId.get(a) || !n.byId.get(b)) return null;
  if (a === b) return `the same planet, ${nameOf(a)}`;
  const asp = n.natalAspect(a, b);
  if (asp) return `${nameOf(a)} ${VERB[asp]} ${nameOf(b)}`;
  if (receives(n, a, b) && receives(n, b, a)) return `${nameOf(a)} and ${nameOf(b)} in mutual reception`;
  for (const [x, y] of [[a, b], [b, a]] as const) {
    const h = n.byId.get(x)!.house;
    if (h && n.houseRulers(h)[0] === y) return `${nameOf(x)} is in the ${ordinal(h)}, a house ${nameOf(y)} rules`;
  }
  if (receives(n, a, b)) return `${nameOf(a)} receives ${nameOf(b)}`;
  if (receives(n, b, a)) return `${nameOf(b)} receives ${nameOf(a)}`;
  return null;
}

export function houseOfLon(n: NatalModel, lon: number) {
  const c = n.cusps!;
  for (let i = 0; i < 12; i++) if (norm(lon - c[i]!) < norm(c[(i + 1) % 12]! - c[i]!)) return i + 1;
  return 1;
}
