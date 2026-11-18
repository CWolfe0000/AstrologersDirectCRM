import type { AspectId, BodyId, ChartSettings, HouseSystem, SignId, ZodiacType, TimelineDefaults } from "./types";

/** ︎ forces text (not emoji) presentation of the glyph. */
const T = "︎";

export const SIGNS: { id: SignId; name: string; glyph: string; element: "fire" | "earth" | "air" | "water"; modality: "cardinal" | "fixed" | "mutable" }[] = [
  { id: "aries", name: "Aries", glyph: "♈" + T, element: "fire", modality: "cardinal" },
  { id: "taurus", name: "Taurus", glyph: "♉" + T, element: "earth", modality: "fixed" },
  { id: "gemini", name: "Gemini", glyph: "♊" + T, element: "air", modality: "mutable" },
  { id: "cancer", name: "Cancer", glyph: "♋" + T, element: "water", modality: "cardinal" },
  { id: "leo", name: "Leo", glyph: "♌" + T, element: "fire", modality: "fixed" },
  { id: "virgo", name: "Virgo", glyph: "♍" + T, element: "earth", modality: "mutable" },
  { id: "libra", name: "Libra", glyph: "♎" + T, element: "air", modality: "cardinal" },
  { id: "scorpio", name: "Scorpio", glyph: "♏" + T, element: "water", modality: "fixed" },
  { id: "sagittarius", name: "Sagittarius", glyph: "♐" + T, element: "fire", modality: "mutable" },
  { id: "capricorn", name: "Capricorn", glyph: "♑" + T, element: "earth", modality: "cardinal" },
  { id: "aquarius", name: "Aquarius", glyph: "♒" + T, element: "air", modality: "fixed" },
  { id: "pisces", name: "Pisces", glyph: "♓" + T, element: "water", modality: "mutable" },
];

export const BODIES: Record<BodyId, { name: string; glyph: string; short: string }> = {
  sun: { name: "Sun", glyph: "☉", short: "Su" },
  moon: { name: "Moon", glyph: "☽", short: "Mo" },
  mercury: { name: "Mercury", glyph: "☿", short: "Me" },
  venus: { name: "Venus", glyph: "♀", short: "Ve" },
  mars: { name: "Mars", glyph: "♂", short: "Ma" },
  jupiter: { name: "Jupiter", glyph: "♃", short: "Ju" },
  saturn: { name: "Saturn", glyph: "♄", short: "Sa" },
  uranus: { name: "Uranus", glyph: "♅", short: "Ur" },
  neptune: { name: "Neptune", glyph: "♆", short: "Ne" },
  pluto: { name: "Pluto", glyph: "♇", short: "Pl" },
  node: { name: "North Node", glyph: "☊", short: "NN" },
  chiron: { name: "Chiron", glyph: "⚷", short: "Ch" },
  asc: { name: "Ascendant", glyph: "AC", short: "AC" },
  mc: { name: "Midheaven", glyph: "MC", short: "MC" },
};

export const PLANET_IDS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"];

export const ASPECTS: Record<AspectId, { name: string; glyph: string; angle: number; nature: "neutral" | "hard" | "soft" | "minor"; defaultOrb: number }> = {
  conjunction: { name: "Conjunction", glyph: "☌", angle: 0, nature: "neutral", defaultOrb: 8 },
  opposition: { name: "Opposition", glyph: "☍", angle: 180, nature: "hard", defaultOrb: 8 },
  trine: { name: "Trine", glyph: "△", angle: 120, nature: "soft", defaultOrb: 7 },
  square: { name: "Square", glyph: "□", angle: 90, nature: "hard", defaultOrb: 7 },
  sextile: { name: "Sextile", glyph: "⚹", angle: 60, nature: "soft", defaultOrb: 5 },
  quincunx: { name: "Quincunx", glyph: "⚻", angle: 150, nature: "minor", defaultOrb: 3 },
  semisextile: { name: "Semi-Sextile", glyph: "⚺", angle: 30, nature: "minor", defaultOrb: 2 },
  semisquare: { name: "Semi-Square", glyph: "∠", angle: 45, nature: "minor", defaultOrb: 2 },
  sesquiquadrate: { name: "Sesquiquadrate", glyph: "⚼", angle: 135, nature: "minor", defaultOrb: 2 },
};

/** The aspect as astrologers say it in a sentence: "Uranus conjunct natal Mars", "Saturn opposite the Sun". */
const ASPECT_VERBS: Partial<Record<AspectId, string>> = { conjunction: "conjunct", opposition: "opposite" };
export const aspectVerb = (a: AspectId) => ASPECT_VERBS[a] ?? ASPECTS[a].name.toLowerCase();

export const HOUSE_SYSTEMS: { id: HouseSystem; name: string }[] = [
  { id: "placidus", name: "Placidus" },
  { id: "whole-sign", name: "Whole Sign" },
  { id: "koch", name: "Koch" },
  { id: "equal", name: "Equal" },
  { id: "porphyry", name: "Porphyry" },
  { id: "regiomontanus", name: "Regiomontanus" },
  { id: "campanus", name: "Campanus" },
];

export const ZODIACS: { id: ZodiacType; name: string }[] = [
  { id: "tropical", name: "Tropical" },
  { id: "sidereal-lahiri", name: "Sidereal (Lahiri)" },
  { id: "sidereal-fagan-bradley", name: "Sidereal (Fagan/Bradley)" },
];

/** Built-in timeline defaults: each practice can change them in Settings → Astrology or from the timeline. */
export const DEFAULT_TIMELINE: TimelineDefaults = {
  transits: true,
  progressions: true,
  solarArcs: true,
  lunations: true,
  transitBodies: ["mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"],
  aspects: ["conjunction", "sextile", "square", "trine", "opposition"],
  orbs: { transit: 1, directed: 1, lunation: 3, eclipse: 5 },
  transitOrbs: {},
};

export const DEFAULT_SETTINGS: ChartSettings = {
  houseSystem: "placidus",
  zodiac: "tropical",
  bodies: [...PLANET_IDS],
  aspects: ["conjunction", "opposition", "trine", "square", "sextile", "quincunx"],
  orbs: { conjunction: 8, opposition: 8, trine: 7, square: 7, sextile: 5, quincunx: 3, semisextile: 2, semisquare: 2, sesquiquadrate: 2 },
  showAspectLines: true,
  showHouseCusps: true,
  showDegrees: true,
};

/** Traditional and modern rulerships. */
export const RULERS: Record<SignId, { traditional: BodyId; modern?: BodyId }> = {
  aries: { traditional: "mars" },
  taurus: { traditional: "venus" },
  gemini: { traditional: "mercury" },
  cancer: { traditional: "moon" },
  leo: { traditional: "sun" },
  virgo: { traditional: "mercury" },
  libra: { traditional: "venus" },
  scorpio: { traditional: "mars", modern: "pluto" },
  sagittarius: { traditional: "jupiter" },
  capricorn: { traditional: "saturn" },
  aquarius: { traditional: "saturn", modern: "uranus" },
  pisces: { traditional: "jupiter", modern: "neptune" },
};

const DIGNITY: Partial<Record<BodyId, { domicile: SignId[]; exaltation?: SignId; detriment: SignId[]; fall?: SignId }>> = {
  sun: { domicile: ["leo"], exaltation: "aries", detriment: ["aquarius"], fall: "libra" },
  moon: { domicile: ["cancer"], exaltation: "taurus", detriment: ["capricorn"], fall: "scorpio" },
  mercury: { domicile: ["gemini", "virgo"], exaltation: "virgo", detriment: ["sagittarius", "pisces"], fall: "pisces" },
  venus: { domicile: ["taurus", "libra"], exaltation: "pisces", detriment: ["scorpio", "aries"], fall: "virgo" },
  mars: { domicile: ["aries", "scorpio"], exaltation: "capricorn", detriment: ["libra", "taurus"], fall: "cancer" },
  jupiter: { domicile: ["sagittarius", "pisces"], exaltation: "cancer", detriment: ["gemini", "virgo"], fall: "capricorn" },
  saturn: { domicile: ["capricorn", "aquarius"], exaltation: "libra", detriment: ["cancer", "leo"], fall: "aries" },
};

export function norm(x: number) {
  return ((x % 360) + 360) % 360;
}
export function signOf(lon: number) {
  return SIGNS[Math.floor(norm(lon) / 30)]!;
}
export function degInSign(lon: number) {
  return norm(lon) % 30;
}
/** 14°22′ */
export function fmtDeg(lon: number, withSign = false) {
  const x = degInSign(lon);
  let deg = Math.floor(x);
  let min = Math.round((x - deg) * 60);
  if (min === 60) { deg += 1; min = 0; }
  const s = `${deg}°${min.toString().padStart(2, "0")}′`;
  return withSign ? `${s} ${signOf(lon).name}` : s;
}
export function fmtOrb(orb: number) {
  const deg = Math.floor(orb);
  const min = Math.round((orb - deg) * 60);
  return `${deg}°${min.toString().padStart(2, "0")}′`;
}

export function dignityOf(body: BodyId, lon: number): "Domicile" | "Exaltation" | "Detriment" | "Fall" | "Peregrine" | null {
  const d = DIGNITY[body];
  if (!d) return null;
  const s = signOf(lon).id;
  if (d.domicile.includes(s)) return "Domicile";
  if (d.exaltation === s) return "Exaltation";
  if (d.detriment.includes(s)) return "Detriment";
  if (d.fall === s) return "Fall";
  return "Peregrine";
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]!);
}
