import type { AspectId, BodyId } from "../types";

/**
 * What a technique needs from a calculation engine. The production adapter
 * wraps Sky's Swiss Ephemeris service; tests use a simple fake. All times are
 * UTC ISO strings ("2026-11-14T18:00:00Z").
 */
export interface Ephemeris {
  /** Ecliptic longitude (°) and speed (°/day) of each body at a moment. */
  bodies(utc: string): Promise<Partial<Record<BodyId, { lon: number; speed: number }>>>;
  /** True obliquity of the ecliptic (°) at a moment. */
  obliquity(utc: string): Promise<number>;
  /** Right ascension of the MC (°) for a moment and geographic longitude (east positive). */
  ramc(utc: string, lonEast: number): Promise<number>;
  /** House cusps for a moment and place (12 longitudes, cusp 1 first). */
  houses(utc: string, lat: number, lonEast: number, system: string): Promise<{ cusps: number[]; asc: number; mc: number }>;
  /** House cusps from a RAMC directly (Swiss Ephemeris: swe_houses_armc). Used by derived/directed charts. */
  housesFromRamc(ramc: number, lat: number, eps: number, system: string): Promise<{ cusps: number[]; asc: number; mc: number }>;
}

export interface Place {
  lat: number;
  lon: number; // east positive
}

export interface NatalInput {
  /** Birth moment, UTC. */
  utc: string;
  place: Place;
  houseSystem: string;
}

export interface Point {
  id: BodyId;
  lon: number;
  speed: number;
}

export interface PointSet {
  points: Point[];
  asc: number;
  mc: number;
  cusps: number[];
}

export interface AspectRule {
  id: AspectId;
  angle: number;
  orb: number;
}

/** Major aspects with Sky's current orbs — a provisional default until the practice's choice is set. */
export const DEFAULT_ASPECT_RULES: AspectRule[] = [
  { id: "conjunction", angle: 0, orb: 8 },
  { id: "sextile", angle: 60, orb: 5 },
  { id: "square", angle: 90, orb: 8 },
  { id: "trine", angle: 120, orb: 8 },
  { id: "opposition", angle: 180, orb: 8 },
];
