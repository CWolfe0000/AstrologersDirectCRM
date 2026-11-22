"use client";

import * as React from "react";
import { BODIES, fmtDeg, signOf, type BodyId, type ChartView } from "@/lib/astro";
import { MIDPOINT_POINTS, allMidpoints, dial90, midpointPictures, pointsOf, type MidPointId } from "@/lib/astro/midpoints";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/input";
import { Breakdown, BHead, BTable } from "@/components/ui/breakdown";

const label = (id: MidPointId) => (id === "asc" ? "Ascendant" : id === "mc" ? "Midheaven" : BODIES[id as BodyId]?.name ?? id);
const glyph = (id: MidPointId) => (id === "asc" ? "AC" : id === "mc" ? "MC" : BODIES[id as BodyId]?.glyph ?? id);
const ASPECT = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);
const pos = (lon: number) => `${fmtDeg(lon)} ${signOf(lon).name}`;

/** Midpoint pictures, a 90° dial and the full midpoint list for the inner chart. */
export function MidpointsPanel({ view }: { view: ChartView }) {
  const pts = React.useMemo(() => pointsOf(view.inner), [view.inner]);
  const pictures = React.useMemo(() => midpointPictures(pts), [pts]);
  const [focus, setFocus] = React.useState<MidPointId | "all">("all");
  const shown = focus === "all" ? pictures : pictures.filter((p) => p.point === focus || p.mid.a === focus || p.mid.b === focus);
  const ids = MIDPOINT_POINTS.filter((x) => pts[x] !== undefined);
  const mids = React.useMemo(() => allMidpoints(pts).sort((a, b) => dial90(a.lon) - dial90(b.lon)), [pts]);

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-ink">Midpoint Pictures</h3>
          <Select aria-label="Focus Point" value={focus} onChange={(e) => setFocus(e.target.value as MidPointId | "all")} className="h-8 w-auto text-[12.5px]">
            <option value="all">All Points</option>
            {ids.map((id) => <option key={id} value={id}>{label(id)}</option>)}
          </Select>
        </div>
        <p className="mb-2 text-[12px] text-muted">A planet or angle on the midpoint of two others (A = B/C) ties the three together. Strongest first.</p>
        {shown.length === 0 ? (
          <p className="text-[12.5px] text-muted">No pictures within orb.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line text-[12.5px]">
            {shown.slice(0, 40).map((p, i) => (
              <li key={i} className="flex items-baseline justify-between gap-2 px-3 py-1.5">
                <span className="text-ink">
                  {p.point !== "asc" && p.point !== "mc" && <><span className="glyph" aria-hidden>{glyph(p.point)}</span> </>}{label(p.point)} <span className="text-muted">=</span> {label(p.mid.a)}/{label(p.mid.b)}
                  {p.aspect !== "conjunction" && <span className="text-muted"> ({ASPECT(p.aspect)})</span>}
                </span>
                <span className="shrink-0 tabular-nums text-muted">{p.orb.toFixed(2)}°</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-ink">90° Dial</h3>
        <Dial pts={pts} focus={focus === "all" ? null : focus} onFocus={(id) => setFocus(id)} />
        <p className="mt-1 text-[11.5px] text-muted">On the 90° dial, conjunctions, squares and oppositions fall together. Select a point to draw its axis; points on or near the axis are linked to it.</p>
      </section>

      <Breakdown title="All Midpoints (Sorted on the 90° Dial)">
        <BTable className="min-w-0" head={["Midpoint", "Position", "Dial"]} rows={mids.map((m) => [`${label(m.a)}/${label(m.b)}`, pos(m.lon), `${dial90(m.lon).toFixed(2)}°`])} />
      </Breakdown>
      <Breakdown>
        <BHead>How Midpoints Are Found</BHead>
        <p>The midpoint of two points is the nearer halfway point between them. A third point forms a picture when it is conjunct, square or opposite the midpoint within 1.5°, or semisquare or sesquiquadrate within 1° (the 45° dial). Points used: the Sun through Pluto, the North Node, the Ascendant and the Midheaven.</p>
      </Breakdown>
    </div>
  );
}

function Dial({ pts, focus, onFocus }: { pts: Partial<Record<MidPointId, number>>; focus: MidPointId | null; onFocus: (id: MidPointId) => void }) {
  const R = 120, C = 140;
  const at = (deg: number, r: number) => {
    const a = ((deg * 4 - 90) * Math.PI) / 180; // 0° at the top, clockwise
    return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
  };
  const ids = MIDPOINT_POINTS.filter((x) => pts[x] !== undefined);
  const fd = focus ? dial90(pts[focus]!) : null;
  const near = (id: MidPointId) => fd !== null && id !== focus && Math.min(Math.abs(dial90(pts[id]!) - fd), 90 - Math.abs(dial90(pts[id]!) - fd)) <= 1.5;
  // Spread labels that would overlap.
  const placed: { id: MidPointId; d: number; r: number }[] = [];
  for (const id of [...ids].sort((a, b) => dial90(pts[a]!) - dial90(pts[b]!))) {
    const d = dial90(pts[id]!);
    const clash = placed.filter((p) => Math.abs(p.d - d) < 3.5).length;
    placed.push({ id, d, r: R - 18 - clash * 16 });
  }
  return (
    <svg viewBox="-30 -8 340 296" className="mx-auto block w-full max-w-[340px]" role="group" aria-label="90 degree dial">
      <circle cx={C} cy={C} r={R} className="fill-none stroke-line" />
      {Array.from({ length: 18 }, (_, i) => i * 5).map((d) => {
        const [x1, y1] = at(d, R), [x2, y2] = at(d, R - (d % 15 === 0 ? 8 : 4));
        return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-muted" strokeWidth={0.8} />;
      })}
      {[0, 30, 60].map((d) => {
        const [x, y] = at(d, R + 12);
        return <text key={d} x={x} y={y} fontSize={8} textAnchor="middle" dominantBaseline="middle" className="fill-muted">{d === 0 ? "0° Cardinal" : d === 30 ? "0° Fixed" : "0° Mutable"}</text>;
      })}
      {fd !== null && (() => { const [x, y] = at(fd, R); const [x2, y2] = at(fd + 45, R); return <><line x1={C} y1={C} x2={x} y2={y} stroke="rgb(var(--accent))" strokeWidth={1.4} /><line x1={C} y1={C} x2={x2} y2={y2} stroke="rgb(var(--accent))" strokeWidth={0.8} strokeDasharray="3 3" /></>; })()}
      {placed.map(({ id, d, r }) => {
        const [x, y] = at(d, r), [tx, ty] = at(d, R - 2);
        const on = id === focus, hit = near(id);
        return (
          <g key={id}>
            <line x1={x} y1={y} x2={tx} y2={ty} className="stroke-line" strokeWidth={0.6} />
            <circle cx={x} cy={y} r={8.5} role="button" tabIndex={0} aria-label={`${label(id)} ${dial90(pts[id]!).toFixed(1)}° on the dial`} aria-pressed={on} onClick={() => onFocus(id)} onKeyDown={(e) => e.key === "Enter" && onFocus(id)} className={cn("cursor-pointer", on ? "fill-accent stroke-accent" : hit ? "fill-accent/20 stroke-accent" : "fill-surface stroke-line")} />
            <text pointerEvents="none" x={x} y={y + 0.5} fontSize={id === "asc" || id === "mc" ? 7 : 10} textAnchor="middle" dominantBaseline="middle" className={cn("glyph", on ? "fill-white" : "fill-ink")}>{glyph(id)}</text>
          </g>
        );
      })}
    </svg>
  );
}
