import type { BodyId, Chart } from "@/lib/astro/types";
import { POINT_NAMES, SIGNS, houseOf, ordinal, signIndex } from "@/lib/astro/zodiac";
import type { Insight } from "./own";
import { HOUSE_AREA } from "./text";

/**
 * Stelliums, following Diane Eddington, "Star Synastry: All About Stelliums": three or more of the
 * five personal planets in one sign. In a relationship a stellium falls wholesale into one of the
 * partner's houses, and it helps when the partner has a personal planet in the same sign. She
 * presents this as a tendency with exceptions, not a rule, and so do we. The wording is our own.
 */

const PERSONAL: BodyId[] = ["sun", "moon", "mercury", "venus", "mars"];

export interface Stellium {
  sign: number;
  planets: BodyId[];
}

export function stelliumOf(chart: Chart): Stellium | null {
  const bySign = new Map<number, BodyId[]>();
  for (const id of PERSONAL) {
    if (id === "moon" && !chart.moonSignCertain) continue;
    const s = signIndex(chart.bodies[id].lon);
    bySign.set(s, [...(bySign.get(s) ?? []), id]);
  }
  for (const [sign, planets] of bySign) if (planets.length >= 3) return { sign, planets };
  return null;
}

const list = (ids: BodyId[]) => ids.map((id) => POINT_NAMES[id]).join(", ").replace(/, ([^,]*)$/, " and $1");

/** Your own stellium, if you have one. */
export function ownStellium(chart: Chart): Insight | null {
  const s = stelliumOf(chart);
  if (!s) return null;
  const name = SIGNS[s.sign]!.name;
  const house = chart.houses ? houseOf(chart.bodies[s.planets[0]!].lon, chart.houses.cusps) : null;
  const love = house === 5 || house === 7 ? " That house is one of the two most tied to love, so relationships sit at the centre of your life." : house ? " That pulls a great deal of your energy there, and love has to make room for it." : "";
  return {
    title: `A Stellium In ${name}`,
    body: `${s.planets.length === 5 ? "All five" : s.planets.length === 4 ? "Four" : "Three"} of your five personal planets are in ${name}, so you are strongly weighted toward that one sign${house ? `, and toward your ${ordinal(house)} house: ${HOUSE_AREA[house - 1]}` : ""}.${love} You tend to feel understood by people who have a personal planet in ${name} themselves.`,
    basis: `${list(s.planets)} in ${name}`,
  };
}

/** One person's stellium against the other's chart: where it lands, and whether the other speaks its language. */
export function stelliumBetween(owner: Chart, other: Chart, ownerName: string | null, otherName: string | null): Insight | null {
  const s = stelliumOf(owner);
  if (!s) return null;
  const name = SIGNS[s.sign]!.name;
  const Owner = ownerName ? `${ownerName}’s` : "Your";
  const otherPoss = otherName ? `${otherName}’s` : "your";
  const shared = PERSONAL.filter((id) => (id !== "moon" || other.moonSignCertain) && signIndex(other.bodies[id].lon) === s.sign);
  const house = other.houses ? houseOf(owner.bodies[s.planets[0]!].lon, other.houses.cusps) : null;
  const lands = house ? ` It falls in ${otherPoss} ${ordinal(house)} house, so most of what ${ownerName ?? "you"} ${ownerName ? "is" : "are"} arrives in one part of ${otherName ? "their" : "your"} life: ${HOUSE_AREA[house - 1]}.` : "";
  const speaks = shared.length
    ? ` ${otherName ? `${otherName} has` : "You have"} ${list(shared)} in ${name} too, which helps a great deal: that side of ${ownerName ?? "you"} is understood.`
    : ` ${otherName ? `${otherName} has` : "You have"} no personal planet in ${name}. That does not rule anything out, but ${ownerName ?? "you"} may feel that this side of ${ownerName ? "them" : "you"} is not understood, and it will take saying out loud.`;
  return { title: `${Owner} Stellium In ${name}`, body: `${Owner} ${list(s.planets)} are all in ${name}.${lands}${speaks}`, basis: `${list(s.planets)} in ${name}` };
}
