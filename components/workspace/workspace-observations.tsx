"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ExternalLink, Lock, Pin, Plus, NotebookPen } from "lucide-react";
import type { ChartRecord, Observation } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, relTime, stripHtml } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ObservationEditor } from "@/components/observations/observation-editor";
import { ScopeBadge, ownershipFor, ownershipSentence } from "@/components/observations/obs-meta";

function ObsItem({ o, onClick, readOnly }: { o: Observation; onClick?: () => void; readOnly?: boolean }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13.5px] font-medium leading-snug text-ink">
          {o.pinned && <Pin className="mr-1 inline size-3 fill-accent text-accent" />}
          {o.title}
        </p>
        {readOnly ? <Lock className="mt-0.5 size-3.5 shrink-0 text-muted" /> : null}
      </div>
      <p className="mt-1 line-clamp-2 text-[12.5px] text-muted">{stripHtml(o.body)}</p>
      <p className="mt-1.5 text-[11.5px] text-muted">
        Edited {relTime(o.updatedAt)} · {o.revisions.length} revision{o.revisions.length === 1 ? "" : "s"}
        {o.tags.length > 0 && <> · {o.tags.map((t) => `#${t}`).join(" ")}</>}
      </p>
    </>
  );
  if (readOnly)
    return (
      <Link href={`/app/observations?id=${o.id}`} className="block rounded-lg border border-dashed border-line bg-canvas/40 p-3 hover:border-line-strong">
        {inner}
      </Link>
    );
  return (
    <button onClick={onClick} className="block w-full rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong">
      {inner}
    </button>
  );
}

export function WorkspaceObservations({
  chart,
  editing,
  setEditing,
  draft,
}: {
  chart: ChartRecord;
  editing: string | "new" | null;
  setEditing: (v: string | "new" | null) => void;
  /** Starting values for a new observation (e.g. from the timeline). */
  draft?: Partial<Pick<Observation, "title" | "planets" | "aspects" | "houses">>;
}) {
  const observations = useStore((s) => s.observations);
  const people = useStore((s) => s.people);
  const [showRelated, setShowRelated] = React.useState(true);
  const own = ownershipFor(chart);

  const mine = observations
    .filter((o) => o.chartId === chart.id)
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (b.updatedAt > a.updatedAt ? 1 : -1));
  const related = chart.personIds.flatMap((pid) => ({
    pid,
    obs: observations.filter((o) => o.scope === "natal" && o.personIds.includes(pid) && o.chartId !== chart.id),
  }));
  const relatedCount = related.reduce((n, r) => n + r.obs.length, 0);

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink">
          <ArrowLeft className="size-3.5" /> All observations for this chart
        </button>
        <ObservationEditor
          key={editing}
          compact
          lockChart
          observationId={editing === "new" ? null : editing}
          initial={editing === "new" && draft ? { ...own, ...draft } : own}
          onDeleted={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
            Chart observations <ScopeBadge scope={own.scope} />
          </p>
          <p className="mt-1 text-[12px] leading-snug text-muted">{ownershipSentence(own.scope, chart, people)}</p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")} className="shrink-0">
          <Plus /> New
        </Button>
      </div>
      {own.scope === "relationship" && (
        <p className="rounded-lg border border-[#E6DAE6] bg-[#F7F2F7] px-3 py-2 text-[12px] text-[#6E4F6E]">
          New observations here are stored with this relationship chart — not with {personName(people.find((p) => p.id === chart.personIds[0]))}'s or{" "}
          {personName(people.find((p) => p.id === chart.personIds[1]))}'s natal records.
        </p>
      )}

      {mine.length === 0 ? (
        <div className="rounded-lg border border-line">
          <EmptyState icon={<NotebookPen />} title="No observations on this chart yet" body="Observations autosave as you write and stay with this chart between sessions." />
        </div>
      ) : (
        <div className="space-y-2">
          {mine.map((o) => (
            <ObsItem key={o.id} o={o} onClick={() => setEditing(o.id)} />
          ))}
        </div>
      )}

      {relatedCount > 0 && (
        <div className="rounded-lg border border-line">
          <button onClick={() => setShowRelated((s) => !s)} className="flex w-full items-center justify-between px-3 py-2.5 text-left">
            <span className="text-[12.5px] font-medium text-ink">
              Related natal observations <span className="font-normal text-muted">({relatedCount}, read-only)</span>
            </span>
            <ChevronDown className={cn("size-4 text-muted transition-transform", showRelated && "rotate-180")} />
          </button>
          {showRelated && (
            <div className="space-y-3 border-t border-line p-3">
              {related
                .filter((r) => r.obs.length)
                .map((r) => (
                  <div key={r.pid}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] text-muted">
                      Belongs to {personName(people.find((p) => p.id === r.pid))}'s natal chart
                      <Link href={`/app/observations?client=${chart.clientId}`} className="inline-flex items-center gap-0.5 text-accent hover:underline">
                        <ExternalLink className="size-3" />
                      </Link>
                    </p>
                    <div className="space-y-2">
                      {r.obs.map((o) => (
                        <ObsItem key={o.id} o={o} readOnly />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
