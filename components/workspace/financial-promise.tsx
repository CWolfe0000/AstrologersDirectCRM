"use client";

import * as React from "react";
import { BODIES } from "@/lib/astro";
import type { FinancialPromise, Judgment, Testimony } from "@/lib/astro/wealth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const LEVEL = { strong: { label: "Strong", tone: "sage" }, mixed: { label: "Mixed", tone: "outline" }, weak: { label: "Weak", tone: "warn" } } as const;
const sub = "mt-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted";

function Lines({ label, items }: { label: string; items: Testimony[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <p className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <ul className="space-y-0.5">
        {items.map((t) => (
          <li key={t.text} className={cn("flex gap-1.5", t.restates && "text-muted")}>
            <span aria-hidden className={cn("w-2 shrink-0", t.restates ? "text-muted" : t.side === "for" ? "text-sage-dark" : t.side === "against" ? "text-warn" : "text-muted")}>{t.restates ? "=" : t.side === "for" ? "+" : t.side === "against" ? "−" : "·"}</span>
            <span>{t.text}{t.restates && <span className="italic"> — {t.restates}; not counted again</span>}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** One judgment: its rating, why, and the testimony it rests on. */
function Row({ j }: { j: Judgment }) {
  return (
    <li>
      <details>
        <summary className="flex cursor-pointer list-none items-baseline justify-between gap-2 [&::-webkit-details-marker]:hidden" title={j.about}>
          <span className="text-ink">{j.title}</span>
          <Badge tone={LEVEL[j.level].tone}>{LEVEL[j.level].label}</Badge>
        </summary>
        <div className="mb-2 mt-1 border-l-2 border-line pl-2.5 text-[12px] text-ink-3">
          <p className="text-muted">{j.about}.</p>
          <p className="mt-1"><b className="font-medium text-ink">{LEVEL[j.level].label}:</b> {j.why}.</p>
          <Lines label="Primary" items={j.primary} />
          <Lines label="Supporting" items={j.supporting} />
          <Lines label="Contradictory" items={j.contradictory} />
        </div>
      </details>
    </li>
  );
}

/** The financial natal promise: four functions, eight dimensions, the circuit, Fortune and the place of acquisition. */
export function FinancialPromiseView({ f, heading = true }: { f: FinancialPromise; heading?: boolean }) {
  return (
    <div className="text-[12.5px]">
      {heading && <p className="text-[11.5px] font-semibold text-ink">Natal Promise <span className="font-normal text-muted">· judged by function and dimension, with no overall score</span></p>}
      <p className={sub}>Making, Reaching, Holding, Keeping</p>
      <ul className="mt-1 space-y-1">{f.functions.map((j) => <Row key={j.id} j={j} />)}</ul>
      <p className="mt-1 text-[11.5px] text-muted">These four stay separate, however complete the circuit of rulers is. Open any line for its testimony.</p>
      <p className={sub}>Eight Dimensions</p>
      <ul className="mt-1 space-y-1">{f.dimensions.map((j) => <Row key={j.id} j={j} />)}</ul>
      {f.secondRuler && <p className="mt-2 text-ink-3">{f.secondRuler}.</p>}
      <p className={sub}>Financial Circuit</p>
      <ul className="mt-0.5 space-y-0.5 text-ink-3">
        {f.circuit.map((c) => <li key={c.text} className="flex gap-1.5"><span aria-hidden className={c.tied ? "text-sage-dark" : "text-muted"}>{c.tied ? "+" : "·"}</span>{c.text}</li>)}
      </ul>
      <p className={sub}>Fortune & Spirit</p>
      <ul className="mt-0.5 space-y-0.5 text-ink-3">{f.fortune.map((x) => <li key={x}>{x}</li>)}</ul>
      <p className={sub}>Place of Acquisition <span className="font-normal normal-case tracking-normal">(Valens)</span></p>
      <ul className="mt-0.5 space-y-0.5 text-ink-3">{f.acquisition.map((x) => <li key={x}>{x}</li>)}</ul>
      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] text-muted hover:text-accent">Condition and Relevance of Each Significator</summary>
        <ul className="mt-1 space-y-1.5 text-ink-3">
          {f.planets.map((p) => (
            <li key={p.id}>
              <b className="font-medium text-ink">{BODIES[p.id].name}</b> <Badge tone={LEVEL[p.level].tone}>Condition: {LEVEL[p.level].label} ({p.net > 0 ? "+" : ""}{p.net})</Badge>
              <br /><span className="text-muted">Relevance:</span> {p.roles.join(", ")}
              <br /><span className="text-muted">Condition:</span> {p.notes.map((x) => `${x.text} (${x.points > 0 ? "+" : ""}${x.points})`).join("; ")}
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-2 text-[11.5px] text-muted">{f.day ? "Day" : "Night"} chart. A planet's condition (what it can do) is kept apart from its relevance (what it answers for); the points inform condition only. A rating is strong when a primary significator is strong, none is weak, and independent support stands with it; weak when one is weak and none strong. A line marked “=” restates a configuration already counted.</p>
    </div>
  );
}
