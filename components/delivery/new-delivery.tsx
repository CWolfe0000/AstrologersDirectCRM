"use client";

import * as React from "react";
import Link from "next/link";
import { UploadCloud, Link2, CheckCircle2, FileCheck2, X, ArrowRight, ArrowLeft, Send, Save, ExternalLink, Sparkles } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/tabs";
import { FileKindIcon, KIND_LABEL, SimulatedNote } from "@/components/ui/misc";
import { ChartTypeBadge } from "@/components/chart/chart-helpers";
import type { Reading, ReadingKind } from "@/lib/data/types";
import { cn, fmtDate } from "@/lib/utils";
import { PortalPreview } from "./portal-preview";

const STEPS = ["Recipient", "Content", "Message & access", "Preview & send"];

function kindFromFile(f: File): ReadingKind {
  const n = f.name.toLowerCase();
  if (f.type === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (f.type.startsWith("audio/") || /\.(m4a|mp3|wav|aac|ogg)$/.test(n)) return "audio";
  if (f.type.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/.test(n)) return "video";
  return "document";
}

export function NewDeliveryDialog({
  open,
  onOpenChange,
  defaultClientId,
  defaultChartId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultClientId?: string;
  defaultChartId?: string;
  onDone?: (r: Reading) => void;
}) {
  const clients = useStore((s) => s.clients);
  const people = useStore((s) => s.people);
  const charts = useStore((s) => s.charts);
  const consultations = useStore((s) => s.consultations);
  const addReading = useStore((s) => s.addReading);
  const deliverReading = useStore((s) => s.deliverReading);
  const updateConsultation = useStore((s) => s.updateConsultation);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);

  const [step, setStep] = React.useState(0);
  const [clientId, setClientId] = React.useState("");
  const [chartId, setChartId] = React.useState("");
  const [consultationId, setConsultationId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [mode, setMode] = React.useState<"upload" | "link">("upload");
  const [file, setFile] = React.useState<{ name: string; sizeMB: number; kind: ReadingKind; durationSec?: number; pages?: number } | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [url, setUrl] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [allowDownload, setAllowDownload] = React.useState(true);
  const [expiry, setExpiry] = React.useState("never");
  const [notifyEmail, setNotifyEmail] = React.useState(true);
  const [done, setDone] = React.useState<Reading | null>(null);
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (open) {
      setStep(0);
      setClientId(defaultClientId ?? "");
      setChartId(defaultChartId ?? "");
      setConsultationId("");
      setTitle("");
      setMode("upload");
      setFile(null);
      setProgress(0);
      setUrl("");
      setMessage("");
      setAllowDownload(true);
      setExpiry("never");
      setNotifyEmail(true);
      setDone(null);
    }
  }, [open, defaultClientId, defaultChartId]);

  React.useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const person = people.find((p) => p.id === clientId);
  const clientCharts = charts.filter((c) => c.clientId === clientId);
  const clientConsults = consultations.filter((k) => k.clientId === clientId).sort((a, b) => b.start.localeCompare(a.start));

  const startUpload = (f: { name: string; sizeMB: number; kind: ReadingKind; durationSec?: number; pages?: number }) => {
    setFile(f);
    setProgress(0);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    if (timer.current) clearInterval(timer.current);
    const speed = Math.max(2, 18 - Math.log2(f.sizeMB + 1) * 2);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(100, p + speed + Math.random() * 6);
        if (n >= 100 && timer.current) clearInterval(timer.current);
        return n;
      });
    }, 120);
  };

  const onFile = (f?: File) => {
    if (!f) return;
    const kind = kindFromFile(f);
    const base = { name: f.name, sizeMB: f.size / (1024 * 1024), kind };
    if (kind === "audio" || kind === "video") {
      const el = document.createElement(kind);
      const u = URL.createObjectURL(f);
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        setFile((cur) => (cur && cur.name === f.name ? { ...cur, durationSec: Math.round(el.duration) || undefined } : cur));
        URL.revokeObjectURL(u);
      };
      el.src = u;
    }
    startUpload(base);
  };

  const useSample = () => {
    const last = person?.lastName ?? "Client";
    startUpload({ name: `${last}_Reading_Nov2026.pdf`, sizeMB: 1.8, kind: "pdf", pages: 12 });
  };

  const kind: ReadingKind = mode === "link" ? "link" : file?.kind ?? "pdf";
  const canNext = [
    !!clientId,
    !!title.trim() && (mode === "link" ? /^https?:\/\/.+\..+/.test(url) : !!file && progress >= 100),
    true,
    true,
  ][step];

  const expiresAt = expiry === "never" ? undefined : expiry === "30" ? "2026-12-14" : expiry === "90" ? "2027-02-12" : "2027-11-14";

  const finish = (send: boolean) => {
    const r = addReading({
      clientId,
      chartId: chartId || undefined,
      consultationId: consultationId || undefined,
      title: title.trim(),
      kind,
      fileName: mode === "upload" ? file?.name : undefined,
      sizeMB: mode === "upload" ? Math.round((file?.sizeMB ?? 0) * 10) / 10 : undefined,
      durationSec: file?.durationSec,
      pages: file?.pages,
      url: mode === "link" ? url : undefined,
      message,
      status: send ? "ready" : "draft",
      allowDownload: kind === "link" ? false : allowDownload,
      expiresAt,
      notification: "pending",
    });
    if (consultationId) {
      const k = consultations.find((c) => c.id === consultationId);
      if (k) updateConsultation(k.id, { readingIds: [...k.readingIds, r.id] });
    }
    if (send) {
      deliverReading(r.id);
      toast("Reading delivered", `${person?.firstName} has been notified${notifyEmail ? " by email and in their portal" : " in their portal"}.`, "success");
    } else {
      log({ kind: "reading", text: `Saved draft “${r.title}”`, clientId, href: `/app/delivery?id=${r.id}` });
      toast("Draft saved", r.title);
    }
    setDone({ ...r, status: send ? "delivered" : "draft" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={done ? (done.status === "delivered" ? "Reading delivered" : "Draft saved") : "New delivery"}
        description={done ? undefined : "Upload a finished reading or recording, or share a link. Nothing is written here — deliver what you've already prepared."}
        size="xl"
        footer={
          done ? (
            <>
              <Button variant="secondary" onClick={() => { onOpenChange(false); onDone?.(done); }}>View delivery</Button>
              {done.status === "delivered" && done.clientId === "c1" && (
                <ButtonLink href={`/portal/readings/${done.id}`}><ExternalLink /> Open in client portal</ButtonLink>
              )}
            </>
          ) : (
            <>
              {step > 0 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="mr-auto"><ArrowLeft /> Back</Button>}
              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>Continue <ArrowRight /></Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => finish(false)}><Save /> Save as draft</Button>
                  <Button onClick={() => finish(true)}><Send /> Send to client portal</Button>
                </>
              )}
            </>
          )
        }
      >
        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><CheckCircle2 className="size-7" /></span>
            <h3 className="mt-4 font-serif text-[24px]">{done.title}</h3>
            <p className="mt-1 max-w-md text-[13.5px] text-muted">
              {done.status === "delivered"
                ? `Delivered to ${personName(person)}'s client portal. They'll see a notification the next time they sign in${notifyEmail ? " and receive an email" : ""}.`
                : "Saved as a draft. You can finish and send it from the delivery queue."}
            </p>
            {done.status === "delivered" && done.clientId === "c1" && (
              <SimulatedNote className="mt-5 max-w-md text-left">
                Workflow E: Amelia Hart is the demo client signed in to the portal. Open the client portal to see the notification and the new reading.{" "}
                <Link href="/portal" className="font-medium underline">Go to /portal</Link>
              </SimulatedNote>
            )}
            {done.status === "delivered" && done.clientId !== "c1" && (
              <SimulatedNote className="mt-5 max-w-md text-left">Email notification simulated. The client portal preview is signed in as Amelia Hart — deliver to her to see it arrive.</SimulatedNote>
            )}
          </div>
        ) : (
          <>
            {/* stepper */}
            <ol className="mb-6 grid grid-cols-4 gap-2">
              {STEPS.map((s, i) => (
                <li key={s}>
                  <button
                    disabled={i > step}
                    onClick={() => i < step && setStep(i)}
                    className={cn("w-full text-left", i < step && "cursor-pointer")}
                  >
                    <div className={cn("h-1 rounded-full", i <= step ? "bg-accent" : "bg-canvas-3")} />
                    <p className={cn("mt-2 hidden text-[12px] sm:block", i === step ? "font-medium text-ink" : "text-muted")}>
                      {i + 1}. {s}
                    </p>
                  </button>
                </li>
              ))}
            </ol>
            <p className="mb-4 text-[12px] font-medium text-muted sm:hidden">Step {step + 1} of 4 · {STEPS[step]}</p>

            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client" className="sm:col-span-2">
                  <Select value={clientId} onChange={(e) => { setClientId(e.target.value); setChartId(""); setConsultationId(""); }}>
                    <option value="">Select a client…</option>
                    {clients.filter((c) => c.status !== "archived").map((c) => (
                      <option key={c.id} value={c.id}>{personName(people.find((p) => p.id === c.id))}{c.portalAccess !== "active" ? " (portal not active)" : ""}</option>
                    ))}
                  </Select>
                </Field>
                {clientId && (
                  <>
                    <Field label="Related chart" optional className="sm:col-span-2">
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {clientCharts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setChartId(chartId === c.id ? "" : c.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
                              chartId === c.id ? "border-accent bg-accent-50/50" : "border-line hover:border-line-strong",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">{c.title}</span>
                            <ChartTypeBadge type={c.type} />
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Related consultation" optional className="sm:col-span-2">
                      <Select value={consultationId} onChange={(e) => setConsultationId(e.target.value)}>
                        <option value="">None</option>
                        {clientConsults.map((k) => <option key={k.id} value={k.id}>{k.type} · {fmtDate(k.start)}</option>)}
                      </Select>
                    </Field>
                    {clients.find((c) => c.id === clientId)?.portalAccess !== "active" && (
                      <SimulatedNote className="sm:col-span-2">This client hasn't activated their portal yet. The reading will be waiting for them when they accept the invitation.</SimulatedNote>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Field label="Reading title">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Solar Return 2027 — Relocated to Lisbon" />
                </Field>
                <Segmented
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "upload", label: <><UploadCloud /> Upload a file</> },
                    { value: "link", label: <><Link2 /> External link</> },
                  ]}
                />
                {mode === "upload" ? (
                  file ? (
                    <div className="rounded-xl border border-line bg-surface p-4">
                      <div className="flex items-center gap-3">
                        <FileKindIcon kind={file.kind} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium">{file.name}</p>
                          <p className="text-[12px] text-muted">
                            {KIND_LABEL[file.kind]} · {file.sizeMB < 1 ? `${Math.round(file.sizeMB * 1024)} KB` : `${file.sizeMB.toFixed(1)} MB`}
                            {progress < 100 ? ` · Uploading ${Math.round(progress)}%` : " · Uploaded"}
                          </p>
                        </div>
                        {progress >= 100 ? <FileCheck2 className="size-5 text-sage-dark" /> : null}
                        <button onClick={() => { setFile(null); setProgress(0); }} className="rounded p-1 text-muted hover:text-ink" aria-label="Remove file"><X className="size-4" /></button>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas-2">
                        <div className={cn("h-full transition-all", progress >= 100 ? "bg-sage" : "bg-accent")} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
                      className={cn("flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors", drag ? "border-accent bg-accent-50/40" : "border-line bg-canvas/50")}
                    >
                      <UploadCloud className="size-8 text-muted" />
                      <p className="mt-3 text-[14px] font-medium">Drop a PDF, audio, video or document here</p>
                      <p className="mt-1 text-[12.5px] text-muted">PDF, DOCX, M4A, MP3, MP4, MOV · up to 1.5 GB per file</p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>Choose file</Button>
                        <Button variant="ghost" size="sm" onClick={useSample}><Sparkles /> Use a sample PDF</Button>
                      </div>
                      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,audio/*,video/*" onChange={(e) => onFile(e.target.files?.[0])} />
                    </div>
                  )
                ) : (
                  <Field label="Link URL" hint="Share notes or media hosted elsewhere (e.g. a cloud folder). The client opens it in a new tab.">
                    <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
                  </Field>
                )}
                <SimulatedNote>Uploads are simulated: the file is read locally for its name and size, and the progress bar is animated. No file leaves your browser.</SimulatedNote>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Message to client" hint="A short, personal note shown above the reading.">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[160px]"
                    placeholder={`${person?.firstName ?? "Hi"}, here is…`}
                  />
                </Field>
                <div className="space-y-4">
                  <p className="text-[13px] font-medium">Client access</p>
                  <label className="flex items-start justify-between gap-4 rounded-lg border border-line p-3">
                    <span>
                      <span className="block text-[13.5px]">Allow download</span>
                      <span className="block text-[12px] text-muted">{kind === "link" ? "Not applicable for links." : "Otherwise the client can view or stream only."}</span>
                    </span>
                    <Switch checked={kind !== "link" && allowDownload} disabled={kind === "link"} onCheckedChange={setAllowDownload} />
                  </label>
                  <Field label="Access expires">
                    <Select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                      <option value="never">Never — keep in the client's library</option>
                      <option value="30">After 30 days</option>
                      <option value="90">After 90 days</option>
                      <option value="365">After 1 year</option>
                    </Select>
                  </Field>
                  <label className="flex items-start justify-between gap-4 rounded-lg border border-line p-3">
                    <span>
                      <span className="block text-[13.5px]">Email notification</span>
                      <span className="block text-[12px] text-muted">Also email {person?.firstName ?? "the client"} that a reading is ready. An in-portal notification is always sent.</span>
                    </span>
                    <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <div className="space-y-3 text-[13.5px]">
                  <p className="eyebrow">Summary</p>
                  {[
                    ["Client", personName(person)],
                    ["Chart", charts.find((c) => c.id === chartId)?.title ?? "—"],
                    ["Content", mode === "link" ? url : file?.name ?? "—"],
                    ["Type", KIND_LABEL[kind]],
                    ["Download", kind === "link" ? "—" : allowDownload ? "Allowed" : "Disabled"],
                    ["Expires", expiry === "never" ? "Never" : fmtDate(expiresAt!)],
                    ["Notify", notifyEmail ? "Portal + email" : "Portal only"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line pb-2">
                      <span className="text-muted">{k}</span>
                      <span className="truncate text-right">{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="eyebrow mb-2">What {person?.firstName ?? "the client"} will see</p>
                  <PortalPreview
                    title={title}
                    kind={kind}
                    message={message}
                    fileName={file?.name}
                    sizeMB={file?.sizeMB}
                    url={url}
                    allowDownload={kind !== "link" && allowDownload}
                    durationSec={file?.durationSec}
                    clientFirstName={person?.firstName}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
