import type { BodyId, Chart, PointId } from "@/lib/astro/types";
import { BODIES } from "@/lib/astro/types";
import { separation } from "@/lib/astro/spherical";
import { POINT_NAMES } from "@/lib/astro/zodiac";
import { aspectBasis, aspectsOf, type NatalAspect } from "./own";
import { SETS_OFF, SUPPORTS_WITH } from "./text";

/**
 * Triggers: a difficult aspect in one person's own chart that the other
 * person's planets land on.
 *
 * Someone with Venus square Saturn carries that tension whoever they are
 * with. A partner whose Mars sits on that Saturn presses on it constantly; a
 * partner with nothing near either planet leaves it quiet. So each person is
 * first read alone (their difficult aspects), then each of those aspects is
 * checked for a planet of the other person's within a tight orb of either end:
 * by conjunction, square or opposition it sets the aspect off; by trine or
 * sextile it eases it. The same is done for each person's supportive aspects,
 * which the other person's planets can bring out.
 */

/** Tighter than ordinary synastry: a contact has to be close to count. */
const HARD = [
  { word: "on", angle: 0, orb: 4 },
  { word: "opposite", angle: 180, orb: 3 },
  { word: "square", angle: 90, orb: 3 },
] as const;
const SOFT = [
  { word: "trine", angle: 120, orb: 3 },
  { word: "sextile", angle: 60, orb: 2 },
] as const;
/** What brings out a gift: a planet on it, or in easy aspect to it. */
const SUPPORT = [HARD[0], ...SOFT] as const;

const SLOW = new Set<PointId>(["jupiter", "saturn", "uranus", "neptune", "pluto", "node"]);

export interface Trigger {
  /** The other person's point. */
  by: PointId;
  /** The end of the natal aspect it touches. */
  end: BodyId;
  /** "Sam’s Mars on your Saturn" */
  title: string;
  body: string;
  orb: number;
}

export interface DifficultAspect {
  key: string;
  name: string;
  /** "Venus square Saturn, 2.1° from exact" */
  basis: string;
  body: string;
  /** The other person's planets that press on it (conjunction, square, opposition). */
  triggers: Trigger[];
  /** The other person's planets that ease it (trine, sextile). */
  eased: Trigger[];
}

/** A supportive aspect in one person's chart, and what in the other's chart brings it out. */
export interface Gift {
  key: string;
  name: string;
  basis: string;
  body: string;
  broughtOut: Trigger[];
}

type Touch = { by: PointId; end: BodyId; word: string; orb: number };

/** The other person's points that touch one natal aspect, by the given kinds of aspect. */
function touching(aspect: NatalAspect, owner: Chart, other: Chart, kinds: readonly { word: string; angle: number; orb: number }[]): Touch[] {
  // Their Moon and Ascendant need their birth time.
  const points: [PointId, number][] = BODIES.filter((id) => id !== "moon" || other.houses).map((id) => [id, other.bodies[id].lon]);
  if (other.houses) points.push(["asc", other.houses.asc]);
  const out: Touch[] = [];
  for (const [by, lon] of points)
    for (const end of [aspect.x, aspect.y]) {
      // Slow planet on slow planet is shared by everyone of a similar age: it says nothing about this person.
      if (SLOW.has(by) && SLOW.has(end)) continue;
      const sep = separation(lon, owner.bodies[end].lon);
      const hit = kinds.find((t) => Math.abs(sep - t.angle) <= t.orb);
      if (hit) out.push({ by, end, word: hit.word, orb: Math.abs(sep - hit.angle) });
    }
  return out.sort((a, b) => a.orb - b.orb).slice(0, 4);
}

/**
 * How the other chart meets the owner's own aspects, as signature keys for the
 * pattern across partners: "trigger|…" (sets off a difficult aspect),
 * "eases|…" (eases one) and "gift|…" (brings out a supportive one).
 */
export function natalContactKeys(owner: Chart, other: Chart): string[] {
  const out: string[] = [];
  for (const a of aspectsOf(owner)) {
    if (a.hard) {
      if (touching(a, owner, other, HARD).length) out.push(`trigger|${a.key}`);
      if (touching(a, owner, other, SOFT).length) out.push(`eases|${a.key}`);
    } else if (touching(a, owner, other, SUPPORT).length) out.push(`gift|${a.key}`);
  }
  return out;
}

const supportOf = (by: PointId, otherPoss: string) => (SUPPORTS_WITH[by] ?? "{P} presence").replace("{P}", otherPoss === "Your" ? "your" : otherPoss);

const names = (ownerName: string | null, otherName: string | null) => ({ ownerPoss: ownerName ? `${ownerName}’s` : "your", otherPoss: otherName ? `${otherName}’s` : "Your" });

/**
 * One person's difficult aspects, each with what the other person does to it.
 * @param ownerName null when the owner is the member ("you"), else the other person's name
 * @param otherName null when the other person is the member
 */
export function difficultAspects(owner: Chart, other: Chart, ownerName: string | null, otherName: string | null): DifficultAspect[] {
  const { ownerPoss, otherPoss } = names(ownerName, otherName);
  const title = (t: Touch) => `${otherPoss} ${POINT_NAMES[t.by]} ${t.word} ${ownerPoss} ${POINT_NAMES[t.end]}`;
  return aspectsOf(owner)
    .filter((a) => a.hard)
    .map((a) => ({
      key: a.key,
      name: a.name,
      basis: aspectBasis(a),
      body: ownerName ? a.them : a.you,
      triggers: touching(a, owner, other, HARD).slice(0, 3).map((t) => ({ by: t.by, end: t.end, orb: t.orb, title: title(t), body: (SETS_OFF[t.by] ?? "{P} presence sets it off.").replace("{P}", otherPoss) })),
      eased: touching(a, owner, other, SOFT).slice(0, 2).map((t) => ({ by: t.by, end: t.end, orb: t.orb, title: title(t), body: `It is eased by ${supportOf(t.by, otherPoss)}.` })),
    }))
    .sort((p, q) => Math.min(p.triggers[0]?.orb ?? 99, p.eased[0]?.orb ?? 98) - Math.min(q.triggers[0]?.orb ?? 99, q.eased[0]?.orb ?? 98));
}

/** One person's supportive aspects, each with what in the other person's chart brings it out. */
export function gifts(owner: Chart, other: Chart, ownerName: string | null, otherName: string | null): Gift[] {
  const { ownerPoss, otherPoss } = names(ownerName, otherName);
  return aspectsOf(owner)
    .filter((a) => !a.hard)
    .map((a) => ({
      key: a.key,
      name: a.name,
      basis: aspectBasis(a),
      body: ownerName ? a.them : a.you,
      broughtOut: touching(a, owner, other, SUPPORT).slice(0, 2).map((t) => ({
        by: t.by,
        end: t.end,
        orb: t.orb,
        title: `${otherPoss} ${POINT_NAMES[t.by]} ${t.word} ${ownerPoss} ${POINT_NAMES[t.end]}`,
        body: `It is brought out by ${supportOf(t.by, otherPoss)}.`,
      })),
    }))
    .sort((p, q) => (p.broughtOut[0]?.orb ?? 99) - (q.broughtOut[0]?.orb ?? 99));
}
