"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { horaryConsiderations, moonNextAspect } from "@/lib/astro/horary";
import { BODIES, fmtDeg, signOf } from "@/lib/astro";
import { Breakdown, BHead } from "@/components/ui/breakdown";
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
        <ConsiderationsBreakdown view={view} />
      </div>
      {chart && onSave && <HoraryJudgment chart={chart} horary={horary} view={view} onSave={onSave} />}
    </div>
  );
}

function ConsiderationsBreakdown({ view }: { view: ChartView }) {
  const p = view.inner;
  const moon = p.bodies.find((b) => b.id === "moon");
  const saturn = p.bodies.find((b) => b.id === "saturn");
  const next = moonNextAspect(p);
  const ascDeg = ((p.asc % 30) + 30) % 30;
  return (
    <Breakdown className="mt-3">
      <div className="space-y-1">
        <BHead>Ascendant</BHead>
        <p>{fmtDeg(p.asc)} {signOf(p.asc).name}: {ascDeg.toFixed(2)}° into the sign. Early below 3°, late from 27°.</p>
      </div>
      {moon && (
        <div className="space-y-1">
          <BHead>The Moon’s Course</BHead>
          <p>
            Moon at {fmtDeg(moon.lon)} {signOf(moon.lon).name}, moving {moon.speed.toFixed(2)}° a day: {(30 - (((moon.lon % 30) + 30) % 30)).toFixed(2)}° left in the sign ({((30 - (((moon.lon % 30) + 30) % 30)) / moon.speed).toFixed(2)} days).
            Checked: conjunction, sextile, square, trine and opposition to the Sun, Mercury, Venus, Mars, Jupiter and Saturn, at their current speeds.
            {next ? ` First to perfect: ${next.aspect} to ${BODIES[next.body].name} in ${next.days.toFixed(2)} days, inside the sign.` : " None perfects before the Moon leaves the sign: void of course."}
          </p>
          <p>Via Combusta: 15° Libra to 15° Scorpio (195°–225° of the zodiac); the Moon is at {(((moon.lon % 360) + 360) % 360).toFixed(2)}°.</p>
        </div>
      )}
      {saturn && <p><BHead>Saturn</BHead>In the {saturn.house}{saturn.house === 1 ? "st" : saturn.house === 2 ? "nd" : saturn.house === 3 ? "rd" : "th"} House ({fmtDeg(saturn.lon)} {signOf(saturn.lon).name}); a caution only in the 1st or 7th.</p>}
    </Breakdown>
  );
}
