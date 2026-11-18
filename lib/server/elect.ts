import "server-only";
import type { BirthData, ChartPoints, ChartSettings } from "@/lib/astro/types";
import { houseOf } from "@/lib/astro/techniques/aspects";
import { scoreElection, type ElectionCheck, type ElectionResult } from "@/lib/astro/elect";
import { zonedToUtc } from "@/lib/timezones";
import { natalChart } from "./astro";
import { bodiesAt, housesAt, jdToUtc, lunationsBetween } from "./swiss";

const ELECT_BODIES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"] as const;

export type ElectionWindow = { start: string; end: string; best: string; percent: number; eclipseNear: string | null; results: ElectionResult[] };

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * Scan local times from `from` to `to` (inclusive), within the daily window,
 * every `stepMin` minutes, at `place`. Neighbouring moments that pass and fail
 * the same rules form one window; the best windows come back first.
 */
export function findElections(opts: {
  from: string;
  to: string;
  dailyFrom: string;
  dailyTo: string;
  stepMin: number;
  place: { lat: number; lon: number; tz: string };
  settings: ChartSettings;
  checks: ElectionCheck[];
  natal?: BirthData;
  limit?: number;
}) {
  const natal = opts.natal ? natalChart(opts.natal, opts.settings) : undefined;
  const fromUtc = zonedToUtc(`${opts.from}T00:00:00`, opts.place.tz).getTime();
  const toUtc = zonedToUtc(`${addDays(opts.to, 1)}T00:00:00`, opts.place.tz).getTime();
  const eclipses = opts.checks.includes("eclipse")
    ? lunationsBetween(new Date(fromUtc - 4 * 86_400_000).toISOString(), new Date(toUtc + 4 * 86_400_000).toISOString())
        .filter((l) => l.eclipse)
        .map((l) => ({ t: Date.parse(jdToUtc(l.jd)), name: l.eclipse! }))
    : [];
  const windows: ElectionWindow[] = [];
  let cur: (ElectionWindow & { key: string; lastMin: number; day: string }) | null = null;
  const close = () => {
    if (cur) windows.push({ start: cur.start, end: cur.end, best: cur.best, percent: cur.percent, eclipseNear: cur.eclipseNear, results: cur.results });
    cur = null;
  };
  const startMin = toMin(opts.dailyFrom), endMin = toMin(opts.dailyTo);
  for (let day = opts.from; day <= opts.to; day = addDays(day, 1)) {
    for (let m = startMin; m <= endMin; m += opts.stepMin) {
      const local = `${day}T${hhmm(m)}`;
      const utc = zonedToUtc(`${local}:00`, opts.place.tz).toISOString();
      const pos = bodiesAt(utc, { zodiac: opts.settings.zodiac, bodies: [...ELECT_BODIES] });
      const h = housesAt(utc, opts.place.lat, opts.place.lon, opts.settings.houseSystem, opts.settings.zodiac);
      const points: ChartPoints = {
        bodies: ELECT_BODIES.map((id) => ({ id, lon: pos[id]!.lon, speed: pos[id]!.speed, house: houseOf(pos[id]!.lon, h.cusps) })),
        cusps: h.cusps,
        asc: h.asc,
        mc: h.mc,
      };
      const t = Date.parse(utc);
      const eclipseNear = eclipses.find((e) => Math.abs(e.t - t) < 3 * 86_400_000)?.name ?? null;
      const r = scoreElection(points, opts.checks, { natal, eclipseNear });
      if (r.excluded) {
        close();
        continue;
      }
      const key = r.results.map((x) => (x.ok ? "1" : "0")).join("");
      if (cur && cur.key === key && cur.day === day && cur.lastMin === m - opts.stepMin) {
        cur.end = local;
        cur.lastMin = m;
        if (r.percent > cur.percent) {
          cur.percent = r.percent;
          cur.best = local;
          cur.results = r.results;
        }
      } else {
        close();
        cur = { start: local, end: local, best: local, percent: r.percent, eclipseNear, results: r.results, key, lastMin: m, day };
      }
    }
    close();
  }
  return windows.sort((a, b) => b.percent - a.percent || a.start.localeCompare(b.start)).slice(0, opts.limit ?? 12);
}
