"use client";

import * as React from "react";
import Link from "next/link";
import { Globe2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/input";
import { Wordmark } from "@/components/ui/misc";

export const dayKey = (iso: string, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
export const timeLabel = (iso: string, tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const dayLabel = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
export const longWhen = (iso: string, tz: string) =>
  `${new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso))} at ${new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso))}`;

export function browserZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Header and footer for the public booking pages. */
export function BookingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <span className="text-[13px] text-muted">Online booking</span>
          <Link href="/" className="opacity-80 hover:opacity-100" aria-label="AstrologersDirect"><Wordmark compact /></Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-4 py-8 md:py-12">{children}</main>
      <footer className="mx-auto max-w-4xl px-4 pb-10 text-center text-[12px] text-muted">
        Booking by AstrologersDirect · <Link href="/legal/privacy" className="underline">Privacy</Link>
      </footer>
    </div>
  );
}

/** Days, then times, in a time zone the visitor can change. */
export function TimePicker({ slots, tz, onTz, onPick, empty }: { slots: string[] | null; tz: string; onTz: (tz: string) => void; onPick: (iso: string) => void; empty: React.ReactNode }) {
  const [day, setDay] = React.useState<string | null>(null);
  const byDay = React.useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots ?? []) {
      const k = dayKey(s, tz);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots, tz]);
  React.useEffect(() => {
    if (!day || !byDay.has(day)) setDay([...byDay.keys()][0] ?? null);
  }, [byDay, day]);
  const zones = React.useMemo(() => {
    try {
      return Array.from(new Set([tz, ...(Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone")]));
    } catch {
      return [tz];
    }
  }, [tz]);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
        <Globe2 className="size-4" />
        <label htmlFor="bk-tz">Times shown in</label>
        <Select id="bk-tz" value={tz} onChange={(e) => onTz(e.target.value)} className="h-8 w-auto max-w-[240px] text-[12.5px]">
          {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
        </Select>
      </div>
      {!slots ? (
        <div className="mt-6 flex items-center gap-2 text-[13px] text-muted"><Loader2 className="size-4 animate-spin" /> Finding open times…</div>
      ) : byDay.size === 0 ? (
        <div className="mt-6">{empty}</div>
      ) : (
        <>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Days">
            {[...byDay.keys()].map((k) => (
              <button key={k} type="button" aria-pressed={day === k} onClick={() => setDay(k)} className={cn("shrink-0 rounded-xl border px-3 py-2 text-[13px]", day === k ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-line-strong")}>
                {dayLabel(k)}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Times">
            {(day ? byDay.get(day) ?? [] : []).map((s) => (
              <button key={s} type="button" onClick={() => onPick(s)} className="rounded-lg border border-line bg-surface px-2 py-2.5 text-[14px] font-medium text-ink hover:border-accent hover:text-accent">
                {timeLabel(s, tz)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
