"use client";

import * as React from "react";
import { ASPECTS, BODIES, SIGNS, degInSign, norm, type AspectId, type BodyId, type ChartPoints } from "@/lib/astro";

/**
 * Natal chart in the middle with up to three moving rings around it
 * (progressions, solar arcs, transits — whichever are on). Lines in the
 * centre join each moving planet to the natal point it aspects.
 */
export interface MovingRing {
  key: string;
  label: string;
  color: string;
  points: ChartPoints;
}
export interface RingContact {
  ring: string;
  from: BodyId;
  to: BodyId;
  type: AspectId;
  orb: number;
  applying: boolean;
}

const C = 300;
const pt = (r: number, a: number) => {
  const rad = (a * Math.PI) / 180;
  return [Math.round((C + r * Math.cos(rad)) * 100) / 100, Math.round((C - r * Math.sin(rad)) * 100) / 100] as const;
};
function spread(items: { key: string; lon: number }[], minSep: number) {
  const sorted = [...items].sort((a, b) => a.lon - b.lon).map((i) => ({ ...i, pos: i.lon }));
  const n = sorted.length;
  for (let pass = 0; pass < 80 && n > 1; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const a = sorted[i]!, b = sorted[(i + 1) % n]!;
      const d = i === n - 1 ? b.pos + 360 - a.pos : b.pos - a.pos;
      if (d < minSep) {
        a.pos -= (minSep - d) / 2;
        b.pos += (minSep - d) / 2;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return Object.fromEntries(sorted.map((s) => [s.key, norm(s.pos)])) as Record<string, number>;
}

const R_OUT = 290, R_ZOD = 258, BAND = 36;

export function MultiWheel({ natal, rings, contacts, selected, onSelect }: { natal: ChartPoints; rings: MovingRing[]; contacts: RingContact[]; selected: string | null; onSelect: (k: string | null) => void }) {
  const [hover, setHover] = React.useState<string | null>(null);
  const focus = hover ?? selected;
  const ang = (lon: number) => 180 + norm(lon - natal.asc);
  const natalOuter = R_ZOD - 4 - rings.length * BAND;
  const R_HOUSE = natalOuter - 42;
  const R_ASP = R_HOUSE - 14;
  const related = (c: RingContact) => !focus || focus === `${c.ring}:${c.from}` || focus === `natal:${c.to}`;
  const involved = (key: string) => !focus || focus === key || contacts.some((c) => related(c) && (`${c.ring}:${c.from}` === key || `natal:${c.to}` === key));
  const lonOf = (pts: ChartPoints, id: BodyId) => (id === "asc" ? pts.asc : id === "mc" ? pts.mc : pts.bodies.find((b) => b.id === id)?.lon ?? 0);
  const sel = (key: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(selected === key ? null : key);
  };

  const ringGlyphs = (key: string, pts: ChartPoints, glyphR: number, tickR: number, color: string, small: boolean) => {
    const pos = spread(pts.bodies.map((b) => ({ key: b.id, lon: b.lon })), small ? 6.5 : 7.5);
    return pts.bodies.map((b) => {
      const k = `${key}:${b.id}`;
      const a = ang(pos[b.id]!);
      const [gx, gy] = pt(glyphR, a);
      const [t1x, t1y] = pt(tickR, ang(b.lon));
      const [t2x, t2y] = pt(tickR - 6, ang(b.lon));
      const [dx, dy] = pt(glyphR - (small ? 13 : 15), a);
      const on = focus === k;
      const d = degInSign(b.lon);
      return (
        <g key={k} className="cursor-pointer" opacity={involved(k) ? 1 : 0.28} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} onClick={sel(k)}>
          <title>{`${BODIES[b.id].name} ${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, "0")}′ ${SIGNS[Math.floor(b.lon / 30)]!.name}${b.speed < 0 ? " ℞" : ""}`}</title>
          <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} stroke={color} strokeWidth={1.2} />
          {on && <circle cx={gx} cy={gy} r={12} fill="#FFFFFF" stroke={color} strokeOpacity={0.5} />}
          <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" className={b.id === "vertex" ? undefined : "glyph"} fontSize={small ? 16 : 19} fill={color}>{BODIES[b.id].glyph}</text>
          <text x={dx} y={dy} textAnchor="middle" dominantBaseline="central" fontSize={9.5} fill="#68645F" fontFamily="Inter Variable, Inter, sans-serif">{Math.floor(d)}{b.speed < 0 ? "℞" : ""}</text>
        </g>
      );
    });
  };

  return (
    <svg viewBox="-24 -24 648 648" className="h-auto w-full select-none" onClick={() => onSelect(null)} role="img" aria-label={`Natal chart with ${rings.map((r) => r.label.toLowerCase()).join(", ") || "no moving"} rings`}>
      <circle cx={C} cy={C} r={R_OUT} fill="#FFFFFF" stroke="#D6CFC6" strokeWidth={1.2} />
      {SIGNS.map((s, i) => {
        const a0 = ang(i * 30), a1 = ang(i * 30 + 30);
        const [x0, y0] = pt(R_OUT, a0), [x1, y1] = pt(R_OUT, a1), [x2, y2] = pt(R_ZOD, a1), [x3, y3] = pt(R_ZOD, a0);
        const [gx, gy] = pt((R_OUT + R_ZOD) / 2, ang(i * 30 + 15));
        const fill = { fire: "#F8F1EE", earth: "#F3F1EA", air: "#F2F3F2", water: "#EEF2F1" }[s.element];
        return (
          <g key={s.id}>
            <path d={`M${x0},${y0} A${R_OUT},${R_OUT} 0 0 0 ${x1},${y1} L${x2},${y2} A${R_ZOD},${R_ZOD} 0 0 1 ${x3},${y3} Z`} fill={fill} stroke="#E7E2DC" strokeWidth={0.8} />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" className="glyph" fontSize={17} fill="#5A555B">{s.glyph}</text>
          </g>
        );
      })}
      {/* ring bands, outermost first */}
      {rings.map((r, i) => {
        const outer = R_ZOD - 4 - i * BAND;
        return (
          <g key={r.key}>
            <circle cx={C} cy={C} r={outer} fill="none" stroke="#E7E2DC" strokeWidth={1} />
            {ringGlyphs(r.key, r.points, outer - 14, outer, r.color, true)}
          </g>
        );
      })}
      <circle cx={C} cy={C} r={natalOuter} fill="#FDFCFA" stroke="#D6CFC6" strokeWidth={1} />
      {/* natal houses */}
      {natal.cusps.map((c, i) => {
        const angular = i % 3 === 0;
        const [x1, y1] = pt(R_ASP, ang(c));
        const [x2, y2] = pt(angular ? R_OUT + 6 : natalOuter, ang(c));
        const next = natal.cusps[(i + 1) % 12]!;
        const [hx, hy] = pt((R_HOUSE + R_ASP) / 2, ang(norm(c + norm(next - c) / 2)));
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={angular ? "#29272B" : "#D6CFC6"} strokeWidth={angular ? 1.3 : 0.7} />
            <text x={hx} y={hy} textAnchor="middle" dominantBaseline="central" fontSize={9.5} fill="#A39D96" fontFamily="Inter Variable, Inter, sans-serif">{i + 1}</text>
          </g>
        );
      })}
      {[["AC", natal.asc], ["DC", natal.asc + 180], ["MC", natal.mc], ["IC", natal.mc + 180]].map(([l, lon]) => {
        const [x, y] = pt(R_OUT + 15, ang(lon as number));
        return <text key={l as string} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11.5} fontWeight={600} fill="#29272B" fontFamily="Inter Variable, Inter, sans-serif">{l}</text>;
      })}
      <circle cx={C} cy={C} r={R_HOUSE} fill="none" stroke="#E7E2DC" strokeWidth={1} />
      <circle cx={C} cy={C} r={R_ASP} fill="#FFFFFF" stroke="#E7E2DC" strokeWidth={1} />
      {ringGlyphs("natal", natal, natalOuter - 18, natalOuter, "#29272B", false)}
      {/* contact lines: moving planet → natal point */}
      {contacts.map((c) => {
        const ring = rings.find((r) => r.key === c.ring);
        if (!ring) return null;
        const [x1, y1] = pt(R_ASP - 2, ang(lonOf(ring.points, c.from)));
        const [x2, y2] = pt(R_ASP - 2, ang(lonOf(natal, c.to)));
        const on = related(c);
        return <line key={`${c.ring}${c.from}${c.to}${c.type}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ring.color} strokeWidth={on && focus ? 1.8 : 1.1} strokeOpacity={on ? (focus ? 0.95 : 0.6) : 0.07} strokeDasharray={ASPECTS[c.type].nature === "soft" ? "4 3" : undefined} />;
      })}
    </svg>
  );
}

