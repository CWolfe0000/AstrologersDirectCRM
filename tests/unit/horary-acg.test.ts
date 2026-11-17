import { describe, expect, it } from "vitest";
import { acgLines, approxAcg, linesNear, wrapLon } from "@/lib/astro/acg";
import { horaryConsiderations, moonNextAspect } from "@/lib/astro/horary";
import type { ChartPoints } from "@/lib/astro/types";

describe("astrocartography lines", () => {
  const d = { gst: 100, bodies: [{ id: "sun" as const, ra: 100, dec: 0 }, { id: "moon" as const, ra: 10, dec: 25 }] };
  const lines = acgLines(d);
  const line = (body: string, angle: string) => lines.find((l) => l.body === body && l.angle === angle)!;

  it("MC where the body culminates, IC opposite", () => {
    expect(line("sun", "MC").segments[0]![0]![0]).toBeCloseTo(0);
    expect(Math.abs(line("sun", "IC").segments[0]![0]![0])).toBeCloseTo(180);
    expect(line("moon", "MC").segments[0]![0]![0]).toBeCloseTo(wrapLon(10 - 100));
  });

  it("a body on the equator rises 90° west of its MC at every latitude", () => {
    const asc = line("sun", "ASC").segments[0]!;
    for (const [lon] of asc) expect(lon).toBeCloseTo(-90);
    for (const [lon] of line("sun", "DSC").segments[0]!) expect(lon).toBeCloseTo(90);
  });

  it("no rising line where a body is circumpolar", () => {
    const lats = line("moon", "ASC").segments.flat().map(([, lat]) => Math.abs(lat));
    expect(Math.max(...lats)).toBeLessThan(65.1); // tan φ · tan 25° > 1 above ~65°
  });

  it("finds the lines near a place", () => {
    const near = linesNear(lines, 30, 1, 300);
    expect(near[0]).toMatchObject({ body: "sun", angle: "MC" });
    expect(near[0]!.km).toBeLessThan(120);
  });

  it("approximate equatorial coordinates (demo engine)", () => {
    const a = approxAcg("2000-01-01T12:00:00Z", [{ id: "sun", lon: 90 }]);
    expect(a.gst).toBeCloseTo(280.46, 1);
    expect(a.bodies[0]!.ra).toBeCloseTo(90, 5);
    expect(a.bodies[0]!.dec).toBeCloseTo(23.44, 1);
  });
});

const chart = (asc: number, moon: { lon: number; speed: number }, others: { id: string; lon: number; speed: number; house?: number }[] = []): ChartPoints =>
  ({
    asc,
    mc: 0,
    cusps: Array.from({ length: 12 }, (_, i) => asc + i * 30),
    bodies: [{ id: "moon", lon: moon.lon, speed: moon.speed, house: 1 }, ...others.map((o) => ({ house: 4, ...o }))],
  }) as ChartPoints;

describe("horary considerations", () => {
  it("early and late Ascendant", () => {
    expect(horaryConsiderations(chart(31.5, { lon: 100, speed: 13 }), "2026-11-17T10:00").some((c) => c.id === "asc-early")).toBe(true);
    expect(horaryConsiderations(chart(58.2, { lon: 100, speed: 13 }), "2026-11-17T10:00").some((c) => c.id === "asc-late")).toBe(true);
  });

  it("Moon's next aspect, or void of course", () => {
    // Moon 10° Aries, Mars 25° Aries: conjunction in under 2 days, before the Moon leaves Aries.
    const next = moonNextAspect(chart(10, { lon: 10, speed: 13 }, [{ id: "mars", lon: 25, speed: 0.5 }]));
    expect(next).toMatchObject({ body: "mars", aspect: "conjunction" });
    expect(next!.days).toBeCloseTo(15 / 12.5, 5);
    // Moon 28° Aries; nothing perfects in the last 2°.
    const voc = horaryConsiderations(chart(10, { lon: 28, speed: 13 }, [{ id: "mars", lon: 100, speed: 0.5 }, { id: "sun", lon: 200, speed: 1 }]), "2026-11-17T10:00");
    expect(voc.some((c) => c.id === "moon-voc")).toBe(true);
  });

  it("Via Combusta, Saturn in the 7th and the day ruler", () => {
    const c = horaryConsiderations(chart(10, { lon: 200, speed: 13 }, [{ id: "saturn", lon: 190, speed: 0.03, house: 7 }]), "2026-11-17T10:00");
    expect(c.map((x) => x.id)).toEqual(expect.arrayContaining(["via-combusta", "saturn-7", "day-ruler"]));
    expect(c.find((x) => x.id === "day-ruler")!.detail).toContain("Tuesday, ruled by Mars");
  });
});
