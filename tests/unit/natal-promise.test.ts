import { describe, expect, it } from "vitest";
import { natalModel } from "@/lib/astro/activation";
import { conditionOf, promiseContext, tie } from "@/lib/astro/natal-promise/condition";
import { lotById } from "@/lib/astro/natal-promise/lots";
import { midpointOf, pictures } from "@/lib/astro/natal-promise/midpoints";
import { assess, MODULES } from "@/lib/astro/natal-promise/modules";
import type { TargetId } from "@/lib/astro/timeline";

// Aries rising, equal houses. Night chart (Sun in the 4th).
const model = (extra: [TargetId, number, number][] = []) =>
  natalModel({
    natal: ([["sun", 100, 4], ["moon", 40, 2], ["mercury", 96, 4], ["venus", 185, 7], ["mars", 130, 5], ["jupiter", 190, 7], ["saturn", 250, 9], ["pluto", 222.5, 8], ["asc", 0, 1], ["mc", 270, 10], ...extra] as [TargetId, number, number][]).map(([id, lon, house]) => ({ id, lon, house, key: false })),
    cusps: Array.from({ length: 12 }, (_, i) => i * 30),
  });

describe("planetary condition", () => {
  const ctx = promiseContext(model(), { saturn: -0.05 })!;
  it("sect, dignity, house and aspects", () => {
    expect(ctx.day).toBe(false);
    // Venus 5° Libra, 7th, by night, conjunct Jupiter: domicile 5 + house 4 + benefic of the sect 2 + Jupiter 2.
    expect(conditionOf(ctx, "venus")).toMatchObject({ net: 13, level: "strong" });
  });
  it("the Sun's rays and retrogradation", () => {
    // Mercury 4° from the Sun: combust. Saturn retrograde, and the malefic contrary to the sect by night.
    expect(conditionOf(ctx, "mercury")!.notes.map((n) => n.text)).toContain("combust");
    const saturn = conditionOf(ctx, "saturn")!.notes.map((n) => n.text);
    expect(saturn).toContain("retrograde");
    expect(saturn).toContain("the malefic contrary to the sect");
  });
  it("ties between rulers", () => {
    expect(tie(ctx.n, "venus", "jupiter")).toBe("Venus conjunct Jupiter");
    expect(tie(ctx.n, "saturn", "saturn")).toBe("the same planet, Saturn");
  });
  it("needs a birth time", () => {
    expect(promiseContext(natalModel({ natal: [{ id: "sun", lon: 100, house: null, key: false }], cusps: null }))).toBeNull();
  });
});

describe("lots keep their source and formula", () => {
  const ctx = promiseContext(model())!;
  it("Fortune and Spirit reverse by night", () => {
    expect(lotById("fortune").lon(ctx)).toBe(60); // Asc + Sun − Moon
    expect(lotById("spirit").lon(ctx)).toBe(300); // Asc + Moon − Sun
    expect(lotById("fortune").source).toContain("Hellenistic");
  });
  it("topic lots", () => {
    expect(lotById("marriage-dorotheus-m").lon(ctx)).toBe(295); // Saturn → Venus: 0 + 185 − 250
    expect(lotById("marriage-dorotheus-f").lon(ctx)).toBe(65);
    expect(lotById("children").lon(ctx)).toBe(300); // by night Saturn → Jupiter: 0 + 190 − 250
    expect(lotById("exaltation").lon(ctx)).toBe(353); // by night Moon → 3° Taurus: 0 + 33 − 40
    expect(lotById("basis").lon(ctx)).toBe(120); // the shorter arc between Fortune (60) and Spirit (300)
  });
});

describe("midpoints", () => {
  it("shorter arc, and pictures on the 45° dial", () => {
    expect(midpointOf(350, 20)).toBe(5);
    // Jupiter 190, Pluto 222.5: midpoint 206.25. A point at 251.25 is 45° on; Saturn at 250 is outside 1°.
    const n = model([["node", 251.25, 9]]);
    const p = pictures(n, [["jupiter", "pluto"]]);
    expect(p.map((x) => [x.point, x.angle])).toEqual([["node", 45]]);
    expect(p[0]!.orb).toBeCloseTo(0, 6);
  });
});

describe("modules", () => {
  const ctx = promiseContext(model())!;
  const get = (id: string) => assess(ctx, MODULES.find((m) => m.id === id)!);
  it("covers the practice's fifteen life areas", () => {
    expect(MODULES).toHaveLength(15);
  });
  it("marriage: layered evidence, no score", () => {
    const a = get("marriage");
    expect(a.primary[0]!.text).toBe("Venus (ruler of the 7th, in the 7th, natural significator) at 5°00′ Libra, 7th House: strong");
    expect(a.primary[0]!.detail).toContain("in its domicile, Libra (+5)");
    expect(a.supporting.map((e) => e.text)).toContain("Rulers of the 1st and 7th: Mars sextile Venus");
    expect(a.supporting.some((e) => e.text.startsWith("Lot of Marriage (men) (Dorotheus, Carmen II)"))).toBe(true);
    expect(a.strongest[0]).toContain("Venus");
    expect(a.monitor).toContain("Venus");
    expect(a).not.toHaveProperty("score");
    // Whatever argues against sits in its own layer, not among the support.
    expect(a.primary.every((e) => e.tone !== "challenge")).toBe(true);
  });
  it("a midpoint picture that restates a natal aspect says so", () => {
    // Venus/Jupiter midpoint at 187.5; the Midheaven at 270 is not on it, but a point at 277.5 squares it.
    const c = promiseContext(model([["node", 277.5, 10]]))!;
    const a = assess(c, MODULES.find((m) => m.id === "friends")!);
    const pic = a.specialized.find((e) => e.text.startsWith("Venus/Jupiter = North Node"))!;
    expect(pic.tradition).toBe("midpoint");
    expect(pic.text).toContain("restates the natal conjunction");
  });
  it("children carries the traditional sign class and the caution", () => {
    const a = get("children");
    expect(a.def.caution).toContain("not a medical assessment");
    expect(a.supporting.some((e) => e.text.startsWith("5th cusp in Leo (barren)"))).toBe(true);
  });
});
