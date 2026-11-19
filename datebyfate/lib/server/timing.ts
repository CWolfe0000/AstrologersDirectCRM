import "server-only";
import type { BodyId } from "@/lib/astro/types";
import { separation } from "@/lib/astro/spherical";
import { POINT_NAMES } from "@/lib/astro/zodiac";
import { TARGET_AREA, TRANSIT_THEME } from "@/lib/reading/text";
import { bodiesAt } from "./swiss";

export interface Target {
  /** Key into TARGET_AREA. */
  id: string;
  lon: number;
}

export interface Window {
  planet: string;
  title: string;
  body: string;
  basis: string;
  /** YYYY-MM-DD */
  start: string;
  end: string;
  peak: string;
  /** Already under way today. */
  active: boolean;
  /** Still within range at the end of the period looked at. */
  ongoing: boolean;
}

const MOVERS: { id: BodyId; orb: number; angles: number[] }[] = [
  { id: "jupiter", orb: 2, angles: [0, 90, 120, 180] },
  { id: "saturn", orb: 1.5, angles: [0, 90, 180] },
  { id: "uranus", orb: 1, angles: [0, 90, 180] },
  { id: "neptune", orb: 1, angles: [0, 90, 180] },
  { id: "pluto", orb: 1, angles: [0, 90, 180] },
];
const ASPECT_WORD: Record<number, string> = { 0: "conjunct", 90: "square", 120: "trine", 180: "opposite" };
const DAY = 86_400_000;

/** Periods in the coming year when a slow planet is on a relationship point. */
export function transitWindows(targets: Target[], fromMs = Date.now(), days = 365): Window[] {
  const t0 = Math.floor(fromMs / DAY) * DAY + DAY / 2;
  const sky = Array.from({ length: days + 1 }, (_, d) => bodiesAt(t0 + d * DAY, MOVERS.map((m) => m.id)));
  const date = (d: number) => new Date(t0 + d * DAY).toISOString().slice(0, 10);
  const out: Window[] = [];
  for (const m of MOVERS)
    for (const target of targets)
      for (const angle of m.angles) {
        let start = -1, peak = -1, best = 99;
        for (let d = 0; d <= days + 1; d++) {
          const orb = d <= days ? Math.abs(separation(sky[d]![m.id].lon, target.lon) - angle) : 99;
          if (orb <= m.orb) {
            if (start < 0) (start = d), (best = 99);
            if (orb < best) (best = orb), (peak = d);
          } else if (start >= 0) {
            const theme = TRANSIT_THEME[m.id]!;
            const easy = angle === 0 || angle === 120;
            out.push({
              planet: m.id,
              title: theme.name,
              body: `${easy ? theme.easy : theme.hard}`,
              basis: `${POINT_NAMES[m.id]} ${ASPECT_WORD[angle]} ${TARGET_AREA[target.id]}`,
              start: date(start),
              end: date(d - 1),
              peak: date(peak),
              active: start === 0,
              ongoing: d - 1 === days,
            });
            start = -1;
          }
        }
      }
  return out.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}
