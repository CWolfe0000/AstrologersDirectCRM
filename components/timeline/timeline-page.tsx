"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, CircleDot, Info, Layers, Loader2, NotebookPen, RotateCcw, Save, SlidersHorizontal, Waves } from "lucide-react";
import { ASPECTS, BODIES, DEFAULT_TIMELINE, RULERS, fmtDeg, ordinal, signOf, type BodyId, type TimelineDefaults, aspectVerb } from "@/lib/astro";
import { fetchTimeline, type TimelineResponse } from "@/lib/astro/timeline-client";
import type { ConvergenceWindow, TargetId, TimelineContact, TimelineTechnique } from "@/lib/astro/timeline";
import { sameTimeline, TimelineOptionsEditor } from "./timeline-options";
import { TECH, pointName, pointGlyph, sourceName, Glyphs, contactLabel, DAY, fmt, fmtShort, fmtTime, fmtRange, addMonths } from "./labels";
import { activationModel, cycleAround, dayIndex, passesSignificance, type Significance } from "@/lib/astro/activation";
import { ActivationOverview, BackgroundInfluences, ClientContext, ConvergenceAnalysis, HouseSheet, LifecycleSection, PointSheet, useConfigurationNote } from "./activation";
import { BACKGROUND_CHOICES, DEFAULT_BACKGROUND } from "./timeline-options";
import { Breakdown, BTable } from "@/components/ui/breakdown";
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
  const [asOfRaw, setAsOf] = React.useState(TODAY);
  const [sig, setSig] = React.useState<Significance>("moderate");
  const [pointSheet, setPointSheet] = React.useState<TargetId | null>(null);
  const [houseSheet, setHouseSheet] = React.useState<number | null>(null);
  const consultations = useStore((s) => s.consultations);
  const sessions = React.useMemo(() => consultations.filter((k) => k.clientId === clientId && k.status !== "cancelled").sort((a, b) => (a.start < b.start ? -1 : 1)), [consultations, clientId]);
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
  const lastDay = shown ? shown.days[shown.days.length - 1]!.date : end;
  const asOf = shown ? (asOfRaw < shown.days[0]!.date ? shown.days[0]!.date : asOfRaw > lastDay ? lastDay : asOfRaw) : asOfRaw;
  const model = React.useMemo(() => (shown ? activationModel(shown, sig) : null), [shown, sig]);
  const d = shown ? dayIndex(shown, asOf) : 0;
  const lastSession = sessions.filter((k) => k.start.slice(0, 10) < asOf && k.status !== "scheduled").pop() ?? sessions.filter((k) => k.start.slice(0, 10) < asOf).pop() ?? null;
  const nextSession = sessions.find((k) => k.start.slice(0, 10) > asOf) ?? null;
  const addConfigNote = useConfigurationNote(clientId, person?.id ?? "", personName(person), asOf);
  const moveAsOf = (date: string) => {
    setAsOf(date);
    toast("As Of Date Moved", fmt(date), "success");
  };

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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EngineNotice />
            <Link href={`/app/timeline/wheel?client=${clientId}&date=${asOf}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-canvas-2"><CircleDot className="size-4" /> Multi-Wheel</Link>
          </div>
        }
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
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-line pt-4 lg:col-span-3">
            <Field label="As Of">
              <span className="flex flex-wrap items-center gap-2">
                <Input type="date" value={asOf} min={start} max={end} onChange={(e) => e.target.value && setAsOf(e.target.value)} className="w-[150px]" />
                <button type="button" className="text-[12.5px] text-accent hover:underline" onClick={() => setAsOf(TODAY)}>Today</button>
                {nextSession && <button type="button" className="text-[12.5px] text-accent hover:underline" onClick={() => setAsOf(nextSession.start.slice(0, 10))}>Next Session ({fmtShort(nextSession.start.slice(0, 10))})</button>}
              </span>
            </Field>
            <div>
              <p className="mb-1.5 text-[12.5px] font-medium text-ink">Show</p>
              <Segmented value={sig} onChange={setSig} options={[{ value: "major", label: "Major Cycles" }, { value: "moderate", label: "Moderate" }, { value: "all", label: "All Contacts" }]} />
            </div>
            <div className="min-w-0">
              <p className="mb-1.5 text-[12.5px] font-medium text-ink">Background Planets</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {BACKGROUND_CHOICES.map((b) => {
                  const bg = opts.backgroundBodies ?? DEFAULT_BACKGROUND;
                  const on = bg.includes(b);
                  return (
                    <button key={b} type="button" aria-pressed={on} onClick={() => setOpts((o) => ({ ...o, backgroundBodies: on ? bg.filter((x) => x !== b) : [...bg, b] }))} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px]", on ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink hover:bg-canvas-2")}>
                      <span className="glyph" aria-hidden>{BODIES[b].glyph}</span> {BODIES[b].name}
                    </button>
                  );
                })}
                <span className="text-[11.5px] text-muted">+ progressions and solar arcs, always</span>
              </div>
            </div>
          </div>
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
          {model && (
            <ClientContext.Provider value={clientId}>
              <section aria-labelledby="tl-act" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id="tl-act" className="font-serif text-[22px] text-ink">Client Activation</h2>
                  <p className="text-[12.5px] text-muted">As of {fmt(asOf)} · {sig === "major" ? "Major Cycles Only" : sig === "moderate" ? "Major & Moderate Influences" : "All Contacts"}</p>
                </div>
                <ActivationOverview m={model} d={d} onOpenContact={setDetail} onPoint={setPointSheet} onHouse={setHouseSheet} />
              </section>
              <section aria-labelledby="tl-an" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id="tl-an" className="font-serif text-[22px] text-ink">Convergence Analysis</h2>
                  <p className="text-[12.5px] text-muted">Active contacts grouped by shared natal points, rulerships and natal aspects.</p>
                </div>
                <ConvergenceAnalysis m={model} d={d} onOpenContact={setDetail} onNote={addConfigNote} />
              </section>
            </ClientContext.Provider>
          )}
          <DensityStrip tl={shown} focus={focus} onFocus={setFocus} asOf={asOf} onAsOf={moveAsOf} />
          <Convergences tl={shown} focus={focus} onFocus={setFocus} onOpen={setDetail} onAsOf={(x) => { moveAsOf(x); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          {model && <BackgroundInfluences m={model} d={d} onOpenContact={setDetail} />}
          <ContactGrid tl={shown} sig={sig} groupBy={groupBy} setGroupBy={setGroupBy} focus={focus} onFocus={setFocus} onOpen={setDetail} />
          <p className="text-[12px] leading-relaxed text-muted">
            The density score adds up the contacts in orb each day, giving more weight to slow planets, hard aspects and the Sun, Moon, angles and chart ruler, and more to a contact the closer it is to exact. It is a counting aid, not an interpretation, and the weights are provisional.
            Times are in UTC. Progressions use one day per year of life; solar arcs use the true solar arc. Lunations and eclipses are checked by conjunction, opposition and square.
          </p>
        </div>
      )}

      {detail && person && shown && <ContactSheet contact={detail} clientId={clientId} personId={person.id} clientName={personName(person)} tl={shown} asOf={asOf} opts={opts} onClose={() => setDetail(null)} />}
      {model && (
        <ClientContext.Provider value={clientId}>
          {pointSheet && <PointSheet m={model} d={d} id={pointSheet} onClose={() => setPointSheet(null)} onOpenContact={(c) => { setPointSheet(null); setDetail(c); }} onNote={addConfigNote} />}
          {houseSheet && <HouseSheet m={model} d={d} h={houseSheet} onClose={() => setHouseSheet(null)} onOpenContact={(c) => { setHouseSheet(null); setDetail(c); }} />}
        </ClientContext.Provider>
      )}
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

function DensityStrip({ tl, focus, onFocus, asOf, onAsOf }: { tl: NonNullable<TimelineResponse["timeline"]>; focus: ConvergenceWindow | null; onFocus: (w: ConvergenceWindow | null) => void; asOf: string; onAsOf: (d: string) => void }) {
  const axis = useAxis(tl.from, tl.to);
  const [hover, setHover] = React.useState<number | null>(null);
  const max = Math.max(1, ...tl.days.map((d) => d.score));
  const n = tl.days.length;
  const paths = React.useMemo(() => {
    const X = (i: number) => ((i + 0.5) / n) * 1000;
    const Y = (v: number) => 100 - (v / max) * 92;
    const area = (top: (i: number) => number, base: (i: number) => number) => {
      let p = `M${X(0)},${Y(base(0))}`;
      for (let i = 0; i < n; i++) p += ` L${X(i)},${Y(top(i))}`;
      for (let i = n - 1; i >= 0; i--) p += ` L${X(i)},${Y(base(i))}`;
      return p + " Z";
    };
    const bg = (i: number) => tl.days[i]!.score - (tl.days[i]!.trigger ?? 0);
    return { bg: area(bg, () => 0), tr: area((i) => tl.days[i]!.score, bg) };
  }, [tl.days, n, max]);
  // The busiest day by short-term activity: the same measure the busy periods use.
  const peak = tl.days.reduce((a, b) => ((b.trigger ?? b.score) > (a.trigger ?? a.score) ? b : a), tl.days[0]!);
  const h = hover !== null ? tl.days[hover] : null;
  const asOfPct = axis.pct(asOf) + 50 / n;

  return (
    <Card>
      <CardHeader
        icon={<Waves />}
        title="Convergence"
        description="Weighted intensity each day. Background influences are grey; short-term triggers sit on top. Shaded bands are busy periods. Select a day to move the As Of date."
        action={
          <span className="hidden text-right text-[12px] text-muted sm:block">
            {h ? `${fmt(h.date)} · ${h.count} In Orb (${h.triggerCount ?? 0} Triggers, ${h.count - (h.triggerCount ?? 0)} Background)` : `Most Short-Term Activity: ${fmt(peak.date)} (${peak.triggerCount ?? 0} Triggers, ${peak.count} In Orb In All)`}
            <span className="mt-1 flex justify-end gap-3">
              <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-ink/20" /> Background</span>
              <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-accent/50" /> Triggers</span>
            </span>
          </span>
        }
      />
      <CardBody className="pb-8 pt-8">
        <div
          className="relative h-[110px] cursor-crosshair"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width) * n))));
          }}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width) * n)));
            onAsOf(tl.days[i]!.date);
          }}
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
            aria-label={`Convergence from ${fmt(tl.from.slice(0, 10))} to ${fmt(tl.days[n - 1]!.date)}. ${tl.convergences.length} busy periods. Most short-term activity on ${fmt(peak.date)}.`}
          >
            <path d={paths.bg} style={{ fill: "rgb(41 39 43 / 0.16)" }} />
            <path d={paths.tr} style={{ fill: "rgb(var(--accent) / 0.42)" }} />
          </svg>
          {asOfPct >= 0 && asOfPct <= 100 && (
            <div className="pointer-events-none absolute -inset-y-1 w-0.5 bg-ink" style={{ left: `${asOfPct}%` }} aria-hidden>
              <span className="absolute -bottom-5 -translate-x-1/2 whitespace-nowrap text-[10.5px] font-medium text-ink">As Of</span>
            </div>
          )}
          {hover !== null && <div className="pointer-events-none absolute inset-y-0 w-px bg-ink/50" style={{ left: `${((hover + 0.5) / n) * 100}%` }} aria-hidden />}
        </div>
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Busy periods

function Convergences({ tl, focus, onFocus, onOpen, onAsOf }: { tl: NonNullable<TimelineResponse["timeline"]>; focus: ConvergenceWindow | null; onFocus: (w: ConvergenceWindow | null) => void; onOpen: (c: TimelineContact) => void; onAsOf: (d: string) => void }) {
  const byId = React.useMemo(() => new Map(tl.contacts.map((c) => [c.id, c])), [tl.contacts]);
  if (tl.convergences.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Layers />} title="No Standout Periods" body="Short-term activity is spread fairly evenly across this range. Try a longer period, or include more bodies or techniques." />
      </Card>
    );
  }
  const strongest = Math.max(...tl.convergences.map((w) => w.peakScore));
  const natal = new Map(tl.natal.map((n) => [n.id, n]));
  const cusps = tl.cusps ?? null;
  const ruled = (id: TargetId) => (cusps && id !== "asc" && id !== "mc" ? cusps.map((c, i) => ({ h: i + 1, r: RULERS[signOf(c).id] })).filter(({ r }) => r.traditional === id || r.modern === id).map(({ h }) => h) : []);
  const rulersOf = (h: number) => {
    if (!cusps) return [];
    const r = RULERS[signOf(cusps[h - 1]!).id];
    return r.modern && r.modern !== r.traditional ? [r.traditional, r.modern] : [r.traditional];
  };
  return (
    <section aria-labelledby="tl-conv">
      <h2 id="tl-conv" className="mb-1 text-[15px] font-semibold text-ink">Busiest Periods</h2>
      <p className="mb-2.5 text-[12.5px] text-muted">Found and ranked by short-term activity, so a long transit can’t make a whole stretch look busy.</p>
      <PeriodsBreakdown tl={tl} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tl.convergences.map((w) => {
          const active = focus?.start === w.start;
          const top = w.contacts.slice(0, 4).map((id) => byId.get(id)!).filter(Boolean);
          const t = w.focus.target, hs = w.focus.house;
          const tHouse = t ? natal.get(t)?.house : null;
          return (
            <div key={w.start} className={cn("flex flex-col gap-2.5 rounded-xl border bg-surface p-4 shadow-card transition-colors", active ? "border-accent/60 ring-1 ring-accent/30" : "border-line")}>
              <button type="button" onClick={() => onFocus(active ? null : w)} className="block w-full text-left" aria-pressed={active}>
                <p className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-accent">
                  <CalendarRange className="size-3.5" /> {w.startOpen ? "Before " : ""}{fmtRange(w.start, w.end)}{w.endOpen ? " and Beyond" : ""}
                  {w.peakScore === strongest && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10.5px]">Strongest</span>}
                </p>
                {w.startOpen && <p className="mt-1 text-[11.5px] text-warn">Began before this range: it may be longer, and may have peaked earlier.</p>}
                {w.endOpen && <p className="mt-1 text-[11.5px] text-warn">Runs past the end of this range.</p>}
              </button>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-lg bg-canvas-2 px-2 py-1.5"><b className="block text-[15px] tabular-nums text-ink">{fmtShort(w.peak)}</b><span className="block text-[10.5px] leading-tight text-muted">Peak Day: {w.peakCount} In Orb at Once, {w.peakTriggers} of Them Triggers</span></div>
                <div className="rounded-lg bg-canvas-2 px-2 py-1.5"><b className="block text-[15px] tabular-nums text-ink">{w.contacts.length + w.background.length}</b><span className="block text-[10.5px] leading-tight text-muted">Distinct Contacts Over the Period</span></div>
                <div className="rounded-lg bg-canvas-2 px-2 py-1.5"><b className="block text-[15px] tabular-nums text-ink">{w.exactCount}</b><span className="block text-[10.5px] leading-tight text-muted">Exact Hits Inside the Period</span></div>
              </div>
              {(t || hs) && (
                <dl className="space-y-1 rounded-lg bg-canvas/60 px-2.5 py-2 text-[12.5px] leading-snug">
                  {t && (
                    <div className="flex gap-2">
                      <dt className="w-12 shrink-0 text-muted">Planet</dt>
                      <dd className="text-ink">
                        <span className="font-medium">{t === "asc" || t === "mc" ? "" : "Natal "}{pointName(t)}</span> <span className="text-muted">· {w.focus.targetCount} Contacts</span>
                        {(tHouse || ruled(t).length > 0) && t !== "asc" && t !== "mc" && (
                          <span className="block text-ink-3">{tHouse ? `In the ${ordinal(tHouse)}` : ""}{tHouse && ruled(t).length ? " · " : ""}{ruled(t).length ? `Rules the ${ruled(t).map(ordinal).join(" & ")}` : ""}</span>
                        )}
                      </dd>
                    </div>
                  )}
                  {hs && (
                    <div className="flex gap-2">
                      <dt className="w-12 shrink-0 text-muted">House</dt>
                      <dd className="text-ink">
                        <span className="font-medium">{ordinal(hs)} House</span> <span className="text-muted">· {w.focus.houseCount} Contacts to Planets There</span>
                        {rulersOf(hs).length > 0 && <span className="block text-ink-3">Ruled By {rulersOf(hs).map((r) => BODIES[r].name).join(" and ")}</span>}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              <ul className="space-y-0.5">
                {top.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => onOpen(c)} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] text-ink hover:bg-canvas-2">
                      <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: TECH[c.technique].color }} aria-hidden />
                      <span className="w-16 shrink-0 text-ink"><Glyphs c={c} /></span>
                      <span className="truncate">{contactLabel(c)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {w.background.length > 0 && (
                <p className="text-[11.5px] text-muted">
                  Against the background of {w.background.slice(0, 2).map((id) => byId.get(id)).filter(Boolean).map((c) => contactLabel(c!)).join(" and ")}
                  {w.background.length > 2 ? ` (+${w.background.length - 2})` : ""}.
                </p>
              )}
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1">
                {w.contacts.length > top.length && <button type="button" onClick={() => onFocus(w)} className="text-[12px] text-accent hover:underline">Show All {w.contacts.length} Below</button>}
                <button type="button" onClick={() => onAsOf(w.peak)} className="text-[12px] text-accent hover:underline">Set As Of to the Peak Day</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PeriodsBreakdown({ tl }: { tl: NonNullable<TimelineResponse["timeline"]> }) {
  const tr = tl.days.map((d) => d.trigger ?? 0);
  const mean = tr.reduce((a, b) => a + b, 0) / Math.max(1, tr.length);
  const sd = Math.sqrt(tr.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, tr.length));
  const hot = tl.days.filter((d) => (d.trigger ?? 0) > mean + 0.75 * sd && (d.triggerCount ?? 0) >= 2).length;
  return (
    <Breakdown className="mb-3">
      <p>
        Each day’s short-term intensity is the sum of its trigger contacts (weight × closeness to exact). Over this range the mean is {mean.toFixed(2)} and the standard deviation {sd.toFixed(2)}, so a day counts as busy above {(mean + 0.75 * sd).toFixed(2)} with at least two triggers in orb ({hot} of {tl.days.length} days). Busy days less than a week apart are joined; runs shorter than three days are dropped; the six with the highest peak are shown.
      </p>
      <BTable
        head={["Period", "Peak Day", "Peak Intensity", "In Orb at Peak", "Triggers at Peak", "Exact Hits"]}
        rows={tl.convergences.map((w) => [fmtRange(w.start, w.end), fmtShort(w.peak), w.peakScore.toFixed(2), w.peakCount, w.peakTriggers, w.exactCount])}
      />
      <p>Background planets: {(tl.backgroundBodies ?? []).map((b) => BODIES[b].name).join(", ") || "none"} (plus progressions and solar arcs). Their contacts are listed with each period but don’t make a period busy.</p>
    </Breakdown>
  );
}

// ---------------------------------------------------------------------------
// Contact grid

function ContactGrid({
  tl,
  sig,
  groupBy,
  setGroupBy,
  focus,
  onFocus,
  onOpen,
}: {
  tl: NonNullable<TimelineResponse["timeline"]>;
  sig: Significance;
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
    let list = tl.contacts.filter((c) => passesSignificance(c, sig));
    if (focus) {
      const ids = new Set(focus.contacts);
      list = list.filter((c) => ids.has(c.id));
    }
    if (exactOnly) list = list.filter((c) => c.windows.some((w) => w.exacts.length > 0));
    return list;
  }, [tl.contacts, focus, exactOnly, sig]);

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
        description={focus ? `Showing the short-term contacts in orb ${fmtRange(focus.start, focus.end)}.` : `${visible.length} of ${tl.contacts.length} contacts in orb during the period (“${sig === "major" ? "Major Cycles" : sig === "moderate" ? "Moderate" : "All Contacts"}”). Bars show time in orb; diamonds mark exact hits.`}
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
          <Checkbox checked={exactOnly} onChange={(e) => setExactOnly(e.target.checked)} /> Only Contacts That Go Exact In the Period
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
  const summary = firstExact ? (total > 1 ? `${total} Exact Hits, First ${fmtShort(firstExact.utc)}` : `Exact ${fmt(firstExact.utc)}`) : "In Orb, Not Exact In This Period";
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
              {sourceName(c)} {aspectVerb(c.aspect)}{" "}
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

const lifecycleCache = new Map<string, Promise<TimelineContact | null>>();

/** The whole life of one contact: recalculated for just that contact, 18 months either side of the As Of date. */
function useFullContact(c: TimelineContact, personId: string, asOf: string, opts: TimelineDefaults) {
  const person = useStore((s) => s.people.find((p) => p.id === personId));
  const defaults = useStore((s) => s.defaults);
  const [full, setFull] = React.useState<TimelineContact | null | "loading">(c.events ? null : "loading");
  React.useEffect(() => {
    if (c.events || !person?.birth) return setFull(null);
    // Progressions and solar arcs already carry their whole passes (calculated well beyond the range).
    if (c.cycle?.length) return setFull({ ...c, windows: c.cycle });
    // Three years back and three years ahead (two calculations, each within the three-year limit, meeting at the As Of date).
    const at = Date.parse(`${asOf}T00:00:00Z`);
    const day = (n: number) => new Date(at + n * DAY).toISOString().slice(0, 10);
    const ranges: [string, string][] = [[day(-1090), day(-1)], [day(0), day(1090)]];
    const src = c.source as BodyId;
    const options = {
      transits: c.technique === "transit",
      progressions: c.technique === "progressed",
      solarArcs: c.technique === "solar-arc",
      lunations: false,
      transitBodies: c.technique === "transit" ? [src] : [],
      progressedBodies: c.technique === "progressed" ? [src] : [],
      aspects: [c.aspect],
      targets: [c.target],
      orbs: opts.orbs,
      transitOrbs: opts.transitOrbs,
      backgroundBodies: opts.backgroundBodies ?? DEFAULT_BACKGROUND,
    };
    const key = JSON.stringify([person.birth, defaults.zodiac, defaults.houseSystem, ranges, options]);
    let p = lifecycleCache.get(key);
    if (!p) {
      p = Promise.all(ranges.map(([from, to]) => fetchTimeline(person.birth, { ...defaults, timeline: undefined }, from, to, options))).then((rs) => {
        const parts = rs.map((r) => r.timeline.contacts.find((x) => x.id === c.id)).filter(Boolean) as TimelineContact[];
        if (!parts.length) return null;
        // Keep the cycle around the As Of date: passes less than a year apart.
        return { ...parts[0]!, windows: cycleAround(parts.flatMap((x) => x.windows), at + DAY / 2) };
      });
      lifecycleCache.set(key, p);
    }
    let live = true;
    setFull("loading");
    p.then((x) => live && setFull(x), () => { lifecycleCache.delete(key); if (live) setFull(null); });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id, asOf, person?.birth, c.cycle]);
  return full;
}

function ContactSheet({ contact: c, clientId, personId, clientName, tl, asOf, opts, onClose }: { contact: TimelineContact; clientId: string; personId: string; clientName: string; tl: NonNullable<TimelineResponse["timeline"]>; asOf: string; opts: TimelineDefaults; onClose: () => void }) {
  const router = useRouter();
  const full = useFullContact(c, personId, asOf, opts);
  const charts = useStore((s) => s.charts);
  const addChart = useStore((s) => s.addChart);
  const t = TECH[c.technique];
  const natal = tl.natal.find((n) => n.id === c.target);
  const exacts = c.windows.flatMap((w) => w.exacts);
  // The first exact hit, or else the closest approach in the period.
  const closest = [...c.windows].sort((a, b) => a.minOrb - b.minOrb)[0];
  const keyDate = (exacts[0]?.utc ?? closest?.closest ?? tl.from).slice(0, 10);
  const range = { from: Date.parse(`${tl.from.slice(0, 10)}T00:00:00Z`), to: Date.parse(`${tl.to.slice(0, 10)}T00:00:00Z`) + DAY };
  // Exact hits of a pass that's cut by the range edge but perfects outside it (from the whole pass, when known).
  const passes = full && full !== "loading" ? full.windows : [];
  const outsideExacts = (w: TimelineContact["windows"][number]) => {
    if (!w.startOpen && !w.endOpen) return [];
    const s = Date.parse(w.start), e = Date.parse(w.end);
    const whole = passes.find((p) => Date.parse(p.start) <= s + DAY && Date.parse(p.end) >= e - DAY);
    return (whole?.exacts ?? []).map((x) => Date.parse(x.utc)).filter((x) => (w.startOpen && x < range.from) || (w.endOpen && x >= range.to));
  };

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

        {!c.events && <LifecycleSection c={c} at={Date.parse(`${asOf}T12:00:00Z`)} full={full} range={range} />}

        {c.events ? (
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-ink">Events</h3>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {c.events.map((e) => (
                <li key={e.utc} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[12.5px]">
                  <span>
                    <span className="font-medium text-ink">{e.eclipse ? e.eclipse.replace(/\b\w/g, (x) => x.toUpperCase()) : e.kind === "new" ? "New Moon" : "Full Moon"}</span>
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
            <h3 className="mb-2 text-[13px] font-semibold text-ink">Time in Orb This Range</h3>
            <ul className="space-y-3">
              {c.windows.map((w, i) => (
                <li key={i} className="rounded-lg border border-line p-3 text-[12.5px]">
                  <p className="font-medium text-ink">
                    {w.startOpen ? "Before " : ""}
                    {fmt(w.start)} – {fmt(w.end)}
                    {w.endOpen ? " and After" : ""}
                  </p>
                  <p className="text-muted">{w.exacts.length ? `In Orb for ${Math.round((Date.parse(w.end) - Date.parse(w.start)) / DAY)} Days` : `Closest Approach in This Range ${w.minOrb.toFixed(2)}° on ${fmt(w.closest)}`}</p>
                  {outsideExacts(w).map((x) => (
                    <p key={x} className="mt-1 text-ink-3">Exact {fmt(new Date(x).toISOString())}, {x < range.from ? "before" : "after"} this range</p>
                  ))}
                  {w.exacts.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {w.exacts.map((e) => (
                        <li key={e.utc} className="flex items-center justify-between gap-2">
                          <span>
                            <span className="mr-1.5 inline-block size-2 rotate-45 border-[1.5px]" style={{ borderColor: t.color }} aria-hidden />
                            Exact {fmtTime(e.utc)}
                            <span className="text-muted">
                              {" "}
                              · Pass {e.pass} of {exacts.length}
                              {e.retrograde ? " · Retrograde" : ""}
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
                      {w.stations.map((s) => `Stations ${s.kind === "retrograde" ? "Retrograde" : "Direct"} ${fmt(s.utc)}`).join(" · ")}
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
