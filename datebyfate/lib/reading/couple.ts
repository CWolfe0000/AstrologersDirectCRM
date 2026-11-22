import type { BodyId, Chart, PointId } from "@/lib/astro/types";
import { BODIES } from "@/lib/astro/types";
import { midpoint } from "@/lib/astro/spherical";
import { POINT_NAMES, SIGNS, SYNASTRY_ORBS, aspectBetween, houseOf, ordinal, signIndex, type AspectName } from "@/lib/astro/zodiac";
import { ASPECT_DEFINITION, elementNote } from "./elements";
import type { Insight } from "./own";
import { HOUSE_AREA, SIGN_QUALITY, contactText } from "./text";

type Ranked = Insight & { rank: number; aspect: AspectName };

export interface CoupleReport {
  strengths: Insight[];
  friction: Insight[];
  /** Where each person's planets fall in the other's houses. */
  overlays: Insight[];
  /** The relationship's own chart (midpoint composite). */
  composite: Insight[];
  /** Composite longitudes, for timing. */
  compositePoints: { sun: number; moon: number | null; venus: number };
  notes: string[];
}

const WORD = { conjunction: "conjunct", opposition: "opposite", square: "square", trine: "trine", sextile: "sextile" } as const;
const SLOW = new Set<PointId>(["jupiter", "saturn", "uranus", "neptune", "pluto", "node"]);
/** Contacts worth reading first. */
const KEY_POINTS = new Set<PointId>(["sun", "moon", "venus", "mars", "asc"]);

/** Two charts read together: synastry and the composite. `you` is the member, `them` the other person. */
export function coupleReport(you: Chart, them: Chart, name: string): CoupleReport {
  const notes: string[] = [];
  const points = (c: Chart): [PointId, number][] => {
    const out: [PointId, number][] = BODIES.filter((id) => id !== "moon" || c.houses).map((id) => [id, c.bodies[id].lon]);
    if (c.houses) out.push(["asc", c.houses.asc]);
    return out;
  };
  if (!you.houses || !them.houses) notes.push(`${!you.houses ? "Your" : `${name}’s`} birth time is unknown, so Moon contacts, rising signs and house positions are left out for that chart.`);

  const strengths: Ranked[] = [];
  const friction: Ranked[] = [];
  for (const [yid, ylon] of points(you))
    for (const [tid, tlon] of points(them)) {
      if (SLOW.has(yid) && SLOW.has(tid)) continue;
      if (!KEY_POINTS.has(yid) && !KEY_POINTS.has(tid)) continue;
      const asp = aspectBetween(ylon, tlon, SYNASTRY_ORBS);
      if (!asp) continue;
      const { tone, curated, ...text } = contactText(yid, tid, asp.cls, name, { word: WORD[asp.name], definition: "", elementNote: elementNote(asp.name, ylon, tlon) });
      const both = KEY_POINTS.has(yid) && KEY_POINTS.has(tid);
      (tone === "hard" ? friction : strengths).push({ ...text, basis: `${asp.name}, ${asp.orb.toFixed(1)}° from exact`, rank: asp.orb + (curated ? 0 : 3) + (both ? 0 : 1), aspect: asp.name });
    }
  // Each kind of aspect is defined once per list, on the first card that has it.
  const top = (xs: Ranked[]) => {
    const defined = new Set<AspectName>();
    return xs.sort((a, b) => a.rank - b.rank).slice(0, 5).map(({ title, body, basis, aspect }) => {
      const first = !defined.has(aspect);
      defined.add(aspect);
      return { title, body: first ? `${body} ${ASPECT_DEFINITION[aspect]}` : body, basis };
    });
  };

  const overlays: Insight[] = [];
  const lay = (owner: Chart, into: Chart, ownerLabel: string, intoLabel: string) => {
    if (!into.houses) return;
    for (const id of ["sun", "moon", "venus", "mars"] as BodyId[]) {
      if (id === "moon" && !owner.houses) continue;
      const n = houseOf(owner.bodies[id].lon, into.houses.cusps);
      overlays.push({ title: `${ownerLabel} ${POINT_NAMES[id]} in ${intoLabel} ${ordinal(n)} house`, body: `Felt most in ${intoLabel === "your" ? "your" : "their"} ${HOUSE_AREA[n - 1]!.replace(/^the /, "")}.`, basis: "House overlay" });
    }
  };
  lay(them, you, `${name}’s`, "your");
  lay(you, them, "Your", `${name}’s`);

  const mid = (id: BodyId) => midpoint(you.bodies[id].lon, them.bodies[id].lon);
  const moonOk = !!you.houses && !!them.houses;
  const compositePoints = { sun: mid("sun"), moon: moonOk ? mid("moon") : null, venus: mid("venus") };
  const line = (label: string, lon: number, lead: string): Insight => {
    const [like, needs] = SIGN_QUALITY[signIndex(lon)]!;
    return { title: `${label} in ${SIGNS[signIndex(lon)]!.name}`, body: `${lead} ${like}. It does best with ${needs}.`, basis: `Composite ${label}` };
  };
  const composite = [line("Sun", compositePoints.sun, "As a pair, you come across as")];
  if (compositePoints.moon !== null) composite.push(line("Moon", compositePoints.moon, "The emotional climate between you is"));
  composite.push(line("Venus", compositePoints.venus, "The way you show affection as a couple is"));

  return { strengths: top(strengths), friction: top(friction), overlays, composite, compositePoints, notes };
}
