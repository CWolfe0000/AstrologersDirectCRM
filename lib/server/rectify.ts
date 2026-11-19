import "server-only";
/**
 * Birth-time rectification by life events. Each candidate time (a few minutes
 * apart, inside a window on the birth date) gets its own angles; each event is
 * then checked for contacts to those angles, the part of the chart that the
 * birth time changes:
 *
 *   - slow transits (Jupiter–Pluto, the Node) to the angles       orb 1°
 *   - solar-arc planets to the angles                              orb 1°
 *   - solar-arc angles (angle + arc) to the planets                orb 1°
 *   - progressed angles (RAMC + arc) to the planets                orb 1°
 *   - the progressed Moon to the angles                            orb 1°
 *
 * Only conjunctions, oppositions and squares count. Each hit scores technique
 * weight × aspect weight × how relevant that angle is to the event (marriage →
 * Descendant, career → Midheaven …) × closeness (1 when exact, 0 at the edge
 * of orb). Each event counts its best hit plus a quarter of its second, so the
 * time that explains the most events most tightly ranks first. Provisional
 * weights; every hit is returned so the astrologer can judge.
 */
import type { BirthData, BodyId, ChartSettings, HouseSystem } from "@/lib/astro/types";
import { zonedToUtc } from "@/lib/timezones";
import { bodiesAt, housesAt, housesFromRamc, obliquityAt } from "./swiss";

const DAY = 86_400_000;
const YEAR = 365.2422 * DAY;

export const EVENT_TYPES = {
  marriage: { label: "Marriage or Committed Partnership", angles: { asc: 1, mc: 0.6, dsc: 1.5, ic: 0.6 } },
  separation: { label: "Separation or Divorce", angles: { asc: 1, mc: 0.6, dsc: 1.5, ic: 0.6 } },
  child: { label: "Birth of a Child", angles: { asc: 1, mc: 0.8, dsc: 0.6, ic: 1.2 } },
  career: { label: "Career Change, Promotion or Graduation", angles: { asc: 0.6, mc: 1.5, dsc: 0.6, ic: 0.8 } },
  move: { label: "Move or Change of Home", angles: { asc: 0.8, mc: 0.6, dsc: 0.6, ic: 1.5 } },
  parent: { label: "Death or Illness of a Parent", angles: { asc: 0.6, mc: 1.3, dsc: 0.6, ic: 1.3 } },
  health: { label: "Accident, Surgery or Illness", angles: { asc: 1.5, mc: 0.6, dsc: 0.8, ic: 0.6 } },
  other: { label: "Other Major Event", angles: { asc: 1, mc: 1, dsc: 1, ic: 1 } },
} as const;
export type EventType = keyof typeof EVENT_TYPES;

type Angle = "asc" | "mc" | "dsc" | "ic";
// Hard aspects only: conjunctions (and oppositions, i.e. conjunctions to the opposite angle) and squares.
const ASPECTS = [
  { name: "conjunction", angle: 0, w: 1 },
  { name: "opposition", angle: 180, w: 1 },
  { name: "square", angle: 90, w: 0.6 },
] as const;
const NATAL: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"];
const SLOW: BodyId[] = ["jupiter", "saturn", "uranus", "neptune", "pluto", "node"];
const TECH = {
  transit: { label: "Transit", w: 1, orb: 1 },
  "sa-planet": { label: "Solar Arc", w: 1.2, orb: 1 },
  "sa-angle": { label: "Solar Arc Angle", w: 1.2, orb: 1 },
  "prog-angle": { label: "Progressed Angle", w: 1, orb: 1 },
  "prog-moon": { label: "Progressed Moon", w: 0.8, orb: 1 },
} as const;
type Tech = keyof typeof TECH;

const n180 = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;

export interface RectifyEvent {
  date: string;
  type: EventType;
  note?: string;
}
export interface Hit {
  event: number;
  technique: Tech;
  from: string; // moving point, e.g. "Saturn", "Solar Arc MC"
  to: string; // natal point, e.g. "Ascendant", "Venus"
  aspect: string;
  orb: number;
  points: number;
}

/**
 * Contacts between a moving longitude and a fixed one: for angles, the
 * conjunction or opposition names the angle hit (an opposition to the
 * Ascendant is a conjunction to the Descendant).
 */
function contact(moving: number, fixed: number, orbMax: number) {
  let best: { aspect: (typeof ASPECTS)[number]; orb: number } | null = null;
  for (const a of ASPECTS) {
    const orb = Math.abs(Math.abs(n180(moving - fixed)) - a.angle);
    if (orb <= orbMax && (!best || orb < best.orb)) best = { aspect: a, orb };
  }
  return best;
}

export function rectify(birth: BirthData, events: RectifyEvent[], from: string, to: string, stepMin: number, s: Pick<ChartSettings, "zodiac" | "houseSystem">) {
  const [fh, fm] = from.split(":").map(Number), [th, tm] = to.split(":").map(Number);
  const start = fh! * 60 + fm!, end = th! * 60 + tm!;
  // Transits at each event (noon UTC): the same for every candidate.
  const transits = events.map((e) => bodiesAt(`${e.date}T12:00:00Z`, { zodiac: s.zodiac, bodies: SLOW }));
  const angleNames: Record<Angle, string> = { asc: "Ascendant", mc: "Midheaven", dsc: "Descendant", ic: "IC" };
  const NAME = (b: BodyId) => (b === "node" ? "North Node" : b.charAt(0).toUpperCase() + b.slice(1));

  const candidates: { time: string; utc: string; asc: number; mc: number; score: number; hits: Hit[] }[] = [];
  for (let min = start; min <= end; min += stepMin) {
    const time = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
    const utc = zonedToUtc(`${birth.date}T${time}:00`, birth.tz || "UTC").toISOString();
    const h = housesAt(utc, birth.lat, birth.lon, s.houseSystem as HouseSystem, s.zodiac);
    const natal = bodiesAt(utc, { zodiac: s.zodiac, bodies: NATAL });
    const eps = obliquityAt(utc);
    const angles: Record<Angle, number> = { asc: h.asc, mc: h.mc, dsc: (h.asc + 180) % 360, ic: (h.mc + 180) % 360 };
    const hits: Hit[] = [];
    events.forEach((ev, i) => {
      const rel = EVENT_TYPES[ev.type].angles;
      const add = (technique: Tech, fromName: string, toName: string, aspect: { name: string; w: number }, orb: number, angle: Angle) => {
        const t = TECH[technique];
        hits.push({ event: i, technique, from: fromName, to: toName, aspect: aspect.name, orb, points: Math.round(t.w * aspect.w * rel[angle] * (1 - orb / t.orb) * 100) / 100 });
      };
      // Which angle an aspect to the ASC or MC point actually touches.
      const angleOf = (base: "asc" | "mc", aspectName: string): Angle => (aspectName === "opposition" ? (base === "asc" ? "dsc" : "ic") : base);
      const toAngles = (technique: Tech, fromName: string, lon: number) => {
        for (const base of ["asc", "mc"] as const) {
          const c = contact(lon, angles[base], TECH[technique].orb);
          if (c) {
            const ang = angleOf(base, c.aspect.name);
            add(technique, fromName, angleNames[ang], { name: c.aspect.name === "opposition" ? "conjunction" : c.aspect.name, w: c.aspect.w }, c.orb, ang);
          }
        }
      };
      const ageMs = Date.parse(`${ev.date}T12:00:00Z`) - Date.parse(utc);
      if (ageMs <= 0) return;
      // Transits to the angles.
      for (const b of SLOW) toAngles("transit", `Transiting ${NAME(b)}`, transits[i]![b]!.lon);
      // Secondary progressions: one day after birth for each year of life.
      const prog = bodiesAt(new Date(Date.parse(utc) + (ageMs / YEAR) * DAY).toISOString(), { zodiac: s.zodiac, bodies: ["sun", "moon"] });
      const arc = ((prog.sun!.lon - natal.sun!.lon) % 360 + 360) % 360;
      toAngles("prog-moon", "Progressed Moon", prog.moon!.lon);
      // Solar-arc planets to the angles; solar-arc and progressed angles to the planets.
      for (const b of NATAL) toAngles("sa-planet", `Solar Arc ${NAME(b)}`, (natal[b]!.lon + arc) % 360);
      const pr = housesFromRamc((h.ramc + arc) % 360, birth.lat, eps, s.houseSystem as HouseSystem);
      const moving: [Tech, string, number, Angle][] = [
        ["sa-angle", "Solar Arc Ascendant", (h.asc + arc) % 360, "asc"],
        ["sa-angle", "Solar Arc Midheaven", (h.mc + arc) % 360, "mc"],
        ["prog-angle", "Progressed Ascendant", pr.asc, "asc"],
        ["prog-angle", "Progressed Midheaven", pr.mc, "mc"],
      ];
      for (const [technique, fromName, lon, ang] of moving) {
        for (const b of NATAL) {
          const c = contact(lon, natal[b]!.lon, TECH[technique].orb);
          if (c) {
            // An opposition from a directed angle is a conjunction from the opposite angle.
            const angle: Angle = c.aspect.name === "opposition" ? (ang === "asc" ? "dsc" : "ic") : ang;
            add(technique, c.aspect.name === "opposition" ? fromName.replace("Ascendant", "Descendant").replace("Midheaven", "IC") : fromName, NAME(b), { name: c.aspect.name === "opposition" ? "conjunction" : c.aspect.name, w: c.aspect.w }, c.orb, angle);
          }
        }
      }
    });
    // Each event scores its best hit plus a quarter of its second: explaining many events tightly beats many loose contacts.
    let score = 0;
    events.forEach((_, i) => {
      const pts = hits.filter((x) => x.event === i).map((x) => x.points).sort((a, b) => b - a);
      score += (pts[0] ?? 0) + 0.25 * (pts[1] ?? 0);
    });
    candidates.push({ time, utc, asc: h.asc, mc: h.mc, score: Math.round(score * 100) / 100, hits });
  }
  const ranked = [...candidates].sort((a, b) => b.score - a.score);
  // Keep the best few with their hits, and every candidate's score for the graph.
  const top: typeof candidates = [];
  for (const c of ranked) {
    if (top.length >= 6) break;
    // Skip near-duplicates of a better candidate (within 6 minutes).
    const m = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3));
    if (top.some((t) => Math.abs(m(t.time) - m(c.time)) < 6)) continue;
    top.push(c);
  }
  return {
    curve: candidates.map((c) => ({ time: c.time, score: c.score, asc: Math.round(c.asc * 100) / 100, mc: Math.round(c.mc * 100) / 100 })),
    top,
    weights: { techniques: TECH, aspects: ASPECTS.map((a) => ({ name: a.name, w: a.w })), events: EVENT_TYPES },
  };
}
