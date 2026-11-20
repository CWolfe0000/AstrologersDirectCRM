"use client";

import { selectIntakeForms } from "@/lib/intake";
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, ClipboardList, Clock, Send, Trash2 } from "lucide-react";
import type { Client, IntakeRequest, Person } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { sectionLabel } from "@/lib/intake";
import { lifeEventLabel, lifeEventWhen } from "@/lib/life-events";
import { cn, fmtClock, fmtDate } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { sendIntakeForm } from "./send";

const ACCURACY = { exact: "Exact", approximate: "Approximate", unknown: "Unknown" } as const;

/** A client's intake forms: send one, see what came back, and review birth details that differ from the record. */
export function ClientFormsTab({ client, person }: { client: Client; person: Person }) {
  const forms = useStore(selectIntakeForms);
  const all = useStore((s) => s.intakeRequests);
  const requests = React.useMemo(() => all.filter((r) => r.clientId === client.id).sort((a, b) => (b.sentAt > a.sentAt ? 1 : -1)), [all, client.id]);
  const toast = useStore((s) => s.toast);
  const params = useSearchParams();
  const [pick, setPick] = React.useState(forms[0]?.id ?? "");
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState<string | null>(params.get("form") ?? requests.find((r) => r.status === "submitted")?.id ?? null);
  const first = person.firstName;

  const send = async () => {
    const form = forms.find((f) => f.id === pick);
    if (!form) return;
    setBusy(true);
    try {
      const via = await sendIntakeForm(form, client.id);
      toast("Form Sent", via === "invite" ? `${first} will get a portal invitation with the form.` : via === "portal" ? `${first} will see it in their portal and get an email.` : `“${form.title}” is waiting in ${first}’s portal.`, "success");
    } catch (e) {
      toast("Form Not Sent", (e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader icon={<ClipboardList />} title="Intake Forms" description={`Questions for ${first} to answer before a session. Life events they add go onto their timeline; birth details that differ from what you have wait for you to review.`} />
        <CardBody>
          {forms.length === 0 ? (
            <p className="text-[13px] text-muted">You haven’t made any intake forms yet. <Link href="/app/settings?section=intake" className="font-medium text-accent hover:underline">Create one in Settings</Link>.</p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[220px] flex-1">
                <span className="mb-1 block text-[12.5px] font-medium text-ink-3">Form to Send</span>
                <Select value={pick} onChange={(e) => setPick(e.target.value)}>{forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}</Select>
              </label>
              <Button onClick={send} disabled={busy || !client.email}><Send /> {busy ? "Sending…" : `Send to ${first}`}</Button>
              {!client.email && <p className="w-full text-[12.5px] text-warn">Add an email address for {first} first.</p>}
            </div>
          )}
        </CardBody>
      </Card>

      {requests.length === 0 ? (
        <Card><EmptyState icon={<ClipboardList />} title="No Forms Sent Yet" body={`Forms you send to ${first}, and forms that come with their bookings, appear here with their answers.`} /></Card>
      ) : (
        requests.map((r) => <RequestCard key={r.id} r={r} person={person} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />)
      )}
    </div>
  );
}

function RequestCard({ r, person, open, onToggle }: { r: IntakeRequest; person: Person; open: boolean; onToggle: () => void }) {
  const toast = useStore((s) => s.toast);
  const updatePerson = useStore((s) => s.updatePerson);
  const charts = useStore((s) => s.charts);
  const setReq = (patch: Partial<IntakeRequest>) => useStore.setState((s) => ({ intakeRequests: s.intakeRequests.map((x) => (x.id === r.id ? { ...x, ...patch, updatedAt: new Date().toISOString().slice(0, 19) } : x)) }));
  const a = r.answers ?? {};
  const review = r.applied?.birth === "review" && a.birth;
  const horaryChart = r.applied?.chartId ? charts.find((c) => c.id === r.applied!.chartId) : undefined;

  const useBirth = () => {
    const b = a.birth!;
    updatePerson(person.id, { birth: { ...person.birth, date: b.date, time: b.time ?? "12:00", timeAccuracy: b.timeAccuracy, place: b.place, lat: b.lat, lon: b.lon, tz: b.tz } });
    setReq({ applied: { ...r.applied, birth: "applied" } });
    toast("Birth Details Updated", "Charts for this client now use the details from the form.", "success");
  };

  return (
    <Card>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", r.status === "submitted" ? "bg-sage-50 text-sage-dark" : "bg-canvas-2 text-muted")}>{r.status === "submitted" ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-ink">{r.title}</span>
          <span className="block text-[12.5px] text-muted">Sent {fmtDate(r.sentAt)}{r.consultationId ? " with their booking" : ""}{r.submittedAt ? ` · Answered ${fmtDate(r.submittedAt)}` : ""}</span>
        </span>
        {review && <Badge tone="warn">Birth Details to Review</Badge>}
        <Badge tone={r.status === "submitted" ? "sage" : "neutral"}>{r.status === "submitted" ? "Answered" : "Waiting"}</Badge>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <CardBody className="space-y-4 border-t border-line pt-4 text-[13px]">
          {r.status === "sent" ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted">Not answered yet. Asks for: {r.sections.map(sectionLabel).join(", ")}.</p>
              <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Withdraw this form? It disappears from their portal.")) useStore.setState((s) => ({ intakeRequests: s.intakeRequests.filter((x) => x.id !== r.id) })); }}><Trash2 /> Withdraw</Button>
            </div>
          ) : (
            r.sections.map((s) => {
              let body: React.ReactNode = <span className="text-muted">No answer.</span>;
              if (s.kind === "birth" && a.birth) {
                const b = a.birth;
                body = (
                  <div className="space-y-2">
                    <p>{fmtDate(b.date)} · {b.timeAccuracy === "unknown" ? "Time Unknown" : `${fmtClock(b.time!)} (${ACCURACY[b.timeAccuracy]})`} · {b.place}</p>
                    {b.timeSource && <p className="text-muted">Time comes from: {b.timeSource}</p>}
                    {review ? (
                      <div className="rounded-lg border border-warn/30 bg-warn-50 p-3">
                        <p className="flex items-center gap-1.5 font-medium text-warn"><AlertTriangle className="size-4" /> This differs from the record</p>
                        <p className="mt-1 text-ink-3">On record: {fmtDate(person.birth.date)} · {person.birth.timeAccuracy === "unknown" ? "Time Unknown" : `${fmtClock(person.birth.time)} (${ACCURACY[person.birth.timeAccuracy]})`} · {person.birth.place}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button size="sm" onClick={useBirth}>Use the Form’s Details</Button>
                          <Button size="sm" variant="ghost" onClick={() => setReq({ applied: { ...r.applied, birth: "dismissed" } })}>Keep What’s on Record</Button>
                        </div>
                      </div>
                    ) : r.applied?.birth === "applied" ? <p className="text-[12px] text-muted">On the client record.</p> : r.applied?.birth === "dismissed" ? <p className="text-[12px] text-muted">You kept the details on record.</p> : null}
                  </div>
                );
              } else if (s.kind === "contact" && a.contact) {
                body = <p>{[a.contact.preferredName && `Goes by ${a.contact.preferredName}`, a.contact.pronouns, a.contact.phone].filter(Boolean).join(" · ") || "No answer."}</p>;
              } else if (s.kind === "goals" && a.goals) {
                body = <p className="whitespace-pre-line">{a.goals}</p>;
              } else if (s.kind === "lifeEvents" && a.lifeEvents?.length) {
                body = (
                  <div>
                    <ul className="divide-y divide-line rounded-lg border border-line">
                      {[...a.lifeEvents].sort((x, y) => x.date.localeCompare(y.date)).map((e) => <li key={e.id} className="px-3 py-1.5"><span className="font-medium text-ink">{lifeEventLabel(e.type)}</span> <span className="text-muted">· {lifeEventWhen(e)}{e.note ? ` · ${e.note}` : ""}</span></li>)}
                    </ul>
                    <p className="mt-1.5 text-[12px] text-muted">{r.applied?.events ? `${r.applied.events} added to ${person.firstName}’s life events: they show on the Convergence Timeline and in Rectification.` : "Already on their record."}</p>
                  </div>
                );
              } else if (s.kind === "horary" && a.horary) {
                body = (
                  <div className="space-y-1">
                    <p className="whitespace-pre-line font-medium text-ink">“{a.horary.question}”</p>
                    <p className="text-muted">Asked {fmtDate(a.horary.date)} at {fmtClock(a.horary.time)} · {a.horary.place}</p>
                    {horaryChart && <Link href={`/app/charts/${horaryChart.id}`} className="text-[12.5px] font-medium text-accent hover:underline">Open the Horary Chart</Link>}
                  </div>
                );
              } else if (s.kind === "question") {
                const v = a.questions?.[s.id];
                if (Array.isArray(v) ? v.length : v) body = <p className="whitespace-pre-line">{Array.isArray(v) ? v.join(", ") : s.answer === "date" ? fmtDate(v!) : v}</p>;
              }
              return (
                <div key={s.id}>
                  <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted">{sectionLabel(s)}</p>
                  {body}
                </div>
              );
            })
          )}
        </CardBody>
      )}
    </Card>
  );
}
