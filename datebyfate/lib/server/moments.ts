import "server-only";
import type { BodyId, Chart } from "@/lib/astro/types";
import { separation } from "@/lib/astro/spherical";
import { POINT_NAMES, SIGNS, houseOf, ordinal, signIndex } from "@/lib/astro/zodiac";
import { binomialTail } from "@/lib/reading/exes";
import { FUNCTION, HOUSE_TRANSIT, PROGRESSED_MOON_HOUSE, PROGRESSED_MOON_SIGN, TRANSIT } from "@/lib/reading/forecast";
import type { Insight } from "@/lib/reading/own";
import { bodiesAt } from "./swiss";

/**
 * What was happening in your chart on a given day: the day you met someone, the day a relationship
 * began, the day it ended. The factors are the ones the calendar uses (slow planets on your Sun,
 * Moon, Venus, Mars and partnership axis; slow planets in your houses; your progressed Moon), read
 * the same way, after Forrest's "The Changing Sky".
 *
 * Across several relationships the same factor at each beginning, or each ending, is a pattern
 * only if it is unusual. So, as with the pattern across partners, each one is compared with how
 * often it holds on random days of your adult life.
 */

const MOVERS: [BodyId, number][] = [["jupiter", 5], ["saturn", 3.5], ["uranus", 3], ["neptune", 2], ["pluto", 2]];
const DAY = 86_400_000;

/** Every timing factor in force for this chart at a moment, as keys. */
export function momentKeys(chart: Chart, ms: number): string[] {
  const out: string[] = [];
  const sky = bodiesAt(ms, MOVERS.map(([id]) => id));
  const targets: [string, number][] = [["sun", chart.bodies.sun.lon], ["venus", chart.bodies.venus.lon], ["mars", chart.bodies.mars.lon]];
  if (chart.houses) targets.push(["moon", chart.bodies.moon.lon], ["axis", chart.houses.asc]);
  for (const [planet, orb] of MOVERS) {
    for (const [target, lon] of targets) {
      const sep = separation(sky[planet].lon, lon);
      // On the partnership axis, a conjunction with either end counts the same.
      if (sep <= orb || (target === "axis" && 180 - sep <= orb)) out.push(`transit|${planet}|${target}|on`);
      else if (Math.abs(sep - 90) <= orb || 180 - sep <= orb) out.push(`transit|${planet}|${target}|hard`);
    }
    if (chart.houses) out.push(`house|${planet}|${houseOf(sky[planet].lon, chart.houses.cusps)}`);
  }
  if (chart.houses) {
    const birth = Date.parse(chart.utc);
    const moon = bodiesAt(birth + (ms - birth) / 365.2422, ["moon"]).moon.lon;
    out.push(`pmoon-house|${houseOf(moon, chart.houses.cusps)}`, `pmoon-sign|${signIndex(moon)}`);
  }
  return out;
}

/** A timing factor in words. */
export function describeMoment(key: string): { title: string; body: string } {
  const [kind, a, b, c] = key.split("|") as [string, string, string, string?];
  if (kind === "transit") {
    const t = TRANSIT[a]!;
    const where = b === "axis" ? "Your Partnership Axis" : `Your ${POINT_NAMES[b as BodyId]}`;
    return { title: `${POINT_NAMES[a as BodyId]} ${c === "on" ? "On" : "Square Or Opposite"} ${where}`, body: t.task.replace("{F}", FUNCTION[b]!) };
  }
  if (kind === "house") {
    const h = HOUSE_TRANSIT[Number(b)];
    return { title: `${POINT_NAMES[a as BodyId]} In Your ${ordinal(Number(b))} House`, body: h ? h.body.replace("{P}", POINT_NAMES[a as BodyId]) : `${POINT_NAMES[a as BodyId]} was moving through your ${ordinal(Number(b))} house.` };
  }
  if (kind === "pmoon-house") return { title: `Progressed Moon In Your ${ordinal(Number(a))} House`, body: PROGRESSED_MOON_HOUSE[Number(a) - 1]! };
  return { title: `Progressed Moon In ${SIGNS[Number(a)]!.name}`, body: PROGRESSED_MOON_SIGN[Number(a)]! };
}

/** What stood out on one date: slow planets on your points and in your houses of love, and the progressed Moon. */
export function momentReading(chart: Chart, date: string): Insight[] {
  return momentKeys(chart, Date.parse(date + "T12:00:00Z"))
    .filter((k) => !k.startsWith("house|") || ["5", "7", "8"].includes(k.split("|")[2]!))
    .map((k) => ({ ...describeMoment(k), basis: `On ${date}` }));
}

export interface TimingRepeat {
  key: string;
  title: string;
  body: string;
  count: number;
  of: number;
  names: string[];
  baseRate: number;
  chance: number;
}

/**
 * Factors that were in force at several of the given dates more often than chance would have it.
 * @param random seeded, so the same data always gives the same page
 */
export function timingRepeats(chart: Chart, events: { name: string; date: string }[], random: () => number): { repeats: TimingRepeat[]; expectedByChance: number } {
  if (events.length < 2) return { repeats: [], expectedByChance: 0 };
  const sets = events.map((e) => new Set(momentKeys(chart, Date.parse(e.date + "T12:00:00Z"))));
  // Random days from the age of 15 to today: what is usual for this chart.
  const from = Date.parse(chart.utc) + 15 * 365.25 * DAY, span = Math.max(DAY, Date.now() - from);
  const reference = Array.from({ length: 300 }, () => new Set(momentKeys(chart, from + random() * span)));
  const refCount = new Map<string, number>();
  for (const r of reference) for (const k of r) refCount.set(k, (refCount.get(k) ?? 0) + 1);
  const rate = (k: string) => ((refCount.get(k) ?? 0) + 1) / (reference.length + 2);
  const n = events.length;
  const passing = (group: Set<string>[]) => {
    const counts = new Map<string, number>();
    for (const s of group) for (const k of s) counts.set(k, (counts.get(k) ?? 0) + 1);
    return [...counts].filter(([k, c]) => c >= 2 && c * 2 >= n && binomialTail(c, n, rate(k)) <= 0.1).map(([key, count]) => ({ key, count, chance: binomialTail(count, n, rate(key)) }));
  };
  let total = 0;
  const GROUPS = 200;
  for (let g = 0; g < GROUPS; g++) total += passing(Array.from({ length: n }, () => reference[Math.floor(random() * reference.length)]!)).length;
  const repeats = passing(sets)
    .sort((a, b) => a.chance - b.chance)
    .map((r) => ({ ...r, ...describeMoment(r.key), of: n, names: events.filter((_, i) => sets[i]!.has(r.key)).map((e) => e.name), baseRate: rate(r.key) }));
  return { repeats, expectedByChance: total / GROUPS };
}
