import { BODIES, type BodyId, type Chart } from "@/lib/astro/types";
import { POINT_NAMES, SIGNS, norm360 } from "@/lib/astro/zodiac";
import { ASPECT_COLORS, GLYPH_FONT, PLANET_GLYPHS, RETROGRADE_GLYPH, SIGN_GLYPHS, aspectsBetween, aspectsWithin, degInSign, formatLon, spreadLabels } from "@/lib/astro/wheel";

const C = 300; // centre of the 600 × 600 viewBox
const TEXT_FONT = 'Inter, "Inter Variable", system-ui, sans-serif';
const INK = "#29272B";
const ACCENT = "#824B59";
const MUTED = "#68645F";
const ELEMENT_FILL = { fire: "#F8F1EE", earth: "#F3F1EA", air: "#F2F3F2", water: "#EEF2F1" } as const;
const glyphStyle = { fontFamily: GLYPH_FONT, fontVariantEmoji: "text" } as const;
/** A white edge behind text, so cusp lines passing under a label do not cut through it. */
const halo = { stroke: "#FFFFFF", strokeWidth: 4, strokeLinejoin: "round", paintOrder: "stroke" } as const;

/** Point at radius r and screen angle a (degrees, counter-clockwise from 3 o'clock). */
function pt(r: number, a: number) {
  const rad = (a * Math.PI) / 180;
  return [Math.round((C + r * Math.cos(rad)) * 100) / 100, Math.round((C - r * Math.sin(rad)) * 100) / 100] as const;
}

export interface ChartWheelProps {
  /** The chart in the middle of the wheel. */
  chart: Chart;
  /** A second chart drawn as an outer ring (bi-wheel); aspect lines then run between the two charts. */
  outer?: Chart;
  /** Names the charts, for the accessible description and the caption of a bi-wheel. */
  label?: string;
  outerLabel?: string;
  className?: string;
}

export function ChartWheel({ chart, outer, label = "Birth chart", outerLabel = "Second chart", className }: ChartWheelProps) {
  const houses = chart.houses;
  const bi = !!outer;
  // The Ascendant sits at 9 o'clock; without a birth time 0° Aries does.
  const base = houses ? houses.asc : 0;
  const ang = (lon: number) => 180 + norm360(lon - base);

  const R_OUT = 270;
  const R_ZOD = 236;
  const R_SPLIT = 187;
  const R_HOUSE = bi ? 134 : 158;
  const R_ASP = houses ? (bi ? 117 : 138) : R_HOUSE;
  const inR = bi ? { glyph: 168, deg: 148, edge: R_SPLIT, font: 18, degFont: 9.5 } : { glyph: 207, deg: 181, edge: R_ZOD, font: 22, degFont: 11.5 };
  const outR = { glyph: 218, deg: 198, edge: R_ZOD, font: 18, degFont: 9.5 };

  const innerPos = spreadLabels(BODIES.map((id) => ({ key: id, lon: chart.bodies[id].lon })), bi ? 9.5 : 9);
  const outerPos = outer ? spreadLabels(BODIES.map((id) => ({ key: id, lon: outer.bodies[id].lon })), 7.5) : null;
  const aspects = outer ? aspectsBetween(chart, outer) : aspectsWithin(chart);

  const name = outer ? `${label} (inner wheel) with ${outerLabel} (outer wheel)` : label;
  const title = `Chart wheel: ${name}`;

  /** The tick at a body's true position and the hairline leading to its (possibly moved) label. */
  const renderLeader = (id: BodyId, c: Chart, display: number, r: typeof inR, color: string, who: string) => {
    const trueA = ang(c.bodies[id].lon);
    const [t1x, t1y] = pt(r.edge, trueA);
    const [t2x, t2y] = pt(r.edge - 5, trueA);
    const [lx, ly] = pt(r.glyph + r.font * 0.5, ang(display));
    return (
      <g key={`${who}-${id}`}>
        <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} stroke={color} strokeWidth={1.3} />
        <line x1={t2x} y1={t2y} x2={lx} y2={ly} stroke={color} strokeOpacity={0.35} strokeWidth={0.8} />
      </g>
    );
  };

  const renderBody = (id: BodyId, c: Chart, display: number, r: typeof inR, color: string, who: string | null) => {
    const b = c.bodies[id];
    const a = ang(display);
    const [gx, gy] = pt(r.glyph, a);
    const [dx, dy] = pt(r.deg, a);
    const retro = b.speed < 0;
    return (
      <g key={`${who ?? "chart"}-${id}`}>
        <title>{`${who ? `${who}: ` : ""}${POINT_NAMES[id]} ${formatLon(b.lon)}${retro ? " retrograde" : ""}`}</title>
        <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" fontSize={r.font} fill={color} style={glyphStyle} {...halo}>
          {PLANET_GLYPHS[id]}
        </text>
        <text x={dx} y={dy} textAnchor="middle" dominantBaseline="central" fontSize={r.degFont} fill={MUTED} fontFamily={TEXT_FONT} {...halo}>
          {Math.floor(degInSign(b.lon))}°
          {retro && (
            <tspan fontSize={r.degFont - 1} style={glyphStyle}>
              {RETROGRADE_GLYPH}
            </tspan>
          )}
        </text>
      </g>
    );
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label={title} className={className} style={{ display: "block", width: "100%", height: "auto" }}>
      <title>{title}</title>

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
        return (
          <g key={s.name}>
            <title>{s.name}</title>
            <path d={`M${x0},${y0} A${R_OUT},${R_OUT} 0 0 0 ${x1},${y1} L${x2},${y2} A${R_ZOD},${R_ZOD} 0 0 1 ${x3},${y3} Z`} fill={ELEMENT_FILL[s.element]} stroke="#DDD6CD" strokeWidth={0.8} />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" fontSize={20} fill="#5A555B" style={glyphStyle}>
              {SIGN_GLYPHS[i]}
            </text>
          </g>
        );
      })}

      {/* degree ticks: every degree, longer at 5° and 10° */}
      {Array.from({ length: 360 }, (_, i) => {
        if (i % 30 === 0) return null;
        const a = ang(i);
        const len = i % 10 === 0 ? 7 : i % 5 === 0 ? 5 : 2.5;
        const [x1, y1] = pt(R_ZOD, a);
        const [x2, y2] = pt(R_ZOD - len, a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9C1B7" strokeWidth={i % 5 === 0 ? 0.8 : 0.5} />;
      })}
      <circle cx={C} cy={C} r={R_ZOD} fill="none" stroke="#D6CFC6" strokeWidth={1} />
      {bi && <circle cx={C} cy={C} r={R_SPLIT} fill="none" stroke="#D6CFC6" strokeWidth={0.9} strokeDasharray="2 3" />}
      {houses && <circle cx={C} cy={C} r={R_HOUSE} fill="#FDFCFA" stroke="#D6CFC6" strokeWidth={1} />}
      <circle cx={C} cy={C} r={R_ASP} fill="#FFFFFF" stroke={houses ? "#E7E2DC" : "#D6CFC6"} strokeWidth={1} />

      {/* house cusps and numbers */}
      {houses &&
        houses.cusps.map((cusp, i) => {
          const angular = i % 3 === 0;
          const a = ang(cusp);
          const [x1, y1] = pt(R_ASP, a);
          const [x2, y2] = pt(angular ? R_OUT + 5 : R_ZOD, a);
          const next = houses.cusps[(i + 1) % 12]!;
          const mid = norm360(cusp + norm360(next - cusp) / 2);
          const [hx, hy] = pt((R_HOUSE + R_ASP) / 2, ang(mid));
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={angular ? INK : "#CFC7BD"} strokeWidth={angular ? 1.4 : 0.8} />
              <text x={hx} y={hy} textAnchor="middle" dominantBaseline="central" fontSize={10.5} fill="#8F8982" fontFamily={TEXT_FONT}>
                {i + 1}
              </text>
            </g>
          );
        })}

      {/* the angles */}
      {houses &&
        [
          { lon: houses.asc, short: "ASC", name: "Ascendant" },
          { lon: houses.asc + 180, short: "DSC", name: "Descendant" },
          { lon: houses.mc, short: "MC", name: "Midheaven" },
          { lon: houses.mc + 180, short: "IC", name: "Imum Coeli" },
        ].map((x) => {
          const [lx, ly] = pt(R_OUT + 16, ang(x.lon));
          return (
            <text key={x.short} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={10.5} fontWeight={600} letterSpacing={0.3} fill={INK} fontFamily={TEXT_FONT}>
              <title>{`${x.name} ${formatLon(x.lon)}`}</title>
              {x.short}
            </text>
          );
        })}

      {/* aspect lines: between the two charts in a bi-wheel, otherwise within the chart */}
      {aspects.map((asp) => {
        const lonA = chart.bodies[asp.a].lon;
        const lonB = (outer ?? chart).bodies[asp.b].lon;
        const [x1, y1] = pt(R_ASP - 3, ang(lonA));
        const [x2, y2] = pt(R_ASP - 3, ang(lonB));
        const opacity = Math.round(Math.max(0.2, 0.95 - 0.75 * (asp.orb / 10)) * 100) / 100;
        return <line key={`${asp.a}-${asp.b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ASPECT_COLORS[asp.cls]} strokeWidth={asp.orb < 2 ? 1.5 : 1} strokeLinecap="round" opacity={opacity} />;
      })}
      {/* where each body meets the aspect circle */}
      {BODIES.map((id) => {
        const [x, y] = pt(R_ASP - 3, ang(chart.bodies[id].lon));
        return <circle key={id} cx={x} cy={y} r={1.8} fill={INK} />;
      })}
      {outer &&
        BODIES.map((id) => {
          const [x, y] = pt(R_ASP - 3, ang(outer.bodies[id].lon));
          return <circle key={id} cx={x} cy={y} r={1.8} fill="#FFFFFF" stroke={ACCENT} strokeWidth={1} />;
        })}

      {/* bodies: every tick and leader first, so no leader crosses a glyph */}
      {BODIES.map((id) => renderLeader(id, chart, innerPos[id], inR, INK, "inner"))}
      {outer && outerPos && BODIES.map((id) => renderLeader(id, outer, outerPos[id], outR, ACCENT, "outer"))}
      {BODIES.map((id) => renderBody(id, chart, innerPos[id], inR, INK, outer ? label : null))}
      {outer && outerPos && BODIES.map((id) => renderBody(id, outer, outerPos[id], outR, ACCENT, outerLabel))}

      {/* which ring is whose */}
      {outer && (
        <g fontFamily={TEXT_FONT} fontSize={11.5}>
          <circle cx={10} cy={13} r={3.5} fill={INK} />
          <text x={19} y={13} dominantBaseline="central" fill={INK}>
            Inner: {label}
          </text>
          <circle cx={10} cy={30} r={3.5} fill={ACCENT} />
          <text x={19} y={30} dominantBaseline="central" fill={ACCENT}>
            Outer: {outerLabel}
          </text>
        </g>
      )}
    </svg>
  );
}
