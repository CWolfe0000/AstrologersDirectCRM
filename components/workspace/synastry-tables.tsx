"use client";

import * as React from "react";
import { ASPECTS, BODIES, PLANET_IDS, fmtDeg, fmtOrb, ordinal, signOf, type Aspect, type BodyId, type ChartPoints, type ChartView } from "@/lib/astro";
import { houseOf } from "@/lib/astro/techniques/aspects";
import { cn } from "@/lib/utils";
import { RingTag } from "./analysis-tables";

type Ring = "inner" | "outer";
type Pt = { id: BodyId; ring: Ring; lon: number };

const ORDER: BodyId[] = [...PLANET_IDS, "asc", "mc"];
const tone = (t: Aspect["type"]) => ({ hard: "text-accent", soft: "text-sage-dark", neutral: "text-ink", minor: "text-muted" })[ASPECTS[t].nature];

function pointsOf(p: ChartPoints, ring: Ring, angles: boolean): Pt[] {
  const out: Pt[] = [];
  for (const id of ORDER) {
    if (id === "asc" || id === "mc") {
      if (angles) out.push({ id, ring, lon: id === "asc" ? p.asc : p.mc });
    } else {
      const b = p.bodies.find((x) => x.id === id);
      if (b) out.push({ id, ring, lon: b.lon });
    }
  }
  return out;
}

function GlyphCell({ id, outer }: { id: BodyId; outer?: boolean }) {
  return id === "asc" || id === "mc" ? (
    <span className={cn("text-[10px] font-semibold", outer ? "text-accent" : "text-ink")}>{BODIES[id].glyph}</span>
  ) : (
    <span className={cn("glyph text-[15px]", outer ? "text-accent" : "text-ink")}>{BODIES[id].glyph}</span>
  );
}

/**
 * Aspect grid. One chart: the classic triangular aspectarian. Two people
 * (synastry): every point of one against every point of the other.
 * Neutral: aspect, orb and applying/separating only.
 */
export function AspectGrid({
  view,
  labels,
  hovered,
  onHover,
  outerAngles,
}: {
  view: ChartView;
  labels: { inner: string; outer: string };
  hovered: string | null;
  onHover: (k: string | null) => void;
  outerAngles: boolean;
}) {
  const byPair = React.useMemo(() => {
    const m = new Map<string, Aspect>();
    for (const a of view.aspects) {
      m.set(`${a.aRing}:${a.a}|${a.bRing}:${a.b}`, a);
      m.set(`${a.bRing}:${a.b}|${a.aRing}:${a.a}`, a);
    }
    return m;
  }, [view.aspects]);
  const key = (a: Aspect) => `${a.aRing}:${a.a}-${a.bRing}:${a.b}`;
  const two = !!view.outer;
  const cols = pointsOf(view.inner, "inner", true);
  const rows = two ? pointsOf(view.outer!, "outer", outerAngles) : cols;
  const name = (p: Pt) => `${two ? (p.ring === "outer" ? labels.outer : labels.inner) + "’s " : ""}${BODIES[p.id].name}`;

  const cell = (r: Pt, c: Pt) => {
    const a = byPair.get(`${r.ring}:${r.id}|${c.ring}:${c.id}`);
    if (!a) return <td key={c.id} className="size-8 border border-line/60" aria-label={`${name(r)} and ${name(c)}: no aspect`} />;
    const k = key(a);
    return (
      <td
        key={c.id}
        tabIndex={0}
        onMouseEnter={() => onHover(k)}
        onFocus={() => onHover(k)}
        title={`${name(r)} ${ASPECTS[a.type].name.toLowerCase()} ${name(c)} · orb ${fmtOrb(a.orb)} · ${a.applying ? "applying" : "separating"}`}
        aria-label={`${name(r)} ${ASPECTS[a.type].name.toLowerCase()} ${name(c)}, orb ${fmtOrb(a.orb)}, ${a.applying ? "applying" : "separating"}`}
        className={cn("size-8 cursor-default border border-line/60 p-0 text-center align-middle leading-none", hovered === k && "bg-accent-50")}
      >
        <span className={cn("glyph block text-[14px]", tone(a.type))} aria-hidden>
          {ASPECTS[a.type].glyph}
        </span>
        <span className="block text-[8.5px] tabular-nums text-muted" aria-hidden>
          {Math.floor(a.orb)}°{a.applying ? "a" : "s"}
        </span>
      </td>
    );
  };

  return (
    <div>
      {two && (
        <p className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          Rows <RingTag label={labels.outer} outer /> · columns <RingTag label={labels.inner} />
        </p>
      )}
      <div className="scrollbar-thin overflow-x-auto" onMouseLeave={() => onHover(null)}>
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="size-8" aria-hidden />
              {(two ? cols : cols.slice(0, -1)).map((c) => (
                <th key={c.id} scope="col" className="size-8 text-center font-normal" aria-label={name(c)}>
                  <GlyphCell id={c.id} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) =>
              two ? (
                <tr key={r.id}>
                  <th scope="row" className="size-8 text-center font-normal" aria-label={name(r)}>
                    <GlyphCell id={r.id} outer />
                  </th>
                  {cols.map((c) => cell(r, c))}
                </tr>
              ) : i === 0 ? null : (
                <tr key={r.id}>
                  <th scope="row" className="size-8 text-center font-normal" aria-label={name(r)}>
                    <GlyphCell id={r.id} />
                  </th>
                  {cols.slice(0, i).map((c) => cell(r, c))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11.5px] leading-snug text-muted">
        Each cell shows the tightest aspect within your orbs, whole degrees of orb, and <b className="font-medium">a</b>pplying or <b className="font-medium">s</b>eparating.
        {two && " Applying and separating between two birth charts follow the natal speeds, a convention rather than a real motion."} Hover a cell to highlight it on the wheel.
      </p>
    </div>
  );
}

/** Each person's planets placed in the other's houses (strict cusps). No interpretation. */
export function OverlaysTable({ view, labels, timeKnown }: { view: ChartView; labels: { inner: string; outer: string }; timeKnown: { inner: boolean; outer: boolean } }) {
  if (!view.outer) return null;
  const sections = [
    { from: labels.outer, into: labels.inner, pts: pointsOf(view.outer, "outer", false), cusps: view.inner.cusps, ok: timeKnown.inner, outer: true },
    { from: labels.inner, into: labels.outer, pts: pointsOf(view.inner, "inner", false), cusps: view.outer.cusps, ok: timeKnown.outer, outer: false },
  ];
  return (
    <div className="space-y-6">
      {sections.map((s) => {
        const rows = s.pts.map((p) => ({ ...p, house: houseOf(p.lon, s.cusps) }));
        const counts = new Map<number, number>();
        rows.forEach((r) => counts.set(r.house, (counts.get(r.house) ?? 0) + 1));
        const busiest = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
        return (
          <section key={s.from}>
            <h3 className="mb-1 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-ink">
              <RingTag label={s.from} outer={s.outer} /> Planets in <RingTag label={s.into} outer={!s.outer} /> Houses
            </h3>
            {!s.ok ? (
              <p className="rounded-lg border border-line bg-canvas-2 px-3 py-2 text-[12.5px] text-muted">{s.into}’s birth time is unknown, so their houses (and these overlays) can’t be placed reliably.</p>
            ) : (
              <>
                <table className="w-full">
                  <thead className="border-b border-line">
                    <tr>
                      <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">Planet</th>
                      <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">Position</th>
                      <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">In {s.into}’s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-line/60 last:border-0">
                        <td className="px-2 py-1.5 text-[13px]">
                          <span className="flex items-center gap-1.5">
                            <GlyphCell id={r.id} outer={s.outer} /> {BODIES[r.id].name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-[13px] tabular-nums">
                          <span className="glyph mr-1 text-muted">{signOf(r.lon).glyph}</span>
                          {fmtDeg(r.lon)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-[13px]">{ordinal(r.house)} house</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {busiest.length > 0 && (
                  <p className="mt-2 text-[12px] text-muted">
                    Most occupied: {busiest.map(([h, n]) => `${ordinal(h)} (${n})`).join(", ")}
                  </p>
                )}
              </>
            )}
          </section>
        );
      })}
      <p className="text-[11.5px] leading-snug text-muted">Strict cusps: a planet exactly on a cusp counts in that house. Uses each person’s house system from the chart settings.</p>
    </div>
  );
}
