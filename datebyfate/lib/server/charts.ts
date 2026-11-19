import "server-only";
import type { Birth, Chart } from "@/lib/astro/types";
import { signIndex } from "@/lib/astro/zodiac";
import { zonedToUtc } from "@/lib/timezones";
import { bodiesAt, housesAt } from "./swiss";

/**
 * A birth → chart. Without a birth time the chart is cast for local noon, has
 * no houses or angles, and the Moon's sign is marked uncertain when the Moon
 * changed sign that day.
 */
export function chartFor(birth: Birth): Chart {
  const at = (time: string) => zonedToUtc(`${birth.date}T${time}:00`, birth.tz || "UTC").getTime();
  const ms = at(birth.time ?? "12:00");
  const bodies = bodiesAt(ms);
  let moonSignCertain = true;
  if (!birth.time) {
    const start = bodiesAt(at("00:00"), ["moon"]).moon.lon;
    const end = bodiesAt(at("23:59"), ["moon"]).moon.lon;
    moonSignCertain = signIndex(start) === signIndex(end);
  }
  return { bodies, houses: birth.time ? housesAt(ms, birth.lat, birth.lon) : null, moonSignCertain, utc: new Date(ms).toISOString() };
}
