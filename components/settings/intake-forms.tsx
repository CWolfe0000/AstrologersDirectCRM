"use client";

import { selectIntakeForms } from "@/lib/intake";
import * as React from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ClipboardList, Copy, Eye, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { IntakeForm, IntakeSection, IntakeSectionKind } from "@/lib/data/types";
import { SECTION_INFO, STARTER_FORMS, newSection, sectionLabel } from "@/lib/intake";
import { api } from "@/lib/api";
import { DATA_MODE, nowLocal, uid } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { IntakeFill } from "@/components/intake/intake-fill";

const ANSWER_LABELS = { short: "Short Answer", long: "Long Answer", choice: "Pick One", multi: "Pick Any", date: "Date" } as const;
const BUILT_IN: Exclude<IntakeSectionKind, "question">[] = ["birth", "contact", "goals", "lifeEvents", "horary"];

/** Which booking services send each form (server mode). */
function useServiceNames() {
  const [names, setNames] = React.useState<Record<string, string[]>>({});
  React.useEffect(() => {
    if (DATA_MODE !== "server") return;
    api<{ profile: { services: { name: string; intakeFormId?: string; active: boolean }[] } }>("/api/v1/booking")
      .then((r) => {
        const out: Record<string, string[]> = {};
        for (const s of r.profile.services) if (s.intakeFormId) (out[s.intakeFormId] ??= []).push(s.name);
        setNames(out);
      })
      .catch(() => {});
  }, []);
  return names;
}

/** The practice's intake forms: as many as the astrologer likes, each built from parts. */
export function IntakeFormsSection() {
  const forms = useStore(selectIntakeForms);
  const update = useStore((s) => s.updatePractitioner);
  const toast = useStore((s) => s.toast);
  const [editing, setEditing] = React.useState<IntakeForm | null>(null);
  const [picking, setPicking] = React.useState(false);
  const services = useServiceNames();

  const save = (f: IntakeForm) => {
    const next = { ...f, updatedAt: nowLocal() };
    update({ intakeForms: forms.some((x) => x.id === f.id) ? forms.map((x) => (x.id === f.id ? next : x)) : [...forms, next] });
    toast("Form Saved", `“${f.title}” is ready to send.`, "success");
    setEditing(null);
  };
  const remove = (f: IntakeForm) => {
    if (!window.confirm(`Delete “${f.title}”? Forms already sent to clients aren’t affected.`)) return;
    update({ intakeForms: forms.filter((x) => x.id !== f.id) });
  };
  const start = (key: string | null) => {
    const starter = STARTER_FORMS.find((s) => s.key === key);
    const base = starter ? starter.build() : { title: "Untitled Form", sections: [newSection("birth", { required: true })] };
    setEditing({ id: uid("form"), updatedAt: nowLocal(), ...base });
    setPicking(false);
  };

  if (editing) return <FormEditor form={editing} isNew={!forms.some((f) => f.id === editing.id)} onSave={save} onCancel={() => setEditing(null)} />;

  return (
    <Card>
      <CardHeader
        icon={<ClipboardList />}
        title="Intake Forms"
        description="Questions clients answer before a session. Make one for each kind of reading, send it from a client’s page, or link it to a booking service so it goes out automatically when someone books."
        action={<Button size="sm" onClick={() => setPicking(true)}><Plus /> New Form</Button>}
      />
      <CardBody>
        {forms.length === 0 ? (
          <EmptyState icon={<ClipboardList />} title="No Intake Forms Yet" body="Start from a ready-made form (new client, career, relationship, horary, rectification) and make it your own." action={<Button size="sm" onClick={() => setPicking(true)}><Plus /> New Form</Button>} />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {forms.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-ink">{f.title}</p>
                  <p className="text-[12.5px] text-muted">{f.sections.map(sectionLabel).join(" · ")}</p>
                  {services[f.id]?.length ? <p className="mt-1 flex flex-wrap gap-1">{services[f.id]!.map((n) => <Badge key={n} tone="accent">Sent With {n}</Badge>)}</p> : null}
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditing(f)}>Edit</Button>
                <Button size="sm" variant="ghost" aria-label={`Duplicate ${f.title}`} onClick={() => setEditing({ ...f, id: uid("form"), title: `${f.title} (Copy)`, sections: f.sections.map((s) => ({ ...s, id: uid("s") })) })}><Copy /></Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${f.title}`} onClick={() => remove(f)}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[12px] text-muted">To send a form automatically when someone books, choose it for the service under Settings › Booking.</p>
      </CardBody>
      <Dialog open={picking} onOpenChange={setPicking}>
        <DialogContent title="New Intake Form" description="Start from a ready-made form or a blank one. You can change everything.">
          <div className="grid gap-2 px-6 pb-6 sm:grid-cols-2">
            {STARTER_FORMS.map((s) => (
              <button key={s.key} type="button" onClick={() => start(s.key)} className="rounded-lg border border-line p-3 text-left hover:border-accent/50 hover:bg-canvas-2">
                <span className="block text-[13.5px] font-medium text-ink">{s.title}</span>
                <span className="block text-[12px] text-muted">{s.description}</span>
              </button>
            ))}
            <button type="button" onClick={() => start(null)} className="rounded-lg border border-dashed border-line-strong p-3 text-left hover:bg-canvas-2">
              <span className="block text-[13.5px] font-medium text-ink">Blank Form</span>
              <span className="block text-[12px] text-muted">Start with birth details only.</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function FormEditor({ form, isNew, onSave, onCancel }: { form: IntakeForm; isNew: boolean; onSave: (f: IntakeForm) => void; onCancel: () => void }) {
  const [f, setF] = React.useState(form);
  const [preview, setPreview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const setSection = (id: string, patch: Partial<IntakeSection>) => setF((x) => ({ ...x, sections: x.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const move = (i: number, d: -1 | 1) => setF((x) => {
    const a = [...x.sections];
    const j = i + d;
    if (j < 0 || j >= a.length) return x;
    [a[i], a[j]] = [a[j]!, a[i]!];
    return { ...x, sections: a };
  });
  const missing = BUILT_IN.filter((k) => !f.sections.some((s) => s.kind === k));
  const add = (kind: IntakeSectionKind) => setF((x) => ({ ...x, sections: [...x.sections, kind === "question" ? newSection("question", { label: "", answer: "short" }) : newSection(kind)] }));
  const submit = () => {
    if (!f.title.trim()) return setError("Give the form a name.");
    if (!f.sections.length) return setError("Add at least one part.");
    const bad = f.sections.find((s) => s.kind === "question" && (!s.label?.trim() || ((s.answer === "choice" || s.answer === "multi") && !(s.options ?? []).length)));
    if (bad) return setError(bad.label?.trim() ? `Add the choices for “${bad.label}”.` : "Every custom question needs its wording.");
    setError(null);
    onSave({ ...f, title: f.title.trim(), intro: f.intro?.trim() || undefined, sections: f.sections.map((s) => ({ ...s, label: s.label?.trim() || undefined, help: s.help?.trim() || undefined })) });
  };

  return (
    <Card>
      <CardHeader
        title={isNew ? "New Intake Form" : "Edit Intake Form"}
        description="Changes apply to forms you send from now on. Forms already sent keep the questions they were sent with."
        action={<Button size="sm" variant="ghost" onClick={onCancel}><ArrowLeft /> All Forms</Button>}
      />
      <CardBody className="space-y-5">
        <div className="grid gap-4">
          <Field label="Form Name" htmlFor="if-title" hint="Clients see this as the form’s title."><Input id="if-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} /></Field>
          <Field label="Introduction" htmlFor="if-intro" optional><Textarea id="if-intro" value={f.intro ?? ""} onChange={(e) => setF({ ...f, intro: e.target.value })} rows={2} maxLength={2000} placeholder="A sentence or two shown above the questions." /></Field>
        </div>
        <ol className="space-y-3" aria-label="Form Parts">
          {f.sections.map((s, i) => (
            <li key={s.id} className="rounded-lg border border-line p-4">
              <div className="mb-3 flex items-center gap-2">
                <Badge tone={s.kind === "question" ? "neutral" : "accent"}>{s.kind === "question" ? "Custom Question" : SECTION_INFO[s.kind].label}</Badge>
                <span className="flex-1" />
                <Button size="icon-sm" variant="ghost" aria-label="Move Up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                <Button size="icon-sm" variant="ghost" aria-label="Move Down" disabled={i === f.sections.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Remove ${sectionLabel(s)}`} onClick={() => setF({ ...f, sections: f.sections.filter((x) => x.id !== s.id) })}><Trash2 /></Button>
              </div>
              {s.kind !== "question" && <p className="mb-3 text-[12.5px] text-muted">{SECTION_INFO[s.kind].describe}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={s.kind === "question" ? "Question" : "Heading"} htmlFor={`${s.id}-l`} className="sm:col-span-2">
                  <Input id={`${s.id}-l`} value={s.label ?? ""} onChange={(e) => setSection(s.id, { label: e.target.value })} placeholder={s.kind === "question" ? "e.g. What prompted you to book now?" : SECTION_INFO[s.kind].label} maxLength={300} />
                </Field>
                <Field label="Help Text" htmlFor={`${s.id}-h`} optional className="sm:col-span-2">
                  <Input id={`${s.id}-h`} value={s.help ?? ""} onChange={(e) => setSection(s.id, { help: e.target.value })} placeholder={s.kind === "question" ? "" : SECTION_INFO[s.kind].help} maxLength={1000} />
                </Field>
                {s.kind === "question" && (
                  <Field label="Answer" htmlFor={`${s.id}-a`}>
                    <Select id={`${s.id}-a`} value={s.answer ?? "short"} onChange={(e) => setSection(s.id, { answer: e.target.value as IntakeSection["answer"] })}>
                      {Object.entries(ANSWER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                  </Field>
                )}
                {s.kind === "question" && (s.answer === "choice" || s.answer === "multi") && (
                  <Field label="Choices" htmlFor={`${s.id}-o`} hint="One per line." className="sm:col-span-2">
                    <Textarea id={`${s.id}-o`} rows={3} value={(s.options ?? []).join("\n")} onChange={(e) => setSection(s.id, { options: e.target.value.split("\n").map((x) => x.slice(0, 200)).filter((x, k, a) => x.trim() || k === a.length - 1).slice(0, 20) })} onBlur={(e) => setSection(s.id, { options: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 20) })} />
                  </Field>
                )}
                {s.kind !== "horary" && <div className="flex items-end"><Checkbox label={<span className="text-[13px]">Required</span>} checked={!!s.required} onChange={(e) => setSection(s.id, { required: e.target.checked })} /></div>}
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {missing.map((k) => <Button key={k} size="sm" variant="secondary" onClick={() => add(k)}><Plus /> {SECTION_INFO[k].label}</Button>)}
          <Button size="sm" variant="secondary" onClick={() => add("question")}><Plus /> Custom Question</Button>
        </div>
        {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="secondary" onClick={() => setPreview(true)}><Eye /> Preview</Button>
          <Button onClick={submit}>Save Form</Button>
        </div>
      </CardBody>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent title="Preview" description="What your client sees. Nothing is sent from here." size="lg">
          <div className="max-h-[70vh] overflow-y-auto bg-canvas px-6 py-5">
            <IntakeFill title={f.title || "Untitled Form"} intro={f.intro} sections={f.sections.filter((s) => s.kind !== "question" || s.label?.trim())} onSubmit={async () => { throw new Error("This is a preview: nothing was sent."); }} />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
