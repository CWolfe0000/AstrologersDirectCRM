import { describe, expect, it } from "vitest";
import {
  NAIBOD, PRECESSION_PER_YEAR, ascFromRamc, delta, eclipticToRA, findAspects, houseOf, mcFromRamc, midpointComposite,
  norm, secondaryProgressions, solarArcDirections, solarReturn, synastry, type Ephemeris, type PointSet,
} from "@/lib/astro/techniques";

/** Stand-in ephemeris with simple linear motions, so expected values can be computed by hand. */
const J2000 = Date.parse("2000-01-01T12:00:00Z");
const days = (utc: string) => (Date.parse(utc) - J2000) / 86_400_000;
const EPS = 23.4393;
const SUN = 0.9856474;
const fake: Ephemeris = {
  async bodies(utc) {
    const d = days(utc);
    return {
      sun: { lon: norm(280.46 + SUN * d), speed: SUN },
      moon: { lon: norm(218.32 + 13.176396 * d), speed: 13.176396 },
      mars: { lon: norm(355.45 + 0.524 * d), speed: 0.524 },
      saturn: { lon: norm(49.95 + 0.0335 * d), speed: 0.0335 },
    };
  },
  async obliquity() {
    return EPS;
  },
  async ramc(utc, lonEast) {
    return norm(280.46061837 + 360.98564736629 * days(utc) + lonEast);
  },
  async houses(utc, lat, lonEast, system) {
    return this.housesFromRamc(await this.ramc(utc, lonEast), lat, EPS, system);
  },
  async housesFromRamc(ramc, lat, eps) {
    const asc = ascFromRamc(ramc, lat, eps);
    return { asc, mc: mcFromRamc(ramc, eps), cusps: Array.from({ length: 12 }, (_, i) => norm(asc + 30 * i)) };
  },
};
const natal = { utc: "1988-03-14T15:42:00Z", place: { lat: 45.52, lon: -122.68 }, houseSystem: "equal" };
const near = (a: number, b: number, tol = 1e-6) => expect(Math.abs(delta(a, b))).toBeLessThan(tol);

describe("secondary progressions", () => {
  it("uses one day after birth per year of life", async () => {
    const p = await secondaryProgressions(natal, "2026-11-14T00:00:00Z", fake);
    const natalSun = (await fake.bodies(natal.utc)).sun!.lon;
    const daysAfter = (Date.parse(p.progressedUtc) - Date.parse(natal.utc)) / 86_400_000;
    expect(daysAfter).toBeCloseTo(p.age, 6); // the progressed moment is stored to the millisecond
    expect(p.age).toBeCloseTo(38.67, 2);
    near(p.points.find((x) => x.id === "sun")!.lon, natalSun + SUN * daysAfter);
  });
  it("directs the angles by the chosen method", async () => {
    const target = "2026-11-14T00:00:00Z";
    const nh = await fake.houses(natal.utc, natal.place.lat, natal.place.lon, "equal");
    const nramc = await fake.ramc(natal.utc, natal.place.lon);
    const sa = await secondaryProgressions(natal, target, fake, { angles: "solar-arc-longitude" });
    const natalSun = (await fake.bodies(natal.utc)).sun!.lon;
    const progSun = sa.points.find((x) => x.id === "sun")!.lon;
    near(sa.mc, nh.mc + (progSun - natalSun), 1e-6);
    near(sa.asc, ascFromRamc(eclipticToRA(sa.mc, EPS), natal.place.lat, EPS));
    const nb = await secondaryProgressions(natal, target, fake, { angles: "naibod-longitude" });
    near(nb.mc, nh.mc + nb.age * NAIBOD, 1e-6);
    const ra = await secondaryProgressions(natal, target, fake, { angles: "solar-arc-ra" });
    near(eclipticToRA(ra.mc, EPS), nramc + (eclipticToRA(progSun, EPS) - eclipticToRA(natalSun, EPS)), 1e-6);
    const nra = await secondaryProgressions(natal, target, fake, { angles: "naibod-ra" });
    near(eclipticToRA(nra.mc, EPS), nramc + nra.age * NAIBOD, 1e-6);
  });
});

describe("solar arc directions", () => {
  it("moves every point by the same arc", async () => {
    const target = "2026-11-14T00:00:00Z";
    const natalBodies = await fake.bodies(natal.utc);
    const d = await solarArcDirections(natal, target, fake);
    for (const p of d.points) near(p.lon, natalBodies[p.id]!.lon + d.arc);
    const prog = await secondaryProgressions(natal, target, fake);
    near(d.arc, prog.points.find((x) => x.id === "sun")!.lon - natalBodies.sun!.lon, 1e-9);
    const nh = await fake.houses(natal.utc, natal.place.lat, natal.place.lon, "equal");
    near(d.mc, nh.mc + d.arc);
    near(d.asc, nh.asc + d.arc);
  });
  it("supports Naibod and one-degree arcs", async () => {
    const n = await solarArcDirections(natal, "2026-11-14T00:00:00Z", fake, { arc: "naibod" });
    expect(n.arc).toBeCloseTo(n.age * NAIBOD, 9);
    const o = await solarArcDirections(natal, "2026-11-14T00:00:00Z", fake, { arc: "one-degree" });
    expect(o.arc).toBeCloseTo(o.age, 9);
  });
});

describe("solar return", () => {
  it("finds the moment the Sun returns to its natal longitude", async () => {
    const natalSun = (await fake.bodies(natal.utc)).sun!.lon;
    const sr = await solarReturn(natal, 2027, fake);
    near((await fake.bodies(sr.utc)).sun!.lon, natalSun, 1e-4); // < 0.4 arc-seconds
    expect(sr.utc.startsWith("2027-03-1")).toBe(true);
    // Cast at the birthplace by default: houses match that moment and place.
    const h = await fake.houses(sr.utc, natal.place.lat, natal.place.lon, "equal");
    near(sr.asc, h.asc);
  });
  it("precession-corrected returns come slightly later", async () => {
    const plain = await solarReturn(natal, 2027, fake);
    const prec = await solarReturn(natal, 2027, fake, { precessionCorrected: true });
    const shiftDays = (Date.parse(prec.utc) - Date.parse(plain.utc)) / 86_400_000;
    expect(shiftDays).toBeCloseTo((39 * PRECESSION_PER_YEAR) / SUN, 3);
    near(prec.targetLongitude, plain.targetLongitude + 39 * PRECESSION_PER_YEAR);
  });
  it("can be relocated", async () => {
    const lisbon = await solarReturn(natal, 2027, fake, { place: { lat: 38.72, lon: -9.14 } });
    const plain = await solarReturn(natal, 2027, fake);
    expect(lisbon.utc).toBe(plain.utc);
    expect(Math.abs(delta(lisbon.asc, plain.asc))).toBeGreaterThan(1);
  });
});

const equalCusps = (start: number) => Array.from({ length: 12 }, (_, i) => norm(start + 30 * i));
const A: PointSet = { points: [{ id: "sun", lon: 10, speed: 1 }, { id: "venus", lon: 350, speed: 1.2 }], asc: 0, mc: 270, cusps: equalCusps(0) };
const B: PointSet = { points: [{ id: "moon", lon: 130, speed: 13 }, { id: "mars", lon: 193, speed: 0.6 }, { id: "venus", lon: 25, speed: 1 }], asc: 100, mc: 10, cusps: equalCusps(100) };

describe("synastry", () => {
  it("lists inter-aspects with orbs, and nothing outside orb", () => {
    const s = synastry(A, B, { includeAngles: false });
    const pick = (a: string, b: string) => s.interAspects.find((x) => x.a === a && x.b === b);
    expect(pick("sun", "moon")).toMatchObject({ aspect: "trine", orb: 0 });
    expect(pick("sun", "mars")).toMatchObject({ aspect: "opposition" });
    expect(pick("sun", "mars")!.orb).toBeCloseTo(3, 9);
    expect(pick("venus", "venus")).toBeUndefined(); // 35° apart: no major aspect
  });
  it("places each person's points in the other's houses with strict cusps", () => {
    const s = synastry(A, B);
    expect(s.aInB.find((o) => o.point === "sun")!.house).toBe(10); // 10° is exactly B's 10th cusp (100° + 270°)
    expect(s.aInB.find((o) => o.point === "venus")!.house).toBe(9); // 350° falls in B's 9th (340°–10°)
    expect(s.bInA.find((o) => o.point === "moon")!.house).toBe(5); // 130° in houses starting at 0°
    expect(houseOf(30, equalCusps(0))).toBe(2); // exactly on a cusp → that house
    expect(houseOf(29.999, equalCusps(0))).toBe(1); // no 3° "cusp gradient"
  });
  it("contains no scores, weights or labels", () => {
    const s = synastry(A, B);
    expect(Object.keys(s).sort()).toEqual(["aInB", "bInA", "interAspects"]);
    for (const a of s.interAspects) expect(Object.keys(a).sort()).toEqual(["a", "angle", "aspect", "b", "orb", "phase"]);
  });
  it("reports applying and separating aspects from speeds", () => {
    const aspects = findAspects([{ id: "moon", lon: 100, speed: 13 }], [{ id: "sun", lon: 105, speed: 1 }]);
    expect(aspects[0]).toMatchObject({ aspect: "conjunction", phase: "applying" });
    const sep = findAspects([{ id: "moon", lon: 110, speed: 13 }], [{ id: "sun", lon: 105, speed: 1 }]);
    expect(sep[0]!.phase).toBe("separating");
  });
});

describe("midpoint composite", () => {
  it("takes midpoints on the shorter arc, across 0° Aries", async () => {
    const c = await midpointComposite(A, B, fake, { houseMethod: "midpoint-cusps" });
    near(c.points.find((p) => p.id === "venus")!.lon, 7.5); // 350° and 25°
    expect(c.points.find((p) => p.id === "sun")).toBeUndefined(); // only points both charts have
    near(c.mc, norm((270 + 10 + 360) / 2)); // 270° and 10° → 320°
    near(c.cusps[0]!, 50); // cusp midpoints
  });
  it("derives houses from the composite MC at the reference latitude", async () => {
    const c = await midpointComposite(A, B, fake, { houseMethod: "derived-mc", latitudes: [45.52, 32.72], obliquity: EPS });
    near(c.mc, 320, 1e-6);
    near(c.asc, ascFromRamc(eclipticToRA(320, EPS), (45.52 + 32.72) / 2, EPS));
    expect(c.method).toBe("derived-mc");
  });
});
