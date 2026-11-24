import { describe, expect, it } from "vitest";
import type { Birth } from "@/lib/astro/types";
import { signName } from "@/lib/astro/zodiac";
import { binomialTail, checkAgainst, patternAcross, plainFacts, signaturesOf } from "@/lib/reading/exes";
import { attunement, elementBalance, elementNote, elementReading, relationOf } from "@/lib/reading/elements";
import { composite as readComposite } from "@/lib/reading/composite";
import { coupleReport } from "@/lib/reading/couple";
import { aspectsOf, ownPattern } from "@/lib/reading/own";
import { contactText } from "@/lib/reading/text";
import { difficultAspects, gifts, natalContactKeys } from "@/lib/reading/triggers";
import { chartFor } from "@/lib/server/charts";
import { referenceSignatures, seeded } from "@/lib/server/reference";
import { ownTiming } from "@/lib/server/readings";

const london = { place: "London", lat: 51.5074, lon: -0.1278, tz: "Europe/London" };
const me: Birth = { date: "1990-06-15", time: "14:30", ...london };
const aspectKeys = (c: ReturnType<typeof chartFor>) => aspectsOf(c).filter((a) => a.hard).map((a) => a.key).sort();
const born = (date: string, time: string | null = null): Birth => ({ date, time, ...london });

describe("charts", () => {
  it("casts a known chart", () => {
    const c = chartFor(me);
    expect(c.utc).toBe("1990-06-15T13:30:00.000Z"); // British Summer Time
    expect(signName(c.bodies.sun.lon)).toBe("Gemini");
    expect(c.bodies.sun.lon).toBeGreaterThan(83.5);
    expect(c.bodies.sun.lon).toBeLessThan(84.5);
    expect(signName(c.houses!.asc)).toBe("Libra");
    expect(c.houses!.cusps).toHaveLength(12);
  });

  it("has no houses without a birth time, and flags an uncertain Moon sign", () => {
    const c = chartFor(born("1990-06-15"));
    expect(c.houses).toBeNull();
    // Find a day on which the Moon changes sign: within any three days there is one.
    const flags = ["1990-06-15", "1990-06-16", "1990-06-17"].map((d) => chartFor(born(d)).moonSignCertain);
    expect(flags).toContain(false);
    expect(flags).toContain(true);
  });
});

describe("own pattern", () => {
  it("reads the core placements and the partnership houses", () => {
    const p = ownPattern(chartFor(me));
    expect(p.core.map((i) => i.title)).toEqual(["How you love", "What you need to feel safe", "What you go after"]);
    expect(p.drawnTo[0]!.basis).toBe("Descendant in Aries");
    expect(p.headline.name.length).toBeGreaterThan(3);
    expect(p.notes).toHaveLength(0);
  });

  it("explains what is missing without a birth time", () => {
    const p = ownPattern(chartFor(born("1990-06-15")));
    expect(p.drawnTo).toHaveLength(0);
    expect(p.notes.join(" ")).toMatch(/birth time/);
    expect(p.dynamics.every((d) => !d.basis.includes("Moon"))).toBe(true);
  });
});

describe("pattern across partners", () => {
  const you = chartFor(me);
  const subject = (date: string, name: string, time: string | null = null) => ({ name, chart: chartFor(born(date, time)), hasTime: !!time });

  it("computes binomial tails", () => {
    expect(binomialTail(2, 2, 0.1)).toBeCloseTo(0.01);
    expect(binomialTail(2, 3, 0.5)).toBeCloseTo(0.5);
    expect(binomialTail(0, 3, 0.2)).toBeCloseTo(1);
  });

  it("finds what near-identical partners share and rates it against chance", () => {
    const exes = [subject("1988-03-10", "A"), subject("1988-03-11", "B"), subject("1988-03-12", "C")];
    const random = seeded("test");
    const reference = referenceSignatures(you, 1986, 1990, random, 300);
    const result = patternAcross(you, exes, reference, random);
    expect(result.repeats.length).toBeGreaterThan(3);
    expect(result.repeats.some((r) => r.key === "sign|sun|11")).toBe(true); // all three have the Sun in Pisces
    for (const r of result.repeats) {
      expect(r.count).toBeGreaterThanOrEqual(2);
      expect(r.chance).toBeLessThanOrEqual(0.1);
      expect(r.names.length).toBe(r.count);
    }
    // Partners born days apart share far more than a random group does.
    expect(result.repeats.length).toBeGreaterThan(result.expectedByChance * 2);
    expect(result.checked).toBeGreaterThan(200);

    // Slow planets barely move in three days, but they are not "repeats": everyone that age has them.
    const generational = result.repeats.filter((r) => /contact\|(sun|moon|venus|mars)\|(neptune|pluto|uranus)\|/.test(r.key));
    expect(generational).toHaveLength(0);

    const again = patternAcross(you, exes, referenceSignatures(you, 1986, 1990, seeded("test"), 300), seeded("other"));
    expect(again.repeats.map((r) => r.key)).toEqual(result.repeats.map((r) => r.key));
  });

  it("random partners show about as many repeats as chance predicts", () => {
    const random = seeded("spread");
    const reference = referenceSignatures(you, 1980, 1996, random, 400);
    let found = 0, expected = 0;
    const days = (n: number) => new Date(Date.UTC(1981, 0, 1) + n * 86_400_000).toISOString().slice(0, 10);
    for (let trial = 0; trial < 40; trial++) {
      const exes = [0, 1, 2].map((i) => subject(days(Math.floor(seeded(`t${trial}-${i}`)() * 5400)), `P${i}`));
      const r = patternAcross(you, exes, reference, random);
      found += r.repeats.length;
      expected += r.expectedByChance;
    }
    expect(found / 40).toBeGreaterThan((expected / 40) * 0.5);
    expect(found / 40).toBeLessThan((expected / 40) * 1.8);
  });

  it("leaves a partner's Moon out when their birth time is unknown", () => {
    const keys = [...signaturesOf(you, { chart: chartFor(born("1988-03-10")), hasTime: false })];
    expect(keys.some((k) => /^contact\|\w+\|moon\|/.test(k) || k.startsWith("house|moon"))).toBe(false);
  });

  it("checks a new person against the repeats", () => {
    const exes = [subject("1988-03-10", "A"), subject("1988-03-11", "B")];
    const random = seeded("m");
    const result = patternAcross(you, exes, referenceSignatures(you, 1986, 1990, random, 300), random);
    const same = checkAgainst(you, result.repeats, { chart: chartFor(born("1988-03-10")), hasTime: false });
    expect(same.absent).toHaveLength(0);
    const other = checkAgainst(you, result.repeats, { chart: chartFor(born("1975-09-20")), hasTime: false });
    expect(other.carried.length).toBeLessThan(result.repeats.length);
  });

  it("summarises ages, lengths and endings", () => {
    const facts = plainFacts("1990-06-15", [
      { name: "A", birthDate: "1986-01-01", startYear: 2012, endYear: 2014, ending: "them" },
      { name: "B", birthDate: "1988-03-01", startYear: 2015, endYear: 2017, ending: "them" },
      { name: "C", birthDate: "1984-07-01", startYear: 2018, endYear: 2021, ending: "me" },
    ]);
    expect(facts[0]).toBe("Every partner was older than you, by 2 to 6 years.");
    expect(facts[1]).toMatch(/about 2 years each/);
    expect(facts[2]).toBe("They ended 2 of 3.");
  });
});

describe("couple report and wording", () => {
  it("names contacts from your side", () => {
    expect(contactText("venus", "saturn", "hard").title).toBe("Their Saturn in tension with your Venus");
    const t = contactText("saturn", "moon", "conjunction", "Sam");
    expect(t.title).toBe("Sam’s Moon on your Saturn");
    expect(t.body).toMatch(/^Your Saturn steadies, tests or holds back Sam’s emotional needs\./);
    expect(t.tone).toBe("hard");
  });

  it("splits contacts into strengths and friction", () => {
    const r = coupleReport(chartFor(me), chartFor(born("1988-03-10", "09:15")), "Sam");
    expect(r.strengths.length + r.friction.length).toBeGreaterThan(2);
    expect(r.overlays).toHaveLength(8);
    const noTime = coupleReport(chartFor(me), chartFor(born("1988-03-10")), "Sam");
    expect(noTime.overlays).toHaveLength(3);
    expect(noTime.notes[0]).toMatch(/Sam’s birth time is unknown/);
  });
});

describe("triggers", () => {
  // 1990-06-15 14:30 London has Mars square Uranus and Venus opposite Pluto (see the own-pattern reading).
  const you = chartFor(me);

  it("reads each person alone and finds what the other sets off", () => {
    const own = difficultAspects(you, chartFor(born("1988-03-10")), null, "Sam");
    expect(own.map((a) => a.key).sort()).toEqual(aspectKeys(you));
    for (const a of own) {
      expect(a.body).toMatch(/\byou\b/i);
      for (const t of a.triggers) {
        expect(t.title).toMatch(/^Sam’s \w+( \w+)? (on|opposite|square) your (Venus|Pluto|Mars|Uranus|Moon|Sun|Saturn|Neptune|Jupiter)$/);
        expect(t.orb).toBeLessThanOrEqual(4);
        expect(t.by).not.toBe("moon"); // Sam's birth time is unknown
        expect(["uranus", "neptune", "pluto"].includes(t.by) && ["uranus", "neptune", "pluto"].includes(t.end)).toBe(false);
      }
    }
    // Triggered aspects come first.
    const flags = own.map((a) => a.triggers.length > 0);
    expect(flags).toEqual([...flags].sort((p, q) => Number(q) - Number(p)));
  });

  it("someone born with a planet on one end of the aspect sets it off; the wording flips for the other person", () => {
    // A person whose own chart is yours has every planet on yours.
    const twin = difficultAspects(you, you, null, "Twin");
    expect(twin.every((a) => a.triggers.length >= 1)).toBe(true);
    const theirs = difficultAspects(you, you, "Twin", null);
    expect(theirs[0]!.body).toMatch(/^(They|What they) /);
    expect(theirs[0]!.triggers[0]!.title).toMatch(/^Your \w+( \w+)? on Twin’s /);
    expect(natalContactKeys(you, you).filter((k) => k.startsWith("trigger|")).sort()).toEqual(aspectKeys(you).map((k) => `trigger|${k}`));
  });

  it("counts as a signature across partners", () => {
    const keys = [...signaturesOf(you, { chart: you, hasTime: true })].filter((k) => k.startsWith("trigger|"));
    expect(keys.sort()).toEqual(aspectKeys(you).map((k) => `trigger|${k}`));
  });
});

describe("eased by and brought out", () => {
  const you = chartFor(me);
  const easy = aspectsOf(you).filter((a) => !a.hard).map((a) => a.key).sort();

  it("a twin chart brings out every strength, and the wording flips for the other person", () => {
    const mine = gifts(you, you, null, "Twin");
    expect(mine.map((g) => g.key).sort()).toEqual(easy);
    expect(mine.every((g) => g.broughtOut.length >= 1)).toBe(true);
    expect(mine[0]!.broughtOut[0]!.body).toMatch(/^It is brought out by Twin’s .*\.$/);
    const theirs = gifts(you, you, "Twin", null);
    expect(theirs[0]!.body).toMatch(/they|them/i);
    expect(theirs[0]!.broughtOut[0]!.title).toMatch(/^Your .* Twin’s /);
  });

  it("easing uses trines and sextiles only, and never slow planet to slow planet", () => {
    let seen = 0;
    for (let d = 1; d <= 28; d++) {
      const other = chartFor(born(`1989-02-${String(d).padStart(2, "0")}`));
      for (const a of difficultAspects(you, other, null, "Sam"))
        for (const t of a.eased) {
          seen++;
          expect(t.title).toMatch(/ (trine|sextile) your /);
          expect(t.body).toMatch(/^It is eased by Sam’s /);
          expect(t.orb).toBeLessThanOrEqual(3);
          expect(["jupiter", "saturn", "uranus", "neptune", "pluto", "node"].includes(t.by) && ["jupiter", "saturn", "uranus", "neptune", "pluto"].includes(t.end)).toBe(false);
        }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("feeds the pattern across partners", () => {
    const keys = natalContactKeys(you, you);
    expect(keys.filter((k) => k.startsWith("gift|")).sort()).toEqual(easy.map((k) => `gift|${k}`));
  });
});

describe("elements", () => {
  it("weighs the personal points and leaves out the generational planets", () => {
    // Sun Gemini, Moon Pisces, Venus Taurus, Mars Aries, Rising Libra.
    const b = elementBalance(chartFor(me));
    expect(Object.values(b.shares).reduce((a, c) => a + c, 0)).toBeCloseTo(1);
    expect(b.points.air).toEqual(expect.arrayContaining(["Sun", "Rising"]));
    expect(b.points.water).toContain("Moon");
    expect(Object.values(b.points).flat()).not.toContain("Pluto");
    expect(b.strong).toContain("air");
    const noTime = elementBalance(chartFor(born("1990-06-15")));
    expect(Object.values(noTime.points).flat()).not.toContain("Rising");
    expect(elementReading(chartFor(me)).insights[0]!.title).toMatch(/^Strong /);
  });

  it("fire feeds air and earth feeds water; other mixes are at cross purposes", () => {
    expect(relationOf("fire", "air")).toBe("compatible");
    expect(relationOf("water", "earth")).toBe("compatible");
    expect(relationOf("fire", "fire")).toBe("same");
    for (const [a, b] of [["fire", "water"], ["fire", "earth"], ["air", "water"], ["air", "earth"]] as const) expect(relationOf(a, b)).toBe("discordant");
  });

  it("compares two people: Sun and Moon first, then planet by planet", () => {
    const a = attunement(chartFor(me), chartFor(born("1988-03-10", "09:15")), "Sam");
    expect(a.lights).toHaveLength(4);
    expect(a.lights[0]!.title).toBe("Sun With Sun: Air With Water"); // Gemini Sun, Pisces Sun
    expect(a.lights[0]!.relation).toBe("discordant");
    expect(a.lights[1]!.title).toMatch(/^Your Sun, Sam’s Moon: /);
    expect(a.levels).toHaveLength(4);
    expect(a.attraction).toMatch(/on \d of 4 links, and theirs with yours on \d of 4/);
    const twin = attunement(chartFor(me), chartFor(me), "Twin");
    expect(twin.levels.every((l) => l.relation === "same")).toBe(true);
    expect(twin.lights[0]!.body).toMatch(/share the sign itself/);
    // Without their birth time there is no rising sign to compare.
    expect(attunement(chartFor(me), chartFor(born("1988-03-12")), "Sam").levels.length).toBeLessThan(4);
  });

  it("gives the Sun, Mars and the chart ruler their weight, and reads inner pulls", () => {
    // Libra rising: Venus rules the chart and is in Taurus, so earth is accented whatever else is there.
    const b = elementBalance(chartFor(me));
    expect(b.accented).toEqual({ element: "earth", ruler: "venus" });
    expect(b.strong).toEqual(expect.arrayContaining(["air", "earth"]));
    expect(b.points.earth.join(" ")).toMatch(/Venus \(rules your rising sign\)/);
    expect(b.points.air.join(" ")).toMatch(/Mercury \(rules your Sun sign\)/);
    const titles = elementReading(chartFor(me)).insights.map((i) => i.title);
    expect(titles).toContain("Sun And Moon In Different Worlds"); // Gemini Sun (air), Pisces Moon (water)
    expect(titles).toContain("What You Like Against Who You Are"); // Taurus Venus (earth)
  });

  it("notes aspects whose signs are not in the usual elements", () => {
    expect(elementNote("square", 15, 105)).toBe(""); // Aries–Cancer: fire and water, as a square normally is
    expect(elementNote("square", 28, 122)).toMatch(/Aries and Leo, are in the same element, so this square is much less intense/); // out-of-sign square
    expect(elementNote("trine", 29, 151)).toMatch(/Aries and Virgo.*less easy and more dynamic/);
    expect(elementNote("conjunction", 29, 31)).toMatch(/different signs, Aries and Taurus/);
    expect(elementNote("opposition", 10, 190)).toBe("");
  });

  it("names contacts between two charts by their exact aspect, without the natal-chart definitions", () => {
    const r = coupleReport(chartFor(me), chartFor(born("1988-03-10", "09:15")), "Sam");
    for (const i of [...r.strengths, ...r.friction]) {
      expect(i.title).toMatch(/ (conjunct|opposite|square|trine|sextile) your /);
      expect(i.body).not.toMatch(/A (square|trine|sextile) is|An opposition is|A conjunction is/);
    }
  });
});

describe("aspects within one chart", () => {
  const a = aspectsOf(chartFor(me));
  it("marks each aspect close or wide and says what its kind adds", () => {
    const pluto = a.find((x) => x.key === "venus-pluto")!; // Venus opposite Pluto, 3.5°
    expect(pluto.tight).toBe(true);
    expect(pluto.you).toMatch(/As an opposition, .* meet your Pluto in the people you are with/);
    expect(pluto.them).toMatch(/they tend to meet their Pluto in a partner/);
    const square = a.find((x) => x.label.includes(" square ") && x.hard)!;
    expect(square.you).toMatch(/As a square it comes with self-doubt/);
    expect(a.some((x) => !x.tight)).toBe(true);
  });
  it("allows the Sun and Moon two degrees more", () => {
    const wide = a.filter((x) => x.orb > 8 || (x.label.includes("sextile") && x.orb > 4));
    for (const x of wide) expect(x.label).toMatch(/Sun|Moon/);
  });
});

describe("composite chart", () => {
  const a = chartFor(me), b = chartFor(born("1988-03-10", "09:15"));
  const houses = { cusps: Array.from({ length: 12 }, (_, i) => i * 30), asc: 0, mc: 270 };
  it("reads the Sun and Moon by house first, then their aspects, then signs", () => {
    const c = readComposite(a, b, houses);
    expect(c.core.map((i) => i.title)).toEqual(expect.arrayContaining(["What This Relationship Is For", "Where You Feel Most In Common"]));
    expect(c.core.find((i) => i.title.startsWith("What This"))!.basis).toMatch(/^Composite Sun in the \d+(st|nd|rd|th) house$/);
    expect(c.signs).toHaveLength(2);
    for (const i of [...c.easy, ...c.hard]) expect(i.basis).toMatch(/^Composite (Sun|Moon) (conjunction|opposition|square|trine|sextile) /);
    expect(c.points.asc).toBe(0);
  });
  it("without both birth times there are no houses and no Moon", () => {
    const c = readComposite(a, chartFor(born("1988-03-10")), null);
    expect(c.core).toHaveLength(0);
    expect(c.signs).toHaveLength(1);
    expect(c.points.moon).toBeNull();
    expect(c.notes.join(" ")).toMatch(/both birth times/);
  });
  it("a chart with itself puts every planet where it was and flags nothing", () => {
    const c = readComposite(a, a, a.houses);
    expect(c.points.sun).toBeCloseTo(a.bodies.sun.lon);
    expect(c.notes).toHaveLength(0);
  });
  it("reads a composite Sun–Venus opposition as a conjunction", () => {
    const flip = { ...b, bodies: { ...b.bodies, sun: { lon: (a.bodies.sun.lon + 10) % 360, speed: 1 }, venus: { lon: (a.bodies.venus.lon + 176) % 360, speed: 1 } } };
    const c = readComposite(a, flip, null);
    expect(Math.abs(((c.points.venus - c.points.sun + 540) % 360) - 180)).toBeLessThanOrEqual(90);
  });
});

describe("timing", () => {
  it("lists dated windows in order", () => {
    const w = ownTiming(chartFor(me));
    expect(w.length).toBeGreaterThan(0);
    for (const x of w) {
      expect(x.start <= x.peak && x.peak <= x.end).toBe(true);
      expect(x.basis).toMatch(/^(Jupiter|Saturn|Uranus|Neptune|Pluto) /);
    }
    expect([...w].sort((a, b) => a.start.localeCompare(b.start)).map((x) => x.start)).toEqual(w.map((x) => x.start));
  });
});
