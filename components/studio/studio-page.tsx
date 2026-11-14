"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mic, Video, MonitorUp, MonitorPlay, Circle, Pause, Play, Square, Trash2, Save, Send, CheckCircle2, ExternalLink, RotateCcw,
  Captions, Scissors, ListOrdered, FileText, Camera, MonitorSmartphone, NotebookPen, Sparkles,
} from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader, SimulatedBadge, SimulatedNote, EmptyState } from "@/components/ui/misc";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { ChartThumb, ChartTypeBadge, EngineNotice, useChartView } from "@/components/chart/chart-helpers";
import { BODIES, SIGNS, fmtDeg, ordinal, ASPECTS } from "@/lib/astro";
import type { RecordingMode } from "@/lib/data/types";
import { cn, fmtDate, fmtDuration } from "@/lib/utils";
import { MicMeter, useMicLevel } from "./mic-meter";
import { SimPlayer } from "./sim-player";

const MODES: { id: RecordingMode; label: string; desc: string; icon: React.ElementType; screen: boolean; cam: boolean }[] = [
  { id: "audio", label: "Audio only", desc: "Microphone only — a spoken reading.", icon: Mic, screen: false, cam: false },
  { id: "webcam", label: "Webcam + mic", desc: "Face-to-camera reading.", icon: Video, screen: false, cam: true },
  { id: "screen", label: "Screen + mic", desc: "Walk through the chart on screen.", icon: MonitorUp, screen: true, cam: false },
  { id: "screen-webcam", label: "Screen + webcam + mic", desc: "Chart walkthrough with a camera bubble.", icon: MonitorPlay, screen: true, cam: true },
];
export const MODE_LABEL: Record<RecordingMode, string> = { audio: "Audio only", webcam: "Webcam + mic", screen: "Screen + mic", "screen-webcam": "Screen + webcam + mic" };

const FALLBACK_MICS = ["Built-in microphone", "Shure MV7 (USB)", "AirPods Pro"];
const FALLBACK_CAMS = ["FaceTime HD Camera", "Logitech Brio 4K"];

type Phase = "setup" | "recording" | "paused" | "review" | "done";

function StreamVideo({ stream, className, mirrored }: { stream: MediaStream; className?: string; mirrored?: boolean }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay muted playsInline className={cn("h-full w-full object-cover", mirrored && "-scale-x-100", className)} />;
}

export function StudioPage() {
  const params = useSearchParams();
  const clients = useStore((s) => s.clients);
  const people = useStore((s) => s.people);
  const charts = useStore((s) => s.charts);
  const observations = useStore((s) => s.observations);
  const recordings = useStore((s) => s.recordings);
  const practitioner = useStore((s) => s.practitioner);
  const addRecording = useStore((s) => s.addRecording);
  const updateRecording = useStore((s) => s.updateRecording);
  const deleteRecording = useStore((s) => s.deleteRecording);
  const addReading = useStore((s) => s.addReading);
  const deliverReading = useStore((s) => s.deliverReading);
  const toast = useStore((s) => s.toast);

  const [clientId, setClientId] = React.useState(params.get("client") ?? "c1");
  const [chartId, setChartId] = React.useState(params.get("chart") ?? "");
  const [title, setTitle] = React.useState("");
  const [titleTouched, setTitleTouched] = React.useState(false);
  const [mode, setMode] = React.useState<RecordingMode>("screen-webcam");
  const [useReal, setUseReal] = React.useState(false);
  const [mics, setMics] = React.useState<string[]>(FALLBACK_MICS);
  const [cams, setCams] = React.useState<string[]>(FALLBACK_CAMS);
  const [mic, setMic] = React.useState(FALLBACK_MICS[0]!);
  const [cam, setCam] = React.useState(FALLBACK_CAMS[0]!);
  const [shareTarget, setShareTarget] = React.useState("AstrologersDirect — Chart workspace");
  const [phase, setPhase] = React.useState<Phase>("setup");
  const [elapsed, setElapsed] = React.useState(0);
  const [viewChartId, setViewChartId] = React.useState("");
  const [selBody, setSelBody] = React.useState<string | null>(null);
  const [camStream, setCamStream] = React.useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = React.useState<MediaStream | null>(null);
  const [micStream, setMicStream] = React.useState<MediaStream | null>(null);
  const [blob, setBlob] = React.useState<{ url: string; type: string; size: number } | null>(null);
  const [message, setMessage] = React.useState("");
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [deliveredReadingId, setDeliveredReadingId] = React.useState<string | null>(null);
  const recorder = React.useRef<MediaRecorder | null>(null);
  const chunks = React.useRef<Blob[]>([]);

  const m = MODES.find((x) => x.id === mode)!;
  const person = people.find((p) => p.id === clientId);
  const clientCharts = charts.filter((c) => c.clientId === clientId);
  const chart = charts.find((c) => c.id === chartId);
  const viewChart = charts.find((c) => c.id === (viewChartId || chartId)) ?? clientCharts[0];
  const view = useChartView(viewChart);
  const recording = phase === "recording";
  const live = phase === "recording" || phase === "paused";
  const locked = phase !== "setup";
  const level = useMicLevel(recording, useReal ? micStream : null);

  // default chart when client changes
  React.useEffect(() => {
    const cs = charts.filter((c) => c.clientId === clientId);
    if (!cs.some((c) => c.id === chartId)) setChartId(cs.find((c) => c.type === "natal")?.id ?? cs[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);
  React.useEffect(() => setViewChartId(chartId), [chartId]);
  React.useEffect(() => {
    if (!titleTouched && person) {
      const kind = chart ? chart.title.split("—").pop()!.trim() : "Reading";
      setTitle(`${kind} walkthrough — ${person.firstName}`);
    }
  }, [chart, person, titleTouched]);
  React.useEffect(() => {
    if (person) setMessage(`${person.firstName}, here is the recording we talked about. Take your time with it, and send me any questions in the portal.\n\n— ${practitioner.firstName}`);
  }, [person, practitioner.firstName]);

  // timer
  React.useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // enumerate real devices when enabled
  React.useEffect(() => {
    if (!useReal || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((ds) => {
      const am = ds.filter((d) => d.kind === "audioinput").map((d, i) => d.label || `Microphone ${i + 1}`);
      const vc = ds.filter((d) => d.kind === "videoinput").map((d, i) => d.label || `Camera ${i + 1}`);
      if (am.length) { setMics(am); setMic(am[0]!); }
      if (vc.length) { setCams(vc); setCam(vc[0]!); }
    }).catch(() => {});
  }, [useReal]);

  const stopTracks = React.useCallback(() => {
    [camStream, screenStream, micStream].forEach((s) => s?.getTracks().forEach((t) => t.stop()));
    setCamStream(null);
    setScreenStream(null);
    setMicStream(null);
  }, [camStream, screenStream, micStream]);

  React.useEffect(() => () => { recorder.current?.state !== "inactive" && recorder.current?.stop(); }, []);

  const start = async () => {
    setElapsed(0);
    setBlob(null);
    setSavedId(null);
    setDeliveredReadingId(null);
    setSelBody(null);
    if (useReal) {
      try {
        const md = navigator.mediaDevices;
        if (!md || typeof MediaRecorder === "undefined") throw new Error("Recording is not supported in this browser.");
        const micS = await md.getUserMedia({ audio: true, video: m.cam ? { width: 1280, height: 720 } : false });
        let scr: MediaStream | null = null;
        if (m.screen) scr = await md.getDisplayMedia({ video: true });
        setMicStream(micS);
        if (m.cam) setCamStream(micS);
        setScreenStream(scr);
        const tracks = [...(scr ? scr.getVideoTracks() : m.cam ? micS.getVideoTracks() : []), ...micS.getAudioTracks()];
        const rec = new MediaRecorder(new MediaStream(tracks));
        chunks.current = [];
        rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
        rec.onstop = () => {
          const type = m.screen || m.cam ? "video/webm" : "audio/webm";
          const b = new Blob(chunks.current, { type });
          setBlob({ url: URL.createObjectURL(b), type, size: b.size });
        };
        rec.start(500);
        recorder.current = rec;
      } catch (err) {
        toast("Using simulated recording", err instanceof Error ? err.message : "Device access was not granted.", "error");
        recorder.current = null;
      }
    }
    setPhase("recording");
  };
  const pause = () => { recorder.current?.state === "recording" && recorder.current.pause(); setPhase("paused"); };
  const resume = () => { recorder.current?.state === "paused" && recorder.current.resume(); setPhase("recording"); };
  const stop = () => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    recorder.current = null;
    stopTracks();
    setElapsed((e) => Math.max(e, 1));
    setPhase("review");
  };
  const discard = () => {
    if (savedId) deleteRecording(savedId);
    if (blob) URL.revokeObjectURL(blob.url);
    setBlob(null);
    setSavedId(null);
    setElapsed(0);
    setPhase("setup");
    toast("Recording discarded");
  };
  const save = () => {
    if (savedId) {
      updateRecording(savedId, { title });
      toast("Recording updated", title, "success");
      return savedId;
    }
    const r = addRecording({ clientId, chartId: chartId || undefined, title: title.trim() || "Untitled recording", mode, durationSec: elapsed, status: "saved" });
    setSavedId(r.id);
    toast("Saved to client record", `${title} · ${personName(person)}`, "success");
    return r.id;
  };
  const deliver = () => {
    const recId = save();
    const isVideo = mode !== "audio";
    const reading = addReading({
      clientId,
      chartId: chartId || undefined,
      title: title.trim() || "Recorded reading",
      kind: isVideo ? "video" : "audio",
      fileName: `${title.replace(/[^\w]+/g, "_")}.${blob ? "webm" : isVideo ? "mp4" : "m4a"}`,
      sizeMB: blob ? Math.round((blob.size / 1048576) * 10) / 10 : Math.round(elapsed * (isVideo ? 0.12 : 0.012) * 10) / 10 || 0.1,
      durationSec: elapsed,
      message,
      status: "ready",
      allowDownload: true,
      notification: "pending",
    });
    deliverReading(reading.id);
    updateRecording(recId, { status: "delivered", readingId: reading.id, title });
    setDeliveredReadingId(reading.id);
    setPhase("done");
    toast("Delivered to client portal", `${person?.firstName} has been notified.`, "success");
  };
  const reset = () => {
    setPhase("setup");
    setElapsed(0);
    setBlob(null);
    setSavedId(null);
    setDeliveredReadingId(null);
    setTitleTouched(false);
  };

  // ——— preview pieces ———
  const selected = selBody && view ? (() => {
    const [ring, id] = selBody.split(":") as ["inner" | "outer", string];
    const pts = ring === "outer" ? view.outer : view.inner;
    const b = pts?.bodies.find((x) => x.id === id);
    if (!b) return null;
    const asp = view.aspects.filter((a) => `${a.aRing}:${a.a}` === selBody || `${a.bRing}:${a.b}` === selBody);
    return { b, asp, ring };
  })() : null;

  const simCamera = (small?: boolean) => (
    <div className={cn("flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#4A4248] to-[#2E2A2F]", small && "gap-1")}>
      <Avatar name={practitioner.name} size={small ? "lg" : "xl"} className={cn("bg-[#5B4A51] text-[#EBD7DC]", !small && "size-24 text-3xl")} />
      {!small && <p className="mt-3 text-[12px] text-white/60">{cam} · simulated preview</p>}
    </div>
  );

  const screenMock = (
    <div className="flex h-full w-full flex-col bg-canvas">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-1.5">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="ml-2 truncate text-[10.5px] text-muted">{shareTarget}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center gap-4 p-3">
        <div className="aspect-square h-full max-h-full">
          {view ? <ChartWheel view={view} selected={selBody} onSelect={setSelBody} showDegrees={false} /> : null}
        </div>
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="font-serif text-[15px] leading-tight md:text-[19px]">{viewChart?.title}</p>
          <p className="mt-1 text-[10.5px] text-muted md:text-[11.5px]">{person ? `${fmtDate(person.birth.date)} · ${person.birth.place}` : ""}</p>
          {selected ? (
            <div className="mt-3 rounded-lg border border-line bg-surface p-2.5 text-[11px] md:text-[12px]">
              <p className="font-medium">{BODIES[selected.b.id].name} {fmtDeg(selected.b.lon, true)}{selected.b.speed < 0 ? " ℞" : ""}</p>
              <p className="text-muted">{ordinal(selected.b.house)} house · {selected.asp.length} aspects</p>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-muted">Select a planet to highlight its aspects.</p>
          )}
        </div>
      </div>
    </div>
  );

  const preview = (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-ink">
      {m.screen ? (
        screenStream ? <StreamVideo stream={screenStream} className="object-contain" /> : screenMock
      ) : m.cam ? (
        camStream ? <StreamVideo stream={camStream} mirrored /> : simCamera()
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-5">
          <Avatar name={practitioner.name} size="xl" className="bg-[#5B4A51] text-[#EBD7DC]" />
          <div className="flex h-16 items-center gap-[3px]">
            {Array.from({ length: 40 }, (_, i) => (
              <span key={i} className="w-1 rounded-full bg-[#D9B9C2] transition-all duration-100" style={{ height: `${8 + level * 100 * (0.3 + Math.abs(Math.sin(i * 0.9 + elapsed)) * 0.7)}%`, opacity: recording ? 0.9 : 0.3 }} />
            ))}
          </div>
          <p className="text-[12px] text-white/60">{mic}</p>
        </div>
      )}
      {m.screen && m.cam && (
        <div className="absolute bottom-3 right-3 aspect-square w-[20%] overflow-hidden rounded-full border-2 border-white/80 shadow-pop">
          {camStream ? <StreamVideo stream={camStream} mirrored /> : simCamera(true)}
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        {live ? (
          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-white", recording ? "bg-danger" : "bg-ink/80")}>
            {recording ? <span className="size-2 animate-pulse2 rounded-full bg-white" /> : <Pause className="size-3" />}
            {recording ? "REC" : "Paused"} <span className="tabular-nums">{fmtDuration(elapsed)}</span>
          </span>
        ) : (
          <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[11.5px] font-medium text-white">Preview · {m.label}</span>
        )}
      </div>
      
    </div>
  );

  const myRecordings = [...recordings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Recording Studio" }]}
        title="Recording Studio"
        description="Record an audio or video interpretation while you navigate the client's chart, then deliver it straight to their portal."
        actions={<SimulatedBadge label={useReal ? "Real devices (beta)" : "Simulated recording"} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {/* Setup */}
          <Card>
            <CardHeader title="Recording setup" description={locked ? `${personName(person)} · ${chart?.title ?? "No chart"} · ${m.label}` : "Choose who and what you're recording."} />
            {!locked && (
              <CardBody className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Client">
                    <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                      {clients.filter((c) => c.status !== "archived").map((c) => <option key={c.id} value={c.id}>{personName(people.find((p) => p.id === c.id))}</option>)}
                    </Select>
                  </Field>
                  <Field label="Associated chart">
                    <Select value={chartId} onChange={(e) => setChartId(e.target.value)}>
                      {clientCharts.length === 0 && <option value="">No charts</option>}
                      {clientCharts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </Select>
                  </Field>
                  <Field label="Recording title">
                    <Input value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} />
                  </Field>
                </div>
                <div>
                  <p className="mb-2 text-[13px] font-medium">Recording mode</p>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {MODES.map((x) => (
                      <button
                        key={x.id}
                        onClick={() => setMode(x.id)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors",
                          mode === x.id ? "border-accent bg-accent-50/50 ring-1 ring-accent/20" : "border-line bg-surface hover:border-line-strong",
                        )}
                      >
                        <x.icon className={cn("size-5", mode === x.id ? "text-accent" : "text-muted")} />
                        <p className="mt-2 text-[13px] font-medium">{x.label}</p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{x.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardBody>
            )}
          </Card>

          {/* Recorder */}
          {phase !== "review" && phase !== "done" && (
            <Card className="overflow-hidden">
              <div className="p-3 md:p-4">{preview}</div>
              <div className="flex flex-col gap-4 border-t border-line px-4 py-4 2xl:flex-row 2xl:items-center">
                <div className="flex items-center gap-3">
                  {phase === "setup" && (
                    <Button size="lg" onClick={start} className="bg-danger hover:bg-danger/90"><Circle className="fill-current" /> Start recording</Button>
                  )}
                  {phase === "recording" && <Button size="lg" variant="secondary" onClick={pause}><Pause /> Pause</Button>}
                  {phase === "paused" && <Button size="lg" variant="secondary" onClick={resume}><Play /> Resume</Button>}
                  {live && <Button size="lg" variant="dark" onClick={stop}><Square className="fill-current" /> Stop</Button>}
                  <span className="font-serif text-[28px] tabular-nums leading-none">{fmtDuration(elapsed)}</span>
                </div>
                <div className="grid flex-1 gap-3 sm:grid-cols-3 2xl:ml-auto 2xl:max-w-[560px]">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11.5px] text-muted">
                      <span className="flex items-center gap-1"><Mic className="size-3.5" /> Microphone</span>
                      <MicMeter level={level} className="text-ink" bars={10} />
                    </div>
                    <Select value={mic} onChange={(e) => setMic(e.target.value)} className="[&_select]:h-8 [&_select]:text-[12.5px]">
                      {mics.map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[11.5px] text-muted"><Camera className="size-3.5" /> Camera</p>
                    <Select value={cam} onChange={(e) => setCam(e.target.value)} disabled={!m.cam || live} className="[&_select]:h-8 [&_select]:text-[12.5px]">
                      {m.cam ? cams.map((x) => <option key={x}>{x}</option>) : <option>Not used in this mode</option>}
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[11.5px] text-muted"><MonitorSmartphone className="size-3.5" /> Screen share</p>
                    <Select value={shareTarget} onChange={(e) => setShareTarget(e.target.value)} disabled={!m.screen || (live && useReal)} className="[&_select]:h-8 [&_select]:text-[12.5px]">
                      {m.screen ? (
                        <>
                          <option>AstrologersDirect — Chart workspace</option>
                          <option>Entire screen</option>
                          <option>Browser window</option>
                        </>
                      ) : (
                        <option>Not used in this mode</option>
                      )}
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/50 px-4 py-3">
                <label className="flex items-center gap-2.5 text-[12.5px]">
                  <Switch checked={useReal} onCheckedChange={setUseReal} disabled={locked} />
                  <span>Use real devices <span className="text-muted">(beta — asks for camera, mic & screen permission)</span></span>
                </label>
                <span className="text-[11.5px] text-muted">{useReal ? "Recorded in your browser; nothing is uploaded." : "Simulated: no devices are accessed."}</span>
              </div>
            </Card>
          )}

          {/* Review */}
          {phase === "review" && (
            <Card>
              <CardHeader title="Review recording" description={`${fmtDuration(elapsed)} · ${m.label} · ${personName(person)}`} action={blob ? <Badge tone="sage">Recorded in browser</Badge> : <SimulatedBadge />} />
              <CardBody className="space-y-5">
                {blob ? (
                  blob.type.startsWith("video") ? (
                    <video src={blob.url} controls className="aspect-video w-full rounded-xl bg-ink" />
                  ) : (
                    <audio src={blob.url} controls className="w-full" />
                  )
                ) : (
                  <SimPlayer duration={elapsed} audio={mode === "audio"}>
                    <div className="flex h-full w-full items-center justify-center bg-canvas p-4">
                      {viewChart && <ChartThumb chart={viewChart} className="h-full w-auto" />}
                    </div>
                  </SimPlayer>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Recording title">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </Field>
                  <Field label="Associated chart">
                    <div className="flex h-9 items-center gap-2 rounded-lg border border-line bg-canvas/50 px-3 text-[13px]">
                      <span className="truncate">{chart?.title ?? "—"}</span>
                      {chart && <ChartTypeBadge type={chart.type} />}
                    </div>
                  </Field>
                  <Field label="Message to client" className="md:col-span-2" hint="Shown above the recording in the client's portal if you deliver it.">
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[90px]" />
                  </Field>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                  <Button variant="ghost" className="text-danger hover:bg-danger-50" onClick={discard}><Trash2 /> Discard</Button>
                  <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                    <Button variant="secondary" onClick={save}><Save /> {savedId ? "Save changes" : "Save to client record"}</Button>
                    <Button onClick={deliver}><Send /> Deliver to client portal</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {phase === "done" && (
            <Card>
              <CardBody className="flex flex-col items-center py-10 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><CheckCircle2 className="size-7" /></span>
                <h2 className="mt-4 font-serif text-[26px]">Delivered to {person?.firstName}</h2>
                <p className="mt-1 max-w-md text-[13.5px] text-muted">“{title}” was saved to {personName(person)}'s record and shared in their client portal.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {deliveredReadingId && <ButtonLink variant="secondary" href={`/app/delivery?id=${deliveredReadingId}`}>View delivery</ButtonLink>}
                  {clientId === "c1" && deliveredReadingId && <ButtonLink href={`/portal/readings/${deliveredReadingId}`}><ExternalLink /> Open in client portal</ButtonLink>}
                  <Button variant="ghost" onClick={reset}><RotateCcw /> Record another</Button>
                </div>
                {clientId !== "c1" && <SimulatedNote className="mt-5 max-w-md text-left">The portal preview is signed in as Amelia Hart — record for her to follow the reading through to the client side.</SimulatedNote>}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Chart navigation panel */}
        <div className="min-w-0 space-y-6">
          <Card className="xl:sticky xl:top-24">
            <CardHeader title="Client chart" description={live ? "Navigate freely — your recording continues." : "Navigate the chart while you record."} action={<EngineNotice compact />} />
            <CardBody className="space-y-4">
              {clientCharts.length === 0 ? (
                <EmptyState title="No charts for this client" body="Create a chart to walk through it while recording." action={<ButtonLink size="sm" variant="secondary" href={`/app/charts/new?client=${clientId}`}>Create chart</ButtonLink>} className="py-6" />
              ) : (
                <>
                  <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
                    {clientCharts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setViewChartId(c.id); setSelBody(null); }}
                        className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[12px] transition-colors", viewChart?.id === c.id ? "border-accent bg-accent-50 text-accent" : "border-line text-muted hover:text-ink")}
                      >
                        {c.title.split("—").pop()!.trim()}
                      </button>
                    ))}
                  </div>
                  <div className="mx-auto max-w-[320px]">{view && <ChartWheel view={view} selected={selBody} onSelect={setSelBody} showDegrees={false} />}</div>
                  {selected ? (
                    <div className="rounded-lg border border-line bg-canvas/50 p-3">
                      <p className="flex items-center gap-2 text-[13.5px] font-medium">
                        <span className="glyph text-[16px]">{BODIES[selected.b.id].glyph}</span>
                        {BODIES[selected.b.id].name} in {SIGNS[Math.floor(selected.b.lon / 30)]!.name}
                        {selected.b.speed < 0 && <Badge tone="warn">℞</Badge>}
                      </p>
                      <p className="text-[12px] text-muted">{fmtDeg(selected.b.lon)} · {ordinal(selected.b.house)} house{selected.ring === "outer" ? " · outer wheel" : ""}</p>
                      <ul className="mt-2 space-y-0.5 text-[12px]">
                        {selected.asp.slice(0, 5).map((a, i) => {
                          const other = `${a.aRing}:${a.a}` === selBody ? a.b : a.a;
                          return <li key={i} className="flex justify-between"><span>{ASPECTS[a.type].name} {BODIES[other].name}</span><span className="text-muted">{a.orb.toFixed(1)}° {a.applying ? "app" : "sep"}</span></li>;
                        })}
                        {selected.asp.length === 0 && <li className="text-muted">No major aspects within orb.</li>}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-center text-[12px] text-muted">Click a planet to highlight it and its aspects.</p>
                  )}
                  {viewChart && observations.filter((o) => o.chartId === viewChart.id).length > 0 && (
                    <div>
                      <p className="eyebrow mb-2">Your observations on this chart</p>
                      <ul className="space-y-1.5">
                        {observations.filter((o) => o.chartId === viewChart.id).slice(0, 4).map((o) => (
                          <li key={o.id} className="flex items-start gap-2 text-[12.5px]">
                            <NotebookPen className="mt-0.5 size-3.5 shrink-0 text-muted" />
                            <span>{o.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {viewChart && <Link href={`/app/charts/${viewChart.id}`} className="block text-center text-[12.5px] font-medium text-accent hover:underline">Open full chart workspace</Link>}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Past recordings */}
      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Recordings" description="Saved and delivered recordings across all clients." />
        <ul className="divide-y divide-line">
          {myRecordings.map((r) => {
            const c = charts.find((x) => x.id === r.chartId);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-sage-50 text-sage-dark">{r.mode === "audio" ? <Mic className="size-4" /> : r.mode === "webcam" ? <Video className="size-4" /> : <MonitorPlay className="size-4" />}</span>
                <div className="min-w-[200px] flex-1">
                  <p className="truncate text-[13.5px] font-medium">{r.title}</p>
                  <p className="truncate text-[12px] text-muted">
                    <Link href={`/app/clients/${r.clientId}`} className="hover:text-ink">{personName(people.find((p) => p.id === r.clientId))}</Link>
                    {c ? ` · ${c.title}` : ""} · {MODE_LABEL[r.mode]} · {fmtDuration(r.durationSec)} · {fmtDate(r.createdAt)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
                {r.status === "delivered" && r.readingId ? (
                  <ButtonLink size="xs" variant="secondary" href={`/app/delivery?id=${r.readingId}`}>View delivery</ButtonLink>
                ) : (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      const reading = addReading({ clientId: r.clientId, chartId: r.chartId, title: r.title, kind: r.mode === "audio" ? "audio" : "video", fileName: `${r.title.replace(/[^\w]+/g, "_")}.${r.mode === "audio" ? "m4a" : "mp4"}`, sizeMB: Math.round(r.durationSec * (r.mode === "audio" ? 0.012 : 0.12)), durationSec: r.durationSec, message: "", status: "ready", allowDownload: true, notification: "pending" });
                      deliverReading(reading.id);
                      updateRecording(r.id, { status: "delivered", readingId: reading.id });
                      toast("Delivered to client portal", r.title, "success");
                    }}
                  >
                    <Send /> Deliver
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-6 border-dashed bg-canvas/40 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted" />
          <p className="text-[13.5px] font-semibold text-ink-3">Coming later</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: FileText, t: "Automatic transcription", d: "Searchable transcript saved with the reading." },
            { i: Scissors, t: "Trimming", d: "Cut the start and end before delivering." },
            { i: ListOrdered, t: "Chapters", d: "Mark sections like “Moon” or “2027 timing”." },
            { i: Captions, t: "Captions", d: "Accessible captions for video readings." },
          ].map((f) => (
            <div key={f.t} className="flex gap-3 opacity-80">
              <f.i className="mt-0.5 size-4 shrink-0 text-muted" />
              <div>
                <p className="text-[13px] font-medium text-ink-3">{f.t}</p>
                <p className="text-[12px] text-muted">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
