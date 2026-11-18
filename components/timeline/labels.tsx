"use client";

import * as React from "react";
import { ASPECTS, BODIES, aspectVerb, type BodyId } from "@/lib/astro";
import type { TargetId, TimelineContact, TimelineTechnique } from "@/lib/astro/timeline";
import type { ChartRecord } from "@/lib/data/types";

// ---------------------------------------------------------------------------
// Labels and colors

export const TECH: Record<TimelineTechnique, { label: string; short: string; color: string; soft: string; chart: ChartRecord["type"] }> = {
  transit: { label: "Transit", short: "Tr", color: "#824B59", soft: "#F3E6E9", chart: "transits" },
  progressed: { label: "Progression", short: "Pr", color: "#4D5A70", soft: "#E6EAF1", chart: "progressions" },
  "solar-arc": { label: "Solar Arc", short: "SA", color: "#6E4F6E", soft: "#EFE6EF", chart: "solar-arc" },
  lunation: { label: "Lunation", short: "Lu", color: "#9A6A1F", soft: "#F6EDDC", chart: "transits" },
  eclipse: { label: "Eclipse", short: "Ec", color: "#29272B", soft: "#E9E6E4", chart: "transits" },
};

export const pointName = (id: TargetId) => BODIES[id].name;
export const pointGlyph = (id: TargetId) => BODIES[id].glyph;

export function sourceName(c: TimelineContact) {
  if (c.technique === "lunation") return c.source === "new-moon" ? "New Moon" : "Full Moon";
  if (c.technique === "eclipse") return c.source === "new-moon" ? "Solar Eclipse" : "Lunar Eclipse";
  const n = BODIES[c.source as BodyId].name;
  if (c.technique === "progressed") return `Progressed ${n}`;
  if (c.technique === "solar-arc") return `Solar Arc ${n}`;
  return n;
}
export function sourceGlyph(c: TimelineContact) {
  if (c.technique === "lunation" || c.technique === "eclipse") return c.source === "new-moon" ? "●" : "○";
  return BODIES[c.source as BodyId].glyph;
}
/** Source, aspect and target glyphs, in the symbol font used by the chart tables. */
export function Glyphs({ c, size = 15 }: { c: TimelineContact; size?: number }) {
  const g = (text: string, color?: string) =>
    text.length === 2 ? (
      <span className="font-semibold" style={{ fontSize: size * 0.68, color }}>{text}</span>
    ) : (
      <span className="glyph" style={{ fontSize: size, color }}>{text}</span>
    );
  return (
    <span className="inline-flex items-baseline gap-[0.3em] leading-none" aria-hidden>
      {g(sourceGlyph(c), TECH[c.technique].color)}
      {g(ASPECTS[c.aspect].glyph)}
      {g(pointGlyph(c.target))}
    </span>
  );
}

export function contactLabel(c: TimelineContact) {
  return `${sourceName(c)} ${aspectVerb(c.aspect)} natal ${pointName(c.target)}`;
}

export const DAY = 86_400_000;
export const fmt = (iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
export const fmtShort = (iso: string) => fmt(iso, { month: "short", day: "numeric" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + " UTC";
export function fmtRange(a: string, b: string) {
  const sameYear = a.slice(0, 4) === b.slice(0, 4);
  return `${sameYear ? fmtShort(a) : fmt(a)} – ${fmt(b)}`;
}
export function addMonths(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

