/** Chart types shared by the engine and the readings. Longitudes are ecliptic degrees, 0–360. */

export type BodyId = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "node";
/** A body or a chart angle. */
export type PointId = BodyId | "asc" | "dsc" | "mc";

export const BODIES: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"];

export interface Birth {
  date: string; // YYYY-MM-DD
  /** HH:mm local time, or null when unknown. */
  time: string | null;
  place: string;
  lat: number;
  lon: number; // east positive
  tz: string; // IANA zone
}

export interface Chart {
  /** Longitude and daily speed of each body. */
  bodies: Record<BodyId, { lon: number; speed: number }>;
  /** Houses and angles — only when the birth time is known. */
  houses: { cusps: number[]; asc: number; mc: number } | null;
  /** True when the Moon stays in one sign for the whole birth day (always true with a known time). */
  moonSignCertain: boolean;
  utc: string;
}

export type AspectClass = "conjunction" | "hard" | "flowing";
