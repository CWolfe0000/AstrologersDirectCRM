/** Accent colors a practice can choose for its client portal. The first is the AstrologersDirect default. */
export const PORTAL_ACCENTS = ["#824B59", "#5E7266", "#4D5A70", "#7A6145", "#29272B"] as const;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const mix = (c: [number, number, number], to: number, t: number) => c.map((v) => Math.round(v + (to - v) * t)).join(" ");

/** CSS variables for an accent color (hover is darker; 50/100/200 are tints). Unknown colors get the default. */
export function accentVars(hex?: string): Record<string, string> | undefined {
  if (!hex || hex === PORTAL_ACCENTS[0] || !(PORTAL_ACCENTS as readonly string[]).includes(hex)) return undefined;
  const c = rgb(hex);
  return {
    "--accent": c.join(" "),
    "--accent-hover": mix(c, 0, 0.18),
    "--accent-50": mix(c, 255, 0.92),
    "--accent-100": mix(c, 255, 0.84),
    "--accent-200": mix(c, 255, 0.66),
  };
}
