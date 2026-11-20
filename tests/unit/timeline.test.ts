import { describe, expect, it } from "vitest";
import { convergenceTimeline } from "@/lib/astro/timeline";
import type { Ephemeris } from "@/lib/astro/techniques";
import { lifecycleOf } from "@/lib/astro/activation";

/**
 * Stand-in ephemeris with hand-checkable motion:
 *  - Saturn moves linearly, 0.1°/day, at 0° on 2026-01-01.
 *  - "Jupiter" swings sinusoidally around 200° (±3°, 120-day period), so it
 *    crosses 200° repeatedly, retrograde on alternate passes, with stations at the turns.
 *  - Sun 1°/day, Moon 13°/day (for lunations): new moon when they meet.
 */
const T0 = Date.parse("2026-01-01T00:00:00Z");
const d = (utc: string) => (Date.parse(utc) - T0) / 86_400_000;
const W = (2 * Math.PI) / 120;
const fake: Pick<Ephemeris, "bodies"> = {
  async bodies(utc) {
    const t = d(utc);
    return {
      saturn: { lon: ((0.1 * t) % 360 + 360) % 360, speed: 0.1 },
      jupiter: { lon: 200 + 3 * Math.sin(W * t), speed: 3 * W * Math.cos(W * t) },
      sun: { lon: ((1 * t) % 360 + 360) % 360, speed: 1 },
      moon: { lon: ((13 * t + 6) % 360 + 360) % 360, speed: 13 },
      node: { lon: 90, speed: 0 },
    };
  },
};

const natal = {
  birthUtc: "1990-01-01T00:00:00Z",
  bodies: [
    { id: "moon" as const, lon: 10 },
    { id: "venus" as const, lon: 200 },
  ],
};

const only = { progressions: false, solarArcs: false, lunations: false, aspects: ["conjunction" as const, "square" as const] };

describe("convergence timeline", () => {
  it("finds an exact transit and its orb window", async () => {
    const r = await convergenceTimeline({ natal, from: "2026-01-01", to: "2026-12-31", eph: fake, options: { ...only, transitBodies: ["saturn"] } });
    const c = r.contacts.find((x) => x.id === "transit:saturn:conjunction:moon")!;
    expect(c).toBeTruthy();
    expect(c.windows).toHaveLength(1);
    const w = c.windows[0]!;
    // 10° at 0.1°/day → day 100 (2026-04-11); orb 1° → days 90–110.
    expect(w.exacts).toHaveLength(1);
    expect(Math.abs(d(w.exacts[0]!.utc) - 100)).toBeLessThan(0.01);
    expect(Math.abs(d(w.start) - 90)).toBeLessThan(0.01);
    expect(Math.abs(d(w.end) - 110)).toBeLessThan(0.01);
    expect(w.exacts[0]!.retrograde).toBe(false);
    // Saturn square Venus (200 − 90 = 110°) at day 1100 is outside the range.
    expect(r.contacts.some((x) => x.id === "transit:saturn:square:venus")).toBe(false);
    // Square Moon at 100° → day 1000: outside too; but 10 − 90 = 280° → day 2800: no.
  });

  it("numbers every pass of a back-and-forth motion and flags retrograde hits and stations", async () => {
    const r = await convergenceTimeline({ natal, from: "2026-01-01", to: "2026-12-31", eph: fake, options: { ...only, transitBodies: ["jupiter"], orbs: { transit: 1, directed: 1, lunation: 3, eclipse: 5 } } });
    const c = r.contacts.find((x) => x.id === "transit:jupiter:conjunction:venus")!;
    // sin crosses 0 at t = 0, 60, 120, … → exacts at 60, 120, …, 360 (t = 0 is the range start).
    const exacts = c.windows.flatMap((w) => w.exacts);
    const times = exacts.map((e) => d(e.utc));
    for (const k of [60, 120, 180, 240, 300, 360]) expect(times.some((t) => Math.abs(t - k) < 0.02)).toBe(true);
    expect(exacts.map((e) => e.pass)).toEqual(exacts.map((_, i) => i + 1));
    // Moving backwards (cos < 0) at 60, 180, 300.
    expect(exacts.find((e) => Math.abs(d(e.utc) - 60) < 0.02)!.retrograde).toBe(true);
    expect(exacts.find((e) => Math.abs(d(e.utc) - 120) < 0.02)!.retrograde).toBe(false);
    // ±1° of a ±3° swing: in orb while |sin| ≤ 1/3 → each window ≈ 2·asin(1/3)/W ≈ 13 days.
    const inner = c.windows.find((w) => !w.startOpen && !w.endOpen)!;
    expect(Math.abs(d(inner.end) - d(inner.start) - (2 * Math.asin(1 / 3)) / W)).toBeLessThan(0.05);
    // Stations at the turns (t = 30, 90, …) fall outside the ±1° windows.
    expect(c.windows.every((w) => w.stations.length === 0)).toBe(true);
  });

  it("puts stations inside the window when the turn is within orb", async () => {
    const wide = await convergenceTimeline({ natal, from: "2026-01-01", to: "2026-06-30", eph: fake, options: { ...only, transitBodies: ["jupiter"], orbs: { transit: 5, directed: 1, lunation: 3, eclipse: 5 } } });
    const c = wide.contacts.find((x) => x.id === "transit:jupiter:conjunction:venus")!;
    // With a 5° orb the swing never leaves orb: one window across the whole range, stations at 30, 90, 150.
    expect(c.windows).toHaveLength(1);
    expect(c.windows[0]!.startOpen && c.windows[0]!.endOpen).toBe(true);
    const st = c.windows[0]!.stations;
    expect(st.map((s) => Math.round(d(s.utc)))).toEqual([30, 90, 150]);
    expect(st.map((s) => s.kind)).toEqual(["retrograde", "direct", "retrograde"]);
  });

  it("finds lunations landing on natal points", async () => {
    const r = await convergenceTimeline({ natal, from: "2026-01-01", to: "2026-03-31", eph: fake, options: { transits: false, progressions: false, solarArcs: false, lunations: true } });
    // Moon gains 12°/day on the Sun from 6° behind… ahead: they meet when 12t + 6 ≡ 0 (mod 360) → t = 29.5, 59.5, 89.5.
    const news = r.lunations.filter((l) => l.kind === "new").map((l) => d(l.utc));
    expect(news.length).toBe(3);
    expect(Math.abs(news[0]! - 29.5)).toBeLessThan(0.01);
    // Full moons at 12t + 6 ≡ 180 → t = 14.5, 44.5, 74.5.
    const fulls = r.lunations.filter((l) => l.kind === "full").map((l) => d(l.utc));
    expect(Math.abs(fulls[0]! - 14.5)).toBeLessThan(0.01);
    // New moon at t = 29.5 is at 29.5°: no natal point within 3° … full moon at 74.5 sits at 254.5°: no.
    // The new moon at t = 89.5 → 89.5°; natal Moon at 10° is square-ish? |89.5 − 10| = 79.5 → no.
    // Node at 90°: the new moon at 89.5° is an estimated solar eclipse.
    expect(r.lunations.find((l) => Math.abs(d(l.utc) - 89.5) < 0.01)!.eclipse).toBe("solar eclipse");
    expect(r.notes.some((n) => n.includes("estimated"))).toBe(true);
  });

  it("scores overlap and reports a convergence window", async () => {
    // Two targets that Saturn and Jupiter reach at the same time.
    const n2 = { birthUtc: natal.birthUtc, bodies: [{ id: "moon" as const, lon: 20 }, { id: "sun" as const, lon: 200 }, { id: "mars" as const, lon: 110 }] };
    const r = await convergenceTimeline({ natal: n2, from: "2026-01-01", to: "2026-12-31", eph: fake, options: { ...only, transitBodies: ["saturn", "jupiter"] } });
    // Saturn ☌ Moon at day 200; Jupiter ☌ Sun every 60 days incl. 180 and 240; Jupiter □ Mars (200 − 90 = 110) is always in orb only at the extremes — no.
    expect(r.contacts.some((c) => c.id === "transit:saturn:conjunction:moon")).toBe(true);
    expect(r.days).toHaveLength(365);
    const peak = r.days.reduce((a, b) => (b.score > a.score ? b : a));
    expect(peak.count).toBeGreaterThanOrEqual(2);
  });

  it("leaves out angles when the birth time is unknown, and includes them when known", async () => {
    const noTime = await convergenceTimeline({ natal, from: "2026-01-01", to: "2026-02-01", eph: fake, options: only });
    expect(noTime.natal.some((t) => t.id === "asc")).toBe(false);
    expect(noTime.notes[0]).toMatch(/Birth time unknown/);
    const withTime = await convergenceTimeline({ natal: { ...natal, asc: 15, mc: 280, cusps: Array.from({ length: 12 }, (_, i) => (15 + i * 30) % 360) }, from: "2026-01-01", to: "2026-02-01", eph: fake, options: only });
    expect(withTime.natal.find((t) => t.id === "asc")!.house).toBe(1);
    expect(withTime.natal.find((t) => t.id === "moon")!.house).toBe(12);
  });

  it("directs points by the solar arc and progresses at a day for a year", async () => {
    // Sun moves 1°/day, so the true solar arc is 1° per year of life.
    // Born 2025-01-01: natal Sun 355°. SA Moon (10°) reaches natal Mars (11.5°) at age 1.5 → ≈ 2026-07-02.
    const birthUtc = "2025-01-01T00:00:00Z";
    const r = await convergenceTimeline({
      natal: { birthUtc, bodies: [{ id: "sun", lon: 355 }, { id: "moon", lon: 10 }, { id: "mars", lon: 11.5 }] },
      from: "2026-01-01", to: "2026-12-31", eph: fake,
      options: { transits: false, progressions: true, solarArcs: true, lunations: false, aspects: ["conjunction"], orbs: { transit: 1, directed: 0.25, lunation: 3, eclipse: 5 } },
    });
    const sa = r.contacts.find((c) => c.id === "solar-arc:moon:conjunction:mars")!;
    const ageAtExact = (Date.parse(sa.windows[0]!.exacts[0]!.utc) - Date.parse(birthUtc)) / 86_400_000 / 365.24219;
    expect(Math.abs(ageAtExact - 1.5)).toBeLessThan(0.002);
    // Orb 0.25° at 1°/year → ±0.25 years around the exact.
    const w = sa.windows[0]!;
    expect(Math.abs((Date.parse(w.end) - Date.parse(w.start)) / 86_400_000 / 365.24219 - 0.5)).toBeLessThan(0.01);
    // Secondary-progressed Sun is the same 1°/year here: progressed Sun (355° + age) ☌ natal Moon (10°) needs age 15 → not in range.
    expect(r.contacts.some((c) => c.id === "progressed:sun:conjunction:moon")).toBe(false);
    // A point is never directed onto itself.
    expect(r.contacts.some((c) => c.source === c.target)).toBe(false);
  });

  describe("solar arc lifecycle across the range edge", () => {
    // The fake Sun moves 1°/day, so the solar arc is 1° per year of life. Natal Sun = the fake Sun at birth.
    const birthUtc = "1990-01-01T00:00:00Z";
    const age = (utc: string) => (Date.parse(utc) - Date.parse(birthUtc)) / 86_400_000 / 365.24219;
    const moon = 99 + 38 / 60; // 9°38' Cancer
    // Solar arc Mars reaches the natal Moon on 2026-10-10.
    const mars = moon - age("2026-10-10T00:00:00Z");
    const chart = { birthUtc, bodies: [{ id: "sun" as const, lon: ((d(birthUtc) % 360) + 360) % 360 }, { id: "moon" as const, lon: moon }, { id: "mars" as const, lon: mars }] };
    const run = (from: string) =>
      convergenceTimeline({ natal: chart, from, to: "2027-12-31", eph: fake, options: { transits: false, progressions: false, solarArcs: true, lunations: false, aspects: ["conjunction"] } });
    const asOf = Date.parse("2026-11-20T12:00:00Z");

    for (const from of ["2026-11-01", "2026-09-01"]) {
      it(`is one pass, exact Oct 10, 2026, with the range starting ${from}`, async () => {
        const r = await run(from);
        const c = r.contacts.find((x) => x.id === "solar-arc:mars:conjunction:moon")!;
        expect(c.cycle).toHaveLength(1);
        const L = lifecycleOf(c, asOf)!;
        expect(L.single).toBe(true);
        expect(L.windows).toHaveLength(1);
        expect(L.exacts).toHaveLength(1);
        expect(Math.abs(L.exacts[0]!.t - Date.parse("2026-10-10T00:00:00Z"))).toBeLessThan(3_600_000);
        expect(L.phase).toBe("Separating, exact 6 weeks ago, in orb until Oct 2027");
        expect(L.phase).not.toMatch(/Perfect/);
        // A year either side of the exact at 1°/year.
        expect(Math.abs((L.last - L.first) / 86_400_000 - 2 * 365.24)).toBeLessThan(1);
      });
    }

    it("measures the closest approach inside the range", async () => {
      const c = (await run("2026-11-01")).contacts.find((x) => x.id === "solar-arc:mars:conjunction:moon")!;
      const w = c.windows[0]!;
      expect(w.exacts).toHaveLength(0);
      expect(w.startOpen).toBe(true);
      expect(w.closest.slice(0, 10)).toBe("2026-11-01");
      // 22 days after the exact at 1°/year.
      expect(Math.abs(w.minOrb - 22 / 365.24)).toBeLessThan(0.002);
    });

    it("words the phase by time while applying and at the exact", async () => {
      const c = (await run("2026-01-01")).contacts.find((x) => x.id === "solar-arc:mars:conjunction:moon")!;
      expect(lifecycleOf(c, Date.parse("2026-03-10T12:00:00Z"))!.phase).toBe("Applying, exact in 7 months (Oct 2026)");
      expect(lifecycleOf(c, Date.parse("2026-10-25T12:00:00Z"))!.phase).toBe("Exact this month");
    });
  });

  it("uses a planet's own transit orb when one is set", async () => {
    const base = { ...only, transitBodies: ["saturn" as const] };
    const wide = await convergenceTimeline({ natal, from: "2026-01-01", to: "2026-12-31", eph: fake, options: { ...base, transitOrbs: { saturn: 2 } } });
    const w = wide.contacts.find((x) => x.id === "transit:saturn:conjunction:moon")!.windows[0]!;
    // 2° at 0.1°/day → days 80–120 instead of 90–110.
    expect(Math.abs(d(w.start) - 80)).toBeLessThan(0.01);
    expect(Math.abs(d(w.end) - 120)).toBeLessThan(0.01);
  });

  it("rejects ranges over three years", async () => {
    await expect(convergenceTimeline({ natal, from: "2026-01-01", to: "2030-01-01", eph: fake })).rejects.toThrow(/three years/);
  });
});
