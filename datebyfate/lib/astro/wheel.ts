/** Pure helpers for drawing a chart wheel and its tables: glyphs, formatting, aspect lists and label spreading. */
import { BODIES, type AspectClass, type BodyId, type Chart } from "./types";
import { COUPLE_ORBS, LUMINARY_ORBS, NATAL_ORBS, SIGNS, aspectBetween, norm360, type AspectName } from "./zodiac";

/** U+FE0E asks for the text (not emoji) presentation of a glyph. */
const T = "︎";

export const PLANET_GLYPHS: Record<BodyId, string> = {
  sun: "☉" + T,
  moon: "☽" + T,
  mercury: "☿" + T,
  venus: "♀" + T,
  mars: "♂" + T,
  jupiter: "♃" + T,
  saturn: "♄" + T,
  uranus: "♅" + T,
  neptune: "♆" + T,
  pluto: "♇" + T,
  node: "☊" + T,
};

/** Aries … Pisces, in the order of SIGNS. */
export const SIGN_GLYPHS: readonly string[] = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map((g) => g + T);

export const ASPECT_GLYPHS: Record<AspectName, string> = {
  conjunction: "☌" + T,
  opposition: "☍" + T,
  square: "□" + T,
  trine: "△" + T,
  sextile: "⚹" + T,
};

export const RETROGRADE_GLYPH = "℞";

/** Fonts that carry the astrological symbols as plain text glyphs. */
export const GLYPH_FONT = '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols", "Noto Sans Symbols 2", "DejaVu Sans", sans-serif';

/** Hard aspects maroon, flowing ones sage, conjunctions neutral. */
export const ASPECT_COLORS: Record<AspectClass, string> = { hard: "#824B59", flowing: "#5E7266", conjunction: "#68645F" };

/** Degrees within the sign, 0–30. */
export const degInSign = (lon: number) => norm360(lon) % 30;

/** Degree and minute within the sign, rounded to the minute: { sign: 11, deg: 17, min: 42 }. */
export function splitLon(lon: number) {
  const total = Math.round(norm360(lon) * 60) % 21600;
  const sign = Math.floor(total / 1800);
  const rest = total - sign * 1800;
  return { sign, deg: Math.floor(rest / 60), min: rest % 60 };
}

/** "17°42′ Pisces" */
export function formatLon(lon: number) {
  const { sign, deg, min } = splitLon(lon);
  return `${deg}°${String(min).padStart(2, "0")}′ ${SIGNS[sign]!.name}`;
}

export interface WheelAspect {
  a: BodyId;
  b: BodyId;
  name: AspectName;
  orb: number;
  cls: AspectClass;
}

const isLuminary = (id: BodyId) => id === "sun" || id === "moon";

/**
 * Aspects between a chart's own bodies (the node included), closest first.
 * 2° wider when the Sun or Moon is involved. Without a birth time the Moon's
 * position is not known well enough, so its aspects are left out.
 */
export function aspectsWithin(chart: Chart): WheelAspect[] {
  const out: WheelAspect[] = [];
  const ids = chart.houses ? BODIES : BODIES.filter((id) => id !== "moon");
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!;
      const b = ids[j]!;
      const hit = aspectBetween(chart.bodies[a].lon, chart.bodies[b].lon, isLuminary(a) || isLuminary(b) ? LUMINARY_ORBS : NATAL_ORBS);
      if (hit) out.push({ a, b, ...hit });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

/** Aspects from the inner chart's bodies (a) to the outer chart's bodies (b), closest first. */
export function aspectsBetween(inner: Chart, outer: Chart): WheelAspect[] {
  const out: WheelAspect[] = [];
  for (const a of BODIES) {
    for (const b of BODIES) {
      const hit = aspectBetween(inner.bodies[a].lon, outer.bodies[b].lon, COUPLE_ORBS);
      if (hit) out.push({ a, b, ...hit });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

/**
 * Moves labels apart around the circle until neighbours are at least `minSep` degrees
 * from each other, keeping their order. Returns the display longitude for each key.
 */
export function spreadLabels<K extends string>(items: { key: K; lon: number }[], minSep: number): Record<K, number> {
  const n = items.length;
  const sep = n > 1 ? Math.min(minSep, 360 / n) : minSep;
  // Positions stay unnormalised while relaxing so neighbours keep their order.
  const sorted = [...items].sort((a, b) => norm360(a.lon) - norm360(b.lon)).map((i) => ({ key: i.key, pos: norm360(i.lon) }));
  for (let pass = 0; pass < 400 && n > 1; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const a = sorted[i]!;
      const b = sorted[(i + 1) % n]!;
      const d = i === n - 1 ? b.pos + 360 - a.pos : b.pos - a.pos;
      if (d < sep - 0.01) {
        const push = (sep - d) / 2;
        a.pos -= push;
        b.pos += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const out = {} as Record<K, number>;
  for (const s of sorted) out[s.key] = norm360(s.pos);
  return out;
}
