"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause, Play, Waves } from "lucide-react";
import { ASPECTS, BODIES, DEFAULT_TIMELINE, aspectVerb, computeAspects, fmtOrb, getEngine, type ChartPoints, type ChartSettings } from "@/lib/astro";
import { useStore, personName } from "@/lib/store";
import { cn, TODAY } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { MultiWheel, type MovingRing, type RingContact } from "@/components/chart/multi-wheel";
import { EngineNotice } from "@/components/chart/chart-helpers";
import { PremiumGate, usePremium } from "@/components/plan/premium";
import { useHydrated } from "@/components/workspace/use-hydrated";

/**
 * Multi-wheel: the natal chart with progressions, solar arcs and transits
 * around it, moved through time a step at a time (or played). Only the date on
 * screen is calculated, and each date is fetched once.
 */
type RingKey = "progressed" | "solar-arc" | "transit";
const RINGS: { key: RingKey; label: string; short: string; color: string }[] = [
  { key: "progressed", label: "Progressed", short: "Progressed", color: "#4D5A70" },
  { key: "solar-arc", label: "Solar Arc", short: "Solar Arc", color: "#6E4F6E" },
  { key: "transit", label: "Transiting", short: "Transits", color: "#824B59" },
];
type Step = "day" | "week" | "month" | "year";
const PROGRESSED_CONTACTS = new Set(["sun", "moon", "mercury", "venus", "mars"]);
const cache = new Map<string, Promise<ChartPoints>>();

const addStep = (date: string, step: Step, n: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  if (step === "day") d.setUTCDate(d.getUTCDate() + n);
  if (step === "week") d.setUTCDate(d.getUTCDate() + 7 * n);
  if (step === "month") d.setUTCMonth(d.getUTCMonth() + n);
  if (step === "year") d.setUTCFullYear(d.getUTCFullYear() + n);
  return d.toISOString().slice(0, 10);
};
const fmtLong = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "long", day: "numeric", year: "numeric" });

export default function MultiWheelPage() {
  return (
    <React.Suspense>
      <MultiWheelView />
    </React.Suspense>
  );
}

function MultiWheelView() {
  const hydrated = useHydrated();
  const premium = usePremium();
  const router = useRouter();
  const params = useSearchParams();
  const clients = useStore((s) => s.clients);
  const people = useStore((s) => s.people);
  const defaults = useStore((s) => s.defaults);
  const consultations = useStore((s) => s.consultations);
  const list = React.useMemo(() => clients.map((c) => people.find((p) => p.id === c.id)).filter((p) => p?.birth?.date).sort((a, b) => personName(a).localeCompare(personName(b))), [clients, people]);
  const clientId = params.get("client") ?? list[0]?.id ?? "";
  const person = people.find((p) => p.id === clientId);

  const [date, setDate] = React.useState(params.get("date") && /^\d{4}-\d{2}-\d{2}$/.test(params.get("date")!) ? params.get("date")! : TODAY);
  const [step, setStep] = React.useState<Step>("month");
  const [on, setOn] = React.useState<Record<RingKey, boolean>>({ progressed: false, "solar-arc": false, transit: true });
  const [orb, setOrb] = React.useState(1);
  const [playing, setPlaying] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{ date: string; natal: ChartPoints; rings: Partial<Record<RingKey, ChartPoints>> } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const settings: ChartSettings = React.useMemo(() => ({ ...defaults, timeline: undefined }), [defaults]);
  const sessions = React.useMemo(() => consultations.filter((k) => k.clientId === clientId && k.status !== "cancelled").map((k) => k.start.slice(0, 10)).sort(), [consultations, clientId]);
  const nextSession = sessions.find((d) => d > date);
  const prevSession = [...sessions].reverse().find((d) => d < date);

  // Calculate the date on screen (each ring once per date).
  React.useEffect(() => {
    if (!hydrated || !premium || !person?.birth) return;
    let live = true;
    const engine = getEngine();
    const get = (k: string, f: () => Promise<ChartPoints>) => {
      const key = JSON.stringify([person.id, person.birth, settings.zodiac, settings.houseSystem, settings.bodies, k]);
      let p = cache.get(key);
      if (!p) {
        p = f();
        cache.set(key, p);
        if (cache.size > 400) cache.delete(cache.keys().next().value!);
        p.catch(() => cache.delete(key));
      }
      return p;
    };
    (async () => {
      try {
        const natal = await get("natal", () => engine.natal(person.birth, settings));
        const rings: Partial<Record<RingKey, ChartPoints>> = {};
        await Promise.all([
          on.transit && get(`t:${date}`, () => engine.positionsAt(`${date}T12:00`, settings, natal)).then((x) => (rings.transit = x)),
          on.progressed && get(`p:${date}`, () => engine.progressed(person.birth, date, settings)).then((x) => (rings.progressed = x)),
          on["solar-arc"] && get(`s:${date}`, () => engine.solarArc(person.birth, date, settings)).then((x) => (rings["solar-arc"] = x)),
        ]);
        if (live) {
          setData({ date, natal, rings });
          setError(null);
        }
      } catch (e) {
        if (live) {
          setError((e as Error).message || "The chart couldn’t be calculated.");
          setPlaying(false);
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [hydrated, premium, person?.id, person?.birth, settings, date, on]);

  // Playing: step once the current date has been drawn.
  React.useEffect(() => {
    if (!playing || data?.date !== date) return;
    const t = setTimeout(() => setDate((d) => addStep(d, step, 1)), 450);
    return () => clearTimeout(t);
  }, [playing, data, date, step]);

  const rings: MovingRing[] = data ? RINGS.filter((r) => on[r.key] && data.rings[r.key]).map((r) => ({ key: r.key, label: r.label, color: r.color, points: data.rings[r.key]! })) : [];
  const tl = defaults.timeline ?? DEFAULT_TIMELINE;
  const contacts: (RingContact & { ringLabel: string; color: string })[] = data
    ? rings.flatMap((r) => {
        const s: ChartSettings = { ...settings, aspects: tl.aspects, orbs: Object.fromEntries(tl.aspects.map((a) => [a, orb])) };
        // Progressed outer planets barely move, so like the timeline only the Sun through Mars count; no planet aspects its own natal place.
        return computeAspects(data.natal, s, r.points).filter((a) => a.a !== a.b && (r.key !== "progressed" || PROGRESSED_CONTACTS.has(a.a))).map((a) => ({ ring: r.key, from: a.a, to: a.b, type: a.type, orb: a.orb, applying: a.applying, ringLabel: r.label, color: r.color }));
      }).sort((x, y) => x.orb - y.orb)
    : [];
  const shown = selected ? contacts.filter((c) => selected === `${c.ring}:${c.from}` || selected === `natal:${c.to}`) : contacts;

  if (hydrated && !premium) return (<div><PageHeader title="Multi-Wheel" /><PremiumGate feature="The multi-wheel" /></div>);
  if (hydrated && list.length === 0) return (<div><PageHeader title="Multi-Wheel" /><Card><EmptyState icon={<Waves />} title="No Clients with Birth Data Yet" body="Add a client with a birth date, time and place." /></Card></div>);

  return (
    <div>
      <PageHeader
        title="Multi-Wheel"
        description="The natal chart with progressions, solar arcs and transits around it. Step or play through time; contacts to the natal chart are listed below."
        actions={<div className="flex items-center gap-2"><EngineNotice /><Link href={`/app/timeline?client=${clientId}`} className="text-[13px] font-medium text-accent hover:underline">Timeline</Link></div>}
      />
      <Card className="mb-5">
        <CardBody className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Field label="Client">
            <Select value={clientId} onChange={(e) => router.replace(`/app/timeline/wheel?client=${e.target.value}`)} className="w-[220px]">
              {list.map((p) => <option key={p!.id} value={p!.id}>{personName(p)}</option>)}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-[150px]" />
          </Field>
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-ink">Step</p>
            <Segmented value={step} onChange={setStep} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "year", label: "Year" }]} />
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="icon" aria-label="Previous Session" title={prevSession ? `Previous session (${prevSession})` : "No earlier session"} disabled={!prevSession} onClick={() => prevSession && setDate(prevSession)}><ChevronsLeft /></Button>
            <Button variant="secondary" size="icon" aria-label={`Back one ${step}`} onClick={() => setDate((d) => addStep(d, step, -1))}><ChevronLeft /></Button>
            <Button size="icon" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((x) => !x)}>{playing ? <Pause /> : <Play />}</Button>
            <Button variant="secondary" size="icon" aria-label={`Forward one ${step}`} onClick={() => setDate((d) => addStep(d, step, 1))}><ChevronRight /></Button>
            <Button variant="secondary" size="icon" aria-label="Next Session" title={nextSession ? `Next session (${nextSession})` : "No later session"} disabled={!nextSession} onClick={() => nextSession && setDate(nextSession)}><ChevronsRight /></Button>
            <Button variant="ghost" size="sm" onClick={() => setDate(TODAY)}>Today</Button>
          </div>
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-ink">Rings</p>
            <div className="flex flex-wrap gap-1.5">
              {RINGS.map((r) => (
                <button key={r.key} type="button" aria-pressed={on[r.key]} onClick={() => setOn((o) => ({ ...o, [r.key]: !o[r.key] }))} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px]", on[r.key] ? "border-transparent text-white" : "border-line-strong bg-surface text-ink hover:bg-canvas-2")} style={on[r.key] ? { background: r.color } : undefined}>
                  {r.short}
                </button>
              ))}
            </div>
          </div>
          <Field label="Orb">
            <Select value={String(orb)} onChange={(e) => setOrb(Number(e.target.value))} className="w-[90px]">
              {[0.5, 1, 2, 3].map((o) => <option key={o} value={o}>{o}°</option>)}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {error && <p className="mb-4 rounded-lg border border-danger/30 bg-danger-50 px-3 py-2 text-[13px] text-danger" role="alert">{error}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardBody>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-serif text-[20px] text-ink" aria-live="polite">{fmtLong(date)}</p>
              <span className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-ink" /> Natal (Inner)</span>
                {rings.map((r) => <span key={r.key} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: r.color }} /> {r.label}</span>)}
              </span>
            </div>
            <div className={cn("mx-auto max-w-[720px] transition-opacity", data?.date !== date && "opacity-70")}>
              {data ? <MultiWheel natal={data.natal} rings={rings} contacts={contacts} selected={selected} onSelect={setSelected} /> : <div className="flex aspect-square items-center justify-center text-muted">Calculating…</div>}
            </div>
            <p className="mt-2 text-center text-[12px] text-muted">Click a planet to see only its contacts. Positions at noon UTC on the date shown.</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Contacts to the Natal Chart"
            description={selected ? `For ${selected.startsWith("natal:") ? "Natal" : RINGS.find((r) => selected.startsWith(r.key))?.label} ${BODIES[selected.split(":")[1] as keyof typeof BODIES].name} · ${shown.length}` : `${contacts.length} Within ${orb}° · Tightest First`}
            action={selected ? <button className="text-[12.5px] text-accent hover:underline" onClick={() => setSelected(null)}>Show All</button> : undefined}
          />
          <CardBody className="pt-0">
            {shown.length === 0 ? (
              <p className="text-[13px] text-muted">{rings.length ? `Nothing within ${orb}° on this date.` : "Turn on a ring above."}</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {shown.map((c) => (
                  <li key={`${c.ring}${c.from}${c.to}${c.type}`}>
                    <button type="button" onClick={() => setSelected(`${c.ring}:${c.from}`)} className="flex w-full items-center gap-2 py-1.5 text-left text-[12.5px] hover:bg-canvas-2">
                      <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="text-muted">{c.ringLabel}</span> {BODIES[c.from].name} <span className="glyph">{ASPECTS[c.type].glyph}</span> {aspectVerb(c.type)} <span className="text-muted">natal</span> {BODIES[c.to].name}
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-3">{fmtOrb(c.orb)}</span>
                      <span className={cn("w-[74px] shrink-0 text-right text-[11.5px]", c.applying ? "text-accent" : "text-muted")}>{c.applying ? "Applying" : "Separating"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
