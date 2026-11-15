import type { Ephemeris, PointSet } from "./types";
import { eclipticToRA, midpoint } from "./spherical";

/**
 * How the composite's houses are found.
 *  - "derived-mc": composite MC = midpoint of the two MCs; houses are cast from
 *    that MC's RAMC at a reference latitude (the default in many programs).
 *  - "midpoint-cusps": each cusp is the midpoint of the two charts' cusps.
 * Provisional default: "derived-mc" — confirm in docs/techniques.md.
 */
export type CompositeHouseMethod = "derived-mc" | "midpoint-cusps";

export interface CompositeOptions {
  houseMethod?: CompositeHouseMethod;
  houseSystem?: string;
  /** Latitude for derived-MC houses. Default: midpoint of the two birth latitudes. */
  latitude?: number;
  latitudes?: [number, number];
  /** Obliquity to use (e.g. the mean of the two births'). */
  obliquity?: number;
}

/** Midpoint composite of two charts. Each planet is the midpoint on the shorter arc. */
export async function midpointComposite(A: PointSet, B: PointSet, eph: Pick<Ephemeris, "housesFromRamc">, opts: CompositeOptions = {}): Promise<PointSet & { method: CompositeHouseMethod }> {
  const method = opts.houseMethod ?? "derived-mc";
  const points = A.points
    .map((p) => {
      const q = B.points.find((x) => x.id === p.id);
      return q ? { id: p.id, lon: midpoint(p.lon, q.lon), speed: (p.speed + q.speed) / 2 } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const mc = midpoint(A.mc, B.mc);
  if (method === "midpoint-cusps") {
    const cusps = A.cusps.map((c, i) => midpoint(c, B.cusps[i]!));
    return { points, cusps, asc: cusps[0]!, mc, method };
  }
  const lat = opts.latitude ?? (opts.latitudes ? (opts.latitudes[0] + opts.latitudes[1]) / 2 : 0);
  const eps = opts.obliquity ?? 23.4393;
  const h = await eph.housesFromRamc(eclipticToRA(mc, eps), lat, eps, opts.houseSystem ?? "placidus");
  return { points, cusps: h.cusps, asc: h.asc, mc: h.mc, method };
}
