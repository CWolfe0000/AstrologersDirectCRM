import { describe, expect, it } from "vitest";
import type { Birth } from "@/lib/astro/types";
import { delta, norm } from "@/lib/astro/spherical";
import { signName } from "@/lib/astro/zodiac";
import { chartFor } from "@/lib/server/charts";
import { bodiesAt } from "@/lib/server/swiss";
import { MOVERS } from "@/lib/server/timing";
import { DIRECTED_ORB, loveRulers, progressedAt, romanceOf, solarArcAt, timelineFor } from "@/lib/server/timeline";

const london = { place: "London", lat: 51.5074, lon: -0.1278, tz: "Europe/London" };
const births: Birth[] = [
  { date: "1990-06-15", time: "14:30", ...london },
  { date: "1984-11-02", time: "03:10", ...london },
  { date: "1996-02-20", time: "21:45", ...london },
  { date: "2001-04-11", time: "09:00", ...london },
];
const me = chartFor(births[0]!);
const birthMs = Date.parse(me.utc);
const range = { from: new Date(Date.UTC(2025, 10, 15)), months: 60 };
const YEAR = 365.2422 * 86_400_000;
const timelines = births.map((b) => {
  const chart = chartFor(b);
  return timelineFor(chart, Date.parse(chart.utc), range);
});
const mine = timelines[0]!;

describe("progressions and solar arcs", () => {
  it("progresses a day for a year", () => {
    // Thirty years after birth is the sky thirty days after birth: 15 July 1990, 13:30 UT.
    const p = progressedAt(birthMs, birthMs + 30 * YEAR);
    const sky = bodiesAt(Date.UTC(1990, 6, 15, 13, 30), ["sun", "moon", "venus", "mars"]);
    for (const id of ["sun", "moon", "venus", "mars"] as const) expect(p[id].lon).toBeCloseTo(sky[id].lon, 6);
    expect(signName(p.sun.lon)).toBe("Cancer");
    expect(p.sun.lon).toBeGreaterThan(112);
    expect(p.sun.lon).toBeLessThan(113.5);
  });

  it("takes the solar arc from the progressed Sun and moves every point by it", () => {
    const at = birthMs + 36.4 * YEAR;
    const { arc, points } = solarArcAt(me, birthMs, at);
    expect(arc).toBeCloseTo(norm(progressedAt(birthMs, at).sun.lon - me.bodies.sun.lon), 9);
    // About a degree a year, a little less in the northern summer.
    expect(arc).toBeGreaterThan(34);
    expect(arc).toBeLessThan(36.4);
    expect(points.sun).toBeCloseTo(progressedAt(birthMs, at).sun.lon, 9);
    for (const id of ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const) expect(delta(me.bodies[id].lon, points[id]!)).toBeCloseTo(arc, 9);
    expect(delta(me.houses!.asc, points.asc!)).toBeCloseTo(arc, 9);
    expect(delta(me.houses!.mc, points.mc!)).toBeCloseTo(arc, 9);
    expect(delta(points.asc!, points.dsc!)).toBeCloseTo(180, 9);
  });

  it("finds the traditional rulers of the 5th and 7th houses", () => {
    // Libra rising: Aries on the 7th (Mars), Aquarius on the 5th (Saturn).
    expect(loveRulers(me)).toEqual({ saturn: [5], mars: [7] });
    expect(loveRulers(chartFor({ ...births[0]!, time: null }))).toEqual({});
  });
});

describe("timeline", () => {
  it("covers the months asked for, from the start of the first", () => {
    expect(mine.months).toHaveLength(60);
    expect(mine.months[0]!.key).toBe("2025-11");
    expect(mine.months[59]!.key).toBe("2030-10");
    expect(mine.from.toISOString()).toBe("2025-11-01T00:00:00.000Z");
    expect(mine.to.toISOString()).toBe("2030-11-01T00:00:00.000Z");
  });

  it("gives every event a span inside the range, with its exact dates inside the span", () => {
    for (const tl of timelines) {
      expect(tl.events.length).toBeGreaterThan(20);
      for (const e of tl.events) {
        expect(e.from.getTime()).toBeLessThanOrEqual(e.to.getTime());
        expect(e.from.getTime()).toBeGreaterThanOrEqual(tl.from.getTime());
        expect(e.to.getTime()).toBeLessThanOrEqual(tl.to.getTime());
        for (const x of e.exact) {
          expect(x.getTime()).toBeGreaterThanOrEqual(e.from.getTime());
          expect(x.getTime()).toBeLessThanOrEqual(e.to.getTime());
        }
        expect([0, 1, 2]).toContain(e.romance);
        expect(e.body.length).toBeGreaterThan(40);
        expect(e.title).toMatch(/^[A-Z0-9]/);
        // Title Case, apart from ordinals such as "5th".
        for (const word of e.title.split(" ")) expect(word).toMatch(/^[A-Z]|^\d/);
      }
      expect(new Set(tl.events.map((e) => e.id)).size).toBe(tl.events.length);
    }
  });

  it("uses all three techniques", () => {
    for (const technique of ["transit", "progression", "solar-arc"] as const) expect(timelines.some((tl) => tl.events.some((e) => e.technique === technique))).toBe(true);
    expect(mine.events.some((e) => e.technique === "transit" && e.aspect === "house")).toBe(true);
  });

  it("places each exact transit and solar arc where the sky says it is", () => {
    const orbOf = Object.fromEntries(MOVERS.map((m) => [m.id, m.orb]));
    const angle = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 } as const;
    const natal = (id: string) => (id === "asc" ? me.houses!.asc : id === "dsc" ? norm(me.houses!.asc + 180) : me.bodies[id as "sun"].lon);
    let checked = 0;
    for (const e of mine.events) {
      if (e.aspect === "house" || e.aspect === "ingress" || e.aspect === "station") continue;
      for (const x of e.exact) {
        const lon = e.technique === "transit" ? bodiesAt(x.getTime(), [e.mover as "sun"])[e.mover as "sun"].lon : e.technique === "progression" ? progressedAt(birthMs, x.getTime())[e.mover as "sun"].lon : solarArcAt(me, birthMs, x.getTime()).points[e.mover as "sun"]!;
        expect(Math.abs(Math.abs(delta(natal(e.target), lon)) - angle[e.aspect])).toBeLessThan(0.05);
        checked++;
      }
      // The ends of a span that falls inside the range sit on the orb.
      if (e.technique === "transit" && !e.openStart) {
        const lon = bodiesAt(e.from.getTime(), [e.mover as "sun"])[e.mover as "sun"].lon;
        expect(Math.abs(Math.abs(Math.abs(delta(natal(e.target), lon)) - angle[e.aspect]) - orbOf[e.mover]!)).toBeLessThan(0.1);
      }
      if (e.technique === "solar-arc" && !e.openEnd) {
        const lon = solarArcAt(me, birthMs, e.to.getTime()).points[e.mover as "sun"]!;
        expect(Math.abs(Math.abs(Math.abs(delta(natal(e.target), lon)) - angle[e.aspect]) - DIRECTED_ORB)).toBeLessThan(0.02);
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it("marks solar arc trines and sextiles as weaker", () => {
    for (const tl of timelines)
      for (const e of tl.events) {
        expect(e.weak).toBe(e.technique === "solar-arc" && (e.aspect === "trine" || e.aspect === "sextile"));
        if (e.weak) expect(e.romance).toBeLessThan(2);
      }
  });

  it("lists each month's events by technique", () => {
    for (const m of mine.months) {
      for (const e of [...m.transit, ...m.progression, ...m.solarArc]) {
        expect(e.from.getTime()).toBeLessThanOrEqual(m.end.getTime());
        expect(e.to.getTime()).toBeGreaterThanOrEqual(m.start.getTime());
      }
      expect(m.transit.every((e) => e.technique === "transit")).toBe(true);
      expect(m.progression.every((e) => e.technique === "progression")).toBe(true);
      expect(m.solarArc.every((e) => e.technique === "solar-arc")).toBe(true);
      // A highlighted month has a strong transit at its peak with a progression or solar arc behind it.
      if (m.strength) {
        expect(m.techniques).toContain("transit");
        expect(m.techniques.length).toBeGreaterThanOrEqual(2);
        expect(m.transit.some((e) => e.romance === 2 && e.aspect !== "house" && e.exact.length > 0)).toBe(true);
        if (m.strength === 3) expect(m.techniques).toHaveLength(3);
      } else expect(m.techniques).toEqual([]);
    }
  });

  it("opens a romance window only where at least two techniques carry a romance factor", () => {
    expect(timelines.some((tl) => tl.windows.length > 0)).toBe(true);
    for (const tl of timelines) {
      const covered = new Set<string>();
      let before = -Infinity;
      for (const w of tl.windows) {
        expect(w.techniques.length).toBeGreaterThanOrEqual(2);
        expect(new Set(w.factors.map((f) => f.technique)).size).toBeGreaterThanOrEqual(2);
        expect(w.factors.every((f) => f.romance > 0)).toBe(true);
        expect(w.strength).toBe(tl.months.some((m) => m.strength === 3 && m.start >= w.from && m.end <= w.to) ? 3 : 2);
        if (w.strength === 3) expect(w.techniques).toHaveLength(3);
        expect(w.summary.length).toBeGreaterThan(20);
        // Windows are merged: none starts in the month after another ends.
        expect(w.from.getTime()).toBeGreaterThan(before + 86_400_000);
        before = w.to.getTime();
        for (const m of tl.months) if (m.start >= w.from && m.end <= w.to) covered.add(m.key);
      }
      for (const m of tl.months) expect(covered.has(m.key)).toBe(m.strength > 0);
    }
  });

  it("weights romance by our own rules", () => {
    expect(romanceOf("transit", "jupiter", "venus", "trine")).toBe(2);
    expect(romanceOf("transit", "jupiter", "venus", "square")).toBe(0);
    expect(romanceOf("transit", "jupiter", "dsc", "conjunction")).toBe(2);
    expect(romanceOf("transit", "jupiter", "mercury", "sextile", { target: [7] })).toBe(2);
    expect(romanceOf("transit", "jupiter", "house-5", "house")).toBe(2);
    expect(romanceOf("transit", "saturn", "house-7", "house")).toBe(1);
    expect(romanceOf("transit", "saturn", "house-5", "house")).toBe(0);
    expect(romanceOf("transit", "uranus", "venus", "square")).toBe(1);
    expect(romanceOf("transit", "uranus", "dsc", "conjunction")).toBe(1);
    expect(romanceOf("transit", "saturn", "venus", "conjunction")).toBe(1);
    expect(romanceOf("transit", "saturn", "dsc", "conjunction")).toBe(1);
    expect(romanceOf("transit", "saturn", "asc", "conjunction")).toBe(0);
    for (const mover of ["saturn", "neptune", "pluto"]) for (const target of ["venus", "moon"]) for (const aspect of ["square", "opposition"] as const) expect(romanceOf("transit", mover, target, aspect)).toBe(0);
    expect(romanceOf("transit", "neptune", "venus", "trine")).toBe(1);
    expect(romanceOf("transit", "pluto", "moon", "sextile")).toBe(1);
    expect(romanceOf("progression", "venus", "sun", "conjunction")).toBe(2);
    expect(romanceOf("progression", "venus", "asc", "trine")).toBe(2);
    expect(romanceOf("progression", "sun", "venus", "sextile")).toBe(2);
    expect(romanceOf("progression", "mars", "venus", "square")).toBe(0);
    expect(romanceOf("progression", "moon", "venus", "conjunction")).toBe(2);
    expect(romanceOf("progression", "moon", "venus", "trine")).toBe(1);
    expect(romanceOf("progression", "moon", "house-7", "house")).toBe(2);
    expect(romanceOf("solar-arc", "venus", "sun", "square")).toBe(2);
    expect(romanceOf("solar-arc", "venus", "sun", "trine")).toBe(1);
    expect(romanceOf("solar-arc", "dsc", "venus", "conjunction")).toBe(2);
    expect(romanceOf("solar-arc", "mercury", "venus", "conjunction", { mover: [7] })).toBe(2);
    expect(romanceOf("solar-arc", "mercury", "venus", "conjunction", { mover: [5] })).toBe(0);
    expect(romanceOf("solar-arc", "saturn", "venus", "conjunction")).toBe(0);
  });

  it("leaves out angles, houses, rulers and the Moon without a birth time, and says so", () => {
    for (const b of births) {
      const chart = chartFor({ ...b, time: null });
      expect(chart.houses).toBeNull();
      const tl = timelineFor(chart, Date.parse(chart.utc), range);
      expect(tl.notes).toHaveLength(1);
      expect(tl.notes[0]).toMatch(/Without a birth time/);
      expect(tl.events.length).toBeGreaterThan(5);
      for (const e of tl.events) {
        expect(["asc", "dsc", "mc", "moon"]).not.toContain(e.mover);
        expect(["sun", "venus", "mars"].includes(e.target) || e.aspect === "ingress" || e.aspect === "station").toBe(true);
        expect(e.aspect).not.toBe("house");
      }
    }
    expect(mine.notes).toHaveLength(0);
  });

  it("is deterministic", () => {
    const again = timelineFor(me, birthMs, range);
    expect(JSON.stringify(again)).toBe(JSON.stringify(mine));
    // Any day in the same month gives the same range.
    expect(JSON.stringify(timelineFor(me, birthMs, { from: new Date(Date.UTC(2025, 10, 1)), months: 60 }))).toBe(JSON.stringify(mine));
  });

  it("is fast enough to render on a page", () => {
    const t0 = performance.now();
    timelineFor(me, birthMs, range);
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
