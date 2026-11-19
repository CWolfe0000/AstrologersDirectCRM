/**
 * Traditional considerations before judgment for a horary chart (after
 * Bonatti and Lilly): cautions that suggest the chart may not be radical or
 * that nothing will come of the matter. They inform the astrologer's
 * judgment; they don't replace it.
 */
import type { BodyId, ChartPoints } from "./types";

export type Consideration = { id: string; title: string; detail: string; tone: "caution" | "clear" | "info" };

const ASPECT_AT: Record<number, string> = { 0: "conjunction", 60: "sextile", 90: "square", 120: "trine", 180: "opposition", 240: "trine", 270: "square", 300: "sextile" };
const TRADITIONAL: BodyId[] = ["sun", "mercury", "venus", "mars", "jupiter", "saturn"];
const NAMES: Partial<Record<BodyId, string>> = { sun: "the Sun", mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn" };
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const norm = (x: number) => ((x % 360) + 360) % 360;
const deg = (x: number) => `${Math.floor(x)}°${String(Math.floor((x % 1) * 60)).padStart(2, "0")}′`;

/** The Moon's next Ptolemaic aspect to a traditional planet before it leaves its sign, or null (void of course). */
export function moonNextAspect(points: ChartPoints) {
  const moon = points.bodies.find((b) => b.id === "moon");
  if (!moon || moon.speed <= 0) return null;
  const daysLeft = (30 - (moon.lon % 30)) / moon.speed;
  let next: { body: BodyId; aspect: string; days: number } | null = null;
  for (const p of points.bodies.filter((b) => TRADITIONAL.includes(b.id))) {
    const rel = moon.speed - p.speed;
    if (rel <= 0) continue;
    const d0 = norm(moon.lon - p.lon);
    for (const a of Object.keys(ASPECT_AT).map(Number)) {
      const t = norm(a - d0) / rel;
      if (t > 1e-6 && t <= daysLeft && (!next || t < next.days)) next = { body: p.id, aspect: ASPECT_AT[a]!, days: t };
    }
  }
  return next;
}

export function horaryConsiderations(points: ChartPoints, localAt: string): Consideration[] {
  const out: Consideration[] = [];
  const ascDeg = points.asc % 30;
  const ascSign = SIGNS[Math.floor(norm(points.asc) / 30)]!;
  if (ascDeg < 3)
    out.push({ id: "asc-early", title: "Early Ascendant", detail: `${deg(ascDeg)} ${ascSign} rising. Traditionally, it may be too early to judge: the matter isn’t ripe, or the question isn’t yet fully formed.`, tone: "caution" });
  else if (ascDeg >= 27)
    out.push({ id: "asc-late", title: "Late Ascendant", detail: `${deg(ascDeg)} ${ascSign} rising. Traditionally, it may be too late: the matter is already decided, or the querent has already acted.`, tone: "caution" });
  else out.push({ id: "asc-ok", title: "Ascendant", detail: `${deg(ascDeg)} ${ascSign} rising: neither early nor late.`, tone: "clear" });

  const moon = points.bodies.find((b) => b.id === "moon");
  if (moon) {
    const next = moonNextAspect(points);
    const moonSign = SIGNS[Math.floor(norm(moon.lon) / 30)]!;
    if (next)
      out.push({ id: "moon-course", title: "Moon Not Void of Course", detail: `The Moon’s next aspect is a ${next.aspect} to ${NAMES[next.body]}, in about ${next.days < 1 ? `${Math.max(1, Math.round(next.days * 24))} hours` : `${Math.round(next.days * 10) / 10} days`}, before it leaves ${moonSign}.`, tone: "clear" });
    else
      out.push({ id: "moon-voc", title: "Moon Void of Course", detail: `The Moon makes no further Ptolemaic aspect to the traditional planets before it leaves ${moonSign}. Traditionally, nothing will come of the matter (with exceptions, e.g. the Moon in Taurus, Cancer, Sagittarius or Pisces).`, tone: "caution" });
    const ml = norm(moon.lon);
    if (ml >= 195 && ml < 225)
      out.push({ id: "via-combusta", title: "Moon In the Via Combusta", detail: `The Moon is at ${deg(ml % 30)} ${moonSign}, between 15° Libra and 15° Scorpio. Traditionally a sign of an unstable or troubled matter; judge with caution.`, tone: "caution" });
  }

  const saturn = points.bodies.find((b) => b.id === "saturn");
  if (saturn && (saturn.house === 1 || saturn.house === 7))
    out.push({
      id: `saturn-${saturn.house}`,
      title: `Saturn In the ${saturn.house === 1 ? "1st" : "7th"} House`,
      detail: saturn.house === 1 ? "Traditionally, the querent may be troubled, or the matter seldom goes well." : "Traditionally, a warning that the astrologer’s judgment may err; take extra care.",
      tone: "caution",
    });

  return out;
}
