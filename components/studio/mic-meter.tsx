"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Level 0–1 → segmented meter. */
export function MicMeter({ level, className, bars = 14 }: { level: number; className?: string; bars?: number }) {
  return (
    <div className={cn("flex h-4 items-end gap-[2px]", className)} aria-label="Microphone level">
      {Array.from({ length: bars }, (_, i) => {
        const on = level * bars > i;
        return (
          <span
            key={i}
            className={cn("w-[3px] rounded-sm transition-colors duration-75", on ? (i > bars * 0.8 ? "bg-warn" : "bg-sage") : "bg-current opacity-20")}
            style={{ height: `${30 + (i / bars) * 70}%` }}
          />
        );
      })}
    </div>
  );
}

/**
 * Returns a mic level. Uses a real analyser when a stream is given,
 * otherwise a smoothed simulated "speech" signal while active.
 */
export function useMicLevel(active: boolean, stream: MediaStream | null) {
  const [level, setLevel] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    let ctx: AudioContext | null = null;
    if (stream && stream.getAudioTracks().length > 0 && typeof AudioContext !== "undefined") {
      ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        raf = requestAnimationFrame(tick);
      };
      tick();
    } else if (active) {
      let v = 0;
      let t = 0;
      const id = setInterval(() => {
        t += 1;
        const speaking = Math.sin(t / 9) + Math.sin(t / 3.7) > -0.4;
        const target = speaking ? 0.35 + Math.random() * 0.5 : Math.random() * 0.08;
        v = v * 0.55 + target * 0.45;
        setLevel(v);
      }, 80);
      return () => clearInterval(id);
    } else {
      setLevel(0);
    }
    return () => {
      cancelAnimationFrame(raf);
      ctx?.close().catch(() => {});
    };
  }, [active, stream]);
  return level;
}
