"use client";

import * as React from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { BODIES, SIGNS, degInSign, fmtDeg, norm, signOf, type BodyId, type ChartView } from "@/lib/astro";
import type { ZodiacType } from "@/lib/astro/types";
import { DATA_MODE } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Breakdown, BTable } from "@/components/ui/breakdown";

type Ref = { n: number; name: string };
type Pos = Ref & { lon?: number; lat?: number; speed?: number; error?: string };
const NONE: Ref[] = [];
const cache = new Map<string, Promise<Pos[]>>();
const ORB = 2;

/** Conjunctions and oppositions to the chart's planets and angles, within 2°. */
function contacts(lon: number, view: ChartView) {
  const pts: { id: string; name: string; lon: number }[] = [
    ...view.inner.bodies.map((b) => ({ id: b.id, name: BODIES[b.id as BodyId]?.name ?? b.id, lon: b.lon })),
    { id: "asc", name: "Ascendant", lon: view.inner.asc },
    { id: "mc", name: "Midheaven", lon: view.inner.mc },
    { id: "dsc", name: "Descendant", lon: norm(view.inner.asc + 180) },
    { id: "ic", name: "IC", lon: norm(view.inner.mc + 180) },
  ];
  const out: { name: string; aspect: string; orb: number }[] = [];
  for (const p of pts) {
    const d = Math.abs(((lon - p.lon + 540) % 360) - 180);
    if (d <= ORB) out.push({ name: p.name, aspect: "Conjunct", orb: d });
    else if (180 - d <= ORB) out.push({ name: p.name, aspect: "Opposite", orb: 180 - d });
  }
  return out.sort((a, b) => a.orb - b.orb);
}

const houseOf = (lon: number, cusps: number[]) => {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i]!, b = cusps[(i + 1) % 12]!;
    if (norm(lon - a) < norm(b - a)) return i + 1;
  }
  return null;
};

/**
 * Any numbered asteroid, added by name or number. The list is the practice's
 * own and shows on every chart; positions come from NASA JPL.
 */
export function AsteroidsPanel({ view, utc, zodiac = "tropical" }: { view: ChartView; utc: string | null; zodiac?: ZodiacType }) {
  const list = useStore((s) => s.defaults.asteroids ?? NONE);
  const updateDefaults = useStore((s) => s.updateDefaults);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Ref[] | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [pos, setPos] = React.useState<Pos[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return setResults(null);
    let live = true;
    setSearching(true);
    const t = setTimeout(() => {
      api<{ results: Ref[] }>("/api/v1/astro/asteroid-search", { body: { q: query } })
        .then((r) => live && setResults(r.results), (e: Error) => live && setError(e.message))
        .finally(() => live && setSearching(false));
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  React.useEffect(() => {
    if (!utc || !list.length || DATA_MODE !== "server") return setPos(null);
    const key = `${utc}|${zodiac}|${list.map((a) => a.n).join(",")}`;
    let p = cache.get(key);
    if (!p) {
      p = api<{ asteroids: Pos[] }>("/api/v1/astro/asteroids", { body: { utc, list, settings: { zodiac } } }).then((r) => r.asteroids);
      cache.set(key, p);
    }
    let live = true;
    setPos(null);
    p.then((x) => live && setPos(x), (e: Error) => { cache.delete(key); if (live) setError(e.message); });
    return () => { live = false; };
  }, [utc, zodiac, list]);

  const add = (a: Ref) => {
    if (!list.some((x) => x.n === a.n)) updateDefaults({ asteroids: [...list, a].slice(0, 30) });
    setQ("");
    setResults(null);
  };
  const remove = (n: number) => updateDefaults({ asteroids: list.filter((x) => x.n !== n) });

  if (DATA_MODE !== "server") return <p className="text-[13px] text-muted">Asteroids from the full catalog are calculated in the live app.</p>;
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-[13px] font-semibold text-ink">Asteroids</h3>
        <p className="text-[12.5px] text-muted">Add any numbered asteroid by name or number: Eros, Psyche, Sappho, Chariklo, Eris… Your list shows on every chart. Ceres, Pallas, Juno, Vesta and Chiron are in the main chart settings.</p>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input aria-label="Find an Asteroid" placeholder="Find an asteroid by name or number" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" maxLength={60} />
        {searching && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />}
        {results && (
          <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-surface shadow-lg" role="listbox" aria-label="Asteroids Found">
            {results.length === 0 ? (
              <li className="px-3 py-2 text-[12.5px] text-muted">No numbered asteroid matches “{q.trim()}”.</li>
            ) : (
              results.map((r) => (
                <li key={r.n} role="option" aria-selected={false}>
                  <button type="button" onClick={() => add(r)} disabled={list.some((x) => x.n === r.n)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-canvas-2 disabled:opacity-50">
                    <span><span className="font-medium text-ink">{r.name}</span> <span className="text-muted">({r.n})</span></span>
                    {list.some((x) => x.n === r.n) ? <span className="text-[11.5px] text-muted">Added</span> : <Plus className="size-4 text-accent" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[13px] text-muted">No asteroids added yet.</p>
      ) : !utc ? (
        <p className="text-[12.5px] text-muted">Asteroid positions need a birth time (or a chart moment).</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line" aria-label="Your Asteroids">
          {list.map((a) => {
            const p = pos?.find((x) => x.n === a.n);
            const c = p?.lon !== undefined ? contacts(p.lon, view) : [];
            const house = p?.lon !== undefined && view.inner.cusps?.length === 12 ? houseOf(p.lon, view.inner.cusps) : null;
            return (
              <li key={a.n} className="px-3 py-2.5 text-[12.5px]" aria-label={`${a.name} (${a.n})`}>
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1"><span className="font-medium text-ink">{a.name}</span> <span className="text-muted">({a.n})</span></span>
                  <span className="tabular-nums text-ink">
                    {!pos ? <Loader2 className="size-3.5 animate-spin text-muted" /> : p?.lon === undefined ? <span className="text-muted">{p?.error ?? "Not available"}</span> : (
                      <>{Math.floor(degInSign(p.lon))}° <span className="glyph">{SIGNS[Math.floor(p.lon / 30)]!.glyph}</span> {String(Math.floor((degInSign(p.lon) % 1) * 60)).padStart(2, "0")}′ {signOf(p.lon).name}{(p.speed ?? 0) < 0 && <span className="text-muted"> ℞</span>}{house && <span className="text-muted"> · House {house}</span>}</>
                    )}
                  </span>
                  <button type="button" onClick={() => remove(a.n)} aria-label={`Remove ${a.name}`} className="rounded p-1 text-muted hover:bg-canvas-2 hover:text-ink"><X className="size-3.5" /></button>
                </div>
                {c.length > 0 && <p className="mt-0.5 text-ink-3">{c.map((x) => `${x.aspect} ${x.name} (${x.orb.toFixed(1)}°)`).join(" · ")}</p>}
              </li>
            );
          })}
        </ul>
      )}
      {pos && pos.some((p) => p.lon !== undefined) && (
        <Breakdown>
          <BTable className="min-w-0" head={["Asteroid", "Longitude", "Latitude", "Daily Motion"]} rows={pos.filter((p) => p.lon !== undefined).map((p) => [`${p.name} (${p.n})`, `${fmtDeg(p.lon!)} ${signOf(p.lon!).name} (${p.lon!.toFixed(4)}°)`, `${p.lat!.toFixed(2)}°`, `${p.speed!.toFixed(3)}°/day`])} />
          <p>Positions from NASA JPL Horizons: apparent geocentric ecliptic longitude and latitude of date, the same frame as the Swiss Ephemeris tropical zodiac (checked against Swiss for Ceres and Vesta to better than an arcsecond). {zodiac === "tropical" ? "" : "Sidereal positions subtract the chart’s ayanamsa as the Swiss Ephemeris applies it. "}Daily motion is from a second position twelve hours later; ℞ marks retrograde. Contacts are conjunctions and oppositions within {ORB}° of a planet or angle; other aspects aren’t counted. Houses use the chart’s house cusps.</p>
        </Breakdown>
      )}
    </section>
  );
}
