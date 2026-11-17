"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Archive, ArchiveRestore, CalendarDays, Check, ChevronDown, Lock, MessageSquareText, Pencil, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import type { Client, ClientWork, WorkKind } from "@/lib/data/types";
import { cn, fmtDate, fmtShort, relTime, TODAY, uid } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { STARTER_TEMPLATES, WORK_KINDS, isOverdue, kindMeta, workState } from "./work-meta";

type Draft = { kind: WorkKind; title: string; instructions: string; dueDate: string; consultationId: string; remind: boolean };
const EMPTY: Draft = { kind: "assignment", title: "", instructions: "", dueDate: "", consultationId: "", remind: true };

export function ClientWorkTab({ client }: { client: Client }) {
  const params = useSearchParams();
  const all = useStore((s) => s.clientWork);
  const responses = useStore((s) => s.workResponses);
  const person = useStore((s) => s.people.find((p) => p.id === client.id));
  const first = person?.firstName ?? personName(person);
  const [editing, setEditing] = React.useState<ClientWork | "new" | null>(params.get("newWork") === "1" ? "new" : null);
  const [showArchived, setShowArchived] = React.useState(false);

  const work = all.filter((w) => w.clientId === client.id);
  const withState = work.map((w) => ({ w, st: workState(w, responses) })).sort((a, b) => (b.st.lastActivity ?? b.w.updatedAt).localeCompare(a.st.lastActivity ?? a.w.updatedAt));
  const groups = [
    { id: "open", title: "Shared with " + first, items: withState.filter((x) => x.w.status === "shared" && !x.st.done) },
    { id: "done", title: "Done", items: withState.filter((x) => x.w.status !== "archived" && x.w.status !== "draft" && x.st.done) },
    { id: "draft", title: "Drafts (only you can see these)", items: withState.filter((x) => x.w.status === "draft") },
  ];
  const archived = withState.filter((x) => x.w.status === "archived");
  const portalOff = client.portalAccess !== "active" && client.portalAccess !== "invited";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-[13px] text-muted">
          Assignments, journaling prompts, goals and follow-up activities you share with {first} between sessions. {first} sees shared items in their portal and can respond. Drafts and your observations stay private.
        </p>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus /> New
        </Button>
      </div>
      {portalOff && (
        <p className="rounded-lg border border-[#F1E0C2] bg-warn-50 px-3 py-2 text-[12.5px] text-[#6E4B16]">
          {first} doesn’t have portal access yet. Invite them from the menu above so they can see and respond to what you share.
        </p>
      )}

      {work.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessageSquareText />}
            title="Nothing shared yet"
            body="Keep the work going between sessions: a question to journal on, something to prepare, a goal, or a practice to try."
            action={
              <Button size="sm" onClick={() => setEditing("new")}>
                <Plus /> Create the first one
              </Button>
            }
          />
        </Card>
      ) : (
        groups
          .filter((g) => g.items.length)
          .map((g) => (
            <section key={g.id}>
              <h3 className="mb-2 text-[13px] font-semibold text-ink">
                {g.title} <span className="font-normal text-muted">({g.items.length})</span>
              </h3>
              <div className="space-y-2">
                {g.items.map(({ w }) => (
                  <WorkItem key={w.id} w={w} first={first} onEdit={() => setEditing(w)} defaultOpen={params.get("work") === w.id} />
                ))}
              </div>
            </section>
          ))
      )}

      {archived.length > 0 && (
        <section>
          <button type="button" onClick={() => setShowArchived((v) => !v)} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
            <ChevronDown className={cn("size-4 transition-transform", showArchived && "rotate-180")} /> Archived ({archived.length})
          </button>
          {showArchived && (
            <div className="mt-2 space-y-2">
              {archived.map(({ w }) => (
                <WorkItem key={w.id} w={w} first={first} onEdit={() => setEditing(w)} />
              ))}
            </div>
          )}
        </section>
      )}

      <WorkEditor client={client} first={first} editing={editing} onClose={() => setEditing(null)} defaultConsultation={params.get("consultation") ?? ""} />
    </div>
  );
}

function WorkItem({ w, first, onEdit, defaultOpen }: { w: ClientWork; first: string; onEdit: () => void; defaultOpen?: boolean }) {
  const responses = useStore((s) => s.workResponses);
  const consultation = useStore((s) => s.consultations.find((k) => k.id === w.consultationId));
  const update = useStore((s) => s.updateWork);
  const remove = useStore((s) => s.deleteWork);
  const toast = useStore((s) => s.toast);
  const [open, setOpen] = React.useState(!!defaultOpen);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (defaultOpen) ref.current?.scrollIntoView({ block: "center" });
  }, [defaultOpen]);
  const st = workState(w, responses);
  const meta = kindMeta(w.kind);
  const overdue = isOverdue(w, st.done, TODAY);

  return (
    <div ref={ref} className={cn("rounded-xl border bg-surface", defaultOpen ? "border-accent/40" : "border-line")}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", st.done ? "bg-sage-50 text-sage-dark" : "bg-accent-50 text-accent")}>
          {st.done ? <Check className="size-4" /> : <meta.icon className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-ink">{w.title}</span>
          <span className="block truncate text-[12px] text-muted">
            {meta.label}
            {w.dueDate && ` · by ${fmtShort(w.dueDate)}${w.remind && w.status === "shared" ? " · reminder on" : ""}`}
            {w.status === "draft" ? " · Draft" : w.sharedAt ? ` · Shared ${relTime(w.sharedAt)}` : ""}
            {st.entries.length > 0 && ` · ${st.entries.length} ${st.entries.length === 1 ? "response" : "responses"}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {overdue && <Badge tone="warn">Past due date</Badge>}
          {st.doneBy === "client" && <Badge tone="sage">Done by {first}</Badge>}
          {st.doneBy === "practitioner" && <Badge tone="sage">Marked done</Badge>}
          {w.status === "draft" && <Badge tone="outline"><Lock className="size-3" /> Private</Badge>}
          <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-line px-4 py-4">
          {w.instructions && <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink-3">{w.instructions}</p>}
          {consultation && (
            <p className="flex items-center gap-1.5 text-[12px] text-muted">
              <CalendarDays className="size-3.5" /> From the {consultation.type.toLowerCase()} on {fmtDate(consultation.start)}
            </p>
          )}
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">{first}’s responses</p>
            {st.timeline.length === 0 ? (
              <p className="text-[13px] text-muted">{w.status === "draft" ? "Share it to let them respond." : "No responses yet."}</p>
            ) : (
              <ol className="space-y-2">
                {st.timeline.map((r) =>
                  r.type === "entry" ? (
                    <li key={r.id} className="rounded-lg bg-canvas-2/70 px-3 py-2">
                      <p className="whitespace-pre-line text-[13.5px] text-ink">{r.text}</p>
                      <p className="mt-1 text-[11.5px] text-muted">{relTime(r.createdAt)}</p>
                    </li>
                  ) : (
                    <li key={r.id} className="text-[12px] text-muted">
                      {r.type === "done" ? `${first} marked this done` : `${first} reopened this`} · {relTime(r.createdAt)}
                    </li>
                  ),
                )}
              </ol>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            {w.status === "draft" && (
              <Button
                size="sm"
                onClick={() => {
                  update(w.id, { status: "shared" });
                  toast(`Shared with ${first}`, "It’s in their client portal now.", "success");
                }}
              >
                <Send /> Share with {first}
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
            {w.status === "shared" && (
              <Button size="sm" variant="secondary" onClick={() => update(w.id, { status: "completed" })}>
                <Check /> Mark done
              </Button>
            )}
            {w.status === "completed" && (
              <Button size="sm" variant="secondary" onClick={() => update(w.id, { status: "shared", completedAt: undefined })}>
                <RotateCcw /> Reopen
              </Button>
            )}
            {w.status !== "draft" && (
              <Button size="sm" variant="ghost" onClick={() => update(w.id, { status: w.status === "archived" ? "shared" : "archived" })}>
                {w.status === "archived" ? <ArchiveRestore /> : <Archive />} {w.status === "archived" ? "Restore" : "Archive"}
              </Button>
            )}
            {w.status === "draft" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  remove(w.id);
                  toast("Draft deleted", undefined, "success");
                }}
              >
                <Trash2 /> Delete draft
              </Button>
            )}
          </div>
          {w.status === "archived" && <p className="text-[12px] text-muted">Archived items are hidden from {first}’s portal.</p>}
        </div>
      )}
    </div>
  );
}

function WorkEditor({ client, first, editing, onClose, defaultConsultation }: { client: Client; first: string; editing: ClientWork | "new" | null; onClose: () => void; defaultConsultation: string }) {
  const add = useStore((s) => s.addWork);
  const update = useStore((s) => s.updateWork);
  const toast = useStore((s) => s.toast);
  const consultations = useStore((s) => s.consultations).filter((k) => k.clientId === client.id).sort((a, b) => b.start.localeCompare(a.start));
  const [d, setD] = React.useState<Draft>(EMPTY);
  const [template, setTemplate] = React.useState("");
  const mine = useStore((s) => s.practitioner.workTemplates) ?? [];
  const updatePractitioner = useStore((s) => s.updatePractitioner);
  const portalActive = client.portalAccess === "active";
  const pickTemplate = (id: string) => {
    setTemplate(id);
    const t = [...mine, ...STARTER_TEMPLATES].find((x) => x.id === id);
    if (t) setD((x) => ({ ...x, kind: t.kind, title: t.title, instructions: t.instructions }));
  };
  const saveTemplate = () => {
    const title = d.title.trim();
    const others = mine.filter((t) => t.title.trim().toLowerCase() !== title.toLowerCase());
    if (others.length >= 50) return toast("You have 50 templates", "Remove one before saving another.", "error");
    const t = { id: uid("tpl"), kind: d.kind, title, instructions: d.instructions.trim() };
    updatePractitioner({ workTemplates: [t, ...others] });
    setTemplate(t.id);
    toast(others.length < mine.length ? "Template updated" : "Saved as a template", "Start from it next time, for any client.", "success");
  };
  const removeTemplate = (id: string) => {
    updatePractitioner({ workTemplates: mine.filter((t) => t.id !== id) });
    setTemplate("");
    toast("Template removed", undefined, "success");
  };
  React.useEffect(() => {
    setTemplate("");
    if (editing === "new") setD({ ...EMPTY, consultationId: defaultConsultation });
    else if (editing) setD({ kind: editing.kind, title: editing.title, instructions: editing.instructions, dueDate: editing.dueDate ?? "", consultationId: editing.consultationId ?? "", remind: !!editing.remind });
  }, [editing, defaultConsultation]);
  const valid = d.title.trim().length > 0;
  const isNew = editing === "new";
  const existing = editing && editing !== "new" ? editing : null;

  const save = (share: boolean) => {
    const fields = {
      kind: d.kind,
      title: d.title.trim(),
      instructions: d.instructions.trim(),
      dueDate: d.dueDate || undefined,
      remind: d.dueDate ? d.remind : undefined,
      consultationId: d.consultationId || undefined,
    };
    if (existing) {
      update(existing.id, { ...fields, ...(share && existing.status === "draft" ? { status: "shared" as const } : {}) });
      toast(share && existing.status === "draft" ? `Shared with ${first}` : "Saved", undefined, "success");
    } else {
      add({ ...fields, clientId: client.id, status: share ? "shared" : "draft" });
      toast(share ? `Shared with ${first}` : "Draft saved", share ? "It’s in their client portal now." : "Only you can see drafts.", "success");
    }
    onClose();
  };

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      {editing && (
        <DialogContent
          size="lg"
          title={isNew ? `New for ${first}` : "Edit"}
          description={existing && existing.status !== "draft" ? `${first} already sees this. Changes appear in their portal straight away.` : "Save it as a draft, or share it now."}
          footer={
            <>
              <Button variant="ghost" className="sm:mr-auto" disabled={!valid} onClick={saveTemplate}>
                Save as template
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {(isNew || existing?.status === "draft") && (
                <Button variant="secondary" disabled={!valid} onClick={() => save(false)}>
                  Save draft
                </Button>
              )}
              <Button disabled={!valid} onClick={() => save(isNew || existing?.status === "draft")}>
                {isNew || existing?.status === "draft" ? (
                  <>
                    <Send /> Share with {first}
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {isNew && (
              <Field label="Start from a template (optional)" htmlFor="w-tpl">
                <div className="flex items-center gap-2">
                  <Select id="w-tpl" value={template} onChange={(e) => pickTemplate(e.target.value)}>
                    <option value="">Blank</option>
                    {mine.length > 0 && (
                      <optgroup label="Your templates">
                        {mine.map((t) => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Starter templates">
                      {STARTER_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </optgroup>
                  </Select>
                  {mine.some((t) => t.id === template) && (
                    <Button variant="ghost" size="sm" onClick={() => removeTemplate(template)}>
                      <Trash2 /> Remove template
                    </Button>
                  )}
                </div>
              </Field>
            )}
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink">Type</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {WORK_KINDS.map((k) => (
                  <label key={k.id} className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg border p-3", d.kind === k.id ? "border-accent bg-accent-50/50" : "border-line hover:border-line-strong")}>
                    <input type="radio" name="kind" className="sr-only" checked={d.kind === k.id} onChange={() => setD({ ...d, kind: k.id })} />
                    <k.icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    <span>
                      <span className="block text-[13.5px] font-medium text-ink">{k.label}</span>
                      <span className="block text-[12px] text-muted">{k.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Title" htmlFor="w-title">
              <Input id="w-title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder={d.kind === "journal" ? "e.g. What is Saturn asking of you?" : "e.g. List what each city offers you"} maxLength={200} />
            </Field>
            <Field label={d.kind === "journal" ? "Prompt" : "Instructions"} htmlFor="w-instr">
              <Textarea id="w-instr" rows={6} value={d.instructions} onChange={(e) => setD({ ...d, instructions: e.target.value })} placeholder={`What would you like ${first} to do, notice or reflect on?`} maxLength={10000} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Suggested date (optional)" htmlFor="w-due">
                <Input id="w-due" type="date" value={d.dueDate} onChange={(e) => setD({ ...d, dueDate: e.target.value })} />
              </Field>
              {d.dueDate && (
                <label className="flex items-start gap-2.5 text-[13px] text-ink-3 sm:col-span-2">
                  <Checkbox className="mt-0.5" checked={d.remind} onChange={(e) => setD({ ...d, remind: e.target.checked })} />
                  <span>
                    Email {first} a gentle reminder the day before
                    <span className="block text-[12px] text-muted">
                      {portalActive ? "Sent once, and not if they’ve already marked it done." : `Reminders go to clients with portal access. ${first} hasn’t joined the portal yet.`}
                    </span>
                  </span>
                </label>
              )}
              <Field label="From consultation (optional)" htmlFor="w-k">
                <Select id="w-k" value={d.consultationId} onChange={(e) => setD({ ...d, consultationId: e.target.value })}>
                  <option value="">None</option>
                  {consultations.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.type} · {fmtDate(k.start)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
