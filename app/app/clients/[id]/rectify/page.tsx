"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { fmtDeg, signOf, SIGNS } from "@/lib/astro";
import { useStore, personName } from "@/lib/store";
import { cn, DATA_MODE, fmtClock, fmtDate, TODAY } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Breakdown, BHead, BTable } from "@/components/ui/breakdown";
import { PremiumGate, usePremium } from "@/components/plan/premium";
import { useHydrated } from "@/components/workspace/use-hydrated";

const EVENT_TYPES: { id: string; label: string }[] = [
  { id: "marriage", label: "Marriage or Committed Partnership" },
  { id: "separation", label: "Separation or Divorce" },
  { id: "child", label: "Birth of a Child" },
  { id: "career", label: "Career Change, Promotion or Graduation" },
  { id: "move", label: "Move or Change of Home" },
  { id: "long-move", label: "Long-Distance Move or Emigration" },
  { id: "parent", label: "Death or Illness of a Parent" },
  { id: "health", label: "Accident, Surgery or Illness" },
  { id: "legal", label: "Legal Issue, Lawsuit or Court Case" },
  { id: "incarceration", label: "Incarceration or Confinement" },
  { id: "other", label: "Other Major Event" },
];
// Traditional rising-sign descriptions: how the Ascendant tends to show in looks and manner.
const RISING: string[] = [
  "Brisk, direct and quick to act. Often an athletic build, a strong brow or a mark on the head or face.",
  "Calm, steady and unhurried. Often a strong neck and shoulders, a solid build and a pleasant voice.",
  "Lively, talkative and restless. Often slim and youthful, with expressive hands and quick eyes.",
  "Sensitive, protective and reserved at first. Often a round face, soft features and changeable moods.",
  "Warm, confident and noticeable. Often an upright bearing, a striking head of hair and a sense of presence.",
  "Modest, observant and precise. Often neat and slender, looking younger than their age.",
  "Charming, gracious and diplomatic. Often balanced, pleasing features and care for appearance.",
  "Intense, private and watchful. Often a penetrating gaze and strong features.",
  "Open, enthusiastic and restless. Often tall or long-limbed, with a ready laugh.",
  "Serious, composed and reserved. Often an angular frame; looks older when young and younger when older.",
  "Friendly but detached, independent and unconventional. Often a distinctive or unusual look.",
  "Gentle, receptive and dreamy. Often soft features and large, expressive eyes.",
];
// The Moon by sign: emotional nature and needs, which a client can describe without being seen.
const MOON: string[] = [
  "Quick, direct feelings; impatient. Needs independence and something to act on.",
  "Steady and comfort-loving; slow to change. Needs security, routine and physical ease.",
  "Restless; talks feelings through. Needs variety, news and conversation.",
  "Deeply feeling and protective. Needs home, family and people close.",
  "Warm, proud and generous. Needs appreciation and to be seen.",
  "Practical; prone to worry. Needs order and to be useful.",
  "Seeks harmony and avoids conflict. Needs partnership and fairness.",
  "Intense and private; feelings run deep. Needs trust and loyalty.",
  "Optimistic and restless. Needs freedom, travel and meaning.",
  "Reserved and self-reliant. Needs control, structure and achievement.",
  "Detached and independent. Needs space, friends and causes.",
  "Sensitive; absorbs others’ moods. Needs retreat, imagination and compassion.",
];
type Span = { sign: number; from: string; to: string };
// Birth circumstances (the server's CIRCUMSTANCES): the planets expected close to the Ascendant.
const CIRCS: { id: string; label: string; planets: string }[] = [
  { id: "c-section", label: "C-Section", planets: "Mars, Pluto, Uranus" },
  { id: "induced", label: "Induced Labor", planets: "Mars, Uranus" },
  { id: "instruments", label: "Forceps or Vacuum", planets: "Mars, Pluto, Saturn" },
  { id: "premature", label: "Premature", planets: "Uranus, Mars" },
  { id: "overdue", label: "Overdue or Delayed", planets: "Saturn" },
  { id: "long", label: "Long or Difficult Labor", planets: "Saturn, Pluto" },
  { id: "quick", label: "Very Quick Birth", planets: "Uranus, Mars" },
  { id: "anesthesia", label: "Anesthesia, Epidural or Medication", planets: "Neptune" },
  { id: "breech", label: "Breech or Unusual Position", planets: "Uranus, Saturn" },
  { id: "breathing", label: "Cord Around the Neck or Breathing Difficulty", planets: "Saturn, Pluto" },
  { id: "easy", label: "Easy, Smooth Birth", planets: "Jupiter, Venus" },
  { id: "large", label: "Large Baby", planets: "Jupiter" },
];
type Hit = { event: number; circumstance?: string; technique: string; from: string; to: string; aspect: string; orb: number; points: number };
type Result = {
  curve: { time: string; score: number; asc: number; mc: number }[];
  top: { time: string; utc: string; asc: number; mc: number; score: number; hits: Hit[] }[];
  weights: { techniques: Record<string, { label: string; w: number; orb: number }>; aspects: { name: string; w: number }[]; events: Record<string, { label: string; angles: Record<string, number> }> };
};
const uid = () => Math.random().toString(36).slice(2, 10);
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (m: number) => `${String(Math.floor(Math.max(0, Math.min(1439, m)) / 60)).padStart(2, "0")}:${String(Math.max(0, Math.min(1439, m)) % 60).padStart(2, "0")}`;

/** Birth-time rectification from dated life events. */
export default function RectifyPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const premium = usePremium();
  const person = useStore((s) => s.people.find((p) => p.id === id));
  const defaults = useStore((s) => s.defaults);
  const updatePerson = useStore((s) => s.updatePerson);
  const toast = useStore((s) => s.toast);
  const b = person?.birth;
  const known = b && b.timeAccuracy !== "unknown";
  const [from, setFrom] = React.useState(known ? toTime(toMin(b!.time) - 120) : "00:00");
  const [to, setTo] = React.useState(known ? toTime(toMin(b!.time) + 120) : "23:59");
  const [step, setStep] = React.useState(2);
  const [draft, setDraft] = React.useState({ date: "", type: "marriage", note: "" });
  const [result, setResult] = React.useState<Result | null>(null);
  const [ranCircs, setRanCircs] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [chosen, setChosen] = React.useState(0);
  const [spans, setSpans] = React.useState<Span[] | null>(null);
  const [moonSpans, setMoonSpans] = React.useState<Span[] | null>(null);
  const [picked, setPicked] = React.useState<number[]>([]);
  const [pickedMoon, setPickedMoon] = React.useState<number[]>([]);
  const birthKey = b ? JSON.stringify([b.date, b.lat, b.lon, b.tz, defaults.zodiac, defaults.houseSystem]) : "";
  React.useEffect(() => {
    if (!b || DATA_MODE !== "server") return;
    let live = true;
    api<{ rising: Span[]; moon: Span[] }>("/api/v1/astro/rising", { body: { birth: b, settings: { zodiac: defaults.zodiac, houseSystem: defaults.houseSystem } } })
      .then((r) => { if (live) { setSpans(r.rising); setMoonSpans(r.moon); } }, () => { if (live) { setSpans([]); setMoonSpans([]); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthKey]);

  if (!person || !b) return <PageHeader title="Rectification" description={hydrated ? "Client not found." : "Loading…"} />;
  if (hydrated && !premium) return (<div><PageHeader title="Rectification" /><PremiumGate feature="Rectification" /></div>);
  const events = person.lifeEvents ?? [];
  const sorted = [...events].sort((x, y) => x.date.localeCompare(y.date));
  const setEvents = (list: typeof events) => updatePerson(person.id, { lifeEvents: list });
  const circs = person.birthCircumstances ?? [];
  const toggleCirc = (id: string) => updatePerson(person.id, { birthCircumstances: circs.includes(id) ? circs.filter((x) => x !== id) : [...circs, id] });

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ rectify: Result }>("/api/v1/astro/rectify", {
        body: { birth: b, events: sorted.map((e) => ({ date: e.date, type: e.type })), from, to: to < from ? from : to, stepMin: step, settings: { zodiac: defaults.zodiac, houseSystem: defaults.houseSystem }, ascSigns: picked.length ? picked : undefined, moonSigns: pickedMoon.length ? pickedMoon : undefined, circumstances: circs },
      });
      setResult(r.rectify);
      setRanCircs(circs);
      setChosen(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const apply = (time: string) => {
    updatePerson(person.id, { birth: { ...b, time, timeAccuracy: "exact", rectifiedFrom: b.timeAccuracy === "unknown" ? "unknown" : b.time, rectifiedAt: TODAY } });
    toast("Birth Time Updated", `${personName(person)}’s birth time is now ${fmtClock(time)} (rectified). Charts recalculate with it.`, "success");
  };

  // Choosing rising signs sets the window to the span(s) they rise.
  // Choosing Moon and rising signs sets the window to the times both hold.
  const fit = (asc: number[], moon: number[]) => {
    if (!asc.length && !moon.length) return;
    const day = [{ from: "00:00", to: "23:59" }];
    const A = asc.length ? (spans ?? []).filter((x) => asc.includes(x.sign)) : day;
    const M = moon.length ? (moonSpans ?? []).filter((x) => moon.includes(x.sign)) : day;
    const both = A.flatMap((a) => M.map((m) => ({ from: a.from > m.from ? a.from : m.from, to: a.to < m.to ? a.to : m.to }))).filter((x) => x.from <= x.to);
    if (!both.length) { toast("No Overlap", "The Moon is never in that sign while that sign rises on this date.", "error"); return; }
    setFrom(both.map((x) => x.from).sort()[0]!);
    setTo(both.map((x) => x.to).sort().at(-1)!);
    setStep(2);
  };
  const pick = (sign: number) => {
    const next = picked.includes(sign) ? picked.filter((x) => x !== sign) : [...picked, sign];
    setPicked(next);
    fit(next, pickedMoon);
  };
  const pickMoon = (sign: number) => {
    const next = pickedMoon.includes(sign) ? pickedMoon.filter((x) => x !== sign) : [...pickedMoon, sign];
    setPickedMoon(next);
    fit(picked, next);
  };
  const recordedMoon = known && moonSpans ? moonSpans.find((x) => x.from <= b.time && b.time <= x.to) : undefined;
  const recordedSpan = known && spans ? spans.find((x) => x.from <= b.time && b.time <= x.to) : undefined;

  const maxScore = Math.max(1, ...(result?.curve.map((c) => c.score) ?? [1]));
  const top = result?.top[chosen];
  const recorded = known ? b.time : null;

  return (
    <div>
      <Link href={`/app/clients/${person.id}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> {personName(person)}</Link>
      <PageHeader
        title="Rectification"
        description={`Test candidate birth times against ${personName(person)}’s life events. Born ${fmtDate(b.date)}, ${known ? `${fmtClock(b.time)} (${b.timeAccuracy})` : "time unknown"}, ${b.place}.`}
      />
      {b.rectifiedFrom && <p className="mb-4 text-[12.5px] text-muted">Already rectified{b.rectifiedAt ? ` on ${fmtDate(b.rectifiedAt)}` : ""}: previously {b.rectifiedFrom === "unknown" ? "unknown" : fmtClock(b.rectifiedFrom)}.</p>}

      <div className="mb-5 rounded-lg border border-line bg-canvas-2 px-4 py-3 text-[12.5px] text-muted">
        <p className="mb-0.5 font-semibold text-ink">How Reliable Is This?</p>
        <p>We tested this on 10 people with birth-certificate times (Astro-Databank, rated AA) and four to seven well-dated events each, searching two hours either side. Using every technique here, primary directions included, the top candidate was within 30 minutes of the true time for 1 of the 10, which is no better than chance. Where you can judge the rising sign correctly, that alone narrows the search to about two and a half hours. Treat the ranking as a starting point and weigh the contacts listed for each candidate yourself.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Step 1: Moon Sign" description="The Moon moves about 13° a day, so on some dates it changes sign. Judge the Moon sign from the client’s emotional nature and needs; this works for clients you haven’t met." />
            <CardBody className="space-y-2 pt-0">
              {!moonSpans ? (
                <p className="flex items-center gap-2 text-[12.5px] text-muted"><Loader2 className="size-4 animate-spin" /> Finding the Moon’s sign…</p>
              ) : moonSpans.length === 0 ? (
                <p className="text-[12.5px] text-muted">The Moon’s sign couldn’t be calculated.</p>
              ) : moonSpans.length === 1 ? (
                <p className="text-[12.5px]"><span className="font-medium text-ink"><span className="glyph mr-1" aria-hidden>{SIGNS[moonSpans[0]!.sign]!.glyph}</span>Moon in {SIGNS[moonSpans[0]!.sign]!.name} All Day.</span> <span className="text-muted">It doesn’t narrow the time on this date. {MOON[moonSpans[0]!.sign]}</span></p>
              ) : (
                <>
                  <ul className="divide-y divide-line rounded-lg border border-line">
                    {moonSpans.map((x) => {
                      const on = pickedMoon.includes(x.sign);
                      return (
                        <li key={`${x.sign}-${x.from}`}>
                          <button type="button" aria-pressed={on} onClick={() => pickMoon(x.sign)} className={cn("w-full px-3 py-1.5 text-left text-[12.5px]", on ? "bg-accent/10" : "hover:bg-canvas-2")}>
                            <span className="flex items-baseline justify-between gap-2">
                              <span className={cn("font-medium", on ? "text-accent" : "text-ink")}><span className="glyph mr-1" aria-hidden>{SIGNS[x.sign]!.glyph}</span>Moon in {SIGNS[x.sign]!.name}{recordedMoon === x && <span className="ml-1.5 font-normal text-muted">(Recorded Time)</span>}</span>
                              <span className="shrink-0 tabular-nums text-muted">{fmtClock(x.from)}–{fmtClock(x.to)}</span>
                            </span>
                            <span className="mt-0.5 block text-muted">{MOON[x.sign]}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-[11.5px] text-muted">The Moon changes sign at {fmtClock(moonSpans[1]!.from)} on this date.</p>
                </>
              )}
              {moonSpans && moonSpans.length > 0 && (
                <Breakdown title="Moon Sign Guide">
                  <BTable head={["Moon Sign", "Emotional Nature and Needs"]} rows={SIGNS.map((g, i) => [g.name, MOON[i]!])} />
                </Breakdown>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Step 2: Rising Sign (Optional)" description="If you’ve met the client, judge the rising sign from appearance and manner; choosing one limits the search to the times it rises. Skip this for clients you haven’t seen, such as online orders." />
            <CardBody className="space-y-2 pt-0">
              {!spans ? (
                <p className="flex items-center gap-2 text-[12.5px] text-muted"><Loader2 className="size-4 animate-spin" /> Finding rising times…</p>
              ) : spans.length === 0 ? (
                <p className="text-[12.5px] text-muted">Rising times couldn’t be calculated.</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {spans.map((x) => {
                    const on = picked.includes(x.sign);
                    return (
                      <li key={`${x.sign}-${x.from}`}>
                        <button type="button" aria-pressed={on} onClick={() => pick(x.sign)} className={cn("flex w-full items-baseline justify-between gap-2 px-3 py-1.5 text-left text-[12.5px]", on ? "bg-accent/10" : "hover:bg-canvas-2")}>
                          <span className={cn("font-medium", on ? "text-accent" : "text-ink")}><span className="glyph mr-1" aria-hidden>{SIGNS[x.sign]!.glyph}</span>{SIGNS[x.sign]!.name} Rising{recordedSpan === x && <span className="ml-1.5 font-normal text-muted">(Recorded Time)</span>}</span>
                          <span className="shrink-0 tabular-nums text-muted">{fmtClock(x.from)}–{fmtClock(x.to)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {picked.length > 0 && (
                <div className="space-y-1 rounded-lg bg-canvas-2 px-3 py-2 text-[12.5px]">
                  {picked.map((x) => <p key={x}><span className="font-medium text-ink">{SIGNS[x]!.name} Rising:</span> <span className="text-muted">{RISING[x]}</span></p>)}
                </div>
              )}
              {spans && spans.length > 0 && (
                <Breakdown title="Rising Sign Guide">
                  <BTable head={["Rising Sign", "Typical Appearance and Manner"]} rows={SIGNS.map((g, i) => [`${g.name}`, RISING[i]!])} />
                </Breakdown>
              )}
              <p className="text-[11.5px] text-muted">Planets close to the Ascendant, and the sign and condition of its ruler, change how the rising sign shows. Choose two neighboring signs if you can’t decide.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Step 3: Birth Circumstances (Optional)" description="What’s known about the birth itself. The Ascendant describes the birth, so each one looks for its planets within 5° of the candidate’s Ascendant (conjunct, opposite or square)." />
            <CardBody className="pt-0">
              <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                {CIRCS.map((c) => (
                  <label key={c.id} className="flex items-start gap-2 text-[12.5px]">
                    <input type="checkbox" className="mt-0.5" checked={circs.includes(c.id)} onChange={() => toggleCirc(c.id)} />
                    <span><span className="text-ink">{c.label}</span> <span className="text-muted">({c.planets})</span></span>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Step 4: Life Events" description="Dated events with known dates. Five or more spread across life give the clearest result." />
            <CardBody className="space-y-3 pt-0">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input type="date" aria-label="Event date" value={draft.date} max={TODAY} min={b.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                <Button
                  size="sm"
                  disabled={!draft.date}
                  onClick={() => {
                    setEvents([...events, { id: uid(), date: draft.date, type: draft.type, note: draft.note.trim() || undefined }]);
                    setDraft({ date: "", type: draft.type, note: "" });
                  }}
                >
                  <Plus /> Add Event
                </Button>
                <Select aria-label="Event type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className="col-span-2">
                  {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </Select>
                <Input aria-label="Event note" placeholder="Note (optional), e.g. married Daniel" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className="col-span-2" />
              </div>
              {sorted.length === 0 ? (
                <p className="text-[12.5px] text-muted">No events yet.</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {sorted.map((e, i) => (
                    <li key={e.id} className="flex items-center gap-2 px-3 py-2 text-[12.5px]">
                      <span className="w-5 text-muted tabular-nums">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-ink">{fmtDate(e.date)}</span> · {EVENT_TYPES.find((t) => t.id === e.type)?.label ?? e.type}
                        {e.note && <span className="block truncate text-muted">{e.note}</span>}
                      </span>
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove event ${i + 1}`} onClick={() => setEvents(events.filter((x) => x.id !== e.id))}><Trash2 /></Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Step 5: Search Window" description={`On ${fmtDate(b.date)}, local time at the birthplace.${pickedMoon.length ? ` Only times with the Moon in ${pickedMoon.map((x) => SIGNS[x]!.name).join(" or ")}${picked.length ? " and" : ""}` : picked.length ? " Only times with" : ""}${picked.length ? ` ${picked.map((x) => SIGNS[x]!.name).join(" or ")} rising` : ""}${picked.length || pickedMoon.length ? " are tested." : ""}`} />
            <CardBody className="space-y-3 pt-0">
              <div className="grid grid-cols-3 gap-2 text-[12.5px]">
                <label><span className="mb-1 block text-muted">From</span><Input type="time" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} /></label>
                <label><span className="mb-1 block text-muted">To</span><Input type="time" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
                <label><span className="mb-1 block text-muted">Every</span>
                  <Select value={String(step)} onChange={(e) => setStep(Number(e.target.value))}>{[1, 2, 4, 5].map((m) => <option key={m} value={m}>{m} Min</option>)}</Select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {known && <Button size="sm" variant="ghost" onClick={() => { setFrom(toTime(toMin(b.time) - 30)); setTo(toTime(toMin(b.time) + 30)); setStep(1); }}>±30 Minutes</Button>}
                {known && <Button size="sm" variant="ghost" onClick={() => { setFrom(toTime(toMin(b.time) - 120)); setTo(toTime(toMin(b.time) + 120)); setStep(2); }}>±2 Hours</Button>}
                <Button size="sm" variant="ghost" onClick={() => { setFrom("00:00"); setTo("23:59"); setStep(4); }}>Whole Day</Button>
                {(picked.length > 0 || pickedMoon.length > 0) && <Button size="sm" variant="ghost" onClick={() => { setPicked([]); setPickedMoon([]); }}>Clear Signs</Button>}
              </div>
              <Button onClick={run} disabled={busy || (sorted.length === 0 && circs.length === 0) || DATA_MODE !== "server"}>
                {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Test {Math.floor((toMin(to) - toMin(from)) / step) + 1} Candidate Times
              </Button>
              {sorted.length > 0 && sorted.length < 3 && <p className="text-[12px] text-warn">With fewer than three events the result is weak; add more if you can.</p>}
              {error && <p className="text-[12.5px] text-danger" role="alert">{error}</p>}
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          {!result ? (
            <Card><CardBody className="py-12 text-center text-[13px] text-muted">Add life events and test candidate times to see the ranking.</CardBody></Card>
          ) : (
            <>
              <Card>
                <CardHeader title="Score Across the Window" description="Higher means more, tighter contacts to the angles at the events. Select a peak to see its candidate." />
                <CardBody className="pt-0">
                  <div className="relative h-[120px]">
                    <svg viewBox={`0 0 ${result.curve.length} 100`} preserveAspectRatio="none" className="absolute inset-0 size-full" role="img" aria-label="Rectification score for each candidate time">
                      <path d={`M0,100 ${result.curve.map((c, i) => `L${i + 0.5},${100 - (c.score / maxScore) * 94}`).join(" ")} L${result.curve.length},100 Z`} style={{ fill: "rgb(var(--accent) / 0.25)" }} />
                      {recorded && recorded >= result.curve[0]!.time && recorded <= result.curve[result.curve.length - 1]!.time && (
                        <line x1={result.curve.findIndex((c) => c.time >= recorded) + 0.5} x2={result.curve.findIndex((c) => c.time >= recorded) + 0.5} y1={0} y2={100} stroke="#29272B" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
                      )}
                    </svg>
                    {result.top.map((t, i) => {
                      const idx = result.curve.findIndex((c) => c.time === t.time);
                      return (
                        <button key={t.time} type="button" onClick={() => setChosen(i)} className={cn("absolute -translate-x-1/2 rounded-full border px-1.5 text-[10.5px] font-semibold", i === chosen ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink")} style={{ left: `${((idx + 0.5) / result.curve.length) * 100}%`, top: `${Math.max(0, 92 - (t.score / maxScore) * 94)}%` }}>
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-muted"><span>{fmtClock(result.curve[0]!.time)}</span>{recorded && <span>Dashed line: recorded time {fmtClock(recorded)}</span>}<span>{fmtClock(result.curve[result.curve.length - 1]!.time)}</span></div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Best Candidates" description="Candidates closer than six minutes to a better one are left out." />
                <CardBody className="pt-0">
                  <BTable
                    head={["#", "Time", "Ascendant", "Midheaven", "Score", "Hits", ""]}
                    rows={result.top.map((t, i) => [
                      i + 1,
                      <button key="t" type="button" className={cn("font-medium hover:text-accent", i === chosen && "text-accent")} onClick={() => setChosen(i)}>{fmtClock(t.time)}</button>,
                      `${fmtDeg(t.asc)} ${signOf(t.asc).name}`,
                      `${fmtDeg(t.mc)} ${signOf(t.mc).name}`,
                      t.score.toFixed(1),
                      t.hits.length,
                      <Button key="u" size="xs" variant="secondary" onClick={() => apply(t.time)}>Use This Time</Button>,
                    ])}
                  />
                </CardBody>
              </Card>

              {top && (
                <Card>
                  <CardHeader title={`Candidate ${chosen + 1}: ${fmtClock(top.time)}`} description={`Ascendant ${fmtDeg(top.asc)} ${signOf(top.asc).name} · Midheaven ${fmtDeg(top.mc)} ${signOf(top.mc).name} · Score ${top.score.toFixed(1)}`} />
                  <CardBody className="space-y-3 pt-0">
                    {ranCircs.length > 0 && (
                      <div className="rounded-lg border border-line p-3">
                        <p className="text-[13px] font-medium text-ink">Birth Circumstances</p>
                        <ul className="mt-1 space-y-0.5 text-[12.5px] text-ink-3">
                          {ranCircs.map((id) => {
                            const c = CIRCS.find((x) => x.id === id);
                            const hs = top.hits.filter((h) => h.circumstance === id).sort((x, y) => y.points - x.points);
                            return (
                              <li key={id}>
                                <span className="font-medium">{c?.label ?? id}:</span>{" "}
                                {hs.length ? hs.map((h) => `${h.from} ${h.aspect.charAt(0).toUpperCase() + h.aspect.slice(1)} ${h.to} (${h.orb.toFixed(2)}° Orb, ${h.points.toFixed(2)} Points)`).join("; ") : <span className="text-muted">None of {c?.planets ?? "its planets"} within 5° of the Ascendant.</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {sorted.map((e, i) => {
                      const hits = top.hits.filter((h) => h.event === i).sort((x, y) => y.points - x.points);
                      return (
                        <div key={e.id} className="rounded-lg border border-line p-3">
                          <p className="text-[13px] font-medium text-ink">{fmtDate(e.date)} · {EVENT_TYPES.find((t) => t.id === e.type)?.label}{e.note ? <span className="font-normal text-muted"> · {e.note}</span> : ""}</p>
                          {hits.length === 0 ? (
                            <p className="mt-1 text-[12.5px] text-muted">No contact to the angles at this time.</p>
                          ) : (
                            <ul className="mt-1 space-y-0.5 text-[12.5px] text-ink-3">
                              {hits.slice(0, 6).map((h, k) => <li key={k}>{h.from} {h.aspect.charAt(0).toUpperCase() + h.aspect.slice(1)} Natal {h.to} <span className="text-muted">({h.orb.toFixed(2)}° Orb, {h.points.toFixed(2)} Points)</span></li>)}
                              {hits.length > 6 && <li className="text-muted">+{hits.length - 6} More</li>}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                    <Breakdown>
                      <div className="space-y-1">
                        <BHead>What Is Checked at Each Event</BHead>
                        <BTable head={["Technique", "Weight", "Orb"]} rows={Object.values(result.weights.techniques).map((t) => [t.label, t.w, `${t.orb}°`])} />
                        <p>Transits use Jupiter, Saturn, Uranus, Neptune, Pluto and the North Node at noon UTC on the event date. Progressions are one day after birth for each year of life; the solar arc is the progressed Sun minus the natal Sun. Progressed angles come from the natal RAMC plus the arc. Natal points: the Sun through Pluto and the North Node.</p>
                        <p>Primary directions turn the sky after birth: a planet (with its latitude) reaches an angle when its right ascension meets the Midheaven or IC, or its oblique ascension or descension meets the Ascendant or Descendant under the birthplace latitude (the Placidus semi-arc method). Squares use the zodiacal points 90° from each planet. The arc becomes years by Naibod’s key, 0°59′08″ per year; converse directions run the sky backward. A 1° orb is about a year.</p>
                      </div>
                      <div className="space-y-1">
                        <BHead>Birth Circumstances</BHead>
                        <BTable head={["Circumstance", "Planets Near the Ascendant"]} rows={CIRCS.map((c) => [c.label, c.planets])} />
                        <p>Each chosen circumstance scores its closest matching planet within 5° of the candidate’s natal Ascendant: aspect weight × (1 − orb ÷ 5). Only conjunctions, oppositions and squares count. These pairings are traditional associations, not yet tested against births with known circumstances.</p>
                      </div>
                      <div className="space-y-1">
                        <BHead>Aspect Weights</BHead>
                        <p>{result.weights.aspects.map((a) => `${a.name.charAt(0).toUpperCase()}${a.name.slice(1)} ${a.w}`).join(" · ")}. An opposition to the Ascendant or Midheaven is counted as a conjunction to the Descendant or IC.</p>
                      </div>
                      <div className="space-y-1">
                        <BHead>Which Angle Matters for Each Event</BHead>
                        <BTable head={["Event", "ASC", "MC", "DSC", "IC"]} rows={Object.values(result.weights.events).map((e) => [e.label, e.angles.asc, e.angles.mc, e.angles.dsc, e.angles.ic])} />
                      </div>
                      <p>Points for a hit = technique weight × aspect weight × angle weight × (1 − orb ÷ maximum orb), so an exact hit scores in full and one at the edge of orb scores nothing. Each event counts its best hit plus a quarter of its second; a candidate’s score is the total over all events. Only conjunctions, oppositions and squares count. Weights are provisional; the hits listed above are the evidence to judge.</p>
                    </Breakdown>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
