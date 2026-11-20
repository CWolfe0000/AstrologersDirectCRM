import { describe, expect, it } from "vitest";
import { allMidpoints, dial90, hardContact, midpoint, midpointPictures } from "@/lib/astro/midpoints";
import { starContacts } from "@/lib/astro/fixed-stars";

describe("midpoints", () => {
  it("takes the nearer halfway point, across 0° Aries too", () => {
    expect(midpoint(10, 50)).toBe(30);
    expect(midpoint(350, 20)).toBe(5);
    expect(midpoint(20, 350)).toBe(5);
    expect(midpoint(100, 300)).toBe(20); // 200° apart: the nearer midpoint is opposite 200°
  });
  it("finds hard aspects on the 45° dial", () => {
    expect(hardContact(30, 30.4, 1)).toEqual({ aspect: "conjunction", orb: expect.closeTo(0.4, 6) });
    expect(hardContact(120.5, 30, 1)?.aspect).toBe("square");
    expect(hardContact(75.2, 30, 1)?.aspect).toBe("semisquare");
    expect(hardContact(165, 30, 1)?.aspect).toBe("sesquiquadrate");
    expect(hardContact(60, 30, 1)).toBeNull(); // a sextile isn't a midpoint aspect
  });
  it("finds a picture: Jupiter on the Venus/Pluto midpoint", () => {
    const pics = midpointPictures({ venus: 10, pluto: 70, jupiter: 40.5, sun: 200 });
    const p = pics.find((x) => x.point === "jupiter" && x.mid.a === "venus" && x.mid.b === "pluto");
    expect(p?.aspect).toBe("conjunction");
    expect(p?.orb).toBeCloseTo(0.5, 6);
    expect(allMidpoints({ venus: 10, pluto: 70, jupiter: 40.5 })).toHaveLength(3);
    expect(dial90(200)).toBe(20);
  });
});

describe("fixed stars", () => {
  it("matches a star to the Midheaven within 1.5° and a planet within 1°", () => {
    const chart = { asc: 28.78, mc: 284.75, cusps: [], bodies: [{ id: "jupiter" as const, lon: 60.67, speed: 0.1, house: 3 }, { id: "venus" as const, lon: 120, speed: 1, house: 5 }] };
    const c = starContacts(chart, [{ name: "Vega", lon: 285.15, lat: 61.7 }, { name: "Alcyone", lon: 59.83, lat: 4 }, { name: "Spica", lon: 121.2, lat: -2 }]);
    expect(c.map((x) => `${x.star.name}:${x.point}`)).toEqual(["Vega:Midheaven", "Alcyone:jupiter"]);
  });
});
