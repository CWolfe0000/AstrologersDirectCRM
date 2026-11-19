"use client";

import * as React from "react";
import { ChevronRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Technical Breakdown": every interpretation shows how it was reached —
 * the positions, numbers and rules — one click away on the same page.
 */
export function Breakdown({ title = "Technical Breakdown", children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <details className={cn("group rounded-lg border border-line bg-canvas/50 text-[12.5px]", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-medium text-ink-3 hover:text-ink [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
        <Calculator className="size-3.5 shrink-0 text-muted" aria-hidden />
        {title}
      </summary>
      <div className="space-y-3 border-t border-line px-3 py-3 leading-relaxed text-ink-3">{children}</div>
    </details>
  );
}

/** A compact table for breakdowns. */
export function BTable({ head, rows, className }: { head: React.ReactNode[]; rows: React.ReactNode[][]; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full min-w-[360px] text-[12px]", className)}>
        <thead>
          <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-muted">
            {head.map((h, i) => <th key={i} className="px-1.5 py-1 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 align-top">
              {r.map((c, j) => <td key={j} className="px-1.5 py-1 tabular-nums">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const BHead = ({ children }: { children: React.ReactNode }) => <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{children}</p>;
