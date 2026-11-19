/**
 * Natal promise: what each house promises, judged the traditional way from
 *   - the ruler of the sign on the house (its essential dignity, the house it
 *     sits in, retrograde, combustion, the benefics and malefics touching it,
 *     and whether it can see its own house),
 *   - the planets in the house (benefics help, malefics hinder, modified by
 *     sect and dignity),
 *   - the house's natural significator (Venus for the 7th, Saturn for the 8th …).
 * Every point is listed so the astrologer can check the judgment. The point
 * values are provisional conventions, not a published system.
 */
import { BODIES } from "./meta";
import { HOUSE_TOPICS } from "./activation";
import { DOMICILE, isDayChart, lots, SEVEN, termRuler, faceRuler, triplicityRulers, type Planet7 } from "./traditional";
import type { BodyId, ChartPoints } from "./types";

const EXALT: (Planet7 | null)[] = ["sun", "moon", null, "jupiter", null, "mercury", "saturn", null, null, "mars", null, "venus"];
const sign = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const sep = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);
// Moieties (half-orbs) by planet, as in Lilly: two planets aspect when within the sum of their moieties.
const MOIETY: Record<Planet7, number> = { sun: 7.5, moon: 6, mercury: 3.5, venus: 3.5, mars: 4, jupiter: 4.5, saturn: 4.5 };
const ASP = [
  { name: "Conjunction", angle: 0, hard: true },
  { name: "Sextile", angle: 60, hard: false },
  { name: "Square", angle: 90, hard: true },
  { name: "Trine", angle: 120, hard: false },
  { name: "Opposition", angle: 180, hard: true },
] as const;

/** The natural significator of each house (traditional). */
export const NATURAL: Planet7[] = ["sun", "jupiter", "mercury", "moon", "venus", "mars", "venus", "saturn", "jupiter", "sun", "jupiter", "saturn"];

export interface Factor { label: string; points: number }
export interface PlanetCondition { id: Planet7; house: number; factors: Factor[]; score: number }
export interface HousePromise {
  house: number;
  sign: number;
  topics: string;
  ruler: PlanetCondition;
  /** Modern ruler, when the sign has one (Scorpio, Aquarius, Pisces). */
  modernRuler: BodyId | null;
  occupants: { id: BodyId; points: number; note: string }[];
  natural: PlanetCondition;
  naturalPoints: number;
  sees: boolean;
  total: number;
  verdict: "Strong" | "Good" | "Mixed" | "Challenged";
  summary: string;
}

const MODERN: Partial<Record<number, BodyId>> = { 7: "pluto", 10: "uranus", 11: "neptune" };
const name = (id: BodyId) => BODIES[id]?.name ?? id;
const round = (x: number) => Math.round(x * 10) / 10;

/** House of a longitude: whole sign from the Ascendant, or between quadrant cusps with the 5° rule (a planet within 5° before a cusp belongs to the next house). */
function houseOf(lon: number, p: ChartPoints, wholeSign: boolean) {
  if (wholeSign) return ((sign(lon) - sign(p.asc) + 12) % 12) + 1;
  for (let i = 0; i < 12; i++) {
    const a = p.cusps[i]!, b = p.cusps[(i + 1) % 12]!;
    const span = (((b - a) % 360) + 360) % 360, off = (((lon - a) % 360) + 360) % 360;
    if (off < span) return span - off <= 5 ? ((i + 1) % 12) + 1 : i + 1;
  }
  return 1;
}

export function natalPromise(p: ChartPoints, opts: { wholeSign: boolean }): HousePromise[] {
  const day = isDayChart(p);
  const body = (id: BodyId) => p.bodies.find((b) => b.id === id);
  const sun = body("sun")!;
  const inSectMalefic: Planet7 = day ? "saturn" : "mars";
  const inSectBenefic: Planet7 = day ? "jupiter" : "venus";
  const hOf = (id: BodyId) => houseOf(body(id)!.lon, p, opts.wholeSign);
  const fortune = lots(p).fortune;

  const essential = (id: Planet7, lon: number): Factor[] => {
    const s = sign(lon), f: Factor[] = [];
    if (DOMICILE[s] === id) f.push({ label: "In Its Own Sign (Domicile)", points: 4 });
    if (EXALT[s] === id) f.push({ label: "Exalted", points: 3 });
    const minor = [(day ? triplicityRulers(lon)[0] : triplicityRulers(lon)[1]) === id && "triplicity", termRuler(lon) === id && "term", faceRuler(lon) === id && "face"].filter(Boolean) as string[];
    if (minor.length) f.push({ label: `Minor Dignity (${minor.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")})`, points: 1 });
    if (DOMICILE[(s + 6) % 12] === id) f.push({ label: "In Detriment", points: -3 });
    if (EXALT[(s + 6) % 12] === id) f.push({ label: "In Fall", points: -3 });
    if (!f.length) f.push({ label: "Peregrine (No Essential Dignity)", points: -2 });
    return f;
  };

  const condition = (id: Planet7): PlanetCondition => {
    const b = body(id)!;
    const house = hOf(id);
    const f = essential(id, b.lon);
    if ([1, 4, 7, 10].includes(house)) f.push({ label: `Angular (${ordinal(house)} House)`, points: 3 });
    else if ([2, 5, 8, 11].includes(house)) f.push({ label: `Succedent (${ordinal(house)} House)`, points: 1 });
    else f.push({ label: `Cadent (${ordinal(house)} House)`, points: -1 });
    if ([6, 8, 12].includes(house)) f.push({ label: `In a Difficult House (the ${ordinal(house)})`, points: -2 });
    if (id !== "sun" && id !== "moon" && b.speed < 0) f.push({ label: "Retrograde", points: -2 });
    if (id !== "sun") {
      const d = sep(b.lon, sun.lon);
      if (d < 17 / 60) f.push({ label: "Cazimi (In the Heart of the Sun)", points: 4 });
      else if (d < 8.5) f.push({ label: `Combust (${d.toFixed(1)}° From the Sun)`, points: -3 });
      else if (d < 17 && id !== "moon") f.push({ label: `Under the Sun’s Beams (${d.toFixed(1)}°)`, points: -1 });
    }
    // Benefics and malefics touching it: applying aspects count in full, separating at half.
    for (const o of ["venus", "jupiter", "mars", "saturn"] as Planet7[]) {
      if (o === id) continue;
      const ob = body(o)!;
      const d = sep(b.lon, ob.lon);
      const a = ASP.find((x) => Math.abs(d - x.angle) <= MOIETY[id] + MOIETY[o]);
      if (!a) continue;
      const applying = Math.abs(sep(b.lon + b.speed * 0.01, ob.lon + ob.speed * 0.01) - a.angle) < Math.abs(d - a.angle);
      const benefic = o === "venus" || o === "jupiter";
      let pts = benefic ? (a.hard && a.angle !== 0 ? 1 : 2) : a.hard ? -2 : -1;
      if (!benefic && o === inSectMalefic) pts = a.hard ? -1 : 0;
      if (pts === 0) continue;
      if (!applying) pts /= 2;
      f.push({ label: `${a.name} ${name(o)} (${Math.abs(d - a.angle).toFixed(1)}°, ${applying ? "Applying" : "Separating"}${!benefic && o === inSectMalefic ? ", Malefic of the Sect" : ""})`, points: pts });
    }
    return { id, house, factors: f, score: round(f.reduce((s, x) => s + x.points, 0)) };
  };

  const conds = Object.fromEntries(SEVEN.map((id) => [id, condition(id)])) as Record<Planet7, PlanetCondition>;
  const ascSign = sign(p.asc);

  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const hs = opts.wholeSign ? (ascSign + i) % 12 : sign(p.cusps[i]!);
    const ruler = conds[DOMICILE[hs]!];
    // Can the ruler see its house? Sign-based: any aspect from its sign to the house's sign; aversion otherwise.
    const dist = (hs - sign(body(ruler.id)!.lon) + 12) % 12;
    const sees = [0, 2, 3, 4, 6, 8, 9, 10].includes(dist);
    const occupants = p.bodies
      .filter((b) => (["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "southnode"] as BodyId[]).includes(b.id) && houseOf(b.lon, p, opts.wholeSign) === house)
      .map((b) => {
        const id = b.id as BodyId;
        if (id === "jupiter" || id === "venus") {
          const c = conds[id];
          const weak = c.factors.some((x) => /Detriment|Fall/.test(x.label));
          return { id, points: weak ? 1 : 2, note: weak ? "Benefic, but Debilitated" : id === inSectBenefic ? "Benefic of the Sect" : "Benefic" };
        }
        if (id === "mars" || id === "saturn") {
          const c = conds[id];
          const dignified = c.factors.some((x) => /Own Sign|Exalted/.test(x.label));
          let pts = id === inSectMalefic ? -1 : -2;
          if (dignified) pts += 1;
          return { id, points: pts, note: `${id === inSectMalefic ? "Malefic of the Sect" : "Malefic, Contrary to Sect"}${dignified ? ", but Dignified" : ""}` };
        }
        if (id === "sun" || id === "moon" || id === "mercury") {
          const c = conds[id];
          const pts = c.factors.some((x) => /Own Sign|Exalted/.test(x.label)) ? 1 : c.factors.some((x) => /Detriment|Fall/.test(x.label)) ? -1 : 0;
          return { id, points: pts, note: pts > 0 ? "Dignified" : pts < 0 ? "Debilitated" : "Neutral" };
        }
        if (id === "node") return { id, points: 1, note: "North Node: Increase" };
        if (id === "southnode") return { id, points: -1, note: "South Node: Decrease" };
        return { id, points: 0, note: "Outer Planet: Noted, Not Scored" };
      });
    const natural = conds[NATURAL[i]!];
    const naturalPoints = natural.score >= 3 ? 1 : natural.score <= -3 ? -1 : 0;
    const fortuneHere = houseOf(fortune, p, opts.wholeSign) === house;
    const total = round(ruler.score + (sees ? 1 : -1) + occupants.reduce((s, x) => s + x.points, 0) + naturalPoints + (fortuneHere ? 1 : 0));
    const verdict: HousePromise["verdict"] = total >= 5 ? "Strong" : total >= 2 ? "Good" : total > -4 ? "Mixed" : "Challenged";
    return { house, sign: hs, topics: HOUSE_TOPICS[i]!, ruler, modernRuler: MODERN[hs] ?? null, occupants: fortuneHere ? [...occupants, { id: "fortune" as BodyId, points: 1, note: "Part of Fortune" }] : occupants, natural, naturalPoints, sees, total, verdict, summary: summarize(house, ruler, sees, occupants, verdict) };
  });
}

function ordinal(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}

/** A plain-language reading built from the same factors as the score. */
function summarize(house: number, r: PlanetCondition, sees: boolean, occ: { id: BodyId; points: number }[], verdict: string) {
  const parts: string[] = [];
  const has = (re: RegExp) => r.factors.some((f) => re.test(f.label));
  const rn = name(r.id);
  parts.push(`${rn} rules this house and sits in the ${ordinal(r.house)}, so these matters tend to come through ${HOUSE_TOPICS[r.house - 1]!.toLowerCase()}.`);
  if (has(/Own Sign|Exalted/)) parts.push(`${rn} is strong by sign, so what is promised is real and of good quality.`);
  else if (has(/detriment|fall/)) parts.push(`${rn} is weak by sign, so results take more effort or come in an imperfect form.`);
  if (has(/Angular/)) parts.push("Being angular, it acts visibly and early.");
  else if (has(/Cadent/)) parts.push("Being cadent, it works more quietly or slowly.");
  if (has(/Combust/)) parts.push("Combust, it is hidden by the Sun: results can be overshadowed or arrive late.");
  if (has(/Retrograde/)) parts.push("Retrograde, it suggests delays, revisiting or a second attempt.");
  if (r.factors.some((f) => /Jupiter|Venus/.test(f.label) && f.points > 0)) parts.push("A benefic’s help eases the way.");
  if (r.factors.some((f) => /Mars|Saturn/.test(f.label) && f.points < 0)) parts.push("A malefic’s pressure adds friction or obstacles.");
  if (!sees) parts.push("The ruler can’t see its own house (aversion), so it has less control over these matters.");
  const ben = occ.filter((o) => o.points > 0 && (o.id === "jupiter" || o.id === "venus")).map((o) => name(o.id));
  const mal = occ.filter((o) => o.points < 0 && (o.id === "mars" || o.id === "saturn")).map((o) => name(o.id));
  if (ben.length) parts.push(`${ben.join(" and ")} in the house add${ben.length > 1 ? "" : "s"} support.`);
  if (mal.length) parts.push(`${mal.join(" and ")} in the house add${mal.length > 1 ? "" : "s"} difficulty.`);
  void house;
  void verdict;
  return parts.join(" ");
}
