"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { ELECTION_EVENTS, scoreElection, type ElectionCheck } from "@/lib/astro/elect";
import { natalPoints, type ChartView } from "@/lib/astro";
import type { ChartPoints } from "@/lib/astro/types";
import type { ElectionData, Person } from "@/lib/data/types";
import { cn, fmtClock, fmtDate } from "@/lib/utils";

/** The elected moment, what it's for, and how it scores against the rules it was chosen by. */
export function ElectionPanel({ election, view, client, className }: { election: ElectionData; view: ChartView; client?: Person; className?: string }) {
  const [natal, setNatal] = React.useState<ChartPoints | undefined>();
  React.useEffect(() => {
    if (election.useNatal && client) natalPoints(client, view.settings).then(setNatal).catch(() => {});
  }, [election.useNatal, client, view.settings]);
  const r = scoreElection(view.inner, election.checks as ElectionCheck[], { natal, eclipseNear: election.eclipseNear ?? null });
  const event = ELECTION_EVENTS.find((e) => e.id === election.event)?.name ?? "General";
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Elected Moment · {event}</p>
          {election.purpose && <p className="mt-1.5 font-serif text-[21px] leading-snug text-ink">{election.purpose}</p>}
          <p className="mt-1 text-[12.5px] text-muted">
            {fmtDate(election.at.slice(0, 10))} at {fmtClock(election.at.slice(11, 16))} · {election.place}
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-[28px] leading-none text-ink">{r.excluded ? "—" : r.percent}</p>
          <p className="text-[11.5px] text-muted">{r.excluded ? "Ruled out" : "of 100"}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 border-t border-line pt-3">
        {r.results.map((x) => (
          <li key={x.id} className="flex gap-2.5">
            {x.ok ? <Check className="mt-0.5 size-4 shrink-0 text-sage-dark" aria-label="Passes" /> : <X className="mt-0.5 size-4 shrink-0 text-warn" aria-label="Fails" />}
            <div>
              <p className="text-[13px] font-medium text-ink">{x.label}</p>
              {x.detail && <p className="text-[12.5px] text-muted">{x.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] text-muted">Traditional elective rules, weighted to rank candidate times. Your judgement decides.</p>
    </div>
  );
}
