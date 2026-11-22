"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { LIFE_EVENT_TYPES, lifeEventLabel, lifeEventWhen, type LifeEvent } from "@/lib/life-events";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";

type Draft = { type: string; shape: "date" | "period"; date: string; end: string; ongoing: boolean; approx: boolean; note: string };
const EMPTY: Draft = { type: "", shape: "date", date: "", end: "", ongoing: false, approx: false, note: "" };
/** "2019-06" (month input) or "2019-06-14" → YYYY-MM-DD. */
const full = (v: string, approx: boolean) => (!v ? "" : approx ? `${v.slice(0, 7)}-01` : v);

/**
 * Add life events: a single date (a marriage, a death in the family) or a
 * period with a start and end (where they lived, a job, a relationship).
 * When only the month is known, the date is kept as the 1st and marked approximate.
 */
export function LifeEventsEditor({ value, onChange, idPrefix = "le" }: { value: LifeEvent[]; onChange: (v: LifeEvent[]) => void; idPrefix?: string }) {
  const [d, setD] = React.useState<Draft>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const dateType = d.approx ? "month" : "date";
  const add = () => {
    const date = full(d.date, d.approx);
    const end = d.shape === "period" && !d.ongoing ? full(d.end, d.approx) : "";
    if (!d.type) return setError("Choose what kind of event it was.");
    if (!date) return setError(d.shape === "period" ? "Add when it started." : "Add the date.");
    if (d.shape === "period" && !d.ongoing && !end) return setError("Add when it ended, or tick “Still going”.");
    if (end && end < date) return setError("The end can’t be before the start.");
    setError(null);
    onChange([...value, { id: uid("ev"), type: d.type, date, ...(end ? { end } : {}), ...(d.shape === "period" && d.ongoing ? { ongoing: true } : {}), ...(d.approx ? { approx: true } : {}), ...(d.note.trim() ? { note: d.note.trim().slice(0, 500) } : {}) }]);
    setD({ ...EMPTY, shape: d.shape, approx: d.approx });
  };
  const sorted = [...value].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="space-y-3">
      {sorted.length > 0 && (
        <ul className="divide-y divide-line rounded-lg border border-line" aria-label="Life Events Added">
          {sorted.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">{lifeEventLabel(e.type)}</span>
                <span className="block text-muted">{lifeEventWhen(e)}{e.note ? ` · ${e.note}` : ""}</span>
              </span>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${lifeEventLabel(e.type)}`} onClick={() => onChange(value.filter((x) => x.id !== e.id))}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-3 rounded-lg border border-dashed border-line-strong p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="What Happened" htmlFor={`${idPrefix}-type`}>
            <Select id={`${idPrefix}-type`} value={d.type} onChange={(e) => set("type", e.target.value)}>
              <option value="">Choose…</option>
              {LIFE_EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="When" htmlFor={`${idPrefix}-shape`}>
            <Segmented size="sm" value={d.shape} onChange={(v) => set("shape", v)} options={[{ value: "date", label: "A Single Date" }, { value: "period", label: "A Period of Time" }]} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={d.shape === "period" ? "Started" : "Date"} htmlFor={`${idPrefix}-date`}>
            <Input id={`${idPrefix}-date`} type={dateType} value={d.approx ? d.date.slice(0, 7) : d.date} onChange={(e) => set("date", e.target.value)} max="2100-12-31" />
          </Field>
          {d.shape === "period" && (
            <Field label="Ended" htmlFor={`${idPrefix}-end`}>
              <Input id={`${idPrefix}-end`} type={dateType} value={d.approx ? d.end.slice(0, 7) : d.end} onChange={(e) => set("end", e.target.value)} disabled={d.ongoing} />
            </Field>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <Checkbox label={<span className="text-[13px]">I only know the month</span>} checked={d.approx} onChange={(e) => setD((x) => ({ ...x, approx: e.target.checked, date: x.date.slice(0, 7), end: x.end.slice(0, 7) }))} />
          {d.shape === "period" && <Checkbox label={<span className="text-[13px]">Still going</span>} checked={d.ongoing} onChange={(e) => set("ongoing", e.target.checked)} />}
        </div>
        <Field label="A Few Words" htmlFor={`${idPrefix}-note`} optional>
          <Input id={`${idPrefix}-note`} value={d.note} onChange={(e) => set("note", e.target.value)} placeholder={d.shape === "period" ? "e.g. Lived in Tampa" : "e.g. Married Sam"} maxLength={500} />
        </Field>
        {error && <p className="text-[12.5px] text-danger" role="alert">{error}</p>}
        <Button type="button" size="sm" variant="secondary" onClick={add}><Plus /> Add Event</Button>
      </div>
    </div>
  );
}
