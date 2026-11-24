import "server-only";
import { cache } from "react";
import type { Chart } from "@/lib/astro/types";
import { SIGNS, signIndex } from "@/lib/astro/zodiac";
import type { Person } from "@/lib/people";
import { patternAcross, plainFacts, type ExPattern } from "@/lib/reading/exes";
import { eclipticToRA, midpoint } from "@/lib/astro/spherical";
import { chartFor } from "./charts";
import { housesFromRamc } from "./swiss";
import { listPeople } from "./people";
import { referenceSignatures, seeded } from "./reference";
import { transitWindows, type Target } from "./timing";

export interface Context {
  self: (Person & { chart: Chart }) | null;
  exes: (Person & { chart: Chart })[];
  matches: (Person & { chart: Chart })[];
}

/** Everyone a member has saved, with charts. Cached per request. */
export const loadContext = cache(async (userId: string): Promise<Context> => {
  const people = (await listPeople(userId)).map((p) => ({ ...p, chart: chartFor(p.birth) }));
  return { self: people.find((p) => p.kind === "self") ?? null, exes: people.filter((p) => p.kind === "ex"), matches: people.filter((p) => p.kind === "match") };
});

/** The pattern across a member's past partners (needs at least two). */
export function exPattern(userId: string, ctx: Context): (ExPattern & { facts: string[] }) | null {
  if (!ctx.self || ctx.exes.length < 2) return null;
  const years = ctx.exes.map((e) => Number(e.birth.date.slice(0, 4)));
  const random = seeded(userId);
  const reference = referenceSignatures(ctx.self.chart, Math.min(...years) - 2, Math.max(...years) + 2, random);
  const pattern = patternAcross(ctx.self.chart, ctx.exes.map((e) => ({ name: e.name, chart: e.chart, hasTime: !!e.birth.time })), reference, random);
  const facts = plainFacts(ctx.self.birth.date, ctx.exes.map((e) => ({ name: e.name, birthDate: e.birth.date, startYear: e.startYear, endYear: e.endYear, ending: e.ending })));
  return { ...pattern, facts };
}

/** The points in your chart that relationship timing is read from. */
export function relationshipTargets(chart: Chart): Target[] {
  const out: Target[] = [{ id: "venus", lon: chart.bodies.venus.lon }];
  if (chart.houses) {
    out.push({ id: "axis", lon: chart.houses.asc });
    const ruler = SIGNS[signIndex(chart.houses.asc + 180)]!.ruler;
    // Venus is already listed; the Moon moves too fast to be a ruler worth timing only when the time is unknown, and here it is known.
    if (ruler !== "venus") out.push({ id: "ruler", lon: chart.bodies[ruler].lon });
    out.push({ id: "moon", lon: chart.bodies.moon.lon });
  }
  out.push({ id: "mars", lon: chart.bodies.mars.lon });
  return out;
}

export const ownTiming = (chart: Chart) => transitWindows(relationshipTargets(chart));

/**
 * Houses of the composite chart: cast from the midpoint of the two Midheavens (Hand, ch. 1).
 * Hand uses the latitude of the place the couple lives; we do not ask for that, so the mean of
 * the two birth latitudes stands in. Null unless both birth times are known.
 */
export function compositeHouses(a: Person & { chart: Chart }, b: Person & { chart: Chart }) {
  if (!a.chart.houses || !b.chart.houses) return null;
  const EPS = 23.44;
  return housesFromRamc(eclipticToRA(midpoint(a.chart.houses.mc, b.chart.houses.mc), EPS), (a.birth.lat + b.birth.lat) / 2, EPS);
}
