/**
 * Astrocartography: where on Earth each body was on the Ascendant (rising),
 * Descendant (setting), Midheaven (culminating) or IC at the birth moment.
 *
 * From each body's right ascension (α) and declination (δ) and Greenwich
 * sidereal time (GST), with east longitudes positive:
 *   MC line:   λ = α − GST                (a meridian)
 *   IC line:   λ = α − GST + 180°
 *   ASC line:  λ = α − H₀ − GST,  DSC line: λ = α + H₀ − GST,
 *   where cos H₀ = −tan φ · tan δ at each latitude φ (no line where |tan φ tan δ| > 1).
 * Lines use the geometric horizon (no refraction), as astrocartography maps usually do.
 */
import type { BodyId } from "./types";

export interface AcgData {
  /** Greenwich apparent sidereal time at birth, degrees. */
  gst: number;
  bodies: { id: BodyId; ra: number; dec: number }[];
}

export type AcgAngle = "MC" | "IC" | "ASC" | "DSC";
export interface AcgLine {
  body: BodyId;
  angle: AcgAngle;
  /** Polylines of [longitude, latitude]; a line can break where the body never rises or sets. */
  segments: [number, number][][];
}

const RAD = Math.PI / 180;
/** Longitude into [-180, 180). */
export const wrapLon = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;

export function acgLines(d: AcgData, latLimit = 80, step = 0.5): AcgLine[] {
  const lats: number[] = [];
  for (let φ = -latLimit; φ <= latLimit + 1e-9; φ += step) lats.push(Math.round(φ * 100) / 100);
  const out: AcgLine[] = [];
  for (const b of d.bodies) {
    const mc = wrapLon(b.ra - d.gst);
    out.push({ body: b.id, angle: "MC", segments: [lats.map((φ) => [mc, φ])] });
    out.push({ body: b.id, angle: "IC", segments: [lats.map((φ) => [wrapLon(mc + 180), φ])] });
    for (const angle of ["ASC", "DSC"] as const) {
      const segments: [number, number][][] = [];
      let cur: [number, number][] = [];
      for (const φ of lats) {
        const x = -Math.tan(φ * RAD) * Math.tan(b.dec * RAD);
        if (Math.abs(x) > 1) {
          if (cur.length) segments.push(cur);
          cur = [];
          continue;
        }
        const h0 = Math.acos(x) / RAD;
        cur.push([wrapLon(angle === "ASC" ? b.ra - h0 - d.gst : b.ra + h0 - d.gst), φ]);
      }
      if (cur.length) segments.push(cur);
      out.push({ body: b.id, angle, segments });
    }
  }
  return out;
}

/** Great-circle distance in km. */
export function km(lat1: number, lon1: number, lat2: number, lon2: number) {
  const a = Math.sin(((lat2 - lat1) * RAD) / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(((lon2 - lon1) * RAD) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Lines passing within `maxKm` of a place, nearest first. */
export function linesNear(lines: AcgLine[], lat: number, lon: number, maxKm = 800) {
  const near: { body: BodyId; angle: AcgAngle; km: number }[] = [];
  for (const l of lines) {
    let best = Infinity;
    for (const seg of l.segments) for (const [x, y] of seg) best = Math.min(best, km(lat, lon, y, x));
    if (best <= maxKm) near.push({ body: l.body, angle: l.angle, km: Math.round(best) });
  }
  return near.sort((a, b) => a.km - b.km);
}

/** Demo engine: equatorial coordinates from ecliptic longitude (latitude taken as 0) and an approximate GST. */
export function approxAcg(utc: string, bodies: { id: BodyId; lon: number }[]): AcgData {
  const jd = Date.parse(utc) / 86_400_000 + 2440587.5;
  const t = (jd - 2451545) / 36525;
  const eps = (23.439291 - 0.0130042 * t) * RAD;
  const gst = (((280.46061837 + 360.98564736629 * (jd - 2451545)) % 360) + 360) % 360;
  return {
    gst,
    bodies: bodies.map((b) => {
      const l = b.lon * RAD;
      return { id: b.id, ra: ((Math.atan2(Math.sin(l) * Math.cos(eps), Math.cos(l)) / RAD) + 360) % 360, dec: Math.asin(Math.sin(eps) * Math.sin(l)) / RAD };
    }),
  };
}
