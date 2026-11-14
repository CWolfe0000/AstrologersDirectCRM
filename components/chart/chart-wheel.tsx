"use client";

import * as React from "react";
import { ASPECTS, BODIES, SIGNS, degInSign, norm, type Aspect, type BodyId, type BodyPosition, type ChartView } from "@/lib/astro";
import { cn } from "@/lib/utils";

const C = 300; // centre (viewBox 600x600)

function pt(r: number, a: number) {
  const rad = (a * Math.PI) / 180;
  // rounded so server- and client-rendered SVG attributes match exactly
  return [Math.round((C + r * Math.cos(rad)) * 100) / 100, Math.round((C - r * Math.sin(rad)) * 100) / 100] as const;
}

function spread(items: { key: string; lon: number }[], minSep: number) {
  // Positions are kept unnormalised while relaxing so neighbours keep their order.
  const sorted = [...items].sort((a, b) => a.lon - b.lon).map((i) => ({ ...i, pos: i.lon }));
  const n = sorted.length;
  for (let pass = 0; pass < 80 && n > 1; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const a = sorted[i]!;
      const b = sorted[(i + 1) % n]!;
      const d = i === n - 1 ? b.pos + 360 - a.pos : b.pos - a.pos;
      if (d < minSep) {
        const push = (minSep - d) / 2;
        a.pos -= push;
        b.pos += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return Object.fromEntries(sorted.map((s) => [s.key, norm(s.pos)])) as Record<string, number>;
}

const ASPECT_COLOR = { hard: "#824B59", soft: "#5E7266", neutral: "#77736F", minor: "#A39D96" } as const;

export interface ChartWheelProps {
  view: ChartView;
  compact?: boolean;
  className?: string;
  selected?: string | null; // `${ring}:${body}`
  onSelect?: (key: string | null) => void;
  highlightAspect?: string | null;
  showAspects?: boolean;
  showHouses?: boolean;
  showDegrees?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
}

export function ChartWheel({ view, compact, className, selected, onSelect, highlightAspect, showAspects = true, showHouses = true, showDegrees = true, svgRef }: ChartWheelProps) {
  const [hover, setHover] = React.useState<string | null>(null);
  const focus = hover ?? selected ?? null;
  const { inner, outer, aspects } = view;
  const asc = inner.asc;
  const ang = (lon: number) => 180 + norm(lon - asc);
  const bi = !!outer;

  const R_OUT = 290;
  const R_ZOD = 252;
  const R_SPLIT = bi ? 200 : 0;
  const R_HOUSE = compact ? 150 : bi ? 150 : 158;
  const R_ASP = compact ? (bi ? 140 : 150) : bi ? 128 : 132;
  const innerGlyphR = bi ? (compact ? 172 : 180) : compact ? 205 : 224;
  const innerDegR = bi ? 161 : 198;
  const outerGlyphR = compact ? 226 : 237;

  const innerPos = spread(inner.bodies.map((b) => ({ key: b.id, lon: b.lon })), compact ? 8 : bi ? 8.5 : 9.5);
  const outerPos = outer ? spread(outer.bodies.map((b) => ({ key: b.id, lon: b.lon })), compact ? 6.5 : 7.5) : {};

  const isRelated = (a: Aspect) => {
    if (!focus) return true;
    return `${a.aRing}:${a.a}` === focus || `${a.bRing}:${a.b}` === focus;
  };
  const aspectKey = (a: Aspect) => `${a.aRing}:${a.a}-${a.bRing}:${a.b}`;
  const lonOf = (ring: "inner" | "outer", id: BodyId) => {
    const p = ring === "outer" ? outer! : inner;
    if (id === "asc") return p.asc;
    if (id === "mc") return p.mc;
    return p.bodies.find((b) => b.id === id)?.lon ?? 0;
  };

  const sel = (key: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(selected === key ? null : key);
  };

  const renderBody = (b: BodyPosition, ring: "inner" | "outer", glyphR: number, degR: number, display: number, edgeR: number) => {
    const key = `${ring}:${b.id}`;
    const a = ang(display);
    const [gx, gy] = pt(glyphR, a);
    const [t1x, t1y] = pt(edgeR, ang(b.lon));
    const [t2x, t2y] = pt(edgeR - 7, ang(b.lon));
    const [lx, ly] = pt(glyphR - 9, a);
    const active = focus === key;
    const dim = focus && !active && !aspects.some((x) => isRelated(x) && (`${x.aRing}:${x.a}` === key || `${x.bRing}:${x.b}` === key));
    const color = ring === "outer" ? "#824B59" : "#29272B";
    const d = degInSign(b.lon);
    return (
      <g
        key={key}
        className={cn(onSelect && "cursor-pointer")}
        onMouseEnter={() => !compact && setHover(key)}
        onMouseLeave={() => setHover(null)}
        onClick={onSelect ? sel(key) : undefined}
        opacity={dim ? 0.3 : 1}
      >
        <title>{`${BODIES[b.id].name} ${Math.floor(d)}°${Math.round((d % 1) * 60).toString().padStart(2, "0")}′ ${SIGNS[Math.floor(b.lon / 30)]!.name}${b.speed < 0 ? " ℞" : ""} · House ${b.house}`}</title>
        <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} stroke={color} strokeWidth={1.2} />
        {!compact && <line x1={t2x} y1={t2y} x2={lx} y2={ly} stroke={color} strokeOpacity={0.18} strokeWidth={0.8} />}
        {active && <circle cx={gx} cy={gy} r={compact ? 11 : 14} fill={ring === "outer" ? "#F6EEF0" : "#EFF3F0"} stroke={color} strokeOpacity={0.4} />}
        <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" className="glyph" fontSize={compact ? 28 : 22} fill={color}>
          {BODIES[b.id].glyph}
        </text>
        {!compact && showDegrees && (
          <text {...(() => { const [x, y] = pt(degR, a); return { x, y }; })()} textAnchor="middle" dominantBaseline="central" fontSize={11.5} fill="#77736F" fontFamily="Inter Variable, Inter, sans-serif">
            {Math.floor(d)}°{b.speed < 0 ? "℞" : ""}
          </text>
        )}
      </g>
    );
  };

  return (
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={compact ? "0 0 600 600" : "-22 -22 644 644"} className={cn("h-auto w-full select-none", className)} onClick={() => onSelect?.(null)} role="img" aria-label="Chart wheel">
      {/* zodiac ring */}
      <circle cx={C} cy={C} r={R_OUT} fill="#FFFFFF" stroke="#D6CFC6" strokeWidth={1.2} />
      {SIGNS.map((s, i) => {
        const a0 = ang(i * 30);
        const a1 = ang(i * 30 + 30);
        const [x0, y0] = pt(R_OUT, a0);
        const [x1, y1] = pt(R_OUT, a1);
        const [x2, y2] = pt(R_ZOD, a1);
        const [x3, y3] = pt(R_ZOD, a0);
        const [gx, gy] = pt((R_OUT + R_ZOD) / 2, ang(i * 30 + 15));
        const fill = { fire: "#F8F1EE", earth: "#F3F1EA", air: "#F2F3F2", water: "#EEF2F1" }[s.element];
        return (
          <g key={s.id}>
            <path d={`M${x0},${y0} A${R_OUT},${R_OUT} 0 0 0 ${x1},${y1} L${x2},${y2} A${R_ZOD},${R_ZOD} 0 0 1 ${x3},${y3} Z`} fill={fill} stroke="#E7E2DC" strokeWidth={0.8} />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" className="glyph" fontSize={compact ? 22 : 19} fill="#5A555B">
              <title>{s.name}</title>
              {s.glyph}
            </text>
          </g>
        );
      })}
      {/* degree ticks */}
      {!compact &&
        Array.from({ length: 72 }, (_, i) => {
          const a = ang(i * 5);
          const [x1, y1] = pt(R_ZOD, a);
          const [x2, y2] = pt(R_ZOD - (i % 2 === 0 ? 6 : 3), a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9C1B7" strokeWidth={0.7} />;
        })}
      <circle cx={C} cy={C} r={R_ZOD} fill="none" stroke="#D6CFC6" strokeWidth={1} />
      {bi && <circle cx={C} cy={C} r={R_SPLIT} fill="none" stroke="#E7E2DC" strokeWidth={1} strokeDasharray="2 3" />}
      <circle cx={C} cy={C} r={R_HOUSE} fill="#FDFCFA" stroke="#D6CFC6" strokeWidth={1} />
      <circle cx={C} cy={C} r={R_ASP} fill="#FFFFFF" stroke="#E7E2DC" strokeWidth={1} />

      {/* house cusps */}
      {showHouses &&
        inner.cusps.map((c, i) => {
          const angular = i % 3 === 0;
          const a = ang(c);
          const [x1, y1] = pt(R_ASP, a);
          const [x2, y2] = pt(angular ? R_OUT + 6 : R_ZOD, a);
          const next = inner.cusps[(i + 1) % 12]!;
          const mid = norm(c + norm(next - c) / 2);
          const [hx, hy] = pt((R_HOUSE + R_ASP) / 2, ang(mid));
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={angular ? "#29272B" : "#CFC7BD"} strokeWidth={angular ? 1.4 : 0.8} />
              {!compact && (
                <text x={hx} y={hy} textAnchor="middle" dominantBaseline="central" fontSize={10.5} fill="#A39D96" fontFamily="Inter Variable, Inter, sans-serif">
                  {i + 1}
                </text>
              )}
            </g>
          );
        })}

      {/* angles labels */}
      {!compact &&
        [
          { lon: inner.asc, label: "AC" },
          { lon: norm(inner.asc + 180), label: "DC" },
          { lon: inner.mc, label: "MC" },
          { lon: norm(inner.mc + 180), label: "IC" },
        ].map((x) => {
          const [lx, ly] = pt(R_OUT + 16, ang(x.lon));
          return (
            <text key={x.label} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={12.5} fontWeight={600} fill="#29272B" fontFamily="Inter Variable, Inter, sans-serif">
              {x.label}
            </text>
          );
        })}

      {/* aspect lines */}
      {showAspects &&
        aspects
          .filter((a) => a.type !== "conjunction")
          .filter((a) => !(compact && ASPECTS[a.type].nature === "minor"))
          .map((a) => {
            const k = aspectKey(a);
            const [x1, y1] = pt(R_ASP - 2, ang(lonOf(a.aRing, a.a)));
            const [x2, y2] = pt(R_ASP - 2, ang(lonOf(a.bRing, a.b)));
            const nat = ASPECTS[a.type].nature;
            const strong = highlightAspect === k;
            const visible = highlightAspect ? strong : isRelated(a);
            return (
              <line
                key={k}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={ASPECT_COLOR[nat]}
                strokeWidth={strong ? 2.4 : a.orb < 2 ? 1.4 : 0.9}
                strokeDasharray={nat === "minor" ? "3 3" : undefined}
                opacity={visible ? (strong ? 1 : focus ? 0.95 : 0.7) : 0.08}
              />
            );
          })}

      {/* bodies */}
      {inner.bodies.map((b) => renderBody(b, "inner", innerGlyphR, innerDegR, innerPos[b.id] ?? b.lon, bi ? R_SPLIT : R_ZOD))}
      {outer && outer.bodies.map((b) => renderBody(b, "outer", outerGlyphR, 215, outerPos[b.id] ?? b.lon, R_ZOD))}

      <circle cx={C} cy={C} r={2.5} fill="#D6CFC6" />
    </svg>
  );
}
