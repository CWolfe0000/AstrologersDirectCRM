/**
 * Life themes: where the timeline's contacts converge on the natal
 * significators of one topic. Built on the activation model, and always on
 * every contact in the range (the significance filter does not apply).
 *
 * For each theme, a contact counts when it aims at one of the theme's
 * significators and passes the theme's rule:
 *
 * - Marriage and partnership: Venus, the ruler of the 7th, planets in the 7th,
 *   Juno, and conjunctions or oppositions to the Ascendant (the Descendant
 *   axis). Any aspect; lunations left out.
 * - Career success: the Midheaven, the ruler of the 10th, planets in the 10th
 *   and the Sun. Trines and sextiles from anything, and any aspect from
 *   Jupiter, Venus or the Sun; lunations and eclipses left out.
 * - Accident-prone: the Ascendant, the chart ruler, Sun, Moon, Mars and
 *   Uranus. Hard aspects only, and only when Mars, Saturn, Uranus or Pluto is
 *   the mover, natal Mars or Uranus is the target, or it is an eclipse.
 *
 * A period is a run of days where the theme's summed intensity stands out
 * (above the range's mean + 0.75 σ) with at least two such contacts in orb,
 * merged across gaps of up to ten days. The four strongest are kept. Like the
 * density score, this is a counting aid with provisional rules.
 */
import type { BodyId } from "./index";
import type { ActivationModel } from "./activation";
import type { TargetId, TimelineContact, TimelineTechnique } from "./timeline";

export type ThemeId = "marriage" | "career" | "accident";

export interface Significator {
  id: TargetId;
  why: string;
}

export interface ThemePeriod {
  /** Day indexes within the timeline. */
  start: number;
  end: number;
  startOpen: boolean;
  endOpen: boolean;
  peak: number;
  /** Contacts in orb during the period, strongest at the peak first. */
  contacts: TimelineContact[];
  techniques: TimelineTechnique[];
}

export interface ThemeResult {
  id: ThemeId;
  significators: Significator[];
  /** Summed intensity per day, and its maximum in the range. */
  series: Float32Array;
  max: number;
  /** How many counted contacts there are in the range at all. */
  contactCount: number;
  periods: ThemePeriod[];
}

const HARD = new Set(["conjunction", "square", "opposition", "semisquare", "sesquiquadrate", "quincunx"]);
const SOFT = new Set(["trine", "sextile"]);
const HARSH_MOVERS = new Set(["mars", "saturn", "uranus", "pluto"]);
const HELPFUL_MOVERS = new Set(["jupiter", "venus", "sun"]);

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

function counts(theme: ThemeId, c: TimelineContact) {
  if (c.technique === "lunation") return false;
  if (theme === "marriage") return c.target !== "asc" || c.aspect === "conjunction" || c.aspect === "opposition";
  if (theme === "career") return c.technique !== "eclipse" && (SOFT.has(c.aspect) || HELPFUL_MOVERS.has(c.source));
  return HARD.has(c.aspect) && (c.technique === "eclipse" || HARSH_MOVERS.has(c.source) || c.target === "mars" || c.target === "uranus");
}

export function themeResult(m: ActivationModel, id: ThemeId): ThemeResult {
  const n = m.nDays;
  const sigs = significators(m, id);
  const targets = new Set(sigs.map((s) => s.id));
  const used = m.tl.contacts.filter((c) => targets.has(c.target) && counts(id, c));
  const series = new Float32Array(n), active = new Uint16Array(n);
  for (const c of used) {
    const s = m.series.get(c.id)!;
    for (let d = 0; d < n; d++) if (s[d]) { series[d] += s[d]!; active[d]++; }
  }
  let max = 0, sum = 0;
  for (let d = 0; d < n; d++) { sum += series[d]!; if (series[d]! > max) max = series[d]!; }
  const result: ThemeResult = { id, significators: sigs, series, max, contactCount: used.length, periods: [] };
  if (!max || !n) return result;
  const mean = sum / n;
  let v = 0;
  for (let d = 0; d < n; d++) v += (series[d]! - mean) ** 2;
  const threshold = mean + 0.75 * Math.sqrt(v / n);

  const runs: [number, number][] = [];
  for (let d = 0; d < n; d++) {
    if (!(series[d]! > threshold && active[d]! >= 2)) continue;
    const last = runs[runs.length - 1];
    if (last && d - last[1] <= 10) last[1] = d;
    else runs.push([d, d]);
  }
  result.periods = runs
    .filter(([a, b]) => b - a >= 2)
    .map(([a, b]) => {
      let peak = a;
      for (let d = a; d <= b; d++) if (series[d]! > series[peak]!) peak = d;
      const inOrb = (c: TimelineContact) => { const s = m.series.get(c.id)!; for (let d = a; d <= b; d++) if (s[d]) return true; return false; };
      const contacts = used.filter(inOrb).sort((x, y) => m.series.get(y.id)![peak]! - m.series.get(x.id)![peak]! || y.weight - x.weight);
      return { start: a, end: b, startOpen: a === 0, endOpen: b === n - 1, peak, contacts, techniques: [...new Set(contacts.map((c) => c.technique))] };
    })
    .sort((x, y) => series[y.peak]! - series[x.peak]!)
    .slice(0, 4)
    .sort((x, y) => x.start - y.start);
  return result;
}

export const THEME_IDS: ThemeId[] = ["marriage", "career", "accident"];
export const themeAnalysis = (m: ActivationModel) => THEME_IDS.map((id) => themeResult(m, id));
