import type { BodyId, WheelPalette } from "@/lib/astro/types";

export type WheelColors = "color" | "muted" | "custom";
type Element = "fire" | "earth" | "air" | "water";
export type AspectNature = "hard" | "soft" | "neutral" | "minor";

/** The built-in colorful palette, and the starting point for a custom one. */
export const DEFAULT_PALETTE: Required<{ [K in keyof WheelPalette]-?: NonNullable<WheelPalette[K]> }> = {
  elements: { fire: "#C8382A", earth: "#2E7D32", air: "#B07D0B", water: "#1F5FA8" },
  planets: {
    sun: "#D9820B", moon: "#5B6B7C", mercury: "#138D75", venus: "#2E8B57", mars: "#C0392B", jupiter: "#6C3483",
    saturn: "#5D4037", uranus: "#138FA6", neptune: "#2E4AA8", pluto: "#8E1C3D", node: "#6B7378", southnode: "#6B7378",
    chiron: "#A0522D", ceres: "#7A8B3A", pallas: "#4A6FA5", juno: "#A3487A", vesta: "#B5651D", lilith: "#4B4453",
    vertex: "#6B7378", fortune: "#B07D0B",
  },
  aspects: { hard: "#D0312D", soft: "#2F6FB3", neutral: "#2E7D32", minor: "#6AA84F" },
};

const MUTED = {
  strong: { fire: "#5A555B", earth: "#5A555B", air: "#5A555B", water: "#5A555B" },
  light: { fire: "#F8F1EE", earth: "#F3F1EA", air: "#F2F3F2", water: "#EEF2F1" },
  aspects: { hard: "#824B59", soft: "#5E7266", neutral: "#68645F", minor: "#A39D96" },
};

/** A light tint of a color for the sign band: 84% white. */
export function tint(hex: string, amount = 0.84) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#F5F3EF";
  const n = parseInt(m[1]!, 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
  return `#${mix((n >> 16) & 255)}${mix((n >> 8) & 255)}${mix(n & 255)}`;
}

export interface Resolved {
  muted: boolean;
  strong: Record<Element, string>;
  light: Record<Element, string>;
  planet: (id: BodyId, ring?: "inner" | "outer") => string;
  aspect: (nature: AspectNature) => string;
}

/** Turn the chosen colors (and the practice's custom palette) into what the wheels draw with. */
export function resolvePalette(colors: WheelColors = "color", custom?: WheelPalette): Resolved {
  if (colors === "muted")
    return { muted: true, strong: MUTED.strong, light: MUTED.light, planet: (_id, ring = "inner") => (ring === "outer" ? "#824B59" : "#29272B"), aspect: (n) => MUTED.aspects[n] };
  const p = colors === "custom" && custom ? custom : {};
  const strong = { ...DEFAULT_PALETTE.elements, ...(p.elements ?? {}) } as Record<Element, string>;
  const planets = { ...DEFAULT_PALETTE.planets, ...(p.planets ?? {}) };
  const aspects = { ...DEFAULT_PALETTE.aspects, ...(p.aspects ?? {}) };
  return {
    muted: false,
    strong,
    light: { fire: tint(strong.fire), earth: tint(strong.earth), air: tint(strong.air), water: tint(strong.water) },
    planet: (id) => planets[id] ?? "#29272B",
    aspect: (n) => aspects[n] ?? DEFAULT_PALETTE.aspects[n]!,
  };
}
