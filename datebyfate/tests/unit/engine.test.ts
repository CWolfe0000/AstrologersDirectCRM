import { describe, expect, it } from "vitest";
import type { Birth } from "@/lib/astro/types";
import { signName } from "@/lib/astro/zodiac";
import { binomialTail, checkAgainst, patternAcross, plainFacts, signaturesOf } from "@/lib/reading/exes";
import { coupleReport } from "@/lib/reading/couple";
import { ownPattern } from "@/lib/reading/own";
import { contactText } from "@/lib/reading/text";
import { chartFor } from "@/lib/server/charts";
import { referenceSignatures, seeded } from "@/lib/server/reference";
import { ownTiming } from "@/lib/server/readings";

const london = { place: "London", lat: 51.5074, lon: -0.1278, tz: "Europe/London" };
const me: Birth = { date: "1990-06-15", time: "14:30", ...london };
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
    expect(r.composite).toHaveLength(3);
    const noTime = coupleReport(chartFor(me), chartFor(born("1988-03-10")), "Sam");
    expect(noTime.overlays).toHaveLength(3);
    expect(noTime.composite).toHaveLength(2);
    expect(noTime.notes[0]).toMatch(/Sam’s birth time is unknown/);
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
