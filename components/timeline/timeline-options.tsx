"use client";

import * as React from "react";
import { ASPECTS, BODIES, PLANET_IDS, type BodyId, type TimelineDefaults } from "@/lib/astro";
import { TIMELINE_ASPECTS } from "@/lib/astro/timeline";
import { cn } from "@/lib/utils";
import { Checkbox, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";

export const ORB_MIN = 0.1;
export const ORB_MAX = 15;

export type BodyPreset = "slow" | "mars" | "all" | "custom";
export const BODY_PRESETS: Record<Exclude<BodyPreset, "custom">, BodyId[]> = {
  slow: ["jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"],
  mars: ["mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"],
  all: ["sun", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"],
};
export function presetOf(bodies: BodyId[]): BodyPreset {
  for (const [k, v] of Object.entries(BODY_PRESETS)) if (v.length === bodies.length && v.every((b) => bodies.includes(b))) return k as BodyPreset;
  return "custom";
}

export const DEFAULT_BACKGROUND: BodyId[] = ["uranus", "neptune", "pluto"];
export const BACKGROUND_CHOICES: BodyId[] = ["jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "node"];

/** Same settings, ignoring order. */
export function sameTimeline(a: TimelineDefaults, b: TimelineDefaults) {
  const norm = (t: TimelineDefaults) =>
    JSON.stringify({
      ...t,
      transitBodies: [...t.transitBodies].sort(),
      aspects: [...t.aspects].sort(),
      transitOrbs: Object.fromEntries(Object.entries(t.transitOrbs).sort()),
      backgroundBodies: [...(t.backgroundBodies ?? DEFAULT_BACKGROUND)].sort(),
    });
  return norm(a) === norm(b);
}

/**
 * Degree field that keeps what's typed until it is committed (blur or Enter),
 * and follows the value when it changes from outside (reset, restore).
 */
export function OrbInput({ value, onCommit, label, placeholder, className }: { value: number | undefined; onCommit: (v: number | undefined) => void; label: string; placeholder?: string; className?: string }) {
  const [text, setText] = React.useState(value === undefined ? "" : String(value));
  React.useEffect(() => setText(value === undefined ? "" : String(value)), [value]);
  const commit = () => {
    const t = text.trim();
    if (t === "" && placeholder !== undefined) return onCommit(undefined);
    const n = Number(t);
    if (Number.isFinite(n) && n >= ORB_MIN && n <= ORB_MAX) onCommit(Math.round(n * 100) / 100);
    else setText(value === undefined ? "" : String(value));
  };
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <Input
        inputMode="decimal"
        aria-label={label}
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="h-8 w-[72px] pr-6 text-right tabular-nums"
      />
      <span className="pointer-events-none absolute right-2 text-[12px] text-muted" aria-hidden>
        °
      </span>
    </span>
  );
}

/** Bodies, aspects and orbs for the timeline — used on the timeline and in Settings → Astrology. */
export function TimelineOptionsEditor({ value, onChange, compact }: { value: TimelineDefaults; onChange: (v: TimelineDefaults) => void; compact?: boolean }) {
  const [perPlanet, setPerPlanet] = React.useState(Object.keys(value.transitOrbs).length > 0);
  const preset = presetOf(value.transitBodies);
  const toggleBody = (b: BodyId, on: boolean) => onChange({ ...value, transitBodies: on ? [...value.transitBodies, b] : value.transitBodies.filter((x) => x !== b) });
  const toggleAspect = (a: TimelineDefaults["aspects"][number], on: boolean) =>
    onChange({ ...value, aspects: on ? [...value.aspects, a] : value.aspects.length > 1 ? value.aspects.filter((x) => x !== a) : value.aspects });
  const setOrb = (k: keyof TimelineDefaults["orbs"], v: number | undefined) => v !== undefined && onChange({ ...value, orbs: { ...value.orbs, [k]: v } });
  const setPlanetOrb = (b: BodyId, v: number | undefined) => {
    const next = { ...value.transitOrbs };
    if (v === undefined || v === value.orbs.transit) delete next[b];
    else next[b] = v;
    onChange({ ...value, transitOrbs: next });
  };
  const heading = "text-[12.5px] font-semibold text-ink";
  const bg = value.backgroundBodies ?? DEFAULT_BACKGROUND;

  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      <section>
        <p className={heading}>Orbs</p>
        <p className="mt-0.5 text-[11.5px] text-muted">How far from exact a contact still counts, in degrees ({ORB_MIN}–{ORB_MAX}).</p>
        <div className={cn("mt-2 grid gap-x-4 gap-y-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
          {(
            [
              ["transit", "Transits"],
              ["directed", "Progressions & arcs"],
              ["lunation", "Lunations"],
              ["eclipse", "Eclipses"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-2 text-[12.5px] text-ink">
              {label}
              <OrbInput label={`${label} orb`} value={value.orbs[k]} onCommit={(v) => setOrb(k, v)} />
            </label>
          ))}
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-[12.5px] text-ink">
          <Checkbox
            checked={perPlanet}
            onChange={(e) => {
              setPerPlanet(e.target.checked);
              if (!e.target.checked && Object.keys(value.transitOrbs).length) onChange({ ...value, transitOrbs: {} });
            }}
          />
          Different transit orb for each planet
        </label>
        {perPlanet && (
          <div className={cn("mt-2 grid gap-x-4 gap-y-1.5", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
            {PLANET_IDS.map((b) => (
              <label key={b} className="flex items-center justify-between gap-2 text-[12.5px] text-ink">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="glyph w-4 text-center text-[14px]">{BODIES[b].glyph}</span> {BODIES[b].name}
                </span>
                <OrbInput label={`${BODIES[b].name} transit orb`} value={value.transitOrbs[b]} placeholder={String(value.orbs.transit)} onCommit={(v) => setPlanetOrb(b, v)} />
              </label>
            ))}
            <p className="col-span-full text-[11.5px] text-muted">Leave a planet blank to use the transit orb ({value.orbs.transit}°).</p>
          </div>
        )}
      </section>

      <section>
        <p className={heading}>Transiting planets</p>
        <div className="mt-2">
          <Segmented
            size="sm"
            value={preset}
            onChange={(v) => v !== "custom" && onChange({ ...value, transitBodies: BODY_PRESETS[v] })}
            options={[
              { value: "slow", label: "Jupiter →" },
              { value: "mars", label: "Mars →" },
              { value: "all", label: "All but Moon" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>
        <div className={cn("mt-2.5 grid gap-x-3 gap-y-1.5", compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6")}>
          {PLANET_IDS.map((b) => (
            <label key={b} className="flex items-center gap-1.5 text-[12.5px]">
              <Checkbox checked={value.transitBodies.includes(b)} onChange={(e) => toggleBody(b, e.target.checked)} />
              <span aria-hidden className="glyph w-4 text-center text-[14px]">{BODIES[b].glyph}</span> {BODIES[b].name}
            </label>
          ))}
        </div>
      </section>

      <section>
        <p className={heading}>Background planets</p>
        <p className="mt-0.5 text-[11.5px] text-muted">Their transits count as long-term background rather than short-term triggers. Progressions and solar arcs are always background; lunations and eclipses are always triggers.</p>
        <div className={cn("mt-2 grid gap-x-3 gap-y-1.5", compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-7")}>
          {BACKGROUND_CHOICES.map((b) => (
            <label key={b} className="flex items-center gap-1.5 text-[12.5px]">
              <Checkbox checked={bg.includes(b)} onChange={(e) => onChange({ ...value, backgroundBodies: e.target.checked ? [...bg, b] : bg.filter((x) => x !== b) })} />
              <span aria-hidden className="glyph w-4 text-center text-[14px]">{BODIES[b].glyph}</span> {BODIES[b].name}
            </label>
          ))}
        </div>
      </section>

      <section>
        <p className={heading}>Aspects</p>
        <div className={cn("mt-2 grid gap-x-3 gap-y-1.5", compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-5")}>
          {TIMELINE_ASPECTS.map((a) => (
            <label key={a.id} className="flex items-center gap-1.5 text-[12.5px]">
              <Checkbox checked={value.aspects.includes(a.id)} onChange={(e) => toggleAspect(a.id, e.target.checked)} />
              <span aria-hidden className="glyph w-4 text-center text-[14px]">{ASPECTS[a.id].glyph}</span> {ASPECTS[a.id].name}
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] leading-snug text-muted">Progressions use the Sun through Mars and the Moon. Solar arcs direct every natal point, including the angles. Lunations and eclipses use conjunction, opposition and square.</p>
      </section>
    </div>
  );
}
