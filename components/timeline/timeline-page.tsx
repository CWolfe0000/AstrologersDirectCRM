"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, CircleDot, Info, Layers, Loader2, NotebookPen, RotateCcw, Save, SlidersHorizontal, Waves } from "lucide-react";
import { ASPECTS, BODIES, DEFAULT_TIMELINE, fmtDeg, ordinal, signOf, type BodyId, type TimelineDefaults } from "@/lib/astro";
import { fetchTimeline, type TimelineResponse } from "@/lib/astro/timeline-client";
import type { ConvergenceWindow, TargetId, TimelineContact, TimelineTechnique } from "@/lib/astro/timeline";
import { sameTimeline, TimelineOptionsEditor } from "./timeline-options";
import type { ChartRecord } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, TODAY } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet } from "@/components/ui/dialog";
import { EngineNotice } from "@/components/chart/chart-helpers";
import { useHydrated } from "@/components/workspace/use-hydrated";
import { PremiumGate, usePremium } from "@/components/plan/premium";

// ---------------------------------------------------------------------------
// Labels and colors

const TECH: Record<TimelineTechnique, { label: string; short: string; color: string; soft: string; chart: ChartRecord["type"] }> = {
  transit: { label: "Transit", short: "Tr", color: "#824B59", soft: "#F3E6E9", chart: "transits" },
  progressed: { label: "Progression", short: "Pr", color: "#4D5A70", soft: "#E6EAF1", chart: "progressions" },
  "solar-arc": { label: "Solar Arc", short: "SA", color: "#6E4F6E", soft: "#EFE6EF", chart: "solar-arc" },
  lunation: { label: "Lunation", short: "Lu", color: "#9A6A1F", soft: "#F6EDDC", chart: "transits" },
  eclipse: { label: "Eclipse", short: "Ec", color: "#29272B", soft: "#E9E6E4", chart: "transits" },
};

const pointName = (id: TargetId) => BODIES[id].name;
const pointGlyph = (id: TargetId) => BODIES[id].glyph;

function sourceName(c: TimelineContact) {
  if (c.technique === "lunation") return c.source === "new-moon" ? "New moon" : "Full moon";
  if (c.technique === "eclipse") return c.source === "new-moon" ? "Solar eclipse" : "Lunar eclipse";
  const n = BODIES[c.source as BodyId].name;
  if (c.technique === "progressed") return `Progressed ${n}`;
  if (c.technique === "solar-arc") return `Solar arc ${n}`;
  return n;
}
function sourceGlyph(c: TimelineContact) {
  if (c.technique === "lunation" || c.technique === "eclipse") return c.source === "new-moon" ? "●" : "○";
  return BODIES[c.source as BodyId].glyph;
}
/** Source, aspect and target glyphs, in the symbol font used by the chart tables. */
function Glyphs({ c, size = 15 }: { c: TimelineContact; size?: number }) {
  const g = (text: string, color?: string) =>
    text.length === 2 ? (
      <span className="font-semibold" style={{ fontSize: size * 0.68, color }}>{text}</span>
    ) : (
      <span className="glyph" style={{ fontSize: size, color }}>{text}</span>
    );
  return (
    <span className="inline-flex items-baseline gap-[0.3em] leading-none" aria-hidden>
      {g(sourceGlyph(c), TECH[c.technique].color)}
      {g(ASPECTS[c.aspect].glyph)}
      {g(pointGlyph(c.target))}
    </span>
  );
}

export function contactLabel(c: TimelineContact) {
  return `${sourceName(c)} ${ASPECTS[c.aspect].name.toLowerCase()} natal ${pointName(c.target)}`;
}

const DAY = 86_400_000;
const fmt = (iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
const fmtShort = (iso: string) => fmt(iso, { month: "short", day: "numeric" });
const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + " UTC";
function fmtRange(a: string, b: string) {
  const sameYear = a.slice(0, 4) === b.slice(0, 4);
  return `${sameYear ? fmtShort(a) : fmt(a)} – ${fmt(b)}`;
}
function addMonths(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Options

type RangePreset = "3" | "6" | "12" | "24" | "custom";
type GroupBy = "point" | "house" | "technique" | "date";
const resultCache = new Map<string, Promise<TimelineResponse>>();

// ---------------------------------------------------------------------------

export function TimelinePage() {
  return (
    <React.Suspense>
      <Timeline />
    </React.Suspense>
  );
}

function Timeline() {
  const hydrated = useHydrated();
  const premium = usePremium();
  const router = useRouter();
  const params = useSearchParams();
  const clients = useStore((s) => s.clients);
  const people = useStore((s) => s.people);
  const defaults = useStore((s) => s.defaults);

  const sortedClients = React.useMemo(
    () => clients.map((c) => ({ c, p: people.find((p) => p.id === c.id) })).filter((x) => x.p?.birth).sort((a, b) => personName(a.p).localeCompare(personName(b.p))),
    [clients, people],
  );
  const clientId = params.get("client") ?? sortedClients[0]?.c.id ?? "";
  const person = people.find((p) => p.id === clientId);

  const [start, setStart] = React.useState(TODAY.slice(0, 8) + "01");
  const [preset, setPreset] = React.useState<RangePreset>("12");
  const [customEnd, setCustomEnd] = React.useState(addMonths(TODAY.slice(0, 8) + "01", 12));
  const end = preset === "custom" ? customEnd : addMonths(start, Number(preset));
  const updateDefaults = useStore((s) => s.updateDefaults);
  const toast = useStore((s) => s.toast);
  const savedOpts = defaults.timeline ?? DEFAULT_TIMELINE;
  const [opts, setOpts] = React.useState<TimelineDefaults>(savedOpts);
  // Pick up the saved defaults once the store has loaded (and if they change elsewhere).
  React.useEffect(() => setOpts(savedOpts), [savedOpts]);
  const [groupBy, setGroupBy] = React.useState<GroupBy>("point");
  const [focus, setFocus] = React.useState<ConvergenceWindow | null>(null);
  const [detail, setDetail] = React.useState<TimelineContact | null>(null);
  const [state, setState] = React.useState<{ data: TimelineResponse | null; loading: boolean; error: string | null }>({ data: null, loading: false, error: null });

  const rangeError = end < start ? "The end date is before the start date." : (Date.parse(end) - Date.parse(start)) / DAY > 3 * 366 ? "Choose a range of up to three years." : null;
  const key = person?.birth && !rangeError ? JSON.stringify([person.birth, { ...defaults, timeline: undefined }, start, end, opts]) : null;

  React.useEffect(() => {
    if (!hydrated || !premium || !key || !person?.birth) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    const t = setTimeout(() => {
      let p = resultCache.get(key);
      if (!p) {
        p = fetchTimeline(person.birth!, { ...defaults, timeline: undefined }, start, end, opts);
        resultCache.set(key, p);
        if (resultCache.size > 20) resultCache.delete(resultCache.keys().next().value!);
      }
      p.then(
        (data) => !cancelled && setState({ data, loading: false, error: null }),
        (e: Error) => {
          resultCache.delete(key);
          if (!cancelled) setState((s) => ({ ...s, loading: false, error: e.message || "The timeline couldn’t be calculated." }));
        },
      );
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated]);

  React.useEffect(() => setFocus(null), [key]);

  // The previous result stays on screen while a new one calculates.
  const shown = state.data?.timeline;

  if (hydrated && !premium) {
    return (
      <div>
        <PageHeader title="Convergence Timeline" description="Transits, progressions, solar arcs and lunations to the natal chart over a period, and the stretches where they pile up." />
        <PremiumGate feature="The convergence timeline" />
      </div>
    );
  }

  if (hydrated && sortedClients.length === 0) {
    return (
      <div>
        <PageHeader title="Convergence Timeline" />
        <Card>
          <EmptyState icon={<Waves />} title="No Clients with Birth Data Yet" body="Add a client with a birth date, time and place to see their timeline." action={<Link href="/app/clients" className="text-accent hover:underline">Go to clients</Link>} />
        </Card>
      </div>
    );
  }

  const setTech = (k: "transits" | "progressions" | "solarArcs" | "lunations", v: boolean) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div>
      <PageHeader
        title="Convergence Timeline"
        description="Transits, progressions, solar arcs and lunations to the natal chart over a period, and the stretches where they pile up."
        actions={<EngineNotice />}
      />

      {/* Controls */}
      <Card className="mb-5">
        <CardBody className="grid gap-4 lg:grid-cols-[minmax(200px,260px)_1fr_auto] lg:items-end">
          <Field label="Client">
            <Select value={clientId} onChange={(e) => router.replace(`/app/timeline?client=${e.target.value}`)}>
              {sortedClients.map(({ c, p }) => (
                <option key={c.id} value={c.id}>
                  {personName(p)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="From">
              <Input type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} className="w-[150px]" />
            </Field>
            <div>
              <p className="mb-1.5 text-[12.5px] font-medium text-ink" id="tl-range">Period</p>
              <Segmented
                value={preset}
                onChange={(v) => {
                  setPreset(v);
                  if (v === "custom") setCustomEnd(end);
                }}
                options={[
                  { value: "3", label: "3 mo" },
                  { value: "6", label: "6 mo" },
                  { value: "12", label: "12 mo" },
                  { value: "24", label: "24 mo" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </div>
            {preset === "custom" && (
              <Field label="To">
                <Input type="date" value={customEnd} onChange={(e) => e.target.value && setCustomEnd(e.target.value)} className="w-[150px]" />
              </Field>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OptionsPopover
              opts={opts}
              setOpts={setOpts}
              saved={sameTimeline(opts, savedOpts)}
              onRevert={() => setOpts(savedOpts)}
              onSave={() => {
                updateDefaults({ timeline: opts });
                toast("Timeline Defaults Saved", "Used for every client’s timeline. Change them any time in Settings → Astrology.", "success");
              }}
            />
          </div>
          <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:col-span-3">
            <legend className="sr-only">Techniques</legend>
            <TechToggle label="Transits" color={TECH.transit.color} checked={opts.transits} onChange={(v) => setTech("transits", v)} />
            <TechToggle label="Progressions" color={TECH.progressed.color} checked={opts.progressions} onChange={(v) => setTech("progressions", v)} />
            <TechToggle label="Solar Arcs" color={TECH["solar-arc"].color} checked={opts.solarArcs} onChange={(v) => setTech("solarArcs", v)} />
            <TechToggle label="Lunations & Eclipses" color={TECH.lunation.color} checked={opts.lunations} onChange={(v) => setTech("lunations", v)} />
            <span className="text-[12px] text-muted">
              {fmtRange(start, end)} · {defaults.zodiac === "tropical" ? "Tropical" : "Sidereal"}
            </span>
          </fieldset>
        </CardBody>
      </Card>

      {rangeError && <p className="mb-4 rounded-lg border border-danger/30 bg-danger-50 px-3 py-2 text-[13px] text-danger" role="alert">{rangeError}</p>}
      {state.error && <p className="mb-4 rounded-lg border border-danger/30 bg-danger-50 px-3 py-2 text-[13px] text-danger" role="alert">{state.error}</p>}

      {!shown ? (
        <div className="space-y-4">
          <div className="flex h-[140px] items-center justify-center rounded-xl border border-line bg-surface text-[13px] text-muted">
            <Loader2 className="mr-2 size-4 animate-spin" /> Calculating the timeline…
          </div>
          <div className="h-[420px] animate-pulse rounded-xl bg-canvas-2" />
        </div>
      ) : (
        <div className={cn("space-y-5 transition-opacity", state.loading && "opacity-60")} aria-busy={state.loading}>
          {shown.notes.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-line bg-canvas-2 px-3 py-2 text-[12.5px] text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <div>{shown.notes.map((n) => <p key={n}>{n}</p>)}</div>
            </div>
          )}
          <DensityStrip tl={shown} focus={focus} onFocus={setFocus} />
          <Convergences tl={shown} focus={focus} onFocus={setFocus} onOpen={setDetail} />
          <ContactGrid tl={shown} groupBy={groupBy} setGroupBy={setGroupBy} focus={focus} onFocus={setFocus} onOpen={setDetail} />
          <p className="text-[12px] leading-relaxed text-muted">
            The density score adds up the contacts in orb each day, giving more weight to slow planets, hard aspects and the Sun, Moon, angles and chart ruler, and more to a contact the closer it is to exact. It is a counting aid, not an interpretation, and the weights are provisional.
            Times are in UTC. Progressions use one day per year of life; solar arcs use the true solar arc. Lunations and eclipses are checked by conjunction, opposition and square.
          </p>
        </div>
      )}

      {detail && person && shown && <ContactSheet contact={detail} clientId={clientId} personId={person.id} clientName={personName(person)} tl={shown} onClose={() => setDetail(null)} />}
    </div>
  );
}

function TechToggle({ label, color, checked, onChange }: { label: string; color: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink">
      <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="inline-block size-2.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </label>
  );
}

function OptionsPopover({ opts, setOpts, saved, onSave, onRevert }: { opts: TimelineDefaults; setOpts: (v: TimelineDefaults) => void; saved: boolean; onSave: () => void; onRevert: () => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm">
          <SlidersHorizontal /> Bodies, Aspects & Orbs
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-[min(80vh,640px)] w-[min(92vw,460px)] overflow-y-auto p-4">
        <TimelineOptionsEditor value={opts} onChange={setOpts} compact />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-[11.5px] text-muted">{saved ? "These are your saved defaults." : "Changed for this view only."}</span>
          <span className="flex gap-2">
            {!saved && (
              <Button size="sm" variant="ghost" onClick={onRevert}>
                <RotateCcw /> Use My Defaults
              </Button>
            )}
            <Button size="sm" variant="secondary" disabled={saved} onClick={onSave}>
              <Save /> Save as My Defaults
            </Button>
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Density strip

function useAxis(from: string, to: string) {
  return React.useMemo(() => {
    const a = Date.parse(from), b = Date.parse(to);
    const pct = (iso: string | number) => ((typeof iso === "number" ? iso : Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso)) - a) / (b - a) * 100;
    const months: { label: string; pct: number; year: boolean; major: boolean }[] = [];
    const d = new Date(a);
    d.setUTCDate(1);
    if (d.getTime() < a) d.setUTCMonth(d.getUTCMonth() + 1);
    const spanMonths = (b - a) / DAY / 30.4;
    while (d.getTime() <= b) {
      const m = d.getUTCMonth();
      const show = spanMonths <= 14 || m % 3 === 0;
      if (show) months.push({ label: m === 0 || months.length === 0 ? d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) : d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), pct: pct(d.getTime()), year: m === 0, major: m % 3 === 0 });
      d.setUTCMonth(m + 1);
    }
    const today = TODAY >= from.slice(0, 10) && TODAY <= to.slice(0, 10) ? pct(TODAY) : null;
    return { pct, months, today };
  }, [from, to]);
}

function MonthGrid({ axis, labels }: { axis: ReturnType<typeof useAxis>; labels?: boolean }) {
  return (
    <>
      {axis.months.map((m) => (
        <div key={m.pct} className={cn("absolute inset-y-0 w-px", m.year ? "bg-line-strong" : "bg-line")} style={{ left: `${m.pct}%` }} aria-hidden>
          {labels && <span className={cn("absolute -top-5 left-1 whitespace-nowrap text-[10.5px] text-muted", !m.major && "hidden md:inline")}>{m.label}</span>}
        </div>
      ))}
      {axis.today !== null && (
        <div className="absolute inset-y-0 w-0.5 bg-accent/70" style={{ left: `${axis.today}%` }} aria-hidden>
          {labels && <span className="absolute -bottom-5 -translate-x-1/2 whitespace-nowrap text-[10.5px] font-medium text-accent">Today</span>}
        </div>
      )}
    </>
  );
}

function DensityStrip({ tl, focus, onFocus }: { tl: NonNullable<TimelineResponse["timeline"]>; focus: ConvergenceWindow | null; onFocus: (w: ConvergenceWindow | null) => void }) {
  const axis = useAxis(tl.from, tl.to);
  const [hover, setHover] = React.useState<number | null>(null);
  const max = Math.max(1, ...tl.days.map((d) => d.score));
  const n = tl.days.length;
  const path = React.useMemo(() => {
    const y = (d: { score: number }) => 100 - (d.score / max) * 92;
    const pts = tl.days.map((d, i) => `${((i + 0.5) / n) * 1000},${y(d)}`);
    const line = `M0,${y(tl.days[0]!)} L${pts.join(" L")} L1000,${y(tl.days[n - 1]!)}`;
    return { line, area: `${line} L1000,100 L0,100 Z` };
  }, [tl.days, n, max]);
  const peak = tl.days.reduce((a, b) => (b.score > a.score ? b : a), tl.days[0]!);
  const h = hover !== null ? tl.days[hover] : null;

  return (
    <Card>
      <CardHeader
        icon={<Waves />}
        title="Convergence"
        description="How many contacts are in orb each day, weighted. Shaded bands are the busiest periods."
        action={<span className="hidden text-[12px] text-muted sm:inline">{h ? `${fmt(h.date)} · ${h.count} contacts in orb` : `Busiest day: ${fmt(peak.date)} (${peak.count} contacts)`}</span>}
      />
      <CardBody className="pb-8 pt-8">
        <div
          className="relative h-[110px]"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width) * n))));
          }}
          onMouseLeave={() => setHover(null)}
        >
          <MonthGrid axis={axis} labels />
          {tl.convergences.map((w) => (
            <button
              key={w.start}
              type="button"
              aria-label={`Busy period ${fmtRange(w.start, w.end)}`}
              onClick={() => onFocus(focus?.start === w.start ? null : w)}
              className={cn("absolute inset-y-0 rounded-sm transition-colors", focus?.start === w.start ? "bg-accent/20 ring-1 ring-accent/50" : "bg-accent/[0.08] hover:bg-accent/15")}
              style={{ left: `${axis.pct(w.start)}%`, width: `${Math.max(0.6, axis.pct(w.end) - axis.pct(w.start) + 100 / n)}%` }}
            />
          ))}
          <svg
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 size-full"
            role="img"
            aria-label={`Convergence from ${fmt(tl.from.slice(0, 10))} to ${fmt(tl.days[n - 1]!.date)}. ${tl.convergences.length} busy periods. Busiest day ${fmt(peak.date)} with ${peak.count} contacts in orb.`}
          >
            <defs>
              <linearGradient id="tl-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#824B59" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#824B59" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <path d={path.area} fill="url(#tl-fill)" />
            <path d={path.line} fill="none" stroke="#824B59" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          </svg>
          {hover !== null && <div className="pointer-events-none absolute inset-y-0 w-px bg-ink/50" style={{ left: `${((hover + 0.5) / n) * 100}%` }} aria-hidden />}
        </div>
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Convergence windows

function focusText(w: ConvergenceWindow) {
  const parts: string[] = [];
  if (w.focus.target) parts.push(`natal ${pointName(w.focus.target)}`);
  if (w.focus.house) parts.push(`${ordinal(w.focus.house)} house`);
  return parts.join(" / ");
}

function Convergences({ tl, focus, onFocus, onOpen }: { tl: NonNullable<TimelineResponse["timeline"]>; focus: ConvergenceWindow | null; onFocus: (w: ConvergenceWindow | null) => void; onOpen: (c: TimelineContact) => void }) {
  const byId = React.useMemo(() => new Map(tl.contacts.map((c) => [c.id, c])), [tl.contacts]);
  if (tl.convergences.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Layers />} title="No Standout Periods" body="Contacts are spread fairly evenly across this range. Try a longer period, or include more bodies or techniques." />
      </Card>
    );
  }
  return (
    <section aria-labelledby="tl-conv">
      <h2 id="tl-conv" className="mb-2.5 text-[15px] font-semibold text-ink">
        Busiest Periods
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tl.convergences.map((w) => {
          const active = focus?.start === w.start;
          const top = w.contacts.slice(0, 4).map((id) => byId.get(id)!).filter(Boolean);
          const f = focusText(w);
          return (
            <div key={w.start} className={cn("rounded-xl border bg-surface p-4 shadow-card transition-colors", active ? "border-accent/60 ring-1 ring-accent/30" : "border-line")}>
              <button type="button" onClick={() => onFocus(active ? null : w)} className="block w-full text-left" aria-pressed={active}>
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-accent">
                  <CalendarRange className="size-3.5" /> {fmtRange(w.start, w.end)}
                </p>
                <p className="mt-1 text-[14.5px] font-semibold leading-snug text-ink">
                  {w.contacts.length} contacts{f ? <> converge on {f}</> : " in orb"}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {w.exactCount} exact in this period · peak {fmtShort(w.peak)}
                </p>
              </button>
              <ul className="mt-3 space-y-1">
                {top.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => onOpen(c)} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] text-ink hover:bg-canvas-2">
                      <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: TECH[c.technique].color }} aria-hidden />
                      <span className="w-16 shrink-0 text-ink">
                        <Glyphs c={c} />
                      </span>
                      <span className="truncate">{contactLabel(c)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {w.contacts.length > top.length && (
                <button type="button" onClick={() => onFocus(w)} className="mt-1 px-1.5 text-[12px] text-accent hover:underline">
                  Show all {w.contacts.length} below
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Contact grid

function ContactGrid({
  tl,
  groupBy,
  setGroupBy,
  focus,
  onFocus,
  onOpen,
}: {
  tl: NonNullable<TimelineResponse["timeline"]>;
  groupBy: GroupBy;
  setGroupBy: (g: GroupBy) => void;
  focus: ConvergenceWindow | null;
  onFocus: (w: ConvergenceWindow | null) => void;
  onOpen: (c: TimelineContact) => void;
}) {
  const axis = useAxis(tl.from, tl.to);
  const [exactOnly, setExactOnly] = React.useState(false);
  const natal = React.useMemo(() => new Map(tl.natal.map((n) => [n.id, n])), [tl.natal]);

  const visible = React.useMemo(() => {
    let list = tl.contacts;
    if (focus) {
      const ids = new Set(focus.contacts);
      list = list.filter((c) => ids.has(c.id));
    }
    if (exactOnly) list = list.filter((c) => c.windows.some((w) => w.exacts.length > 0));
    return list;
  }, [tl.contacts, focus, exactOnly]);

  const groups = React.useMemo(() => {
    const out = new Map<string, { title: React.ReactNode; sub?: string; order: number; items: TimelineContact[] }>();
    for (const c of visible) {
      let key: string, title: React.ReactNode, sub: string | undefined, order: number;
      if (groupBy === "point") {
        const n = natal.get(c.target);
        key = c.target;
        title = <>Natal {pointName(c.target)}</>;
        sub = n ? `${fmtDeg(n.lon)} ${signOf(n.lon).name}${n.house ? ` · ${ordinal(n.house)} house` : ""}` : undefined;
        order = tl.natal.findIndex((x) => x.id === c.target);
      } else if (groupBy === "house") {
        key = String(c.targetHouse ?? 0);
        title = c.targetHouse ? `${ordinal(c.targetHouse)} house` : "Houses unknown";
        order = c.targetHouse ?? 99;
      } else if (groupBy === "technique") {
        key = c.technique;
        title = `${TECH[c.technique].label}s`;
        order = Object.keys(TECH).indexOf(c.technique);
      } else {
        key = "all";
        title = "All contacts, by date";
        order = 0;
      }
      if (!out.has(key)) out.set(key, { title, sub, order, items: [] });
      out.get(key)!.items.push(c);
    }
    return [...out.entries()].sort((a, b) => a[1].order - b[1].order);
  }, [visible, groupBy, natal, tl.natal]);

  return (
    <Card>
      <CardHeader
        icon={<CircleDot />}
        title="Contacts"
        description={focus ? `Showing the ${focus.contacts.length} contacts in orb ${fmtRange(focus.start, focus.end)}.` : `${tl.contacts.length} contacts in orb during the period. Bars show time in orb; diamonds mark exact hits.`}
        action={focus ? <Button size="sm" variant="ghost" onClick={() => onFocus(null)}>Show All</Button> : undefined}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
          Group by
          <Segmented
            size="sm"
            value={groupBy}
            onChange={setGroupBy}
            options={[
              { value: "point", label: "Natal Point" },
              { value: "house", label: "House" },
              { value: "technique", label: "Technique" },
              { value: "date", label: "Date" },
            ]}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-[12.5px] text-ink">
          <Checkbox checked={exactOnly} onChange={(e) => setExactOnly(e.target.checked)} /> Only contacts that go exact in the period
        </label>
      </div>
      <Legend />
      {visible.length === 0 ? (
        <EmptyState icon={<CircleDot />} title="No Contacts Match" body="Widen the orbs, include more bodies, or turn off the exact-only filter." />
      ) : (
        <div className="pb-2">
          {/* Axis header */}
          <div className="sticky top-16 z-[1] hidden border-b border-line bg-surface/95 backdrop-blur md:grid md:grid-cols-[260px_1fr]">
            <div className="px-5 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">Contact</div>
            <div className="relative mr-5 h-8">
              {axis.months.map((m) => (
                <span key={m.pct} className="absolute top-2 whitespace-nowrap text-[10.5px] text-muted" style={{ left: `${m.pct}%` }}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          {groups.map(([key, g]) => (
            <details key={key} open className="group border-b border-line last:border-b-0">
              <summary className="flex cursor-pointer list-none items-baseline gap-2 bg-canvas-2/60 px-5 py-2 text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <span className="inline-block w-3 text-muted transition-transform group-open:rotate-90" aria-hidden>›</span>
                {g.title}
                {g.sub && <span className="text-[12px] font-normal text-muted">{g.sub}</span>}
                <span className="ml-auto text-[12px] font-normal text-muted">{g.items.length}</span>
              </summary>
              <ul>
                {g.items.map((c) => (
                  <ContactRow key={c.id} c={c} axis={axis} onOpen={onOpen} groupBy={groupBy} />
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </Card>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line px-5 py-2 text-[11.5px] text-muted">
      {(Object.keys(TECH) as TimelineTechnique[]).map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm" style={{ background: TECH[t].color }} aria-hidden />
          {TECH[t].label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-2 rotate-45 border border-ink bg-surface" aria-hidden /> Exact
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold text-ink" aria-hidden>R</span> Exact while retrograde
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold text-ink" aria-hidden>S</span> Station
      </span>
    </div>
  );
}

function ContactRow({ c, axis, onOpen, groupBy }: { c: TimelineContact; axis: ReturnType<typeof useAxis>; onOpen: (c: TimelineContact) => void; groupBy: GroupBy }) {
  const t = TECH[c.technique];
  const exacts = c.windows.flatMap((w) => w.exacts);
  const total = exacts.length;
  const firstExact = exacts[0];
  const summary = firstExact ? (total > 1 ? `${total} exact hits, first ${fmtShort(firstExact.utc)}` : `exact ${fmt(firstExact.utc)}`) : "in orb, not exact in this period";
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(c)}
        className="grid w-full grid-cols-1 gap-1 px-5 py-2 text-left transition-colors hover:bg-canvas-2 focus-visible:bg-canvas-2 md:grid-cols-[260px_1fr] md:items-center md:gap-0"
        data-contact={c.id}
        data-label={contactLabel(c)}
      >
        <span className="flex min-w-0 items-center gap-2 pr-3">
          <span className="w-[64px] shrink-0 text-ink">
            <Glyphs c={c} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] text-ink">
              {sourceName(c)} {ASPECTS[c.aspect].name.toLowerCase()}{" "}
              {groupBy === "point" ? <span className="sr-only">natal {pointName(c.target)}</span> : `natal ${pointName(c.target)}`}
            </span>
            <span className="block truncate text-[11px] text-muted">{summary}</span>
          </span>
        </span>
        <span className="relative block h-6 md:mr-5">
          <MonthGrid axis={axis} />
          {c.windows.map((w, i) => {
            const left = axis.pct(w.start), right = axis.pct(w.end);
            const point = w.start === w.end;
            if (point) return null;
            return (
              <span
                key={i}
                className={cn("absolute top-1/2 h-2.5 -translate-y-1/2", w.startOpen ? "rounded-l-none" : "rounded-l-full", w.endOpen ? "rounded-r-none" : "rounded-r-full")}
                style={{ left: `${left}%`, width: `${Math.max(0.4, right - left)}%`, background: t.color, opacity: 0.35 + 0.5 * Math.max(0, 1 - w.minOrb) }}
              />
            );
          })}
          {c.windows.flatMap((w) =>
            w.exacts.map((e) => (
              <span key={e.utc} className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center" style={{ left: `${axis.pct(e.utc)}%` }}>
                <span className="block size-2.5 rotate-45 border-[1.5px] bg-surface" style={{ borderColor: t.color }} />
                {e.retrograde && <span aria-hidden className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold leading-none text-ink">R</span>}
              </span>
            )),
          )}
          {c.windows.flatMap((w) =>
            w.stations.map((s) => (
              <span key={s.utc} aria-hidden className="absolute top-1/2 -translate-x-1/2 translate-y-[3px] text-[9px] font-bold leading-none text-ink" style={{ left: `${axis.pct(s.utc)}%` }}>
                S
              </span>
            )),
          )}
        </span>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Detail sheet

function ContactSheet({ contact: c, clientId, personId, clientName, tl, onClose }: { contact: TimelineContact; clientId: string; personId: string; clientName: string; tl: NonNullable<TimelineResponse["timeline"]>; onClose: () => void }) {
  const router = useRouter();
  const charts = useStore((s) => s.charts);
  const addChart = useStore((s) => s.addChart);
  const t = TECH[c.technique];
  const natal = tl.natal.find((n) => n.id === c.target);
  const exacts = c.windows.flatMap((w) => w.exacts);
  // The first exact hit, or else the closest approach in the period.
  const closest = [...c.windows].sort((a, b) => a.minOrb - b.minOrb)[0];
  const keyDate = (exacts[0]?.utc ?? closest?.closest ?? tl.from).slice(0, 10);

  const chartFor = (date: string, forNote: boolean) => {
    const type = t.chart;
    if (forNote) {
      // Timing observations belong to one timing chart: file the note under a chart for this contact and date.
      return addChart({ title: `${clientName.split(" ")[0]} — ${contactLabel(c).replace(" natal ", " ")} (${fmtShort(date)})`, type, personIds: [personId], clientId, refDate: date });
    }
    const existing = charts.filter((ch) => ch.clientId === clientId && ch.type === type && ch.personIds[0] === personId).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))[0];
    return existing ?? addChart({ title: `${clientName.split(" ")[0]} — ${type === "transits" ? "Transits" : type === "progressions" ? "Progressions" : "Solar arcs"}`, type, personIds: [personId], clientId, refDate: date });
  };

  const openChart = (date: string) => {
    const ch = chartFor(date, false);
    router.push(`/app/charts/${ch.id}?date=${date}`);
  };
  const addNote = () => {
    const ch = chartFor(keyDate, true);
    const q = new URLSearchParams({ note: "1", title: contactLabel(c) });
    if (c.source !== "new-moon" && c.source !== "full-moon") q.set("planets", [c.source, c.target].join(","));
    else q.set("planets", c.target);
    q.set("aspect", c.aspect);
    if (c.targetHouse) q.set("house", String(c.targetHouse));
    router.push(`/app/charts/${ch.id}?${q}`);
  };

  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={contactLabel(c)}
      description={`${t.label} · ${clientName}`}
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={addNote}>
            <NotebookPen /> Add Observation
          </Button>
          <Button onClick={() => openChart(keyDate)}>
            <CircleDot /> Open Chart at {fmtShort(keyDate)}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="flex items-center gap-3 rounded-xl border border-line p-4" style={{ background: t.soft }}>
          <span className="text-ink">
            <Glyphs c={c} size={28} />
          </span>
          <div className="text-[12.5px] text-ink">
            <p>
              Natal {pointName(c.target)}
              {natal && <> at {fmtDeg(natal.lon)} {signOf(natal.lon).name}</>}
              {natal?.house && <> · {ordinal(natal.house)} house</>}
            </p>
            <p className="text-muted">
              {ASPECTS[c.aspect].name} ({ASPECTS[c.aspect].angle}°) · weight {c.weight}
            </p>
          </div>
        </div>

        {c.events ? (
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-ink">Events</h3>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {c.events.map((e) => (
                <li key={e.utc} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[12.5px]">
                  <span>
                    <span className="font-medium text-ink">{e.eclipse ? e.eclipse.replace(/^\w/, (x) => x.toUpperCase()) : e.kind === "new" ? "New moon" : "Full moon"}</span>
                    {e.eclipseApproximate && <span className="text-muted"> (estimated)</span>}
                    <span className="block text-muted">
                      {fmtTime(e.utc)} · {fmtDeg(e.lon)} {signOf(e.lon).name} · orb {e.orb.toFixed(2)}°
                    </span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => openChart(e.utc.slice(0, 10))}>
                    Chart
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-ink">Time in Orb</h3>
            <ul className="space-y-3">
              {c.windows.map((w, i) => (
                <li key={i} className="rounded-lg border border-line p-3 text-[12.5px]">
                  <p className="font-medium text-ink">
                    {w.startOpen ? "Before " : ""}
                    {fmt(w.start)} – {fmt(w.end)}
                    {w.endOpen ? " and after" : ""}
                  </p>
                  <p className="text-muted">{w.exacts.length ? `In orb for ${Math.round((Date.parse(w.end) - Date.parse(w.start)) / DAY)} days` : `Closest approach ${w.minOrb.toFixed(2)}° on ${fmt(w.closest)}`}</p>
                  {w.exacts.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {w.exacts.map((e) => (
                        <li key={e.utc} className="flex items-center justify-between gap-2">
                          <span>
                            <span className="mr-1.5 inline-block size-2 rotate-45 border-[1.5px]" style={{ borderColor: t.color }} aria-hidden />
                            Exact {fmtTime(e.utc)}
                            <span className="text-muted">
                              {" "}
                              · pass {e.pass} of {exacts.length}
                              {e.retrograde ? " · retrograde" : ""}
                            </span>
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => openChart(e.utc.slice(0, 10))}>
                            Chart
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {w.stations.length > 0 && (
                    <p className="mt-2 text-muted">
                      {w.stations.map((s) => `Stations ${s.kind} ${fmt(s.utc)}`).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="text-[11.5px] leading-snug text-muted">
          Times are UTC. “Add observation” files the note under a timing chart for this contact and date, so it stays with that moment rather than the natal chart.
        </p>
      </div>
    </Sheet>
  );
}
