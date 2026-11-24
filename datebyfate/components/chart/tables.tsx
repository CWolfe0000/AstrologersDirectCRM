import type { CSSProperties } from "react";
import { BODIES, type Chart } from "@/lib/astro/types";
import { POINT_NAMES, houseOf } from "@/lib/astro/zodiac";
import { ASPECT_COLORS, ASPECT_GLYPHS, GLYPH_FONT, PLANET_GLYPHS, aspectsBetween, aspectsWithin, formatLon, type WheelAspect } from "@/lib/astro/wheel";

const glyph: CSSProperties = { fontFamily: GLYPH_FONT, fontVariantEmoji: "text" };
const TH = "px-2 py-1.5 text-left text-xs font-semibold text-muted";
const TD = "px-2 py-1.5 align-middle";

function Dot({ aspect }: { aspect: WheelAspect }) {
  return <span aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ASPECT_COLORS[aspect.cls] }} />;
}

/** Sun … Pluto, the North Node and, with a birth time, the Ascendant and Midheaven. */
export function PlacementsTable({ chart }: { chart: Chart }) {
  const houses = chart.houses;
  const rows: { key: string; glyph: string | null; short?: string; name: string; lon: number; house: number | null; retro: boolean }[] = BODIES.map((id) => ({
    key: id,
    glyph: PLANET_GLYPHS[id],
    name: POINT_NAMES[id],
    lon: chart.bodies[id].lon,
    house: houses ? houseOf(chart.bodies[id].lon, houses.cusps) : null,
    retro: chart.bodies[id].speed < 0,
  }));
  if (houses) {
    rows.push({ key: "asc", glyph: null, short: "ASC", name: POINT_NAMES.asc, lon: houses.asc, house: null, retro: false });
    rows.push({ key: "mc", glyph: null, short: "MC", name: POINT_NAMES.mc, lon: houses.mc, house: null, retro: false });
  }
  return (
    <table className="w-full border-collapse text-sm text-ink">
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={TH}>
            Planet
          </th>
          <th scope="col" className={TH}>
            Position
          </th>
          {houses && (
            <th scope="col" className={`${TH} text-right`}>
              House
            </th>
          )}
          <th scope="col" className={`${TH} text-center`}>
            <abbr title="Retrograde" className="no-underline">
              Rx
            </abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-b border-line last:border-b-0">
            <th scope="row" className={`${TD} whitespace-nowrap text-left font-medium`}>
              <span aria-hidden="true" className="mr-2 inline-block w-6 text-center text-muted" style={r.glyph ? { ...glyph, fontSize: "1.05rem", lineHeight: 1 } : { fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.02em" }}>
                {r.glyph ?? r.short}
              </span>
              {r.name}
            </th>
            <td className={`${TD} whitespace-nowrap tabular-nums`}>{formatLon(r.lon)}</td>
            {houses && <td className={`${TD} text-right tabular-nums`}>{r.house ?? ""}</td>}
            <td className={`${TD} text-center`}>{r.retro ? <abbr title="Retrograde" className="no-underline">R</abbr> : null}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The chart's own aspects, closest first. */
export function AspectTable({ chart }: { chart: Chart }) {
  const aspects = aspectsWithin(chart);
  if (!aspects.length) return <p className="text-sm text-muted">No major aspects within orb.</p>;
  return (
    <table className="w-full border-collapse text-sm text-ink">
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={TH}>
            Aspect
          </th>
          <th scope="col" className={`${TH} text-right`}>
            Orb
          </th>
        </tr>
      </thead>
      <tbody>
        {aspects.map((a) => (
          <tr key={`${a.a}-${a.b}`} className="border-b border-line last:border-b-0">
            <th scope="row" className={`${TD} text-left font-normal`}>
              <span className="flex items-center gap-2">
                <Dot aspect={a} />
                <span aria-hidden="true" className="inline-block w-14 shrink-0 whitespace-nowrap text-muted" style={{ ...glyph, fontSize: "1rem", lineHeight: 1 }}>
                  {PLANET_GLYPHS[a.a]} <span style={{ color: ASPECT_COLORS[a.cls] }}>{ASPECT_GLYPHS[a.name]}</span> {PLANET_GLYPHS[a.b]}
                </span>
                <span>
                  {POINT_NAMES[a.a]} {a.name} {POINT_NAMES[a.b]}
                </span>
              </span>
            </th>
            <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{a.orb.toFixed(1)}°</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Cross table of the aspects between two charts: rows are the inner chart's bodies, columns the outer chart's. */
export function AspectGrid({ inner, outer, innerLabel = "Inner chart", outerLabel = "Outer chart" }: { inner: Chart; outer: Chart; innerLabel?: string; outerLabel?: string }) {
  const found = new Map(aspectsBetween(inner, outer).map((a) => [`${a.a}-${a.b}`, a]));
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="border-collapse text-sm text-ink">
        <caption className="mb-2 whitespace-nowrap text-left text-xs text-muted">
          Rows: {innerLabel} · Columns: {outerLabel}
        </caption>
        <thead>
          <tr>
            <td className="border-b border-r border-line" />
            {BODIES.map((id) => (
              <th key={id} scope="col" title={`${outerLabel}: ${POINT_NAMES[id]}`} className="h-8 w-8 min-w-8 border-b border-line text-center font-normal" style={{ color: ASPECT_COLORS.hard }}>
                <span aria-hidden="true" style={{ ...glyph, fontSize: "1rem", lineHeight: 1 }}>
                  {PLANET_GLYPHS[id]}
                </span>
                <span className="sr-only">{POINT_NAMES[id]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BODIES.map((row) => (
            <tr key={row}>
              <th scope="row" title={`${innerLabel}: ${POINT_NAMES[row]}`} className="h-8 w-8 min-w-8 border-r border-line text-center font-normal">
                <span aria-hidden="true" style={{ ...glyph, fontSize: "1rem", lineHeight: 1 }}>
                  {PLANET_GLYPHS[row]}
                </span>
                <span className="sr-only">{POINT_NAMES[row]}</span>
              </th>
              {BODIES.map((col) => {
                const a = found.get(`${row}-${col}`);
                const text = a ? `${POINT_NAMES[row]} ${a.name} ${POINT_NAMES[col]}, orb ${a.orb.toFixed(1)}°` : undefined;
                return (
                  <td key={col} title={text} className="h-8 w-8 min-w-8 border border-line text-center">
                    {a && (
                      <>
                        <span aria-hidden="true" style={{ ...glyph, color: ASPECT_COLORS[a.cls], fontSize: "0.95rem", lineHeight: 1 }}>
                          {ASPECT_GLYPHS[a.name]}
                        </span>
                        <span className="sr-only">{text}</span>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
