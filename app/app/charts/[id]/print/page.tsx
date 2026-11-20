"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { ASPECTS, BODIES, HOUSE_SYSTEMS, ZODIACS, aspectVerb, chartTypeMeta, fmtOrb } from "@/lib/astro";
import { useStore, personName } from "@/lib/store";
import { fmtClock, fmtDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { useChartView } from "@/components/chart/chart-helpers";
import { PatternsList, PlacementsTable, RulershipTable } from "@/components/workspace/analysis-tables";
import { ringLabels } from "@/components/workspace/ring-labels";

/**
 * A clean, printable chart page (or PDF via the browser's "Save as PDF"):
 * header, wheel and positions on the first page; patterns, aspects and
 * rulerships on the second. Private notes are never included.
 */
const PRINT_CSS = `@media print {
  @page { size: auto; margin: 12mm; }
  body { background: #fff !important; }
  aside, header, .print-hide, nav[aria-label="Breadcrumb"] { display: none !important; }
  .lg\\:pl-\\[248px\\] { padding-left: 0 !important; }
  main, main > div { padding: 0 !important; margin: 0 !important; max-width: none !important; }
  .print-page { box-shadow: none !important; border: none !important; padding: 0 !important; }
  .print-break { break-before: page; }
  table, .print-avoid { break-inside: avoid; }
  .print-page th, .print-page td { padding-top: 2px !important; padding-bottom: 2px !important; font-size: 11px !important; }
  .print-wheel { max-width: 350px !important; margin: 6px auto !important; }
  .print-page tr { height: auto !important; }
  .print-page .print-note { display: none; }
}`;

export default function ChartPrintPage() {
  return (
    <React.Suspense>
      <PrintPage />
    </React.Suspense>
  );
}

function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const chart = useStore((s) => s.charts.find((c) => c.id === id));
  const people = useStore((s) => s.people);
  const practitioner = useStore((s) => s.practitioner);
  const view = useChartView(chart);
  const [opts, setOpts] = React.useState({ aspects: true, patterns: true, rulership: true });

  React.useEffect(() => {
    if (view && params.get("auto") === "1") {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [view, params]);

  if (!chart) return <p className="p-8 text-muted">Chart not found.</p>;
  const meta = chartTypeMeta(chart.type);
  const subjects = chart.personIds.map((pid) => people.find((p) => p.id === pid)).filter(Boolean);
  const labels = ringLabels(chart, people);
  const s = view?.settings;
  const momentTz = chart.type === "davison" ? "UTC" : chart.returnPlace?.tz || subjects[0]?.birth.tz || "UTC";

  return (
    <div className="mx-auto max-w-[900px]">
      <style>{PRINT_CSS}</style>
      <div className="print-hide mb-5 flex flex-wrap items-center gap-3">
        <Link href={`/app/charts/${chart.id}`} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Back to Chart</Link>
        <span className="flex flex-wrap items-center gap-4 text-[13px]">
          <label className="inline-flex items-center gap-2"><Checkbox checked={opts.patterns} onChange={(e) => setOpts({ ...opts, patterns: e.target.checked })} /> Aspect Patterns</label>
          <label className="inline-flex items-center gap-2"><Checkbox checked={opts.aspects} onChange={(e) => setOpts({ ...opts, aspects: e.target.checked })} /> Aspect List</label>
          <label className="inline-flex items-center gap-2"><Checkbox checked={opts.rulership} onChange={(e) => setOpts({ ...opts, rulership: e.target.checked })} /> Rulerships & Houses</label>
        </span>
        <Button className="ml-auto" onClick={() => window.print()} disabled={!view}><Printer /> Print or Save as PDF</Button>
      </div>

      <article className="print-page rounded-xl border border-line bg-white p-8 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{meta.name}</p>
            <h1 className="font-serif text-[30px] leading-tight text-ink">{chart.title}</h1>
            {subjects.map((p) => (
              <p key={p!.id} className="text-[13px] text-ink-3">
                {personName(p)} · {fmtDate(p!.birth.date)}, {p!.birth.timeAccuracy === "unknown" ? "Time Unknown" : fmtClock(p!.birth.time)} · {p!.birth.place}
              </p>
            ))}
            {view?.moment && (
              <p className="text-[13px] text-ink-3">
                {chart.type === "davison" ? "Cast For " : "Exact Return "}
                {new Date(view.moment).toLocaleString("en-US", { timeZone: momentTz, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
                {chart.returnPlace ? ` · ${chart.returnPlace.place}` : ""}
              </p>
            )}
            {meta.timing && chart.refDate && !view?.moment && <p className="text-[13px] text-ink-3">For {fmtDate(chart.refDate)}</p>}
          </div>
          <div className="text-right text-[12px] text-muted">
            {s && <p>{HOUSE_SYSTEMS.find((h) => h.id === s.houseSystem)?.name} · {ZODIACS.find((z) => z.id === s.zodiac)?.name} · {s.rulership === "modern" ? "Modern" : "Traditional"} Rulers</p>}
            <p>Swiss Ephemeris</p>
            {(practitioner.practice || practitioner.name) && <p className="mt-1 font-medium text-ink-3">{practitioner.practice || practitioner.name}</p>}
          </div>
        </div>

        {!view ? (
          <p className="py-20 text-center text-muted">Calculating…</p>
        ) : (
          <>
            <div className="print-wheel mx-auto my-6 max-w-[560px]">
              <ChartWheel view={view} showAspects={s!.showAspectLines} showHouses={s!.showHouseCusps} showDegrees wheelStyle={s!.wheelStyle} colors={s!.wheelColors} />
            </div>
            <div>
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Positions</h2>
              <PlacementsTable view={view} labels={labels} selected={null} onSelect={() => undefined} />
            </div>

            {(opts.patterns || opts.aspects || opts.rulership) && (
              <div className="print-break mt-8 space-y-6">
                {opts.patterns && !view.outer && (
                  <div className="print-avoid">
                    <PatternsList view={view} onSelectBody={() => undefined} />
                  </div>
                )}
                {opts.aspects && (
                  <div>
                    <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Aspects</h2>
                    <div className="columns-1 gap-8 text-[12.5px] sm:columns-2">
                      {view.aspects.map((a) => (
                        <p key={`${a.aRing}${a.a}${a.b}${a.bRing}`} className="flex break-inside-avoid justify-between gap-3 border-b border-line/60 py-1">
                          <span>
                            <span className="glyph mr-1">{ASPECTS[a.type].glyph}</span>
                            {view.outer && a.aRing === "outer" ? `${labels.outer} ` : ""}{BODIES[a.a].name} {aspectVerb(a.type)} {view.outer ? `${a.bRing === "outer" ? labels.outer : labels.inner} ` : ""}{BODIES[a.b].name}
                          </span>
                          <span className="tabular-nums text-muted">{fmtOrb(a.orb)} {a.applying ? "A" : "S"}</span>
                        </p>
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-muted">A = applying, S = separating.</p>
                  </div>
                )}
                {opts.rulership && !view.outer && view.inner.cusps.length === 12 && (
                  <div>
                    <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Rulerships & Houses</h2>
                    <RulershipTable view={view} rulership={s!.rulership ?? "traditional"} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </article>
    </div>
  );
}
