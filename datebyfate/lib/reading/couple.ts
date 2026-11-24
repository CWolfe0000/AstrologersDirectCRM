import type { BodyId, Chart, PointId } from "@/lib/astro/types";
import { COUPLE_ORBS, POINT_NAMES, aspectBetween, houseOf, ordinal, signIndex } from "@/lib/astro/zodiac";
import { elementNote } from "./elements";
import type { Insight } from "./own";
import { HOUSE_OVERLAY, ORDER, TRIAD, kindOf, synastryText } from "./synastry";

/**
 * Two charts read together, following Steven and Jodie Forrest, "Skymates, Volume 1": first how
 * the Sun, Moon and Ascendant of the two people connect, then the contacts between the charts
 * (strongest first: the Sun, Moon and Ascendant, then Venus and Mars, then by kind of aspect and
 * closeness), then where each person's planets fall in the other's houses.
 */

export interface CoupleReport {
  /** How the two people's Sun, Moon and Ascendant connect. */
  bedrock: string;
  /** Conjunctions: where the two charts fuse. */
  fusions: Insight[];
  flowing: Insight[];
  challenging: Insight[];
  /** Where each person's planets fall in the other's houses, grouped by house. */
  overlays: (Insight & { emphasis: boolean })[];
  notes: string[];
}

const WORD = { conjunction: "conjunct", opposition: "opposite", square: "square", trine: "trine", sextile: "sextile" } as const;
const SLOW = new Set<PointId>(["jupiter", "saturn", "uranus", "neptune", "pluto"]);
const ASPECT_WEIGHT = { conjunction: 2, opposition: 1.5, square: 1, trine: 0.5, sextile: 0 } as const;
const weight = (id: PointId) => (TRIAD.has(id) ? 3 : id === "venus" || id === "mars" ? 2 : 0);

type Ranked = Insight & { rank: number };

/** `you` is the member, `them` the other person. */
export function coupleReport(you: Chart, them: Chart, name: string): CoupleReport {
  const notes: string[] = [];
  const points = (c: Chart): [PointId, number][] => {
    const out: [PointId, number][] = ORDER.filter((id) => id !== "asc" && (id !== "moon" || c.houses)).map((id) => [id, c.bodies[id as BodyId].lon]);
    if (c.houses) out.push(["asc", c.houses.asc]);
    return out;
  };
  if (!you.houses || !them.houses) notes.push(`${!you.houses ? "Your" : `${name}’s`} birth time is unknown, so the Moon, rising sign and houses are left out for that chart.`);

  const lists: Record<"conjunction" | "flowing" | "challenging", Ranked[]> = { conjunction: [], flowing: [], challenging: [] };
  let triadLinks = 0;
  for (const [yid, ylon] of points(you))
    for (const [tid, tlon] of points(them)) {
      // Slow planet to slow planet belongs to everyone of a similar age, except Saturn with Saturn.
      if (SLOW.has(yid) && SLOW.has(tid) && !(yid === "saturn" && tid === "saturn")) continue;
      const asp = aspectBetween(ylon, tlon, COUPLE_ORBS);
      if (!asp) continue;
      if (TRIAD.has(yid) && TRIAD.has(tid)) triadLinks++;
      const kind = kindOf(asp.name);
      const text = synastryText(yid, tid, kind, name);
      const note = elementNote(asp.name, ylon, tlon);
      lists[kind].push({
        title: `${name}’s ${POINT_NAMES[tid]} ${WORD[asp.name]} your ${POINT_NAMES[yid]}`,
        body: note ? `${text.body} ${note}` : text.body,
        basis: `${asp.name}, ${asp.orb.toFixed(1)}° from exact`,
        // Higher is more important: the planets involved, then the kind of aspect, then closeness.
        rank: weight(yid) + weight(tid) + ASPECT_WEIGHT[asp.name] + (text.sourced ? 1 : 0) - asp.orb * 0.6,
      });
    }
  const top = (xs: Ranked[]) => xs.sort((a, b) => b.rank - a.rank).slice(0, 6).map(({ title, body, basis }) => ({ title, body, basis }));

  // Sun, Moon and Ascendant by sign as well: a link by sign still counts, more weakly.
  const triad = (c: Chart) => points(c).filter(([id]) => TRIAD.has(id));
  let bySign = 0;
  for (const [, a] of triad(you)) for (const [, b] of triad(them)) if ([0, 2, 3, 4, 6, 8, 9, 10].includes((signIndex(a) - signIndex(b) + 12) % 12)) bySign++;
  const bedrock =
    triadLinks > 0
      ? `Your Sun, Moon and rising signs are linked by ${triadLinks === 1 ? "one close aspect" : `${triadLinks} close aspects`}${bySign > triadLinks ? `, and by ${bySign} links of sign` : ""}. These are the bedrock of a bond: they are what lets two people recognise each other.`
      : bySign > 0
        ? `Your Sun, Moon and rising signs are linked by sign (${bySign} ${bySign === 1 ? "link" : "links"}) but by no close aspect. The recognition between you is there, and quieter.`
        : "Nothing links your Sun, Moon and rising signs to each other. A bond like this tends to last only with a good deal of space and separate lives, unless other contacts carry it.";

  const overlays: CoupleReport["overlays"] = [];
  const lay = (owner: Chart, into: Chart, ownerLabel: string, intoLabel: string) => {
    if (!into.houses) return;
    const byHouse = new Map<number, string[]>();
    const placed: [string, number | undefined][] = [["Sun", owner.bodies.sun.lon], ["Moon", owner.houses ? owner.bodies.moon.lon : undefined], ["Ascendant", owner.houses?.asc], ["Venus", owner.bodies.venus.lon], ["Mars", owner.bodies.mars.lon]];
    for (const [label, lon] of placed) {
      if (lon === undefined) continue;
      const n = houseOf(lon, into.houses.cusps);
      byHouse.set(n, [...(byHouse.get(n) ?? []), label]);
    }
    for (const [n, labels] of [...byHouse].sort((a, b) => b[1].length - a[1].length || a[0] - b[0]))
      overlays.push({ title: `${ownerLabel} ${labels.join(", ").replace(/, ([^,]*)$/, " and $1")} in ${intoLabel} ${ordinal(n)} house`, body: HOUSE_OVERLAY[n - 1]!, basis: `${labels.length} of five points`, emphasis: labels.length >= 3 });
  };
  lay(them, you, `${name}’s`, "your");
  lay(you, them, "Your", `${name}’s`);

  return { bedrock, fusions: top(lists.conjunction), flowing: top(lists.flowing), challenging: top(lists.challenging), overlays, notes };
}
