import type { AspectClass, BodyId, Chart, PointId } from "@/lib/astro/types";
import { BODIES } from "@/lib/astro/types";
import { POINT_NAMES, SIGNS, SYNASTRY_ORBS, aspectBetween, elementOf, houseOf, ordinal, signIndex } from "@/lib/astro/zodiac";
import { natalContactKeys } from "./triggers";
import { synastryText } from "./synastry";
import { BODY_SHOWS, DYNAMICS, ELEMENT_PEOPLE, HOUSE_AREA, SIGN_PEOPLE } from "./text";

/**
 * The pattern across past partners.
 *
 * Every partner is reduced to a set of "signatures": where their planets are,
 * and how their chart touches yours. A signature that repeats across partners
 * is only interesting if it would be unusual by chance, so each one is compared
 * with its base rate: how often it appears among random people born in the same
 * years as your partners (which also cancels out contacts that a whole
 * generation shares). The page reports the number of repeats that random groups
 * of the same size produce, next to yours.
 */

export interface Subject {
  chart: Chart;
  /** Birth time known: their Moon aspects and house positions can be used. */
  hasTime: boolean;
}

const PERSONAL: BodyId[] = ["sun", "moon", "venus", "mars"];
const SLOW = new Set<PointId>(["jupiter", "saturn", "uranus", "neptune", "pluto", "node"]);
const OVERLAY: BodyId[] = ["sun", "moon", "venus", "mars", "saturn"];

/** All signatures a person carries, relative to your chart. */
export function signaturesOf(you: Chart, them: Subject): Set<string> {
  const out = new Set<string>();
  const t = them.chart.bodies;
  for (const id of PERSONAL) {
    if (id === "moon" && !them.chart.moonSignCertain) continue;
    out.add(`sign|${id}|${signIndex(t[id].lon)}`);
    out.add(`element|${id}|${elementOf(t[id].lon)}`);
    if (you.houses) {
      if (signIndex(t[id].lon) === signIndex(you.houses.asc + 180)) out.add(`angle|${id}|dsc`);
      if (signIndex(t[id].lon) === signIndex(you.houses.asc)) out.add(`angle|${id}|asc`);
    }
  }
  if (you.houses)
    for (const id of OVERLAY) {
      if (id === "moon" && !them.hasTime) continue;
      out.add(`house|${id}|${houseOf(t[id].lon, you.houses.cusps)}`);
    }
  const yours: [PointId, number][] = BODIES.map((id) => [id, you.bodies[id].lon]);
  if (you.houses) yours.push(["asc", you.houses.asc]);
  else yours.splice(yours.findIndex(([id]) => id === "moon"), 1); // your Moon is too uncertain without a time
  for (const [yid, ylon] of yours)
    for (const tid of BODIES) {
      if (SLOW.has(yid) && SLOW.has(tid)) continue;
      if (tid === "moon" && !them.hasTime) continue;
      const asp = aspectBetween(ylon, t[tid].lon, SYNASTRY_ORBS);
      if (asp) out.add(`contact|${yid}|${tid}|${asp.cls}`);
    }
  // How this person meets the aspects in your own chart: sets off, eases, brings out.
  for (const key of natalContactKeys(you, them.chart)) out.add(key);
  return out;
}

/** A signature in words. */
export function describeSignature(key: string, you: Chart): { title: string; body: string } {
  const [kind, a, b, c] = key.split("|") as [string, string, string, string?];
  const body = a as BodyId;
  switch (kind) {
    case "sign":
      return { title: `${POINT_NAMES[body]} in ${SIGNS[Number(b)]!.name}`, body: `Their ${BODY_SHOWS[body]} is ${SIGN_PEOPLE[Number(b)]}.` };
    case "element":
      return { title: `${POINT_NAMES[body]} in ${b === "air" || b === "earth" ? "an" : "a"} ${b} sign`, body: `Their ${BODY_SHOWS[body]} is ${ELEMENT_PEOPLE[b]}.` };
    case "angle": {
      const sign = SIGNS[signIndex(you.houses!.asc + (b === "dsc" ? 180 : 0))]!.name;
      return b === "dsc"
        ? { title: `${POINT_NAMES[body]} in ${sign}, your Descendant sign`, body: "Your Descendant describes the partner you look for. These people fit that description." }
        : { title: `${POINT_NAMES[body]} in ${sign}, your rising sign`, body: "They come across the way you do, which makes them feel familiar from the start." };
    }
    case "trigger": {
      const d = DYNAMICS[a]!;
      const [x, y] = a.split("-") as [BodyId, BodyId];
      return { title: `Sets off your “${d.name}”`, body: `Their planets land on your ${POINT_NAMES[x]}–${POINT_NAMES[y]} aspect. ${d.hard}` };
    }
    case "eases": {
      const d = DYNAMICS[a]!;
      const [x, y] = a.split("-") as [BodyId, BodyId];
      return { title: `Eases your “${d.name}”`, body: `Their planets make an easy aspect to your ${POINT_NAMES[x]}–${POINT_NAMES[y]} aspect, so this difficulty of yours is calmer around them. ${d.hard}` };
    }
    case "gift": {
      const d = DYNAMICS[a]!;
      const [x, y] = a.split("-") as [BodyId, BodyId];
      return { title: `Brings out your “${d.easyName}”`, body: `Their planets support your ${POINT_NAMES[x]}–${POINT_NAMES[y]} aspect, one of the strengths in your chart. ${d.flowing}` };
    }
    case "house":
      return { title: `${POINT_NAMES[body]} in your ${ordinal(Number(b))} house`, body: `Their ${BODY_SHOWS[body]} lands in the part of your chart to do with ${HOUSE_AREA[Number(b) - 1]}. That is where you feel them most.` };
    default: {
      // A contact between the two charts, worded from the same source as the couple report.
      const kind = c === "conjunction" ? "conjunction" : c === "hard" ? "challenging" : "flowing";
      const how = c === "conjunction" ? "on" : c === "hard" ? "in tension with" : "in harmony with";
      return { title: `Their ${POINT_NAMES[b as PointId]} ${how} your ${POINT_NAMES[a as PointId]}`, body: synastryText(a as PointId, b as PointId, kind, null).body };
    }
  }
}

/** Whether a signature can be judged for this person at all. */
function evaluable(key: string, s: Subject) {
  const [kind, a, b] = key.split("|");
  if (kind === "contact") return b !== "moon" || s.hasTime;
  if (a !== "moon") return true;
  return kind === "house" ? s.hasTime : s.chart.moonSignCertain;
}

/** P(X ≥ k) for X ~ Binomial(n, p). */
export function binomialTail(k: number, n: number, p: number) {
  let tail = 0;
  for (let i = k; i <= n; i++) {
    let c = 1;
    for (let j = 0; j < i; j++) c = (c * (n - j)) / (j + 1);
    tail += c * p ** i * (1 - p) ** (n - i);
  }
  return Math.min(1, tail);
}

export interface Repeat {
  key: string;
  title: string;
  body: string;
  /** Present in `count` of the `of` partners it could be judged for. */
  count: number;
  of: number;
  names: string[];
  /** Share of random people born in the same years who carry it. */
  baseRate: number;
  /** Chance of seeing it this often by coincidence, for this one signature. */
  chance: number;
  strength: "strong" | "clear" | "faint";
}

export interface ExPattern {
  repeats: Repeat[];
  /** Signatures looked at. */
  checked: number;
  /** Repeats a random group of the same size shows on average. */
  expectedByChance: number;
  partners: number;
}

const THRESHOLD = 0.1;

function passing(counts: Map<string, number>, subjects: Subject[], rate: (key: string) => number) {
  const out: { key: string; count: number; of: number; chance: number }[] = [];
  for (const [key, count] of counts) {
    if (count < 2) continue;
    const of = subjects.filter((s) => evaluable(key, s)).length;
    if (count * 2 < of) continue;
    const chance = binomialTail(count, of, rate(key));
    if (chance <= THRESHOLD) out.push({ key, count, of, chance });
  }
  return out;
}

/**
 * @param reference signature sets of random people born in the same years (see lib/server/reference.ts)
 * @param random    seeded generator, so that the same data always gives the same page
 */
export function patternAcross(you: Chart, exes: (Subject & { name: string })[], reference: Set<string>[], random: () => number): ExPattern {
  const sets = exes.map((e) => signaturesOf(you, e));
  const refCount = new Map<string, number>();
  for (const r of reference) for (const k of r) refCount.set(k, (refCount.get(k) ?? 0) + 1);
  const rate = (key: string) => ((refCount.get(key) ?? 0) + 1) / (reference.length + 2);

  const counts = new Map<string, number>();
  for (const s of sets) for (const k of s) counts.set(k, (counts.get(k) ?? 0) + 1);

  const repeats: Repeat[] = passing(counts, exes, rate)
    .sort((a, b) => a.chance - b.chance)
    .map((r) => ({
      ...r,
      ...describeSignature(r.key, you),
      names: exes.filter((_, i) => sets[i]!.has(r.key)).map((e) => e.name),
      baseRate: rate(r.key),
      strength: r.chance <= 0.01 ? "strong" : r.chance <= 0.04 ? "clear" : "faint",
    }));

  // How many repeats does a random group of the same size (and the same known/unknown birth times) show?
  let total = 0;
  const GROUPS = 300;
  if (exes.length >= 2 && reference.length >= exes.length)
    for (let g = 0; g < GROUPS; g++) {
      const groupCounts = new Map<string, number>();
      const used = new Set<number>();
      for (const ex of exes) {
        let i = Math.floor(random() * reference.length);
        while (used.has(i)) i = (i + 1) % reference.length;
        used.add(i);
        for (const k of reference[i]!) if (evaluable(k, ex)) groupCounts.set(k, (groupCounts.get(k) ?? 0) + 1);
      }
      total += passing(groupCounts, exes, rate).length;
    }

  const universe = new Set<string>(refCount.keys());
  for (const k of counts.keys()) universe.add(k);
  return { repeats, checked: universe.size, expectedByChance: total / GROUPS, partners: exes.length };
}

/** How a new person measures against your repeats. */
export function checkAgainst(you: Chart, repeats: Repeat[], person: Subject) {
  const theirs = signaturesOf(you, person);
  const carried: Repeat[] = [];
  const absent: Repeat[] = [];
  const unknown: Repeat[] = [];
  for (const r of repeats) (!evaluable(r.key, person) ? unknown : theirs.has(r.key) ? carried : absent).push(r);
  return { carried, absent, unknown };
}

/* ---------- The plain facts ---------- */

export interface ExFacts {
  name: string;
  birthDate: string;
  startYear?: number | null;
  endYear?: number | null;
  ending?: "me" | "them" | "mutual" | null;
}

/** Patterns that need no astrology: ages, lengths, endings. */
export function plainFacts(yourBirthDate: string, exes: ExFacts[]): string[] {
  const out: string[] = [];
  if (exes.length < 2) return out;
  const gaps = exes.map((e) => (Date.parse(yourBirthDate) - Date.parse(e.birthDate)) / (365.25 * 86_400_000)); // positive: they are older
  const older = gaps.filter((g) => g >= 1).length;
  const younger = gaps.filter((g) => g <= -1).length;
  const span = (xs: number[]) => {
    const lo = Math.round(Math.min(...xs)), hi = Math.round(Math.max(...xs));
    return lo === hi ? `${lo} year${lo === 1 ? "" : "s"}` : `${lo} to ${hi} years`;
  };
  if (older === exes.length) out.push(`Every partner was older than you, by ${span(gaps)}.`);
  else if (younger === exes.length) out.push(`Every partner was younger than you, by ${span(gaps.map((g) => -g))}.`);
  else if (older === 0 && younger === 0) out.push("Every partner was within a year of your own age.");
  else out.push(`${older} of ${exes.length} partners were older than you and ${younger} were younger.`);

  const lengths = exes.filter((e) => e.startYear && e.endYear).map((e) => e.endYear! - e.startYear!);
  if (lengths.length >= 2) {
    const avg = lengths.reduce((a, c) => a + c, 0) / lengths.length;
    const lo = Math.min(...lengths), hi = Math.max(...lengths);
    out.push(
      hi - lo <= 1
        ? `Your relationships have lasted about ${Math.max(1, Math.round(avg))} year${Math.round(avg) > 1 ? "s" : ""} each.`
        : `Your relationships have lasted from ${lo < 1 ? "under a year" : `${lo} year${lo > 1 ? "s" : ""}`} to ${hi} years, ${avg.toFixed(1)} on average.`,
    );
  }
  const endings = exes.filter((e) => e.ending);
  if (endings.length >= 2) {
    const by = (k: string) => endings.filter((e) => e.ending === k).length;
    const [me, them, mutual] = [by("me"), by("them"), by("mutual")];
    if (me * 2 > endings.length) out.push(`You ended ${me} of ${endings.length}.`);
    else if (them * 2 > endings.length) out.push(`They ended ${them} of ${endings.length}.`);
    else if (mutual * 2 > endings.length) out.push(`${mutual} of ${endings.length} ended by mutual decision.`);
    else out.push(`Endings were mixed: you ended ${me}, they ended ${them}, ${mutual} were mutual.`);
  }
  return out;
}
