"use client";

import * as React from "react";
import { useStore, personName } from "@/lib/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Task, TaskPriority } from "@/lib/data/types";
import { daysFromToday, fmtDate, uid } from "@/lib/utils";

export function NewTaskDialog({
  open,
  onOpenChange,
  defaultClientId,
  defaultConsultationId,
  defaultTitle,
  title = "New task",
  description = "Track a responsibility or follow-up for your practice.",
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultClientId?: string;
  defaultConsultationId?: string;
  defaultTitle?: string;
  title?: string;
  description?: string;
  onCreated?: (t: Task) => void;
}) {
  const clients = useStore((s) => s.clients);
  const people = useStore((s) => s.people);
  const consultations = useStore((s) => s.consultations);
  const addTask = useStore((s) => s.addTask);
  const toast = useStore((s) => s.toast);

  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [due, setDue] = React.useState(daysFromToday(4));
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [clientId, setClientId] = React.useState("");
  const [consultationId, setConsultationId] = React.useState("");
  const [items, setItems] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName(defaultTitle ?? "");
      setDesc("");
      setClientId(defaultClientId ?? "");
      setConsultationId(defaultConsultationId ?? "");
      setItems("");
      setPriority("medium");
    }
  }, [open, defaultClientId, defaultConsultationId, defaultTitle]);

  const clientConsults = consultations.filter((k) => k.clientId === clientId).sort((a, b) => b.start.localeCompare(a.start));

  const submit = () => {
    if (!name.trim()) return;
    const t = addTask({
      title: name.trim(),
      description: desc || undefined,
      due,
      priority,
      status: "todo",
      clientId: clientId || undefined,
      consultationId: consultationId || undefined,
      checklist: items
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((label) => ({ id: uid("ci"), label, done: false })),
    });
    toast("Task created", `“${t.title}” due ${fmtDate(due)}`, "success");
    onOpenChange(false);
    onCreated?.(t);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        description={description}
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!name.trim()}>Create Task</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Send written summary of transits" />
          </Field>
          <Field label="Description" optional className="sm:col-span-2">
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[70px]" />
          </Field>
          <Field label="Due date"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </Field>
          <Field label="Client" optional>
            <Select value={clientId} onChange={(e) => { setClientId(e.target.value); setConsultationId(""); }}>
              <option value="">No client</option>
              {clients.filter((c) => c.status !== "archived").map((c) => (
                <option key={c.id} value={c.id}>{personName(people.find((p) => p.id === c.id))}</option>
              ))}
            </Select>
          </Field>
          <Field label="Consultation" optional>
            <Select value={consultationId} onChange={(e) => setConsultationId(e.target.value)} disabled={!clientId}>
              <option value="">None</option>
              {clientConsults.map((k) => (
                <option key={k.id} value={k.id}>{k.type} · {fmtDate(k.start)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Checklist" optional hint="One item per line." className="sm:col-span-2">
            <Textarea value={items} onChange={(e) => setItems(e.target.value)} className="min-h-[70px]" placeholder={"Review chart\nExport PDF"} />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
