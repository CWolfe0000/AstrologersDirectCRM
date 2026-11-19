import { describe, expect, it } from "vitest";
import { aspectBetween, derivedHouse, hourAgreement, planetaryHour, sunEvent, timingUnit, type Motion } from "@/lib/astro/horary-judgment";

const DAY = 86_400_000;
const t0 = Date.parse("2026-01-01T00:00:00Z");
/** Linear motions (degrees from t0, degrees per day), sampled like the server's series. */
function motion(spec: Record<string, (d: number) => number>): Motion {
  const t: number[] = [];
  for (let ms = 0; ms <= 60 * DAY; ms += 6 * 3_600_000) t.push(t0 + ms);
  const lon: Record<string, number[]> = {}, speed: Record<string, number[]> = {};
  for (const [k, f] of Object.entries(spec)) {
    lon[k] = t.map((x) => ((f((x - t0) / DAY) % 360) + 360) % 360);
    speed[k] = t.map((x) => (f((x - t0) / DAY + 0.01) - f((x - t0) / DAY)) / 0.01);
  }
  return { t, lon, speed };
}

describe("horary judgment", () => {
  it("derived houses", () => {
    expect(derivedHouse(2, 7)).toBe(8); // partner's money
    expect(derivedHouse(10, 5)).toBe(2); // child's career
    expect(derivedHouse(7, 1)).toBe(7);
  });
  it("an applying conjunction perfects when the ephemeris says", () => {
    const m = motion({ moon: (d) => 10 + 13 * d, venus: (d) => 15 + 1 * d });
    const ev = aspectBetween(m, "moon", "venus")!;
    expect(ev).toMatchObject({ aspect: "conjunction", applying: true, applier: "moon" });
    expect(Math.abs((ev.perfectsAt! - t0) / DAY - 5 / 12)).toBeLessThan(0.01);
  });
  it("a separating aspect doesn't perfect", () => {
    const ev = aspectBetween(motion({ moon: (d) => 20 + 13 * d, venus: (d) => 15 + d }), "moon", "venus")!;
    expect(ev.applying).toBe(false);
    expect(ev.perfectsAt).toBeNull();
  });
  it("refranation: the applying planet stations before perfecting", () => {
    // Mars 2° short of a trine to Saturn, slowing to a station after 1.5° and turning back.
    const m = motion({ mars: (d) => 118 + 1.5 * Math.sin((d / 20) * (Math.PI / 2)), saturn: () => 0 });
    const ev = aspectBetween(m, "mars", "saturn")!;
    expect(ev.applying).toBe(true);
    expect(ev.perfectsAt).toBeNull();
    expect(ev.refranation).toBe("mars");
  });
  it("timing units by sign and house", () => {
    expect(timingUnit(5, 1).unit).toBe("days"); // Aries, angular
    expect(timingUnit(35, 2).unit).toBe("years"); // Taurus, succedent
    expect(timingUnit(65, 3).unit).toBe("months"); // Gemini, cadent
  });
  it("sunrise and sunset (New York, June 21 2026)", () => {
    const rise = sunEvent("2026-06-21", 40.7128, -74.006, true)!;
    const set = sunEvent("2026-06-21", 40.7128, -74.006, false)!;
    expect(Math.abs(rise - Date.parse("2026-06-21T09:25:00Z")) / 60_000).toBeLessThan(4);
    expect(Math.abs(set - Date.parse("2026-06-22T00:31:00Z")) / 60_000).toBeLessThan(4);
  });
  it("planetary hours: the first hour after sunrise belongs to the day's ruler", () => {
    const rise = sunEvent("2026-06-21", 40.7128, -74.006, true)!;
    const h = planetaryHour(rise + 60_000, "2026-06-21", 40.7128, -74.006)!;
    expect(new Date("2026-06-21T12:00:00Z").getUTCDay()).toBe(0); // a Sunday
    expect(h).toMatchObject({ dayRuler: "sun", ruler: "sun", hour: 1, night: false });
    // Second hour of a Sunday: Venus (Chaldean order).
    expect(planetaryHour(h.end + 60_000, "2026-06-21", 40.7128, -74.006)!.ruler).toBe("venus");
    // Before sunrise belongs to Saturday night.
    expect(planetaryHour(rise - 60_000, "2026-06-21", 40.7128, -74.006)!.dayRuler).toBe("saturn");
  });
  it("Lilly's agreement of hour and Ascendant", () => {
    expect(hourAgreement("mars", 10).agrees).toBe(true); // Aries rising, Mars hour
    expect(hourAgreement("jupiter", 10).agrees).toBe(true); // fire triplicity ruler
    expect(hourAgreement("venus", 10).agrees).toBe(false);
  });
});
