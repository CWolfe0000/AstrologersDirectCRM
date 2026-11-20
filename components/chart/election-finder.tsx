"use client";

import * as React from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { ELECTION_CHECKS, ELECTION_EVENTS, type ElectionCheck, type ElectionEvent, type ElectionResult } from "@/lib/astro/elect";
import type { BirthData, ChartSettings } from "@/lib/astro/types";
import type { ElectionData } from "@/lib/data/types";
import { cn, DATA_MODE, daysFromToday, fmtDate, fmtClock } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/input";
import { PlaceLookup, type PlaceValue } from "@/components/clients/place-lookup";

type Window = { start: string; end: string; best: string; percent: number; eclipseNear: string | null; results: ElectionResult[] };

const weekday = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

/** Electional search: what it's for, when it could happen, where; then the best windows to choose from. */
export function ElectionFinder({
  clientFirst,
  natal,
  settings,
  onPick,
  purpose,
  onPurpose,
  initial,
}: {
  clientFirst: string;
  natal?: BirthData;
  settings: ChartSettings;
  onPick: (e: ElectionData | null) => void;
  purpose: string;
  onPurpose: (s: string) => void;
  /** Prefill from a link (e.g. a forecast window): event type and date range. */
  initial?: { event?: string | null; from?: string | null; to?: string | null };
}) {
  const initEvent = ELECTION_EVENTS.find((e) => e.id === initial?.event) ?? ELECTION_EVENTS[0]!;
  const okDate = (d?: string | null) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
  const [event, setEvent] = React.useState<ElectionEvent>(initEvent.id);
  const [checks, setChecks] = React.useState<ElectionCheck[]>(initEvent.checks);
  const [from, setFrom] = React.useState(okDate(initial?.from) ?? daysFromToday(1));
  const [to, setTo] = React.useState(okDate(initial?.to) ?? daysFromToday(30));
  const [dailyFrom, setDailyFrom] = React.useState("09:00");
  const [dailyTo, setDailyTo] = React.useState("18:00");
  const [step, setStep] = React.useState(15);
  const [place, setPlace] = React.useState<PlaceValue | null>(null);
  const [useNatal, setUseNatal] = React.useState(!!natal);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [windows, setWindows] = React.useState<Window[] | null>(null);
  const [picked, setPicked] = React.useState<string | null>(null);

  const chooseEvent = (e: ElectionEvent) => {
    setEvent(e);
    setChecks(ELECTION_EVENTS.find((x) => x.id === e)!.checks);
    setWindows(null);
    setPicked(null);
    onPick(null);
  };
  const rules = (Object.keys(ELECTION_CHECKS) as ElectionCheck[]).filter((id) => !ELECTION_CHECKS[id].natal);
  const allChecks: ElectionCheck[] = [...checks.filter((c) => !ELECTION_CHECKS[c].natal), ...(useNatal && natal ? (["natal-support", "natal-stress"] as ElectionCheck[]) : [])];

  const search = async () => {
    if (!place) return;
    setBusy(true);
    setError(null);
    setPicked(null);
    onPick(null);
    try {
      const r = await api<{ windows: Window[] }>("/api/v1/astro/elect", {
        body: { from, to, dailyFrom, dailyTo, stepMin: step, place: { lat: place.lat, lon: place.lon, tz: place.tz }, settings, checks: allChecks, natal: useNatal ? natal : undefined },
      });
      setWindows(r.windows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pick = (w: Window) => {
    if (!place) return;
    setPicked(w.best);
    onPick({ purpose: purpose.trim(), event, at: w.best, place: place.place, lat: place.lat, lon: place.lon, tz: place.tz, checks: allChecks, useNatal: useNatal && !!natal, ...(w.eclipseNear ? { eclipseNear: w.eclipseNear } : {}) });
  };

  if (DATA_MODE === "demo")
    return <p className="rounded-lg border border-line bg-canvas px-4 py-5 text-[13px] text-muted sm:col-span-2">Electional search runs on Swiss Ephemeris in the live app. It isn’t available in this demo.</p>;

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event">
          <Select value={event} onChange={(e) => chooseEvent(e.target.value as ElectionEvent)}>
            {ELECTION_EVENTS.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="What It’s For" optional>
          <Input value={purpose} maxLength={300} onChange={(e) => onPurpose(e.target.value)} placeholder="e.g. Opening the new studio" />
        </Field>
        <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2">
          <Field label="Earliest Time"><Input type="time" value={dailyFrom} onChange={(e) => setDailyFrom(e.target.value)} /></Field>
          <Field label="Latest Time"><Input type="time" value={dailyTo} onChange={(e) => setDailyTo(e.target.value)} /></Field>
          <Field label="Check Every">
            <Select value={step} onChange={(e) => setStep(+e.target.value)}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>Hour</option>
            </Select>
          </Field>
        </div>
        <Field label="Where It Will Happen" className="sm:col-span-2">
          <PlaceLookup value={place} onChange={setPlace} id="election-place" />
        </Field>
      </div>

      <fieldset className="rounded-lg border border-line p-3">
        <legend className="px-1 text-[13px] font-medium text-ink">Rules</legend>
        <p className="mb-2 text-[12px] text-muted">Preset for {ELECTION_EVENTS.find((e) => e.id === event)!.name.toLowerCase()}: {ELECTION_EVENTS.find((e) => e.id === event)!.hint.toLowerCase()} A void-of-course Moon always rules a moment out.</p>
        <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {rules.map((id) => (
            <Checkbox
              key={id}
              label={<span className="text-[12.5px]">{ELECTION_CHECKS[id].label}</span>}
              checked={checks.includes(id)}
              disabled={ELECTION_CHECKS[id].required}
              onChange={(e) => setChecks((c) => (e.target.checked ? [...c, id] : c.filter((x) => x !== id)))}
            />
          ))}
          {natal && (
            <Checkbox label={<span className="text-[12.5px]">Contacts to {clientFirst}’s natal chart</span>} checked={useNatal} onChange={(e) => setUseNatal(e.target.checked)} />
          )}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={search} disabled={!place || busy || from > to}>
          {busy ? <Loader2 className="animate-spin" /> : <Search />} Find Times
        </Button>
        {!place && <span className="text-[12.5px] text-muted">Add where it will happen first.</span>}
        {error && <span role="alert" className="text-[12.5px] text-danger">{error}</span>}
      </div>

      {windows && (
        windows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-5 text-center text-[13px] text-muted">No moments pass in this range (the Moon is void of course throughout, or the window is very short). Try a wider range or longer days.</p>
        ) : (
          <ol className="space-y-2" aria-label="Best times">
            {windows.map((w, i) => {
              const on = picked === w.best;
              const passes = w.results.filter((r) => r.ok && !r.required);
              const fails = w.results.filter((r) => !r.ok);
              return (
                <li key={w.start}>
                  <button
                    type="button"
                    onClick={() => pick(w)}
                    aria-pressed={on}
                    className={cn("w-full rounded-lg border p-3 text-left transition-colors", on ? "border-accent bg-accent-50/60 ring-1 ring-accent/30" : "border-line hover:border-line-strong")}
                  >
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[13.5px] font-medium text-ink">
                        {i + 1}. {weekday(w.best.slice(0, 10))} {fmtDate(w.best.slice(0, 10))}, {fmtClock(w.start.slice(11, 16))}
                        {w.end !== w.start && `–${fmtClock(w.end.slice(11, 16))}`}
                      </span>
                      <span className="flex items-center gap-2 text-[12px] text-muted">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas-2"><span className="block h-full rounded-full bg-sage-dark" style={{ width: `${w.percent}%` }} /></span>
                        {w.percent}
                      </span>
                    </span>
                    {w.end !== w.start && <span className="mt-0.5 block text-[12px] text-muted">Best at {fmtClock(w.best.slice(11, 16))}</span>}
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {passes.map((r) => (
                        <span key={r.id} className="inline-flex items-center gap-1 rounded-md bg-sage-50 px-1.5 py-0.5 text-[11.5px] text-sage-dark"><Check className="size-3" aria-hidden />{r.label}</span>
                      ))}
                      {fails.map((r) => (
                        <span key={r.id} className="inline-flex items-center gap-1 rounded-md bg-warn-50 px-1.5 py-0.5 text-[11.5px] text-warn" title={r.detail}><X className="size-3" aria-hidden />{r.label}</span>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )
      )}
    </div>
  );
}
