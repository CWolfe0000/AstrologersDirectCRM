import { describe, expect, it } from "vitest";
import { ELECTION_EVENTS, scoreElection } from "@/lib/astro/elect";
import type { ChartPoints } from "@/lib/astro/types";

type B = { id: string; lon: number; speed: number; house: number };
const chart = (asc: number, bodies: B[]): ChartPoints => ({ asc, mc: norm(asc + 270), cusps: Array.from({ length: 12 }, (_, i) => norm(asc + i * 30)), bodies }) as ChartPoints;
const norm = (x: number) => ((x % 360) + 360) % 360;

// A good moment: Moon waxing in Taurus applying to a trine of Jupiter, Venus in the 10th, malefics cadent, Mercury direct.
const good = chart(100, [
  { id: "sun", lon: 10, speed: 1, house: 9 },
  { id: "moon", lon: 40, speed: 13, house: 10 },
  { id: "mercury", lon: 30, speed: 1.2, house: 10 },
  { id: "venus", lon: 20, speed: 1.1, house: 10 },
  { id: "mars", lon: 160, speed: 0.6, house: 3 },
  { id: "jupiter", lon: 165, speed: 0.1, house: 3 },
  { id: "saturn", lon: 290, speed: 0.05, house: 6 },
]);

describe("electional scoring", () => {
  it("scores a good moment highly and explains why", () => {
    const r = scoreElection(good, ELECTION_EVENTS.find((e) => e.id === "launch")!.checks);
    expect(r.excluded).toBe(false);
    const ok = Object.fromEntries(r.results.map((x) => [x.id, x.ok]));
    expect(ok).toMatchObject({ "moon-voc": true, "moon-waxing": true, "moon-benefic": true, "moon-malefic": true, "mercury-direct": true, "benefic-angular": true, "malefic-angular": true });
    expect(r.percent).toBeGreaterThan(85);
  });

  it("a void-of-course Moon rules the moment out", () => {
    const voc = chart(100, [...good.bodies.filter((b) => b.id !== "moon"), { id: "moon", lon: 59.5, speed: 13, house: 10 }] as B[]);
    const r = scoreElection(voc, ["moon-voc", "moon-waxing"]);
    expect(r.excluded).toBe(true);
    expect(r.percent).toBe(0);
  });

  it("penalises retrograde Mercury, Mars on an angle and an eclipse", () => {
    const bad = chart(100, good.bodies.map((b) => (b.id === "mercury" ? { ...b, speed: -0.5 } : b.id === "mars" ? { ...b, house: 1 } : b)) as B[]);
    const r = scoreElection(bad, ["mercury-direct", "malefic-angular", "eclipse"], { eclipseNear: "total solar eclipse" });
    expect(r.results.filter((x) => !x.ok).map((x) => x.id)).toEqual(["mercury-direct", "malefic-angular", "eclipse"]);
    expect(r.percent).toBe(0);
  });

  it("natal rules apply only with a natal chart", () => {
    expect(scoreElection(good, ["natal-support"]).results).toEqual([]);
    const natal = chart(0, [{ id: "sun", lon: 220, speed: 1, house: 8 }, { id: "moon", lon: 300, speed: 13, house: 10 }]);
    // Elected Ascendant 100° trine natal Sun 220°.
    const r = scoreElection(good, ["natal-support"], { natal });
    expect(r.results[0]).toMatchObject({ ok: true, detail: "Elected Ascendant trine natal Sun." });
  });
});
