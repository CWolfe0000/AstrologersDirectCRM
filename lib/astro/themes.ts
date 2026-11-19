/**
 * Life themes: periods when one topic of the natal chart is being directed,
 * and what sets it off. Built on the activation model, and always on every
 * contact in the range (the significance filter does not apply).
 *
 * A period is anchored on a solar arc: the time a solar arc involving one of
 * the theme's significators is in orb. Solar arcs come first because they tend
 * to coincide with a planet's meaning showing up in events. A secondary
 * progression is used as an anchor only when fewer than four solar arcs
 * qualify. Up to four periods are kept, solar arcs first.
 *
 * An anchor qualifies when a significator is the natal point it aims at, or
 * (solar arcs only) the planet being directed, and the theme's rule holds:
 *
 * - Marriage and partnership: Venus, the ruler of the 7th, planets in the 7th,
 *   Juno, and the Ascendant–Descendant axis (conjunctions and oppositions
 *   only, when the axis is the only significator involved). Any aspect.
 * - Career success: the Midheaven, the ruler of the 10th, planets in the 10th
 *   and the Sun. Trines and sextiles, and any aspect involving Jupiter, Venus
 *   or the Sun as the directed planet.
 * - Accident-prone: the Ascendant, the chart ruler, Sun, Moon, Mars and
 *   Uranus. Hard aspects only, and only when Mars, Saturn, Uranus or Pluto is
 *   directed, or natal Mars or Uranus is the target.
 *
 * Triggers are the transits and eclipses, by any aspect in use, to the two
 * natal points of the anchor (the point aimed at, and the natal place of the
 * directed planet) while the anchor is in orb. Like the density score, this is
 * a counting aid with provisional rules.
 */
import type { BodyId } from "./index";
import type { ActivationModel } from "./activation";
import type { TargetId, TimelineContact } from "./timeline";

const DAY = 86_400_000;
export type ThemeId = "marriage" | "career" | "accident";

export interface Significator {
  id: TargetId;
  why: string;
}

export interface ThemeTrigger {
  contact: TimelineContact;
  /** Exact hits (or the eclipses) while the anchor is in orb; when there are none, the closest approach. */
  dates: string[];
  exact: boolean;
}

export interface ThemePeriod {
  /** The solar arc (or progression) the period rests on. */
  anchor: TimelineContact;
  /** Day indexes within the timeline: the anchor's time in orb. */
  start: number;
  end: number;
  startOpen: boolean;
  endOpen: boolean;
  /** When the anchor is exact, if that falls in the range. */
  exact: string | null;
  /** The natal points triggers are looked for on. */
  points: TargetId[];
  /** Transits and eclipses to those points, in date order. */
  triggers: ThemeTrigger[];
  /** The day the triggers are strongest together; null when there are none. */
  peak: number | null;
}

export interface ThemeResult {
  id: ThemeId;
  significators: Significator[];
  /** Per day: anchors in orb (solar arcs counted double) plus their triggers; and the maximum. */
  series: Float32Array;
  max: number;
  /** Qualifying anchors in the range, before the limit of four. */
  anchorCount: number;
  periods: ThemePeriod[];
}

const HARD = new Set(["conjunction", "square", "opposition", "semisquare", "sesquiquadrate", "quincunx"]);
const SOFT = new Set(["trine", "sextile"]);
const HARSH_MOVERS = new Set(["mars", "saturn", "uranus", "pluto"]);
const HELPFUL_MOVERS = new Set(["jupiter", "venus", "sun"]);
const parse = (s: string) => Date.parse(s.length === 10 ? `${s}T00:00:00Z` : s);

function significators(m: ActivationModel, theme: ThemeId): Significator[] {
  const n = m.natal, has = (id: TargetId) => n.byId.has(id);
  const out: Significator[] = [];
  const add = (id: TargetId | null | undefined, why: string) => {
    if (id && has(id) && !out.some((s) => s.id === id)) out.push({ id, why });
  };
  if (theme === "marriage") {
    add("venus", "Venus");
    add(n.houseRulers(7)[0], "Ruler of the 7th");
    n.occupants(7).forEach((id) => add(id, "In the 7th"));
    add("juno", "Juno");
    add("asc", "Descendant Axis");
  } else if (theme === "career") {
    add("mc", "Midheaven");
    add(n.houseRulers(10)[0], "Ruler of the 10th");
    n.occupants(10).forEach((id) => add(id, "In the 10th"));
    add("sun", "Sun");
  } else {
    add("asc", "Ascendant");
    add(n.chartRuler, "Chart Ruler");
    (["sun", "moon", "mars", "uranus"] as BodyId[]).forEach((id) => add(id, id === "sun" ? "Sun" : id === "moon" ? "Moon" : id === "mars" ? "Mars" : "Uranus"));
  }
  return out;
}

/** Whether a solar arc or progression anchors a period of this theme. */
function anchors(theme: ThemeId, c: TimelineContact, sigs: Set<TargetId>) {
  const arc = c.technique === "solar-arc";
  if (!arc && c.technique !== "progressed") return false;
  const involved = [c.target, ...(arc ? [c.source as TargetId] : [])].filter((id) => sigs.has(id));
  if (involved.length === 0) return false;
  if (theme === "marriage") return involved.some((id) => id !== "asc") || c.aspect === "conjunction" || c.aspect === "opposition";
  if (theme === "career") return SOFT.has(c.aspect) || HELPFUL_MOVERS.has(c.source);
  return HARD.has(c.aspect) && (HARSH_MOVERS.has(c.source) || c.target === "mars" || c.target === "uranus");
}

export function themeResult(m: ActivationModel, id: ThemeId): ThemeResult {
  const n = m.nDays;
  const from = parse(m.tl.from);
  const sigs = significators(m, id);
  const sigSet = new Set(sigs.map((s) => s.id));
  const series = new Float32Array(n);
  const result: ThemeResult = { id, significators: sigs, series, max: 0, anchorCount: 0, periods: [] };
  if (!n) return result;
  const di = (ms: number) => Math.max(0, Math.min(n - 1, Math.floor((ms - from) / DAY)));
  const triggersAll = m.tl.contacts.filter((c) => c.technique === "transit" || c.technique === "eclipse");

  const all: ThemePeriod[] = [];
  for (const anchor of m.tl.contacts) {
    if (!anchors(id, anchor, sigSet)) continue;
    const points = [anchor.target, ...(anchor.technique === "solar-arc" && m.natal.byId.has(anchor.source as TargetId) && anchor.source !== anchor.target ? [anchor.source as TargetId] : [])];
    for (const w of anchor.windows) {
      const ws = parse(w.start), we = parse(w.end);
      const start = di(ws), end = di(we);
      const triggers: ThemeTrigger[] = [];
      const sum = new Float32Array(end - start + 1);
      for (const c of triggersAll) {
        if (!points.includes(c.target)) continue;
        let dates: string[] = [], exact = true;
        if (c.events) dates = c.events.filter((e) => parse(e.utc) >= ws && parse(e.utc) <= we).map((e) => e.utc);
        else {
          const inside = c.windows.filter((x) => parse(x.end) >= ws && parse(x.start) <= we);
          dates = inside.flatMap((x) => x.exacts.map((e) => e.utc)).filter((u) => parse(u) >= ws && parse(u) <= we);
          if (dates.length === 0 && inside.length > 0) {
            const near = inside.map((x) => x.closest).filter((u) => parse(u) >= ws && parse(u) <= we);
            dates = near.slice(0, 1);
            exact = false;
          }
        }
        if (dates.length === 0) continue;
        triggers.push({ contact: c, dates, exact });
        const s = m.series.get(c.id)!;
        for (let d = start; d <= end; d++) sum[d - start] += s[d] ?? 0;
      }
      triggers.sort((a, b) => parse(a.dates[0]!) - parse(b.dates[0]!));
      let peak: number | null = null;
      if (triggers.length) {
        let best = 0;
        for (let i = 1; i < sum.length; i++) if (sum[i]! > sum[best]!) best = i;
        peak = start + best;
      }
      all.push({ anchor, start, end, startOpen: w.startOpen, endOpen: w.endOpen, exact: w.exacts[0]?.utc ?? null, points, triggers, peak });
    }
  }
  result.anchorCount = all.length;
  const arcFirst = (p: ThemePeriod) => Number(p.anchor.technique === "solar-arc");
  result.periods = all
    .sort((a, b) => arcFirst(b) - arcFirst(a) || Number(!!b.exact) - Number(!!a.exact) || b.triggers.length - a.triggers.length)
    .slice(0, 4)
    .sort((a, b) => arcFirst(b) - arcFirst(a) || a.start - b.start);

  const counted = new Set<string>();
  for (const p of result.periods) {
    const add = (c: TimelineContact, k: number, a: number, b: number) => {
      const key = `${c.id}|${a}|${b}`;
      if (counted.has(key)) return;
      counted.add(key);
      const s = m.series.get(c.id)!;
      for (let d = a; d <= b; d++) series[d] += (s[d] ?? 0) * k;
    };
    add(p.anchor, p.anchor.technique === "solar-arc" ? 2 : 1, p.start, p.end);
    for (const t of p.triggers) add(t.contact, 1, p.start, p.end);
  }
  for (let d = 0; d < n; d++) if (series[d]! > result.max) result.max = series[d]!;
  return result;
}

export const THEME_IDS: ThemeId[] = ["marriage", "career", "accident"];
export const themeAnalysis = (m: ActivationModel) => THEME_IDS.map((id) => themeResult(m, id));
