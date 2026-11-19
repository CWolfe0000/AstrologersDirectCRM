/**
 * Lots (Arabic / Hermetic parts): a registry that keeps, with each Lot, its
 * source, the exact formula used, its sect rule, its interpretive function,
 * how far the formula has been verified, and any alternative reading. A
 * formula from another tradition is never substituted silently: an
 * alternative is a separate, labelled entry, and is not used in any judgment.
 *
 * "A → B from the Ascendant" means Ascendant + B − A.
 *
 * VERIFICATION. None of these formulas has yet been checked against a primary
 * text or a scholarly translation: the hosts carrying Riley's Valens could not
 * be read when this was written. "secondary" means independent modern sources
 * agree; "unverified" means the formula is as the author of this file
 * remembered it; "unresolved" means sources disagree, or the Lot could not be
 * found in the source named, and it is not calculated.
 */
import { ordinal } from "../index";
import { DOMICILE, SEVEN, type Planet7 } from "../traditional";
import type { TargetId } from "../timeline";
import { conditionOf, houseOfLon, nameOf, norm, sep, signIdx, type Condition, type PromiseContext } from "./condition";

export type LotId = "fortune" | "spirit" | "exaltation" | "basis" | "substance-paulus" | "substance-medieval" | "marriage-dorotheus-m" | "marriage-dorotheus-f" | "marriage-valens-m" | "marriage-valens-f" | "children";
export type Verification = "verified" | "secondary" | "unverified" | "unresolved";

export interface LotDef {
  id: LotId;
  name: string;
  source: string;
  /** The exact formula used, in words. */
  formula: string;
  /** What changes between a day and a night chart. */
  sect: string;
  /** Interpretive function. */
  purpose: string;
  verification: { status: Verification; note: string };
  /** An alternative from another tradition, shown for comparison only and never used in a judgment. */
  alternativeTo?: LotId;
  /** Other readings of the same Lot, with where each would fall. */
  readings?: { label: string; lon(ctx: PromiseContext): number | null }[];
  /** Longitude, or null when a point it needs is missing or the formula is unresolved. */
  lon(ctx: PromiseContext): number | null;
}

const L = (ctx: PromiseContext, id: TargetId) => ctx.n.byId.get(id)?.lon;
/** Ascendant + to − from, reversed by night when `reverse` is set. */
function arc(ctx: PromiseContext, from: number | undefined | null, to: number | undefined | null, reverse: boolean) {
  const asc = L(ctx, "asc");
  if (asc === undefined || from === undefined || from === null || to === undefined || to === null) return null;
  return norm(reverse && !ctx.day ? asc + from - to : asc + to - from);
}
const fortune = (ctx: PromiseContext) => arc(ctx, L(ctx, "sun"), L(ctx, "moon"), true);
const spirit = (ctx: PromiseContext) => arc(ctx, L(ctx, "moon"), L(ctx, "sun"), true);
const FROM_MEMORY = "From memory of the source; not yet checked against the text.";

export const LOTS: LotDef[] = [
  { id: "fortune", name: "Lot of Fortune", source: "Hellenistic (Dorotheus; Valens, Anthologies; Paulus, Introductory Matters)", formula: "Sun → Moon from the Ascendant", sect: "Reversed by night: Moon → Sun from the Ascendant", purpose: "Body and material circumstances; what comes by conditions beyond choice",
    verification: { status: "secondary", note: "Modern sources agree on the formula and the reversal. Not checked against the texts." }, lon: fortune },
  { id: "spirit", name: "Lot of Spirit", source: "Hellenistic (Valens, Anthologies; Paulus, Introductory Matters)", formula: "Moon → Sun from the Ascendant", sect: "Reversed by night: Sun → Moon from the Ascendant", purpose: "Agency, deliberate action, vocational direction",
    verification: { status: "secondary", note: "Modern sources agree on the formula and the reversal. Not checked against the texts." }, lon: spirit },
  {
    id: "exaltation", name: "Lot of Exaltation", source: "Valens, Anthologies II", formula: "By day, Sun → 19° Aries from the Ascendant", sect: "By night, Moon → 3° Taurus from the Ascendant", purpose: "Recognition, elevation and rank",
    verification: { status: "secondary", note: "One modern source gives the same formula; another gives a different one. The text itself was not read." },
    lon: (ctx) => { const asc = L(ctx, "asc"), from = L(ctx, ctx.day ? "sun" : "moon"); return asc === undefined || from === undefined ? null : norm(asc + (ctx.day ? 19 : 33) - from); },
  },
  {
    id: "basis", name: "Lot of Basis", source: "Valens, Anthologies II", formula: "The shorter of the two arcs between Fortune and Spirit, from the Ascendant", sect: "The same by day and by night, in this reading", purpose: "Material foundation and stability",
    verification: { status: "unresolved", note: "Reports of the text disagree. This reading takes the shorter arc for both sects, so the Lot never falls below the horizon. One report of Riley's translation reads Fortune → Spirit by day and Spirit → Fortune by night; a forum report writes Ascendant + Fortune − Spirit. Both are shown beside it until the passage is read." },
    readings: [
      { label: "Fortune → Spirit by day, Spirit → Fortune by night", lon: (ctx) => arc(ctx, ctx.day ? fortune(ctx) : spirit(ctx), ctx.day ? spirit(ctx) : fortune(ctx), false) },
      { label: "Ascendant + Fortune − Spirit", lon: (ctx) => arc(ctx, spirit(ctx), fortune(ctx), false) },
    ],
    lon: (ctx) => { const f = fortune(ctx), s = spirit(ctx), asc = L(ctx, "asc"); if (f === null || s === null || asc === undefined) return null; const d = norm(s - f); return norm(asc + (d > 180 ? 360 - d : d)); },
  },
  { id: "substance-paulus", name: "Lot of Substance", source: "Paulus Alexandrinus, Introductory Matters (as specified by the practice)", formula: "Not established", sect: "Not established", purpose: "Financial resources",
    verification: { status: "unresolved", note: "Not calculated. The sources reached describe Paulus as giving the seven Hermetic Lots (Fortune, Spirit, Eros, Necessity, Courage, Victory, Nemesis) and, by one report, the Lots of the Father and of Marriage; none describes a Lot of Substance in Paulus. The formula and the Greek term need to be supplied from the text." },
    lon: () => null },
  { id: "substance-medieval", name: "Lot of Substance (medieval)", source: "Medieval Arabic and Latin (al-Biruni; Bonatti)", formula: "Ruler of the 2nd → cusp of the 2nd from the Ascendant", sect: "The same by day and by night", purpose: "Financial resources",
    alternativeTo: "substance-paulus", verification: { status: "unverified", note: `A different tradition from the one specified; shown for comparison only and used in no judgment. ${FROM_MEMORY}` },
    lon: (ctx) => { const r = ctx.n.houseRulers(2)[0]; return arc(ctx, r ? L(ctx, r) : undefined, ctx.n.cusps?.[1], false); } },
  { id: "marriage-dorotheus-m", name: "Lot of Marriage (men)", source: "Dorotheus, Carmen Astrologicum II", formula: "Saturn → Venus from the Ascendant", sect: "The same by day and by night", purpose: "Marriage, in a man's chart", verification: { status: "unverified", note: FROM_MEMORY }, lon: (ctx) => arc(ctx, L(ctx, "saturn"), L(ctx, "venus"), false) },
  { id: "marriage-dorotheus-f", name: "Lot of Marriage (women)", source: "Dorotheus, Carmen Astrologicum II", formula: "Venus → Saturn from the Ascendant", sect: "The same by day and by night", purpose: "Marriage, in a woman's chart", verification: { status: "unverified", note: FROM_MEMORY }, lon: (ctx) => arc(ctx, L(ctx, "venus"), L(ctx, "saturn"), false) },
  { id: "marriage-valens-m", name: "Lot of Marriage (men)", source: "Valens, Anthologies II", formula: "Sun → Venus from the Ascendant", sect: "The same by day and by night", purpose: "Marriage, in a man's chart", verification: { status: "unverified", note: FROM_MEMORY }, lon: (ctx) => arc(ctx, L(ctx, "sun"), L(ctx, "venus"), false) },
  { id: "marriage-valens-f", name: "Lot of Marriage (women)", source: "Valens, Anthologies II", formula: "Moon → Mars from the Ascendant", sect: "The same by day and by night", purpose: "Marriage, in a woman's chart", verification: { status: "unverified", note: FROM_MEMORY }, lon: (ctx) => arc(ctx, L(ctx, "moon"), L(ctx, "mars"), false) },
  { id: "children", name: "Lot of Children", source: "Dorotheus, Carmen Astrologicum II", formula: "Jupiter → Saturn from the Ascendant", sect: "Reversed by night: Saturn → Jupiter from the Ascendant", purpose: "Children", verification: { status: "unverified", note: FROM_MEMORY }, lon: (ctx) => arc(ctx, L(ctx, "jupiter"), L(ctx, "saturn"), true) },
];
export const lotById = (id: LotId) => LOTS.find((l) => l.id === id)!;

const SIGN_ASPECT: Record<number, string> = { 0: "in the same sign", 2: "sextile", 3: "square", 4: "trine", 6: "opposite", 8: "trine", 9: "square", 10: "sextile" };

export interface LotRecord {
  def: LotDef;
  lon: number | null;
  house: number | null;
  ruler: Planet7 | null;
  rulerCondition: Condition | null;
  /** The seven planets aspecting the Lot by sign; those within 3° of its degree are marked close. */
  aspects: { planet: Planet7; aspect: string; close: boolean }[];
  readings: { label: string; lon: number | null }[];
}

/** Everything stored for a Lot in this chart: position, house, ruler, aspects, and its other readings. */
export function lotRecord(ctx: PromiseContext, def: LotDef): LotRecord {
  const lon = def.lon(ctx);
  const readings = (def.readings ?? []).map((r) => ({ label: r.label, lon: r.lon(ctx) }));
  if (lon === null) return { def, lon, house: null, ruler: null, rulerCondition: null, aspects: [], readings };
  const ruler = DOMICILE[signIdx(lon)]!;
  const aspects = SEVEN.flatMap((planet) => {
    const p = ctx.n.byId.get(planet);
    const aspect = p ? SIGN_ASPECT[(signIdx(p.lon) - signIdx(lon) + 12) % 12] : undefined;
    if (!p || !aspect) return [];
    const exact = [0, 60, 90, 120, 180].some((a) => Math.abs(sep(p.lon, lon) - a) <= 3);
    return [{ planet, aspect, close: exact }];
  });
  return { def, lon, house: houseOfLon(ctx.n, lon), ruler, rulerCondition: conditionOf(ctx, ruler), aspects, readings };
}

/**
 * Valens' place of acquisition: the eleventh sign counted from the Lot of
 * Fortune. It is a place, not a calculated degree, so it stands apart from
 * the Lots as its own financial indicator. Schmidt renders the term
 * "acquisition"; Riley, by report, "accomplishment". Verified from secondary
 * sources only.
 */
export interface Acquisition {
  sign: number;
  /** The natal house that sign's cusp-ruler falls under is not the point: it is counted from Fortune. */
  ruler: Planet7;
  rulerCondition: Condition | null;
  occupants: Planet7[];
  /** Venus or Jupiter in the sign or aspecting it by sign; Mars or Saturn in it or square or opposite it. */
  benefics: { planet: Planet7; aspect: string }[];
  malefics: { planet: Planet7; aspect: string }[];
}
export function acquisition(ctx: PromiseContext): Acquisition | null {
  const f = fortune(ctx);
  if (f === null) return null;
  const sign = (signIdx(f) + 10) % 12;
  const rel = (id: Planet7) => { const p = ctx.n.byId.get(id); return p ? SIGN_ASPECT[(signIdx(p.lon) - sign + 12) % 12] : undefined; };
  const ruler = DOMICILE[sign]!;
  return {
    sign, ruler, rulerCondition: conditionOf(ctx, ruler),
    occupants: SEVEN.filter((id) => rel(id) === "in the same sign"),
    benefics: (["venus", "jupiter"] as Planet7[]).flatMap((planet) => (rel(planet) ? [{ planet, aspect: rel(planet)! }] : [])),
    malefics: (["mars", "saturn"] as Planet7[]).flatMap((planet) => (["in the same sign", "square", "opposite"].includes(rel(planet) ?? "") ? [{ planet, aspect: rel(planet)! }] : [])),
  };
}
export const describeLot = (r: LotRecord) => (r.lon === null ? "not calculated" : `${ordinal(r.house!)} House; ruler ${nameOf(r.ruler!)}`);
