"use client";

import * as React from "react";
import { ASPECTS, BODIES, RULERS, SIGNS, bodyIn, degInSign, dignityOf, fmtDeg, fmtOrb, ordinal, signOf, type Aspect, type AspectId, type BodyId, type ChartView, aspectVerb } from "@/lib/astro";
import { cn } from "@/lib/utils";
import { rulershipReport, type Rulership } from "@/lib/astro/rulership";
import { findPatterns } from "@/lib/astro/patterns";
import { Segmented } from "@/components/ui/tabs";

const th = "px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted";
const td = "px-2 py-2 text-[13px]";

function Glyph({ id, outer }: { id: BodyId; outer?: boolean }) {
  const g = BODIES[id].glyph;
  return <span className={cn(id === "asc" || id === "mc" ? "text-[11px] font-semibold" : "glyph text-[16px]", outer ? "text-accent" : "text-ink")}>{g}</span>;
}

export function RingTag({ label, outer }: { label: string; outer?: boolean }) {
  if (!label) return null;
  return <span className={cn("rounded px-1.5 py-px text-[10.5px] font-medium", outer ? "bg-accent-50 text-accent" : "bg-canvas-2 text-ink-3")}>{label}</span>;
}

export function PlacementsTable({
  view,
  labels,
  selected,
  onSelect,
}: {
  view: ChartView;
  labels: { inner: string; outer: string };
  selected: string | null;
  onSelect: (k: string | null) => void;
}) {
  const rings: { key: "inner" | "outer"; pts: NonNullable<ChartView["outer"]> }[] = [{ key: "inner", pts: view.inner }];
  if (view.outer) rings.push({ key: "outer", pts: view.outer });
  return (
    <div className="space-y-4">
      {rings.map((r) => (
        <div key={r.key}>
          {view.outer && (
            <div className="mb-1.5 flex items-center gap-2 px-1">
              <RingTag label={r.key === "inner" ? labels.inner : labels.outer} outer={r.key === "outer"} />
              <span className="text-[11.5px] text-muted">{r.key === "inner" ? "Inner wheel" : "Outer wheel"}</span>
            </div>
          )}
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Point</th>
                <th className={th}>Sign</th>
                <th className={cn(th, "text-right")}>Degree</th>
                <th className={cn(th, "text-right")}>House</th>
              </tr>
            </thead>
            <tbody>
              {[...r.pts.bodies, bodyIn(r.pts, "asc")!, bodyIn(r.pts, "mc")!].map((b) => {
                const k = `${r.key}:${b.id}`;
                const s = signOf(b.lon);
                return (
                  <tr
                    key={k}
                    onClick={() => onSelect(selected === k ? null : k)}
                    className={cn("cursor-pointer border-b border-line/60 last:border-0 hover:bg-canvas/70", selected === k && "bg-accent-50/60")}
                  >
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <span className="w-5 text-center"><Glyph id={b.id} outer={r.key === "outer"} /></span>
                        {BODIES[b.id].name}
                        {b.speed < 0 && <span className="rounded bg-warn-50 px-1 text-[10.5px] font-semibold text-warn" title="Retrograde">℞</span>}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="flex items-center gap-1.5"><span className="glyph text-muted">{s.glyph}</span>{s.name}</span>
                    </td>
                    <td className={cn(td, "text-right tabular-nums")}>{fmtDeg(b.lon)}</td>
                    <td className={cn(td, "text-right tabular-nums text-muted")}>{b.id === "asc" || b.id === "mc" ? "—" : b.house}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export function AspectsTable({
  view,
  labels,
  onHover,
  hovered,
  selected,
  onSelectBody,
}: {
  view: ChartView;
  labels: { inner: string; outer: string };
  onHover: (k: string | null) => void;
  hovered: string | null;
  selected: string | null;
  onSelectBody: (k: string | null) => void;
}) {
  const [filter, setFilter] = React.useState<"all" | "hard" | "soft" | "applying">("all");
  const key = (a: Aspect) => `${a.aRing}:${a.a}-${a.bRing}:${a.b}`;
  const list = view.aspects
    .filter((a) => !selected || `${a.aRing}:${a.a}` === selected || `${a.bRing}:${a.b}` === selected)
    .filter((a) => {
      const n = ASPECTS[a.type].nature;
      if (filter === "hard") return n === "hard";
      if (filter === "soft") return n === "soft";
      if (filter === "applying") return a.applying;
      return true;
    });
  const tone = (t: AspectId) => ({ hard: "text-accent", soft: "text-sage-dark", neutral: "text-ink-3", minor: "text-muted" })[ASPECTS[t].nature];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "hard", label: "Hard" },
            { value: "soft", label: "Soft" },
            { value: "applying", label: "Applying" },
          ]}
        />
        {selected && (
          <button onClick={() => onSelectBody(null)} className="text-[12px] text-accent hover:underline">
            Clear point filter
          </button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted">No aspects match. Try widening orbs in the controls.</p>
      ) : (
        <table className="w-full">
          <thead className="border-b border-line">
            <tr>
              <th className={th}>Aspect</th>
              <th className={cn(th, "text-right")}>Orb</th>
              <th className={cn(th, "text-right")}>Phase</th>
            </tr>
          </thead>
          <tbody onMouseLeave={() => onHover(null)}>
            {list.map((a) => {
              const k = key(a);
              return (
                <tr key={k} onMouseEnter={() => onHover(k)} onFocus={() => onHover(k)} tabIndex={0} className={cn("border-b border-line/60 last:border-0", hovered === k && "bg-canvas")}>
                  <td className={td}>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Glyph id={a.a} outer={a.aRing === "outer"} />
                      <span className={cn("glyph text-[15px]", tone(a.type))} title={ASPECTS[a.type].name}>{ASPECTS[a.type].glyph}</span>
                      <Glyph id={a.b} outer={a.bRing === "outer"} />
                      <span className="ml-1 text-[12.5px] text-ink-3">
                        {view.outer && <span className="text-accent">{labels.outer} </span>}
                        {BODIES[a.a].name} {aspectVerb(a.type)} {view.outer && <span>{labels.inner} </span>}
                        {BODIES[a.b].name}
                      </span>
                    </span>
                  </td>
                  <td className={cn(td, "text-right tabular-nums")}>{fmtOrb(a.orb)}</td>
                  <td className={cn(td, "text-right")}>
                    <span className={cn("text-[12px]", a.applying ? "text-ink" : "text-muted")}>{a.applying ? "Applying" : "Separating"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-[11.5px] text-muted">Hover a row to highlight the aspect line on the wheel. Click a planet on the wheel to filter.</p>
    </div>
  );
}

/** Aspect patterns found in the chart; selecting one highlights its focal point on the wheel. */
export function PatternsList({ view, onSelectBody }: { view: ChartView; onSelectBody: (k: string | null) => void }) {
  const patterns = React.useMemo(() => findPatterns(view.inner, view.aspects), [view]);
  return (
    <div className="mb-4 rounded-lg border border-line">
      <p className="border-b border-line px-3 py-2 text-[12px] font-semibold text-ink">Aspect Patterns</p>
      {patterns.length === 0 ? (
        <p className="px-3 py-2 text-[12.5px] text-muted">No major patterns with the current orbs.</p>
      ) : (
        <ul className="divide-y divide-line/70">
          {patterns.map((pt) => (
            <li key={pt.kind + pt.points.join()}>
              <button type="button" onClick={() => onSelectBody(`inner:${pt.apex ?? pt.points[0]}`)} className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 text-left text-[12.5px] hover:bg-canvas-2">
                <span className="font-medium text-ink">{pt.kind}</span>
                {pt.detail && <span className="text-muted">{pt.detail}</span>}
                <span className="ml-auto inline-flex items-center gap-1.5">
                  {pt.points.map((id) => <span key={id} title={BODIES[id].name} className={cn(pt.apex === id && "rounded-full bg-accent-50 px-1")}><Glyph id={id} /></span>)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Solar Fire–style rulership summary and table, then the house cusps. */
export function RulershipTable({ view, rulership }: { view: ChartView; rulership: Rulership }) {
  const r = rulershipReport(view.inner, rulership);
  const list = (ids: BodyId[]) => (ids.length ? <span className="inline-flex flex-wrap items-center gap-1.5">{ids.map((id) => <Glyph key={id} id={id} />)}</span> : <span className="text-muted">None</span>);
  const cell = "border-b border-line/60 px-1.5 py-1.5 text-[12.5px]";
  const rth = "px-1.5 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-muted";
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-line text-[12.5px] sm:grid-cols-2">
        {(
          [
            ["In Rulership", list(r.inRulership)],
            ["In Exaltation", list(r.inExaltation)],
            ["Accidental Dignity", list(r.accidental)],
            ["Final Dispositor", r.final ? <Glyph id={r.final} /> : <span className="text-muted">None</span>],
            ["In Detriment", list(r.inDetriment)],
            ["In Fall", list(r.inFall)],
            ["In Mutual Reception", r.mutual.length ? <span className="inline-flex flex-wrap gap-2">{r.mutual.map(([a, b]) => <span key={a + b}><Glyph id={a} /> ↔ <Glyph id={b} /></span>)}</span> : <span className="text-muted">None</span>],
          ] as const
        ).map(([k, v], i) => (
          <div key={k} className={cn("flex items-center gap-2 border-line px-3 py-2", i % 2 === 0 ? "bg-canvas/60" : "", "border-b")}>
            <dt className="shrink-0 text-ink-3">{k}:</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line">
            <tr>
              <th className={rth}>Point</th>
              <th className={rth}>Sign</th>
              <th className={rth}>House</th>
              <th className={rth}>Rules</th>
              <th className={rth}>Dispositor</th>
              <th className={rth}>In House</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map((x) => (
              <tr key={x.id}>
                <td className={cell}><Glyph id={x.id} /></td>
                <td className={cell}><span className="glyph text-[15px]" title={SIGNS[x.sign]!.name}>{SIGNS[x.sign]!.glyph}</span></td>
                <td className={cn(cell, "tabular-nums")}>{x.house}</td>
                <td className={cn(cell, "tabular-nums")}>{x.rules.length ? x.rules.map((h) => (h.intercepted ? `(${h.house})` : String(h.house))).join(", ") : "–"}</td>
                <td className={cell}><Glyph id={x.dispositor} /></td>
                <td className={cn(cell, "tabular-nums")}>{x.dispositorHouse ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="print-note mt-2 text-[11.5px] text-muted">{rulership === "modern" ? "Modern" : "Traditional"} rulership (change it in the chart controls). Houses in parentheses hold an intercepted sign the planet rules.</p>
      </div>
      <div>
        <p className="mb-1 text-[12px] font-semibold text-ink">House Cusps</p>
        <HousesTable view={view} />
      </div>
    </div>
  );
}

export function HousesTable({ view }: { view: ChartView }) {
  const p = view.inner;
  return (
    <table className="w-full">
      <thead className="border-b border-line">
        <tr>
          <th className={th}>House</th>
          <th className={th}>Cusp</th>
          <th className={th}>Ruler</th>
          <th className={th}>Occupants</th>
        </tr>
      </thead>
      <tbody>
        {p.cusps.map((c, i) => {
          const s = signOf(c);
          const r = RULERS[s.id];
          const occ = p.bodies.filter((b) => b.house === i + 1);
          return (
            <tr key={i} className="border-b border-line/60 last:border-0">
              <td className={cn(td, "font-medium")}>{ordinal(i + 1)}{i === 0 && <span className="ml-1 text-[11px] text-muted">(AC)</span>}{i === 9 && <span className="ml-1 text-[11px] text-muted">(MC)</span>}</td>
              <td className={cn(td, "whitespace-nowrap tabular-nums")}>
                <span className="glyph mr-1 text-muted">{s.glyph}</span>
                {fmtDeg(c)}
              </td>
              <td className={td}>
                <span className="flex items-center gap-1">
                  <Glyph id={r.traditional} />
                  {r.modern && (
                    <span className="text-muted" title="Modern ruler">
                      / <span className="glyph">{BODIES[r.modern].glyph}</span>
                    </span>
                  )}
                </span>
              </td>
              <td className={td}>
                <span className="flex flex-wrap gap-1">{occ.length ? occ.map((b) => <Glyph key={b.id} id={b.id} />) : <span className="text-muted">—</span>}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const TRAD: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];

export function ConditionTable({ view }: { view: ChartView }) {
  const p = view.inner;
  const rulersOf = (id: BodyId) =>
    p.cusps
      .map((c, i) => ({ h: i + 1, r: RULERS[signOf(c).id] }))
      .filter((x) => x.r.traditional === id || x.r.modern === id)
      .map((x) => x.h);
  const tone: Record<string, string> = {
    Domicile: "bg-sage-50 text-sage-dark",
    Exaltation: "bg-sage-50 text-sage-dark",
    Detriment: "bg-accent-50 text-accent",
    Fall: "bg-accent-50 text-accent",
    Peregrine: "bg-canvas-2 text-ink-3",
  };
  return (
    <div className="space-y-4">
      <table className="w-full">
        <thead className="border-b border-line">
          <tr>
            <th className={th}>Planet</th>
            <th className={th}>Essential Dignity</th>
            <th className={th}>Motion</th>
            <th className={cn(th, "text-right")}>Rules</th>
          </tr>
        </thead>
        <tbody>
          {TRAD.map((id) => {
            const b = p.bodies.find((x) => x.id === id);
            if (!b) return null;
            const dig = dignityOf(id, b.lon)!;
            const houses = rulersOf(id);
            const d = degInSign(b.lon);
            const critical = d < 1 || d >= 29;
            return (
              <tr key={id} className="border-b border-line/60 last:border-0">
                <td className={td}>
                  <span className="flex items-center gap-2"><Glyph id={id} /> {BODIES[id].name}</span>
                </td>
                <td className={td}>
                  <span className={cn("rounded px-1.5 py-0.5 text-[11.5px] font-medium", tone[dig])}>{dig}</span>
                  {critical && <span className="ml-1 text-[11px] text-warn">{d < 1 ? "0°" : "29°"}</span>}
                </td>
                <td className={cn(td, "text-[12.5px]", b.speed < 0 ? "text-warn" : "text-muted")}>{b.speed < 0 ? "Retrograde" : "Direct"}</td>
                <td className={cn(td, "text-right text-[12.5px] text-muted")}>{houses.length ? houses.map(ordinal).join(", ") : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="rounded-lg border border-line bg-canvas/60 p-3">
        <p className="mb-2 text-[12px] font-medium text-ink">House rulers & their placements</p>
        <ul className="grid grid-cols-1 gap-1 text-[12.5px] text-ink-3 sm:grid-cols-2">
          {p.cusps.map((c, i) => {
            const r = RULERS[signOf(c).id].traditional;
            const b = p.bodies.find((x) => x.id === r);
            return (
              <li key={i}>
                {ordinal(i + 1)} ruler <span className="glyph">{BODIES[r].glyph}</span> → {b ? `${ordinal(b.house)} house, ${SIGNS[Math.floor(b.lon / 30)]!.name}` : "—"}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-[11.5px] text-muted">Dignity rules are applied to the demonstration positions. Accidental dignity and sect would come from the production engine.</p>
    </div>
  );
}
