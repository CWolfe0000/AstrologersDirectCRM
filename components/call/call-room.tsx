"use client";

import * as React from "react";
import DailyIframe, { type DailyCall, type DailyParticipant } from "@daily-co/daily-js";
import { Circle, Loader2, Mic, MicOff, MonitorUp, PhoneOff, Square, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type JoinInfo = { url: string; token: string; audioOnly: boolean; title: string; start: string; durationMin: number; astrologer: string };
type Phase = "ready" | "joining" | "in-call" | "left" | "error";

/**
 * A live session on a built-in call (Daily). Two to four people, camera and
 * microphone toggles, screen sharing (to show a chart). The astrologer can
 * record both sides' audio in their own browser; everyone in the call sees
 * that it's being recorded.
 */
export function CallRoom({ join, role, onRecording, onLeft }: {
  join: () => Promise<JoinInfo>;
  role: "astrologer" | "client";
  /** Astrologer: a finished recording (both sides' audio). */
  onRecording?: (blob: Blob, durationSec: number, info: JoinInfo) => void;
  onLeft?: () => void;
}) {
  const call = React.useRef<DailyCall | null>(null);
  const [phase, setPhase] = React.useState<Phase>("ready");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<JoinInfo | null>(null);
  const [people, setPeople] = React.useState<DailyParticipant[]>([]);
  const [mic, setMic] = React.useState(true);
  const [cam, setCam] = React.useState(true);
  const [sharing, setSharing] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [othersRecording, setOthersRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const rec = React.useRef<{ ctx: AudioContext; dest: MediaStreamAudioDestinationNode; recorder: MediaRecorder; chunks: Blob[]; started: number; tracks: Set<string> } | null>(null);

  const refresh = React.useCallback(() => {
    const c = call.current;
    if (!c) return;
    setPeople(Object.values(c.participants()));
    // Recording: mix in any audio track not yet in the mix (someone joined, or a track changed).
    const r = rec.current;
    if (r) for (const p of Object.values(c.participants())) {
      const t = p.tracks.audio.persistentTrack;
      if (t && !r.tracks.has(t.id)) { r.tracks.add(t.id); r.ctx.createMediaStreamSource(new MediaStream([t])).connect(r.dest); }
    }
  }, []);

  React.useEffect(() => () => { void call.current?.destroy(); call.current = null; }, []);
  React.useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - (rec.current?.started ?? Date.now())) / 1000)), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const start = async () => {
    setPhase("joining");
    setError(null);
    try {
      const j = await join();
      setInfo(j);
      const c = DailyIframe.createCallObject({ subscribeToTracksAutomatically: true });
      call.current = c;
      for (const ev of ["participant-joined", "participant-updated", "participant-left", "track-started", "track-stopped"] as const) c.on(ev, refresh);
      c.on("app-message", (e) => {
        const d = e?.data as { recording?: boolean } | undefined;
        if (d && typeof d.recording === "boolean") setOthersRecording(d.recording);
      });
      c.on("participant-joined", () => { if (rec.current) c.sendAppMessage({ recording: true }, "*"); });
      c.on("left-meeting", () => setPhase("left"));
      c.on("error", (e) => { setError(e?.errorMsg ?? "The call was interrupted."); setPhase("error"); });
      await c.join({ url: j.url, token: j.token, startVideoOff: j.audioOnly });
      setCam(!j.audioOnly);
      setPhase("in-call");
      refresh();
    } catch (e) {
      setError((e as Error).message || "Couldn’t join the call.");
      setPhase("error");
    }
  };

  const startRecording = () => {
    const c = call.current;
    if (!c) return;
    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
    const recorder = new MediaRecorder(dest.stream, mime ? { mimeType: mime } : undefined);
    const r = { ctx, dest, recorder, chunks: [] as Blob[], started: Date.now(), tracks: new Set<string>() };
    recorder.ondataavailable = (e) => e.data.size && r.chunks.push(e.data);
    rec.current = r;
    refresh();
    recorder.start(1000);
    setElapsed(0);
    setRecording(true);
    c.sendAppMessage({ recording: true }, "*");
  };
  const stopRecording = () => {
    const r = rec.current;
    if (!r) return;
    rec.current = null;
    setRecording(false);
    call.current?.sendAppMessage({ recording: false }, "*");
    const secs = Math.max(1, Math.round((Date.now() - r.started) / 1000));
    r.recorder.onstop = () => {
      void r.ctx.close();
      const blob = new Blob(r.chunks, { type: r.recorder.mimeType || "audio/webm" });
      if (info) onRecording?.(blob, secs, info);
    };
    r.recorder.stop();
  };
  const leave = async () => {
    if (rec.current) stopRecording();
    await call.current?.leave();
    setPhase("left");
    onLeft?.();
  };

  if (phase === "ready" || phase === "joining" || phase === "error")
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent"><Video className="size-6" /></span>
        <h2 className="mt-4 font-serif text-[24px] text-ink">Ready to Join?</h2>
        <p className="mt-2 text-[13.5px] text-muted">Your browser will ask to use your microphone{role === "astrologer" ? " and camera" : " (and camera, if you turn it on)"}. Headphones help.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
        <Button className="mt-5" size="lg" onClick={() => void start()} disabled={phase === "joining"}>{phase === "joining" ? <Loader2 className="animate-spin" /> : <Video />} Join Call</Button>
      </div>
    );

  if (phase === "left")
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
        <h2 className="font-serif text-[24px] text-ink">You’ve Left the Call</h2>
        <Button className="mt-5" variant="secondary" onClick={() => { void call.current?.destroy(); call.current = null; setPeople([]); setPhase("ready"); }}>Rejoin</Button>
      </div>
    );

  const others = people.filter((p) => !p.local);
  const screen = people.find((p) => p.tracks.screenVideo.state === "playable");
  return (
    <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl bg-[#1d1b20] text-white">
      <div className="flex items-center gap-3 px-4 py-3 text-[13px]">
        <span className="font-medium">{info?.title}</span>
        <span className="text-white/60">with {role === "astrologer" ? others.map((p) => p.user_name).join(", ") || "your client (waiting)" : info?.astrologer}</span>
        {(recording || othersRecording) && (
          <span role="status" className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-0.5 text-[12px] font-medium">
            <Circle className="size-2.5 fill-current" /> {recording ? `Recording ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}` : "This session is being recorded"}
          </span>
        )}
      </div>
      <div className={cn("grid flex-1 gap-2 p-2", screen ? "grid-cols-[1fr_220px]" : others.length ? "sm:grid-cols-2" : "")}>
        {screen && <Tile p={screen} screen />}
        <div className={cn("grid gap-2", screen ? "content-start" : "contents")}>
          {[...others, ...people.filter((p) => p.local)].map((p) => <Tile key={p.session_id} p={p} />)}
        </div>
      </div>
      {others.length === 0 && <p className="px-4 pb-1 text-center text-[13px] text-white/60">{role === "astrologer" ? "Waiting for your client to join…" : `Waiting for ${info?.astrologer ?? "your astrologer"} to join…`}</p>}
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3">
        <CtlButton on={mic} label={mic ? "Mute" : "Unmute"} onClick={() => { call.current?.setLocalAudio(!mic); setMic(!mic); }}>{mic ? <Mic /> : <MicOff />}</CtlButton>
        <CtlButton on={cam} label={cam ? "Turn Camera Off" : "Turn Camera On"} onClick={() => { call.current?.setLocalVideo(!cam); setCam(!cam); }}>{cam ? <Video /> : <VideoOff />}</CtlButton>
        <CtlButton on={!sharing} label={sharing ? "Stop Sharing" : "Share Screen"} onClick={() => { if (sharing) call.current?.stopScreenShare(); else call.current?.startScreenShare(); setSharing(!sharing); }}><MonitorUp /></CtlButton>
        {role === "astrologer" && (
          <CtlButton on={!recording} label={recording ? "Stop Recording" : "Record Audio"} onClick={recording ? stopRecording : startRecording}>{recording ? <Square /> : <Circle />}</CtlButton>
        )}
        <button type="button" onClick={() => void leave()} className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-[14px] font-medium hover:bg-red-700"><PhoneOff className="size-4" /> Leave</button>
      </div>
    </div>
  );
}

function CtlButton({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cn("inline-flex size-11 items-center justify-center rounded-full [&_svg]:size-5", on ? "bg-white/10 hover:bg-white/20" : "bg-white text-[#1d1b20] hover:bg-white/90")}>
      {children}
    </button>
  );
}

/** One person's video (or their initials), with their audio for remote people. */
function Tile({ p, screen }: { p: DailyParticipant; screen?: boolean }) {
  const video = React.useRef<HTMLVideoElement>(null);
  const audio = React.useRef<HTMLAudioElement>(null);
  const vt = screen ? p.tracks.screenVideo : p.tracks.video;
  const vTrack = vt.state === "playable" ? vt.persistentTrack : undefined;
  const aTrack = !p.local && p.tracks.audio.state === "playable" ? p.tracks.audio.persistentTrack : undefined;
  React.useEffect(() => { if (video.current) video.current.srcObject = vTrack ? new MediaStream([vTrack]) : null; }, [vTrack]);
  React.useEffect(() => { if (audio.current) audio.current.srcObject = aTrack ? new MediaStream([aTrack]) : null; }, [aTrack]);
  const initials = (p.user_name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="relative flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl bg-black/40">
      {vTrack ? <video ref={video} autoPlay playsInline muted className={cn("size-full", screen ? "object-contain" : "object-cover", p.local && !screen && "-scale-x-100")} /> : <span className="flex size-16 items-center justify-center rounded-full bg-white/10 text-[20px] font-semibold">{initials}</span>}
      {!screen && !p.local && <audio ref={audio} autoPlay />}
      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[12px]">
        {!p.audio && !screen && <MicOff className="size-3" />} {screen ? `${p.user_name}’s Screen` : p.local ? "You" : p.user_name}
      </span>
    </div>
  );
}
