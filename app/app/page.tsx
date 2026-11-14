"use client";
import { useStore } from "@/lib/store";
import { ChartThumb } from "@/components/chart/chart-helpers";
import { PageHeader } from "@/components/ui/misc";
export default function Page() {
  const charts = useStore((s) => s.charts);
  return (
    <div>
      <PageHeader title="Scratch" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {charts.slice(0, 6).map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-white p-4"><ChartThumb chart={c} /><p>{c.title}</p></div>
        ))}
      </div>
    </div>
  );
}
