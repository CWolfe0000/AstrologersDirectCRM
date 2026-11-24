import { describe, expect, it } from "vitest";
import type { Birth } from "@/lib/astro/types";
import { signName } from "@/lib/astro/zodiac";
import { binomialTail, checkAgainst, patternAcross, plainFacts, signaturesOf } from "@/lib/reading/exes";
import { attunement, elementBalance, elementNote, elementReading, relationOf } from "@/lib/reading/elements";
import * as hoursLib from "@/lib/reading/hours";
import { DISCLAIMER, KIND_LABEL, USES } from "@/lib/reading/hour-uses";
import { practicesFor } from "@/lib/reading/practice";
import { composite as readComposite } from "@/lib/reading/composite";
import { C_PATTERNS } from "@/lib/reading/composite-love";
import { coupleReport } from "@/lib/reading/couple";
import { aspectsTo } from "@/lib/reading/context";
import { HOUSE_LOVE, MARS_LOVE, MOON_LOVE, RISING_LOVE, SUN_LOVE, VENUS_LOVE } from "@/lib/reading/natal-love";
import { aspectsOf, ownPattern } from "@/lib/reading/own";
import { stelliumBetween, stelliumOf } from "@/lib/reading/stellium";
import { synastryText } from "@/lib/reading/synastry";
import { contactText } from "@/lib/reading/text";
import { difficultAspects, gifts, natalContactKeys } from "@/lib/reading/triggers";
import { chartFor } from "@/lib/server/charts";
import { referenceSignatures, seeded } from "@/lib/server/reference";
import { ownTiming } from "@/lib/server/readings";
import * as moments from "@/lib/server/moments";
import * as timing from "@/lib/server/timing";

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
    expect(p.core.map((i) => i.title)).toEqual(["Who You Are In Love", "What Your Heart Needs", "How You Come Across", "How You Love", "What You Go After"]);
    expect(p.arc.every((a) => a.house >= 4 && a.house <= 8 && a.items.length > 0)).toBe(true);
    expect(p.arc.flatMap((a) => a.items).some((i) => i.basis.includes("8th house"))).toBe(true); // Venus in the 8th
    expect(p.drawnTo[0]!.basis).toBe("Descendant in Aries");
    expect(p.headline.name.length).toBeGreaterThan(3);
    expect(p.notes).toHaveLength(0);
  });

  it("explains what is missing without a birth time", () => {
    const p = ownPattern(chartFor(born("1990-06-15")));
    expect(p.drawnTo).toHaveLength(0);
    expect(p.arc).toHaveLength(0);
    expect(p.core.map((i) => i.title)).not.toContain("How You Come Across");
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

  it("summarises ages, lengths, pace, gaps and what came of each relationship", () => {
    const facts = plainFacts("1990-06-15", [
      { name: "A", birthDate: "1986-01-01", metDate: "2012-01-10", startDate: "2012-02-01", endDate: "2014-02-01", ending: "them", stayedFriends: true, livedTogether: false, married: false, children: false },
      { name: "B", birthDate: "1988-03-01", metDate: "2015-03-01", startDate: "2015-03-20", endDate: "2017-06-20", ending: "them", stayedFriends: false, livedTogether: true, married: false, children: false },
      { name: "C", birthDate: "1984-07-01", metDate: "2017-05-01", startDate: "2018-01-15", endDate: "2021-01-15", ending: "me", stayedFriends: true, livedTogether: true, married: true, children: true },
    ]);
    expect(facts[0]).toBe("Every partner was older than you, by 2 to 6 years.");
    expect(facts).toContain("Your relationships have lasted about 2.5 years each.");
    expect(facts).toContain("2 of 3 began within a month of meeting.");
    expect(facts.some((f) => /^Between relationships you have had from /.test(f))).toBe(true);
    expect(facts).toContain("They ended 2 of 3.");
    expect(facts).toContain("You lived with 2 of 3.");
    expect(facts).toContain("You married 1 of 3.");
    expect(facts).toContain("You had children with 1 of 3.");
    expect(facts).toContain("You stayed friends with 2 of 3.");
    // Records saved before full dates were asked for still work.
    expect(plainFacts("1990-06-15", [{ name: "A", birthDate: "1986-01-01", startYear: 2012, endYear: 2014 }, { name: "B", birthDate: "1988-03-01", startYear: 2015, endYear: 2017 }])[1]).toMatch(/about 2 years each/);
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

  it("sorts contacts into fusions, flowing and challenging, and groups house overlays", () => {
    const r = coupleReport(chartFor(me), chartFor(born("1988-03-10", "09:15")), "Sam");
    expect(r.fusions.length + r.flowing.length + r.challenging.length).toBeGreaterThan(4);
    for (const i of r.fusions) expect(i.title).toMatch(/ conjunct your /);
    for (const i of r.flowing) expect(i.title).toMatch(/ (trine|sextile) your /);
    for (const i of r.challenging) expect(i.title).toMatch(/ (square|opposite) your /);
    for (const i of [...r.fusions, ...r.flowing, ...r.challenging]) {
      expect(i.body).not.toMatch(/[{}]/);
      expect(i.title).not.toMatch(/Node/);
    }
    expect(r.bedrock).toMatch(/Sun, Moon and rising signs/);
    expect(r.overlays.every((o) => /in (your|Sam’s) \d+(st|nd|rd|th) house$/.test(o.title))).toBe(true);
    const noTime = coupleReport(chartFor(me), chartFor(born("1988-03-10")), "Sam");
    expect(noTime.overlays.every((o) => !o.title.includes("in Sam’s"))).toBe(true);
    expect(noTime.notes[0]).toMatch(/Sam’s birth time is unknown/);
  });

  it("words a contact both ways round, from whichever side holds the first planet", () => {
    const a = synastryText("moon", "saturn", "challenging", "Sam").body; // your Moon, Sam's Saturn
    expect(a).toMatch(/^Two languages\. Sam’s Saturn offers sound advice when your Moon needs kindness/);
    const b = synastryText("saturn", "moon", "challenging", "Sam").body; // your Saturn, Sam's Moon
    expect(b).toMatch(/Your Saturn offers sound advice when Sam’s Moon needs kindness/);
    expect(synastryText("venus", "mars", "conjunction", "Sam").body).toMatch(/As a conjunction the two fuse/);
    const generic = synastryText("mercury", "pluto", "flowing", null);
    expect(generic.sourced).toBe(false);
    expect(generic.body).toMatch(/^Your Mercury can inform and stimulate their Pluto, or fluster or talk over it\. In turn their Pluto can/);
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
    // Venus in Taurus (earth) against a Gemini Sun (air), but Venus rules this chart (Libra rising): it is part of who they are.
    expect(titles).toContain("Two Sides Of You");
    expect(titles).not.toContain("What You Like Against Who You Are");
    const noTime = elementReading(chartFor(born("1990-06-15"))).insights.map((i) => i.title);
    expect(noTime).toContain("What You Like Against Who You Are"); // no rising sign known, so no chart ruler
  });

  it("notes aspects whose signs are not in the usual elements", () => {
    expect(elementNote("square", 15, 105)).toBe(""); // Aries–Cancer: fire and water, as a square normally is
    expect(elementNote("square", 28, 122)).toMatch(/Aries and Leo, are in the same element, so this square is much less intense/); // out-of-sign square
    expect(elementNote("trine", 29, 151)).toMatch(/Aries and Virgo.*less easy and more dynamic/);
    expect(elementNote("conjunction", 29, 31)).toMatch(/different signs, Aries and Taurus/);
    expect(elementNote("opposition", 10, 190)).toBe("");
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
  it("reads the nodes, Sun, Moon, rising sign, Venus, Mars and Saturn by sign and house", () => {
    const c = readComposite(a, b, houses, "Sam");
    expect(c.sections.map((x) => x.title)).toEqual(["The story between you", "What keeps you alive", "What your hearts need", "How you come across", "Affection and desire", "Where the work is"]);
    expect(c.sections[1]!.items.map((i) => i.title)).toEqual([expect.stringMatching(/^Sun In [A-Z]/), expect.stringMatching(/^Sun In The \d+(st|nd|rd|th) House$/)]);
    expect(c.sections[4]!.items).toHaveLength(4);
    expect(c.others).toHaveLength(5);
    for (const sec of c.sections) for (const i of sec.items) expect(i.body.length).toBeGreaterThan(40);
    for (const i of [...c.sections.flatMap((x) => x.items).filter((x) => !/^Centred On/.test(x.title)), ...c.others]) expect(i.expressions!.length).toBeGreaterThanOrEqual(3);
    for (const i of [...c.easy, ...c.hard]) expect(i.basis).toMatch(/^Composite (Sun|Moon) (conjunction|opposition|square|trine|sextile) /);
    expect(c.pattern).toBeTruthy();
    expect(c.pattern).not.toMatch(/[{}]/);
    expect(c.notes.join(" ")).toMatch(/Add where you first met, on Sam’s details/);
    expect(readComposite(a, b, { ...houses, located: true }, "Sam").notes).toHaveLength(0);
  });
  it("without both birth times there are no houses, rising sign or Moon", () => {
    const c = readComposite(a, chartFor(born("1988-03-10")), null, "Sam");
    expect(c.sections.map((x) => x.title)).toEqual(["The story between you", "What keeps you alive", "Affection and desire"]);
    expect(c.sections.flatMap((x) => x.items).every((i) => !/House$/.test(i.title))).toBe(true);
    expect(c.others).toHaveLength(0);
    expect(c.points.moon).toBeNull();
    expect(c.notes.join(" ")).toMatch(/both birth times/);
  });
  it("a chart with itself puts every planet where it was and resembles both people", () => {
    const c = readComposite(a, a, a.houses, "Twin");
    expect(c.points.sun).toBeCloseTo(a.bodies.sun.lon);
    expect(c.sections[1]!.items[0]!.title).toBe("Sun In Gemini");
    expect(c.pattern).toBe(C_PATTERNS.shared);
  });
  it("uses the shorter-arc midpoint with no exception for Venus", () => {
    const flip = { ...b, bodies: { ...b.bodies, sun: { lon: (a.bodies.sun.lon + 10) % 360, speed: 1 }, venus: { lon: (a.bodies.venus.lon + 176) % 360, speed: 1 } } };
    const c = readComposite(a, flip, null, "Sam");
    expect(Math.abs(((c.points.venus - a.bodies.venus.lon + 540) % 360) - 180)).toBeCloseTo(88, 0);
  });
});

describe("timing", () => {
  it("lists dated windows in order", () => {
    const w = ownTiming(chartFor(me));
    expect(w.length).toBeGreaterThan(0);
    for (const x of w) {
      expect(x.start <= x.peak && x.peak <= x.end).toBe(true);
      expect(x.basis).toMatch(/^(Jupiter|Saturn|Uranus|Neptune|Pluto) /);
      expect(x.body).not.toContain("{F}");
      expect(x.trap.length).toBeGreaterThan(20);
      for (const p of x.passes) expect(p.date >= x.start && p.date <= x.end).toBe(true);
    }
    expect([...w].sort((a, b) => a.start.localeCompare(b.start)).map((x) => x.start)).toEqual(w.map((x) => x.start));
  });
});

describe("planetary hours", () => {
  const { planetaryDayAt, nextHours, CHALDEAN } = hoursLib;
  // Wednesday 24 June 2026, London, midday.
  const noon = Date.UTC(2026, 5, 24, 11, 0);
  const day = planetaryDayAt(noon, 51.5074, -0.1278, "Europe/London")!;

  it("finds sunrise and sunset to within a few minutes", () => {
    // London, 24 June 2026: sunrise about 04:44 BST (03:44 UT), sunset about 21:22 BST (20:22 UT).
    expect(Math.abs(day.sunrise - Date.UTC(2026, 5, 24, 3, 44)) / 60_000).toBeLessThan(4);
    expect(Math.abs(day.sunset - Date.UTC(2026, 5, 24, 20, 22)) / 60_000).toBeLessThan(4);
  });

  it("gives the day to the weekday's planet and runs the Chaldean order without a break", () => {
    expect(day.weekday).toBe("Wednesday");
    expect(day.ruler).toBe("mercury");
    expect(day.hours).toHaveLength(24);
    expect(day.hours[0]!.planet).toBe("mercury");
    // The day ruler holds day hours 1 and 8 and night hours 3 and 10; Wednesday's first night hour is the Sun's.
    expect(day.hours.map((h, i) => (h.planet === "mercury" ? i : -1)).filter((i) => i >= 0)).toEqual([0, 7, 14, 21]);
    expect(day.hours[12]!.planet).toBe("sun");
    day.hours.forEach((h, i) => expect(h.planet).toBe(CHALDEAN[(CHALDEAN.indexOf("mercury") + i) % 7]));
    // Contiguous, and the 25th hour would open Thursday with Jupiter.
    day.hours.slice(1).forEach((h, i) => expect(h.start).toBeCloseTo(day.hours[i]!.end, -1));
    expect(CHALDEAN[(CHALDEAN.indexOf("mercury") + 24) % 7]).toBe("jupiter");
    // Summer: day hours are longer than night hours.
    expect(day.hours[0]!.end - day.hours[0]!.start).toBeGreaterThan(day.hours[12]!.end - day.hours[12]!.start);
  });

  it("before sunrise it is still the previous planetary day", () => {
    const early = planetaryDayAt(Date.UTC(2026, 5, 24, 1, 0), 51.5074, -0.1278, "Europe/London")!;
    expect(early.weekday).toBe("Tuesday");
    expect(early.ruler).toBe("mars");
  });

  it("finds the next Saturn hours on a Friday, and none where the Sun does not set", () => {
    const next = nextHours("saturn", "venus", noon, 51.5074, -0.1278, "Europe/London");
    expect(next).toHaveLength(2);
    for (const h of next) expect(new Date(h.start).getUTCDay() === 5 || new Date(h.start).getUTCDay() === 6).toBe(true);
    expect(planetaryDayAt(noon, 78.2, 15.6, "Arctic/Longyearbyen")).toBeNull(); // Svalbard, midnight sun
  });

  it("matches a practice to each difficult dynamic, classical planets only", () => {
    const list = practicesFor(chartFor(me));
    expect(list.length).toBe(aspectsOf(chartFor(me)).filter((a) => a.hard).length);
    const pluto = list.find((p) => p.key === "venus-pluto")!;
    expect(pluto.timings).toEqual([expect.objectContaining({ hour: "venus", day: "venus", label: "Venus Hour On Friday" })]);
    expect(pluto.body).toMatch(/no practice for Pluto/);
    for (const p of list) for (const t of p.timings) expect(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]).toContain(t.hour);
  });
});

describe("uses of the planetary hours", () => {
  it("covers all forty-nine pairings, including attraction, influence and wrath", () => {
    const all = hoursLib.CHALDEAN.flatMap((d) => hoursLib.CHALDEAN.map((h) => USES[d][h]));
    expect(all).toHaveLength(49);
    for (const [kind, text] of all) {
      expect(text.length).toBeGreaterThan(15);
      expect(KIND_LABEL[kind]).toBeTruthy();
    }
    expect(all.filter(([k]) => k === "wrath")).toHaveLength(7);
    expect(USES.moon.venus[0]).toBe("love");
    expect(USES.mercury.moon[1]).toMatch(/Persuasion/);
    expect(USES.saturn.venus[1]).toMatch(/curse/);
    expect(DISCLAIMER).toMatch(/no claim/);
  });
});

describe("calendar: one process per transit, houses and progressions", () => {
  const chart = chartFor(me);
  // A fixed moment so the test does not drift: 1 January 2026.
  const from = Date.UTC(2026, 0, 1);
  it("keeps the retrograde passes of one transit in one period and ranks the major ones", () => {
    const w = timing.transitWindows([{ id: "sun", lon: chart.bodies.sun.lon }, { id: "venus", lon: chart.bodies.venus.lon }, { id: "axis", lon: chart.houses!.asc }], from);
    expect(w.length).toBeGreaterThan(0);
    // No two periods of the same planet, point and aspect.
    expect(new Set(w.map((x) => x.basis)).size).toBeGreaterThanOrEqual(w.length - 1);
    expect(w.some((x) => x.passes.length >= 1)).toBe(true);
    for (const x of w) if (x.major) expect(x.planet).not.toBe("jupiter");
    // What a planet brings is said once per planet; each period carries only what is specific to it.
    for (const planet of new Set(w.map((x) => x.planet))) {
      const mine = w.filter((x) => x.planet === planet);
      expect(new Set(mine.map((x) => x.theme)).size).toBe(1);
      expect(new Set(mine.map((x) => x.body)).size).toBe(new Set(mine.map((x) => x.touches)).size); // one line per point and aspect
      for (const x of mine) expect(x.body).not.toContain(x.theme);
    }
  });
  it("finds slow planets in the houses of love, and the current progressed chapter", () => {
    for (const h of timing.houseTransits(chart, from)) expect(h.basis).toMatch(/in your (5th|7th|8th) house$/);
    expect(timing.houseTransits(chartFor(born("1990-06-15")), from)).toHaveLength(0);
    const p = timing.progressions(chart, from);
    expect(p.moon.map((i) => i.title)).toEqual(["Where Your Heart Is", "The Mood Of This Chapter"]);
    // 35.5 years after birth the progressed Moon has gone once round and about a third again.
    expect(p.moon[1]!.basis).toMatch(/^Progressed Moon in [A-Z]/);
    for (const v of p.venus) expect(v.basis).toMatch(/^Progressed Venus (conjunction|opposition|square|trine|sextile) natal /);
    expect(timing.progressions(chartFor(born("1990-06-15")), from).moon).toHaveLength(0);
  });
});

describe("stelliums", () => {
  // 21 May 1990: Sun, Mercury and (with the Moon at the new moon of the 24th nearby) personal planets gather in Taurus and Gemini.
  it("needs three personal planets in one sign", () => {
    expect(stelliumOf(chartFor(me))).toBeNull(); // Sun Gemini, Moon Pisces, Mercury Gemini, Venus Taurus, Mars Aries
    const dates = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(1990, 0, 1) + i * 86_400_000).toISOString().slice(0, 10));
    const withOne = dates.map((d) => chartFor(born(d, "12:00"))).find((c) => stelliumOf(c));
    expect(withOne).toBeTruthy();
    const s = stelliumOf(withOne!)!;
    expect(s.planets.length).toBeGreaterThanOrEqual(3);
    expect(ownPattern(withOne!).stellium!.title).toMatch(/^A Stellium In [A-Z]/);
    const between = stelliumBetween(withOne!, chartFor(me), "Sam", null)!;
    expect(between.title).toMatch(/^Sam’s Stellium In /);
    expect(between.body).toMatch(/falls in your \d+(st|nd|rd|th) house/);
    expect(between.body).toMatch(/You have (no personal planet|[A-Z])/);
  });
});

describe("calendar: life cycle and triggers", () => {
  it("finds a Saturn return near 29 and not otherwise", () => {
    const chart = chartFor(me); // born June 1990: first Saturn return around 2019–2020
    expect(timing.lifeCycle(chart, Date.UTC(2019, 6, 1)).map((c) => c.title)).toContain("Your Saturn Return");
    expect(timing.lifeCycle(chart, Date.UTC(2024, 0, 1)).map((c) => c.title)).not.toContain("Your Saturn Return");
  });
  it("lists trigger days only inside a slow period on the same point", () => {
    const chart = chartFor(me);
    const from = Date.UTC(2026, 0, 1);
    const targets = [{ id: "venus", lon: chart.bodies.venus.lon }, { id: "mars", lon: chart.bodies.mars.lon }, { id: "sun", lon: chart.bodies.sun.lon }];
    const windows = timing.transitWindows(targets, from);
    const days = timing.triggerDays(targets, windows, from);
    for (const t of days) {
      expect(t.title).toMatch(/^(Mars|Venus|Sun|Mercury) (conjunct|square|opposite) your (Venus|Mars|Sun)$/);
      expect(windows.some((w) => w.title === t.sets && w.start <= t.date && t.date <= w.end)).toBe(true);
    }
    expect(timing.triggerDays(targets, [], from)).toHaveLength(0);
  });
});

describe("progressed Ascendant", () => {
  it("is read against Venus when the birth latitude is given, and moves about a degree a year", () => {
    const chart = chartFor(me);
    // Find an age at which the progressed Ascendant reaches natal Venus by some aspect.
    const hits = Array.from({ length: 70 }, (_, age) => timing.progressions(chart, Date.parse(chart.utc) + age * 365.2422 * 86_400_000, 51.5074).venus.filter((v) => v.basis.startsWith("Progressed Ascendant")));
    expect(hits.some((h) => h.length > 0)).toBe(true);
    expect(hits.filter((h) => h.length > 0).length).toBeLessThan(25);
    expect(timing.progressions(chart, Date.UTC(2026, 0, 1)).venus.every((v) => !v.basis.startsWith("Progressed Ascendant"))).toBe(true);
  });
});

describe("placements are weighed by their aspects", () => {
  // A chart like the owner's test case: Aries rising, Mars in Gemini ruling the chart, Sun and Venus in Pisces,
  // Pluto in Scorpio in the 7th making only trines.
  const lon = (sign: number, deg: number) => sign * 30 + deg;
  const body = (l: number) => ({ lon: l, speed: 1 });
  const chart = {
    utc: "1990-03-10T06:00:00.000Z",
    moonSignCertain: true,
    houses: { cusps: Array.from({ length: 12 }, (_, i) => lon(i, 10)), asc: lon(0, 10), mc: lon(9, 10) },
    bodies: {
      sun: body(lon(11, 7)), moon: body(lon(3, 6)), mercury: body(lon(10, 25)), venus: body(lon(11, 5)), mars: body(lon(2, 20)),
      jupiter: body(lon(3, 22)), saturn: body(lon(9, 24)), uranus: body(lon(9, 9)), neptune: body(lon(9, 14)), pluto: body(lon(7, 5)), node: body(lon(10, 12)),
    },
  } as Parameters<typeof ownPattern>[0];
  const p = ownPattern(chart);
  const card = (title: string) => [...p.core, ...p.arc.flatMap((a) => a.items)].find((i) => i.title === title)!;

  it("a well-aspected Pluto in the 7th is not told it has a trust problem", () => {
    const pluto = card("Pluto In Your 7th House");
    expect(pluto.basis).toMatch(/supported by trine Sun, trine Moon, trine Venus/);
    expect(pluto.basis).not.toMatch(/under pressure/);
    expect(pluto.lean).toMatch(/^In your chart this is supported \(trine Sun, trine Moon, trine Venus\), which favours the first expressions\.$/);
    expect(pluto.expressions!.length).toBeGreaterThanOrEqual(3);
    expect(aspectsTo(chart, "pluto")).toEqual({ hard: [], flowing: ["trine Sun", "trine Moon", "trine Venus"] });
  });

  it("the same Pluto under a square leans toward the harder expressions", () => {
    const squared = { ...chart, bodies: { ...chart.bodies, mars: body(lon(4, 5)) } }; // Mars in Leo, square Pluto
    const pluto = ownPattern(squared).arc.flatMap((a) => a.items).find((i) => i.title === "Pluto In Your 7th House")!;
    expect(pluto.basis).toMatch(/under pressure from square Mars/);
    expect(pluto.lean).toMatch(/both pressed \(square Mars\) and supported/);
    expect(pluto.expressions).toEqual(HOUSE_LOVE[7].planets.pluto.expressions); // every expression is shown either way
  });

  it("reads the rising sign through its ruler", () => {
    const rising = card("How You Come Across");
    expect(rising.body).toMatch(/Your chart ruler, Mars, is in Gemini, so this comes out through talk, wit and curiosity\./);
    expect(rising.basis).toMatch(/^Aries rising; Mars in Gemini, 3rd house/);
    expect(rising.body).not.toMatch(/dangerous|alarm/i);
  });

  it("does not set the chart ruler against who the person is", () => {
    const titles = elementReading(chart).insights.map((i) => i.title);
    expect(titles).toContain("Two Sides Of You");
    expect(titles).not.toContain("What Excites You Against Who You Are");
    expect(elementReading(chart).insights.find((i) => i.title === "Two Sides Of You")!.body).toMatch(/^Mars rules your chart, so its air way of going after what you want is as much who you are as your water Sun\./);
  });

  it("no reading in the library uses the rejected wording", () => {
    const all = [SUN_LOVE, MOON_LOVE, RISING_LOVE, VENUS_LOVE, MARS_LOVE].flat().concat(Object.values(HOUSE_LOVE).flatMap((h) => Object.values(h.planets)));
    expect(all).toHaveLength(120);
    for (const r of all) {
      expect(r.expressions.length).toBeGreaterThanOrEqual(3);
      expect(`${r.core} ${r.expressions.join(" ")}`).not.toMatch(/dangerous|alarm|intimidat/i);
    }
  });
});

describe("what was happening at the time", () => {
  const chart = chartFor(me);
  it("lists the factors in force on a date and words each one", () => {
    const keys = moments.momentKeys(chart, Date.UTC(2019, 6, 1));
    expect(keys.filter((k) => k.startsWith("house|"))).toHaveLength(5);
    expect(keys.some((k) => k.startsWith("pmoon-house|")) && keys.some((k) => k.startsWith("pmoon-sign|"))).toBe(true);
    for (const k of keys) {
      const d = moments.describeMoment(k);
      expect(d.title.length).toBeGreaterThan(8);
      expect(d.body).not.toMatch(/[{}]/);
    }
    expect(moments.momentReading(chart, "2019-07-01").every((i) => i.basis === "On 2019-07-01")).toBe(true);
    expect(moments.momentKeys(chartFor(born("1990-06-15")), Date.UTC(2019, 6, 1)).every((k) => k.startsWith("transit|"))).toBe(true);
  });
  it("finds a factor shared by dates close together and rates it against random days", () => {
    const r = moments.timingRepeats(chart, [{ name: "A", date: "2019-07-01" }, { name: "B", date: "2019-07-20" }, { name: "C", date: "2019-08-05" }], seeded("t"));
    expect(r.repeats.length).toBeGreaterThan(0);
    for (const x of r.repeats) {
      expect(x.count).toBeGreaterThanOrEqual(2);
      expect(x.chance).toBeLessThanOrEqual(0.1);
    }
    expect(moments.timingRepeats(chart, [{ name: "A", date: "2019-07-01" }], seeded("t")).repeats).toHaveLength(0);
  });
});
