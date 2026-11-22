import type { AspectClass, BodyId, PointId } from "./types";
import { separation } from "./spherical";

export type Element = "fire" | "earth" | "air" | "water";

export const SIGNS = [
  { name: "Aries", element: "fire", ruler: "mars" },
  { name: "Taurus", element: "earth", ruler: "venus" },
  { name: "Gemini", element: "air", ruler: "mercury" },
  { name: "Cancer", element: "water", ruler: "moon" },
  { name: "Leo", element: "fire", ruler: "sun" },
  { name: "Virgo", element: "earth", ruler: "mercury" },
  { name: "Libra", element: "air", ruler: "venus" },
  { name: "Scorpio", element: "water", ruler: "mars" },
  { name: "Sagittarius", element: "fire", ruler: "jupiter" },
  { name: "Capricorn", element: "earth", ruler: "saturn" },
  { name: "Aquarius", element: "air", ruler: "saturn" },
  { name: "Pisces", element: "water", ruler: "jupiter" },
] as const satisfies readonly { name: string; element: Element; ruler: BodyId }[];

export const POINT_NAMES: Record<PointId, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn",
  uranus: "Uranus", neptune: "Neptune", pluto: "Pluto", node: "North Node", asc: "Ascendant", dsc: "Descendant", mc: "Midheaven",
};

export const norm360 = (x: number) => ((x % 360) + 360) % 360;
export const signIndex = (lon: number) => Math.floor(norm360(lon) / 30);
export const signName = (lon: number) => SIGNS[signIndex(lon)]!.name;
export const elementOf = (lon: number): Element => SIGNS[signIndex(lon)]!.element;

/** Which house (1–12) a longitude falls in. */
export function houseOf(lon: number, cusps: number[]) {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const span = norm360(cusps[(i + 1) % 12]! - start);
    if (norm360(lon - start) < span) return i + 1;
  }
  return 1;
}

export const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4]}`;

export type AspectName = "conjunction" | "opposition" | "square" | "trine" | "sextile";
const ASPECTS: { name: AspectName; angle: number; cls: AspectClass }[] = [
  { name: "conjunction", angle: 0, cls: "conjunction" },
  { name: "opposition", angle: 180, cls: "hard" },
  { name: "square", angle: 90, cls: "hard" },
  { name: "trine", angle: 120, cls: "flowing" },
  { name: "sextile", angle: 60, cls: "flowing" },
];

export type Orbs = Record<AspectName, number>;
/** Within one chart: the orbs Sue Tompkins recommends in "Aspects in Astrology" (8° for the major aspects, 4° for the sextile). */
export const NATAL_ORBS: Orbs = { conjunction: 8, opposition: 8, square: 8, trine: 8, sextile: 4 };
/** Between two charts: tighter, so that a contact means something. */
export const SYNASTRY_ORBS: Orbs = { conjunction: 6, opposition: 5, square: 5, trine: 5, sextile: 3 };

/** The aspect between two longitudes, if any is within orb. */
export function aspectBetween(a: number, b: number, orbs: Orbs): { name: AspectName; cls: AspectClass; orb: number } | null {
  const sep = separation(a, b);
  for (const asp of ASPECTS) {
    const orb = Math.abs(sep - asp.angle);
    if (orb <= orbs[asp.name]) return { name: asp.name, cls: asp.cls, orb };
  }
  return null;
}
