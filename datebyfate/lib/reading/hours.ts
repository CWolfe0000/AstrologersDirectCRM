import { sunriseSunset } from "@/lib/astro/sun";

/**
 * Planetary days and hours, as both Jason Miller ("Advanced Planetary Magic") and Dykes & Gibson
 * ("Astrological Magic") give them: the planetary day runs from sunrise to sunrise; sunrise to
 * sunset is divided into twelve equal day hours and sunset to the next sunrise into twelve night
 * hours; the first hour belongs to the planet of the weekday and the rest follow in the Chaldean
 * order, without a break.
 */

export type Classical = "saturn" | "jupiter" | "mars" | "sun" | "venus" | "mercury" | "moon";
export const CHALDEAN: Classical[] = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"];
/** Sunday first. */
export const DAY_RULERS: Classical[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const dayOf = (planet: Classical) => WEEKDAYS[DAY_RULERS.indexOf(planet)]!;

export interface PlanetaryHour {
  planet: Classical;
  /** ms since the epoch */
  start: number;
  end: number;
  night: boolean;
}

export interface PlanetaryDay {
  /** The planet of the day, which holds from this sunrise to the next. */
  ruler: Classical;
  weekday: string;
  sunrise: number;
  sunset: number;
  nextSunrise: number;
  hours: PlanetaryHour[];
}

/** The calendar date in a time zone, shifted by whole days. */
function localDate(ms: number, tz: string, addDays = 0) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(ms)).map((p) => [p.type, Number(p.value)]));
  const d = new Date(Date.UTC(parts.year!, parts.month! - 1, parts.day! + addDays));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), weekday: d.getUTCDay() };
}

/** The planetary day that begins at sunrise on a calendar date, or null where the Sun does not rise and set (near the poles). */
function dayStarting(date: { y: number; m: number; d: number; weekday: number }, lat: number, lon: number): PlanetaryDay | null {
  const today = sunriseSunset(date.y, date.m, date.d, lat, lon);
  const next = new Date(Date.UTC(date.y, date.m - 1, date.d + 1));
  const tomorrow = sunriseSunset(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), lat, lon);
  if (!today || !tomorrow) return null;
  const ruler = DAY_RULERS[date.weekday]!;
  const first = CHALDEAN.indexOf(ruler);
  const dayLen = (today.set - today.rise) / 12, nightLen = (tomorrow.rise - today.set) / 12;
  const hours: PlanetaryHour[] = Array.from({ length: 24 }, (_, i) => {
    const night = i >= 12;
    const start = night ? today.set + (i - 12) * nightLen : today.rise + i * dayLen;
    return { planet: CHALDEAN[(first + i) % 7]!, start, end: start + (night ? nightLen : dayLen), night };
  });
  return { ruler, weekday: WEEKDAYS[date.weekday]!, sunrise: today.rise, sunset: today.set, nextSunrise: tomorrow.rise, hours };
}

/** The planetary day in force at a moment. Before sunrise, that is still the previous day's. */
export function planetaryDayAt(ms: number, lat: number, lon: number, tz: string): PlanetaryDay | null {
  for (const back of [0, -1, 1]) {
    const day = dayStarting(localDate(ms, tz, back), lat, lon);
    if (!day) return null;
    if (ms >= day.sunrise && ms < day.nextSunrise) return day;
  }
  return null;
}

/** The next times a planet's hour falls on a given planet's day, from a moment on. */
export function nextHours(hour: Classical, day: Classical, fromMs: number, lat: number, lon: number, tz: string, count = 2): PlanetaryHour[] {
  const out: PlanetaryHour[] = [];
  for (let add = -1; add <= 9 && out.length < count; add++) {
    const d = dayStarting(localDate(fromMs, tz, add), lat, lon);
    if (!d || d.ruler !== day) continue;
    for (const h of d.hours) if (h.planet === hour && h.end > fromMs && out.length < count) out.push(h);
  }
  return out;
}
