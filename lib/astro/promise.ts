/**
 * Natal promise: what the birth chart itself says about a topic, before any
 * timing. Directions and transits can only bring out what the natal chart
 * holds, so each life theme is read against this first.
 *
 * Testimonies, for marriage (7th house, Venus) and career (10th house, Sun):
 * - the house ruler's essential dignity (domicile or exaltation supports;
 *   detriment or fall challenges) and its house (angular supports; the 6th,
 *   8th and 12th challenge);
 * - the natural significator's dignity;
 * - planets in the house (Venus and Jupiter support; Mars and Saturn challenge);
 * - natal aspects to the ruler and natural significator: conjunction, trine or
 *   sextile from Venus or Jupiter supports; conjunction, square or opposition
 *   from Mars or Saturn challenges;
 * - a conjunction, trine or sextile between the house ruler and the ruler of
 *   the 1st supports.
 * Two more supports than challenges reads as well promised; two more
 * challenges, as weakly promised.
 *
 * For accident-proneness the testimonies are indications: Mars or Uranus in
 * the 1st or on an angle, and hard natal aspects from Mars, Saturn or Uranus
 * to the Ascendant, its ruler, the Sun or the Moon, and between Mars and
 * Uranus. Venus or Jupiter aspecting the Ascendant or its ruler protects.
 *
 * Natal aspects use the activation model's orbs (8° with a luminary, else 6°).
 */
import { BODIES, ordinal, type BodyId } from "./index";
import type { NatalModel } from "./activation";
import { DOMICILE, EXALT } from "./traditional";
import type { TargetId } from "./timeline";
import type { ThemeId } from "./themes";

export interface Testimony {
  text: string;
  tone: "support" | "challenge";
}
export type PromiseLevel = "strong" | "mixed" | "weak" | "none";
export interface NatalPromise {
  level: PromiseLevel;
  testimonies: Testimony[];
}

const signIdx = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const name = (id: TargetId) => BODIES[id].name;
const EASY = ["conjunction", "trine", "sextile"], HARD = ["conjunction", "square", "opposition"];
const verb: Record<string, string> = { conjunction: "conjunct", trine: "trine", sextile: "sextile", square: "square", opposition: "opposite" };

/** Domicile, exaltation, detriment or fall of one of the seven planets. */
function dignity(id: TargetId, lon: number): { label: string; tone: Testimony["tone"] } | null {
  const s = signIdx(lon);
  if (DOMICILE[s] === id) return { label: "in its domicile", tone: "support" };
  if (EXALT[s] === id) return { label: "exalted", tone: "support" };
  if (DOMICILE[(s + 6) % 12] === id) return { label: "in its detriment", tone: "challenge" };
  if (EXALT[(s + 6) % 12] === id) return { label: "in its fall", tone: "challenge" };
  return null;
}

export function natalPromise(n: NatalModel, theme: ThemeId): NatalPromise {
  const out: Testimony[] = [];
  const add = (tone: Testimony["tone"], text: string) => { if (!out.some((t) => t.text === text)) out.push({ tone, text }); };
  const at = (id: TargetId) => n.byId.get(id);
  const aspects = (to: TargetId, toLabel: string) => {
    for (const b of ["venus", "jupiter"] as BodyId[]) {
      const a = b !== to ? n.natalAspect(b, to) : null;
      if (a && EASY.includes(a)) add("support", `${name(b)} ${verb[a]} ${toLabel}`);
    }
    for (const b of ["mars", "saturn"] as BodyId[]) {
      const a = b !== to ? n.natalAspect(b, to) : null;
      if (a && HARD.includes(a)) add("challenge", `${name(b)} ${verb[a]} ${toLabel}`);
    }
  };

  if (theme === "accident") {
    let indications = 0;
    const flag = (text: string) => { const before = out.length; add("challenge", text); if (out.length > before) indications++; };
    for (const id of ["mars", "uranus"] as BodyId[]) {
      const p = at(id);
      if (!p) continue;
      if (n.natalAspect(id, "asc") === "conjunction" || p.house === 1) flag(`${name(id)} in the 1st House or on the Ascendant`);
      else if (p.house && [4, 7, 10].includes(p.house)) flag(`${name(id)} angular, in the ${ordinal(p.house)} House`);
    }
    const mu = n.natalAspect("mars", "uranus");
    if (mu && HARD.includes(mu)) flag(`Mars ${verb[mu]} Uranus`);
    const vital: [TargetId, string][] = [["asc", "the Ascendant"], ["sun", "the Sun"], ["moon", "the Moon"]];
    if (n.chartRuler && !["sun", "moon"].includes(n.chartRuler)) vital.push([n.chartRuler, `${name(n.chartRuler)}, ruler of the Ascendant`]);
    for (const [to, label] of vital) {
      for (const b of ["mars", "saturn", "uranus"] as BodyId[]) {
        if (b === to) continue;
        const a = n.natalAspect(b, to);
        if (a && HARD.includes(a) && !(to === "asc" && a === "conjunction" && b !== "saturn")) flag(`${name(b)} ${verb[a]} ${label}`);
      }
    }
    for (const [to, label] of vital.filter(([id]) => id === "asc" || id === n.chartRuler)) {
      for (const b of ["venus", "jupiter"] as BodyId[]) {
        const a = b !== to ? n.natalAspect(b, to) : null;
        if (a && EASY.includes(a)) add("support", `${name(b)} ${verb[a]} ${label}: protection`);
      }
    }
    return { level: indications >= 3 ? "strong" : indications >= 1 ? "mixed" : "none", testimonies: out };
  }

  const house = theme === "marriage" ? 7 : 10;
  const natural: BodyId = theme === "marriage" ? "venus" : "sun";
  const ruler = n.houseRulers(house)[0];
  if (ruler && at(ruler)) {
    const p = at(ruler)!, label = `${name(ruler)}, ruler of the ${ordinal(house)}`;
    const d = dignity(ruler, p.lon);
    if (d) add(d.tone, `${label}, is ${d.label}`);
    if (p.house && [1, 4, 7, 10].includes(p.house)) add("support", `${label}, is angular in the ${ordinal(p.house)} House`);
    else if (p.house && [6, 8, 12].includes(p.house)) add("challenge", `${label}, is in the ${ordinal(p.house)} House`);
    aspects(ruler, label);
    const first = n.chartRuler;
    if (first && first !== ruler) {
      const a = n.natalAspect(first, ruler);
      if (a && EASY.includes(a)) add("support", `${name(first)}, ruler of the 1st, ${verb[a]} ${label}`);
    }
  }
  if (at(natural) && natural !== ruler) {
    const d = dignity(natural, at(natural)!.lon);
    if (d) add(d.tone, `${name(natural)} is ${d.label}`);
    aspects(natural, name(natural));
  }
  for (const id of n.occupants(house)) {
    if (id === "venus" || id === "jupiter") add("support", `${name(id)} in the ${ordinal(house)} House`);
    if (id === "mars" || id === "saturn") add("challenge", `${name(id)} in the ${ordinal(house)} House`);
  }
  const s = out.filter((t) => t.tone === "support").length, c = out.length - s;
  return { level: out.length === 0 ? "none" : s >= c + 2 ? "strong" : c >= s + 2 ? "weak" : "mixed", testimonies: out };
}
