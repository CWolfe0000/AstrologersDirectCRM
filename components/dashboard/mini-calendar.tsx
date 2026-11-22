"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, monthName, sameDay, DEMO_TODAY } from "@/lib/utils";
import type { Consultation } from "@/lib/data/types";

export function MiniCalendar({ consultations }: { consultations: Consultation[] }) {
  const [cursor, setCursor] = React.useState(new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), 1));
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
  while (cells.length % 7) cells.push(null);
  const countOn = (d: Date) => consultations.filter((k) => k.status !== "cancelled" && sameDay(k.start, d)).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-semibold">
          {monthName(m, true)} {y}
        </p>
        <div className="flex gap-0.5">
          <button className="rounded p-1 text-muted hover:bg-canvas-2 hover:text-ink" onClick={() => setCursor(new Date(y, m - 1, 1))} aria-label="Previous Month">
            <ChevronLeft className="size-4" />
          </button>
          <button className="rounded p-1 text-muted hover:bg-canvas-2 hover:text-ink" onClick={() => setCursor(new Date(y, m + 1, 1))} aria-label="Next Month">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10.5px] font-medium uppercase tracking-wide text-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const n = countOn(d);
          const today = sameDay(d, DEMO_TODAY);
          return (
            <Link
              key={i}
              href={`/app/consultations?date=${y}-${String(m + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`}
              className={cn(
                "relative mx-auto flex size-8 flex-col items-center justify-center rounded-full text-[12.5px] transition-colors hover:bg-canvas-2",
                today && "bg-accent font-semibold text-white hover:bg-accent-hover",
              )}
            >
              {d.getDate()}
              {n > 0 && <span className={cn("absolute bottom-1 size-1 rounded-full", today ? "bg-white" : "bg-accent")} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
