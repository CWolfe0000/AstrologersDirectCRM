import { describe, expect, it } from "vitest";
import { NAIBOD, primaryArcs } from "@/lib/server/rectify";

const RAD = Math.PI / 180;
// Altitude of a point (ra, dec) when the meridian's right ascension is ramc, at latitude lat.
const altitude = (ra: number, dec: number, ramc: number, lat: number) => {
  const H = (ramc - ra) * RAD;
  return Math.asin(Math.sin(lat * RAD) * Math.sin(dec * RAD) + Math.cos(lat * RAD) * Math.cos(dec * RAD) * Math.cos(H)) / RAD;
};
const hourAngle = (ra: number, ramc: number) => ((((ramc - ra + 180) % 360) + 360) % 360) - 180;

describe("primary directions", () => {
  const cases = [
    { ra: 40, dec: 18, ramc: 300, lat: 45.5 },
    { ra: 200, dec: -22, ramc: 10, lat: 51.5 },
    { ra: 123, dec: 5, ramc: 77, lat: -33.9 },
    { ra: 350, dec: -10, ramc: 180, lat: 34 },
  ];
  it.each(cases)("turning the sky by the arc brings the point to each angle (%o)", ({ ra, dec, ramc, lat }) => {
    const a = primaryArcs(ra, dec, ramc, lat);
    // Midheaven / IC: on the meridian, above / below.
    expect(Math.abs(hourAngle(ra, ramc + a.mc!))).toBeLessThan(1e-9);
    expect(Math.abs(Math.abs(hourAngle(ra, ramc + a.ic!)) - 180)).toBeLessThan(1e-9);
    // Ascendant: on the horizon, rising (east, negative hour angle); Descendant: setting.
    expect(Math.abs(altitude(ra, dec, ramc + a.asc!, lat))).toBeLessThan(1e-9);
    expect(hourAngle(ra, ramc + a.asc!)).toBeLessThan(0);
    expect(Math.abs(altitude(ra, dec, ramc + a.dsc!, lat))).toBeLessThan(1e-9);
    expect(hourAngle(ra, ramc + a.dsc!)).toBeGreaterThan(0);
    // Arcs are the shortest way round: direct when positive, converse when negative.
    for (const v of Object.values(a)) expect(Math.abs(v!)).toBeLessThanOrEqual(180);
  });
  it("circumpolar points never reach the horizon", () => {
    const a = primaryArcs(0, 60, 0, 60);
    expect(a.asc).toBeNull();
    expect(a.dsc).toBeNull();
    expect(a.mc).toBe(0);
  });
  it("Naibod's key is 0°59′08″ a year", () => {
    expect(Math.abs(NAIBOD - (59 / 60 + 8.33 / 3600))).toBeLessThan(1e-4);
  });
});
