"use client";

import * as React from "react";
import type { ChartView } from "@/lib/astro";
import { natalModel } from "@/lib/astro/activation";
import { place, promiseContext } from "@/lib/astro/natal-promise/condition";
import { BODIES, ordinal } from "@/lib/astro";
import { LOTS, lotRecord, type Verification } from "@/lib/astro/natal-promise/lots";
import { FinancialPromiseView } from "./financial-promise";
import { MIDPOINT_ORB } from "@/lib/astro/natal-promise/midpoints";
import { assessAll, type Assessment, type Evidence } from "@/lib/astro/natal-promise/modules";
import type { TargetId } from "@/lib/astro/timeline";
import { financialPromise } from "@/lib/astro/wealth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/input";

const sub = "mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted";
const MARK = { support: ["+", "text-sage-dark", "Supports: "], challenge: ["−", "text-warn", "Against: "], neutral: ["·", "text-muted", ""] } as const;
const VERIFY: Record<Verification, { label: string; tone: "sage" | "outline" | "warn" }> = { verified: { label: "Verified", tone: "sage" }, secondary: { label: "Supported by Excerpts", tone: "outline" }, unverified: { label: "Unverified", tone: "warn" }, unresolved: { label: "Unresolved", tone: "warn" } };

function Rows({ items, working }: { items: Evidence[]; working: boolean }) {
  return (
    <ul className="space-y-1 text-[12.5px] text-ink-3">
      {items.map((e) => (
        <li key={e.layer + e.text} className="flex gap-1.5">
          <span aria-hidden className={cn("w-2 shrink-0", MARK[e.tone][1])}>{MARK[e.tone][0]}</span>
          <span>
            <span className="sr-only">{MARK[e.tone][2]}</span>{e.text}
            {e.tradition !== "traditional" && <span className="ml-1.5 rounded border border-line px-1 text-[10.5px] text-muted">{e.tradition === "midpoint" ? "Midpoint" : "Modern"}</span>}
            {working && e.detail && <span className="block text-[11.5px] text-muted">{e.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Module({ a, working, wealth }: { a: Assessment; working: boolean; wealth: ReturnType<typeof financialPromise> }) {
  const supports = [...a.primary, ...a.supporting].filter((e) => e.tone === "support").length;
  return (
    <details className="group rounded-lg border border-line">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="text-[13px] font-semibold text-ink">{a.def.title}</span>
        <span className="text-[11.5px] tabular-nums text-muted">{supports} For · {a.contradictory.length} Against · {a.specialized.length} {a.specialized.length === 1 ? "Picture" : "Pictures"}</span>
      </summary>
      <div className="border-t border-line px-3 pb-3">
        <p className="mt-2 text-[12px] text-muted">Keep apart: {a.def.distinguish}</p>
        {a.def.caution && <p className="mt-1.5 rounded-lg bg-warn-50 px-2.5 py-1.5 text-[12px] text-ink-3">{a.def.caution}</p>}
        {a.def.id === "wealth" && wealth && <div className="mt-3 rounded-lg bg-canvas-2 px-3 py-2.5"><FinancialPromiseView f={wealth} heading={false} /></div>}
        <p className={sub}>Primary Testimony</p>
        {a.primary.length ? <Rows items={a.primary} working={working} /> : <p className="text-[12.5px] text-muted">None that supports or stands neutral.</p>}
        <p className={sub}>Supporting Testimony</p>
        {a.supporting.length ? <Rows items={a.supporting} working={working} /> : <p className="text-[12.5px] text-muted">None.</p>}
        {a.def.midpoints.length > 0 && (
          <>
            <p className={sub}>Specialized: Midpoint Pictures</p>
            {a.specialized.length ? <Rows items={a.specialized} working={working} /> : <p className="text-[12.5px] text-muted">No natal point within {MIDPOINT_ORB}° of these axes.</p>}
          </>
        )}
        <p className={sub}>Contradictory Testimony</p>
        {a.contradictory.length ? <Rows items={a.contradictory} working={working} /> : <p className="text-[12.5px] text-muted">None found by these rules.</p>}
        <p className={sub}>Synthesis</p>
        <div className="space-y-1 text-[12.5px] text-ink-3">
          <p>{a.strongest.length ? <>Strongest: {a.strongest.join("; ")}.</> : "No significator stands out as strong."}</p>
          <p>{a.constraints.length ? <>Constraints: {a.constraints.join("; ")}.</> : "No significator stands out as weak."}</p>
          {a.strongest.length > 0 && a.constraints.length > 0 && <p>Both are true of this chart; the contradiction is left standing, not averaged away.</p>}
          <p className="text-muted">Watch in timing: {a.monitor.join(", ")}.</p>
        </div>
      </div>
    </details>
  );
}

/** Natal promise: what the birth chart holds for each life area, as layered evidence. */
export function PromisePanel({ view }: { view: ChartView }) {
  const p = view.inner;
  const [working, setWorking] = React.useState(false);
  const data = React.useMemo(() => {
    const n = natalModel({
      natal: [...p.bodies.filter((b) => b.id !== "asc" && b.id !== "mc").map((b) => ({ id: b.id as TargetId, lon: b.lon, house: b.house, key: false })), { id: "asc" as TargetId, lon: p.asc, house: 1, key: true }, { id: "mc" as TargetId, lon: p.mc, house: 10, key: true }],
      cusps: p.cusps.length === 12 ? p.cusps : null,
    });
    const speeds = Object.fromEntries(p.bodies.map((b) => [b.id, b.speed])) as Partial<Record<TargetId, number>>;
    const ctx = promiseContext(n, speeds);
    return ctx ? { ctx, modules: assessAll(ctx), wealth: financialPromise(n, speeds) } : null;
  }, [p]);
  if (!data) return <p className="text-[13px] text-muted">Natal promise needs the houses, the Sun and the Moon.</p>;
  const { ctx } = data;
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-canvas-2 px-3 py-2 text-[12.5px] text-ink-3">
        What the birth chart itself holds for each area of life, before any timing. <b className="font-medium text-ink">{ctx.day ? "Day Chart" : "Night Chart"}.</b> Testimony is laid out in layers and left as evidence: there is no single score. These are interpretive traditions, not tested predictors, and are best judged apart from what is already known of the person's life.
      </p>
      <label className="flex items-center gap-2 text-[12.5px] text-ink"><Checkbox checked={working} onChange={(e) => setWorking(e.target.checked)} /> Show the working behind each line</label>
      <div className="space-y-2">{data.modules.map((a) => <Module key={a.def.id} a={a} working={working} wealth={data.wealth} />)}</div>

      <details className="rounded-lg border border-line">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden">Lots: Sources, Formulas and Verification</summary>
        <div className="space-y-3 border-t border-line px-3 py-3">
          <p className="rounded-lg bg-warn-50 px-2.5 py-1.5 text-[12px] text-ink-3">No formula here has been read in a primary text or a full translation; several are supported by excerpts of translations or by agreeing modern sources, and each Lot says which. Where sources differ, the other readings are shown beside the one in use.</p>
          {LOTS.map((def) => {
            const r = lotRecord(ctx, def);
            const v = VERIFY[def.verification.status];
            return (
              <div key={def.id} className="text-[12.5px]">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><b className="font-semibold text-ink">{def.name}</b><Badge tone={v.tone}>{v.label}</Badge>{def.alternativeTo && <Badge tone="outline">Alternative Tradition</Badge>}</p>
                <dl className="mt-1 grid grid-cols-[84px_1fr] gap-x-2 gap-y-0.5 text-ink-3">
                  <dt className="text-muted">Source</dt><dd>{def.source}</dd>
                  <dt className="text-muted">Formula</dt><dd>{def.formula}</dd>
                  <dt className="text-muted">Sect Rule</dt><dd>{def.sect}</dd>
                  <dt className="text-muted">Function</dt><dd>{def.purpose}</dd>
                  <dt className="text-muted">Position</dt><dd>{r.lon === null ? "Not calculated" : `${place(r.lon)}, ${ordinal(r.house!)} House`}</dd>
                  {r.ruler && <><dt className="text-muted">Ruler</dt><dd>{BODIES[r.ruler].name}{r.rulerCondition ? `, condition ${r.rulerCondition.level === "mixed" ? "middling" : r.rulerCondition.level}` : ""}</dd></>}
                  {r.lon !== null && <><dt className="text-muted">Aspects</dt><dd>{r.aspects.length ? r.aspects.map((x) => `${BODIES[x.planet].name} ${x.aspect}${x.close ? " (within 3°)" : ""}`).join("; ") : "None by sign from the seven planets"}</dd></>}
                  {r.readings.length > 0 && <><dt className="text-muted">Other Readings</dt><dd>{r.readings.map((x) => `${x.label}: ${x.lon === null ? "–" : place(x.lon)}`).join("; ")}</dd></>}
                  <dt className="text-muted">Verification</dt><dd>{def.verification.note}</dd>
                </dl>
              </div>
            );
          })}
          <p className="text-[11.5px] text-muted">“A → B from the Ascendant” is Ascendant + B − A. Aspects to a Lot are by sign. Both men's and women's marriage Lots are shown, as the chart does not record which applies.</p>
        </div>
      </details>

      <p className="text-[11.5px] leading-relaxed text-muted">
        Condition: essential dignity (Lilly's points; Dorothean triplicities, Egyptian terms, Chaldean faces), house, sect, the Sun's rays, retrogradation, aspects from the benefics and malefics, and reception. Midpoints: Ebertin's convention, the 45° dial, {MIDPOINT_ORB}° orb. A midpoint picture between two planets already in natal aspect is marked as restating it. Not included yet: antiscia, fixed stars, declinations, harmonics, dodecatemoria, the prenatal syzygy and primary directions.
      </p>
    </div>
  );
}
