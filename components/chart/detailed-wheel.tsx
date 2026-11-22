"use client";

import * as React from "react";
import { ASPECTS, BODIES, SIGNS, degInSign, norm, type Aspect, type BodyId, type BodyPosition } from "@/lib/astro";
import { cn } from "@/lib/utils";
import type { ChartWheelProps } from "./chart-wheel";
import { resolvePalette, type Resolved } from "./wheel-palette";

const C = 300;
const SANS = "Inter Variable, Inter, sans-serif";
function pt(r: number, a: number) {
  const rad = (a * Math.PI) / 180;
  return [Math.round((C + r * Math.cos(rad)) * 100) / 100, Math.round((C - r * Math.sin(rad)) * 100) / 100] as const;
}
function spread(items: { key: string; lon: number }[], minSep: number) {
  const sorted = [...items].sort((a, b) => a.lon - b.lon).map((i) => ({ ...i, pos: i.lon }));
  const n = sorted.length;
  for (let pass = 0; pass < 120 && n > 1; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const a = sorted[i]!, b = sorted[(i + 1) % n]!;
      const d = i === n - 1 ? b.pos + 360 - a.pos : b.pos - a.pos;
      if (d < minSep) { a.pos -= (minSep - d) / 2; b.pos += (minSep - d) / 2; moved = true; }
    }
    if (!moved) break;
  }
  return Object.fromEntries(sorted.map((s) => [s.key, norm(s.pos)])) as Record<string, number>;
}
const dm = (lon: number) => {
  const d = degInSign(lon);
  let deg = Math.floor(d), min = Math.round((d - deg) * 60);
  if (min === 60) { deg += 1; min = 0; }
  return { deg, min: String(min).padStart(2, "0"), sign: SIGNS[Math.floor(norm(lon) / 30) % 12]! };
};

/**
 * A detailed wheel: 1° ticks, element-colored signs, each planet's degree,
 * sign and minutes stacked under its glyph, retrograde marks, house cusp
 * positions around the outside and color-coded aspect lines.
 */
export function DetailedWheel({ view, className, selected, onSelect, highlightAspect, showAspects = true, showHouses = true, showDegrees = true, svgRef, palette = resolvePalette() }: ChartWheelProps & { palette?: Resolved }) {
  const [hover, setHover] = React.useState<string | null>(null);
  const focus = hover ?? selected ?? null;
  const { inner, outer, aspects } = view;
  const ang = (lon: number) => 180 + norm(lon - inner.asc);
  const bi = !!outer;
  const el = palette;

  const R_OUT = 300, R_SIGN = 266;
  const R_SPLIT = bi ? 196 : 0;
  const R_HOUSE = bi ? 136 : 150;
  const R_ASP = bi ? 122 : 136;
  // Radial stack per planet (inner ring): glyph, degree, sign, minutes, retrograde.
  type Stack = { glyph: number; deg: number; sign: number; min?: number; rx: number };
  const IN: Stack = bi ? { glyph: 181, deg: 163, sign: 151, min: 141, rx: 131 } : { glyph: 236, deg: 214, sign: 198, min: 183, rx: 170 };
  const OUT: Stack = { glyph: 241, deg: 222, sign: 209, rx: 200 };

  const innerPos = spread(inner.bodies.map((b) => ({ key: b.id, lon: b.lon })), bi ? 9.5 : 9.5);
  const outerPos = outer ? spread(outer.bodies.map((b) => ({ key: b.id, lon: b.lon })), 8.5) : {};

  const isRelated = (a: Aspect) => !focus || `${a.aRing}:${a.a}` === focus || `${a.bRing}:${a.b}` === focus;
  const aspectKey = (a: Aspect) => `${a.aRing}:${a.a}-${a.bRing}:${a.b}`;
  const lonOf = (ring: "inner" | "outer", id: BodyId) => {
    const p = ring === "outer" ? outer! : inner;
    if (id === "asc") return p.asc;
    if (id === "mc") return p.mc;
    return p.bodies.find((b) => b.id === id)?.lon ?? 0;
  };
  const sel = (key: string) => (e: React.MouseEvent) => { e.stopPropagation(); onSelect?.(selected === key ? null : key); };
  const dimmed = (key: string) => !!focus && focus !== key && !aspects.some((x) => isRelated(x) && (`${x.aRing}:${x.a}` === key || `${x.bRing}:${x.b}` === key));

  const renderBody = (b: BodyPosition, ring: "inner" | "outer") => {
    const key = `${ring}:${b.id}`;
    const S = ring === "outer" ? OUT : IN;
    const display = (ring === "outer" ? outerPos : innerPos)[b.id] ?? b.lon;
    const a = ang(display), exact = ang(b.lon);
    const color = palette.planet(b.id, ring);
    const { deg, min, sign } = dm(b.lon);
    // The exact-position mark sits on the degree scale (or, for the inner ring of a bi-wheel, on its rim).
    const edge = ring === "outer" || !bi ? R_SIGN : R_SPLIT;
    const [t1x, t1y] = pt(edge, exact), [t2x, t2y] = pt(edge - 11, exact);
    const [lx, ly] = pt(S.glyph + 12, a);
    const [gx, gy] = pt(S.glyph, a);
    const active = focus === key;
    const retro = b.speed < 0;
    const txt = (r: number, content: React.ReactNode, size: number, fill: string, glyph = false) => {
      const [x, y] = pt(r, a);
      return <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fill={fill} className={glyph ? "glyph" : undefined} fontFamily={glyph ? undefined : SANS}>{content}</text>;
    };
    return (
      <g key={key} className={cn(onSelect && "cursor-pointer")} onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)} onClick={onSelect ? sel(key) : undefined} opacity={dimmed(key) ? 0.28 : 1}>
        <title>{`${BODIES[b.id].name} ${deg}°${min}′ ${sign.name}${retro ? " ℞" : ""} · House ${b.house}`}</title>
        <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} stroke={color} strokeWidth={2} />
        {Math.abs(((display - b.lon + 540) % 360) - 180) > 1.5 && <line x1={t2x} y1={t2y} x2={lx} y2={ly} stroke={color} strokeOpacity={0.35} strokeWidth={0.7} />}
        {ring === "inner" && (() => { const [dx, dy] = pt(R_ASP, exact); return <circle cx={dx} cy={dy} r={2.2} fill={color} />; })()}
        {active && <circle cx={gx} cy={gy} r={14} fill="#FFFFFF" stroke={color} strokeWidth={1.2} />}
        <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" className={b.id === "vertex" ? undefined : "glyph"} fontSize={b.id === "vertex" ? 12 : ring === "outer" ? 19 : bi ? 18 : 21} fontWeight={b.id === "vertex" ? 600 : undefined} fontFamily={b.id === "vertex" ? SANS : undefined} fill={color}>
          {BODIES[b.id].glyph}
        </text>
        {showDegrees && (
          <>
            {txt(S.deg, `${deg}°`, ring === "outer" || bi ? 10.5 : 11.5, "#3A363B")}
            {txt(S.sign, sign.glyph, ring === "outer" || bi ? 11 : 12.5, el.strong[sign.element], true)}
            {S.min !== undefined && txt(S.min, `${min}′`, bi ? 9.5 : 10, "#68645F")}
            {retro && txt(S.rx, "℞", 9.5, "#C0392B")}
          </>
        )}
      </g>
    );
  };

  const cuspLabel = (lon: number, i: number) => {
    const { deg, min, sign } = dm(lon);
    const a = ang(lon);
    // Place the label just outside the wheel, nudged clockwise of the cusp line so it doesn't sit on it.
    const [x, y] = pt(R_OUT + 22, a - 3.2);
    const angle = i === 0 ? "AC" : i === 3 ? "IC" : i === 6 ? "DC" : i === 9 ? "MC" : null;
    return (
      <text key={`cl${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily={SANS} fontSize={angle ? 11 : 10} fontWeight={angle ? 600 : 500} fill={angle ? "#29272B" : "#5A555B"}>
        {angle && <tspan>{angle} </tspan>}
        <tspan>{deg}</tspan>
        <tspan className="glyph" fill={el.strong[sign.element]} fontSize={angle ? 12 : 11}>{sign.glyph}</tspan>
        <tspan>{min}</tspan>
      </text>
    );
  };

  return (
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="-62 -62 724 724" className={cn("h-auto w-full select-none", className)} onClick={() => onSelect?.(null)} role="img" aria-label="Chart Wheel">
      {/* sign band */}
      {SIGNS.map((s, i) => {
        const a0 = ang(i * 30), a1 = ang(i * 30 + 30);
        const [x0, y0] = pt(R_OUT, a0), [x1, y1] = pt(R_OUT, a1), [x2, y2] = pt(R_SIGN, a1), [x3, y3] = pt(R_SIGN, a0);
        const [gx, gy] = pt((R_OUT + R_SIGN) / 2, ang(i * 30 + 15));
        return (
          <g key={s.id}>
            <path d={`M${x0},${y0} A${R_OUT},${R_OUT} 0 0 0 ${x1},${y1} L${x2},${y2} A${R_SIGN},${R_SIGN} 0 0 1 ${x3},${y3} Z`} fill={el.light[s.element]} stroke="#D6CFC6" strokeWidth={0.8} />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" className="glyph" fontSize={21} fill={el.strong[s.element]}><title>{s.name}</title>{s.glyph}</text>
          </g>
        );
      })}
      <circle cx={C} cy={C} r={R_OUT} fill="none" stroke="#B9B0A5" strokeWidth={1.2} />
      {/* degree scale: 1°, 5°, 10° */}
      <circle cx={C} cy={C} r={R_SIGN} fill="#FFFFFF" stroke="#B9B0A5" strokeWidth={1} />
      {Array.from({ length: 360 }, (_, d) => {
        const len = d % 10 === 0 ? 9 : d % 5 === 0 ? 6 : 3;
        const [x1, y1] = pt(R_SIGN, ang(d)), [x2, y2] = pt(R_SIGN - len, ang(d));
        return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke={d % 5 === 0 ? "#9C948A" : "#CFC7BD"} strokeWidth={d % 10 === 0 ? 0.9 : 0.6} />;
      })}
      {bi && <circle cx={C} cy={C} r={R_SPLIT} fill={!palette.muted ? "#FBFAF7" : "#FFFFFF"} stroke="#CFC7BD" strokeWidth={1} />}
      <circle cx={C} cy={C} r={R_HOUSE} fill={!palette.muted ? "#FAF8F4" : "#FDFCFA"} stroke="#B9B0A5" strokeWidth={1} />
      <circle cx={C} cy={C} r={R_ASP} fill="#FFFFFF" stroke="#D6CFC6" strokeWidth={1} />

      {/* house cusps, numbers and positions */}
      {showHouses &&
        inner.cusps.map((c, i) => {
          const angular = i % 3 === 0;
          const a = ang(c);
          const [x1, y1] = pt(R_ASP, a), [x2, y2] = pt(angular ? R_OUT + 8 : R_SIGN, a);
          const next = inner.cusps[(i + 1) % 12]!;
          const [hx, hy] = pt((R_HOUSE + R_ASP) / 2, ang(norm(c + norm(next - c) / 2)));
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={angular ? "#29272B" : "#A39D96"} strokeWidth={angular ? 1.6 : 0.8} strokeDasharray={angular ? undefined : "1 0"} />
              <text x={hx} y={hy} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#8C857D" fontFamily={SANS}>{i + 1}</text>
              {cuspLabel(c, i)}
            </g>
          );
        })}
      {!showHouses && [inner.asc, inner.mc].map((lon, i) => cuspLabel(lon, i === 0 ? 0 : 9))}

      {/* angles: selectable like planets */}
      {[
        { lon: inner.asc, key: "inner:asc", name: "Ascendant" },
        { lon: norm(inner.asc + 180), key: "inner:asc", name: "Descendant (the Ascendant axis)" },
        { lon: inner.mc, key: "inner:mc", name: "Midheaven" },
        { lon: norm(inner.mc + 180), key: "inner:mc", name: "IC (the Midheaven axis)" },
      ].map((x, i) => {
        const [ax, ay] = pt(R_OUT + 8, ang(x.lon));
        return (
          <g key={i} className={cn(onSelect && "cursor-pointer")} onMouseEnter={() => setHover(x.key)} onMouseLeave={() => setHover(null)} onClick={onSelect ? sel(x.key) : undefined} opacity={dimmed(x.key) ? 0.45 : 1}>
            <title>{x.name}</title>
            <circle cx={ax} cy={ay} r={focus === x.key ? 6 : 4} fill={focus === x.key ? "#29272B" : "#FFFFFF"} stroke="#29272B" strokeWidth={1.4} />
          </g>
        );
      })}

      {/* aspect lines */}
      {showAspects &&
        aspects
          .filter((a) => a.type !== "conjunction")
          .map((a) => {
            const k = aspectKey(a);
            const [x1, y1] = pt(R_ASP, ang(lonOf(a.aRing, a.a)));
            const [x2, y2] = pt(R_ASP, ang(lonOf(a.bRing, a.b)));
            const nat = ASPECTS[a.type].nature;
            const strong = highlightAspect === k;
            const visible = highlightAspect ? strong : isRelated(a);
            return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.aspect(nat)} strokeWidth={strong ? 2.6 : a.orb < 1 ? 1.8 : a.orb < 3 ? 1.2 : 0.8} strokeDasharray={nat === "minor" ? "4 3" : undefined} opacity={visible ? (strong ? 1 : focus ? 0.95 : 0.8) : 0.07} />;
          })}

      {/* planets */}
      {inner.bodies.map((b) => renderBody(b, "inner"))}
      {outer && outer.bodies.map((b) => renderBody(b, "outer"))}
      <circle cx={C} cy={C} r={2.5} fill="#B9B0A5" />
    </svg>
  );
}
