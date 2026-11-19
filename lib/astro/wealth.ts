/**
 * Financial natal promise, judged as separate dimensions rather than one
 * wealth score: earning, career gains, enterprise, speculation, wealth through
 * others, property, preservation, and the large-scale picture. It is a reading
 * of the natal chart alone; timing belongs to the timeline, and it should be
 * judged apart from the person's known financial history.
 *
 * Each financial significator is judged once for its condition:
 * - essential dignity (Lilly's points: domicile 5, exaltation 4, triplicity 3,
 *   term 2, face 1; detriment −5, fall −4; peregrine −5 only where the planet
 *   has neither dignity nor debility; Dorothean triplicities, Egyptian terms,
 *   Chaldean faces);
 * - house (Lilly's accidental points: 1st and 10th +5; 4th, 7th, 11th +4; 2nd
 *   and 5th +3; 9th +2; 3rd +1; 6th and 8th −2; 12th −5);
 * - sect (the benefic of the sect +2; the malefic contrary to the sect −2);
 * - aspects (conjunction, trine or sextile from Venus or Jupiter +2;
 *   conjunction, square or opposition from Mars or Saturn −3, or −1 where
 *   there is reception by domicile or exaltation between the two);
 * - mutual reception by domicile +5.
 * A net of +6 or more reads as strong, −4 or less as weak. A dimension takes
 * the average of its significators (+5 strong, −3 weak). Dignity says what a
 * planet can do, rulership what it is responsible for, aspects how it works
 * with the rest: all three are shown, so the judgment can be checked.
 *
 * Not considered (the natal model does not carry them): speed, retrogradation,
 * visibility and combustion; the Lots of Basis and of Substance, whose
 * formulas differ by source.
 */
import { SIGNS, ordinal } from "./index";
import type { NatalModel } from "./activation";
import { HOUSE_KEYS } from "./keywords";
import { conditionOf, houseOfLon, isSeven, nameOf as name, norm, promiseContext, signIdx, tie as tieOf, type Level } from "./natal-promise/condition";
import { DOMICILE, SEVEN, type Planet7 } from "./traditional";
import type { TargetId } from "./timeline";

export type { Level };
export interface PlanetCondition {
  id: Planet7;
  /** What it answers for in money matters: "Ruler of the 2nd", "Jupiter" … */
  roles: string[];
  /** Readable findings, signed. */
  notes: { text: string; points: number }[];
  net: number;
  level: Level;
}
export interface Dimension {
  id: string;
  title: string;
  /** What it asks. */
  about: string;
  planets: Planet7[];
  level: Level;
}
export interface FinancialPromise {
  day: boolean;
  planets: PlanetCondition[];
  dimensions: Dimension[];
  /** Where the 2nd ruler sits, and what that ties income to. */
  secondRuler: string | null;
  /** Ties among the rulers of the 2nd, 10th and 11th (and the Ascendant ruler). */
  circuit: { text: string; tied: boolean }[];
  fortune: string[];
}

const SECOND_RULER_IN = [
  "income follows your own initiative and person", "income stays close to its own source: what you earn, you hold", "income through sales, writing, trade and communication", "income tied to property, family or a home base",
  "income tied to speculation, creative work or children", "income through employment, service and daily work", "earnings through clients, contracts or partnerships", "personal finances intertwined with shared resources, debt or investments",
  "income through teaching, publishing, law or foreign connections", "income tied to career, status or professional accomplishment", "financial opportunities through networks, patrons or career gains", "money matters involving institutions, private work, hidden expenses or limited direct control",
];

export function financialPromise(n: NatalModel, speeds?: Partial<Record<TargetId, number>>): FinancialPromise | null {
  const ctx = promiseContext(n, speeds);
  if (!ctx) return null;
  const { day } = ctx;
  const sun = n.byId.get("sun")!, moon = n.byId.get("moon")!, asc = n.byId.get("asc")!;
  const at = (id: TargetId) => n.byId.get(id);
  const ruler = (h: number) => n.houseRulers(h)[0];

  const roles = new Map<Planet7, string[]>();
  const role = (id: TargetId | null | undefined, r: string) => { if (isSeven(id) && at(id)) roles.set(id, [...(roles.get(id) ?? []), r]); };
  role(n.chartRuler, "Ruler of the Ascendant");
  for (const h of [2, 11, 10, 8, 7, 5, 4]) role(ruler(h), `Ruler of the ${ordinal(h)}`);
  for (const h of [2, 11, 8]) n.occupants(h).forEach((id) => role(id, `In the ${ordinal(h)}`));
  for (const id of ["jupiter", "venus", "saturn", "mercury", "mars"] as Planet7[]) if (!roles.has(id)) role(id, name(id));

  const condition = (id: Planet7): PlanetCondition => ({ ...conditionOf(ctx, id)!, roles: roles.get(id) ?? [] });
  const planets = [...roles.keys()].map(condition);
  const cond = new Map(planets.map((p) => [p.id, p]));

  const dim = (id: string, title: string, about: string, ids: (TargetId | null | undefined)[]): Dimension => {
    const ps = [...new Set(ids.filter(isSeven).filter((x) => cond.has(x)))];
    const avg = ps.length ? ps.reduce((x, y) => x + cond.get(y)!.net, 0) / ps.length : 0;
    return { id, title, about, planets: ps, level: avg >= 5 ? "strong" : avg <= -3 ? "weak" : "mixed" };
  };

  // The circuit: are the rulers of income, career and gains tied to one another, and to the person?
  const tie = (a: TargetId | null | undefined, b: TargetId | null | undefined) => tieOf(n, a, b);
  const pairs: [number, number, string][] = [[2, 10, "income and career"], [10, 11, "career and gains"], [2, 11, "income and gains"], [1, 2, "the person and income"], [1, 10, "the person and career"]];
  const circuit = pairs.map(([x, y, label]) => {
    const t = tie(x === 1 ? n.chartRuler : ruler(x), ruler(y));
    return { tied: !!t, text: t ? `Rulers of the ${ordinal(x)} and ${ordinal(y)} (${label}): ${t}` : `No tie between the rulers of the ${ordinal(x)} and ${ordinal(y)} (${label})` };
  });
  const core = circuit.slice(0, 3).filter((c) => c.tied).length;

  // Fortune and Spirit, by sect.
  const fortuneLon = norm(day ? asc.lon + moon.lon - sun.lon : asc.lon + sun.lon - moon.lon);
  const spiritLon = norm(day ? asc.lon + sun.lon - moon.lon : asc.lon + moon.lon - sun.lon);
  const houseOf = (lon: number) => houseOfLon(n, lon);
  const fs = signIdx(fortuneLon), fh = houseOf(fortuneLon), fr = DOMICILE[fs]!;
  const place = (lon: number) => `${Math.floor(norm(lon) % 30)}° ${SIGNS[signIdx(lon)]!.name}`;
  const lvl = (id: Planet7) => (at(id) ? condition(id).level : "mixed");
  const word: Record<Level, string> = { strong: "strong", mixed: "middling", weak: "weak" };
  const bySign = (["jupiter", "venus"] as Planet7[]).filter((b) => at(b) && [0, 2, 3, 4, 6, 8, 9, 10].includes((signIdx(at(b)!.lon) - fs + 12) % 12));
  const es = (fs + 10) % 12, er = DOMICILE[es]!;
  const inEleventh = SEVEN.filter((b) => at(b) && signIdx(at(b)!.lon) === es);
  const fortune = [
    `Lot of Fortune at ${place(fortuneLon)}, in the ${ordinal(fh)} House (${HOUSE_KEYS[fh - 1]}); ${day ? "day" : "night"} formula`,
    `Its ruler, ${name(fr)}, is ${word[lvl(fr)]}${at(fr)?.house ? `, in the ${ordinal(at(fr)!.house!)} House` : ""}`,
    bySign.length ? `${bySign.map(name).join(" and ")} ${bySign.length > 1 ? "aspect" : "aspects"} Fortune by sign` : "Neither Venus nor Jupiter aspects Fortune by sign",
    `Eleventh sign from Fortune (acquisition): ${SIGNS[es]!.name}${inEleventh.length ? `, holding ${inEleventh.map(name).join(" and ")}` : ", empty"}; its ruler, ${name(er)}, is ${word[lvl(er)]}`,
    `Lot of Spirit at ${place(spiritLon)}, in the ${ordinal(houseOf(spiritLon))} House (${HOUSE_KEYS[houseOf(spiritLon) - 1]})`,
  ];

  const r2 = ruler(2);
  const dimensions = [
    dim("earning", "Earning Potential", "The capacity to generate income", [r2, ruler(10), "mercury", n.chartRuler]),
    dim("gains", "Career-Derived Gains", "Rewards, patrons and profit from the profession", [ruler(10), ruler(11), "jupiter"]),
    dim("enterprise", "Entrepreneurship", "Acting on your own account, with clients and competitors", [n.chartRuler, r2, ruler(7), ruler(10), "mars", "mercury"]),
    dim("speculation", "Investment & Speculation", "Risk taken for return", [ruler(5), r2, ruler(8), "jupiter", "mars"]),
    dim("others", "Wealth Through Others", "Partners, investors, inheritance and outside capital: access, not ownership", [ruler(7), ruler(8)]),
    dim("property", "Property & Assets", "Land, real estate and what is held", [ruler(4), r2, "saturn", fr]),
    dim("preservation", "Wealth Preservation", "Keeping and controlling what is acquired", [r2, "saturn"]),
  ];
  // Preservation also answers to a malefic contrary to the sect sitting in the 2nd.
  const contrary: Planet7 = day ? "mars" : "saturn";
  const pres = dimensions[6]!;
  if (at(contrary)?.house === 2 && contrary !== n.chartRuler && pres.level !== "weak") pres.level = pres.level === "strong" ? "mixed" : "weak";
  dimensions.push({
    id: "scale", title: "Large-Scale Wealth", about: "Repeated ties among the financial rulers, the benefics, the angles and Fortune",
    planets: [...new Set([r2, ruler(10), ruler(11), fr].filter(isSeven))],
    level: core === 3 && lvl(fr) !== "weak" ? "strong" : core === 0 ? "weak" : "mixed",
  });

  return {
    day, planets, dimensions, circuit, fortune,
    secondRuler: isSeven(r2) && at(r2)?.house ? `${name(r2)}, ruler of the 2nd, is in the ${ordinal(at(r2)!.house!)}: ${SECOND_RULER_IN[at(r2)!.house! - 1]}` : null,
  };
}
