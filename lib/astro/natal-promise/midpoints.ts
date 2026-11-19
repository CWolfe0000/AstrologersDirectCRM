/**
 * Midpoints and planetary pictures: a separate calculation layer, in the
 * Ebertin (cosmobiology) convention. A midpoint is taken on the shorter arc;
 * its axis includes the opposite point, and a natal planet or angle completes
 * a picture when it stands on the axis or at 45°, 90° or 135° to it (the 45°
 * dial). The orb is a working convention, 1° by default, with pictures inside
 * 0°30′ marked as close. The Hamburg / Uranian system, with its hypothetical
 * planets, is not used.
 */
import type { NatalModel } from "../activation";
import type { TargetId } from "../timeline";
import { norm } from "./condition";

export const MIDPOINT_ORB = 1;
export const MIDPOINT_CLOSE = 0.5;

export interface Picture {
  pair: [TargetId, TargetId];
  midpoint: number;
  /** The natal point completing the picture: pair[0]/pair[1] = point. */
  point: TargetId;
  orb: number;
  /** 0: on the axis (conjunction or opposition); 90: square to it; 45: semisquare or sesquiquadrate. */
  angle: 0 | 45 | 90;
  close: boolean;
}

export function midpointOf(a: number, b: number) {
  const d = norm(b - a);
  return norm(a + (d > 180 ? d - 360 : d) / 2);
}

export function pictures(n: NatalModel, pairs: [TargetId, TargetId][], orb = MIDPOINT_ORB): Picture[] {
  const out: Picture[] = [];
  for (const pair of pairs) {
    const a = n.byId.get(pair[0]), b = n.byId.get(pair[1]);
    if (!a || !b) continue;
    const mid = midpointOf(a.lon, b.lon);
    for (const p of n.points) {
      if (p.id === pair[0] || p.id === pair[1]) continue;
      const d = norm(p.lon - mid) % 45;
      const off = Math.min(d, 45 - d);
      if (off > orb) continue;
      const k = Math.round(norm(p.lon - mid) / 45) % 8;
      out.push({ pair, midpoint: mid, point: p.id, orb: off, angle: k % 4 === 0 ? 0 : k % 2 === 0 ? 90 : 45, close: off <= MIDPOINT_CLOSE });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}
