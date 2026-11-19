/**
 * Aspect patterns in one chart: Grand Trine, T-Square, Grand Cross, Yod, Kite,
 * Mystic Rectangle and Stellium (3+ planets in a sign or house). Built from the
 * chart's own aspects, so its orbs and aspect choices apply.
 */
import { SIGNS } from "./meta";
import type { Aspect, AspectId, BodyId, ChartPoints } from "./types";

export type PatternKind = "Grand Trine" | "T-Square" | "Grand Cross" | "Yod" | "Kite" | "Mystic Rectangle" | "Stellium";

export interface Pattern {
  kind: PatternKind;
  points: BodyId[];
  /** T-Square, Yod, Kite: the focal point. */
  apex?: BodyId;
  /** e.g. "Fire", "Cardinal", "in Pisces", "in the 9th house". */
  detail?: string;
}

const PLANETS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const PATTERN_POINTS = new Set<BodyId>([...PLANETS, "chiron", "node"]);
const ELEMENTS = ["Fire", "Earth", "Air", "Water"];
const MODES = ["Cardinal", "Fixed", "Mutable"];

export function findPatterns(p: ChartPoints, aspects: Aspect[]): Pattern[] {
  const inner = aspects.filter((a) => a.aRing === "inner" && a.bRing === "inner" && PATTERN_POINTS.has(a.a) && PATTERN_POINTS.has(a.b));
  const rel = new Map<string, AspectId>();
  for (const a of inner) {
    rel.set(`${a.a}|${a.b}`, a.type);
    rel.set(`${a.b}|${a.a}`, a.type);
  }
  const is = (x: BodyId, y: BodyId, t: AspectId) => rel.get(`${x}|${y}`) === t;
  const ids = [...new Set(inner.flatMap((a) => [a.a, a.b]))];
  const lon = new Map(p.bodies.map((b) => [b.id, b.lon]));
  const sign = (id: BodyId) => Math.floor((lon.get(id) ?? 0) / 30) % 12;
  const key = (xs: BodyId[]) => [...xs].sort().join("+");
  const out: Pattern[] = [];
  const seen = new Set<string>();
  const add = (pt: Pattern) => {
    const k = pt.kind + ":" + key(pt.points);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(pt);
    }
  };

  const n = ids.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        const [a, b, c] = [ids[i]!, ids[j]!, ids[k]!];
        if (is(a, b, "trine") && is(b, c, "trine") && is(a, c, "trine")) {
          const els = new Set([a, b, c].map((x) => sign(x) % 4));
          add({ kind: "Grand Trine", points: [a, b, c], detail: els.size === 1 ? ELEMENTS[[...els][0]!] : "Mixed Elements" });
        }
        for (const [x, y, apex] of [[a, b, c], [a, c, b], [b, c, a]] as const) {
          if (is(x, y, "opposition") && is(apex, x, "square") && is(apex, y, "square")) add({ kind: "T-Square", points: [x, y, apex], apex, detail: MODES[sign(apex) % 3] });
          if (is(x, y, "sextile") && is(apex, x, "quincunx") && is(apex, y, "quincunx")) add({ kind: "Yod", points: [x, y, apex], apex });
        }
      }

  // Four-point patterns, from pairs of oppositions.
  const opps = inner.filter((a) => a.type === "opposition").map((a) => [a.a, a.b] as [BodyId, BodyId]);
  for (let i = 0; i < opps.length; i++)
    for (let j = i + 1; j < opps.length; j++) {
      const [a, b] = opps[i]!, [c, d] = opps[j]!;
      if (new Set([a, b, c, d]).size < 4) continue;
      if (is(a, c, "square") && is(a, d, "square") && is(b, c, "square") && is(b, d, "square")) add({ kind: "Grand Cross", points: [a, b, c, d], detail: MODES[sign(a) % 3] });
      const mystic = (is(a, c, "trine") && is(b, d, "trine") && is(a, d, "sextile") && is(b, c, "sextile")) || (is(a, d, "trine") && is(b, c, "trine") && is(a, c, "sextile") && is(b, d, "sextile"));
      if (mystic) add({ kind: "Mystic Rectangle", points: [a, b, c, d] });
    }
  // Kite: a Grand Trine with a fourth point opposite one corner and sextile the other two.
  for (const gt of out.filter((x) => x.kind === "Grand Trine")) {
    for (const apex of gt.points) {
      const others = gt.points.filter((x) => x !== apex);
      for (const d of ids) {
        if (gt.points.includes(d)) continue;
        if (is(d, apex, "opposition") && others.every((o) => is(d, o, "sextile"))) add({ kind: "Kite", points: [...gt.points, d], apex, detail: gt.detail });
      }
    }
  }
  // A Grand Cross already contains its T-Squares.
  const crosses = out.filter((x) => x.kind === "Grand Cross");
  const filtered = out.filter((x) => x.kind !== "T-Square" || !crosses.some((c) => x.points.every((pt) => c.points.includes(pt))));

  // Stelliums: three or more planets in one sign, or in one house.
  const planets = p.bodies.filter((b) => PLANETS.includes(b.id));
  for (let s = 0; s < 12; s++) {
    const inSign = planets.filter((b) => Math.floor(b.lon / 30) % 12 === s).map((b) => b.id);
    if (inSign.length >= 3) filtered.push({ kind: "Stellium", points: inSign, detail: `In ${SIGNS[s]!.name}` });
  }
  for (let h = 1; h <= 12; h++) {
    const inHouse = planets.filter((b) => b.house === h).map((b) => b.id);
    if (inHouse.length >= 3) filtered.push({ kind: "Stellium", points: inHouse, detail: `In the ${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"} House` });
  }
  const order: PatternKind[] = ["Grand Cross", "Grand Trine", "Kite", "Mystic Rectangle", "T-Square", "Yod", "Stellium"];
  return filtered.sort((x, y) => order.indexOf(x.kind) - order.indexOf(y.kind));
}
