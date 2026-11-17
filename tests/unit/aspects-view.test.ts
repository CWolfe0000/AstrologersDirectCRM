import { describe, expect, it } from "vitest";
import { computeAspects, DEFAULT_SETTINGS, type ChartPoints } from "@/lib/astro";

const pts = (bodies: [string, number][], asc = 0, mc = 270): ChartPoints => ({
  bodies: bodies.map(([id, lon]) => ({ id: id as never, lon, speed: 1, house: 1 })),
  cusps: Array.from({ length: 12 }, (_, i) => (asc + i * 30) % 360),
  asc,
  mc,
});

describe("computeAspects", () => {
  it("picks the tightest aspect for a pair, not the first that fits", () => {
    // 56° apart: semisquare (45°, orb 11) is checked first and fits; sextile (60°, orb 4) is tighter and must win.
    const settings = { ...DEFAULT_SETTINGS, aspects: ["semisquare", "sextile"] as never, orbs: { semisquare: 12, sextile: 12 } };
    const a = computeAspects(pts([["sun", 0], ["moon", 56]], 200, 110), settings).filter((x) => x.a !== "asc" && x.a !== "mc" && x.b !== "asc" && x.b !== "mc");
    expect(a).toHaveLength(1);
    expect(a[0]!.type).toBe("sextile");
  });

  it("includes the second person's angles in synastry, but not a transit ring's borrowed angles", () => {
    const A = pts([["sun", 10]], 100, 10);
    const B = pts([["moon", 200]], 10, 280); // B's ASC at 10° sits on A's Sun
    const syn = computeAspects(A, DEFAULT_SETTINGS, B, { outerAngles: true });
    expect(syn.some((x) => x.a === "asc" && x.aRing === "outer" && x.b === "sun" && x.type === "conjunction")).toBe(true);
    // Between two people, ASC–MC contacts count (B's ASC 10° conjunct A's MC 10°).
    expect(syn.some((x) => x.a === "asc" && x.aRing === "outer" && x.b === "mc")).toBe(true);
    const transit = computeAspects(A, DEFAULT_SETTINGS, B);
    expect(transit.some((x) => x.aRing === "outer" && (x.a === "asc" || x.a === "mc"))).toBe(false);
  });

  it("never pairs a chart's own ASC and MC", () => {
    const a = computeAspects(pts([["sun", 45]], 0, 270), DEFAULT_SETTINGS);
    expect(a.some((x) => (x.a === "asc" || x.a === "mc") && (x.b === "asc" || x.b === "mc"))).toBe(false);
  });
});
