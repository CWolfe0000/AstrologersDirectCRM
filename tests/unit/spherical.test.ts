import { describe, expect, it } from "vitest";
import { ascFromRamc, delta, eclipticToRA, mcFromRamc, midpoint, norm, raToEcliptic, separation } from "@/lib/astro/techniques/spherical";

const EPS = 23.4393;
const close = (a: number, b: number, tol = 1e-6) => expect(Math.abs(delta(a, b))).toBeLessThan(tol);

describe("spherical helpers", () => {
  it("normalises and measures arcs across 0°", () => {
    expect(norm(-10)).toBe(350);
    expect(delta(350, 10)).toBe(20);
    expect(delta(10, 350)).toBe(-20);
    expect(separation(355, 5)).toBe(10);
  });
  it("midpoints take the shorter arc", () => {
    close(midpoint(350, 10), 0);
    close(midpoint(10, 350), 0);
    close(midpoint(100, 140), 120);
    close(midpoint(0, 180), 90); // exactly opposite: the direction from the first point is used
  });
  it("RA and ecliptic longitude round-trip; cardinal points map to themselves", () => {
    for (const lon of [0, 15, 89.9, 90, 123.4, 180, 271, 359]) close(raToEcliptic(eclipticToRA(lon, EPS), EPS), lon);
    for (const p of [0, 90, 180, 270]) close(eclipticToRA(p, EPS), p);
    // 30° Aries (0° Taurus) has RA ≈ 27.91° at this obliquity.
    expect(eclipticToRA(30, EPS)).toBeCloseTo(27.91, 2);
  });
  it("MC and Ascendant from RAMC", () => {
    close(mcFromRamc(0, EPS), 0);
    close(mcFromRamc(90, EPS), 90);
    // At the equator with RAMC 0 the Ascendant is 0° Cancer.
    close(ascFromRamc(0, 0, EPS), 90);
    // The Ascendant always lies 0–180° ahead of the MC.
    for (const ramc of [0, 45, 133, 260, 359]) for (const lat of [-50, -10, 0, 33, 51.5, 60]) {
      const d = norm(ascFromRamc(ramc, lat, EPS) - mcFromRamc(ramc, EPS));
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThan(180);
    }
  });
});
