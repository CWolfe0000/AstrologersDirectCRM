"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { BODIES, SIGNS, chartTypeMeta, degInSign, type ChartView } from "@/lib/astro";
import { fmtDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/misc";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { usePractitionerFor } from "@/components/portal/portal-data";

const pos = (lon: number) => {
  const d = degInSign(lon);
  return `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, "0")}′ ${SIGNS[Math.floor(lon / 30) % 12]!.name}`;
};

/** A shared chart, read-only: the wheel and where each planet is. */
export default function PortalChart() {
  const { id } = useParams<{ id: string }>();
  const chart = useStore((s) => s.charts.find((c) => c.id === decodeURIComponent(id) && c.shared));
  const from = usePractitionerFor(chart);
  const [selected, setSelected] = React.useState<string | null>(null);
  if (!chart?.shared) return <EmptyState title="Chart Not Found" body="It may no longer be shared with you." action={<Link href="/portal/charts" className="text-accent hover:underline">Back to My Charts</Link>} />;
  const view = { ...chart.shared.view, engine: { id: "shared", name: "Swiss Ephemeris", verified: false, description: "" } } as unknown as ChartView;
  return (
    <div className="space-y-6">
      <Link href="/portal/charts" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> My Charts</Link>
      <div>
        <h1 className="font-serif text-[30px] leading-tight text-ink md:text-[36px]">{chart.title}</h1>
        <p className="text-[13px] text-muted">{chartTypeMeta(chart.type).name} · Shared by {from.name} on {fmtDate(chart.shared.at.slice(0, 10))}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-line bg-white p-3">
          <ChartWheel view={view} selected={selected} onSelect={setSelected} />
        </div>
        <div className="rounded-2xl border border-line bg-surface">
          <p className="border-b border-line px-4 py-3 text-[14px] font-semibold text-ink">Planets</p>
          <table className="w-full text-[13px]">
            <tbody>
              {view.inner.bodies.map((b) => (
                <tr key={b.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-2"><span className="glyph mr-1.5" aria-hidden>{BODIES[b.id]?.glyph}</span>{BODIES[b.id]?.name ?? b.id}{b.speed < 0 ? " ℞" : ""}</td>
                  <td className="px-2 py-2 tabular-nums text-ink-3">{pos(b.lon)}</td>
                  <td className="px-4 py-2 text-right text-muted">House {b.house}</td>
                </tr>
              ))}
              <tr className="border-b border-line/60"><td className="px-4 py-2">Ascendant</td><td className="px-2 py-2 tabular-nums text-ink-3" colSpan={2}>{pos(view.inner.asc)}</td></tr>
              <tr><td className="px-4 py-2">Midheaven</td><td className="px-2 py-2 tabular-nums text-ink-3" colSpan={2}>{pos(view.inner.mc)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[12px] text-muted">Select a planet on the wheel to highlight its aspects. Ask {from.firstName || "your astrologer"} in Messages if you have questions about your chart.</p>
    </div>
  );
}
