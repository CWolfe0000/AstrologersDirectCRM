"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays, Clock, Video, Phone, MapPin, CheckCircle2, XCircle, Mic, Send, ListPlus, NotebookPen, History, FileText, ArrowUpRight, Pin, Mail, RotateCcw,
} from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { FileKindIcon, SectionTitle, Divider } from "@/components/ui/misc";
import { Checkbox } from "@/components/ui/input";
import { ChartTypeBadge } from "@/components/chart/chart-helpers";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { cn, fmtDate, fmtLong, fmtTime, fmtDuration, stripHtml, relDay } from "@/lib/utils";
import { AutosaveTextarea } from "./autosave-textarea";

const LOC_ICON = { "Video call": Video, Phone: Phone, "In person": MapPin } as const;
const SCOPE_LABEL = { natal: "Natal", relationship: "Relationship", timing: "Timing" } as const;

export function ConsultationDetail({ id }: { id: string }) {
  const k = useStore((s) => s.consultations.find((c) => c.id === id));
  const people = useStore((s) => s.people);
  const clients = useStore((s) => s.clients);
  const charts = useStore((s) => s.charts);
  const observations = useStore((s) => s.observations);
  const consultations = useStore((s) => s.consultations);
  const tasks = useStore((s) => s.tasks);
  const readings = useStore((s) => s.readings);
  const recordings = useStore((s) => s.recordings);
  const update = useStore((s) => s.updateConsultation);
  const updateTask = useStore((s) => s.updateTask);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const [taskOpen, setTaskOpen] = React.useState(false);

  if (!k) return <p className="p-6 text-sm text-muted">Consultation not found.</p>;

  const person = people.find((p) => p.id === k.clientId);
  const client = clients.find((c) => c.id === k.clientId);
  const name = personName(person);
  const LocIcon = LOC_ICON[k.location];
  const linkedCharts = charts.filter((c) => k.chartIds.includes(c.id));
  const clientObs = observations
    .filter((o) => o.clientId === k.clientId)
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  const history = consultations
    .filter((c) => c.clientId === k.clientId && c.id !== k.id && c.status === "completed")
    .sort((a, b) => b.start.localeCompare(a.start));
  const followUps = tasks.filter((t) => t.consultationId === k.id);
  const relReadings = readings.filter((r) => r.consultationId === k.id || k.readingIds.includes(r.id));
  const relRecordings = recordings.filter((r) => k.recordingIds.includes(r.id));
  const end = new Date(new Date(k.start).getTime() + k.durationMin * 60000);
  const firstChart = linkedCharts[0]?.id;

  const setStatus = (status: typeof k.status) => {
    update(k.id, { status });
    log({ kind: "consultation", text: `Marked “${k.type}” with ${name} as ${status}`, clientId: k.clientId, href: `/app/consultations?id=${k.id}` });
    toast(status === "completed" ? "Consultation completed" : status === "cancelled" ? "Consultation cancelled" : "Consultation restored", `${k.type} · ${name}`, "success");
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={k.status} />
          <Badge tone="outline">{k.durationMin} min</Badge>
        </div>
        <h2 className="mt-2 font-serif text-[24px] leading-tight text-ink">{k.type}</h2>
        <div className="mt-3 space-y-1.5 text-[13.5px] text-ink-3">
          <p className="flex items-center gap-2"><CalendarDays className="size-4 text-muted" /> {fmtLong(k.start)}</p>
          <p className="flex items-center gap-2"><Clock className="size-4 text-muted" /> {fmtTime(k.start)} – {fmtTime(end)} <span className="text-muted">({relDay(k.start)})</span></p>
          <p className="flex items-center gap-2"><LocIcon className="size-4 text-muted" /> {k.location}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {k.status === "scheduled" && (
            <>
              <Button size="sm" variant="sage" onClick={() => setStatus("completed")}><CheckCircle2 /> Mark completed</Button>
              <Button size="sm" variant="secondary" onClick={() => setStatus("cancelled")}><XCircle /> Cancel</Button>
            </>
          )}
          {k.status !== "scheduled" && (
            <Button size="sm" variant="secondary" onClick={() => setStatus("scheduled")}><RotateCcw /> Reopen</Button>
          )}
          <ButtonLink size="sm" variant="secondary" href={`/app/studio?client=${k.clientId}${firstChart ? `&chart=${firstChart}` : ""}`}><Mic /> Record</ButtonLink>
          <ButtonLink size="sm" variant="secondary" href={`/app/delivery?new=1&client=${k.clientId}${firstChart ? `&chart=${firstChart}` : ""}`}><Send /> Deliver reading</ButtonLink>
        </div>
      </div>

      {/* client */}
      <div className="rounded-xl border border-line bg-canvas/50 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} />
          <div className="min-w-0 flex-1">
            <Link href={`/app/clients/${k.clientId}`} className="font-medium text-ink hover:text-accent">{name}</Link>
            <p className="truncate text-[12.5px] text-muted">
              {person ? `Born ${fmtDate(person.birth.date)} · ${person.birth.place.split(",")[0]}` : ""}
            </p>
          </div>
          {client && <StatusBadge status={client.status} />}
        </div>
        {client?.email && (
          <p className="mt-3 flex items-center gap-2 text-[12.5px] text-muted"><Mail className="size-3.5" /> {client.email}{client.phone ? ` · ${client.phone}` : ""}</p>
        )}
        <Link href={`/app/clients/${k.clientId}`} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline">
          Open client profile <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* charts */}
      <div>
        <SectionTitle>Associated charts</SectionTitle>
        {linkedCharts.length === 0 ? (
          <p className="text-[13px] text-muted">No charts linked.</p>
        ) : (
          <div className="space-y-1.5">
            {linkedCharts.map((c) => (
              <Link key={c.id} href={`/app/charts/${c.id}`} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 hover:border-line-strong">
                <span className="min-w-0 flex-1 truncate text-[13.5px]">{c.title}</span>
                <ChartTypeBadge type={c.type} />
                <ArrowUpRight className="size-3.5 text-muted" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <AutosaveTextarea key={k.id + "prep"} label="Preparation notes" value={k.prepNotes ?? ""} onSave={(v) => update(k.id, { prepNotes: v })} placeholder="What to revisit before the session…" />
      <AutosaveTextarea
        key={k.id + "session"}
        label="Session notes"
        value={k.sessionNotes ?? ""}
        onSave={(v) => update(k.id, { sessionNotes: v })}
        placeholder="Private notes from the session. Not visible to the client."
        className="min-h-[140px]"
      />

      {/* follow ups */}
      <div>
        <SectionTitle action={<Button size="xs" variant="secondary" onClick={() => setTaskOpen(true)}><ListPlus /> Create follow-up task</Button>}>Follow-up tasks</SectionTitle>
        {followUps.length === 0 ? (
          <p className="text-[13px] text-muted">No follow-ups yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {followUps.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
                <Checkbox checked={t.status === "done"} aria-label={`Complete: ${t.title}`} onChange={(e) => updateTask(t.id, { status: e.target.checked ? "done" : "todo" }, e.target.checked ? "Completed" : "Reopened")} />
                <Link href={`/app/tasks?id=${t.id}`} className={cn("min-w-0 flex-1 truncate text-[13.5px] hover:text-accent", t.status === "done" && "text-muted line-through")}>{t.title}</Link>
                <span className="text-[11.5px] text-muted">{fmtDate(t.due)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Divider />

      {/* client history */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <History className="size-4 text-muted" />
          <h3 className="text-[13px] font-semibold">Client history</h3>
        </div>
        <p className="eyebrow mb-2">Existing observations · {clientObs.length}</p>
        {clientObs.length === 0 && <p className="text-[13px] text-muted">No observations recorded for {person?.firstName}.</p>}
        <div className="space-y-2">
          {clientObs.slice(0, 5).map((o) => (
            <Link key={o.id} href={`/app/observations?id=${o.id}`} className="block rounded-lg border border-line bg-surface p-3 hover:border-line-strong">
              <div className="flex items-center gap-2">
                <NotebookPen className="size-3.5 shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{o.title}</span>
                {o.pinned && <Pin className="size-3 text-accent" />}
              </div>
              <p className="mt-1 line-clamp-2 text-[12.5px] text-muted">{stripHtml(o.body)}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
                <Badge tone={o.scope === "natal" ? "accent" : o.scope === "relationship" ? "info" : "sage"} className="text-[10.5px]">{SCOPE_LABEL[o.scope]}</Badge>
                <span>Updated {fmtDate(o.updatedAt)}</span>
              </div>
            </Link>
          ))}
          {clientObs.length > 5 && (
            <Link href={`/app/observations?client=${k.clientId}`} className="text-[12.5px] font-medium text-accent hover:underline">View all {clientObs.length} observations</Link>
          )}
        </div>

        <p className="eyebrow mb-2 mt-5">Previous consultations · {history.length}</p>
        {history.length === 0 && <p className="text-[13px] text-muted">This is the first consultation.</p>}
        <ol className="relative space-y-3 border-l border-line pl-4">
          {history.slice(0, 4).map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full border border-surface bg-line-strong" />
              <Link href={`/app/consultations?id=${h.id}`} className="text-[13px] font-medium hover:text-accent">{h.type}</Link>
              <p className="text-[11.5px] text-muted">{fmtDate(h.start)}</p>
              {h.sessionNotes && <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-3">{h.sessionNotes}</p>}
            </li>
          ))}
        </ol>
      </div>

      {(relReadings.length > 0 || relRecordings.length > 0) && (
        <>
          <Divider />
          <div>
            <SectionTitle>Related readings & recordings</SectionTitle>
            <div className="space-y-1.5">
              {relReadings.map((r) => (
                <Link key={r.id} href={`/app/delivery?id=${r.id}`} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 hover:border-line-strong">
                  <FileKindIcon kind={r.kind} className="size-8" />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{r.title}</span>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
              {relRecordings.map((r) => (
                <Link key={r.id} href="/app/studio" className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 hover:border-line-strong">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-sage-50 text-sage-dark"><Mic className="size-4" /></span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{r.title}</span>
                  <span className="text-[11.5px] text-muted">{fmtDuration(r.durationSec)}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {k.sharedSummary && (
        <div className="rounded-lg border border-line bg-canvas/60 p-3 text-[12.5px] text-ink-3">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-ink"><FileText className="size-3.5" /> Shared with client</p>
          {k.sharedSummary}
        </div>
      )}

      <NewTaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        defaultClientId={k.clientId}
        defaultConsultationId={k.id}
        title="Create follow-up task"
        description={`Linked to ${k.type} with ${name}.`}
      />
    </div>
  );
}
