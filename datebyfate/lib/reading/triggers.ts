import type { BodyId, Chart, PointId } from "@/lib/astro/types";
import { BODIES } from "@/lib/astro/types";
import { separation } from "@/lib/astro/spherical";
import { POINT_NAMES } from "@/lib/astro/zodiac";
import { aspectsOf, type NatalAspect } from "./own";
import { SETS_OFF } from "./text";

/**
 * Triggers: a difficult aspect in one person's own chart that the other
 * person's planets land on.
 *
 * Someone with Venus square Saturn carries that tension whoever they are
 * with. A partner whose Mars sits on that Saturn presses on it constantly; a
 * partner with nothing near either planet leaves it quiet. So each person is
 * first read alone (their difficult aspects), then each of those aspects is
 * checked for a planet of the other person's within a tight orb of either end.
 */

/** Tighter than ordinary synastry: a trigger has to be close to count. */
const TRIGGER_ORBS = [
  { word: "on", angle: 0, orb: 4 },
  { word: "opposite", angle: 180, orb: 3 },
  { word: "square", angle: 90, orb: 3 },
] as const;

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
  triggers: Trigger[];
}

/** The other person's points that touch one natal aspect. */
function touching(aspect: NatalAspect, owner: Chart, other: Chart): { by: PointId; end: BodyId; word: string; orb: number }[] {
  // Their Moon and Ascendant need their birth time.
  const points: [PointId, number][] = BODIES.filter((id) => id !== "moon" || other.houses).map((id) => [id, other.bodies[id].lon]);
  if (other.houses) points.push(["asc", other.houses.asc]);
  const out: { by: PointId; end: BodyId; word: string; orb: number }[] = [];
  for (const [by, lon] of points)
    for (const end of [aspect.x, aspect.y]) {
      // Slow planet on slow planet is shared by everyone of a similar age: it says nothing about this person.
      if (SLOW.has(by) && SLOW.has(end)) continue;
      const sep = separation(lon, owner.bodies[end].lon);
      const hit = TRIGGER_ORBS.find((t) => Math.abs(sep - t.angle) <= t.orb);
      if (hit) out.push({ by, end, word: hit.word, orb: Math.abs(sep - hit.angle) });
    }
  return out.sort((a, b) => a.orb - b.orb).slice(0, 4);
}

/** Keys of the owner's difficult aspects that the other chart sets off. Used for the pattern across partners. */
export function triggeredKeys(owner: Chart, other: Chart): string[] {
  return aspectsOf(owner).filter((a) => a.hard && touching(a, owner, other).length > 0).map((a) => a.key);
}

/**
 * One person's difficult aspects, each with what the other person does to it.
 * @param ownerName null when the owner is the member ("you"), else the other person's name
 * @param otherName null when the other person is the member
 */
export function difficultAspects(owner: Chart, other: Chart, ownerName: string | null, otherName: string | null): DifficultAspect[] {
  const ownerPoss = ownerName ? `${ownerName}’s` : "your";
  const otherPoss = otherName ? `${otherName}’s` : "Your";
  return aspectsOf(owner)
    .filter((a) => a.hard)
    .map((a) => ({
      key: a.key,
      name: a.dynamic.name,
      basis: `${a.label}, ${a.orb.toFixed(1)}° from exact`,
      body: ownerName ? a.dynamic.them : a.dynamic.hard,
      triggers: touching(a, owner, other).map((t) => ({
        by: t.by,
        end: t.end,
        orb: t.orb,
        title: `${otherPoss} ${POINT_NAMES[t.by]} ${t.word} ${ownerPoss} ${POINT_NAMES[t.end]}`,
        body: (SETS_OFF[t.by] ?? "{P} presence sets it off.").replace("{P}", otherPoss),
      })),
    }))
    .sort((p, q) => (p.triggers[0]?.orb ?? 99) - (q.triggers[0]?.orb ?? 99));
}
