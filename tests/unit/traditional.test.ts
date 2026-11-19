import { describe, expect, it } from "vitest";
import { ageOn, dignityTable, faceRuler, firdaria, isDayChart, lots, profection, releasingL1, releasingL2, termRuler } from "@/lib/astro/traditional";
import type { BodyId, ChartPoints } from "@/lib/astro/types";

const DAY = 86_400_000;
describe("dignity tables", () => {
  it("terms and faces", () => {
    expect(termRuler(5)).toBe("jupiter"); // Aries 5°
    expect(termRuler(29)).toBe("saturn");
    expect(termRuler(30 * 11 + 13)).toBe("jupiter"); // Pisces 13°
    expect(faceRuler(0)).toBe("mars"); // Aries 1st decan
    expect(faceRuler(30 * 11 + 25)).toBe("mars"); // Pisces 3rd decan
    expect(faceRuler(30 * 3 + 25)).toBe("moon"); // Cancer 3rd decan
  });
  const chart = (sunHouse: number, pos: Partial<Record<BodyId, number>>): ChartPoints => ({
    cusps: Array.from({ length: 12 }, (_, i) => i * 30), asc: 0, mc: 270,
    bodies: Object.entries(pos).map(([id, lon]) => ({ id: id as BodyId, lon: lon!, speed: 1, house: id === "sun" ? sunHouse : 1 })),
  });
  it("Lilly scores", () => {
    // Day chart. Sun at 5° Aries: exaltation 4 + triplicity (day, fire) 3 = 7.
    const rows = dignityTable(chart(10, { sun: 5, saturn: 5, mars: 95 }));
    expect(rows.find((r) => r.id === "sun")).toMatchObject({ score: 7, has: ["Exaltation", "Triplicity"] });
    // Saturn at 5° Aries: fall −4, and peregrine (no dignity) −5.
    expect(rows.find((r) => r.id === "saturn")!.score).toBe(-9);
    // Mars at 5° Cancer: term (Mars 0–7) +2, fall −4 → −2; triplicity (water, day) is Venus.
    expect(rows.find((r) => r.id === "mars")).toMatchObject({ score: -2 });
    // Almuten of 5° Aries by day: Sun 7 (exaltation + triplicity) beats Mars 6 (domicile + face).
    expect(rows.find((r) => r.id === "sun")!.almuten).toEqual(["sun"]);
  });
  it("sect", () => {
    expect(isDayChart(chart(10, { sun: 0, moon: 90 }))).toBe(true);
    expect(isDayChart(chart(3, { sun: 0, moon: 90 }))).toBe(false);
  });
});

describe("time lords", () => {
  it("profections", () => {
    expect(profection(15, 0)).toMatchObject({ house: 1, sign: 0, lord: "mars" });
    expect(profection(15, 13)).toMatchObject({ house: 2, sign: 1, lord: "venus" });
    expect(ageOn("1988-03-14T15:42:00Z", "2026-11-19")).toBe(38);
  });
  it("firdaria: diurnal starts with the Sun, nocturnal with the Moon; 7 sub-periods", () => {
    const d = firdaria("2000-01-01T00:00:00Z", true);
    expect(d.slice(0, 3).map((f) => f.lord)).toEqual(["sun", "venus", "mercury"]);
    expect(d[0]!.subs.map((s) => s.lord)).toEqual(["sun", "venus", "mercury", "moon", "saturn", "jupiter", "mars"]);
    expect(Math.round((d[0]!.end - d[0]!.start) / (365.25 * DAY))).toBe(10);
    expect(firdaria("2000-01-01T00:00:00Z", false)[0]!.lord).toBe("moon");
    expect(d.find((f) => f.lord === "node")!.subs).toHaveLength(0);
  });
  it("lots reverse by night", () => {
    const p = (house: number): ChartPoints => ({ cusps: [], asc: 0, mc: 270, bodies: [{ id: "sun", lon: 100, speed: 1, house }, { id: "moon", lon: 40, speed: 13, house: 1 }] });
    expect(lots(p(10))).toMatchObject({ fortune: 300, spirit: 60, day: true });
    expect(lots(p(3))).toMatchObject({ fortune: 60, spirit: 300, day: false });
  });
  it("zodiacal releasing: 360-day years, Capricorn 27, loosing of the bond", () => {
    const l1 = releasingL1(270 + 5, "2000-01-01T00:00:00Z");
    expect(l1[0]!.sign).toBe(9);
    expect((l1[0]!.end - l1[0]!.start) / DAY).toBe(27 * 360);
    expect(l1[1]!.sign).toBe(10);
    const l2 = releasingL2(l1[0]!);
    expect(l2.slice(0, 2).map((x) => x.sign)).toEqual([9, 10]);
    const lb = l2.find((x) => x.loosed)!;
    expect(lb.sign).toBe(3); // jumps to Cancer, opposite Capricorn
    expect(Math.round((lb.start - l1[0]!.start) / DAY)).toBe(211 * 30);
  });
});

import { cycleAround } from "@/lib/astro/activation";
describe("contact cycles", () => {
  const w = (start: string, end: string, exacts: string[] = [], o: { startOpen?: boolean; endOpen?: boolean } = {}) => ({ start: `${start}T00:00:00Z`, end: `${end}T00:00:00Z`, startOpen: !!o.startOpen, endOpen: !!o.endOpen, exacts: exacts.map((u, i) => ({ utc: `${u}T00:00:00Z`, pass: i + 1, retrograde: false })), minOrb: exacts.length ? 0 : 0.5, closest: `${start}T00:00:00Z`, stations: [] });
  it("keeps every pass of a retrograde cycle, joining a pass split between two calculations", () => {
    // Pluto trine natal Mars: Feb–May 2025, Jun 2025–Feb 2026, Aug–Dec 2026; a later, separate cycle in 2040.
    const ws = [
      w("2025-02-10", "2025-05-04", ["2025-03-20"]),
      w("2025-06-04", "2025-11-18", ["2025-07-24"], { endOpen: true }),
      w("2025-11-18", "2026-02-20", ["2025-12-28"], { startOpen: true }),
      w("2026-08-20", "2026-12-02"),
      w("2040-01-01", "2040-03-01", ["2040-02-01"]),
    ];
    const c = cycleAround(ws, Date.parse("2026-11-18T12:00:00Z"));
    expect(c).toHaveLength(3);
    expect(c[0]!.start).toBe("2025-02-10T00:00:00Z");
    expect(c[1]!.exacts.map((x) => x.pass)).toEqual([1, 2]);
    expect(c[2]!.end).toBe("2026-12-02T00:00:00Z");
  });
});
