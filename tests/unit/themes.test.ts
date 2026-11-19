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

describe("life themes", () => {
  it("marriage: significators, and a period where two techniques meet on them", () => {
    const m = activationModel(timeline([
      contact("a", "transit", "jupiter", "trine", "venus", 50, 80),
      contact("b", "solar-arc", "sun", "conjunction", "jupiter", 40, 90), // Jupiter is in the 7th
      contact("c", "transit", "saturn", "square", "asc", 55, 75), // only conjunctions and oppositions to the Ascendant count
      contact("d", "transit", "saturn", "square", "moon", 55, 75), // not a significator
      contact("e", "transit", "jupiter", "sextile", "venus", 150, 160), // alone: not a convergence
    ]), "all");
    const r = themeResult(m, "marriage");
    expect(r.significators.map((s) => s.id)).toEqual(["venus", "jupiter", "asc"]);
    expect(r.contactCount).toBe(3);
    expect(r.periods).toHaveLength(1);
    const p = r.periods[0]!;
    expect(p.contacts.map((c) => c.id).sort()).toEqual(["a", "b"]);
    expect(p.techniques.sort()).toEqual(["solar-arc", "transit"]);
    expect(p.start).toBeGreaterThanOrEqual(50);
    expect(p.end).toBeLessThanOrEqual(80);
    expect([64, 65]).toContain(p.peak);
  });

  it("career success counts helpful contacts only", () => {
    const m = activationModel(timeline([
      contact("a", "transit", "jupiter", "conjunction", "mc", 20, 60),
      contact("b", "transit", "uranus", "trine", "saturn", 30, 70), // ruler of the 10th
      contact("c", "transit", "saturn", "square", "mc", 20, 60), // hard, from Saturn: left out
    ]), "all");
    const r = themeResult(m, "career");
    expect(r.significators.map((s) => s.id)).toEqual(["mc", "saturn", "sun"]);
    expect(r.periods[0]!.contacts.map((c) => c.id).sort()).toEqual(["a", "b"]);
  });

  it("accident-prone counts hard aspects from Mars, Saturn, Uranus and Pluto, or to natal Mars and Uranus", () => {
    const m = activationModel(timeline([
      contact("a", "transit", "uranus", "square", "asc", 100, 140),
      contact("b", "transit", "jupiter", "opposition", "mars", 110, 130), // to natal Mars (also the chart ruler)
      contact("c", "transit", "mars", "trine", "sun", 100, 140), // soft: left out
      contact("d", "transit", "jupiter", "square", "sun", 100, 140), // hard, but neither a harsh mover nor Mars/Uranus
    ]), "all");
    const r = themeResult(m, "accident");
    expect(r.contactCount).toBe(2);
    expect(r.periods[0]!.contacts.map((c) => c.id).sort()).toEqual(["a", "b"]);
  });

  it("no periods when nothing converges", () => {
    expect(themeResult(activationModel(timeline([]), "all"), "career").periods).toEqual([]);
  });
});
