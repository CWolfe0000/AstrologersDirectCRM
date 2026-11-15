/**
 * Astrology techniques that build on an ephemeris: synastry, composite,
 * secondary progressions, solar arc directions and solar returns.
 *
 * Engine-independent: everything goes through the `Ephemeris` interface, so the
 * same code runs on Sky's Swiss Ephemeris service (production) or a test fake.
 * Method choices are options; provisional defaults are listed in docs/techniques.md.
 */
export * from "./types";
export * from "./spherical";
export * from "./aspects";
export * from "./synastry";
export * from "./composite";
export * from "./directions";
