"use client";

import * as React from "react";
import Link from "next/link";
import { CircleDot } from "lucide-react";
import { useStore } from "@/lib/store";
import { chartTypeMeta } from "@/lib/astro";
import { fmtDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/misc";
import { usePractitionerFor, usePortalPractices } from "@/components/portal/portal-data";
import type { ChartRecord } from "@/lib/data/types";

/** Charts the astrologer has shared with the client. */
export default function PortalCharts() {
  const all = useStore((s) => s.charts);
  const charts = React.useMemo(() => all.filter((c) => c.shared), [all]);
  const many = usePortalPractices().length > 1;
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-[34px] leading-tight text-ink md:text-[40px]">My Charts</h1>
      <p className="-mt-3 text-[14px] text-muted">Charts your astrologer has shared with you.</p>
      {charts.length === 0 ? (
        <EmptyState icon={<CircleDot />} title="No Charts Shared Yet" body="When your astrologer shares a chart, it appears here." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {charts.map((c) => <ChartCard key={c.id} c={c} many={many} />)}
        </ul>
      )}
    </div>
  );
}

function ChartCard({ c, many }: { c: ChartRecord; many: boolean }) {
  const from = usePractitionerFor(c);
  return (
    <li>
      <Link href={`/portal/charts/${encodeURIComponent(c.id)}`} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong">
        <span className="flex size-11 items-center justify-center rounded-full bg-canvas-2 text-accent"><CircleDot className="size-5" /></span>
        <span className="min-w-0">
          <span className="block truncate font-serif text-[18px] text-ink">{c.title}</span>
          <span className="block text-[12.5px] text-muted">{chartTypeMeta(c.type).name} · Shared {fmtDate(c.shared!.at.slice(0, 10))}{many ? ` by ${from.firstName}` : ""}</span>
        </span>
      </Link>
    </li>
  );
}
