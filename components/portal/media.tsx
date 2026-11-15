"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Captions } from "lucide-react";
import { cn, fmtDuration } from "@/lib/utils";

/** Simulated playback clock — the prototype has no real media files. */
function usePlayback(duration: number) {
  const [t, setT] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((x) => {
        const n = x + 0.25 * speed;
        if (n >= duration) {
          setPlaying(false);
          return duration;
        }
        return n;
      });
    }, 250);
    return () => clearInterval(id);
  }, [playing, speed, duration]);
  const seek = (v: number) => setT(Math.max(0, Math.min(duration, v)));
  return { t, playing, setPlaying, speed, setSpeed, seek };
}

function Scrubber({ t, duration, onSeek, dark }: { t: number; duration: number; onSeek: (v: number) => void; dark?: boolean }) {
  const pct = duration ? (t / duration) * 100 : 0;
  return (
    <div className="group relative flex h-5 items-center">
      <div className={cn("h-1.5 w-full rounded-full", dark ? "bg-white/25" : "bg-canvas-3")}>
        <div className={cn("h-full rounded-full", dark ? "bg-white" : "bg-accent")} style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        step={1}
        value={t}
        onChange={(e) => onSeek(+e.target.value)}
        aria-label="Seek"
        className="absolute inset-0 w-full cursor-pointer opacity-0"
      />
      <span className={cn("pointer-events-none absolute size-3.5 -translate-x-1/2 rounded-full shadow", dark ? "bg-white" : "bg-accent")} style={{ left: `${pct}%` }} />
    </div>
  );
}

const SPEEDS = [1, 1.25, 1.5];

export function AudioPlayer({ duration, title }: { duration: number; title: string }) {
  const p = usePlayback(duration);
  // decorative waveform bars, deterministic
  const bars = React.useMemo(() => Array.from({ length: 64 }, (_, i) => Math.round((0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37)) * 0.75) * 100)), []);
  const progress = p.t / duration;
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex h-20 items-end gap-[3px]" aria-hidden>
        {bars.map((h, i) => (
          <span key={i} className={cn("flex-1 rounded-full transition-colors", i / bars.length <= progress ? "bg-accent" : "bg-canvas-3")} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-5">
        <Scrubber t={p.t} duration={duration} onSeek={p.seek} />
        <div className="mt-1.5 flex justify-between text-[12px] tabular-nums text-muted">
          <span>{fmtDuration(p.t)}</span>
          <span>-{fmtDuration(duration - p.t)}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={() => p.setSpeed(SPEEDS[(SPEEDS.indexOf(p.speed) + 1) % SPEEDS.length]!)}
          className="h-10 w-16 rounded-lg border border-line text-[13px] font-semibold tabular-nums text-ink-3 hover:bg-canvas-2"
          aria-label={`Playback speed ${p.speed}×`}
        >
          {p.speed}×
        </button>
        <div className="flex items-center gap-3 sm:gap-5">
          <button onClick={() => p.seek(p.t - 15)} className="relative flex size-12 items-center justify-center rounded-full text-ink-3 hover:bg-canvas-2" aria-label="Back 15 seconds">
            <RotateCcw className="size-6" />
            <span className="absolute text-[8.5px] font-bold">15</span>
          </button>
          <button
            onClick={() => p.setPlaying(!p.playing)}
            className="flex size-16 items-center justify-center rounded-full bg-accent text-white shadow-pop transition-colors hover:bg-accent-hover"
            aria-label={p.playing ? "Pause" : `Play ${title}`}
          >
            {p.playing ? <Pause className="size-7" fill="currentColor" /> : <Play className="ml-1 size-7" fill="currentColor" />}
          </button>
          <button onClick={() => p.seek(p.t + 15)} className="relative flex size-12 items-center justify-center rounded-full text-ink-3 hover:bg-canvas-2" aria-label="Forward 15 seconds">
            <RotateCw className="size-6" />
            <span className="absolute text-[8.5px] font-bold">15</span>
          </button>
        </div>
        <span className="w-16" />
      </div>
    </div>
  );
}

export function VideoPlayer({ duration, title, poster }: { duration: number; title: string; poster?: string }) {
  const p = usePlayback(duration);
  const [muted, setMuted] = React.useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink shadow-frame">
      <div className="relative aspect-video w-full bg-gradient-to-br from-[#3A373D] via-ink to-[#1F1D21]">
        {/* simulated frame: chart walkthrough */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex aspect-square h-[70%] items-center justify-center rounded-full border border-white/15">
            <div className="absolute inset-[12%] rounded-full border border-white/10" />
            <div className="absolute inset-[30%] rounded-full border border-white/10" />
            <div className="absolute h-px w-full bg-white/15" />
            <div className="absolute h-full w-px rotate-[72deg] bg-white/10" />
          </div>
          <div className="absolute bottom-[18%] right-[5%] hidden aspect-[4/3] w-[18%] rounded-lg border border-white/15 bg-[#4A3A40] sm:block">
            <span className="absolute inset-0 flex items-center justify-center font-serif text-[clamp(14px,2.5vw,28px)] text-[#EBD7DC]">CM</span>
          </div>
        </div>
        <div className="absolute left-4 top-4 rounded-md bg-black/40 px-2 py-1 text-[11.5px] text-white/85 backdrop-blur">{poster ?? title}</div>
        {!p.playing && (
          <button onClick={() => p.setPlaying(true)} className="absolute inset-0 flex items-center justify-center" aria-label={`Play ${title}`}>
            <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-accent shadow-pop transition-transform hover:scale-105 sm:size-20">
              <Play className="ml-1 size-8" fill="currentColor" />
            </span>
          </button>
        )}
        {p.playing && <button onClick={() => p.setPlaying(false)} className="absolute inset-0" aria-label="Pause" />}
      </div>
      <div className="space-y-2 px-4 pb-3 pt-2.5">
        <Scrubber t={p.t} duration={duration} onSeek={p.seek} dark />
        <div className="flex items-center gap-1 text-white">
          <button onClick={() => p.setPlaying(!p.playing)} className="rounded-md p-2 hover:bg-white/10" aria-label={p.playing ? "Pause" : "Play"}>
            {p.playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5" fill="currentColor" />}
          </button>
          <button onClick={() => p.seek(p.t - 15)} className="rounded-md p-2 hover:bg-white/10" aria-label="Back 15 seconds"><RotateCcw className="size-[18px]" /></button>
          <button onClick={() => p.seek(p.t + 15)} className="rounded-md p-2 hover:bg-white/10" aria-label="Forward 15 seconds"><RotateCw className="size-[18px]" /></button>
          <button onClick={() => setMuted(!muted)} className="rounded-md p-2 hover:bg-white/10" aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="size-[18px]" /> : <Volume2 className="size-[18px]" />}
          </button>
          <span className="ml-1 text-[12px] tabular-nums text-white/75">{fmtDuration(p.t)} / {fmtDuration(duration)}</span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => p.setSpeed(SPEEDS[(SPEEDS.indexOf(p.speed) + 1) % SPEEDS.length]!)} className="rounded-md px-2 py-1.5 text-[12px] font-semibold tabular-nums hover:bg-white/10" aria-label={`Playback speed ${p.speed}×`}>
              {p.speed}×
            </button>
            <button className="hidden rounded-md p-2 text-white/50 sm:block" aria-label="Captions (coming soon)" title="Captions — planned feature" disabled><Captions className="size-[18px]" /></button>
            <button className="rounded-md p-2 hover:bg-white/10" aria-label="Full screen"><Maximize2 className="size-[18px]" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SECTIONS = ["Introduction", "Temperament & Sun", "The Moon & Home", "Relationships", "Vocation", "Timing ahead", "Closing notes"];

export function DocumentViewer({ pages, title, author }: { pages: number; title: string; author: string }) {
  const [page, setPage] = React.useState(1);
  const [zoom, setZoom] = React.useState(1);
  const lines = (seed: number, n: number) => Array.from({ length: n }, (_, i) => 62 + ((seed * 7 + i * 13) % 37));
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-canvas-2">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md p-2 text-ink-3 hover:bg-canvas-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="size-4" /></button>
        <span className="text-[12.5px] tabular-nums text-ink-3">Page {page} of {pages}</span>
        <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="rounded-md p-2 text-ink-3 hover:bg-canvas-2 disabled:opacity-40" aria-label="Next page"><ChevronRight className="size-4" /></button>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(1)))} className="rounded-md p-2 text-ink-3 hover:bg-canvas-2" aria-label="Zoom out"><ZoomOut className="size-4" /></button>
          <span className="w-11 text-center text-[12px] tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(1)))} className="rounded-md p-2 text-ink-3 hover:bg-canvas-2" aria-label="Zoom in"><ZoomIn className="size-4" /></button>
        </div>
      </div>
      <div className="flex">
        <div className="scrollbar-thin hidden max-h-[640px] w-28 shrink-0 space-y-3 overflow-y-auto border-r border-line p-3 md:block">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className="block w-full" aria-label={`Page ${i + 1}`}>
              <div className={cn("aspect-[8.5/11] rounded border bg-white p-1.5", page === i + 1 ? "border-accent ring-2 ring-accent/20" : "border-line")}>
                {lines(i, 9).map((w, j) => <div key={j} className="mb-1 h-[2px] rounded bg-canvas-3" style={{ width: `${w}%` }} />)}
              </div>
              <span className="mt-1 block text-center text-[10.5px] text-muted">{i + 1}</span>
            </button>
          ))}
        </div>
        <div className="scrollbar-thin max-h-[640px] flex-1 overflow-auto p-4 sm:p-8">
          <div className="mx-auto origin-top bg-white shadow-frame transition-transform" style={{ width: `${Math.round(560 * zoom)}px`, maxWidth: zoom <= 1 ? "100%" : undefined }}>
            <div className="aspect-[8.5/11] px-[9%] py-[10%]">
              {page === 1 ? (
                <div className="flex h-full min-h-[inherit] flex-col">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Morrow Astrological Consulting</p>
                  <h2 className="mt-[20%] font-serif text-[clamp(20px,5vw,32px)] leading-tight text-ink">{title}</h2>
                  <p className="mt-3 text-[12px] text-muted">Prepared by {author}</p>
                  <div className="mt-6 h-px w-16 bg-accent" />
                  <div className="mt-auto space-y-1.5">{lines(1, 4).map((w, j) => <div key={j} className="h-[5px] rounded bg-canvas-3" style={{ width: `${w}%` }} />)}</div>
                </div>
              ) : (
                <div>
                  <p className="font-serif text-[clamp(15px,3vw,20px)] text-ink">{SECTIONS[(page - 2) % SECTIONS.length]}</p>
                  <div className="mt-4 space-y-2">
                    {lines(page, 22).map((w, j) => (
                      <div key={j} className={cn("h-[6px] rounded bg-canvas-3/80", j % 8 === 7 && "mb-4")} style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <p className="mt-6 text-right text-[10px] text-muted">{page}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
