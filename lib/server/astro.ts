import "server-only";
import type { BirthData, BodyId, ChartPoints, ChartSettings, HouseSystem } from "@/lib/astro/types";
import { houseOf } from "@/lib/astro/techniques/aspects";
import { secondaryProgressions, solarArcDirections, solarReturn } from "@/lib/astro/techniques/directions";
import { zonedToUtc } from "@/lib/timezones";
import { SWISS_BODIES, bodiesAt, equatorialAt, housesAt, swissEphemeris } from "./swiss";

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

/** The bodies to calculate: the usual planets plus any optional points the settings ask for. */
const wanted = (s: ChartSettings) => [...new Set([...SWISS_BODIES, ...s.bodies])];

/** Vertex and Part of Fortune: points that need the chart's houses. Fortune reverses by night (Sun below the horizon). */
function withChartPoints(bodies: Partial<Record<BodyId, { lon: number; speed: number }>>, h: { cusps: number[]; asc: number; vertex: number }, s: ChartSettings) {
  const out = { ...bodies };
  if (s.bodies.includes("vertex")) out.vertex = { lon: h.vertex, speed: 0 };
  if (s.bodies.includes("fortune") && bodies.sun && bodies.moon) {
    const day = houseOf(bodies.sun.lon, h.cusps) >= 7;
    const lon = day ? h.asc + bodies.moon.lon - bodies.sun.lon : h.asc + bodies.sun.lon - bodies.moon.lon;
    out.fortune = { lon: ((lon % 360) + 360) % 360, speed: 0 };
  }
  return out;
}

export function natalChart(birth: BirthData, s: ChartSettings): ChartPoints & { houseFallback: boolean } {
  const utc = birthUtc(birth);
  const h = housesAt(utc, birth.lat, birth.lon, s.houseSystem, s.zodiac);
  const bodies = withChartPoints(bodiesAt(utc, { zodiac: s.zodiac, bodies: wanted(s) }), h, s);
  return { bodies: toPoints(bodies, h.cusps, s.bodies), cusps: h.cusps, asc: h.asc, mc: h.mc, houseFallback: h.fallback };
}

/** Astrocartography inputs for a birth: each body's RA/declination and the sidereal time. */
export function acgChart(birth: BirthData, bodies: BodyId[]) {
  return equatorialAt(birthUtc(birth), bodies.filter((b) => b !== "asc" && b !== "mc"));
}

/** Moving bodies at a moment, placed in a reference chart's houses (transit bi-wheels). */
export function positionsAt(utc: string, s: ChartSettings, reference?: Pick<ChartPoints, "cusps" | "asc" | "mc">): ChartPoints {
  const bodies = bodiesAt(utc, { zodiac: s.zodiac, bodies: wanted(s).filter((b) => b !== "vertex" && b !== "fortune") });
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
