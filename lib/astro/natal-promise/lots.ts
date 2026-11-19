/**
 * Lots (Arabic / Hermetic parts): a registry that keeps the source and the
 * formula with each one, because the authors differ and incompatible
 * formulas must not be mixed silently. "A → B from the Ascendant" means
 * Ascendant + B − A. The formulas are as commonly reported from each source
 * and should be checked against the edition the practice follows.
 */
import type { TargetId } from "../timeline";
import { norm, type PromiseContext } from "./condition";

export type LotId = "fortune" | "spirit" | "exaltation" | "basis" | "substance" | "marriage-dorotheus-m" | "marriage-dorotheus-f" | "marriage-valens-m" | "marriage-valens-f" | "children";

export interface LotDef {
  id: LotId;
  name: string;
  source: string;
  /** The formula in words, for a day chart and a night chart. */
  day: string;
  night: string;
  purpose: string;
  /** Longitude, or null when a point it needs is missing. */
  lon(ctx: PromiseContext): number | null;
}

const L = (ctx: PromiseContext, id: TargetId) => ctx.n.byId.get(id)?.lon;
/** Ascendant + to − from, reversed by night when `reverse` is set. */
function arc(ctx: PromiseContext, from: number | undefined, to: number | undefined, reverse: boolean) {
  const asc = L(ctx, "asc");
  if (asc === undefined || from === undefined || to === undefined) return null;
  return norm(reverse && !ctx.day ? asc + from - to : asc + to - from);
}
const fortune = (ctx: PromiseContext) => arc(ctx, L(ctx, "sun"), L(ctx, "moon"), true);
const spirit = (ctx: PromiseContext) => arc(ctx, L(ctx, "moon"), L(ctx, "sun"), true);

export const LOTS: LotDef[] = [
  { id: "fortune", name: "Lot of Fortune", source: "Hellenistic (Dorotheus, Valens)", day: "Sun → Moon from the Ascendant", night: "Moon → Sun from the Ascendant", purpose: "Body and material circumstances; what comes by conditions beyond choice", lon: fortune },
  { id: "spirit", name: "Lot of Spirit", source: "Hellenistic (Valens)", day: "Moon → Sun from the Ascendant", night: "Sun → Moon from the Ascendant", purpose: "Agency, deliberate action, vocational direction", lon: spirit },
  {
    id: "exaltation", name: "Lot of Exaltation", source: "Valens, Anthology II", day: "Sun → 19° Aries from the Ascendant", night: "Moon → 3° Taurus from the Ascendant", purpose: "Recognition, elevation and rank",
    lon: (ctx) => { const asc = L(ctx, "asc"), from = L(ctx, ctx.day ? "sun" : "moon"); return asc === undefined || from === undefined ? null : norm(asc + (ctx.day ? 19 : 33) - from); },
  },
  {
    id: "basis", name: "Lot of Basis", source: "Valens, Anthology II", day: "The shorter arc between Fortune and Spirit, from the Ascendant", night: "The same by night", purpose: "Material foundation and stability",
    lon: (ctx) => { const f = fortune(ctx), s = spirit(ctx), asc = L(ctx, "asc"); if (f === null || s === null || asc === undefined) return null; const d = norm(s - f); return norm(asc + (d > 180 ? 360 - d : d)); },
  },
  {
    id: "substance", name: "Lot of Substance", source: "Medieval (al-Biruni, Bonatti)", day: "Ruler of the 2nd → cusp of the 2nd from the Ascendant", night: "The same by night", purpose: "Financial resources",
    lon: (ctx) => { const r = ctx.n.houseRulers(2)[0]; return arc(ctx, r ? L(ctx, r) : undefined, ctx.n.cusps?.[1], false); },
  },
  { id: "marriage-dorotheus-m", name: "Lot of Marriage (men)", source: "Dorotheus, Carmen II", day: "Saturn → Venus from the Ascendant", night: "The same by night", purpose: "Marriage, in a man's chart", lon: (ctx) => arc(ctx, L(ctx, "saturn"), L(ctx, "venus"), false) },
  { id: "marriage-dorotheus-f", name: "Lot of Marriage (women)", source: "Dorotheus, Carmen II", day: "Venus → Saturn from the Ascendant", night: "The same by night", purpose: "Marriage, in a woman's chart", lon: (ctx) => arc(ctx, L(ctx, "venus"), L(ctx, "saturn"), false) },
  { id: "marriage-valens-m", name: "Lot of Marriage (men)", source: "Valens, Anthology II", day: "Sun → Venus from the Ascendant", night: "The same by night", purpose: "Marriage, in a man's chart", lon: (ctx) => arc(ctx, L(ctx, "sun"), L(ctx, "venus"), false) },
  { id: "marriage-valens-f", name: "Lot of Marriage (women)", source: "Valens, Anthology II", day: "Moon → Mars from the Ascendant", night: "The same by night", purpose: "Marriage, in a woman's chart", lon: (ctx) => arc(ctx, L(ctx, "moon"), L(ctx, "mars"), false) },
  { id: "children", name: "Lot of Children", source: "Dorotheus, Carmen II", day: "Jupiter → Saturn from the Ascendant", night: "Saturn → Jupiter from the Ascendant", purpose: "Children", lon: (ctx) => arc(ctx, L(ctx, "jupiter"), L(ctx, "saturn"), true) },
];
export const lotById = (id: LotId) => LOTS.find((l) => l.id === id)!;
