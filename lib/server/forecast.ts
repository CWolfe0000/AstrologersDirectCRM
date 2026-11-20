import "server-only";
/**
 * Forecast windows: when the techniques agree on a theme (money, career,
 * home, love). For each chart it scans, day by day, the slow planets'
 * transits to the theme's points and midpoints; week by week, secondary
 * progressions and solar arcs to the same; eclipses on the points; and, for a
 * person, the year's profection, firdaria and zodiacal releasing. Every hit is
 * kept as evidence; months are scored by adding the hits' weights, and runs of
 * high-scoring months become windows. With two people it also scans the
 * composite and Davison charts and ranks windows by how many charts agree.
 * The weights are provisional conventions, returned with the result.
 */
import type { BirthData, BodyId, ChartPoints, ChartSettings } from "@/lib/astro/types";
import { DOMICILE, ageOn, firdaria, isDayChart, lots, profection, releasingL1, releasingL2 } from "@/lib/astro/traditional";
import { midpoint, n360 } from "@/lib/astro/midpoints";
import { birthUtc, natalChart } from "./astro";
import { bodiesAt, housesFromRamc, housesAt, jdToUtc, lunationsBetween, obliquityAt } from "./swiss";

export const THEMES = {
  money: { label: "Money", houses: [2, 11], natural: ["venus", "jupiter"], lot: "fortune", mids: [["venus", "jupiter"], ["jupiter", "pluto"], ["sun", "jupiter"], ["venus", "fortune"]] },
  career: { label: "Career & Reputation", houses: [10], natural: ["sun", "jupiter"], lot: "spirit", mids: [["jupiter", "mc"], ["sun", "mc"], ["sun", "jupiter"]] },
  home: { label: "Home & Family", houses: [4], natural: ["moon"], lot: "fortune", mids: [["moon", "venus"], ["moon", "jupiter"]] },
  love: { label: "Love & Marriage", houses: [7], natural: ["venus"], lot: "fortune", mids: [["venus", "mars"], ["sun", "moon"], ["venus", "jupiter"]] },
} as const;
export type Theme = keyof typeof THEMES;

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const NAMES: Record<string, string> = { sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto", node: "North Node", asc: "Ascendant", mc: "Midheaven", dsc: "Descendant", ic: "IC", fortune: "Part of Fortune", spirit: "Lot of Spirit" };
const nm = (k: string) => NAMES[k] ?? k;
const sep = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);
const DAY = 86_400_000, YEAR = 365.2422 * DAY;
const d10 = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

type Tone = "+" | "~" | "-";
export interface FEvent { date: string; start?: string; end?: string; chart: string; kind: "transit" | "direction" | "eclipse" | "timing"; text: string; tone: Tone; weight: number; themes: Theme[] }
interface Target { key: string; label: string; lon: number; themes: Set<Theme>; mid: boolean }
interface ChartLike { points: Record<string, number>; ascSign: number }

const ASPECTS = [[0, "Conjunct"], [60, "Sextile"], [90, "Square"], [120, "Trine"], [180, "Opposite"]] as const;
const HARD = [[0, "Conjunct"], [45, "Semisquare"], [90, "Square"], [135, "Sesquiquadrate"], [180, "Opposite"]] as const;

function chartLike(p: ChartPoints): ChartLike {
  const points: Record<string, number> = { asc: p.asc, mc: p.mc, dsc: n360(p.asc + 180), ic: n360(p.mc + 180) };
  for (const b of p.bodies) if (["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"].includes(b.id)) points[b.id] = b.lon;
  const L = lots(p);
  points.fortune = L.fortune;
  points.spirit = L.spirit;
  return { points, ascSign: Math.floor(p.asc / 30) };
}

/** The points and midpoints each theme watches in a chart (whole-sign houses from the Ascendant). */
function targetsFor(c: ChartLike, themes: Theme[]): Target[] {
  const map = new Map<string, Target>();
  const add = (key: string, label: string, lon: number, t: Theme, mid = false) => {
    const x = map.get(key) ?? { key, label, lon, themes: new Set<Theme>(), mid };
    x.themes.add(t);
    map.set(key, x);
  };
  for (const t of themes) {
    const def = THEMES[t];
    for (const n of def.natural) add(n, nm(n), c.points[n]!, t);
    for (const h of def.houses) {
      const sign = (c.ascSign + h - 1) % 12;
      const ruler = DOMICILE[sign]!;
      add(ruler, `${nm(ruler)} (Ruler of the ${ordinal(h)})`, c.points[ruler]!, t);
      for (const [k, v] of Object.entries(c.points)) if (["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"].includes(k) && Math.floor(v / 30) === sign) add(k, `${nm(k)} (In the ${ordinal(h)})`, v, t);
    }
    if (t === "career") { add("mc", "Midheaven", c.points.mc!, t); add("spirit", "Lot of Spirit", c.points.spirit!, t); }
    if (t === "home") add("ic", "IC", c.points.ic!, t);
    if (t === "love") add("dsc", "Descendant", c.points.dsc!, t);
    if (t === "money") add("fortune", "Part of Fortune", c.points.fortune!, t);
    for (const [a, b] of def.mids) add(`${a}/${b}`, `${nm(a)}/${nm(b)} Midpoint`, midpoint(c.points[a]!, c.points[b]!), t, true);
  }
  return [...map.values()];
}

/** How a moving planet's contact reads: tone and weight. */
function transitTone(mover: string, angle: number, target: Target): { tone: Tone; w: number } | null {
  const soft = angle === 60 || angle === 120;
  const angleTarget = ["asc", "mc", "dsc", "ic"].includes(target.key);
  if (target.mid) {
    if (mover === "jupiter") return { tone: "+", w: 1.5 };
    if (mover === "uranus" || mover === "pluto") return { tone: "~", w: 1 };
    return { tone: "-", w: -1 };
  }
  switch (mover) {
    case "jupiter": return { tone: "+", w: angle === 0 ? 3 : soft ? 2 : 1.5 };
    case "saturn": return soft ? { tone: "+", w: 1.5 } : angleTarget ? { tone: "~", w: 1 } : { tone: "-", w: -1.5 };
    case "uranus": return soft ? { tone: "+", w: 1 } : { tone: "~", w: 0.75 };
    case "neptune": return soft ? { tone: "+", w: 1 } : { tone: "-", w: -1 };
    case "pluto": return soft ? { tone: "+", w: 1 } : angle === 0 ? { tone: "~", w: 1 } : { tone: "-", w: -1 };
  }
  return null;
}
function directionTone(base: string, angle: number, target: Target): { tone: Tone; w: number } | null {
  const soft = angle === 60 || angle === 120;
  if (target.mid) return ["venus", "jupiter", "sun", "moon", "asc", "mc"].includes(base) ? { tone: "+", w: 2 } : ["saturn", "neptune"].includes(base) ? { tone: "-", w: -1.5 } : { tone: "~", w: 1 };
  if (["venus", "jupiter", "sun", "moon", "asc", "mc"].includes(base)) return { tone: "+", w: angle === 0 || angle === 180 ? 3 : 2 };
  if (base === "mars" || base === "uranus") return soft ? { tone: "+", w: 1 } : { tone: "~", w: 1 };
  if (base === "pluto") return soft ? { tone: "+", w: 1 } : angle === 0 ? { tone: "~", w: 1.5 } : { tone: "-", w: -2 };
  if (base === "saturn" || base === "neptune") return soft ? { tone: "+", w: 1 } : { tone: "-", w: -2 };
  return null;
}

const SLOW = ["jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
type Day = { t: string; ms: number; b: Record<string, number> };

function transitEvents(chart: string, targets: Target[], days: Day[]): FEvent[] {
  const out: FEvent[] = [];
  for (const m of SLOW) for (const tg of targets) for (const [a, an] of tg.mid ? HARD : ASPECTS) {
    const orbMax = tg.mid ? 0.5 : 1;
    let run: { st: string; best: number; bt: string } | null = null;
    for (let i = 0; i < days.length; i++) {
      const o = Math.abs(sep(days[i]!.b[m]!, tg.lon) - a);
      if (o <= orbMax) { run ??= { st: days[i]!.t, best: 9, bt: "" }; if (o < run.best) { run.best = o; run.bt = days[i]!.t; } }
      if (run && (o > orbMax || i === days.length - 1)) {
        const tone = transitTone(m, a, tg);
        if (tone) out.push({ date: run.bt, start: run.st, end: days[i]!.t, chart, kind: "transit", text: `Transiting ${nm(m)} ${an} ${chart === "You" || chart === "Them" ? "Natal " : ""}${tg.label} (${run.best.toFixed(2)}°)`, tone: tone.tone, weight: tone.w, themes: [...tg.themes] });
        run = null;
      }
    }
  }
  return out;
}

type Series = Record<string, { t: string; v: number }[]>;
/** Weekly secondary progressions and solar arcs for a birth (fast: Sun/Moon/Venus/Mars progressed; arc applied to natal). */
function directionSeries(birth: { utc: string; lat: number; lon: number }, natal: Record<string, number>, zodiac: ChartSettings["zodiac"], from: number, to: number): Series {
  const s: Series = {};
  const h = housesAt(birth.utc, birth.lat, birth.lon, "equal", zodiac);
  const eps = obliquityAt(birth.utc);
  const b0 = Date.parse(birth.utc);
  for (let t = from; t <= to; t += 7 * DAY) {
    const date = d10(t);
    const prog = bodiesAt(new Date(b0 + ((t - b0) / YEAR) * DAY).toISOString(), { zodiac, bodies: ["sun", "moon", "venus", "mars"] });
    const arc = n360(prog.sun!.lon - natal.sun!);
    const pr = housesFromRamc(n360(h.ramc + arc), birth.lat, eps, "equal");
    const add = (k: string, v: number) => (s[k] ??= []).push({ t: date, v });
    for (const id of ["sun", "moon", "venus", "mars"] as const) add(`P.${id}`, prog[id]!.lon);
    add("P.asc", pr.asc); add("P.mc", pr.mc);
    for (const id of ["sun", "moon", "venus", "jupiter", "saturn", "uranus", "neptune", "pluto", "asc", "mc"]) add(`SA.${id}`, n360(natal[id]! + arc));
  }
  return s;
}
function directionEvents(chart: string, targets: Target[], series: Series): FEvent[] {
  const out: FEvent[] = [];
  for (const [k, arr] of Object.entries(series)) {
    const [kind, base] = k.split(".") as [string, string];
    for (const tg of targets) {
      if (kind === "SA" && tg.key === base) continue; // a planet directed to its own place is just the arc
      if (kind === "P" && base === "sun" && tg.key === "sun") continue;
      for (const [a, an] of tg.mid ? HARD : ASPECTS) {
        let best = 9, bt = "";
        for (const x of arr) { const o = Math.abs(sep(x.v, tg.lon) - a); if (o < best) { best = o; bt = x.t; } }
        const orbMax = base === "moon" && kind === "P" ? 0.6 : 0.3;
        if (best > orbMax) continue;
        const tone = directionTone(base, a, tg);
        if (!tone) continue;
        out.push({ date: bt, chart, kind: "direction", text: `${kind === "P" ? "Progressed" : "Solar Arc"} ${nm(base)} ${an} ${tg.label} (${best.toFixed(2)}°)`, tone: tone.tone, weight: tone.w, themes: [...tg.themes] });
      }
    }
  }
  return out;
}

function eclipseEvents(chart: string, targets: Target[], eclipses: { date: string; lon: number; kind: string }[]): FEvent[] {
  const out: FEvent[] = [];
  for (const e of eclipses) for (const tg of targets) {
    if (tg.mid) continue;
    for (const [a, an] of [[0, "Conjunct"], [180, "Opposite"], [90, "Square"]] as const) {
      const o = Math.abs(sep(e.lon, tg.lon) - a);
      if (o <= (a === 90 ? 1.5 : 3)) out.push({ date: e.date, chart, kind: "eclipse", text: `${e.kind} Eclipse ${an} ${tg.label} (${o.toFixed(1)}°)`, tone: "~", weight: a === 90 ? 0.5 : 1, themes: [...tg.themes] });
    }
  }
  return out;
}

/** Profections, firdaria and zodiacal releasing, as monthly weights with a note. */
function timingEvents(chart: string, p: ChartPoints, utc: string, themes: Theme[], from: number, to: number): FEvent[] {
  const out: FEvent[] = [];
  const asc = Math.floor(p.asc / 30);
  const rulers = (t: Theme) => THEMES[t].houses.map((h) => DOMICILE[(asc + h - 1) % 12]!);
  for (let age = ageOn(utc, d10(from)); ; age++) {
    const start = Date.parse(utc) + age * YEAR;
    if (start > to) break;
    const pr = profection(p.asc, age);
    for (const t of themes) {
      const inHouse = (THEMES[t].houses as readonly number[]).includes(pr.house);
      const lordFits = rulers(t).includes(pr.lord) || (THEMES[t].natural as readonly string[]).includes(pr.lord);
      if (inHouse || lordFits) out.push({ date: d10(Math.max(start, from)), start: d10(start), end: d10(start + YEAR), chart, kind: "timing", text: `Profection Year: ${ordinal(pr.house)} House (${SIGNS[pr.sign]}), lord ${nm(pr.lord)}${inHouse ? ` (a ${THEMES[t].label} House)` : ""}`, tone: "+", weight: inHouse ? 1.5 : 0.5, themes: [t] });
    }
  }
  for (const fd of firdaria(utc, isDayChart(p))) for (const s of fd.subs) {
    if (s.end < from || s.start > to) continue;
    for (const t of themes) if (rulers(t).includes(s.lord) || (THEMES[t].natural as readonly string[]).includes(s.lord))
      out.push({ date: d10(Math.max(s.start, from)), start: d10(s.start), end: d10(s.end), chart, kind: "timing", text: `Firdaria: ${nm(fd.lord)} Period, ${nm(s.lord)} Sub-Period`, tone: "+", weight: 0.5, themes: [t] });
  }
  const L = lots(p);
  const fs = Math.floor(L.fortune / 30);
  for (const t of themes) {
    const lot = THEMES[t].lot === "spirit" ? L.spirit : L.fortune;
    for (const l1 of releasingL1(lot, utc)) {
      if (l1.end < from || l1.start > to) continue;
      for (const l2 of releasingL2(l1)) {
        if (l2.end < from || l2.start > to) continue;
        const rel = ((l2.sign - fs + 12) % 12) + 1;
        const lotName = THEMES[t].lot === "spirit" ? "Spirit" : "Fortune";
        if ([1, 4, 7, 10].includes(rel)) out.push({ date: d10(Math.max(l2.start, from)), start: d10(l2.start), end: d10(l2.end), chart, kind: "timing", text: `Zodiacal Releasing From ${lotName}: Peak Period in ${SIGNS[l2.sign]}`, tone: "+", weight: rel === 10 ? 1.5 : 1, themes: [t] });
        if (l2.loosed) out.push({ date: d10(l2.start), chart, kind: "timing", text: `Zodiacal Releasing From ${lotName}: Loosing of the Bond (a Turning Point) Into ${SIGNS[l2.sign]}`, tone: "~", weight: 0.5, themes: [t] });
      }
    }
  }
  return out;
}

function retrogrades(days: Day[]) {
  const out: { planet: string; start: string; end: string; startLon: number; endLon: number }[] = [];
  for (const pl of ["mercury", "venus"]) {
    let cur: { start: string; startLon: number } | null = null;
    for (let i = 1; i < days.length; i++) {
      const rx = ((((days[i]!.b[pl]! - days[i - 1]!.b[pl]!) % 360) + 540) % 360) - 180 < 0;
      if (rx && !cur) cur = { start: days[i - 1]!.t, startLon: days[i - 1]!.b[pl]! };
      if (!rx && cur) { out.push({ planet: nm(pl), start: cur.start, end: days[i - 1]!.t, startLon: cur.startLon, endLon: days[i - 1]!.b[pl]! }); cur = null; }
    }
    if (cur) out.push({ planet: nm(pl), start: cur.start, end: days.at(-1)!.t, startLon: cur.startLon, endLon: days.at(-1)!.b[pl]! });
  }
  return out.sort((a, b) => (a.start < b.start ? -1 : 1));
}

function monthsBetween(from: number, to: number) {
  const out: string[] = [];
  const d = new Date(from);
  d.setUTCDate(1);
  while (d.getTime() <= to) { out.push(d.toISOString().slice(0, 7)); d.setUTCMonth(d.getUTCMonth() + 1); }
  return out;
}

/** Monthly scores per theme (and per chart), then windows of consecutive strong months. */
function score(events: FEvent[], themes: Theme[], months: string[], charts: string[]) {
  const res: Record<string, { monthly: { month: string; score: number; pos: number; neg: number; charts: Record<string, number> }[]; windows: { from: string; to: string; score: number; charts: number; peak: string }[] }> = {};
  for (const t of themes) {
    const monthly = months.map((m) => ({ month: m, score: 0, pos: 0, neg: 0, charts: Object.fromEntries(charts.map((c) => [c, 0])) as Record<string, number> }));
    const idx = (d: string) => months.indexOf(d.slice(0, 7));
    for (const e of events) {
      if (!e.themes.includes(t)) continue;
      const spread: [number, number][] = [];
      if (e.kind === "timing" && e.start && e.end) {
        // Spread over the period's months, at a modest monthly weight.
        for (let i = 0; i < months.length; i++) if (months[i]! >= e.start.slice(0, 7) && months[i]! <= e.end.slice(0, 7)) spread.push([i, e.weight * 0.5]);
      } else {
        const i = idx(e.date);
        if (i < 0) continue;
        spread.push([i, e.weight]);
        if (e.kind === "direction") { if (i > 0) spread.push([i - 1, e.weight * 0.5]); if (i < months.length - 1) spread.push([i + 1, e.weight * 0.5]); }
      }
      for (const [i, w] of spread) {
        const m = monthly[i]!;
        m.score += w;
        if (w > 0) m.pos += w; else m.neg -= w;
        if (w > 0) m.charts[e.chart] = (m.charts[e.chart] ?? 0) + w;
      }
    }
    for (const m of monthly) { m.score = Math.round(m.score * 10) / 10; m.pos = Math.round(m.pos * 10) / 10; m.neg = Math.round(m.neg * 10) / 10; }
    const sorted = monthly.map((m) => m.score).sort((a, b) => a - b);
    const threshold = Math.max(3, sorted[Math.floor(sorted.length * 0.7)] ?? 3);
    const wins: { from: string; to: string; score: number; charts: number; peak: string }[] = [];
    let cur: typeof wins[number] | null = null;
    let peakScore = -Infinity;
    for (const m of monthly) {
      const active = Object.values(m.charts).filter((v) => v >= 1.5).length;
      if (m.score >= threshold) {
        if (!cur) { cur = { from: m.month, to: m.month, score: 0, charts: 0, peak: m.month }; peakScore = -Infinity; }
        cur.to = m.month; cur.score += m.score; cur.charts = Math.max(cur.charts, active);
        if (m.score > peakScore) { peakScore = m.score; cur.peak = m.month; }
      } else if (cur) { wins.push(cur); cur = null; }
    }
    if (cur) wins.push(cur);
    for (const w of wins) w.score = Math.round(w.score * 10) / 10;
    wins.sort((a, b) => (charts.length > 1 ? b.charts - a.charts || b.score - a.score : b.score - a.score));
    res[t] = { monthly, windows: wins.slice(0, 6) };
  }
  return res;
}

function scanDays(from: number, to: number, zodiac: ChartSettings["zodiac"]): Day[] {
  const days: Day[] = [];
  for (let t = from; t <= to; t += DAY) {
    const p = bodiesAt(new Date(t).toISOString(), { zodiac, bodies: ["mercury", "venus", ...SLOW] });
    days.push({ t: d10(t), ms: t, b: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v!.lon])) });
  }
  return days;
}
function eclipsesBetween(from: number, to: number) {
  return lunationsBetween(new Date(from).toISOString(), new Date(to).toISOString())
    .filter((l) => l.eclipse)
    .map((l) => ({ date: jdToUtc(l.jd).slice(0, 10), lon: l.lon, kind: l.kind === "new" ? "Solar" : "Lunar" }));
}

export const WEIGHTS = {
  transits: "Jupiter: conjunction 3, trine or sextile 2, square or opposition 1.5. Saturn: trine or sextile +1.5; conjunction, square or opposition −1.5 (to an angle: a milestone, +1). Uranus: soft +1, hard +0.75 (activation, volatile). Neptune: soft +1, hard −1. Pluto: soft +1, conjunction +1 (activation), square or opposition −1. Orb 1°.",
  midpoints: "Hard aspects on the 45° dial (conjunction, semisquare, square, sesquiquadrate, opposition), orb 0.5°: Jupiter +1.5; Uranus or Pluto +1 (activation); Saturn or Neptune −1.",
  directions: "Secondary progressions and solar arcs, orb 0.3° (progressed Moon 0.6°): Sun, Moon, Venus, Jupiter, Ascendant or Midheaven +3 by conjunction or opposition, +2 otherwise; Mars or Uranus +1; Saturn or Neptune −2 by hard aspect; Pluto −2 by square or opposition. Counted in their month and half in the months either side.",
  eclipses: "An eclipse within 3° of a point (conjunction or opposition) +1, square within 1.5° +0.5: activation.",
  timing: "Profection year in the theme's house +1.5 a year (its lord a theme ruler or natural significator +0.5); a firdaria sub-period of a theme ruler or significator +0.5; a zodiacal-releasing peak (a sign angular to Fortune) +1, the 10th from Fortune +1.5. Spread at half weight across the months they cover.",
  windows: "A month is strong when its total reaches the higher of 3 and the 70th percentile of all months. Consecutive strong months form a window. With two people, windows are ranked first by how many charts (each person, composite, Davison) have at least +1.5 in a month.",
};

const zod = (s: { zodiac: ChartSettings["zodiac"] }) => s.zodiac;
const CHART_BODIES: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"];

export function forecast(birth: BirthData, s: Pick<ChartSettings, "zodiac" | "houseSystem">, fromDate: string, years: number, themes: Theme[]) {
  const from = Date.parse(`${fromDate}T12:00:00Z`), to = from + years * YEAR;
  const natal = natalChart(birth, { ...s, houseSystem: "whole-sign", bodies: CHART_BODIES } as ChartSettings);
  const cl = chartLike(natal);
  const targets = targetsFor(cl, themes);
  const days = scanDays(from, to, zod(s));
  const utc = birthUtc(birth);
  const events = [
    ...transitEvents("You", targets, days),
    ...directionEvents("You", targets, directionSeries({ utc, lat: birth.lat, lon: birth.lon }, cl.points, zod(s), from, to)),
    ...eclipseEvents("You", targets, eclipsesBetween(from, to)),
    ...timingEvents("You", natal, utc, themes, from, to),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));
  return {
    from: d10(from), to: d10(to), themes, events,
    scores: score(events, themes, monthsBetween(from, to), ["You"]),
    retrogrades: retrogrades(days),
    targets: targets.map((t) => ({ label: t.label, lon: Math.round(t.lon * 100) / 100, themes: [...t.themes] })),
    weights: WEIGHTS,
  };
}

/** Two people: each natal chart, the composite (midpoints) and the Davison chart (midpoint in time and place). */
export function coupleForecast(a: BirthData, b: BirthData, s: Pick<ChartSettings, "zodiac" | "houseSystem">, fromDate: string, years: number, themes: Theme[]) {
  const from = Date.parse(`${fromDate}T12:00:00Z`), to = from + years * YEAR;
  const set = { ...s, houseSystem: "whole-sign", bodies: CHART_BODIES } as ChartSettings;
  const ua = birthUtc(a), ub = birthUtc(b);
  const na = natalChart(a, set), nb = natalChart(b, set);
  const ca = chartLike(na), cb = chartLike(nb);
  // Davison: the moment and place halfway between the two births.
  const mid = new Date((Date.parse(ua) + Date.parse(ub)) / 2).toISOString();
  const dav: BirthData = { date: mid.slice(0, 10), time: mid.slice(11, 16), timeAccuracy: "exact", place: "Davison", lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2, tz: "UTC" } as BirthData;
  const nd = natalChart(dav, set);
  const cd = chartLike(nd);
  // Composite: midpoints of each pair, houses whole sign from the composite Ascendant.
  const cp: Record<string, number> = {};
  for (const k of Object.keys(ca.points)) if (!["fortune", "spirit", "dsc", "ic"].includes(k)) cp[k] = midpoint(ca.points[k]!, cb.points[k]!);
  cp.dsc = n360(cp.asc! + 180); cp.ic = n360(cp.mc! + 180);
  const compPoints: ChartPoints = { asc: cp.asc!, mc: cp.mc!, cusps: Array.from({ length: 12 }, (_, i) => n360(Math.floor(cp.asc! / 30) * 30 + i * 30)), bodies: Object.entries(cp).filter(([k]) => !["asc", "mc", "dsc", "ic"].includes(k)).map(([k, v]) => ({ id: k as BodyId, lon: v, speed: 1, house: ((Math.floor(v / 30) - Math.floor(cp.asc! / 30) + 12) % 12) + 1 })) };
  const cc = chartLike(compPoints);
  const days = scanDays(from, to, zod(s));
  const ecl = eclipsesBetween(from, to);
  const sa = directionSeries({ utc: ua, lat: a.lat, lon: a.lon }, ca.points, zod(s), from, to);
  const sb = directionSeries({ utc: ub, lat: b.lat, lon: b.lon }, cb.points, zod(s), from, to);
  const sd = directionSeries({ utc: birthUtc(dav), lat: dav.lat, lon: dav.lon }, cd.points, zod(s), from, to);
  // Composite directions: the midpoints of the two people's directed points, week by week.
  const sc: Series = {};
  for (const k of Object.keys(sa)) sc[k] = sa[k]!.map((x, i) => ({ t: x.t, v: midpoint(x.v, sb[k]![i]!.v) }));
  const charts: [string, ChartLike, Series][] = [["You", ca, sa], ["Them", cb, sb], ["Composite", cc, sc], ["Davison", cd, sd]];
  const events: FEvent[] = [];
  for (const [label, c, ser] of charts) {
    const tg = targetsFor(c, themes);
    events.push(...transitEvents(label, tg, days), ...directionEvents(label, tg, ser), ...eclipseEvents(label, tg, ecl));
  }
  events.push(...timingEvents("You", na, ua, themes, from, to), ...timingEvents("Them", nb, ub, themes, from, to));
  events.sort((x, y) => (x.date < y.date ? -1 : 1));
  return {
    from: d10(from), to: d10(to), themes, events,
    scores: score(events, themes, monthsBetween(from, to), charts.map((c) => c[0])),
    retrogrades: retrogrades(days),
    davison: { date: dav.date, time: dav.time, lat: dav.lat, lon: dav.lon },
    weights: WEIGHTS,
  };
}
