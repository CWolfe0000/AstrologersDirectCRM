/**
 * Returns and the Davison relationship chart.
 *
 * A return is the moment a moving body comes back to its natal longitude:
 * the Moon monthly, Saturn about every 29½ years. We step forward from a start
 * date until the body crosses the natal longitude (direct or retrograde), then
 * bisect to under a second. The first crossing on or after the start is used.
 *
 * Davison: the chart for the midpoint in time between two births, cast for the
 * midpoint between the two birthplaces (longitude along the shorter arc).
 */
import type { BodyId } from "../types";
import type { Ephemeris } from "./types";

const DAY = 86_400_000;
const delta = (target: number, lon: number) => ((lon - target + 540) % 360) - 180; // -180..180

/** How far to step and how far to look, by body (step well under the body's fastest daily motion over 180°). */
export const RETURN_SEARCH: Partial<Record<BodyId, { stepDays: number; maxDays: number }>> = {
  moon: { stepDays: 0.5, maxDays: 30 },
  sun: { stepDays: 2, maxDays: 370 },
  mercury: { stepDays: 1, maxDays: 400 },
  venus: { stepDays: 1, maxDays: 600 },
  mars: { stepDays: 2, maxDays: 800 },
  jupiter: { stepDays: 3, maxDays: 13 * 366 },
  saturn: { stepDays: 4, maxDays: 31 * 366 },
  uranus: { stepDays: 10, maxDays: 85 * 366 },
  chiron: { stepDays: 6, maxDays: 52 * 366 },
  node: { stepDays: 4, maxDays: 19 * 366 },
};

export async function findReturn(eph: Pick<Ephemeris, "bodies">, body: BodyId, target: number, fromMs: number): Promise<string> {
  const search = RETURN_SEARCH[body];
  if (!search) throw new RangeError(`Returns aren’t available for ${body}.`);
  const lonAt = async (t: number) => (await eph.bodies(new Date(t).toISOString()))[body]!.lon;
  let t0 = fromMs;
  let d0 = delta(target, await lonAt(t0));
  if (d0 === 0) return new Date(t0).toISOString();
  const end = fromMs + search.maxDays * DAY;
  while (t0 < end) {
    const t1 = t0 + search.stepDays * DAY;
    const d1 = delta(target, await lonAt(t1));
    // A real crossing changes sign near zero, not across the ±180° seam.
    if (Math.sign(d1) !== Math.sign(d0) && Math.abs(d1 - d0) < 90) {
      let lo = t0, hi = t1, flo = d0;
      for (let i = 0; i < 60 && hi - lo > 500; i++) {
        const mid = (lo + hi) / 2;
        const fm = delta(target, await lonAt(mid));
        if (Math.sign(fm) === Math.sign(flo)) {
          lo = mid;
          flo = fm;
        } else hi = mid;
      }
      return new Date((lo + hi) / 2).toISOString();
    }
    t0 = t1;
    d0 = d1;
  }
  throw new RangeError("No return found in the search window.");
}

export function davisonMoment(a: { utc: string; lat: number; lon: number }, b: { utc: string; lat: number; lon: number }) {
  const ta = Date.parse(a.utc), tb = Date.parse(b.utc);
  const utc = new Date((ta + tb) / 2).toISOString();
  let dl = b.lon - a.lon;
  if (dl > 180) dl -= 360;
  if (dl < -180) dl += 360;
  let lon = a.lon + dl / 2;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;
  return { utc, lat: (a.lat + b.lat) / 2, lon };
}
