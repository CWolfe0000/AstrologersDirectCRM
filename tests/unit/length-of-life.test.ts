import { describe, expect, it } from "vitest";
import { houseOf, lengthOfLife, obliqueAscension, signAspect, vitalSector } from "@/lib/astro/length-of-life";
import type { BodyId, ChartPoints } from "@/lib/astro/types";

/** Equal houses from 0° Aries; each body is [longitude, house]. */
const chart = (pos: Partial<Record<BodyId, [number, number]>>): ChartPoints => ({
  cusps: Array.from({ length: 12 }, (_, i) => i * 30), asc: 0, mc: 270,
  bodies: Object.entries(pos).map(([id, v]) => ({ id: id as BodyId, lon: v![0], speed: 1, house: v![1] })),
});

describe("releaser and giver of years", () => {
  it("sign aspects and houses", () => {
    expect(signAspect(5, 95)).toBe("Square");
    expect(signAspect(5, 155)).toBeNull();
    expect(houseOf(275, chart({}).cusps)).toBe(10);
  });

  it("day chart: Sun in the 10th releases; its term ruler gives greater years, changed by benefics and malefics", () => {
    // Sun 5° Capricorn (10th). Dignities there by day: Saturn domicile, Mars exaltation, Venus triplicity, Mercury term, Jupiter face.
    // Saturn at 10° Aries (1st, angular) squares the Sun by sign → giver, greater years 57.
    // Jupiter at 10° Leo trines Saturn: +12. Mars at 10° Cancer squares Saturn: −15.
    const r = lengthOfLife(chart({ sun: [275, 10], moon: [40, 2], saturn: [10, 1], jupiter: [130, 5], mars: [100, 4], venus: [320, 11], mercury: [290, 10] }))!;
    expect(r.releaser.id).toBe("sun");
    expect(r.giver).toMatchObject({ id: "saturn", grant: "greater", years: 57, dignities: ["Domicile"], aspect: "Square" });
    expect(r.changes).toEqual([{ id: "venus", aspect: "Sextile", years: 8 }, { id: "jupiter", aspect: "Trine", years: 12 }, { id: "mars", aspect: "Square", years: -15 }]);
    expect(r.years).toBe(62);
  });

  it("passes over a luminary outside the releasing places", () => {
    // Night chart, Moon in the 6th, Sun in the 4th; waxing Moon → Ascendant (0° Aries) before Fortune.
    // Mars in Leo trines the Ascendant and rules it; succedent → middle years 40.5.
    const r = lengthOfLife(chart({ sun: [95, 4], moon: [160, 6], mars: [125, 5] }))!;
    expect(r.day).toBe(false);
    expect(r.candidates.map((c) => c.id)).toEqual(["moon", "sun", "asc", "fortune"]);
    expect(r.releaser.id).toBe("asc");
    expect(r.giver).toMatchObject({ id: "mars", grant: "middle", years: 40.5 });
  });

  it("reports no years when nothing with dignity aspects any releaser", () => {
    const r = lengthOfLife(chart({ sun: [170, 10], moon: [40, 2] }))!;
    expect(r.giver).toBeNull();
    expect(r.years).toBeNull();
  });
});

describe("vital sector", () => {
  const eps = 23.44;
  it("rising times", () => {
    expect(obliqueAscension(90, 0, eps)).toBeCloseTo(90, 6); // at the equator, right ascension
    expect(obliqueAscension(90, 40, eps)).toBeCloseTo(68.66, 1);
    expect(obliqueAscension(90, 80, eps)).toBeNull(); // circumpolar
  });
  it("a full quadrant when no malefic is in the way; cut short by a malefic's ray", () => {
    expect(vitalSector(chart({}), 0, 40, eps)).toMatchObject({ arc: 90, cut: null });
    expect(vitalSector(chart({}), 0, 40, eps)!.years).toBeCloseTo(68.66, 1);
    // Saturn at 20° Capricorn squares 20° Aries.
    const v = vitalSector(chart({ saturn: [290, 10], mars: [200, 7] }), 0, 0, eps)!;
    expect(v).toMatchObject({ endLon: 20, cut: { id: "mars", aspect: "Opposition" } });
    expect(v.years).toBeCloseTo(18.47, 1);
  });
});
