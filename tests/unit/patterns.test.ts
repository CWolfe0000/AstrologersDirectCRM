import { describe, expect, it } from "vitest";
import { findPatterns } from "@/lib/astro/patterns";
import { computeAspects, DEFAULT_SETTINGS } from "@/lib/astro";
import type { BodyId, ChartPoints } from "@/lib/astro/types";

const cusps = Array.from({ length: 12 }, (_, i) => i * 30);
const chart = (pos: Partial<Record<BodyId, number>>): ChartPoints => ({
  cusps, asc: 0, mc: 270,
  bodies: Object.entries(pos).map(([id, lon]) => ({ id: id as BodyId, lon: lon!, speed: 1, house: Math.floor(lon! / 30) + 1 })),
});
const patterns = (pos: Partial<Record<BodyId, number>>) => {
  const p = chart(pos);
  return findPatterns(p, computeAspects(p, DEFAULT_SETTINGS));
};

describe("aspect patterns", () => {
  it("Grand Trine in fire, and a Kite", () => {
    const r = patterns({ sun: 5, moon: 125, mars: 245, saturn: 305 });
    expect(r.find((x) => x.kind === "Grand Trine")).toMatchObject({ detail: "Fire" });
    expect(r.find((x) => x.kind === "Kite")).toMatchObject({ apex: "moon" });
  });
  it("T-Square with its apex", () => {
    const r = patterns({ sun: 10, moon: 190, saturn: 100 });
    expect(r.find((x) => x.kind === "T-Square")).toMatchObject({ apex: "saturn", detail: "Cardinal" });
  });
  it("a Grand Cross replaces its T-Squares", () => {
    const r = patterns({ sun: 10, moon: 190, saturn: 100, mars: 280 });
    expect(r.filter((x) => x.kind === "Grand Cross")).toHaveLength(1);
    expect(r.filter((x) => x.kind === "T-Square")).toHaveLength(0);
  });
  it("Yod", () => {
    const r = patterns({ venus: 0, mars: 60, pluto: 210 });
    expect(r.find((x) => x.kind === "Yod")).toMatchObject({ apex: "pluto" });
  });
  it("Stellium by sign", () => {
    const r = patterns({ sun: 331, mercury: 340, venus: 352, jupiter: 120 });
    expect(r.find((x) => x.kind === "Stellium" && x.detail === "In Pisces")?.points).toHaveLength(3);
  });
});
