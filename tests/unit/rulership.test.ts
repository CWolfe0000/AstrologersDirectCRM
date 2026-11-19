import { describe, expect, it } from "vitest";
import { rulershipReport } from "@/lib/astro/rulership";
import type { ChartPoints } from "@/lib/astro/types";

// The chart from the Solar Fire example: AC 28°47′ Aries, Taurus intercepted in the 1st, Scorpio in the 7th.
const cusps = [28.78, 62.12, 84.6, 104.75, 127.43, 159.22, 208.78, 242.12, 264.6, 284.75, 307.43, 339.22];
const at = (sign: number, deg: number) => sign * 30 + deg;
const chart: ChartPoints = {
  cusps, asc: cusps[0]!, mc: cusps[9]!,
  bodies: [
    { id: "moon", lon: at(3, 9), speed: 13, house: 3 },
    { id: "sun", lon: at(11, 25), speed: 1, house: 12 },
    { id: "mercury", lon: at(11, 7), speed: 1, house: 11 },
    { id: "venus", lon: at(11, 19), speed: 1, house: 12 },
    { id: "mars", lon: at(2, 2), speed: 0.6, house: 2 },
    { id: "jupiter", lon: at(2, 0.5), speed: 0.2, house: 1 },
    { id: "saturn", lon: at(9, 12), speed: 0.1, house: 9 },
    { id: "uranus", lon: at(9, 5), speed: 0.05, house: 9 },
    { id: "neptune", lon: at(9, 12), speed: 0.02, house: 9 },
    { id: "pluto", lon: at(7, 14), speed: -0.01, house: 7 },
  ],
};

describe("rulership report (modern)", () => {
  const r = rulershipReport(chart, "modern");
  const row = (id: string) => r.rows.find((x) => x.id === id)!;
  it("houses ruled, with intercepted signs", () => {
    expect(row("venus").rules).toEqual([{ house: 7, intercepted: false }, { house: 1, intercepted: true }]);
    expect(row("pluto").rules).toEqual([{ house: 7, intercepted: true }]);
    expect(row("mars").rules).toEqual([{ house: 1, intercepted: false }]);
    expect(row("mercury").rules.map((x) => x.house)).toEqual([2, 3, 6]);
  });
  it("dispositors", () => {
    expect(row("sun").dispositor).toBe("neptune");
    expect(row("sun").dispositorHouse).toBe(9);
    expect(row("asc").dispositor).toBe("mars");
  });
  it("summary matches the example", () => {
    expect(r.inRulership.sort()).toEqual(["moon", "pluto", "saturn"]);
    expect(r.inExaltation).toEqual(["venus"]);
    expect(r.inDetriment.sort()).toEqual(["jupiter", "mercury"]);
    expect(r.inFall).toEqual(["mercury"]);
    expect(r.accidental).toEqual([]);
    expect(r.mutual).toEqual([]);
    expect(r.final).toBeNull();
  });
});

describe("rulership report (traditional)", () => {
  const r = rulershipReport(chart, "traditional");
  it("Mars keeps Scorpio and Jupiter keeps Pisces", () => {
    expect(r.rows.find((x) => x.id === "mars")!.rules).toEqual([{ house: 1, intercepted: false }, { house: 7, intercepted: true }]);
    expect(r.rows.find((x) => x.id === "sun")!.dispositor).toBe("jupiter");
  });
});
