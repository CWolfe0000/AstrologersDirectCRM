import { describe, expect, it } from "vitest";
import { activationModel } from "@/lib/astro/activation";
import { anchorKeywords } from "@/lib/astro/keywords";
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
    // Hard aspects only by default: the Jupiter trine is left out unless every aspect is allowed.
    expect(p.triggers.map((t) => t.contact.id)).toEqual(["e1", "t2"]);
    expect(p.triggers[0]!.dates).toEqual([day(90)]);
    expect(themeResult(m, "marriage", "all").periods[0]!.triggers.map((t) => t.contact.id)).toEqual(["t1", "e1", "t2"]);
    expect(p.peak).toBeGreaterThanOrEqual(90);
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

  it("natal promise: testimony from the significators' dignity, house and natal aspects", () => {
    // Venus rules the 7th from 5° Libra (domicile, in the 7th); Jupiter is in the 7th and conjunct Venus.
    const m = activationModel(timeline([]), "all");
    const r = themeResult(m, "marriage").promise;
    expect(r.level).toBe("strong");
    expect(r.testimonies.map((t) => t.text)).toEqual([
      "Venus, ruler of the 7th, is in its domicile",
      "Venus, ruler of the 7th, is angular in the 7th House",
      "Jupiter conjunct Venus, ruler of the 7th",
      "Mars, ruler of the 1st, sextile Venus, ruler of the 7th",
      "Venus in the 7th House",
      "Jupiter in the 7th House",
    ]);
    // Mars at 10° Leo squares the Moon at 10° Taurus: one indication; Venus and Jupiter sextile Mars, the Ascendant ruler, protect.
    const a = themeResult(m, "accident").promise;
    expect(a.level).toBe("mixed");
    expect(a.testimonies.filter((t) => t.tone === "challenge").map((t) => t.text)).toEqual(["Mars square the Moon"]);
  });

  it("a solar arc that repeats a natal aspect comes first", () => {
    const m = activationModel(timeline([
      contact("plain", "solar-arc", "moon", "sextile", "venus", 10, 100),
      contact("echo", "solar-arc", "jupiter", "sextile", "venus", 60, 150), // natal Jupiter is conjunct Venus
    ]), "all");
    const r = themeResult(m, "marriage");
    expect(r.periods.map((p) => [p.anchor.id, p.natalAspect])).toEqual([["echo", "conjunction"], ["plain", null]]);
  });

  it("a progression to an angle anchors like a solar arc; slow planets' exact hits are the timing", () => {
    // Progressed Venus (ruler of the 7th) reaches the Ascendant, with Pluto squaring the Ascendant.
    const m = activationModel(timeline([
      contact("pv", "progressed", "venus", "conjunction", "asc", 20, 180),
      contact("pm", "progressed", "moon", "conjunction", "asc", 20, 50), // the progressed Moon is not a primary anchor
      contact("ps", "progressed", "sun", "opposition", "asc", 20, 180),
      contact("sa", "solar-arc", "sun", "opposition", "asc", 20, 180), // the same motion as the progressed Sun: kept once
      contact("pl", "transit", "pluto", "square", "asc", 60, 120),
      contact("ma", "transit", "mars", "square", "asc", 70, 76),
    ]), "all");
    const r = themeResult(m, "marriage");
    expect(r.periods.map((p) => [p.anchor.id, p.primary])).toEqual([["pv", true], ["sa", true], ["pm", false]]);
    expect(r.periods[0]!.points).toEqual(["asc", "venus"]);
    expect(r.periods[0]!.triggers.map((t) => [t.contact.id, t.slow])).toEqual([["ma", false], ["pl", true]]);
  });

  it("keywords: planet, rulerships and house, aspect, and the natal point's sign and house", () => {
    const m = activationModel(timeline([]), "all");
    const k = anchorKeywords(m.natal, contact("x", "solar-arc", "mars", "square", "venus", 0, 10));
    expect(k.map((l) => l.label)).toEqual(["Solar Arc Mars", "Square", "Natal Venus"]);
    expect(k[0]!.text).toBe("action, conflict, cutting, heat, speed · rules the 1st (self, body, appearance) and 8th (the partner's money, debt, shared resources, crisis) · natally in the 5th (children, romance, creative work, speculation)");
    expect(k[2]!.text).toContain("in Libra (partnership, fairness, law) · in the 7th (partners, contracts, open enemies)");
  });

  it("slow transits and eclipses on an angle stand as periods of their own", () => {
    const sat = contact("sat", "transit", "saturn", "square", "mc", 20, 40);
    sat.windows.push({ ...sat.windows[0]!, start: day(90), end: day(110), exacts: [{ utc: day(100), pass: 2, retrograde: true }], closest: day(100) });
    const m = activationModel(timeline([
      contact("jup", "transit", "jupiter", "conjunction", "mc", 10, 40),
      sat,
      eclipse("ecl", "mc", 30),
      contact("mars", "transit", "mars", "conjunction", "mc", 28, 32), // fast: a trigger, not a period
      contact("soft", "transit", "jupiter", "trine", "mc", 150, 170), // soft: neither
    ]), "all");
    const r = themeResult(m, "career");
    expect(r.periods.map((p) => [p.anchor.id, p.kind])).toEqual([["jup", "transit-angle"], ["sat", "transit-angle"], ["ecl", "eclipse-angle"]]);
    // Saturn's two passes are one period.
    expect([r.periods[1]!.start, r.periods[1]!.end, r.periods[1]!.exacts.length]).toEqual([20, 110, 2]);
    expect(r.periods[0]!.triggers.map((t) => t.contact.id)).toEqual(["sat", "ecl", "mars"]);
    expect([r.periods[2]!.start, r.periods[2]!.end]).toEqual([30, 58]);
    // The Midheaven belongs to career only; the Ascendant axis counts for marriage by conjunction or opposition.
    expect(themeResult(m, "marriage").periods).toEqual([]);
    const asc = activationModel(timeline([contact("a", "transit", "saturn", "opposition", "asc", 10, 40), contact("b", "transit", "saturn", "square", "asc", 60, 90)]), "all");
    expect(themeResult(asc, "marriage").periods.map((p) => p.anchor.id)).toEqual(["a"]);
    expect(themeResult(asc, "accident").periods.map((p) => p.anchor.id)).toEqual(["a", "b"]);
  });

  it("no periods without a direction or an angle event", () => {
    const r = themeResult(activationModel(timeline([contact("t", "transit", "jupiter", "trine", "mc", 10, 40)]), "all"), "career");
    expect(r.periods).toEqual([]);
  });
});
