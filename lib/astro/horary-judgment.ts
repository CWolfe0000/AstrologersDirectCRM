/**
 * Horary judgment aids, after Lilly (Christian Astrology) and Bonatti:
 *
 * - Significators: the querent is the Ascendant's (traditional) ruler with the
 *   Moon as co-significator; the quesited is the ruler of the house the matter
 *   belongs to, counted from another person's house when the question is about
 *   them (derived houses).
 * - Perfection: Ptolemaic aspects within the planets' moieties (half Lilly's
 *   orbs, added together), applying, and perfected in the real ephemeris; with
 *   translation and collection of light, prohibition, frustration, refranation
 *   and reception.
 * - Strength: essential dignity (Lilly's points) and accidental dignity (house,
 *   motion, speed, the Sun's beams).
 * - Timing: degrees to perfection in units by sign and house, alongside the
 *   date the ephemeris gives.
 * - Radicality: the planetary hour from local sunrise and sunset, and whether
 *   its ruler agrees with the Ascendant.
 *
 * These lay out the testimonies; the judgment stays the astrologer's.
 */
import { SIGNS } from "./meta";
import { DOMICILE, dignityTable, isDayChart, triplicityRulers, type Planet7 } from "./traditional";
import type { ChartPoints } from "./types";

const DAY = 86_400_000;
export const SEVEN: Planet7[] = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"]; // Chaldean order
export const NAME: Record<Planet7, string> = { sun: "the Sun", moon: "the Moon", mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const Name = (p: Planet7) => cap(NAME[p]);

/** Half of Lilly's orbs. */
export const MOIETY: Record<Planet7, number> = { sun: 7.5, moon: 6, mercury: 3.5, venus: 3.5, mars: 3.75, jupiter: 4.5, saturn: 4.5 };
/** Mean daily motion (degrees). */
export const MEAN_SPEED: Record<Planet7, number> = { sun: 0.9856, moon: 13.1764, mercury: 1.383, venus: 1.2, mars: 0.524, jupiter: 0.083, saturn: 0.034 };
const EXALT_SIGN: Partial<Record<Planet7, number>> = { sun: 0, moon: 1, mercury: 5, venus: 11, mars: 9, jupiter: 3, saturn: 6 };
const ASPECTS = [
  { name: "conjunction", angle: 0 },
  { name: "sextile", angle: 60 },
  { name: "square", angle: 90 },
  { name: "trine", angle: 120 },
  { name: "opposition", angle: 180 },
] as const;
export type AspectName = (typeof ASPECTS)[number]["name"];

export interface Motion {
  t: number[];
  lon: Record<string, number[]>;
  speed: Record<string, number[]>;
}

const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const n180 = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;

// ---------------------------------------------------------------------------
// Houses and significators

export const HORARY_TOPICS: { id: string; label: string; house: number }[] = [
  { id: "self", label: "The querent: health, appearance, outlook", house: 1 },
  { id: "money", label: "Money, possessions, a lost item", house: 2 },
  { id: "siblings", label: "Siblings, neighbors, messages, short trips", house: 3 },
  { id: "home", label: "Home, property, parents, endings", house: 4 },
  { id: "children", label: "Children, pregnancy, pleasure, creative work", house: 5 },
  { id: "health", label: "Illness, work, employees, pets", house: 6 },
  { id: "partner", label: "Partner, marriage, contracts, an opponent", house: 7 },
  { id: "shared", label: "Shared money, debts, inheritance, fear", house: 8 },
  { id: "travel", label: "Long journeys, study, law, religion", house: 9 },
  { id: "career", label: "Career, job, reputation, authority", house: 10 },
  { id: "friends", label: "Friends, hopes and wishes, networks", house: 11 },
  { id: "hidden", label: "Hidden matters, secret enemies, confinement", house: 12 },
];
export const ABOUT: { id: string; label: string; house: number }[] = [
  { id: "self", label: "the querent", house: 1 },
  { id: "partner", label: "their partner or spouse", house: 7 },
  { id: "child", label: "their child", house: 5 },
  { id: "parent", label: "their mother or father", house: 4 },
  { id: "sibling", label: "their sibling", house: 3 },
  { id: "friend", label: "their friend", house: 11 },
  { id: "boss", label: "their boss", house: 10 },
];

/** Derived house: the matter's house counted from the person's house ("my partner's money" = 2nd from 7th = 8th). */
export const derivedHouse = (matter: number, from: number) => ((from - 1 + matter - 1) % 12) + 1;

export function significators(p: ChartPoints, quesitedHouse: number) {
  const querent = DOMICILE[signOf(p.asc)]!;
  const quesited = DOMICILE[signOf(p.cusps[quesitedHouse - 1]!)]!;
  return { querent, quesited, same: querent === quesited };
}

// ---------------------------------------------------------------------------
// Perfection

export interface AspectEvent {
  aspect: AspectName;
  /** Current distance from exact, degrees. */
  orb: number;
  applying: boolean;
  /** When it perfects in the ephemeris (null: not within the window, or not while in orb). */
  perfectsAt: number | null;
  /** One of the two stations before perfecting (refranation). */
  refranation: Planet7 | null;
  /** The faster planet (the one applying). */
  applier: Planet7;
}

const series = (m: Motion, p: Planet7) => m.lon[p]!;

/** The two planets' closest Ptolemaic aspect now, whether it is applying, and when (if) it perfects. */
export function aspectBetween(m: Motion, a: Planet7, b: Planet7, orbLimit = MOIETY[a] + MOIETY[b]): AspectEvent | null {
  const la = series(m, a), lb = series(m, b);
  let best: AspectEvent | null = null;
  for (const asp of ASPECTS) {
    for (const sign of asp.angle === 0 || asp.angle === 180 ? [1] : [1, -1]) {
      const d = (k: number) => n180(la[k]! - lb[k]! - sign * asp.angle);
      const d0 = d(0);
      if (Math.abs(d0) > orbLimit) continue;
      const applying = Math.abs(d(1)) < Math.abs(d0);
      let perfectsAt: number | null = null;
      let refranation: Planet7 | null = null;
      if (applying) {
        for (let k = 1; k < m.t.length; k++) {
          const prev = d(k - 1), cur = d(k);
          if (Math.abs(cur) > orbLimit + 1) break; // left orb without perfecting
          if (prev === 0 || Math.sign(prev) !== Math.sign(cur)) {
            const f = Math.abs(prev) / (Math.abs(prev) + Math.abs(cur));
            perfectsAt = m.t[k - 1]! + f * (m.t[k]! - m.t[k - 1]!);
            break;
          }
          if (Math.abs(cur) > Math.abs(prev)) {
            // Turned back before perfecting: whichever planet stationed.
            for (const p of [a, b]) {
              const sp = m.speed[p]!;
              for (let j = 1; j <= k; j++) if (Math.sign(sp[j]!) !== Math.sign(sp[j - 1]!)) refranation = p;
            }
            break;
          }
        }
      }
      const ev: AspectEvent = {
        aspect: asp.name,
        orb: Math.abs(d0),
        applying,
        perfectsAt,
        refranation,
        applier: Math.abs(m.speed[a]![0]!) >= Math.abs(m.speed[b]![0]!) ? a : b,
      };
      if (!best || ev.orb < best.orb) best = ev;
    }
  }
  return best;
}

export interface Testimony {
  kind: "perfection" | "translation" | "collection" | "prohibition" | "frustration" | "refranation" | "separating" | "none" | "reception";
  text: string;
  at?: number;
  tone: "for" | "against" | "neutral";
}

export function perfectionTestimonies(p: ChartPoints, m: Motion, A: Planet7, Q: Planet7): Testimony[] {
  const out: Testimony[] = [];
  const pairs: [Planet7, Planet7, string][] = [[A, Q, `${Name(A)} (the querent)`]];
  if (A !== "moon" && Q !== "moon") pairs.push(["moon", Q, "The Moon (co-significator)"]);
  const fmt = (t: number) => new Date(t).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
  const days = (t: number) => Math.round(((t - m.t[0]!) / DAY) * 10) / 10;
  let direct: number | null = null;

  for (const [x, y, label] of pairs) {
    const ev = aspectBetween(m, x, y);
    if (!ev) {
      out.push({ kind: "none", text: `${label} and ${NAME[y]} (the quesited) are not in aspect within their moieties.`, tone: "neutral" });
      continue;
    }
    if (ev.applying && ev.perfectsAt) {
      if (x === A) direct = ev.perfectsAt;
      out.push({ kind: "perfection", at: ev.perfectsAt, tone: ev.aspect === "square" || ev.aspect === "opposition" ? "neutral" : "for", text: `${label} applies to a ${ev.aspect} of ${NAME[y]}, ${ev.orb.toFixed(1)}° from exact; it perfects on ${fmt(ev.perfectsAt)} (in ${days(ev.perfectsAt)} days).${ev.aspect === "square" || ev.aspect === "opposition" ? " Perfection by a hard aspect: the matter comes about, but with difficulty." : ""}` });
    } else if (ev.applying && ev.refranation) {
      out.push({ kind: "refranation", tone: "against", text: `Refranation: ${label} applies to a ${ev.aspect} of ${NAME[y]}, but ${NAME[ev.refranation]} turns ${m.speed[ev.refranation]![0]! > 0 ? "retrograde" : "direct"} before it perfects.` });
    } else if (ev.applying) {
      out.push({ kind: "none", tone: "neutral", text: `${label} applies to a ${ev.aspect} of ${NAME[y]} (${ev.orb.toFixed(1)}°), but it doesn’t perfect while they’re in orb.` });
    } else {
      out.push({ kind: "separating", tone: "against", text: `${label} is separating from a ${ev.aspect} of ${NAME[y]} (${ev.orb.toFixed(1)}° past exact): the matter has passed, or is moving away.` });
    }
  }

  // Interference before the direct perfection: another planet perfects with a significator first.
  if (direct) {
    const slower = Math.abs(m.speed[A]![0]!) < Math.abs(m.speed[Q]![0]!) ? A : Q;
    for (const P of SEVEN) {
      if (P === A || P === Q) continue;
      for (const S of [A, Q]) {
        const ev = aspectBetween(m, P, S);
        if (!ev?.applying || !ev.perfectsAt || ev.perfectsAt >= direct) continue;
        const pApplies = ev.applier === P;
        if (pApplies && S === slower) out.push({ kind: "prohibition", at: ev.perfectsAt, tone: "against", text: `Prohibition: ${NAME[P]} reaches a ${ev.aspect} of ${NAME[S]} on ${fmt(ev.perfectsAt)}, before the significators perfect.` });
        else if (!pApplies && S === slower) out.push({ kind: "frustration", at: ev.perfectsAt, tone: "against", text: `Frustration: ${NAME[S]} perfects a ${ev.aspect} with ${NAME[P]} on ${fmt(ev.perfectsAt)}, before it can be reached.` });
      }
    }
  } else {
    // Translation: a faster planet separating from one significator and applying to the other.
    for (const L of SEVEN) {
      if (L === A || L === Q) continue;
      const fast = (x: Planet7) => Math.abs(m.speed[L]![0]!) > Math.abs(m.speed[x]![0]!);
      if (!fast(A) || !fast(Q)) continue;
      for (const [from, to] of [[A, Q], [Q, A]] as const) {
        const sep = aspectBetween(m, L, from), app = aspectBetween(m, L, to);
        if (sep && !sep.applying && app?.applying && app.perfectsAt) out.push({ kind: "translation", at: app.perfectsAt, tone: "for", text: `Translation of light: ${NAME[L]} separates from ${NAME[from]} and carries its light to ${NAME[to]}, perfecting a ${app.aspect} on ${fmt(app.perfectsAt)}.` });
      }
    }
    // Collection: both significators apply to a slower planet.
    for (const C of SEVEN) {
      if (C === A || C === Q) continue;
      const a = aspectBetween(m, A, C), q = aspectBetween(m, Q, C);
      const slow = (x: Planet7) => Math.abs(m.speed[C]![0]!) < Math.abs(m.speed[x]![0]!);
      if (slow(A) && slow(Q) && a?.applying && a.perfectsAt && q?.applying && q.perfectsAt) out.push({ kind: "collection", at: Math.max(a.perfectsAt, q.perfectsAt), tone: "for", text: `Collection of light: both significators apply to ${NAME[C]}, which collects their light (${fmt(Math.max(a.perfectsAt, q.perfectsAt))}).` });
    }
  }

  // Reception: a planet in a sign where the other has domicile or exaltation.
  const sigA = signOf(p.bodies.find((b) => b.id === A)!.lon), sigQ = signOf(p.bodies.find((b) => b.id === Q)!.lon);
  const receives = (host: Planet7, s: number) => (DOMICILE[s] === host ? "domicile" : EXALT_SIGN[host] === s ? "exaltation" : null);
  const qReceivesA = receives(Q, sigA), aReceivesQ = receives(A, sigQ);
  if (A !== Q && qReceivesA && aReceivesQ) out.push({ kind: "reception", tone: "for", text: `Mutual reception: ${NAME[A]} is in ${NAME[Q]}’s ${qReceivesA} and ${NAME[Q]} in ${NAME[A]}’s ${aReceivesQ}. They are disposed to help each other.` });
  else if (A !== Q && qReceivesA) out.push({ kind: "reception", tone: "for", text: `${Name(Q)} receives ${NAME[A]} (by ${qReceivesA}): the quesited is well disposed toward the querent.` });
  else if (A !== Q && aReceivesQ) out.push({ kind: "reception", tone: "neutral", text: `${Name(A)} receives ${NAME[Q]} (by ${aReceivesQ}): the querent wants the matter.` });
  return out;
}

// ---------------------------------------------------------------------------
// Strength

export interface Strength {
  planet: Planet7;
  essential: number;
  essentialNotes: string[];
  accidental: number;
  accidentalNotes: string[];
}

export function strengthOf(p: ChartPoints, planet: Planet7): Strength {
  const row = dignityTable(p).find((r) => r.id === planet)!;
  const b = p.bodies.find((x) => x.id === planet)!;
  const sun = p.bodies.find((x) => x.id === "sun")!;
  const notes: string[] = [];
  let acc = 0;
  const add = (pts: number, note: string) => {
    acc += pts;
    notes.push(`${note} (${pts > 0 ? "+" : ""}${pts})`);
  };
  if ([1, 10].includes(b.house)) add(5, `In the ${b.house === 1 ? "1st" : "10th"} House`);
  else if ([4, 7, 11].includes(b.house)) add(4, `In the ${b.house === 4 ? "4th" : b.house === 7 ? "7th" : "11th"} House`);
  else if ([2, 5].includes(b.house)) add(3, `In the ${b.house === 2 ? "2nd" : "5th"} House`);
  else if (b.house === 9) add(2, "In the 9th House");
  else if (b.house === 3) add(1, "In the 3rd House");
  else if (b.house === 12) add(-5, "In the 12th House");
  else if ([6, 8].includes(b.house)) add(-2, `In the ${b.house}th House`);
  if (planet !== "sun" && planet !== "moon") add(b.speed < 0 ? -5 : 4, b.speed < 0 ? "Retrograde" : "Direct");
  add(Math.abs(b.speed) >= MEAN_SPEED[planet] ? 2 : -2, Math.abs(b.speed) >= MEAN_SPEED[planet] ? "Swift" : "Slow");
  if (planet !== "sun") {
    const d = Math.abs(n180(b.lon - sun.lon));
    if (d <= 17 / 60) add(5, "Cazimi");
    else if (d <= 8.5) add(-5, "Combust");
    else if (d <= 17) add(-4, "Under the Sun’s beams");
    else add(5, "Free from combustion and the Sun’s beams");
  }
  return { planet, essential: row.score, essentialNotes: row.has, accidental: acc, accidentalNotes: notes };
}

// ---------------------------------------------------------------------------
// Timing

/** Lilly's rule of thumb: the sign's quality and the house set the unit. */
export function timingUnit(lon: number, house: number) {
  const mode = signOf(lon) % 3; // 0 cardinal, 1 fixed, 2 mutable
  const kind = [1, 4, 7, 10].includes(house) ? 0 : [2, 5, 8, 11].includes(house) ? 1 : 2;
  const table = [
    ["days", "weeks", "months"], // cardinal: angular, succedent, cadent
    ["months", "years", "years"], // fixed
    ["weeks", "months", "months"], // mutable
  ];
  return { unit: table[mode]![kind]!, mode: ["cardinal", "fixed", "mutable"][mode]!, house: ["angular", "succedent", "cadent"][kind]! };
}

// ---------------------------------------------------------------------------
// Radicality: planetary hour

/** Sunrise or sunset (UTC ms) for a date and place, NOAA's method; null when the Sun doesn't rise or set. */
export function sunEvent(dateIso: string, lat: number, lon: number, rise: boolean): number | null {
  const jd = Date.parse(`${dateIso}T12:00:00Z`) / DAY + 2440587.5;
  const n = jd - 2451545.0 + 0.0008;
  const Jstar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Jstar) % 360;
  const rad = Math.PI / 180;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const Jtransit = 2451545.0 + Jstar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const decl = Math.asin(Math.sin(lambda * rad) * Math.sin(23.4397 * rad));
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
  if (cosH < -1 || cosH > 1) return null;
  const H = Math.acos(cosH) / rad;
  const J = rise ? Jtransit - H / 360 : Jtransit + H / 360;
  return (J - 2440587.5) * DAY;
}

const DAY_RULER: Planet7[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]; // Sunday…Saturday

export function planetaryHour(utcMs: number, localDate: string, lat: number, lon: number) {
  const add = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
  const rise = sunEvent(localDate, lat, lon, true), set = sunEvent(localDate, lat, lon, false);
  if (rise === null || set === null) return null;
  let start: number, end: number, day: string, night: boolean;
  if (utcMs < rise) {
    const prevSet = sunEvent(add(localDate, -1), lat, lon, false);
    if (prevSet === null) return null;
    [start, end, day, night] = [prevSet, rise, add(localDate, -1), true];
  } else if (utcMs < set) [start, end, day, night] = [rise, set, localDate, false];
  else {
    const nextRise = sunEvent(add(localDate, 1), lat, lon, true);
    if (nextRise === null) return null;
    [start, end, day, night] = [set, nextRise, localDate, true];
  }
  const dayRuler = DAY_RULER[new Date(`${day}T12:00:00Z`).getUTCDay()]!;
  const len = (end - start) / 12;
  const k = Math.min(11, Math.floor((utcMs - start) / len)) + (night ? 12 : 0);
  const ruler = SEVEN[(SEVEN.indexOf(dayRuler) + k) % 7]!;
  return { dayRuler, ruler, hour: (k % 12) + 1, night, start: start + (k % 12) * len, end: start + ((k % 12) + 1) * len };
}

/** Lilly: the chart is radical when the hour's ruler and the Ascendant agree: same planet, same triplicity, or same nature. */
export function hourAgreement(hourRuler: Planet7, ascLon: number) {
  const s = signOf(ascLon);
  if (DOMICILE[s] === hourRuler) return { agrees: true, how: `${Name(hourRuler)} rules both the hour and the Ascendant.` };
  if (triplicityRulers(ascLon).includes(hourRuler)) return { agrees: true, how: `${Name(hourRuler)}, ruler of the hour, is a triplicity ruler of the Ascendant (${SIGNS[s]!.name}).` };
  const nature: Record<Planet7, string> = { saturn: "cold and dry", jupiter: "hot and moist", mars: "hot and dry", sun: "hot and dry", venus: "cold and moist", mercury: "cold and dry", moon: "cold and moist" };
  const signNature = ["hot and dry", "cold and dry", "hot and moist", "cold and moist"][s % 4]!;
  if (nature[hourRuler] === signNature) return { agrees: true, how: `${Name(hourRuler)}, ruler of the hour, is ${signNature}, the nature of the Ascendant (${SIGNS[s]!.name}).` };
  return { agrees: false, how: `${Name(hourRuler)}, ruler of the hour, doesn’t agree with the Ascendant (${SIGNS[s]!.name}, ruled by ${NAME[DOMICILE[s]!]}).` };
}

export { isDayChart };
