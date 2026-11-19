"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { horaryConsiderations } from "@/lib/astro/horary";
import type { ChartView } from "@/lib/astro";
import type { ChartRecord, HoraryData } from "@/lib/data/types";
import { HoraryJudgment } from "./horary-judgment";
import { cn, fmtClock, fmtDate } from "@/lib/utils";

const ICON = { caution: AlertTriangle, clear: CheckCircle2, info: Info } as const;
const TONE = { caution: "text-warn", clear: "text-sage-dark", info: "text-muted" } as const;

/** The question, when and where it was asked, and the traditional considerations before judgment. */
export function HoraryPanel({ horary, view, className, chart, onSave }: { horary: HoraryData; view: ChartView; className?: string; chart?: ChartRecord; onSave?: (h: HoraryData) => void }) {
  const items = horaryConsiderations(view.inner, horary.at);
  const cautions = items.filter((i) => i.tone === "caution").length;
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5", className)}>
      <p className="eyebrow">The Question</p>
      <p className="mt-1.5 font-serif text-[21px] leading-snug text-ink">“{horary.question}”</p>
      <p className="mt-1 text-[12.5px] text-muted">
        Asked {fmtDate(horary.at.slice(0, 10))} at {fmtClock(horary.at.slice(11, 16))} · {horary.place}
      </p>
      <div className="mt-4 border-t border-line pt-3">
        <p className="mb-2 flex items-center justify-between text-[13px] font-semibold text-ink">
          Considerations Before Judgment
          <span className={cn("text-[12px] font-normal", cautions ? "text-warn" : "text-sage-dark")}>{cautions ? `${cautions} caution${cautions === 1 ? "" : "s"}` : "No cautions"}</span>
        </p>
        <ul className="space-y-2.5">
          {items.map((c) => {
            const Icon = ICON[c.tone];
            return (
              <li key={c.id} className="flex gap-2.5">
                <Icon className={cn("mt-0.5 size-4 shrink-0", TONE[c.tone])} aria-hidden />
                <div>
                  <p className="text-[13px] font-medium text-ink">{c.title}</p>
                  <p className="text-[12.5px] leading-relaxed text-muted">{c.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11.5px] text-muted">Traditional cautions (after Bonatti and Lilly) to weigh in your judgment, not verdicts.</p>
      </div>
      {chart && onSave && <HoraryJudgment chart={chart} horary={horary} view={view} onSave={onSave} />}
    </div>
  );
}
