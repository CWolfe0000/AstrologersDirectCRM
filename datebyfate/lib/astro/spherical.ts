/**
 * Spherical astronomy helpers shared by the techniques. Angles in degrees.
 * These are standard textbook relations (e.g. Meeus, "Astronomical Algorithms").
 */
const D = Math.PI / 180;

export const norm = (x: number) => ((x % 360) + 360) % 360;
/** Signed shortest difference b − a in (−180, 180]. */
export const delta = (a: number, b: number) => {
  const d = norm(b - a);
  return d > 180 ? d - 360 : d;
};
/** Unsigned separation 0–180. */
export const separation = (a: number, b: number) => Math.abs(delta(a, b));

/** Right ascension of a point on the ecliptic (latitude 0) with longitude λ, obliquity ε. */
export function eclipticToRA(lon: number, eps: number) {
  return norm(Math.atan2(Math.sin(lon * D) * Math.cos(eps * D), Math.cos(lon * D)) / D);
}

/** Ecliptic longitude of the point on the ecliptic with right ascension α. */
export function raToEcliptic(ra: number, eps: number) {
  return norm(Math.atan2(Math.sin(ra * D), Math.cos(ra * D) * Math.cos(eps * D)) / D);
}

/** Midheaven longitude from the right ascension of the MC (RAMC). */
export function mcFromRamc(ramc: number, eps: number) {
  return raToEcliptic(ramc, eps);
}

/** Ascendant longitude from RAMC, geographic latitude φ and obliquity ε. */
export function ascFromRamc(ramc: number, lat: number, eps: number) {
  const r = ramc * D, e = eps * D, p = lat * D;
  let asc = norm(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(p) * Math.sin(e))) / D);
  // The ascendant is always in the eastern half: 0–180° ahead of the MC.
  const mc = mcFromRamc(ramc, eps);
  if (norm(asc - mc) > 180) asc = norm(asc + 180);
  return asc;
}

/** Midpoint on the shorter arc between two longitudes. */
export function midpoint(a: number, b: number) {
  return norm(a + delta(a, b) / 2);
}
