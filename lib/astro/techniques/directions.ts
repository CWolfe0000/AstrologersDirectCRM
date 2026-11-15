import type { Ephemeris, NatalInput, Point, PointSet } from "./types";
import { ascFromRamc, delta, eclipticToRA, mcFromRamc, norm } from "./spherical";

const DAY = 86_400_000;
/** Mean tropical year in days (used for age → progression time). */
export const TROPICAL_YEAR = 365.24219;
/** Naibod's rate: the Sun's mean daily motion, degrees per year of life. */
export const NAIBOD = 0.98564733;

export function ageInYears(birthUtc: string, targetUtc: string) {
  return (Date.parse(targetUtc) - Date.parse(birthUtc)) / DAY / TROPICAL_YEAR;
}

/**
 * Progressed/directed angles.
 *  - "solar-arc-longitude": MC + (progressed Sun − natal Sun) in longitude
 *  - "solar-arc-ra":        RAMC + (progressed Sun − natal Sun) in right ascension
 *  - "naibod-longitude":    MC + age × 0°59′08″
 *  - "naibod-ra":           RAMC + age × 0°59′08″
 * The Ascendant and cusps are then cast from the directed MC/RAMC at the birth latitude.
 * Provisional default: "solar-arc-longitude" — confirm in docs/techniques.md.
 */
export type AngleMethod = "solar-arc-longitude" | "solar-arc-ra" | "naibod-longitude" | "naibod-ra";

async function natalBase(natal: NatalInput, eph: Ephemeris) {
  const [bodies, eps, ramc, houses] = await Promise.all([
    eph.bodies(natal.utc),
    eph.obliquity(natal.utc),
    eph.ramc(natal.utc, natal.place.lon),
    eph.houses(natal.utc, natal.place.lat, natal.place.lon, natal.houseSystem),
  ]);
  return { bodies, eps, ramc, houses };
}

function toPoints(bodies: Awaited<ReturnType<Ephemeris["bodies"]>>): Point[] {
  return Object.entries(bodies).map(([id, v]) => ({ id: id as Point["id"], lon: norm(v!.lon), speed: v!.speed }));
}

async function anglesFor(method: AngleMethod, args: { natalMc: number; natalRamc: number; eps: number; lat: number; arcLon: number; arcRa: number; age: number; houseSystem: string }, eph: Ephemeris) {
  let ramc: number;
  switch (method) {
    case "solar-arc-longitude":
      ramc = eclipticToRA(norm(args.natalMc + args.arcLon), args.eps);
      break;
    case "naibod-longitude":
      ramc = eclipticToRA(norm(args.natalMc + args.age * NAIBOD), args.eps);
      break;
    case "solar-arc-ra":
      ramc = norm(args.natalRamc + args.arcRa);
      break;
    case "naibod-ra":
      ramc = norm(args.natalRamc + args.age * NAIBOD);
      break;
  }
  const h = await eph.housesFromRamc(ramc, args.lat, args.eps, args.houseSystem);
  return { ramc, mc: mcFromRamc(ramc, args.eps), asc: ascFromRamc(ramc, args.lat, args.eps), cusps: h.cusps };
}

/** Secondary progressions: one day after birth for each year of life. */
export async function secondaryProgressions(natal: NatalInput, targetUtc: string, eph: Ephemeris, opts: { angles?: AngleMethod } = {}): Promise<PointSet & { progressedUtc: string; age: number; angleMethod: AngleMethod }> {
  const method = opts.angles ?? "solar-arc-longitude";
  const age = ageInYears(natal.utc, targetUtc);
  const progressedUtc = new Date(Date.parse(natal.utc) + age * DAY).toISOString();
  const [base, prog] = await Promise.all([natalBase(natal, eph), eph.bodies(progressedUtc)]);
  const sunN = base.bodies.sun!.lon, sunP = prog.sun!.lon;
  const arcLon = norm(sunP - sunN);
  const arcRa = norm(eclipticToRA(sunP, base.eps) - eclipticToRA(sunN, base.eps));
  const angles = await anglesFor(method, { natalMc: base.houses.mc, natalRamc: base.ramc, eps: base.eps, lat: natal.place.lat, arcLon, arcRa, age, houseSystem: natal.houseSystem }, eph);
  return { points: toPoints(prog), asc: angles.asc, mc: angles.mc, cusps: angles.cusps, progressedUtc, age, angleMethod: method };
}

/**
 * Solar arc directions: every natal point moves forward by the same arc.
 *  - arc "true":       progressed Sun − natal Sun (the solar arc proper)
 *  - arc "naibod":     age × 0°59′08″
 *  - arc "one-degree": age × 1°
 * Angles follow `angles` (as for progressions); with "plus-arc" the arc is simply added to ASC and MC too.
 */
export async function solarArcDirections(
  natal: NatalInput,
  targetUtc: string,
  eph: Ephemeris,
  opts: { arc?: "true" | "naibod" | "one-degree"; angles?: AngleMethod | "plus-arc" } = {},
): Promise<PointSet & { arc: number; age: number }> {
  const age = ageInYears(natal.utc, targetUtc);
  const base = await natalBase(natal, eph);
  let arc: number;
  if ((opts.arc ?? "true") === "true") {
    const prog = await eph.bodies(new Date(Date.parse(natal.utc) + age * DAY).toISOString());
    arc = norm(prog.sun!.lon - base.bodies.sun!.lon);
  } else arc = age * (opts.arc === "naibod" ? NAIBOD : 1);
  const points = toPoints(base.bodies).map((p) => ({ ...p, lon: norm(p.lon + arc) }));
  const angleMethod = opts.angles ?? "plus-arc";
  if (angleMethod === "plus-arc") {
    return { points, asc: norm(base.houses.asc + arc), mc: norm(base.houses.mc + arc), cusps: base.houses.cusps.map((c) => norm(c + arc)), arc, age };
  }
  const sunN = base.bodies.sun!.lon;
  const arcRa = norm(eclipticToRA(norm(sunN + arc), base.eps) - eclipticToRA(sunN, base.eps));
  const angles = await anglesFor(angleMethod, { natalMc: base.houses.mc, natalRamc: base.ramc, eps: base.eps, lat: natal.place.lat, arcLon: arc, arcRa, age, houseSystem: natal.houseSystem }, eph);
  return { points, asc: angles.asc, mc: angles.mc, cusps: angles.cusps, arc, age };
}

/** Precession in longitude per tropical year (IAU 2006 general precession, ~50.29″). */
export const PRECESSION_PER_YEAR = 50.2879 / 3600;

/**
 * Solar return: the moment the Sun comes back to its natal longitude in `year`.
 * With `precessionCorrected`, the target is moved forward by precession since
 * birth (a "sidereal" return in tropical terms). Cast for `place` (default:
 * the birthplace). Accurate to well under a second of time.
 */
export async function solarReturn(
  natal: NatalInput,
  year: number,
  eph: Ephemeris,
  opts: { precessionCorrected?: boolean; place?: { lat: number; lon: number }; houseSystem?: string } = {},
): Promise<PointSet & { utc: string; targetLongitude: number }> {
  const natalSun = (await eph.bodies(natal.utc)).sun!.lon;
  const birth = new Date(natal.utc);
  const years = year - birth.getUTCFullYear();
  const target = norm(natalSun + (opts.precessionCorrected ? years * PRECESSION_PER_YEAR : 0));
  // Search ±3 days around the birthday in that year.
  const guess = Date.UTC(year, birth.getUTCMonth(), birth.getUTCDate(), birth.getUTCHours(), birth.getUTCMinutes());
  const f = async (t: number) => delta(target, (await eph.bodies(new Date(t).toISOString())).sun!.lon);
  let lo = guess - 3 * DAY, hi = guess + 3 * DAY;
  let flo = await f(lo);
  const fhi = await f(hi);
  if (Math.sign(flo) === Math.sign(fhi)) throw new Error("Solar return not bracketed — check the ephemeris.");
  for (let i = 0; i < 60 && hi - lo > 10; i++) {
    const mid = (lo + hi) / 2;
    const fm = await f(mid);
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid;
      flo = fm;
    } else hi = mid;
  }
  const utc = new Date((lo + hi) / 2).toISOString();
  const place = opts.place ?? natal.place;
  const [bodies, houses] = await Promise.all([eph.bodies(utc), eph.houses(utc, place.lat, place.lon, opts.houseSystem ?? natal.houseSystem)]);
  return { points: toPoints(bodies), asc: houses.asc, mc: houses.mc, cusps: houses.cusps, utc, targetLongitude: target };
}
