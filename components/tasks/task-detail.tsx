"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, CircleDot, FileText, CalendarDays, User, ArrowUpRight } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/misc";
import { ChartTypeBadge } from "@/components/chart/chart-helpers";
import type { Task, TaskPriority, TaskStatus } from "@/lib/data/types";
import { cn, fmtDate, fmtTime, uid, TODAY } from "@/lib/utils";

export function isOverdue(t: Task) {
  return t.status !== "done" && t.due < TODAY;
}

export function TaskDetail({ id, onDeleted }: { id: string; onDeleted?: () => void }) {
  const t = useStore((s) => s.tasks.find((x) => x.id === id));
  const people = useStore((s) => s.people);
  const clients = useStore((s) => s.clients);
  const consultations = useStore((s) => s.consultations);
  const charts = useStore((s) => s.charts);
  const files = useStore((s) => s.files);
  const update = useStore((s) => s.updateTask);
  const toggle = useStore((s) => s.toggleChecklist);
  const toast = useStore((s) => s.toast);
  const [newItem, setNewItem] = React.useState("");
  const [title, setTitle] = React.useState(t?.title ?? "");
  const [desc, setDesc] = React.useState(t?.description ?? "");

  React.useEffect(() => {
    setTitle(t?.title ?? "");
    setDesc(t?.description ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!t) return <p className="text-sm text-muted">Task not found.</p>;

  const consultation = consultations.find((k) => k.id === t.consultationId);
  const chart = charts.find((c) => c.id === t.chartId);
  const clientFiles = files.filter((f) => f.clientId === t.clientId).slice(0, 3);
  const done = t.checklist.filter((c) => c.done).length;

  const addItem = () => {
    if (!newItem.trim()) return;
    update(t.id, { checklist: [...t.checklist, { id: uid("ci"), label: newItem.trim(), done: false }] });
    setNewItem("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={isOverdue(t) ? "overdue" : t.status} />
        <StatusBadge status={t.priority} label={`${t.priority[0]!.toUpperCase()}${t.priority.slice(1)} priority`} />
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== t.title && update(t.id, { title: title.trim() }, "Renamed")}
        className="h-auto border-transparent px-0 font-serif text-[22px] hover:border-line focus:px-2"
        aria-label="Task title"
      />
      <Field label="Description">
        <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== (t.description ?? "") && update(t.id, { description: desc })} placeholder="Add details…" className="min-h-[80px]" />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Due date">
          <Input type="date" value={t.due} onChange={(e) => update(t.id, { due: e.target.value }, `Due date changed to ${fmtDate(e.target.value)}`)} />
        </Field>
        <Field label="Priority">
          <Select value={t.priority} onChange={(e) => update(t.id, { priority: e.target.value as TaskPriority }, `Priority set to ${e.target.value}`)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={t.status}
            onChange={(e) => {
              const v = e.target.value as TaskStatus;
              update(t.id, { status: v }, v === "done" ? "Completed" : v === "in-progress" ? "Moved to In progress" : "Moved to To do");
              if (v === "done") toast("Task completed", t.title, "success");
            }}
          >
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Client">
          <Select value={t.clientId ?? ""} onChange={(e) => update(t.id, { clientId: e.target.value || undefined, consultationId: undefined })}>
            <option value="">No client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{personName(people.find((p) => p.id === c.id))}</option>)}
          </Select>
        </Field>
        <Field label="Consultation">
          <Select value={t.consultationId ?? ""} onChange={(e) => update(t.id, { consultationId: e.target.value || undefined })} disabled={!t.clientId}>
            <option value="">None</option>
            {consultations.filter((k) => k.clientId === t.clientId).map((k) => <option key={k.id} value={k.id}>{k.type} · {fmtDate(k.start)}</option>)}
          </Select>
        </Field>
      </div>
      {(t.clientId || consultation) && (
        <div className="flex flex-wrap gap-2">
          {t.clientId && (
            <Link href={`/app/clients/${t.clientId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] hover:border-line-strong">
              <User className="size-3.5 text-muted" /> {personName(people.find((p) => p.id === t.clientId))} <ArrowUpRight className="size-3 text-muted" />
            </Link>
          )}
          {consultation && (
            <Link href={`/app/consultations?id=${consultation.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] hover:border-line-strong">
              <CalendarDays className="size-3.5 text-muted" /> {consultation.type} · {fmtDate(consultation.start)} <ArrowUpRight className="size-3 text-muted" />
            </Link>
          )}
        </div>
      )}

      <div>
        <SectionTitle action={t.checklist.length > 0 && <span className="text-[12px] text-muted">{done}/{t.checklist.length}</span>}>Checklist</SectionTitle>
        {t.checklist.length > 0 && (
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-canvas-2">
            <div className="h-full bg-sage transition-all" style={{ width: `${(done / t.checklist.length) * 100}%` }} />
          </div>
        )}
        <ul className="space-y-1">
          {t.checklist.map((c) => (
            <li key={c.id} className="group flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-canvas">
              <Checkbox checked={c.done} onChange={() => toggle(t.id, c.id)} aria-label={`Done: ${c.label}`} />
              <span className={cn("flex-1 text-[13.5px]", c.done && "text-muted line-through")}>{c.label}</span>
              <button
                onClick={() => update(t.id, { checklist: t.checklist.filter((x) => x.id !== c.id) })}
                className="rounded p-1 text-muted opacity-0 hover:text-danger group-hover:opacity-100"
                aria-label="Remove item"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Add checklist item" aria-label="New checklist item" className="h-8 text-[13px]" />
          <Button size="sm" variant="secondary" onClick={addItem}><Plus /> Add</Button>
        </div>
      </div>

      {(chart || clientFiles.length > 0) && (
        <div>
          <SectionTitle>Related charts & files</SectionTitle>
          <div className="space-y-1.5">
            {chart && (
              <Link href={`/app/charts/${chart.id}`} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 hover:border-line-strong">
                <CircleDot className="size-4 text-muted" />
                <span className="min-w-0 flex-1 truncate text-[13px]">{chart.title}</span>
                <ChartTypeBadge type={chart.type} />
              </Link>
            )}
            {clientFiles.map((f) => (
              <Link key={f.id} href={`/app/clients/${f.clientId}?tab=files`} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 hover:border-line-strong">
                <FileText className="size-4 text-muted" />
                <span className="min-w-0 flex-1 truncate text-[13px]">{f.name}</span>
                {f.private && <Badge tone="outline">Private</Badge>}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>History</SectionTitle>
        <ol className="relative space-y-3 border-l border-line pl-4">
          {[...t.history].reverse().map((h, i) => (
            <li key={i} className="relative">
              <span className={cn("absolute -left-[21px] top-1.5 size-2 rounded-full border border-surface", h.text === "Completed" ? "bg-sage" : "bg-line-strong")} />
              <p className="text-[13px]">{h.text}</p>
              <p className="text-[11.5px] text-muted">{fmtDate(h.at)} · {fmtTime(h.at)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-50"
          onClick={() => {
            useStore.setState((s) => ({ tasks: s.tasks.filter((x) => x.id !== t.id) }));
            toast("Task deleted", t.title);
            onDeleted?.();
          }}
        >
          <Trash2 /> Delete task
        </Button>
      </div>
    </div>
  );
}
