"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { ASPECTS, BODIES, type Aspect, type AspectId, type BodyId, type ChartView } from "@/lib/astro";
import type { WheelPalette } from "@/lib/astro/types";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { DEFAULT_PALETTE } from "@/components/chart/wheel-palette";
import { Button } from "@/components/ui/button";

const ELEMENTS = [["fire", "Fire Signs"], ["earth", "Earth Signs"], ["air", "Air Signs"], ["water", "Water Signs"]] as const;
const PLANETS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"];
const ASPECT_KINDS = [["hard", "Hard Aspects (Square, Opposition)"], ["soft", "Soft Aspects (Trine, Sextile)"], ["minor", "Minor Aspects (Quincunx and Others)"]] as const;

/** A sample chart so the palette can be previewed without opening a chart. */
const PREVIEW: ChartView = (() => {
  const lon: Partial<Record<BodyId, number>> = { sun: 355, moon: 99.6, mercury: 337.8, venus: 349.9, mars: 62.6, jupiter: 140.7, saturn: 282.7, uranus: 275.1, neptune: 222.1, pluto: 205, node: 334.8, chiron: 211.4 };
  const asc = 28.8, mc = 284.8;
  const cusps = Array.from({ length: 12 }, (_, i) => (asc + i * 30) % 360);
  const bodies = PLANETS.map((id) => ({ id, lon: lon[id]!, speed: id === "pluto" ? -0.01 : 1, house: Math.floor((((lon[id]! - asc) % 360) + 360) % 360 / 30) + 1 }));
  const aspects: Aspect[] = [];
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const d = Math.abs(((bodies[i]!.lon - bodies[j]!.lon + 540) % 360) - 180);
    for (const id of ["opposition", "trine", "square", "sextile", "quincunx"] as AspectId[]) {
      const orb = Math.abs(d - ASPECTS[id].angle);
      if (orb <= (id === "quincunx" ? 3 : 6)) aspects.push({ a: bodies[i]!.id, b: bodies[j]!.id, aRing: "inner", bRing: "inner", type: id, orb, applying: true });
    }
  }
  return { engine: { id: "preview", name: "Preview", verified: false, description: "" }, type: "natal", inner: { bodies, cusps, asc, mc }, aspects } as unknown as ChartView;
})();

/** Pick each wheel color; anything left alone keeps the built-in color. */
export function WheelPaletteEditor({ value, onChange }: { value?: WheelPalette; onChange: (p: WheelPalette) => void }) {
  // Edit locally (the preview follows instantly) and save once the picker settles.
  const [v, setV] = React.useState<WheelPalette>(value ?? {});
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = (next: WheelPalette) => {
    setV(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), 600);
  };
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const set = <K extends keyof WheelPalette>(group: K, key: string, color: string) => save({ ...v, [group]: { ...(v[group] ?? {}), [key]: color } });
  const swatch = (group: keyof WheelPalette, key: string, label: string, current: string, glyph?: string) => (
    <label key={`${group}-${key}`} className="flex items-center gap-2 text-[12.5px]">
      <input type="color" value={current} onChange={(e) => set(group, key, e.target.value)} className="size-7 shrink-0 cursor-pointer rounded border border-line bg-surface p-0.5" aria-label={`${label} color`} />
      {glyph && <span className="glyph text-[15px]" style={{ color: current }} aria-hidden>{glyph}</span>}
      <span className="text-ink-3">{label}</span>
    </label>
  );
  return (
    <div className="grid gap-5 px-5 pb-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Signs</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{ELEMENTS.map(([k, l]) => swatch("elements", k, l, v.elements?.[k] ?? DEFAULT_PALETTE.elements[k]!))}</div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Planets and Points</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{PLANETS.map((id) => swatch("planets", id, BODIES[id].name, v.planets?.[id] ?? DEFAULT_PALETTE.planets[id]!, BODIES[id].glyph))}</div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Aspect Lines</p>
          <div className="grid gap-2 sm:grid-cols-2">{ASPECT_KINDS.map(([k, l]) => swatch("aspects", k, l, v.aspects?.[k] ?? DEFAULT_PALETTE.aspects[k]!))}</div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { setV({}); if (timer.current) clearTimeout(timer.current); onChange({}); }}><RotateCcw /> Reset to Defaults</Button>
        <p className="text-[11.5px] text-muted">The sign band uses a light tint of each element color. Charts set to Custom colors use this palette.</p>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Preview</p>
        <div className="rounded-lg border border-line bg-white p-2"><ChartWheel view={PREVIEW} wheelStyle="detailed" colors="custom" customPalette={v} /></div>
      </div>
    </div>
  );
}
