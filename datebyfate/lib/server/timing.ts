import "server-only";
import type { BodyId, Chart } from "@/lib/astro/types";
import { eclipticToRA, separation } from "@/lib/astro/spherical";
import { POINT_NAMES, SIGNS, aspectBetween, houseOf, ordinal, signIndex, type Orbs } from "@/lib/astro/zodiac";
import { ARRIVES, FUNCTION, HOUSE_TRANSIT, LIFE_CYCLE, PROGRESSED_MOON_HOUSE, PROGRESSED_MOON_SIGN, PROGRESSED_OTHER, PROGRESSED_VENUS, TRANSIT, TRIGGER } from "@/lib/reading/forecast";
import type { Insight } from "@/lib/reading/own";
import { TARGET_AREA } from "@/lib/reading/text";
import { bodiesAt, housesFromRamc } from "./swiss";

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
export function progressions(chart: Chart, nowMs = Date.now(), birthLat?: number): { moon: Insight[]; venus: Insight[] } {
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
  // The progressed Sun and Mars meeting your Venus or Moon: the other signs of meeting, commitment and renewal.
  const sunOrbs: Orbs = { conjunction: 2.5, opposition: 2.5, square: 2.5, trine: 2.5, sextile: 2.5 };
  for (const [mover, orbs] of [["sun", sunOrbs], ["mars", PROGRESSED_ORBS]] as const)
    for (const target of ["venus", "moon"] as const) {
      if (target === "moon" && !chart.houses) continue;
      const asp = aspectBetween(sky[mover].lon, chart.bodies[target].lon, orbs);
      if (!asp) continue;
      const t = PROGRESSED_OTHER[`${mover}-${target}`]!;
      const tail = asp.cls === "hard" ? " As a hard aspect it costs more and goes deeper." : asp.cls === "flowing" ? " As an easy aspect it goes smoothly, with a risk of staying on the surface." : "";
      venus.push({ title: t.title, body: t.body + tail, basis: `Progressed ${POINT_NAMES[mover]} ${asp.name} natal ${POINT_NAMES[target]}, ${asp.orb.toFixed(1)}° from exact` });
    }
  // The progressed Ascendant: the Midheaven moved on by the progressed Sun's arc, and the Ascendant cast from it at the birth latitude.
  if (chart.houses && birthLat !== undefined) {
    const EPS = 23.44;
    const mc = (((chart.houses.mc + sky.sun.lon - chart.bodies.sun.lon) % 360) + 360) % 360;
    const asc = housesFromRamc(eclipticToRA(mc, EPS), birthLat, EPS).asc;
    const asp = aspectBetween(asc, chart.bodies.venus.lon, PROGRESSED_ORBS);
    if (asp) {
      const t = PROGRESSED_OTHER["asc-venus"]!;
      const tail = asp.cls === "hard" ? " As a hard aspect there are obstacles in the way, such as distance or existing ties." : asp.cls === "flowing" ? " As an easy aspect it flows, and is easier to let slip." : "";
      venus.push({ title: t.title, body: t.body + tail, basis: `Progressed Ascendant ${asp.name} natal Venus, ${asp.orb.toFixed(1)}° from exact` });
    }
  }
  return { moon, venus };
}

/** The turning points that come to everyone at a certain age, if one falls in the coming year. */
export function lifeCycle(chart: Chart, fromMs = Date.now(), days = 365): (Insight & { from: string | null })[] {
  const t0 = Math.floor(fromMs / DAY) * DAY + DAY / 2;
  const out: (Insight & { from: string | null })[] = [];
  for (const [planet, angle, orb] of [["saturn", 0, 3.5], ["uranus", 180, 3], ["neptune", 90, 2], ["jupiter", 0, 5]] as const)
    for (let d = 0; d <= days; d += 5) {
      const lon = bodiesAt(t0 + d * DAY, [planet])[planet].lon;
      if (Math.abs(separation(lon, chart.bodies[planet].lon) - angle) > orb) continue;
      // Jupiter and Saturn come back to the same place only at a return; skip the birth year itself.
      if (fromMs - Date.parse(chart.utc) < 5 * 365 * DAY) break;
      out.push({ ...LIFE_CYCLE[`${planet}-${angle}`]!, basis: `Transiting ${POINT_NAMES[planet]} ${ASPECT_WORD[angle]} your natal ${POINT_NAMES[planet]}`, from: d === 0 ? null : new Date(t0 + d * DAY).toISOString().slice(0, 10) });
      break;
    }
  return out;
}

export interface TriggerDay {
  date: string;
  title: string;
  body: string;
  /** The slow period it sets off. */
  sets: string;
}

/**
 * The days in the coming weeks when Mars, Venus, the Sun or Mercury touches a point that a slow
 * planet is already working on. A fast planet makes no theme of its own; it sets the slow one off.
 */
export function triggerDays(targets: Target[], windows: Window[], fromMs = Date.now(), days = 45): TriggerDay[] {
  const t0 = Math.floor(fromMs / DAY) * DAY + DAY / 2;
  const fast = ["mars", "venus", "sun", "mercury"] as const;
  const sky = Array.from({ length: days + 2 }, (_, d) => bodiesAt(t0 + (d - 1) * DAY, [...fast]));
  const out: TriggerDay[] = [];
  for (const target of targets) {
    const area = TARGET_AREA[target.id]!;
    const working = windows.filter((w) => w.basis.endsWith(area));
    if (!working.length) continue;
    for (const planet of fast)
      for (const angle of [0, 90, 180]) {
        const orb = (i: number) => Math.abs(separation(sky[i]![planet].lon, target.lon) - angle);
        for (let d = 0; d < days; d++) {
          const i = d + 1;
          if (orb(i) > 1 || orb(i - 1) < orb(i) || orb(i + 1) <= orb(i)) continue;
          const date = new Date(t0 + d * DAY).toISOString().slice(0, 10);
          const active = working.find((w) => w.start <= date && date <= w.end);
          if (active) out.push({ date, title: `${POINT_NAMES[planet]} ${ASPECT_WORD[angle]} ${area.split(",")[0]}`, body: TRIGGER[planet]!, sets: active.title });
        }
      }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
