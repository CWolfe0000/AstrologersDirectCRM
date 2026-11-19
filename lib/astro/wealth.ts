/**
 * Financial natal promise. The 2nd house is personal resources, not total
 * financial potential, so nothing here collapses into one wealth score.
 *
 * Two things are kept apart throughout:
 * - a planet's CONDITION (what it is able to do), from the shared condition
 *   engine: dignity, house, sect, the Sun's rays, motion, aspects, reception;
 * - its FINANCIAL RELEVANCE (what it answers for): the house it rules, or its
 *   natural office. Lilly's tables inform the first and never decide a
 *   rating on their own.
 *
 * Every judgment is made of testimony, and the rating follows from the
 * testimony by a stated rule:
 * - primary testimony: the condition of the significators the matter chiefly
 *   answers to;
 * - supporting testimony: ties between the relevant rulers, contributing
 *   significators, Fortune and the place of acquisition;
 * - contradictory testimony: whatever in either layer argues against.
 *   Strong: a primary significator is strong, none is weak, and at least one
 *   independent supporting testimony stands with it.
 *   Weak: a primary significator is weak and none is strong.
 *   Mixed: anything else, with the reason given.
 *
 * One natal configuration counts once. A tie between two planets that is
 * already part of either planet's condition (the same aspect or reception),
 * or that repeats a tie already listed (as when one planet rules two of the
 * houses), is shown and marked as restating it, and does not count again.
 *
 * Four functions are judged separately and stay separate even when the
 * circuit of rulers is complete: generating wealth, access to it, control of
 * it, and retaining it. The eight dimensions follow.
 *
 * A reading of the natal chart alone: timing belongs to the timeline, and the
 * judgment should be made apart from the person's known financial history.
 */
import { SIGNS, ordinal } from "./index";
import type { NatalModel } from "./activation";
import { HOUSE_KEYS } from "./keywords";
import { conditionOf, isSeven, nameOf as name, place, promiseContext, tie as tieOf, type Condition, type Level } from "./natal-promise/condition";
import { acquisition, lotById, lotRecord } from "./natal-promise/lots";
import type { Planet7 } from "./traditional";
import type { TargetId } from "./timeline";

export type { Level };
export interface PlanetCondition extends Condition {
  /** Financial relevance: "Ruler of the 2nd", "Jupiter" … */
  roles: string[];
}
export interface Testimony {
  text: string;
  side: "for" | "against" | "neutral";
  layer: "primary" | "supporting";
  /** Set when this is the same natal configuration as one already counted; it then carries no weight. */
  restates?: string;
}
export interface Judgment {
  id: string;
  title: string;
  /** What it asks. */
  about: string;
  level: Level;
  /** Why the rating is what it is, in a sentence. */
  why: string;
  primary: Testimony[];
  supporting: Testimony[];
  contradictory: Testimony[];
  /** The significators it was judged from. */
  planets: Planet7[];
}
export interface FinancialPromise {
  day: boolean;
  planets: PlanetCondition[];
  /** Generation, access, control and retention. */
  functions: Judgment[];
  dimensions: Judgment[];
  /** Where the 2nd ruler sits, and what that ties income to. */
  secondRuler: string | null;
  /** Ties among the rulers of the 2nd, 10th and 11th (and the Ascendant ruler). */
  circuit: { text: string; tied: boolean }[];
  fortune: string[];
  /** Valens' place of acquisition, the eleventh sign from Fortune. */
  acquisition: string[];
}

const SECOND_RULER_IN = [
  "income follows your own initiative and person", "income stays close to its own source: what you earn, you hold", "income through sales, writing, trade and communication", "income tied to property, family or a home base",
  "income tied to speculation, creative work or children", "income through employment, service and daily work", "earnings through clients, contracts or partnerships", "personal finances intertwined with shared resources, debt or investments",
  "income through teaching, publishing, law or foreign connections", "income tied to career, status or professional accomplishment", "financial opportunities through networks, patrons or career gains", "money matters involving institutions, private work, hidden expenses or limited direct control",
];
const WORD: Record<Level, string> = { strong: "strong", mixed: "middling", weak: "weak" };
const HOUSE_TOPIC: Record<number, string> = { 1: "the person", 2: "income", 4: "property", 5: "speculation", 7: "clients and partners", 8: "others' money", 10: "career", 11: "gains" };

type Sig = [planet: TargetId | null | undefined, relevance: string];
interface Spec {
  id: string;
  title: string;
  about: string;
  primary: Sig[];
  contributing?: Sig[];
  /** Pairs of houses whose rulers should be joined. */
  ties?: [number, number][];
  extra?: (add: (side: Testimony["side"], text: string, key: string) => void) => void;
}

export function financialPromise(n: NatalModel, speeds?: Partial<Record<TargetId, number>>): FinancialPromise | null {
  const ctx = promiseContext(n, speeds);
  if (!ctx) return null;
  const { day } = ctx;
  const at = (id: TargetId) => n.byId.get(id);
  const ruler = (h: number) => (h === 1 ? n.chartRuler : n.houseRulers(h)[0]);
  const cache = new Map<Planet7, Condition>();
  const cond = (id: Planet7) => cache.get(id) ?? (cache.set(id, conditionOf(ctx, id)!), cache.get(id)!);

  // Financial relevance of each planet, apart from its condition.
  const roles = new Map<Planet7, string[]>();
  const role = (id: TargetId | null | undefined, r: string) => { if (isSeven(id) && at(id)) roles.set(id, [...(roles.get(id) ?? []), r]); };
  role(n.chartRuler, "Ruler of the Ascendant");
  for (const h of [2, 11, 10, 8, 7, 5, 4]) role(n.houseRulers(h)[0], `Ruler of the ${ordinal(h)}`);
  for (const h of [2, 11, 8]) n.occupants(h).forEach((id) => role(id, `In the ${ordinal(h)}`));
  for (const id of ["jupiter", "venus", "saturn", "mercury", "mars"] as Planet7[]) if (!roles.has(id)) role(id, name(id));
  const planets: PlanetCondition[] = [...roles.keys()].map((id) => ({ ...cond(id), roles: roles.get(id)! }));

  const fortuneRec = lotRecord(ctx, lotById("fortune")), spiritRec = lotRecord(ctx, lotById("spirit")), substanceRec = lotRecord(ctx, lotById("substance"));
  const acq = acquisition(ctx);
  const fr = fortuneRec.ruler;

  /** Judge a matter from its testimony. */
  const judge = (spec: Spec): Judgment => {
    const primary: Testimony[] = [], supporting: Testimony[] = [];
    const counted = new Set<string>();
    const used: Planet7[] = [];
    const pairKey = (a: string, b: string) => [a, b].sort().join("+");
    const sigs = (list: Sig[] | undefined, layer: Testimony["layer"]) => {
      const merged = new Map<Planet7, string[]>();
      for (const [id, rel] of list ?? []) if (isSeven(id) && at(id) && !used.includes(id)) merged.set(id, [...(merged.get(id) ?? []), rel]);
      for (const [id, rels] of merged) {
        used.push(id);
        counted.add(id);
        const c = cond(id);
        (layer === "primary" ? primary : supporting).push({ layer, side: c.level === "strong" ? "for" : c.level === "weak" ? "against" : "neutral", text: `${name(id)} answers for ${rels.join(" and ")}; its condition is ${WORD[c.level]}` });
      }
    };
    sigs(spec.primary, "primary");
    sigs(spec.contributing, "supporting");
    const add = (side: Testimony["side"], text: string, key: string, restates?: string) => {
      const dup = counted.has(key);
      counted.add(key);
      supporting.push({ layer: "supporting", side, text, ...(restates || dup ? { restates: restates ?? "a tie already listed" } : {}) });
    };
    for (const [x, y] of spec.ties ?? []) {
      const a = ruler(x), b = ruler(y);
      if (!isSeven(a) || !isSeven(b)) continue;
      const label = `the rulers of the ${ordinal(x)} and ${ordinal(y)} (${HOUSE_TOPIC[x]} and ${HOUSE_TOPIC[y]})`;
      const t = tieOf(n, a, b);
      if (!t) { add("against", `No tie between ${label}`, `none:${pairKey(a, b)}:${x}-${y}`); continue; }
      if (a === b) { add("for", `One planet, ${name(a)}, rules both the ${ordinal(x)} and ${ordinal(y)}`, pairKey(a, b)); continue; }
      // An aspect or reception between two planets judged here is already inside their condition.
      const inCondition = [a, b].some((p, i) => used.includes(p) && cond(p).notes.some((note) => note.text.includes(name(i === 0 ? b : a))));
      add("for", `${label[0]!.toUpperCase()}${label.slice(1)} are joined: ${t}`, pairKey(a, b), inCondition ? `the same configuration as in ${name(a)}'s or ${name(b)}'s condition` : undefined);
    }
    spec.extra?.((side, text, key) => add(side, text, key));

    const weigh = (xs: Testimony[], side: Testimony["side"]) => xs.filter((t) => t.side === side && !t.restates);
    const pf = weigh(primary, "for"), pa = weigh(primary, "against"), sf = weigh(supporting, "for"), sa = weigh(supporting, "against");
    let level: Level, why: string;
    const lead = (t: Testimony) => t.text.split(";")[0]!.split(" answers for")[0]!;
    if (spec.primary.length === 0) {
      level = sf.length >= 3 && sa.length <= 1 ? "strong" : sf.length === 0 ? "weak" : "mixed";
      why = `${sf.length} independent ${sf.length === 1 ? "testimony" : "testimonies"} for and ${sa.length} against`;
    } else if (pf.length && !pa.length && sf.length) { level = "strong"; why = `${pf.map(lead).join(" and ")} ${pf.length > 1 ? "are" : "is"} strong, none of the primary significators is weak, and ${sf.length} supporting ${sf.length === 1 ? "testimony stands" : "testimonies stand"} with it`; }
    else if (pa.length && !pf.length) { level = "weak"; why = `${pa.map(lead).join(" and ")} ${pa.length > 1 ? "are" : "is"} weak and no primary significator is strong`; }
    else {
      level = "mixed";
      why = pf.length && pa.length ? `${pf.map(lead).join(" and ")} strong, but ${pa.map(lead).join(" and ")} weak` : pf.length ? `${pf.map(lead).join(" and ")} strong, but nothing independent supports it` : `no primary significator is clearly strong or weak; ${sf.length} supporting for, ${sa.length} against`;
    }
    const all = [...primary, ...supporting];
    return {
      id: spec.id, title: spec.title, about: spec.about, level, why, planets: used,
      primary: primary.filter((t) => t.side !== "against"), supporting: supporting.filter((t) => t.side !== "against"), contradictory: all.filter((t) => t.side === "against"),
    };
  };

  const r2 = ruler(2), r2house = isSeven(r2) ? at(r2)?.house : undefined;
  const contrary: Planet7 = day ? "mars" : "saturn";
  const fortuneTestimony = (add: Parameters<NonNullable<Spec["extra"]>>[0]) => {
    if (fr && fortuneRec.rulerCondition) add(fortuneRec.rulerCondition.level === "strong" ? "for" : fortuneRec.rulerCondition.level === "weak" ? "against" : "neutral", `${name(fr)}, ruler of the Lot of Fortune, is ${WORD[fortuneRec.rulerCondition.level]}`, `lot-ruler:${fr}`);
  };
  /** The Lot of Substance through its ruler; the same planet ruling Fortune as well counts once. */
  const substanceTestimony = (add: Parameters<NonNullable<Spec["extra"]>>[0]) => {
    const r = substanceRec.ruler, c = substanceRec.rulerCondition;
    if (r && c) add(c.level === "strong" ? "for" : c.level === "weak" ? "against" : "neutral", `${name(r)}, ruler of the Lot of Substance, is ${WORD[c.level]}`, `lot-ruler:${r}`);
  };
  const acquisitionTestimony = (add: Parameters<NonNullable<Spec["extra"]>>[0]) => {
    if (!acq) return;
    const say = (b: { planet: Planet7; aspect: string }) => (b.aspect === "in the same sign" ? `${name(b.planet)} is in it` : `${name(b.planet)} aspects it by ${b.aspect === "opposite" ? "opposition" : b.aspect}`);
    // A malefic that rules the Ascendant is the person, not an affliction.
    const malefics = acq.malefics.filter((b) => b.planet !== n.chartRuler);
    if (acq.benefics.length) add("for", `Place of acquisition (${SIGNS[acq.sign]!.name}): ${acq.benefics.map(say).join("; ")}`, "acquisition-benefics");
    if (malefics.length) add("against", `Place of acquisition (${SIGNS[acq.sign]!.name}): ${malefics.map(say).join("; ")}`, "acquisition-malefics");
  };

  const functions = [
    judge({ id: "generation", title: "Generating Wealth", about: "The capacity to produce income by one's own activity", primary: [[ruler(10), "career"], [n.chartRuler, "the person's own initiative"]], contributing: [["mercury", "trade and calculation"], ["mars", "enterprise"]], ties: [[1, 10], [2, 10]] }),
    judge({ id: "access", title: "Access to Wealth", about: "Resources reachable through others, patrons and circumstance: reach, not ownership", primary: [[ruler(8), "others' money"], [ruler(11), "gains and patrons"]], contributing: [["jupiter", "opportunity and patronage"]], ties: [[2, 8], [2, 11]], extra: (add) => { fortuneTestimony(add); acquisitionTestimony(add); } }),
    judge({
      id: "control", title: "Control of Wealth", about: "Whether what is made or reached is in the person's own hands", primary: [[r2, "personal resources"]], contributing: [[n.chartRuler, "the person's agency"]], ties: [[1, 2]],
      extra: (add) => {
        if (r2house && [7, 8, 12].includes(r2house)) add("against", `The 2nd ruler is in the ${ordinal(r2house)}: ${SECOND_RULER_IN[r2house - 1]}`, "r2-house");
        if (r2house && [1, 2, 10].includes(r2house)) add("for", `The 2nd ruler is in the ${ordinal(r2house)}: ${SECOND_RULER_IN[r2house - 1]}`, "r2-house");
      },
    }),
    judge({
      id: "retention", title: "Retaining Wealth", about: "Keeping and preserving what has been acquired", primary: [["saturn", "preservation and structure"], [r2, "personal resources"]],
      extra: (add) => {
        if (at(contrary)?.house === 2 && contrary !== n.chartRuler) add("against", `${name(contrary)}, the malefic contrary to the sect, is in the 2nd`, "contrary-in-2nd");
        if (at("jupiter")?.house === 2 && cond("jupiter").level !== "strong") add("against", "Jupiter in the 2nd without strength: expansion of spending as much as of resources", "jupiter-in-2nd");
        if (at("saturn")?.house === 2 && cond("saturn").level !== "weak") add("for", "Saturn in the 2nd and not weak: disciplined accumulation", "saturn-in-2nd");
      },
    }),
  ];

  const dimensions = [
    judge({ id: "earning", title: "Earning Potential", about: "The capacity to generate income", primary: [[r2, "income"], [ruler(10), "career"]], contributing: [["mercury", "trade and calculation"], [n.chartRuler, "the person"]], ties: [[1, 2], [2, 10]] }),
    judge({ id: "gains", title: "Career-Derived Gains", about: "Rewards, patrons and profit from the profession", primary: [[ruler(11), "gains"], [ruler(10), "career"]], contributing: [["jupiter", "opportunity and patronage"]], ties: [[10, 11], [2, 11]], extra: acquisitionTestimony }),
    judge({ id: "enterprise", title: "Entrepreneurship", about: "Acting on your own account, with clients and competitors", primary: [[n.chartRuler, "the person"], [ruler(7), "clients and partners"]], contributing: [["mars", "enterprise and risk"], ["mercury", "commerce"], [ruler(10), "career"]], ties: [[1, 2], [1, 10], [1, 7]] }),
    judge({ id: "speculation", title: "Investment & Speculation", about: "Risk taken for return", primary: [[ruler(5), "speculation"]], contributing: [["jupiter", "expansion"], ["mars", "risk"], [ruler(8), "others' money"]], ties: [[2, 5], [5, 8]], extra: (add) => { if (fortuneRec.house === 5) add("for", "The Lot of Fortune falls in the 5th", "fortune-in-5th"); } }),
    judge({ id: "others", title: "Wealth Through Others", about: "Partners, investors, inheritance and outside capital: access, not ownership", primary: [[ruler(8), "others' money"], [ruler(7), "partners"]], ties: [[2, 8], [7, 8]] }),
    judge({ id: "property", title: "Property & Assets", about: "Land, real estate and what is held", primary: [[ruler(4), "property"]], contributing: [["saturn", "land and long holding"], [r2, "personal resources"]], ties: [[2, 4]], extra: fortuneTestimony }),
    judge({ id: "preservation", title: "Wealth Preservation", about: "Keeping and controlling what is acquired", primary: [[r2, "personal resources"], ["saturn", "preservation"]], extra: (add) => { if (at(contrary)?.house === 2 && contrary !== n.chartRuler) add("against", `${name(contrary)}, the malefic contrary to the sect, is in the 2nd`, "contrary-in-2nd"); } }),
    judge({
      id: "scale", title: "Large-Scale Wealth", about: "Repeated, independent ties among the financial rulers, the benefics, the angles and Fortune", primary: [], ties: [[2, 10], [10, 11], [2, 11]],
      extra: (add) => {
        fortuneTestimony(add);
        substanceTestimony(add);
        acquisitionTestimony(add);
        for (const b of ["jupiter", "venus"] as Planet7[]) if (at(b)?.house && [1, 4, 7, 10].includes(at(b)!.house!)) add("for", `${name(b)} is angular, in the ${ordinal(at(b)!.house!)}`, `angular:${b}`);
      },
    }),
  ];

  const circuit = ([[2, 10], [10, 11], [2, 11], [1, 2], [1, 10]] as [number, number][]).map(([x, y]) => {
    const t = tieOf(n, ruler(x), ruler(y));
    const label = `(${HOUSE_TOPIC[x]} and ${HOUSE_TOPIC[y]})`;
    return { tied: !!t, text: t ? `Rulers of the ${ordinal(x)} and ${ordinal(y)} ${label}: ${t}` : `No tie between the rulers of the ${ordinal(x)} and ${ordinal(y)} ${label}` };
  });

  const benefics = fortuneRec.aspects.filter((a) => a.planet === "venus" || a.planet === "jupiter");
  const fortune = fortuneRec.lon === null ? [] : [
    `Lot of Fortune at ${place(fortuneRec.lon)}, in the ${ordinal(fortuneRec.house!)} House (${HOUSE_KEYS[fortuneRec.house! - 1]}); ${day ? "day" : "night"} formula`,
    `Its ruler, ${name(fr!)}, is ${fortuneRec.rulerCondition ? WORD[fortuneRec.rulerCondition.level] : "not in this chart's points"}${at(fr!)?.house ? `, in the ${ordinal(at(fr!)!.house!)} House` : ""}`,
    benefics.length ? `${benefics.map((b) => `${name(b.planet)} (${b.aspect})`).join(" and ")} ${benefics.length > 1 ? "aspect" : "aspects"} Fortune by sign` : "Neither Venus nor Jupiter aspects Fortune by sign",
    ...(spiritRec.lon === null ? [] : [`Lot of Spirit at ${place(spiritRec.lon)}, in the ${ordinal(spiritRec.house!)} House (${HOUSE_KEYS[spiritRec.house! - 1]})`]),
    ...(substanceRec.lon === null ? [] : [`Lot of Substance (medieval formula) at ${place(substanceRec.lon)}, in the ${ordinal(substanceRec.house!)} House; its ruler, ${name(substanceRec.ruler!)}, is ${substanceRec.rulerCondition ? WORD[substanceRec.rulerCondition.level] : "not in this chart's points"}`]),
  ];
  const acquisitionLines = !acq ? [] : [
    `The eleventh sign from Fortune: ${SIGNS[acq.sign]!.name}${acq.occupants.length ? `, holding ${acq.occupants.map(name).join(" and ")}` : ", with no planet in it"}`,
    `Its ruler, ${name(acq.ruler)}, is ${acq.rulerCondition ? WORD[acq.rulerCondition.level] : "not judged"}`,
    acq.benefics.length ? `Benefics: ${acq.benefics.map((b) => `${name(b.planet)} ${b.aspect}`).join("; ")}` : "No benefic in it or aspecting it by sign",
    ...(acq.malefics.length ? [`Malefics: ${acq.malefics.map((b) => `${name(b.planet)} ${b.aspect}`).join("; ")}`] : []),
  ];

  return {
    day, planets, functions, dimensions, circuit, fortune, acquisition: acquisitionLines,
    secondRuler: isSeven(r2) && r2house ? `${name(r2)}, ruler of the 2nd, is in the ${ordinal(r2house)}: ${SECOND_RULER_IN[r2house - 1]}` : null,
  };
}
