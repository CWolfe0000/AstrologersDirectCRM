"use client";

import * as React from "react";
import { useStore, personName } from "@/lib/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { ChartTypeBadge } from "@/components/chart/chart-helpers";
import type { Consultation } from "@/lib/data/types";

export const CONSULTATION_TYPES = [
  "Natal Reading",
  "First Natal Reading",
  "Natal Follow-up",
  "Transit Review",
  "Relationship Synastry",
  "Career Timing Consultation",
  "Solar Return Reading",
  "Annual Review",
  "Rectification Session",
  "Business Partnership Review",
];

export function NewConsultationDialog({
  open,
  onOpenChange,
  defaultClientId,
  defaultDate,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultClientId?: string;
  defaultDate?: string;
  onCreated?: (c: Consultation) => void;
}) {
  const clients = useStore((s) => s.clients);
  const people = useStore((s) => s.people);
  const charts = useStore((s) => s.charts);
  const add = useStore((s) => s.addConsultation);
  const toast = useStore((s) => s.toast);

  const [clientId, setClientId] = React.useState(defaultClientId ?? "");
  const [type, setType] = React.useState(CONSULTATION_TYPES[3]!);
  const [date, setDate] = React.useState(defaultDate ?? "2026-11-20");
  const [time, setTime] = React.useState("10:00");
  const [duration, setDuration] = React.useState(60);
  const [location, setLocation] = React.useState<Consultation["location"]>("Video call");
  const [chartIds, setChartIds] = React.useState<string[]>([]);
  const [prep, setPrep] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setClientId(defaultClientId ?? "");
      if (defaultDate) setDate(defaultDate);
      setChartIds([]);
      setPrep("");
    }
  }, [open, defaultClientId, defaultDate]);

  const clientCharts = charts.filter((c) => c.clientId === clientId);
  React.useEffect(() => {
    setChartIds(charts.filter((c) => c.clientId === clientId && c.type === "natal").map((c) => c.id).slice(0, 1));
  }, [clientId, charts]);

  const active = clients.filter((c) => c.status !== "archived");
  const submit = () => {
    if (!clientId) return;
    const k = add({
      clientId,
      type,
      start: `${date}T${time}:00`,
      durationMin: duration,
      status: "scheduled",
      location,
      chartIds,
      prepNotes: prep || undefined,
      readingIds: [],
      recordingIds: [],
    });
    toast("Consultation scheduled", `${type} with ${personName(people.find((p) => p.id === clientId))}`, "success");
    onOpenChange(false);
    onCreated?.(k);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="New consultation"
        description="Schedule a session and link the charts you'll work from."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!clientId}>Schedule consultation</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client" className="sm:col-span-2">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Select a client…</option>
              {active.map((c) => (
                <option key={c.id} value={c.id}>{personName(people.find((p) => p.id === c.id))}</option>
              ))}
            </Select>
          </Field>
          <Field label="Consultation type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {CONSULTATION_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Location">
            <Select value={location} onChange={(e) => setLocation(e.target.value as Consultation["location"])}>
              <option>Video call</option>
              <option>Phone</option>
              <option>In person</option>
            </Select>
          </Field>
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
            <Field label="Duration">
              <Select value={duration} onChange={(e) => setDuration(+e.target.value)}>
                {[30, 45, 60, 75, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Linked charts" className="sm:col-span-2" hint={clientId ? undefined : "Choose a client to see their saved charts."}>
            {clientId && (
              <div className="grid gap-1.5 rounded-lg border border-line p-2 sm:grid-cols-2">
                {clientCharts.length === 0 && <p className="p-2 text-[13px] text-muted">No saved charts for this client yet.</p>}
                {clientCharts.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-canvas">
                    <Checkbox
                      checked={chartIds.includes(c.id)}
                      onChange={(e) => setChartIds((ids) => (e.target.checked ? [...ids, c.id] : ids.filter((x) => x !== c.id)))}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px]">{c.title}</span>
                    <ChartTypeBadge type={c.type} />
                  </label>
                ))}
              </div>
            )}
          </Field>
          <Field label="Preparation notes" optional className="sm:col-span-2">
            <Textarea value={prep} onChange={(e) => setPrep(e.target.value)} placeholder="What do you want to revisit or prepare before this session?" />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
