/**
 * Rulerships and essential dignities for one chart, by traditional or modern
 * rulership: the houses each point rules (intercepted signs included), its
 * dispositor, and the chart-wide summary (rulership, exaltation, detriment,
 * fall, accidental dignity, mutual reception, final dispositor).
 */
import { RULERS, SIGNS } from "./meta";
import { houseOf } from "./techniques/aspects";
import type { BodyId, ChartPoints, SignId } from "./types";

export type Rulership = "traditional" | "modern";

const PLANETS: BodyId[] = ["moon", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const EXALTATION: Partial<Record<BodyId, SignId>> = { sun: "aries", moon: "taurus", mercury: "virgo", venus: "pisces", mars: "capricorn", jupiter: "cancer", saturn: "libra" };

const signIndex = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const opposite = (i: number) => (i + 6) % 12;

/** The ruler of a sign under the chosen rulership. */
export function rulerOf(sign: number, mode: Rulership): BodyId {
  const r = RULERS[SIGNS[sign]!.id];
  return mode === "modern" ? r.modern ?? r.traditional : r.traditional;
}
/** Signs a planet rules for house rulership (modern rulership gives Scorpio, Aquarius and Pisces to the outer planets). */
function signsRuled(id: BodyId, mode: Rulership) {
  const out: number[] = [];
  for (let i = 0; i < 12; i++) if (rulerOf(i, mode) === id) out.push(i);
  return out;
}
/** Domicile: the traditional signs always count; modern rulership adds the outer planets' signs. */
function domiciles(id: BodyId, mode: Rulership) {
  const out = new Set<number>();
  for (let i = 0; i < 12; i++) {
    const r = RULERS[SIGNS[i]!.id];
    if (r.traditional === id || (mode === "modern" && r.modern === id)) out.add(i);
  }
  return out;
}

export interface RulershipRow {
  id: BodyId;
  sign: number;
  house: number;
  /** Houses whose cusp sign it rules, and houses holding an intercepted sign it rules. */
  rules: { house: number; intercepted: boolean }[];
  dispositor: BodyId;
  dispositorHouse: number | null;
}

export function rulershipReport(p: ChartPoints, mode: Rulership) {
  const cuspSigns = new Set(p.cusps.map(signIndex));
  const byId = new Map(p.bodies.map((b) => [b.id, b]));
  const houseOfPoint = (id: BodyId) => (id === "asc" ? 1 : id === "mc" ? 10 : byId.get(id)?.house ?? null);
  const lonOf = (id: BodyId) => (id === "asc" ? p.asc : id === "mc" ? p.mc : byId.get(id)!.lon);
  const present = PLANETS.filter((id) => byId.has(id));

  const rulesOf = (id: BodyId) => {
    const out: { house: number; intercepted: boolean }[] = [];
    p.cusps.forEach((c, i) => {
      if (rulerOf(signIndex(c), mode) === id) out.push({ house: i + 1, intercepted: false });
    });
    for (const s of signsRuled(id, mode)) {
      if (!cuspSigns.has(s)) out.push({ house: houseOf(s * 30 + 15, p.cusps), intercepted: true });
    }
    return out.sort((a, b) => Number(a.intercepted) - Number(b.intercepted) || a.house - b.house);
  };

  const rows: RulershipRow[] = [...present, "asc", "mc"].map((id) => {
    const sign = signIndex(lonOf(id as BodyId));
    const dispositor = rulerOf(sign, mode);
    return {
      id: id as BodyId,
      sign,
      house: houseOfPoint(id as BodyId) ?? 1,
      rules: id === "asc" || id === "mc" ? [] : rulesOf(id as BodyId),
      dispositor,
      dispositorHouse: houseOfPoint(dispositor),
    };
  });

  const signOfP = (id: BodyId) => signIndex(byId.get(id)!.lon);
  const inRulership = present.filter((id) => domiciles(id, mode).has(signOfP(id)));
  const inExaltation = present.filter((id) => EXALTATION[id] && SIGNS[signOfP(id)]!.id === EXALTATION[id]);
  const inDetriment = present.filter((id) => [...domiciles(id, mode)].some((s) => opposite(s) === signOfP(id)));
  const inFall = present.filter((id) => EXALTATION[id] && SIGNS[opposite(signOfP(id))]!.id === EXALTATION[id]);
  // Accidental dignity: in the house that matches a sign it rules (Mars in the 1st, Venus in the 2nd or 7th, …).
  const accidental = present.filter((id) => [...domiciles(id, mode)].some((s) => byId.get(id)!.house === s + 1));
  const disp = (id: BodyId) => rulerOf(signOfP(id), mode);
  const mutual: [BodyId, BodyId][] = [];
  for (const a of present)
    for (const b of present) if (a < b && disp(a) === b && disp(b) === a) mutual.push([a, b]);
  // Final dispositor: every chain of dispositors ends at one planet in its own sign.
  let final: BodyId | null = null;
  const ends = new Set<BodyId | "loop">();
  for (const start of present) {
    let cur = start;
    const seen = new Set<BodyId>();
    while (!seen.has(cur)) {
      seen.add(cur);
      const next = disp(cur);
      if (next === cur) break;
      if (!byId.has(next)) { cur = next; break; }
      cur = next;
    }
    ends.add(disp(cur) === cur ? cur : "loop");
  }
  if (ends.size === 1 && !ends.has("loop")) final = [...ends][0] as BodyId;

  return { rows, inRulership, inExaltation, inDetriment, inFall, accidental, mutual, final };
}
