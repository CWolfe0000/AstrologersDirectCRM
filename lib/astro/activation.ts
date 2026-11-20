/**
 * Client activation: what a convergence timeline is activating in the natal
 * chart on a given day. Built on the timeline's contacts (lib/astro/timeline):
 *
 * - each contact's intensity per day (its weight × how close it is to exact),
 * - planets and angles ranked by the intensity of the contacts they receive,
 * - houses scored through the planets in them, their rulers (modern rulers at
 *   half weight) and, for the 1st and 10th, the Ascendant and Midheaven,
 * - what is intensifying, separating and emerging, and what changed since a date,
 * - clusters: active contacts grouped around a natal point and the points tied
 *   to it by a natal aspect or a rulership,
 * - each contact's lifecycle: first entry into orb, exact passes, final exit.
 *
 * Scores are relative: 100 is the most any planet (or house) reaches in the
 * range. The weights are provisional, like the timeline's own.
 */
import { BODIES, RULERS, SIGNS, signOf, type BodyId } from "./index";
import type { TargetId, TimelineContact, TimelineLayer, TimelineResult } from "./timeline";

const DAY = 86_400_000;
const parse = (s: string) => Date.parse(s.length === 10 ? `${s}T00:00:00Z` : s);

export type Significance = "major" | "moderate" | "all";
const MODERATE_SOURCES = new Set(["saturn", "jupiter", "chiron", "node"]);

export const HOUSE_TOPICS = [
  "Self, Body & Identity", "Money, Values & Resources", "Communication, Siblings & Learning", "Home, Family & Roots", "Creativity, Children & Pleasure", "Work, Health & Routines",
  "Partnerships, Marriage & Contracts", "Shared Resources, Intimacy & Change", "Beliefs, Study & Travel", "Career, Reputation & Public Life", "Friends, Hopes & Networks", "Retreat, Hidden Matters & the Unconscious",
];
export const PLANET_THEMES: Record<TargetId, string> = {
  sun: "identity and vitality", moon: "feelings, needs and security", mercury: "thinking and communication", venus: "love, values and money",
  mars: "drive, courage and initiative", jupiter: "growth and opportunity", saturn: "structure, responsibility and limits", uranus: "change, disruption and independence",
  neptune: "ideals, uncertainty and imagination", pluto: "power, depth and transformation", node: "direction and growth", chiron: "old wounds and healing",
  asc: "self-presentation and the body", mc: "vocation and public life",
  southnode: "the familiar and what is being released", ceres: "nurture, care and loss", pallas: "strategy and pattern-seeing",
  juno: "commitment and partnership", vesta: "devotion and focus", lilith: "the instinctual and the rejected",
  vertex: "fated encounters", fortune: "ease, well-being and resources",
};

/** Which contacts a significance level keeps. */
export function passesSignificance(c: TimelineContact, sig: Significance) {
  if (sig === "all" || c.layer === "background") return true;
  return sig === "moderate" && ((c.technique === "transit" && MODERATE_SOURCES.has(c.source)) || c.technique === "eclipse");
}

/** A day index within a timeline (0 = its first day). */
export function dayIndex(tl: Pick<TimelineResult, "from">, iso: string) {
  return Math.floor((parse(iso) - parse(tl.from)) / DAY);
}

/** Each contact's intensity on each day of the timeline (0 when out of orb). */
export function contactSeries(c: TimelineContact, fromIso: string, nDays: number): Float32Array {
  const from = parse(fromIso);
  const di = (ms: number) => Math.floor((ms - from) / DAY);
  const arr = new Float32Array(nDays);
  if (c.events) {
    const span = c.technique === "eclipse" ? 28 : 7, orb = c.technique === "eclipse" ? 5 : 3;
    for (const e of c.events) {
      const d0 = di(parse(e.utc));
      for (let d = Math.max(0, d0); d < Math.min(nDays, d0 + span); d++) arr[d] += c.weight * (1 - (0.5 * e.orb) / orb);
    }
    return arr;
  }
  for (const w of c.windows) {
    const s = parse(w.start), e = parse(w.end);
    const refs = w.exacts.length ? w.exacts.map((x) => parse(x.utc)) : [parse(w.closest)];
    const top = w.exacts.length ? 1 : Math.max(0.5, 1 - 0.5 * w.minOrb);
    for (let d = Math.max(0, di(s)); d <= Math.min(nDays - 1, di(e)); d++) {
      const t = from + d * DAY + DAY / 2;
      let best = 0;
      for (const r of refs) {
        const half = Math.max(DAY / 4, t < r ? r - s : e - r);
        best = Math.max(best, top * (1 - 0.5 * Math.min(1, Math.abs(t - r) / half)));
      }
      arr[d] = Math.max(arr[d]!, c.weight * best);
    }
  }
  return arr;
}

export interface NatalPoint {
  id: TargetId;
  lon: number;
  house: number | null;
}

/** The natal chart as the timeline sees it, with rulerships. */
export function natalModel(tl: Pick<TimelineResult, "natal" | "cusps">) {
  const points: NatalPoint[] = tl.natal.map((n) => ({ id: n.id, lon: n.lon, house: n.id === "asc" ? 1 : n.id === "mc" ? 10 : n.house }));
  const byId = new Map(points.map((p) => [p.id, p]));
  const cusps = tl.cusps ?? null;
  const houseRulers = (h: number): BodyId[] => {
    if (!cusps) return [];
    const r = RULERS[signOf(cusps[h - 1]!).id];
    return r.modern && r.modern !== r.traditional ? [r.traditional, r.modern] : [r.traditional];
  };
  const ruledBy = (id: TargetId) => (cusps && id !== "asc" && id !== "mc" ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => houseRulers(h).includes(id as BodyId)) : []);
  const occupants = (h: number) => points.filter((p) => p.id !== "asc" && p.id !== "mc" && p.house === h).map((p) => p.id);
  const asc = byId.get("asc");
  const chartRuler = asc ? RULERS[signOf(asc.lon).id].traditional : null;
  const natalAspect = (a: TargetId, b: TargetId) => {
    const pa = byId.get(a), pb = byId.get(b);
    if (!pa || !pb) return null;
    let d = Math.abs(pa.lon - pb.lon) % 360;
    if (d > 180) d = 360 - d;
    const orb = [a, b].some((x) => x === "sun" || x === "moon") ? 8 : 6;
    for (const [id, angle] of [["conjunction", 0], ["opposition", 180], ["square", 90], ["trine", 120], ["sextile", 60]] as const) if (Math.abs(d - angle) <= orb) return id;
    return null;
  };
  return { points, byId, cusps, houseRulers, ruledBy, occupants, chartRuler, natalAspect, hasHouses: !!cusps };
}
export type NatalModel = ReturnType<typeof natalModel>;

export interface HousePart {
  kind: "occupant" | "ruler" | "modern-ruler" | "cusp";
  id: TargetId;
  factor: number;
  value: number;
}

/**
 * Everything the overview needs, for one timeline and significance level:
 * per-contact series, per-point and per-house series, and their range maxima.
 */
export function activationModel(tl: TimelineResult, sig: Significance) {
  const n = tl.days.length;
  const natal = natalModel(tl);
  const contacts = tl.contacts.filter((c) => passesSignificance(c, sig));
  const series = new Map<string, Float32Array>();
  for (const c of tl.contacts) series.set(c.id, contactSeries(c, tl.from, n));
  const pointSeries = new Map<TargetId, Float32Array>(natal.points.map((p) => [p.id, new Float32Array(n)]));
  for (const c of contacts) {
    const s = series.get(c.id)!, out = pointSeries.get(c.target);
    if (out) for (let d = 0; d < n; d++) if (s[d]) out[d] += s[d]!;
  }
  const zero = new Float32Array(n);
  const ps = (id: TargetId) => pointSeries.get(id) ?? zero;
  const houseParts = (h: number, d: number): HousePart[] => {
    const parts: HousePart[] = natal.occupants(h).map((id) => ({ kind: "occupant", id, factor: 1, value: ps(id)[d]! }));
    natal.houseRulers(h).forEach((r, i) => parts.push({ kind: i === 0 ? "ruler" : "modern-ruler", id: r, factor: i === 0 ? 1 : 0.5, value: ps(r)[d]! * (i === 0 ? 1 : 0.5) }));
    if (h === 1 && natal.byId.has("asc")) parts.push({ kind: "cusp", id: "asc", factor: 1, value: ps("asc")[d]! });
    if (h === 10 && natal.byId.has("mc")) parts.push({ kind: "cusp", id: "mc", factor: 1, value: ps("mc")[d]! });
    return parts;
  };
  const houseSeries = natal.hasHouses
    ? Array.from({ length: 12 }, (_, i) => {
        const s = new Float32Array(n);
        for (let d = 0; d < n; d++) s[d] = houseParts(i + 1, d).reduce((a, p) => a + p.value, 0);
        return s;
      })
    : [];
  const max = (arrs: Float32Array[]) => {
    let m = 0;
    for (const a of arrs) for (let d = 0; d < n; d++) if (a[d]! > m) m = a[d]!;
    return m || 1;
  };
  const pointMax = max([...pointSeries.values()]);
  const houseMax = max(houseSeries);
  return { tl, natal, contacts, series, ps, houseParts, houseSeries, pointMax, houseMax, nDays: n };
}
export type ActivationModel = ReturnType<typeof activationModel>;

/** 0–100 on the range's own scale. */
export const scale = (v: number, max: number) => Math.round((v / max) * 100);

/** Rising / easing / steady, comparing today with two weeks on. */
export function trendOf(s: Float32Array, d: number): "rising" | "easing" | "steady" {
  const now = s[d] ?? 0, later = s[Math.min(s.length - 1, d + 14)] ?? 0;
  if (later > now * 1.12 + 0.05) return "rising";
  if (later < now * 0.88 - 0.05) return "easing";
  return "steady";
}

/** The stretch around day d (or the next one) where a series is at least half its range peak. */
export function heightened(s: Float32Array, d: number): [number, number] | null {
  let peak = 0;
  for (const v of s) if (v > peak) peak = v;
  if (!peak) return null;
  const thr = peak * 0.5;
  let i = d;
  if (s[i]! < thr) {
    while (i < s.length && s[i]! < thr) i++;
    if (i >= s.length) return null;
  }
  let a = i, b = i;
  while (a > 0 && s[a - 1]! >= thr) a--;
  while (b < s.length - 1 && s[b + 1]! >= thr) b++;
  return [a, b];
}

export function rankPoints(m: ActivationModel, d: number) {
  return m.natal.points
    .map((p) => ({ id: p.id, value: m.ps(p.id)[d] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .map((x) => ({ ...x, score: scale(x.value, m.pointMax), trend: trendOf(m.ps(x.id), d) }));
}

export function rankHouses(m: ActivationModel, d: number) {
  return m.houseSeries.map((s, i) => ({ house: i + 1, value: s[d] ?? 0, score: scale(s[d] ?? 0, m.houseMax), trend: trendOf(s, d) }));
}

/** Active contacts on day d, strongest first. */
export function activeOn(m: ActivationModel, d: number, pred: (c: TimelineContact) => boolean = () => true) {
  return m.contacts.filter((c) => (m.series.get(c.id)![d] ?? 0) > 0 && pred(c)).sort((a, b) => m.series.get(b.id)![d]! - m.series.get(a.id)![d]!);
}

// ---------------------------------------------------------------------------
// Lifecycle

export interface Lifecycle {
  first: number;
  firstOpen: boolean;
  last: number;
  lastOpen: boolean;
  exacts: { t: number; retrograde: boolean }[];
  stations: { t: number; kind: "retrograde" | "direct" }[];
  phase: string;
  inOrb: boolean;
  next: { t: number; retrograde: boolean } | null;
  /** End of the current pass, when in orb. */
  passEnd: number | null;
  /** The whole passes this lifecycle is built from (not cut to the range when the full cycle is known). */
  windows: TimelineContact["windows"];
  /** Moves one way only (solar arcs, the progressed Sun): always a single pass. */
  single: boolean;
}

/** Solar arcs and the progressed Sun never turn retrograde: one entry, one exact, one exit. */
export const singlePass = (c: Pick<TimelineContact, "technique" | "source">) => c.technique === "solar-arc" || (c.technique === "progressed" && c.source === "sun");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (ms: number) => { const d = new Date(ms); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
/** "5 days", "6 weeks", "7 months", "2 years". */
export function spanWords(ms: number) {
  const d = Math.round(Math.abs(ms) / DAY);
  const n = (k: number, w: string) => `${k} ${w}${k === 1 ? "" : "s"}`;
  if (d < 14) return n(d, "day");
  if (d < 63) return n(Math.round(d / 7), "week");
  const months = Math.round(d / 30.44);
  if (months < 24) return n(months, "month");
  return n(Math.round(d / 365.25), "year");
}

/**
 * One cycle of a contact: its passes through orb that are less than a year
 * apart (retrograde loops), around a moment. Windows from two adjoining
 * calculations are joined where one ends exactly as the next begins.
 */
export function cycleAround(windows: TimelineContact["windows"], at: number, gapDays = 400): TimelineContact["windows"] {
  const sorted = [...windows].sort((x, y) => parse(x.start) - parse(y.start));
  const joined: TimelineContact["windows"] = [];
  for (const w of sorted) {
    const last = joined[joined.length - 1];
    // Join where one calculation's window runs to its edge and the next one's starts there (touching or overlapping).
    if (last && last.endOpen && w.startOpen && parse(w.start) <= parse(last.end) + DAY && parse(w.end) >= parse(last.end) - DAY) {
      const near = (a: string, b: string) => Math.abs(parse(a) - parse(b)) < 3_600_000;
      joined[joined.length - 1] = {
        ...last,
        end: parse(w.end) > parse(last.end) ? w.end : last.end,
        endOpen: parse(w.end) > parse(last.end) ? w.endOpen : last.endOpen,
        exacts: [...last.exacts, ...w.exacts.filter((x) => !last.exacts.some((y) => near(x.utc, y.utc)))].map((x, i) => ({ ...x, pass: i + 1 })),
        stations: [...last.stations, ...w.stations.filter((x) => !last.stations.some((y) => near(x.utc, y.utc)))],
        minOrb: Math.min(last.minOrb, w.minOrb),
        closest: last.minOrb <= w.minOrb ? last.closest : w.closest,
      };
    } else joined.push(w);
  }
  const groups: TimelineContact["windows"][] = [];
  for (const w of joined) {
    const g = groups[groups.length - 1];
    if (g && parse(w.start) - parse(g[g.length - 1]!.end) < gapDays * DAY) g.push(w);
    else groups.push([w]);
  }
  if (!groups.length) return [];
  const dist = (g: TimelineContact["windows"]) => (at < parse(g[0]!.start) ? parse(g[0]!.start) - at : at > parse(g[g.length - 1]!.end) ? at - parse(g[g.length - 1]!.end) : 0);
  return groups.reduce((best, g) => (dist(g) < dist(best) ? g : best));
}

export function lifecycleOf(c: TimelineContact, at: number): Lifecycle | null {
  if (c.events || c.windows.length === 0) return null;
  const single = singlePass(c);
  // Whole passes when they're known (progressions, solar arcs); a one-way contact is one pass, so no grouping.
  const windows = c.cycle?.length ? cycleAround(c.cycle, at, single ? 0 : 400) : c.windows;
  if (!windows.length) return null;
  const w0 = windows[0]!, wn = windows[windows.length - 1]!;
  const exacts = windows.flatMap((w) => w.exacts.map((x) => ({ t: parse(x.utc), retrograde: x.retrograde })));
  const stations = windows.flatMap((w) => w.stations.map((s) => ({ t: parse(s.utc), kind: s.kind })));
  const cur = windows.find((w) => parse(w.start) <= at && at <= parse(w.end));
  const next = exacts.find((x) => x.t > at) ?? null;
  let phase: string;
  if (cur && single && cur.exacts.length) {
    const ex = parse(cur.exacts[0]!.utc);
    const until = `in orb until ${cur.endOpen ? "after " : ""}${monthYear(parse(cur.end))}`;
    phase = monthYear(ex) === monthYear(at) ? "Exact this month" : ex > at ? `Applying, exact in ${spanWords(ex - at)} (${monthYear(ex)})` : `Separating, exact ${spanWords(at - ex)} ago, ${until}`;
  } else if (cur) {
    const ahead = cur.exacts.some((x) => parse(x.utc) > at);
    // A pass cut off by the edge of the calculation may perfect beyond it: only say it doesn't when the whole pass is known.
    phase = ahead ? "Applying" : cur.exacts.length ? "Separating" : parse(cur.closest) > at ? (cur.endOpen ? "Applying" : "Applying (Won’t Perfect This Pass)") : cur.startOpen ? "Separating" : "Separating (Didn’t Perfect This Pass)";
  } else phase = parse(w0.start) > at ? "Not Yet In Orb" : parse(wn.end) < at ? "Complete" : "Out of Orb Between Passes";
  return { first: parse(w0.start), firstOpen: w0.startOpen, last: parse(wn.end), lastOpen: wn.endOpen, exacts, stations, phase, inOrb: !!cur, next, passEnd: cur ? parse(cur.end) : null, windows, single };
}

// ---------------------------------------------------------------------------
// What's changing

export interface Change {
  contact: TimelineContact;
  /** The date that matters: next exact, leaving orb, or entering orb. */
  at: number;
  final?: boolean;
}

export function changesAt(m: ActivationModel, d: number, horizonDays = 45) {
  const t = parse(m.tl.from) + d * DAY + DAY / 2;
  const intensifying: Change[] = [], separating: Change[] = [], emerging: Change[] = [];
  for (const c of m.contacts) {
    if (c.technique === "lunation") continue;
    if (c.events) {
      const e = c.events.map((x) => parse(x.utc)).find((x) => x > t && x - t < horizonDays * DAY);
      if (e) emerging.push({ contact: c, at: e });
      continue;
    }
    const L = lifecycleOf(c, t)!;
    if (L.inOrb) {
      if (L.next && L.passEnd !== null && L.passEnd >= L.next.t) intensifying.push({ contact: c, at: L.next.t });
      else separating.push({ contact: c, at: L.passEnd!, final: !L.next });
    } else {
      const w = c.windows.find((w) => parse(w.start) > t && parse(w.start) - t < horizonDays * DAY);
      if (w) emerging.push({ contact: c, at: parse(w.start) });
    }
  }
  const byDate = (a: Change, b: Change) => a.at - b.at;
  return { intensifying: intensifying.sort(byDate), separating: separating.sort(byDate), emerging: emerging.sort(byDate) };
}

/** Compared with an earlier day: contacts that came into orb, left orb, or stayed. */
export function changesSince(m: ActivationModel, from: number, d: number) {
  const on = (c: TimelineContact, x: number) => (m.series.get(c.id)![x] ?? 0) > 0;
  const list = m.contacts.filter((c) => c.technique !== "lunation" && c.technique !== "eclipse");
  const strength = (a: TimelineContact, b: TimelineContact) => b.weight - a.weight;
  return {
    started: list.filter((c) => !on(c, from) && on(c, d)).sort(strength),
    ended: list.filter((c) => on(c, from) && !on(c, d)).sort(strength),
    continuing: list.filter((c) => on(c, from) && on(c, d)).sort((a, b) => m.series.get(b.id)![d]! - m.series.get(a.id)![d]!),
  };
}

/** The next exact hit after a moment, among the kept contacts. */
export function nextExact(m: ActivationModel, at: number) {
  let best: { contact: TimelineContact; t: number } | null = null;
  for (const c of m.contacts) {
    if (c.events) continue;
    for (const w of c.windows) for (const x of w.exacts) {
      const t = parse(x.utc);
      if (t > at && (!best || t < best.t)) best = { contact: c, t };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Clusters

export interface Cluster {
  targets: TargetId[];
  contacts: TimelineContact[];
  links: { a: TargetId; b: TargetId; why: string[] }[];
  techniques: string[];
  /** Days around d when at least two of the contacts are in orb together. */
  span: [number, number];
  /** Houses involved (where the points are, and what they rule), most involved first. */
  houses: number[];
  /** How each house was weighted: 2 for each point in it, 1 for each point ruling it. */
  houseWeights: [number, number][];
  total: number;
}

const TECH_NAME = { transit: "transits", progressed: "progressions", "solar-arc": "solar arcs", lunation: "lunations", eclipse: "eclipses" } as const;
const ord = (n: number) => n + (["th", "st", "nd", "rd"][((n % 100) - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");

/**
 * Groups the active contacts on day d around the most strongly activated natal
 * points: each group is a point plus up to three active points tied to it by a
 * natal aspect or a rulership. Links aren't chained, which would merge most of the chart.
 */
export function clustersAt(m: ActivationModel, d: number, limit = 4): Cluster[] {
  const act = activeOn(m, d, (c) => c.technique !== "lunation");
  const N = m.natal;
  const weight = (t: TargetId) => act.filter((c) => c.target === t).reduce((s, c) => s + m.series.get(c.id)![d]!, 0);
  const name = (t: TargetId) => BODIES[t].name;
  const why = (a: TargetId, b: TargetId) => {
    const out: string[] = [];
    const asp = N.natalAspect(a, b);
    if (asp) out.push(`Natal ${name(a)} ${asp === "conjunction" ? "conjunct" : asp === "opposition" ? "opposite" : asp} ${name(b)}`);
    const hb = N.byId.get(b)?.house, ha = N.byId.get(a)?.house;
    if (hb && b !== "asc" && b !== "mc" && N.ruledBy(a).includes(hb)) out.push(`${name(a)} rules the ${ord(hb)}, where ${name(b)} is`);
    if (ha && a !== "asc" && a !== "mc" && N.ruledBy(b).includes(ha)) out.push(`${name(b)} rules the ${ord(ha)}, where ${name(a)} is`);
    return out;
  };
  const seeds = [...new Set(act.map((c) => c.target))].sort((x, y) => weight(y) - weight(x));
  const used = new Set<TargetId>();
  const out: Cluster[] = [];
  for (const s of seeds) {
    if (used.has(s)) continue;
    const mates = seeds.filter((t) => t !== s && !used.has(t) && why(s, t).length).slice(0, 3);
    const targets = [s, ...mates];
    targets.forEach((t) => used.add(t));
    const cs = act.filter((c) => targets.includes(c.target));
    if (cs.length < 2) continue;
    const together = (x: number) => cs.filter((c) => (m.series.get(c.id)![x] ?? 0) > 0).length >= 2;
    let a = d, b = d;
    while (a > 0 && together(a - 1)) a--;
    while (b < m.nDays - 1 && together(b + 1)) b++;
    const areas = new Map<number, number>();
    const add = (h: number, w: number) => areas.set(h, (areas.get(h) ?? 0) + w);
    for (const t of targets) {
      const h = N.byId.get(t)?.house;
      if (h) add(h, 2);
      for (const r of N.ruledBy(t)) add(r, 1);
    }
    out.push({
      targets,
      contacts: cs,
      links: mates.map((b2) => ({ a: s, b: b2, why: why(s, b2) })),
      techniques: [...new Set(cs.map((c) => TECH_NAME[c.technique]))],
      span: [a, b],
      houses: [...areas.entries()].sort((x, y) => y[1] - x[1]).map(([h]) => h),
      houseWeights: [...areas.entries()].sort((x, y) => y[1] - x[1]),
      total: cs.reduce((acc, c) => acc + m.series.get(c.id)![d]!, 0),
    });
    if (out.length >= limit) break;
  }
  return out.sort((x, y) => y.total - x.total);
}

/** A plain-language summary built from planet and house meanings: no AI, every part traceable. */
export function clusterThemes(cl: Cluster) {
  const list = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
  const points = cl.targets.slice(0, 3).map((t) => `natal ${BODIES[t].name} (${PLANET_THEMES[t]})`);
  const sources = [...new Set(cl.contacts.slice(0, 4).map((c) => (c.technique === "eclipse" ? "eclipse" : (c.source as TargetId))))];
  const srcText = sources.map((s) => (s === "eclipse" ? "an eclipse (a turning point)" : `${BODIES[s as TargetId].name} (${PLANET_THEMES[s as TargetId]})`));
  const areas = cl.houses.slice(0, 3).map((h) => HOUSE_TOPICS[h - 1]!.toLowerCase());
  const lead = list(points);
  return `${lead.charAt(0).toUpperCase()}${lead.slice(1)} ${cl.targets.length > 1 ? "are" : "is"} activated together.${areas.length ? ` Through the houses involved, this touches ${list(areas)}.` : ""} The activating planets bring ${list(srcText)}.`;
}

/** The first word of a house's topics, for short titles: "Career, Reputation & Public Life" → "Career". */
export const houseShort = (h: number) => HOUSE_TOPICS[h - 1]!.split(/,| &/)[0]!;

export const clusterTitle = (cl: Cluster) => {
  const t = cl.houses.slice(0, 3).map(houseShort);
  return t.length ? (t.length === 1 ? t[0]! : `${t.slice(0, -1).join(", ")} & ${t[t.length - 1]}`) : cl.targets.map((x) => `Natal ${BODIES[x].name}`).join(" & ");
};

export const signName = (lon: number) => SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)]!.name;
export type { TimelineLayer };
