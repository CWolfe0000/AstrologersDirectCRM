import "server-only";
import type { BirthData, BodyId, ChartPoints, ChartSettings, HouseSystem } from "@/lib/astro/types";
import { houseOf } from "@/lib/astro/techniques/aspects";
import { secondaryProgressions, solarArcDirections, solarReturn } from "@/lib/astro/techniques/directions";
import { zonedToUtc } from "@/lib/timezones";
import { bodiesAt, housesAt, swissEphemeris } from "./swiss";

/** Birth data (local wall time + IANA zone) → UTC instant. */
export function birthUtc(b: BirthData) {
  const time = b.timeAccuracy === "unknown" ? "12:00" : b.time;
  return zonedToUtc(`${b.date}T${time}:00`, b.tz || "UTC").toISOString();
}

function toPoints(bodies: Partial<Record<BodyId, { lon: number; speed: number }>>, cusps: number[], want: BodyId[]) {
  return want
    .filter((id) => bodies[id])
    .map((id) => ({ id, lon: bodies[id]!.lon, speed: bodies[id]!.speed, house: houseOf(bodies[id]!.lon, cusps) }));
}

export function natalChart(birth: BirthData, s: ChartSettings): ChartPoints & { houseFallback: boolean } {
  const utc = birthUtc(birth);
  const h = housesAt(utc, birth.lat, birth.lon, s.houseSystem, s.zodiac);
  return { bodies: toPoints(bodiesAt(utc, { zodiac: s.zodiac }), h.cusps, s.bodies), cusps: h.cusps, asc: h.asc, mc: h.mc, houseFallback: h.fallback };
}

/** Moving bodies at a moment, placed in a reference chart's houses (transit bi-wheels). */
export function positionsAt(utc: string, s: ChartSettings, reference?: Pick<ChartPoints, "cusps" | "asc" | "mc">): ChartPoints {
  const bodies = bodiesAt(utc, { zodiac: s.zodiac });
  const cusps = reference?.cusps ?? Array.from({ length: 12 }, (_, i) => i * 30);
  return { bodies: toPoints(bodies, cusps, s.bodies), cusps, asc: reference?.asc ?? 0, mc: reference?.mc ?? 0 };
}

const natalInput = (birth: BirthData, s: ChartSettings) => ({ utc: birthUtc(birth), place: { lat: birth.lat, lon: birth.lon }, houseSystem: s.houseSystem as HouseSystem });

export async function progressedChart(birth: BirthData, target: string, s: ChartSettings): Promise<ChartPoints> {
  const natal = natalChart(birth, s);
  const p = await secondaryProgressions(natalInput(birth, s), `${target}T12:00:00Z`, swissEphemeris(s.zodiac));
  const bodies = Object.fromEntries(p.points.map((x) => [x.id, { lon: x.lon, speed: x.speed }]));
  return { bodies: toPoints(bodies, natal.cusps, s.bodies), cusps: p.cusps, asc: p.asc, mc: p.mc };
}

export async function solarArcChart(birth: BirthData, target: string, s: ChartSettings): Promise<ChartPoints> {
  const natal = natalChart(birth, s);
  const d = await solarArcDirections(natalInput(birth, s), `${target}T12:00:00Z`, swissEphemeris(s.zodiac));
  const bodies = Object.fromEntries(d.points.map((x) => [x.id, { lon: x.lon, speed: x.speed }]));
  return { bodies: toPoints(bodies, natal.cusps, s.bodies), cusps: d.cusps, asc: d.asc, mc: d.mc };
}

export async function solarReturnChart(birth: BirthData, year: number, s: ChartSettings, place?: { lat: number; lon: number }): Promise<ChartPoints & { utc: string }> {
  const r = await solarReturn(natalInput(birth, s), year, swissEphemeris(s.zodiac), { place });
  const bodies = Object.fromEntries(r.points.map((x) => [x.id, { lon: x.lon, speed: x.speed }]));
  return { bodies: toPoints(bodies, r.cusps, s.bodies), cusps: r.cusps, asc: r.asc, mc: r.mc, utc: r.utc };
}
