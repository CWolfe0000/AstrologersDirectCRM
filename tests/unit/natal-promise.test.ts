import { describe, expect, it } from "vitest";
import { natalPromise } from "@/lib/astro/natal-promise";
import type { BodyId, ChartPoints } from "@/lib/astro/types";

// Aries rising at 15°, a day chart (Sun in the 10th). Whole-sign houses.
const at = (id: BodyId, lon: number, speed = 1) => ({ id, lon, speed, house: Math.floor(((lon - 0 + 360) % 360) / 30) + 1 });
const chart: ChartPoints = {
  asc: 15, mc: 285,
  cusps: Array.from({ length: 12 }, (_, i) => i * 30),
  bodies: [
    at("sun", 280), // Capricorn, 10th
    at("moon", 100, 13), // Cancer, 4th: domicile, angular
    at("mercury", 345), // Pisces, 12th: detriment and fall
    at("venus", 283), // Capricorn, 10th, 3° from the Sun: combust
    at("mars", 62), // Gemini, 3rd: peregrine
    at("jupiter", 190, -0.1), // Libra, 7th, retrograde
    at("saturn", 295, 0.05), // Capricorn, 10th: domicile, angular
  ],
};
const P = natalPromise(chart, { wholeSign: true });
const labels = (h: number) => P[h - 1]!.ruler.factors.map((f) => f.label).join(" | ");

describe("natal promise", () => {
  it("reads the sign on each house from the Ascendant (whole sign)", () => {
    expect(P.map((h) => h.sign)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(P[9]!.ruler.id).toBe("saturn");
    expect(P[3]!.ruler.id).toBe("moon");
  });
  it("a domiciled, angular ruler makes a strong house", () => {
    expect(labels(10)).toMatch(/Own Sign/);
    expect(labels(10)).toMatch(/Angular/);
    expect(P[9]!.verdict).toBe("Strong");
    expect(P[3]!.verdict).toBe("Strong");
  });
  it("detriment and fall are counted without also calling the planet peregrine", () => {
    expect(labels(3)).toMatch(/Detriment/);
    expect(labels(3)).toMatch(/Fall/);
    expect(labels(3)).not.toMatch(/Peregrine/);
    expect(labels(1)).toMatch(/Peregrine/); // Mars in Gemini
  });
  it("combustion, retrograde and aversion are found", () => {
    expect(labels(2)).toMatch(/Combust \(3\.0°/); // Venus rules the 2nd
    expect(labels(9)).toMatch(/Retrograde/); // Jupiter rules the 9th
    expect(P[1]!.sees).toBe(true); // Venus in Capricorn trines Taurus
    expect(P[11]!.sees).toBe(false); // Jupiter in Libra is five signs from Pisces: aversion
  });
  it("benefics and malefics in a house move its total", () => {
    const tenth = P[9]!;
    expect(tenth.occupants.find((o) => o.id === "saturn")!.note).toMatch(/Sect/);
    expect(P.every((h) => typeof h.summary === "string" && h.summary.length > 20)).toBe(true);
  });
});
