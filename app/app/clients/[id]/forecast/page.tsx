"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarSearch, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useStore, personName } from "@/lib/store";
import { cn, DATA_MODE, fmtDate, TODAY } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Breakdown, BHead, BTable } from "@/components/ui/breakdown";
import { PremiumGate, usePremium } from "@/components/plan/premium";
import { useHydrated } from "@/components/workspace/use-hydrated";

type Theme = "money" | "career" | "home" | "love";
const THEMES: { id: Theme; label: string; election: string }[] = [
  { id: "money", label: "Money", election: "contract" },
  { id: "career", label: "Career & Reputation", election: "launch" },
  { id: "home", label: "Home & Family", election: "move" },
  { id: "love", label: "Love & Marriage", election: "relationship" },
];
type FEvent = { date: string; start?: string; end?: string; chart: string; kind: string; text: string; tone: "+" | "~" | "-"; weight: number; themes: Theme[] };
type Month = { month: string; score: number; pos: number; neg: number; charts: Record<string, number> };
type Win = { from: string; to: string; score: number; charts: number; peak: string };
type Result = {
  from: string; to: string; themes: Theme[]; events: FEvent[];
  scores: Record<string, { monthly: Month[]; windows: Win[] }>;
  retrogrades: { planet: string; start: string; end: string }[];
  targets?: { label: string; lon: number; themes: Theme[] }[];
  davison?: { date: string; time: string; lat: number; lon: number };
  weights: Record<string, string>;
};

const monthName = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const monthEnd = (m: string) => { const d = new Date(`${m}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return d.toISOString().slice(0, 10); };
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** When the techniques agree: ranked windows for money, career, home and love, for one person or a couple. */
export default function ForecastPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const premium = usePremium();
  const people = useStore((s) => s.people);
  const defaults = useStore((s) => s.defaults);
  const person = people.find((p) => p.id === id);
  const [from, setFrom] = React.useState(TODAY);
  const [years, setYears] = React.useState(3);
  const [themes, setThemes] = React.useState<Theme[]>(["money", "career", "home", "love"]);
  const [partnerId, setPartnerId] = React.useState("");
  const [result, setResult] = React.useState<Result | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!person) return <PageHeader title="Forecast" description={hydrated ? "Client not found." : "Loading…"} />;
  if (hydrated && !premium) return (<div><PageHeader title="Forecast" /><PremiumGate feature="Forecast" /></div>);
  const partner = people.find((p) => p.id === partnerId);
  const candidates = people.filter((p) => p.id !== person.id && p.birth?.date);
  const maxYears = partner ? 4 : 6;
  const known = person.birth.timeAccuracy !== "unknown" && (!partner || partner.birth.timeAccuracy !== "unknown");
  const chartName = (c: string) => (c === "You" ? person.firstName : c === "Them" ? partner?.firstName ?? "Partner" : c);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const settings = { zodiac: defaults.zodiac, houseSystem: defaults.houseSystem };
      const y = Math.min(years, maxYears);
      const r = partner
        ? await api<{ forecast: Result }>("/api/v1/astro/couple-forecast", { body: { a: person.birth, b: partner.birth, settings, from, years: y, themes } })
        : await api<{ forecast: Result }>("/api/v1/astro/forecast", { body: { birth: person.birth, settings, from, years: y, themes } });
      setResult(r.forecast);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link href={`/app/clients/${person.id}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> {personName(person)}</Link>
      <PageHeader title="Forecast" description={`When the techniques agree for ${personName(person)}${partner ? ` and ${personName(partner)}` : ""}: transits, progressions, solar arcs, midpoints, eclipses${partner ? ", the composite and Davison charts" : ", profections, firdaria and zodiacal releasing"}.`} />

      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[150px_120px_minmax(0,1fr)_220px_auto] xl:items-end">
          <label className="text-[12.5px]"><span className="mb-1 block text-muted">From</span><Input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} /></label>
          <label className="text-[12.5px]"><span className="mb-1 block text-muted">Years</span>
            <Select value={String(Math.min(years, maxYears))} onChange={(e) => setYears(Number(e.target.value))}>{Array.from({ length: maxYears }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? "Year" : "Years"}</option>)}</Select>
          </label>
          <fieldset className="text-[12.5px]">
            <legend className="mb-1 text-muted">Themes</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
              {THEMES.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={themes.includes(t.id)} onChange={() => setThemes(themes.includes(t.id) ? themes.filter((x) => x !== t.id) : [...themes, t.id])} /> {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="text-[12.5px]"><span className="mb-1 block text-muted">Together With (Optional)</span>
            <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
              <option value="">Just {person.firstName}</option>
              {candidates.map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}
            </Select>
          </label>
          <Button onClick={run} disabled={busy || themes.length === 0 || DATA_MODE !== "server"}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Find Windows</Button>
        </CardBody>
        {!known && <p className="px-5 pb-4 text-[12px] text-warn">A birth time is unknown, so angles, houses and directions to them aren’t reliable; treat the windows as rough.</p>}
        {error && <p className="px-5 pb-4 text-[12.5px] text-danger" role="alert">{error}</p>}
      </Card>

      {!result ? (
        <Card><CardBody className="py-12 text-center text-[13px] text-muted">Choose the themes and range, then find the windows.</CardBody></Card>
      ) : (
        <div className="space-y-5">
          {result.themes.map((t) => (
            <ThemeCard key={t} theme={THEMES.find((x) => x.id === t)!} result={result} clientId={person.id} chartName={chartName} couple={!!partner} />
          ))}
          <Card>
            <CardHeader title="Dates to Avoid for Signing and Commitments" description="Mercury retrograde slows contracts and paperwork; Venus retrograde, money and relationship commitments." />
            <CardBody className="pt-0">
              <ul className="space-y-1 text-[12.5px]">
                {result.retrogrades.map((r, i) => <li key={i}><span className="font-medium text-ink">{r.planet} Retrograde</span> <span className="text-muted">{fmtDate(r.start)} – {fmtDate(r.end)}</span></li>)}
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Breakdown>
                {Object.entries(result.weights).map(([k, v]) => (
                  <div key={k} className="space-y-1"><BHead>{k.charAt(0).toUpperCase() + k.slice(1)}</BHead><p>{v}</p></div>
                ))}
                {result.targets && <BTable className="min-w-0" head={["Point Watched", "Themes"]} rows={result.targets.map((x) => [x.label, x.themes.map((t) => THEMES.find((y) => y.id === t)!.label).join(", ")])} />}
                {result.davison && <p>Davison chart: {result.davison.date} {result.davison.time} UTC at {result.davison.lat.toFixed(2)}°, {result.davison.lon.toFixed(2)}°. Composite: the midpoints of the two charts, houses Whole Sign from the composite Ascendant; composite directions are the midpoints of the two people’s directions.</p>}
                <p>Houses are Whole Sign from the Ascendant (traditional), whatever the chart’s display setting. Solar returns aren’t scored here because they depend on where the person is each birthday; cast them separately.</p>
              </Breakdown>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function ThemeCard({ theme, result, clientId, chartName, couple }: { theme: { id: Theme; label: string; election: string }; result: Result; clientId: string; chartName: (c: string) => string; couple: boolean }) {
  const s = result.scores[theme.id]!;
  const [open, setOpen] = React.useState(0);
  const max = Math.max(1, ...s.monthly.map((m) => Math.max(m.pos, m.neg)));
  const inWin = (m: string) => s.windows.some((w) => m >= w.from && m <= w.to);
  const evidence = (w: Win) => {
    const a = `${w.from}-01`, b = monthEnd(w.to);
    const ev = result.events.filter((e) => e.themes.includes(theme.id) && (e.start && e.end && e.kind === "timing" ? e.start <= b && e.end >= a : e.date >= a && e.date <= b));
    return {
      good: ev.filter((e) => e.tone !== "-").sort((x, y) => y.weight - x.weight),
      bad: ev.filter((e) => e.tone === "-"),
      rx: result.retrogrades.filter((r) => r.start <= b && r.end >= a && (r.planet === "Mercury" || theme.id !== "career")),
    };
  };
  return (
    <Card>
      <CardHeader title={theme.label} description={s.windows.length ? `${s.windows.length} window${s.windows.length > 1 ? "s" : ""}, strongest first${couple ? " (ranked by how many charts agree)" : ""}.` : "No month reached the threshold in this range."} />
      <CardBody className="space-y-4 pt-0">
        <div>
          <svg viewBox={`0 0 ${s.monthly.length * 10} 64`} preserveAspectRatio="none" className="h-[72px] w-full" role="img" aria-label={`${theme.label} score by month`}>
            {s.monthly.map((m, i) => (
              <g key={m.month}>
                {inWin(m.month) && <rect x={i * 10} y={0} width={10} height={64} className="fill-accent/10" />}
                <rect x={i * 10 + 1.5} y={40 - (m.pos / max) * 38} width={7} height={(m.pos / max) * 38} className="fill-accent/70" />
                <rect x={i * 10 + 1.5} y={41} width={7} height={(m.neg / max) * 22} className="fill-muted/50" />
              </g>
            ))}
            <line x1={0} x2={s.monthly.length * 10} y1={40.5} y2={40.5} className="stroke-line" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-0.5 flex justify-between text-[11px] text-muted"><span>{monthName(s.monthly[0]!.month)}</span><span>Above the line: support · Below: pressure · Shaded: windows</span><span>{monthName(s.monthly.at(-1)!.month)}</span></div>
        </div>
        <ol className="space-y-2">
          {s.windows.map((w, i) => {
            const ev = evidence(w);
            const start = w.from < result.from.slice(0, 7) ? result.from : `${w.from}-01` < result.from ? result.from : `${w.from}-01`;
            const end = monthEnd(w.to) < addDays(start, 119) ? monthEnd(w.to) : addDays(start, 119);
            return (
              <li key={i} className="rounded-lg border border-line">
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left">
                  <span className="text-[13px] font-medium text-ink">{i + 1}. {w.from === w.to ? monthName(w.from) : `${monthName(w.from)} – ${monthName(w.to)}`}{w.from !== w.to && <span className="font-normal text-muted"> · Peak {monthName(w.peak)}</span>}</span>
                  <span className="shrink-0 text-[12px] text-muted">Score {w.score}{couple ? ` · ${w.charts} of 4 Charts` : ""}</span>
                </button>
                {open === i && (
                  <div className="space-y-2 border-t border-line px-3 py-2 text-[12.5px]">
                    <ul className="space-y-0.5 text-ink-3">
                      {ev.good.slice(0, 10).map((e, k) => <li key={k}><span className="tabular-nums text-muted">{e.kind === "timing" && e.start && e.end ? `${fmtDate(e.start)} – ${fmtDate(e.end)}` : fmtDate(e.date)}</span> · {couple && <span className="font-medium">{chartName(e.chart)}: </span>}{e.text}</li>)}
                      {ev.good.length > 10 && <li className="text-muted">+{ev.good.length - 10} More</li>}
                    </ul>
                    {(ev.bad.length > 0 || ev.rx.length > 0) && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Cautions</p>
                        <ul className="space-y-0.5 text-ink-3">
                          {ev.bad.map((e, k) => <li key={k}><span className="tabular-nums text-muted">{fmtDate(e.date)}</span> · {couple && <span className="font-medium">{chartName(e.chart)}: </span>}{e.text}</li>)}
                          {ev.rx.map((r, k) => <li key={`r${k}`}>{r.planet} Retrograde {fmtDate(r.start)} – {fmtDate(r.end)}</li>)}
                        </ul>
                      </div>
                    )}
                    <ButtonLink size="sm" variant="secondary" href={`/app/charts/new?type=election&client=${clientId}&event=${theme.election}&from=${start}&to=${end}`}><CalendarSearch /> Pick a Date in This Window</ButtonLink>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}
