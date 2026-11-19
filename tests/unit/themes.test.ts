import { describe, expect, it } from "vitest";
import { activationModel } from "@/lib/astro/activation";
import { themeResult } from "@/lib/astro/themes";
import type { TimelineContact, TimelineResult } from "@/lib/astro/timeline";

const day = (i: number) => new Date(Date.parse("2026-01-01T00:00:00Z") + i * 86_400_000).toISOString();
/** A contact in orb from day a to day b, exact in the middle. */
const contact = (id: string, technique: TimelineContact["technique"], source: TimelineContact["source"], aspect: TimelineContact["aspect"], target: TimelineContact["target"], a: number, b: number): TimelineContact => ({
  id, technique, source, aspect, target, targetHouse: null, weight: 1, layer: "trigger", durationDays: b - a,
  windows: [{ start: day(a), end: day(b), startOpen: false, endOpen: false, exacts: [{ utc: day((a + b) / 2), pass: 1, retrograde: false }], minOrb: 0, closest: day((a + b) / 2), stations: [] }],
});

// Aries rising, equal houses: Mars rules the 1st, Venus the 7th (Libra), Saturn the 10th (Capricorn).
function timeline(contacts: TimelineContact[]): TimelineResult {
  const natal = ([["sun", 100, 4], ["moon", 40, 2], ["venus", 185, 7], ["mars", 130, 5], ["jupiter", 190, 7], ["saturn", 250, 9], ["uranus", 300, 11], ["asc", 0, 1], ["mc", 270, 10]] as const)
    .map(([id, lon, house]) => ({ id, lon, house, key: false }));
  return {
    backgroundBodies: [], from: day(0), to: day(200), contacts, convergences: [], natal: [...natal], cusps: Array.from({ length: 12 }, (_, i) => i * 30), lunations: [], notes: [],
    days: Array.from({ length: 200 }, (_, i) => ({ date: day(i).slice(0, 10), score: 0, count: 0, trigger: 0, triggerCount: 0 })),
  };
}

const eclipse = (id: string, target: TimelineContact["target"], at: number): TimelineContact => ({
  id, technique: "eclipse", source: "new-moon", aspect: "conjunction", target, targetHouse: null, weight: 1, layer: "trigger", durationDays: 28,
  windows: [], events: [{ utc: day(at), kind: "new", lon: 0, eclipse: "total solar eclipse", orb: 1 }],
});

describe("life themes", () => {
  it("marriage: a solar arc anchors the period; transits and eclipses to its points are the triggers", () => {
    const m = activationModel(timeline([
      contact("arc", "solar-arc", "mc", "conjunction", "venus", 40, 160),
      contact("t1", "transit", "jupiter", "trine", "venus", 50, 80), // on the arc's target
      contact("t2", "transit", "saturn", "square", "mc", 100, 120), // on the natal place of the directed point
      contact("t3", "transit", "saturn", "square", "moon", 55, 75), // another point: not a trigger
      contact("t4", "transit", "mars", "square", "venus", 170, 180), // after the arc has left orb
      eclipse("e1", "venus", 90),
      contact("prog", "progressed", "moon", "square", "venus", 10, 30), // progressions come after solar arcs
      contact("axis", "solar-arc", "saturn", "square", "asc", 0, 199), // the axis counts by conjunction or opposition only
    ]), "all");
    const r = themeResult(m, "marriage");
    expect(r.significators.map((s) => s.id)).toEqual(["venus", "jupiter", "asc"]);
    expect(r.periods.map((p) => p.anchor.id)).toEqual(["arc", "prog"]);
    const p = r.periods[0]!;
    expect([p.start, p.end]).toEqual([40, 160]);
    expect(p.exact).toBe(day(100));
    expect(p.points).toEqual(["venus", "mc"]);
    expect(p.triggers.map((t) => t.contact.id)).toEqual(["t1", "e1", "t2"]);
    expect(p.triggers[1]!.dates).toEqual([day(90)]);
    expect(p.peak).toBeGreaterThanOrEqual(50);
    expect(p.peak).toBeLessThanOrEqual(120);
  });

  it("a directed significator anchors a period too", () => {
    // Solar arc Venus to the natal Moon: Venus is the marriage significator being directed.
    const r = themeResult(activationModel(timeline([contact("arc", "solar-arc", "venus", "trine", "moon", 10, 100)]), "all"), "marriage");
    expect(r.periods).toHaveLength(1);
    expect(r.periods[0]!.points).toEqual(["moon", "venus"]);
    expect(r.periods[0]!.peak).toBeNull();
  });

  it("career success keeps helpful directions only", () => {
    const m = activationModel(timeline([
      contact("a", "solar-arc", "jupiter", "conjunction", "mc", 20, 160),
      contact("b", "solar-arc", "uranus", "trine", "saturn", 30, 170), // ruler of the 10th
      contact("c", "solar-arc", "saturn", "square", "mc", 20, 160), // hard, from Saturn: left out
    ]), "all");
    const r = themeResult(m, "career");
    expect(r.significators.map((s) => s.id)).toEqual(["mc", "saturn", "sun"]);
    expect(r.periods.map((p) => p.anchor.id)).toEqual(["a", "b"]);
  });

  it("accident-prone keeps hard directions from Mars, Saturn, Uranus and Pluto, or to natal Mars and Uranus", () => {
    const m = activationModel(timeline([
      contact("a", "solar-arc", "uranus", "square", "asc", 100, 190),
      contact("b", "solar-arc", "jupiter", "opposition", "mars", 110, 190),
      contact("c", "solar-arc", "mars", "trine", "sun", 100, 140), // soft: left out
      contact("d", "solar-arc", "jupiter", "square", "sun", 100, 140), // hard, but neither a harsh planet nor Mars/Uranus
      contact("t", "transit", "mars", "conjunction", "asc", 120, 126),
    ]), "all");
    const r = themeResult(m, "accident");
    expect(r.periods.map((p) => p.anchor.id)).toEqual(["a", "b"]);
    expect(r.periods[0]!.triggers.map((t) => t.contact.id)).toEqual(["t"]);
    expect([122, 123]).toContain(r.periods[0]!.peak);
  });

  it("no periods without a direction to the significators", () => {
    const r = themeResult(activationModel(timeline([contact("t", "transit", "jupiter", "trine", "mc", 10, 40)]), "all"), "career");
    expect(r.periods).toEqual([]);
  });
});
