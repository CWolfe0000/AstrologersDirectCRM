"use client";

import * as React from "react";
import { Loader2, MapPin } from "lucide-react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import { acgLines, linesNear, type AcgAngle, type AcgLine } from "@/lib/astro/acg";
import { BODIES, getEngine } from "@/lib/astro";
import type { BirthData, BodyId, ChartSettings } from "@/lib/astro/types";
import { cn } from "@/lib/utils";
import { PlaceLookup, type PlaceValue } from "@/components/clients/place-lookup";

const W = 1000;
const H = 500;
const x = (lon: number) => ((lon + 180) / 360) * W;
const y = (lat: number) => ((90 - lat) / 180) * H;

const COLORS: Partial<Record<BodyId, string>> = {
  sun: "#C08A1E", moon: "#6F7C8F", mercury: "#3E8E7E", venus: "#C2577A", mars: "#B23A2E", jupiter: "#6B4FA0",
  saturn: "#4A4540", uranus: "#2E7FB8", neptune: "#3D5BA9", pluto: "#7A3B5C", node: "#8A8A3A", chiron: "#8C6A4F",
};
const ANGLES: { id: AcgAngle; label: string; dash?: string }[] = [
  { id: "MC", label: "Midheaven (MC)" },
  { id: "IC", label: "IC", dash: "5 4" },
  { id: "ASC", label: "Rising (ASC)" },
  { id: "DSC", label: "Setting (DSC)", dash: "5 4" },
];
const ANGLE_WORD: Record<AcgAngle, string> = { MC: "culminating (MC)", IC: "anti-culminating (IC)", ASC: "rising (ASC)", DSC: "setting (DSC)" };

/** A polyline as an SVG path, breaking where it crosses the date line. */
function pathOf(points: [number, number][]) {
  let d = "";
  let prev: number | null = null;
  for (const [lon, lat] of points) {
    const jump = prev !== null && Math.abs(lon - prev) > 180;
    d += `${d === "" || jump ? "M" : "L"}${x(lon).toFixed(1)},${y(lat).toFixed(1)}`;
    prev = lon;
  }
  return d;
}

let landCache: string | null = null;
async function landPath() {
  if (landCache) return landCache;
  const topo = (await import("world-atlas/land-110m.json")).default as unknown as Topology;
  const land = feature(topo, topo.objects.land!) as unknown as { features: { geometry: { type: string; coordinates: number[][][][] | number[][][] } }[] };
  let d = "";
  for (const f of land.features) {
    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
    for (const poly of polys) for (const ring of poly) d += pathOf(ring.map(([lon, lat]) => [lon!, lat!] as [number, number])) + "Z";
  }
  landCache = d;
  return d;
}

export function AstroMap({ birth, settings, compact }: { birth: BirthData; settings: ChartSettings; compact?: boolean }) {
  const [lines, setLines] = React.useState<AcgLine[] | null>(null);
  const [land, setLand] = React.useState<string | null>(landCache);
  const [error, setError] = React.useState<string | null>(null);
  const bodies = settings.bodies.filter((b) => b !== "asc" && b !== "mc" && COLORS[b]);
  const [hidden, setHidden] = React.useState<Set<string>>(new Set(["node", "chiron"]));
  const [angles, setAngles] = React.useState<Set<AcgAngle>>(new Set(["MC", "IC", "ASC", "DSC"]));
  const [place, setPlace] = React.useState<PlaceValue | null>(null);
  const [hover, setHover] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const engine = getEngine();
    if (!engine.acg) {
      setError("Astrocartography isn’t available with this calculation engine.");
      return;
    }
    setLines(null);
    engine
      .acg(birth, settings)
      .then((d) => !cancelled && setLines(acgLines(d)))
      .catch((e: Error) => !cancelled && setError(e.message || "Calculation failed"));
    landPath().then((d) => !cancelled && setLand(d));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birth.date, birth.time, birth.lat, birth.lon, birth.tz, settings.bodies.join()]);

  const shown = (lines ?? []).filter((l) => bodies.includes(l.body) && !hidden.has(l.body) && angles.has(l.angle));
  const near = place && lines ? linesNear(lines.filter((l) => bodies.includes(l.body)), place.lat, place.lon, 800) : [];
  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  if (error) return <p className="rounded-lg border border-line bg-canvas px-4 py-6 text-center text-[13px] text-muted">{error}</p>;

  const map = (
    <div className="relative overflow-hidden rounded-lg border border-line bg-[#EEF2F4]">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Astrocartography map: ${shown.length} planetary lines`}>
        {[-60, -30, 0, 30, 60].map((lat) => <line key={`lat${lat}`} x1={0} x2={W} y1={y(lat)} y2={y(lat)} stroke="#D9E0E4" strokeWidth={lat === 0 ? 1 : 0.6} />)}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => <line key={`lon${lon}`} y1={0} y2={H} x1={x(lon)} x2={x(lon)} stroke="#D9E0E4" strokeWidth={lon === 0 ? 1 : 0.6} />)}
        {land && <path d={land} fill="#F7F5F1" stroke="#C9C2B8" strokeWidth={0.6} />}
        {shown.map((l) => {
          const key = `${l.body}-${l.angle}`;
          const dash = ANGLES.find((a) => a.id === l.angle)!.dash;
          return (
            <g key={key} onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)}>
              {l.segments.map((seg, i) => (
                <path key={i} d={pathOf(seg)} fill="none" stroke={COLORS[l.body]} strokeWidth={hover === key ? 3 : compact ? 1.2 : 1.7} strokeDasharray={dash} strokeLinecap="round" opacity={hover && hover !== key ? 0.35 : 0.95}>
                  <title>{`${BODIES[l.body].name} ${ANGLE_WORD[l.angle]}`}</title>
                </path>
              ))}
              {!compact && (l.angle === "MC" || l.angle === "IC") && l.segments[0]?.[0] && (
                <text x={x(l.segments[0][0][0]) + 3} y={l.angle === "MC" ? 16 : H - 6} fontSize={13} fill={COLORS[l.body]} className="glyph" pointerEvents="none">
                  {BODIES[l.body].glyph}
                  <tspan fontSize={9} dx={1}>{l.angle}</tspan>
                </text>
              )}
            </g>
          );
        })}
        <g pointerEvents="none">
          <circle cx={x(birth.lon)} cy={y(birth.lat)} r={compact ? 3 : 5} fill="#29272B" stroke="#fff" strokeWidth={1.5} />
          {place && <circle cx={x(place.lon)} cy={y(place.lat)} r={6} fill="none" stroke="#824B59" strokeWidth={2} />}
        </g>
      </svg>
      {!lines && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Calculating lines" />
        </div>
      )}
    </div>
  );
  if (compact) return map;

  return (
    <div className="space-y-4">
      {map}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-ink" /> Birthplace</span>
        {ANGLES.map((a) => (
          <button key={a.id} type="button" aria-pressed={angles.has(a.id)} onClick={() => setAngles(toggle(angles, a.id))} className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1", angles.has(a.id) ? "border-line-strong text-ink" : "border-line text-muted line-through")}>
            <svg width="22" height="6" aria-hidden><line x1="0" x2="22" y1="3" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray={a.dash} /></svg>
            {a.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Planets shown">
        {bodies.map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={!hidden.has(b)}
            onClick={() => setHidden(toggle(hidden, b))}
            className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px]", hidden.has(b) ? "border-line text-muted" : "border-line-strong bg-surface text-ink")}
          >
            <span className="size-2.5 rounded-full" style={{ background: hidden.has(b) ? "#D6CFC6" : COLORS[b] }} />
            <span className="glyph">{BODIES[b].glyph}</span> {BODIES[b].name}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-ink"><MapPin className="size-4 text-accent" /> Lines Near a Place</p>
        <p className="mb-3 mt-0.5 text-[12.5px] text-muted">Look up a city to see which lines pass within 800 km of it.</p>
        <div className="max-w-md"><PlaceLookup value={place} onChange={setPlace} id="acg-place" /></div>
        {place && lines && (
          near.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No lines within 800 km of {place.place.split(",")[0]}.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
              {near.map((n) => (
                <li key={`${n.body}-${n.angle}`} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                  <span className="size-2.5 rounded-full" style={{ background: COLORS[n.body] }} />
                  <span className="glyph text-[15px]">{BODIES[n.body].glyph}</span>
                  <span className="flex-1 text-ink">{BODIES[n.body].name} {ANGLE_WORD[n.angle]}</span>
                  <span className="tabular-nums text-muted">{n.km.toLocaleString()} km</span>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
