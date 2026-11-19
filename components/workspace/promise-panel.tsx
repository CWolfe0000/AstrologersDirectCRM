"use client";

import * as React from "react";
import { BODIES, ordinal, SIGNS, type BodyId, type ChartView } from "@/lib/astro";
import { natalPromise, type HousePromise } from "@/lib/astro/natal-promise";
import { isDayChart } from "@/lib/astro/traditional";
import { cn } from "@/lib/utils";
import { Segmented } from "@/components/ui/tabs";
import { Breakdown, BHead, BTable } from "@/components/ui/breakdown";

const TONE: Record<HousePromise["verdict"], string> = {
  Strong: "bg-sage/15 text-sage-dark",
  Good: "bg-sage/10 text-sage-dark",
  Mixed: "bg-canvas-2 text-ink-3",
  Challenged: "bg-accent/10 text-accent",
};
const pts = (n: number) => (n > 0 ? `+${n}` : String(n));
const nm = (id: BodyId | "fortune") => (id === "fortune" ? "Part of Fortune" : BODIES[id as BodyId]?.name ?? id);

/** Natal promise: what each house promises, from its ruler, occupants and natural significator. */
export function PromisePanel({ view, houseSystem }: { view: ChartView; houseSystem: string }) {
  const [mode, setMode] = React.useState<"whole" | "chart">("whole");
  const wholeSign = mode === "whole" || houseSystem === "whole-sign";
  const houses = React.useMemo(() => natalPromise(view.inner, { wholeSign }), [view.inner, wholeSign]);
  const day = isDayChart(view.inner);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-muted">{day ? "Day" : "Night"} Chart · Traditional Rulers · {wholeSign ? "Whole Sign Houses" : "Chart Houses, With the 5° Rule"}</p>
        {houseSystem !== "whole-sign" && (
          <Segmented size="sm" value={mode} onChange={setMode} options={[{ value: "whole", label: "Whole Sign" }, { value: "chart", label: "Chart Houses" }]} />
        )}
      </div>

      <ul className="space-y-2.5">
        {houses.map((h) => (
          <li key={h.house} className="rounded-lg border border-line p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-ink">
                {ordinal(h.house)} House <span className="font-normal text-muted">· <span className="glyph" aria-hidden>{SIGNS[h.sign]!.glyph}</span> {SIGNS[h.sign]!.name} · {h.topics}</span>
              </p>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold", TONE[h.verdict])}>{h.verdict} <span className="font-normal tabular-nums">{pts(h.total)}</span></span>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-3">{h.summary}</p>
            <Breakdown className="mt-2">
              <BHead>Ruler: {nm(h.ruler.id)}{h.modernRuler ? ` (Modern Ruler ${nm(h.modernRuler)}, Not Scored)` : ""}</BHead>
              <BTable className="min-w-0" head={["Factor", "Points"]} rows={[...h.ruler.factors.map((f) => [f.label, pts(f.points)]), [<b key="s">Ruler Condition</b>, <b key="v">{pts(h.ruler.score)}</b>]]} />
              <BTable className="min-w-0" head={["Other Factors", "Points"]} rows={[
                [h.sees ? "Ruler Sees Its House (by Sign Aspect)" : "Ruler in Aversion to Its House (No Sign Aspect)", pts(h.sees ? 1 : -1)],
                ...h.occupants.map((o) => [`${nm(o.id)} in the House: ${o.note}`, pts(o.points)]),
                [`Natural Significator ${nm(h.natural.id)}: Condition ${pts(h.natural.score)} (±1 at ±3 or Beyond)`, pts(h.naturalPoints)],
                [<b key="t">Total</b>, <b key="tv">{pts(h.total)}</b>],
              ]} />
            </Breakdown>
          </li>
        ))}
      </ul>

      <Breakdown title="How the Promise Is Judged">
        <p><b>Ruler condition.</b> Essential dignity: own sign +4, exalted +3, a minor dignity (triplicity by sect, term or face) +1, detriment −3, fall −3, peregrine −2. Place: angular +3, succedent +1, cadent −1, and −2 more in the 6th, 8th or 12th. Retrograde −2. Combust (within 8.5° of the Sun) −3, under the beams (within 17°) −1, cazimi +4.</p>
        <p><b>Benefics and malefics.</b> Within the planets’ combined moieties (Lilly’s half-orbs): Venus or Jupiter +2 by conjunction, sextile or trine, +1 by square or opposition; Mars or Saturn −2 by conjunction, square or opposition, −1 by sextile or trine. The malefic of the sect (Saturn by day, Mars by night) does less harm: −1 by hard aspect, 0 by soft. Separating aspects count half.</p>
        <p><b>The house.</b> The ruler seeing its house by sign +1, in aversion −1. Planets in it: Venus or Jupiter +2 (+1 if debilitated); Mars or Saturn −2 (−1 if of the sect, +1 back if dignified); the Sun, Moon or Mercury +1 if dignified, −1 if debilitated; North Node +1, South Node −1; Part of Fortune +1. Outer planets are noted but not scored. The natural significator (Sun 1st and 10th, Jupiter 2nd, 9th and 11th, Mercury 3rd, Moon 4th, Venus 5th and 7th, Mars 6th, Saturn 8th and 12th) adds +1 or −1 when its condition is +3 or better, or −3 or worse.</p>
        <p><b>Verdict.</b> Strong at +5 or more, Good from +2, Mixed above −4, Challenged at −4 or less. These point values are a working convention, not a published system; the factors listed for each house are the evidence.</p>
      </Breakdown>
    </div>
  );
}
