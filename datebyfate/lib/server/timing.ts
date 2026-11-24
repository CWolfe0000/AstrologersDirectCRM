import "server-only";
import type { BodyId, Chart } from "@/lib/astro/types";
import { separation } from "@/lib/astro/spherical";
import { POINT_NAMES, SIGNS, aspectBetween, houseOf, ordinal, signIndex, type Orbs } from "@/lib/astro/zodiac";
import { ARRIVES, FUNCTION, HOUSE_TRANSIT, PROGRESSED_MOON_HOUSE, PROGRESSED_MOON_SIGN, PROGRESSED_VENUS, TRANSIT } from "@/lib/reading/forecast";
import type { Insight } from "@/lib/reading/own";
import { TARGET_AREA } from "@/lib/reading/text";
import { bodiesAt } from "./swiss";

export interface Target {
  /** Key into FUNCTION and TARGET_AREA. */
  id: string;
  lon: number;
}

export interface Window {
  planet: string;
  title: string;
  /** The task, and how it arrives. */
  body: string;
  /** The way it goes wrong. */
  trap: string;
  basis: string;
  /** YYYY-MM-DD: the span within orb. Influence builds and fades; nothing switches on or off. */
  start: string;
  end: string;
  peak: string;
  /** The dates it is exact, and whether the planet is retrograde then (an inward, private pass). */
  passes: { date: string; retrograde: boolean }[];
  /** Already under way today. */
  active: boolean;
  /** Still within range at the end of the period looked at. */
  ongoing: boolean;
  /** Saturn, Uranus, Neptune or Pluto on the Sun, Moon or an angle: the periods everything else is read in the light of. */
  major: boolean;
}

/** Forrest's working orbs (The Changing Sky, ch. 11): the slower the planet, the narrower. */
const MOVERS: { id: BodyId; orb: number; angles: number[] }[] = [
  { id: "jupiter", orb: 5, angles: [0, 90, 120, 180] },
  { id: "saturn", orb: 3.5, angles: [0, 90, 180] },
  { id: "uranus", orb: 3, angles: [0, 90, 180] },
  { id: "neptune", orb: 2, angles: [0, 90, 180] },
  { id: "pluto", orb: 2, angles: [0, 90, 180] },
];
const ASPECT_WORD: Record<number, string> = { 0: "conjunct", 90: "square", 120: "trine", 180: "opposite" };
const MAJOR_TARGETS = new Set(["sun", "moon", "axis", "c-sun", "c-moon", "c-asc", "c-mc"]);
const DAY = 86_400_000;

/**
 * Periods in the coming year when a slow planet is working on a relationship point. The
 * retrograde passes of one transit fall inside one period, as one process.
 */
export function transitWindows(targets: Target[], fromMs = Date.now(), days = 365): Window[] {
  const t0 = Math.floor(fromMs / DAY) * DAY + DAY / 2;
  const sky = Array.from({ length: days + 1 }, (_, d) => bodiesAt(t0 + d * DAY, MOVERS.map((m) => m.id)));
  const date = (d: number) => new Date(t0 + d * DAY).toISOString().slice(0, 10);
  const out: Window[] = [];
  for (const m of MOVERS)
    for (const target of targets)
      for (const angle of m.angles) {
        const orbAt = (d: number) => Math.abs(separation(sky[d]![m.id].lon, target.lon) - angle);
        let start = -1, peak = -1, best = 99;
        for (let d = 0; d <= days + 1; d++) {
          const orb = d <= days ? orbAt(d) : 99;
          if (orb <= m.orb) {
            if (start < 0) (start = d), (best = 99);
            if (orb < best) (best = orb), (peak = d);
          } else if (start >= 0) {
            const end = d - 1;
            // Exact passes: days on which the orb bottoms out at (nearly) zero.
            const passes: Window["passes"] = [];
            for (let k = start; k <= end; k++) {
              const o = orbAt(k);
              if (o < 0.15 && (k === 0 || orbAt(k - 1) >= o) && (k === days || orbAt(k + 1) > o)) passes.push({ date: date(k), retrograde: sky[k]![m.id].speed < 0 });
            }
            const t = TRANSIT[m.id]!;
            out.push({
              planet: m.id,
              title: t.name,
              body: `${t.task.replace("{F}", FUNCTION[target.id] ?? "this part of your life")} ${ARRIVES[angle]}`,
              trap: t.trap,
              basis: `${POINT_NAMES[m.id]} ${ASPECT_WORD[angle]} ${TARGET_AREA[target.id]}`,
              start: date(start),
              end: date(end),
              peak: date(peak),
              passes,
              active: start === 0,
              ongoing: end === days,
              major: m.id !== "jupiter" && MAJOR_TARGETS.has(target.id),
            });
            start = -1;
          }
        }
      }
  return out.sort((a, b) => a.start.localeCompare(b.start) || Number(b.major) - Number(a.major) || a.end.localeCompare(b.end));
}

export interface HousePassage extends Insight {
  trap: string;
  /** In the house today, or the date it enters. */
  from: string | null;
}

/** Slow planets in, or entering, your houses of romance, partnership and intimacy over the coming year. */
export function houseTransits(chart: Chart, fromMs = Date.now(), days = 365): HousePassage[] {
  if (!chart.houses) return [];
  const t0 = Math.floor(fromMs / DAY) * DAY + DAY / 2;
  const out: HousePassage[] = [];
  for (const m of MOVERS) {
    let prev = 0;
    const seen = new Set<number>();
    for (let d = 0; d <= days; d += 3) {
      const house = houseOf(bodiesAt(t0 + d * DAY, [m.id])[m.id].lon, chart.houses.cusps);
      if (house !== prev && HOUSE_TRANSIT[house] && !seen.has(house)) {
        seen.add(house);
        const t = HOUSE_TRANSIT[house]!;
        out.push({
          title: `${POINT_NAMES[m.id]} ${t.title}`,
          body: t.body.replace("{P}", POINT_NAMES[m.id]),
          trap: t.trap,
          basis: `${POINT_NAMES[m.id]} in your ${ordinal(house)} house`,
          from: d === 0 ? null : new Date(t0 + d * DAY).toISOString().slice(0, 10),
        });
      }
      prev = house;
    }
  }
  return out;
}

const PROGRESSED_ORBS: Orbs = { conjunction: 1.5, opposition: 1.5, square: 1.5, trine: 1.5, sextile: 1.5 };

/**
 * Secondary progressions: the sky as many days after birth as you are years old.
 * The progressed Moon gives the current chapter; progressed Venus meeting a natal point gives
 * a two or three year adjustment in how you relate.
 */
export function progressions(chart: Chart, nowMs = Date.now()): { moon: Insight[]; venus: Insight[] } {
  const birth = Date.parse(chart.utc);
  const sky = bodiesAt(birth + ((nowMs - birth) / 365.2422));
  const moon: Insight[] = [];
  // Without a birth time the Moon's position is too uncertain to progress.
  if (chart.houses) {
    const house = houseOf(sky.moon.lon, chart.houses.cusps);
    const sign = signIndex(sky.moon.lon);
    moon.push({ title: "Where Your Heart Is", body: PROGRESSED_MOON_HOUSE[house - 1]!, basis: `Progressed Moon in your ${ordinal(house)} house` });
    moon.push({ title: "The Mood Of This Chapter", body: PROGRESSED_MOON_SIGN[sign]!, basis: `Progressed Moon in ${SIGNS[sign]!.name}` });
  }
  const venus: Insight[] = [];
  const natal: [string, number][] = (Object.keys(PROGRESSED_VENUS) as string[]).filter((id) => id !== "asc" && (id !== "moon" || chart.houses)).map((id) => [id, chart.bodies[id as BodyId].lon]);
  if (chart.houses) natal.push(["asc", chart.houses.asc]);
  for (const [id, lon] of natal) {
    const asp = aspectBetween(sky.venus.lon, lon, PROGRESSED_ORBS);
    if (!asp) continue;
    const name = id === "asc" ? "Ascendant" : POINT_NAMES[id as BodyId];
    const tail = asp.cls === "hard" ? " As a hard aspect it costs more and goes deeper." : asp.cls === "flowing" ? " As an easy aspect it goes smoothly, with a risk of staying on the surface." : "";
    venus.push({ title: `Your Evolving Relationships Meet Your ${name}`, body: PROGRESSED_VENUS[id]! + tail, basis: `Progressed Venus ${asp.name} natal ${name}, ${asp.orb.toFixed(1)}° from exact` });
  }
  return { moon, venus };
}
