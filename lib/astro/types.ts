/**
 * Astrology engine abstraction.
 *
 * The UI only talks to `AstrologyEngine`. The prototype ships with a
 * DemoEngine that produces deterministic, illustrative positions. A production
 * build would register an adapter around the existing calculation engine
 * (e.g. a Swiss Ephemeris–based service) that implements the same interface.
 */

export type BodyId =
  | "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn"
  | "uranus" | "neptune" | "pluto" | "node" | "chiron" | "asc" | "mc"
  | "southnode" | "ceres" | "pallas" | "juno" | "vesta" | "lilith" | "vertex" | "fortune";

export type SignId =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type AspectId = "conjunction" | "opposition" | "trine" | "square" | "sextile" | "quincunx" | "semisextile" | "semisquare" | "sesquiquadrate";

export type HouseSystem = "placidus" | "whole-sign" | "koch" | "equal" | "porphyry" | "regiomontanus" | "campanus";
export type ZodiacType = "tropical" | "sidereal-lahiri" | "sidereal-fagan-bradley";

export interface BirthData {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (local)
  timeAccuracy: "exact" | "approximate" | "unknown";
  place: string;
  lat: number;
  lon: number;
  tz: string;
}

/** The practice's saved defaults for the convergence timeline. */
export interface TimelineDefaults {
  transits: boolean;
  progressions: boolean;
  solarArcs: boolean;
  lunations: boolean;
  transitBodies: BodyId[];
  aspects: AspectId[];
  /** Orbs in degrees by technique. */
  orbs: { transit: number; directed: number; lunation: number; eclipse: number };
  /** Optional per-planet transit orbs; a planet without one uses orbs.transit. */
  transitOrbs: Partial<Record<BodyId, number>>;
  /** Transiting planets counted as long-term background rather than short-term triggers (default Uranus, Neptune, Pluto). */
  backgroundBodies?: BodyId[];
  /** Life Themes: which transits and eclipses count as triggers. "hard" (default): conjunction, square, opposition. "all": every aspect in use. */
  themeTriggers?: "hard" | "all";
}

export interface ChartSettings {
  houseSystem: HouseSystem;
  zodiac: ZodiacType;
  bodies: BodyId[];
  aspects: AspectId[];
  orbs: Partial<Record<AspectId, number>>;
  showAspectLines: boolean;
  showHouseCusps: boolean;
  showDegrees: boolean;
  /** House rulers: traditional (Mars rules Scorpio) or modern (Pluto rules Scorpio, Uranus Aquarius, Neptune Pisces). Default traditional. */
  rulership?: "traditional" | "modern";
  /** Convergence timeline defaults (practice-wide). Missing means the built-in defaults. */
  timeline?: TimelineDefaults;
}

export interface BodyPosition {
  id: BodyId;
  lon: number; // ecliptic longitude 0–360
  speed: number; // deg/day, negative = retrograde
  house: number; // 1–12
}

export interface ChartPoints {
  bodies: BodyPosition[];
  cusps: number[]; // 12 house cusp longitudes, cusps[0] = ASC
  asc: number;
  mc: number;
}

export interface Aspect {
  a: BodyId;
  b: BodyId;
  aRing: "inner" | "outer";
  bRing: "inner" | "outer";
  type: AspectId;
  orb: number; // absolute
  applying: boolean;
}

export interface EngineInfo {
  id: string;
  name: string;
  /** False for the demonstration engine — UI must label results accordingly. */
  verified: boolean;
  description: string;
}

/**
 * Every method is asynchronous: production engines (e.g. the Sky / Swiss
 * Ephemeris service) answer over the network.
 */
export interface AstrologyEngine {
  info: EngineInfo;
  /** Astrocartography inputs (right ascension, declination, sidereal time) for a birth. */
  acg?(birth: BirthData, settings: ChartSettings): Promise<import("./acg").AcgData>;
  /** Natal / radix positions for a birth moment. */
  natal(birth: BirthData, settings: ChartSettings): Promise<ChartPoints>;
  /** Positions of the moving bodies at a moment (for transits). */
  positionsAt(isoDateTime: string, settings: ChartSettings, reference?: ChartPoints): Promise<ChartPoints>;
  /** Secondary progressions for a target date. */
  progressed(birth: BirthData, targetDate: string, settings: ChartSettings): Promise<ChartPoints>;
  /** Solar arc directions for a target date. */
  solarArc(birth: BirthData, targetDate: string, settings: ChartSettings): Promise<ChartPoints>;
  /** Solar return for a year (engines without it fall back to a birthday chart). */
  solarReturn?(birth: BirthData, year: number, settings: ChartSettings, place?: { lat: number; lon: number }): Promise<ChartPoints>;
  /** A body's return on or after a date (lunar, Saturn, Jupiter …), at the birthplace or a chosen place. */
  planetReturn?(birth: BirthData, body: string, from: string, settings: ChartSettings, place?: { lat: number; lon: number }): Promise<ChartPoints & { utc?: string }>;
  /** The Davison relationship chart for two births. */
  davison?(a: BirthData, b: BirthData, settings: ChartSettings): Promise<ChartPoints & { utc?: string }>;
}
