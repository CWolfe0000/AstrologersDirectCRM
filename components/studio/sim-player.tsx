"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDuration, cn } from "@/lib/utils";

/** Simulated playback with a working scrubber (no media file exists). */
export function SimPlayer({ duration, children, audio }: { duration: number; children?: React.ReactNode; audio?: boolean }) {
  const [t, setT] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => {
      if (x + 0.25 >= duration) { setPlaying(false); return duration; }
      return x + 0.25;
    }), 250);
    return () => clearInterval(id);
  }, [playing, duration]);
  const bars = React.useMemo(() => Array.from({ length: 90 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.31)) * 0.75), []);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink">
      <div className="relative flex aspect-video items-center justify-center">
        {audio ? (
          <div className="flex h-24 w-4/5 items-center gap-[3px]">
            {bars.map((b, i) => (
              <span key={i} className={cn("flex-1 rounded-full", i / bars.length <= t / duration ? "bg-[#D9B9C2]" : "bg-white/20")} style={{ height: `${b * 100}%` }} />
            ))}
          </div>
        ) : (
          children
        )}
        {!playing && (
          <button onClick={() => { if (t >= duration) setT(0); setPlaying(true); }} className="absolute flex size-16 items-center justify-center rounded-full bg-white/90 text-ink shadow-pop hover:bg-white" aria-label="Play">
            <Play className="ml-1 size-7" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 bg-ink-2 px-4 py-3 text-white">
        <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause /> : <Play />}
        </Button>
        <span className="w-12 text-[12px] tabular-nums text-white/80">{fmtDuration(t)}</span>
        <input type="range" min={0} max={duration} step={0.25} value={t} onChange={(e) => setT(+e.target.value)} className="flex-1 accent-[#D9B9C2]" aria-label="Seek" />
        <span className="w-12 text-right text-[12px] tabular-nums text-white/60">{fmtDuration(duration)}</span>
        <Volume2 className="hidden size-4 text-white/60 sm:block" />
        <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10" onClick={() => { setT(0); setPlaying(false); }} aria-label="Restart"><RotateCcw /></Button>
      </div>
    </div>
  );
}
