/**
 * Life themes: periods when one topic of the natal chart is being directed,
 * and what sets it off. Built on the activation model, and always on every
 * contact in the range (the significance filter does not apply).
 *
 * A period is anchored on a direction: the time a solar arc involving one of
 * the theme's significators is in orb, or a secondary progression (other than
 * the Moon's) to the Ascendant or Midheaven. Solar arcs come first because
 * they tend to coincide with a planet's meaning showing up in events;
 * progressions to the angles stand beside them because they proved to time
 * events just as well (a progressed 7th ruler on the Ascendant, a marriage).
 * Other progressions rank after them.
 * The progressed Sun is left out where the same solar arc is present, as the
 * two are one motion. Periods are ranked: these anchors first, then those exact
 * in the range, those involving the topic's ruler, natural significator or
 * angle (over a planet that merely sits in the house), and those repeating a
 * natal aspect. The interface shows the first four and can show the rest.
 *
 * An anchor qualifies when a significator is the natal point it aims at, or
 * (solar arcs only) the planet being directed, and the theme's rule holds:
 *
 * - Marriage and partnership: Venus, the ruler of the 7th, planets in the 7th,
 *   Juno, and the Ascendant–Descendant axis (conjunctions and oppositions
 *   only, when the axis is the only significator involved). Any aspect.
 * - Career: the Midheaven, the ruler of the 10th, planets in the 10th and the
 *   Sun. Any aspect, whichever point is at the other end (the 10th ruler
 *   squaring a 7th-house planet is a career matter as much as a partnership one).
 * - Money: the rulers of the 2nd and 8th, planets in them, Jupiter and Venus.
 * - Home and relocation: the Moon, the rulers of the 4th and 9th, planets in
 *   them, and the IC (conjunctions and oppositions to the Midheaven).
 *   Career, money and home can go either way, so each of their periods has a
 *   tone: helpful (trine, sextile, or a conjunction from Jupiter, Venus or the
 *   Sun), pressure (hard aspects, or a conjunction from Mars, Saturn, Uranus,
 *   Neptune or Pluto) or a turning point. On these three, trines from
 *   transiting Jupiter and Saturn count as triggers even when triggers are
 *   set to hard aspects, because gains proved to arrive on them.
 * - Accident-prone: the Ascendant, the chart ruler, Sun, Moon, Mars and
 *   Uranus. Hard aspects only, and only when Mars, Saturn, Uranus or Pluto is
 *   directed, or natal Mars or Uranus is the target.
 *
 * Everything rests on the natal promise (lib/astro/promise): each theme
 * carries the natal chart's own testimony on the topic, and a direction that
 * repeats a natal aspect between its two points comes before the others, as
 * it brings out something the birth chart already holds.
 *
 * Slow transits and eclipses on the angles also stand as periods of their own,
 * with no direction behind them, because they proved to mark events alone (an
 * eclipse and Jupiter on the Midheaven, leaving employment): Jupiter to Pluto
 * by conjunction, square or opposition, and eclipses by conjunction or
 * opposition, to the Midheaven for career (turning points, favourable or
 * not), to the Ascendant–Descendant axis by conjunction or opposition for
 * marriage, and to the Ascendant from Saturn, Uranus or Pluto, or an eclipse,
 * for accidents. A planet's whole passage, every pass, is one period.
 *
 * Triggers are the transits and eclipses, by hard aspect (conjunction, square,
 * opposition) unless the practice's setting allows every aspect, to the two
 * natal points of the anchor (the point aimed at, and the natal place of the
 * directed planet) while the anchor is in orb. Exact hits from Saturn, Uranus,
 * Neptune and Pluto are marked as the timing: checked against real events,
 * the slow planet's exact date gave the month, where the date the triggers
 * were strongest together did not. Like the density score, this is
 * a counting aid with provisional rules.
 */
import type { BodyId } from "./index";
import type { ActivationModel } from "./activation";
import { natalPromise, type NatalPromise } from "./promise";
import type { AspectId } from "./types";
import type { TargetId, TimelineContact } from "./timeline";

const DAY = 86_400_000;
export type ThemeId = "marriage" | "career" | "money" | "home" | "accident";
/** How a period bears on a topic that can go either way: by soft aspect or a benefic's conjunction; by hard aspect; or a conjunction or eclipse that simply marks a turn. */
export type ThemeTone = "helpful" | "pressure" | "turning";

export interface Significator {
  id: TargetId;
  why: string;
}

export interface ThemeTrigger {
  contact: TimelineContact;
  /** Exact hits (or the eclipses) while the anchor is in orb; when there are none, the closest approach. */
  dates: string[];
  exact: boolean;
  /** An exact hit from Saturn, Uranus, Neptune or Pluto: the closest guide to when. */
  slow: boolean;
}

export interface ThemePeriod {
  /** The solar arc (or progression) the period rests on. */
  anchor: TimelineContact;
  /** What the period rests on. */
  kind: "solar-arc" | "progression-angle" | "progression" | "transit-angle" | "eclipse-angle";
  /** Career, money and home only: whether the period helps, presses or simply turns. */
  tone: ThemeTone | null;
  /** A solar arc, or a progression to an angle. */
  primary: boolean;
  /** Day indexes within the timeline: the anchor's time in orb. */
  start: number;
  end: number;
  startOpen: boolean;
  endOpen: boolean;
  /** When the anchor is exact, if that falls in the range: the first time, and every time. */
  exact: string | null;
  exacts: string[];
  /** The natal aspect between the anchor's two points, when there is one: the direction repeats a natal promise. */
  natalAspect: AspectId | null;
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
  /** What the natal chart itself says about the topic. */
  promise: NatalPromise;
  /** Per day: anchors in orb (solar arcs counted double) plus their triggers; and the maximum. */
  series: Float32Array;
  max: number;
  /** Qualifying anchors in the range. */
  anchorCount: number;
  /** Every period, strongest first. */
  periods: ThemePeriod[];
}

export type ThemeTriggers = "hard" | "all";
const TRIGGER_HARD = new Set(["conjunction", "square", "opposition"]);
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
  } else if (theme === "money") {
    add(n.houseRulers(2)[0], "Ruler of the 2nd");
    n.occupants(2).forEach((id) => add(id, "In the 2nd"));
    add(n.houseRulers(8)[0], "Ruler of the 8th");
    n.occupants(8).forEach((id) => add(id, "In the 8th"));
    add("jupiter", "Jupiter");
    add("venus", "Venus");
  } else if (theme === "home") {
    add("moon", "Moon");
    add(n.houseRulers(4)[0], "Ruler of the 4th");
    n.occupants(4).forEach((id) => add(id, "In the 4th"));
    add(n.houseRulers(9)[0], "Ruler of the 9th");
    n.occupants(9).forEach((id) => add(id, "In the 9th"));
    add("mc", "IC Axis");
  } else {
    add("asc", "Ascendant");
    add(n.chartRuler, "Chart Ruler");
    (["sun", "moon", "mars", "uranus"] as BodyId[]).forEach((id) => add(id, id === "sun" ? "Sun" : id === "moon" ? "Moon" : id === "mars" ? "Mars" : "Uranus"));
  }
  return out;
}

const SLOW = new Set(["saturn", "uranus", "neptune", "pluto"]);
/** A solar arc, or a progression (not the Moon's) to the Ascendant or Midheaven. */
export const isPrimary = (c: TimelineContact) => c.technique === "solar-arc" || (c.technique === "progressed" && c.source !== "moon" && (c.target === "asc" || c.target === "mc"));

/** Themes that can go either way: their periods carry a tone, and trines from Jupiter and Saturn count as triggers. */
const TWO_SIDED = new Set<ThemeId>(["career", "money", "home"]);
export function toneOf(c: TimelineContact): ThemeTone {
  if (c.technique === "eclipse") return "turning";
  if (SOFT.has(c.aspect)) return "helpful";
  if (c.aspect === "conjunction") return HELPFUL_MOVERS.has(c.source) ? "helpful" : HARSH_MOVERS.has(c.source) || c.source === "neptune" ? "pressure" : "turning";
  return "pressure";
}

const ANGLE_MOVERS = new Set(["jupiter", "saturn", "uranus", "neptune", "pluto"]);
/**
 * A slow transit or an eclipse on an angle, standing as a period with no direction behind it:
 * the Midheaven for career, the Ascendant–Descendant axis for marriage, the Ascendant for accidents.
 */
function angleEvent(theme: ThemeId, c: TimelineContact) {
  if (c.target !== "asc" && c.target !== "mc") return false;
  const axis = c.aspect === "conjunction" || c.aspect === "opposition";
  if (c.technique === "eclipse") { if (!axis) return false; }
  else if (c.technique !== "transit" || !ANGLE_MOVERS.has(c.source) || !TRIGGER_HARD.has(c.aspect)) return false;
  if (theme === "career") return c.target === "mc";
  if (theme === "home") return c.target === "mc" && c.aspect === "opposition"; // on the IC
  if (theme === "money") return false;
  if (theme === "marriage") return c.target === "asc" && axis;
  return c.target === "asc" && (c.technique === "eclipse" || HARSH_MOVERS.has(c.source));
}

/** Whether a solar arc or progression anchors a period of this theme. */
function anchors(theme: ThemeId, c: TimelineContact, sigs: Set<TargetId>) {
  if (c.technique !== "solar-arc" && c.technique !== "progressed") return false;
  const involved = [c.target, ...(isPrimary(c) ? [c.source as TargetId] : [])].filter((id) => sigs.has(id));
  if (involved.length === 0) return false;
  if (theme === "marriage") return involved.some((id) => id !== "asc") || c.aspect === "conjunction" || c.aspect === "opposition";
  if (theme === "career" || theme === "money") return true;
  if (theme === "home") return involved.some((id) => id !== "mc") || c.aspect === "conjunction" || c.aspect === "opposition";
  return HARD.has(c.aspect) && (HARSH_MOVERS.has(c.source) || c.target === "mars" || c.target === "uranus");
}


export function themeResult(m: ActivationModel, id: ThemeId, triggerAspects: ThemeTriggers = "hard"): ThemeResult {
  const n = m.nDays;
  const from = parse(m.tl.from);
  const sigs = significators(m, id);
  const sigSet = new Set(sigs.map((s) => s.id));
  const series = new Float32Array(n);
  const result: ThemeResult = { id, significators: sigs, promise: natalPromise(m.natal, id), series, max: 0, anchorCount: 0, periods: [] };
  if (!n) return result;
  const di = (ms: number) => Math.max(0, Math.min(n - 1, Math.floor((ms - from) / DAY)));
  const twoSided = TWO_SIDED.has(id);
  const triggersAll = m.tl.contacts.filter((c) => (c.technique === "transit" || c.technique === "eclipse") && (triggerAspects === "all" || TRIGGER_HARD.has(c.aspect) || (twoSided && c.aspect === "trine" && (c.source === "jupiter" || c.source === "saturn"))));

  const all: ThemePeriod[] = [];
  const arcs = new Set(m.tl.contacts.filter((c) => c.technique === "solar-arc").map((c) => `${c.source}|${c.aspect}|${c.target}`));
  /** A period for an anchor in orb from ws to we, with the transits and eclipses to its points in that time. */
  const build = (anchor: TimelineContact, kind: ThemePeriod["kind"], points: TargetId[], ws: number, we: number, startOpen: boolean, endOpen: boolean, exacts: string[]): ThemePeriod => {
    const start = di(ws), end = di(we);
    const triggers: ThemeTrigger[] = [];
    const sum = new Float32Array(end - start + 1);
    for (const c of triggersAll) {
      if (c === anchor || !points.includes(c.target)) continue;
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
      triggers.push({ contact: c, dates, exact, slow: exact && SLOW.has(c.source) });
      const s = m.series.get(c.id)!;
      for (let d = start; d <= end; d++) sum[d - start] += s[d] ?? 0;
    }
    triggers.sort((x, y) => parse(x.dates[0]!) - parse(y.dates[0]!));
    let peak: number | null = null;
    if (triggers.length) {
      let best = 0;
      for (let i = 1; i < sum.length; i++) if (sum[i]! > sum[best]!) best = i;
      peak = start + best;
    }
    const primary = kind === "solar-arc" || kind === "progression-angle";
    const natalAspect = (primary && anchor.source !== anchor.target ? m.natal.natalAspect(anchor.source as TargetId, anchor.target) : null) as AspectId | null;
    return { anchor, kind, tone: twoSided ? toneOf(anchor) : null, primary, start, end, startOpen, endOpen, exact: exacts[0] ?? null, exacts, natalAspect, points, triggers, peak };
  };

  for (const anchor of m.tl.contacts) {
    if (angleEvent(id, anchor)) {
      if (anchor.events) {
        // Each eclipse on the angle is its own period, for the four weeks it is counted.
        for (const e of anchor.events) all.push(build(anchor, "eclipse-angle", [anchor.target], parse(e.utc), parse(e.utc) + 28 * DAY, false, parse(e.utc) + 28 * DAY > from + n * DAY, [e.utc]));
      } else if (anchor.windows.length) {
        // One period for the whole passage: every pass over the angle, direct and retrograde.
        const first = anchor.windows[0]!, last = anchor.windows[anchor.windows.length - 1]!;
        all.push(build(anchor, "transit-angle", [anchor.target], parse(first.start), parse(last.end), first.startOpen, last.endOpen, anchor.windows.flatMap((w) => w.exacts.map((x) => x.utc))));
      }
      continue;
    }
    if (!anchors(id, anchor, sigSet)) continue;
    if (anchor.technique === "progressed" && anchor.source === "sun" && arcs.has(`sun|${anchor.aspect}|${anchor.target}`)) continue;
    const primary = isPrimary(anchor);
    const kind: ThemePeriod["kind"] = anchor.technique === "solar-arc" ? "solar-arc" : primary ? "progression-angle" : "progression";
    const points = [anchor.target, ...(primary && m.natal.byId.has(anchor.source as TargetId) && anchor.source !== anchor.target ? [anchor.source as TargetId] : [])];
    for (const w of anchor.windows) all.push(build(anchor, kind, points, parse(w.start), parse(w.end), w.startOpen, w.endOpen, w.exacts.map((x) => x.utc)));
  }
  result.anchorCount = all.length;
  // Rank: solar arcs and progressions to angles first; then exact in the range, a direction involving the
  // topic's ruler, natural significator or angle (rather than only a planet that happens to be in the house),
  // and one that repeats a natal aspect; then the number of triggers.
  const principal = new Set(sigs.filter((x) => !x.why.startsWith("In the")).map((x) => x.id));
  const score = (p: ThemePeriod) =>
    (p.primary ? 8 : p.kind === "transit-angle" ? 6 : p.kind === "eclipse-angle" ? 4 : 0) + (p.exact ? 3 : 0) + ([p.anchor.target, ...(p.primary ? [p.anchor.source as TargetId] : [])].some((x) => principal.has(x)) ? 2 : 0) + (p.natalAspect ? 1 : 0);
  result.periods = all.sort((a, b) => score(b) - score(a) || b.triggers.length - a.triggers.length);

  const counted = new Set<string>();
  for (const p of result.periods) {
    const add = (c: TimelineContact, k: number, a: number, b: number) => {
      const key = `${c.id}|${a}|${b}`;
      if (counted.has(key)) return;
      counted.add(key);
      const s = m.series.get(c.id)!;
      for (let d = a; d <= b; d++) series[d] += (s[d] ?? 0) * k;
    };
    add(p.anchor, p.primary ? 2 : 1, p.start, p.end);
    for (const t of p.triggers) add(t.contact, 1, p.start, p.end);
  }
  for (let d = 0; d < n; d++) if (series[d]! > result.max) result.max = series[d]!;
  return result;
}

export const THEME_IDS: ThemeId[] = ["marriage", "career", "money", "home", "accident"];
export const themeAnalysis = (m: ActivationModel, triggerAspects: ThemeTriggers = "hard") => THEME_IDS.map((id) => themeResult(m, id, triggerAspects));
