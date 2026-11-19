/**
 * Natal promise modules. Each life area is assessed the same way, from a
 * shared planetary-condition engine, and reported as layered evidence rather
 * than a score:
 *
 * - primary: the rulers and occupants of the topic's houses and its natural
 *   significators, each with its condition;
 * - supporting: ties among the rulers (and to the ruler of the Ascendant),
 *   and the topic's Lots with their rulers;
 * - specialized: midpoint pictures on the topic's axes (a separate layer, in
 *   its own tradition);
 * - contradictory: whatever in those layers argues the other way.
 *
 * Traditional, modern and midpoint testimony stay labelled. A midpoint
 * picture that only restates a natal aspect between the same two planets says
 * so, so one configuration is not counted as several. The houses and
 * significators for each area are the practice's own table.
 */
import { BODIES, SIGNS, ordinal } from "../index";
import { PLANET_KEYS } from "../keywords";
import type { Planet7 } from "../traditional";
import { DOMICILE } from "../traditional";
import type { TargetId } from "../timeline";
import { conditionOf, houseOfLon, isSeven, nameOf, place, signIdx, tie, type Condition, type Level, type PromiseContext } from "./condition";
import { lotById, type LotId } from "./lots";
import { pictures, type Picture } from "./midpoints";

export type ModuleId = "marriage" | "children" | "wealth" | "career" | "fame" | "business" | "property" | "education" | "travel" | "friends" | "transformation" | "health" | "spirituality" | "family" | "creativity";
export interface ModuleDef {
  id: ModuleId;
  title: string;
  /** The first house is the topic's own; the rest bear on it. */
  houses: number[];
  naturals: TargetId[];
  lots: LotId[];
  midpoints: [TargetId, TargetId][];
  /** What the judgment should keep apart. */
  distinguish: string;
  caution?: string;
}

export const MODULES: ModuleDef[] = [
  { id: "marriage", title: "Marriage & Long-Term Partnership", houses: [7, 1, 4], naturals: ["venus", "moon", "sun"], lots: ["marriage-dorotheus-m", "marriage-dorotheus-f", "marriage-valens-m", "marriage-valens-f"],
    midpoints: [["sun", "moon"], ["venus", "mars"], ["venus", "saturn"], ["venus", "uranus"], ["venus", "neptune"], ["venus", "pluto"], ["moon", "saturn"], ["moon", "pluto"]],
    distinguish: "Orientation toward partnership, the partner's character, stability, the challenges, and the testimony for one or more significant unions. That a union is promised says nothing about whether it is fulfilling." },
  { id: "children", title: "Children & Parenthood", houses: [5, 4, 11], naturals: ["jupiter", "moon", "venus"], lots: ["children"],
    midpoints: [["moon", "jupiter"], ["moon", "venus"], ["venus", "jupiter"], ["moon", "saturn"], ["moon", "pluto"], ["jupiter", "saturn"]],
    distinguish: "The wish for children, the experience and responsibilities of parenthood, relationships with children, and traditional testimony about family size.",
    caution: "Traditional fertility symbolism is not a medical assessment and does not establish the ability to conceive or a number of children." },
  { id: "wealth", title: "Wealth & Financial Accumulation", houses: [2, 11, 8], naturals: ["jupiter", "venus", "mercury"], lots: ["fortune", "spirit", "basis"],
    midpoints: [["jupiter", "pluto"], ["jupiter", "saturn"], ["venus", "jupiter"], ["sun", "jupiter"], ["mercury", "jupiter"], ["mercury", "pluto"], ["venus", "pluto"], ["saturn", "pluto"], ["mc", "jupiter"], ["mc", "pluto"]],
    distinguish: "Earning, access to others' wealth, accumulation, and keeping what is acquired: four different things." },
  { id: "career", title: "Career & Public Achievement", houses: [10, 6, 11], naturals: ["sun", "saturn", "mercury"], lots: ["spirit"],
    midpoints: [["sun", "mc"], ["jupiter", "mc"], ["saturn", "mc"], ["pluto", "mc"], ["mercury", "mc"], ["mars", "mc"], ["uranus", "mc"], ["sun", "saturn"]],
    distinguish: "Vocation, occupational aptitude, professional success, authority and public recognition. A strong career does not by itself mean financial accumulation." },
  { id: "fame", title: "Fame & Recognition", houses: [10, 1, 11], naturals: ["sun", "jupiter"], lots: ["spirit", "exaltation"],
    midpoints: [["sun", "jupiter"], ["sun", "mc"], ["jupiter", "mc"], ["jupiter", "pluto"], ["sun", "pluto"], ["uranus", "mc"]],
    distinguish: "Visibility, popularity, authority, influence and lasting recognition; and all of these apart from wealth." },
  { id: "business", title: "Entrepreneurship & Business", houses: [1, 2, 7, 10], naturals: ["mercury", "mars", "saturn", "jupiter"], lots: ["fortune", "spirit"],
    midpoints: [["mercury", "mars"], ["mercury", "jupiter"], ["mars", "mc"], ["mars", "jupiter"]],
    distinguish: "Initiative, commercial skill, clients and partners, and the staying power to build something." },
  { id: "property", title: "Property & Real Estate", houses: [4, 2, 8], naturals: ["saturn", "moon"], lots: ["fortune", "basis"],
    midpoints: [["moon", "saturn"], ["jupiter", "saturn"], ["venus", "saturn"], ["moon", "jupiter"], ["saturn", "pluto"]],
    distinguish: "Owning property, accumulating it, inheriting it, managing family wealth, and carrying the obligations that come with it." },
  { id: "education", title: "Education & Intellectual Achievement", houses: [9, 3], naturals: ["mercury", "jupiter"], lots: ["spirit"],
    midpoints: [["mercury", "jupiter"], ["mercury", "saturn"], ["mercury", "uranus"]],
    distinguish: "Aptitude, formal study, and what is made of it." },
  { id: "travel", title: "Travel, Relocation & Foreign Connections", houses: [9, 3, 4, 12], naturals: ["mercury", "jupiter", "moon"], lots: [],
    midpoints: [["moon", "uranus"], ["jupiter", "uranus"], ["asc", "uranus"]],
    distinguish: "Short journeys, long ones, changes of residence, and a life lived abroad." },
  { id: "friends", title: "Friendships & Influential Networks", houses: [11, 7], naturals: ["jupiter", "venus"], lots: [],
    midpoints: [["sun", "jupiter"], ["venus", "jupiter"], ["jupiter", "mc"]],
    distinguish: "Friends, patrons and benefactors, and what comes through them." },
  { id: "transformation", title: "Psychological Transformation", houses: [8, 12, 7], naturals: ["pluto", "saturn", "moon"], lots: [],
    midpoints: [["moon", "pluto"], ["saturn", "pluto"], ["sun", "pluto"]],
    distinguish: "Crisis, loss, and what is rebuilt afterwards. This is a modern, psychological reading." },
  { id: "health", title: "Health & Physical Vitality", houses: [1, 6, 12], naturals: ["sun", "moon"], lots: ["fortune"], midpoints: [],
    distinguish: "Constitution and vitality, as the tradition describes them.",
    caution: "A historical technique: it does not diagnose illness. The length-of-life methods are kept separately, on the Traditional tab." },
  { id: "spirituality", title: "Spirituality & Religious Vocation", houses: [9, 12], naturals: ["jupiter", "saturn", "neptune"], lots: ["spirit"],
    midpoints: [["sun", "neptune"], ["saturn", "neptune"], ["jupiter", "neptune"], ["moon", "pluto"]],
    distinguish: "Belief, practice, retreat and vocation." },
  { id: "family", title: "Family & Ancestry", houses: [4, 10], naturals: ["moon", "sun"], lots: [],
    midpoints: [["moon", "saturn"], ["moon", "jupiter"]],
    distinguish: "The home of origin, the parents, and what is inherited from them." },
  { id: "creativity", title: "Creativity & Artistic Accomplishment", houses: [5, 10], naturals: ["venus", "sun", "mercury"], lots: [],
    midpoints: [["venus", "neptune"], ["sun", "venus"], ["mercury", "venus"], ["venus", "mc"]],
    distinguish: "Talent, the work produced, and recognition for it." },
];

export type Tradition = "traditional" | "modern" | "midpoint";
export interface Evidence {
  text: string;
  tone: "support" | "challenge" | "neutral";
  tradition: Tradition;
  layer: "primary" | "supporting" | "specialized";
  /** The working behind a planet's condition. */
  detail?: string;
  weight?: number;
}
export interface Assessment {
  def: ModuleDef;
  primary: Evidence[];
  supporting: Evidence[];
  specialized: Evidence[];
  contradictory: Evidence[];
  /** The most supportive and the most limiting primary testimony, for the synthesis. */
  strongest: string[];
  constraints: string[];
  /** What to watch in the timing techniques. */
  monitor: string[];
}

const TONE: Record<Level, Evidence["tone"]> = { strong: "support", mixed: "neutral", weak: "challenge" };
const WORD: Record<Level, string> = { strong: "strong", mixed: "middling", weak: "weak" };
const detailOf = (c: Condition) => c.notes.map((x) => `${x.text} (${x.points > 0 ? "+" : ""}${x.points})`).join("; ");
const FRUITFUL = [3, 7, 11], BARREN = [2, 4, 5], DOUBLE = [2, 5, 8, 11];
const ANGLE_LABEL: Record<Picture["angle"], string> = { 0: "on the axis", 90: "square the axis", 45: "45° to the axis" };

export function assess(ctx: PromiseContext, def: ModuleDef): Assessment {
  const { n } = ctx;
  const primary: Evidence[] = [], supporting: Evidence[] = [], specialized: Evidence[] = [];
  const ruler = (h: number) => n.houseRulers(h)[0];

  // Who answers for the topic, and in what capacity.
  const roles = new Map<TargetId, string[]>();
  const role = (id: TargetId | null | undefined, r: string) => { if (id && n.byId.has(id)) roles.set(id, [...(roles.get(id) ?? []), r]); };
  for (const h of def.houses) role(ruler(h), `ruler of the ${ordinal(h)}`);
  for (const h of def.houses) n.occupants(h).forEach((id) => role(id, `in the ${ordinal(h)}`));
  for (const id of def.naturals) role(id, "natural significator");
  if (def.id === "health") role(n.chartRuler, "ruler of the Ascendant");

  for (const [id, rs] of roles) {
    const p = n.byId.get(id)!;
    if (isSeven(id)) {
      const c = conditionOf(ctx, id)!;
      primary.push({ layer: "primary", tradition: "traditional", tone: TONE[c.level], weight: c.net, detail: detailOf(c), text: `${nameOf(id)} (${rs.join(", ")}) at ${place(p.lon)}${p.house ? `, ${ordinal(p.house)} House` : ""}: ${WORD[c.level]}` });
    } else if (id !== "asc" && id !== "mc") {
      primary.push({ layer: "primary", tradition: "modern", tone: "neutral", text: `${nameOf(id)} (${rs.join(", ")}) at ${place(p.lon)}${p.house ? `, ${ordinal(p.house)} House` : ""}: ${PLANET_KEYS[id] ?? ""}` });
    }
  }

  // Ties: is the topic's ruler joined to the person, and to the houses that bear on it?
  const main = def.houses[0]!;
  const pairs: [TargetId | null | undefined, TargetId | null | undefined, string][] = [];
  if (main !== 1) pairs.push([n.chartRuler, ruler(main), `Rulers of the 1st and ${ordinal(main)}`]);
  for (const h of def.houses.slice(1)) if (h !== 1) pairs.push([ruler(main), ruler(h), `Rulers of the ${ordinal(main)} and ${ordinal(h)}`]);
  for (const [a, b, label] of pairs) {
    const t = tie(n, a, b);
    supporting.push({ layer: "supporting", tradition: "traditional", tone: t ? "support" : "neutral", text: t ? `${label}: ${t}` : `${label}: no tie` });
  }
  for (const id of def.lots) {
    const lot = lotById(id), lon = lot.lon(ctx);
    if (lon === null) continue;
    const r = DOMICILE[signIdx(lon)]!, c = conditionOf(ctx, r);
    supporting.push({
      layer: "supporting", tradition: "traditional", tone: c ? TONE[c.level] : "neutral", detail: `${lot.formula}. ${lot.sect}. ${lot.verification.status === "verified" ? "" : `Formula ${lot.verification.status}. `}${c ? `${nameOf(r)}: ${detailOf(c)}` : ""}`,
      text: `${lot.name} (${lot.source}): ${place(lon)}, ${ordinal(houseOfLon(n, lon))} House; its ruler ${nameOf(r)} is ${c ? WORD[c.level] : "not judged"}`,
    });
  }

  // Topic-specific traditional notes.
  const cusp = (h: number) => signIdx(n.cusps![h - 1]!);
  if (def.id === "children") {
    const s = cusp(5), rs = ruler(5) ? signIdx(n.byId.get(ruler(5)!)!.lon) : -1;
    const cls = (x: number) => (FRUITFUL.includes(x) ? "fruitful" : BARREN.includes(x) ? "barren" : "moderate");
    supporting.push({ layer: "supporting", tradition: "traditional", tone: "neutral", detail: "Lilly: Cancer, Scorpio and Pisces fruitful; Gemini, Leo and Virgo barren. The classifications vary by author and are one component only.", text: `5th cusp in ${SIGNS[s]!.name} (${cls(s)})${rs >= 0 ? `; its ruler in ${SIGNS[rs]!.name} (${cls(rs)})` : ""}` });
  }
  if (def.id === "marriage") {
    const where = [["the 7th cusp", cusp(7)], ...(ruler(7) ? [[`${nameOf(ruler(7)!)}, its ruler`, signIdx(n.byId.get(ruler(7)!)!.lon)]] : []), ...(n.byId.get("venus") && ruler(7) !== "venus" ? [["Venus", signIdx(n.byId.get("venus")!.lon)]] : [])] as [string, number][];
    const dbl = where.filter(([, s]) => DOUBLE.includes(s)).map(([w]) => w);
    if (dbl.length) supporting.push({ layer: "supporting", tradition: "traditional", tone: "neutral", detail: "Double-bodied signs appear in some traditional rules for more than one union. They never establish a number of marriages alone.", text: `In double-bodied signs: ${dbl.join(", ")}` });
  }
  if (def.id === "career") {
    const three = (["mercury", "venus", "mars"] as Planet7[]).map((id) => conditionOf(ctx, id)).filter((c): c is Condition => !!c).sort((a, b) => b.net - a.net);
    if (three[0]) supporting.push({ layer: "supporting", tradition: "traditional", tone: "neutral", detail: three.map((c) => `${nameOf(c.id)} ${c.net > 0 ? "+" : ""}${c.net}`).join(", "), text: `Of the three vocational significators (Mercury, Venus, Mars), ${nameOf(three[0].id)} is the best placed` });
  }

  // Midpoint pictures, most relevant first: those completed by one of the topic's own significators.
  const pics = pictures(n, def.midpoints);
  const relevant = (p: Picture) => roles.has(p.point) || p.point === "mc" || p.point === "asc";
  for (const p of pics.sort((a, b) => Number(relevant(b)) - Number(relevant(a)) || a.orb - b.orb)) {
    const natal = n.natalAspect(p.pair[0], p.pair[1]);
    const why = roles.get(p.point)?.join(", ");
    specialized.push({
      layer: "specialized", tradition: "midpoint", tone: "neutral", weight: relevant(p) ? 1 : 0,
      detail: `Midpoint at ${place(p.midpoint)}; ${Math.round(p.orb * 60)}′ from exact, ${ANGLE_LABEL[p.angle]}${p.close ? "; close" : ""}.${natal ? ` ${nameOf(p.pair[0])} and ${nameOf(p.pair[1])} are also in natal ${natal}: the same configuration, not separate testimony.` : ""}`,
      text: `${BODIES[p.pair[0]].name}/${BODIES[p.pair[1]].name} = ${BODIES[p.point].name}${why ? ` (${why})` : ""}${natal ? ` · restates the natal ${natal}` : ""}`,
    });
  }

  const contradictory = [...primary, ...supporting].filter((e) => e.tone === "challenge");
  const byWeight = (xs: Evidence[], dir: 1 | -1) => xs.filter((e) => e.weight !== undefined).sort((a, b) => dir * ((b.weight ?? 0) - (a.weight ?? 0))).slice(0, 2).map((e) => e.text);
  const monitor = [...new Set([...[...roles.keys()].map(nameOf), ...def.lots.map((l) => lotById(l).name)])];
  return {
    def, primary: primary.filter((e) => e.tone !== "challenge"), supporting: supporting.filter((e) => e.tone !== "challenge"), specialized, contradictory,
    strongest: byWeight(primary.filter((e) => e.tone === "support"), 1), constraints: byWeight(primary.filter((e) => e.tone === "challenge"), -1), monitor,
  };
}

export const assessAll = (ctx: PromiseContext) => MODULES.map((def) => assess(ctx, def));
