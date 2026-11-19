import { describe, expect, it } from "vitest";
import { davisonMoment, findReturn } from "@/lib/astro/techniques/returns";

const DAY = 86_400_000;
const t0 = Date.parse("2026-01-01T00:00:00Z");
// A Moon moving 13.2°/day from 100° at t0.
const eph = { async bodies(utc: string) { const d = (Date.parse(utc) - t0) / DAY; return { moon: { lon: (100 + 13.2 * d) % 360, speed: 13.2 } }; } };

describe("returns", () => {
  it("finds the next lunar return to the second", async () => {
    const utc = await findReturn(eph as never, "moon", 50, t0);
    const expected = t0 + ((310 / 13.2) * DAY);
    expect(Math.abs(Date.parse(utc) - expected)).toBeLessThan(2000);
  });
  it("Davison: midpoint in time, and longitude along the shorter arc", () => {
    const m = davisonMoment({ utc: "2000-01-01T00:00:00Z", lat: 40, lon: 170 }, { utc: "2000-01-03T00:00:00Z", lat: 20, lon: -170 });
    expect(m.utc).toBe("2000-01-02T00:00:00.000Z");
    expect(m.lat).toBe(30);
    expect(Math.abs(Math.abs(m.lon) - 180)).toBeLessThan(1e-9);
  });
});
