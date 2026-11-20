import type { AspectId, BodyId } from "@/lib/astro/types";

export type WheelColors = "color" | "muted";

/** Element colors: strong (glyphs) and light (sign band). */
export const ELEMENT = {
  color: {
    strong: { fire: "#C8382A", earth: "#2E7D32", air: "#B07D0B", water: "#1F5FA8" },
    light: { fire: "#FCE6E2", earth: "#E3F1E0", air: "#FBF0D2", water: "#DFEAF7" },
  },
  muted: {
    strong: { fire: "#5A555B", earth: "#5A555B", air: "#5A555B", water: "#5A555B" },
    light: { fire: "#F8F1EE", earth: "#F3F1EA", air: "#F2F3F2", water: "#EEF2F1" },
  },
} as const;

const PLANET_COLORS: Partial<Record<BodyId, string>> = {
  sun: "#D9820B", moon: "#5B6B7C", mercury: "#138D75", venus: "#2E8B57", mars: "#C0392B", jupiter: "#6C3483",
  saturn: "#5D4037", uranus: "#138FA6", neptune: "#2E4AA8", pluto: "#8E1C3D", node: "#6B7378", southnode: "#6B7378",
  chiron: "#A0522D", ceres: "#7A8B3A", pallas: "#4A6FA5", juno: "#A3487A", vesta: "#B5651D", lilith: "#4B4453",
  vertex: "#6B7378", fortune: "#B07D0B",
};

/** A planet's color: its own in color mode; ink (inner ring) or wine (outer ring) when muted. */
export function planetColor(id: BodyId, colors: WheelColors, ring: "inner" | "outer" = "inner") {
  if (colors === "muted") return ring === "outer" ? "#824B59" : "#29272B";
  return PLANET_COLORS[id] ?? "#29272B";
}

/** Aspect-line colors by nature: red hard, blue soft, green minor (color mode). */
export const ASPECT_COLORS = {
  color: { hard: "#D0312D", soft: "#2F6FB3", neutral: "#2E7D32", minor: "#6AA84F" },
  muted: { hard: "#824B59", soft: "#5E7266", neutral: "#68645F", minor: "#A39D96" },
} as const;
export type AspectNature = keyof (typeof ASPECT_COLORS)["color"];
export const aspectColor = (nature: AspectNature, colors: WheelColors) => ASPECT_COLORS[colors][nature];
export type { AspectId };
