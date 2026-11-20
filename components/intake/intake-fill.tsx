"use client";

import * as React from "react";
import { CheckCircle2, Send } from "lucide-react";
import type { IntakeAnswers, IntakeSection } from "@/lib/data/types";
import type { BirthData } from "@/lib/astro/types";
import type { LifeEvent } from "@/lib/life-events";
import { SECTION_INFO, sectionLabel } from "@/lib/intake";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { PlaceLookup, type PlaceValue } from "@/components/clients/place-lookup";
import { LifeEventsEditor } from "./life-events-editor";

const pad = (n: number) => String(n).padStart(2, "0");
const localNow = () => {
  const d = new Date();
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

export interface IntakeFillProps {
  title: string;
  intro?: string | null;
  sections: IntakeSection[];
  /** Birth details the astrologer already has: shown for the client to confirm or correct. */
  knownBirth?: Partial<BirthData> | null;
  /** Public pages search places through the public endpoint. */
  placesEndpoint?: string;
  onSubmit: (answers: IntakeAnswers) => Promise<void>;
}

/** An intake form as the client sees it. */
export function IntakeFill({ title, intro, sections, knownBirth, placesEndpoint, onSubmit }: IntakeFillProps) {
  const kb = knownBirth?.date ? knownBirth : null;
  const [birth, setBirth] = React.useState({ date: kb?.date ?? "", time: kb && kb.timeAccuracy !== "unknown" ? (kb.time ?? "") : "", unknown: kb?.timeAccuracy === "unknown", approximate: kb?.timeAccuracy === "approximate", source: "" });
  const [birthPlace, setBirthPlace] = React.useState<PlaceValue | null>(kb?.place && kb.lat !== undefined ? { place: kb.place, lat: kb.lat, lon: kb.lon!, tz: kb.tz! } : null);
  const [contact, setContact] = React.useState({ preferredName: "", pronouns: "", phone: "" });
  const [goals, setGoals] = React.useState("");
  const [events, setEvents] = React.useState<LifeEvent[]>([]);
  const [horary, setHorary] = React.useState(() => ({ question: "", ...localNow() }));
  const [horaryPlace, setHoraryPlace] = React.useState<PlaceValue | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const out: IntakeAnswers = {};
    for (const s of sections) {
      if (s.kind === "birth") {
        const any = birth.date || birthPlace;
        if (s.required || any) {
          if (!birth.date || !birthPlace) return setError("Please add your date and place of birth.");
          if (!birth.unknown && !birth.time) return setError("Please add your birth time, or tick “I don’t know my birth time”.");
          out.birth = { date: birth.date, ...(birth.unknown ? {} : { time: birth.time }), timeAccuracy: birth.unknown ? "unknown" : birth.approximate ? "approximate" : "exact", ...(birth.source.trim() ? { timeSource: birth.source.trim() } : {}), ...birthPlace };
        }
      } else if (s.kind === "contact") {
        const c = Object.fromEntries(Object.entries(contact).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
        if (Object.keys(c).length) out.contact = c;
      } else if (s.kind === "goals") {
        if (s.required && !goals.trim()) return setError(`Please answer “${sectionLabel(s)}”.`);
        if (goals.trim()) out.goals = goals.trim();
      } else if (s.kind === "lifeEvents") {
        if (s.required && !events.length) return setError("Please add at least one life event (use “Add Event”).");
        if (events.length) out.lifeEvents = events;
      } else if (s.kind === "horary") {
        if (!horary.question.trim()) return setError("Please write your question.");
        if (!horaryPlace) return setError("Please add where you were when you asked the question.");
        out.horary = { question: horary.question.trim(), date: horary.date, time: horary.time, ...horaryPlace };
      } else {
        const v = answers[s.id];
        const empty = Array.isArray(v) ? !v.length : !String(v ?? "").trim();
        if (s.required && empty) return setError(`Please answer “${sectionLabel(s)}”.`);
        if (!empty) (out.questions ??= {})[s.id] = Array.isArray(v) ? v : String(v).trim();
      }
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(out);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
        <CheckCircle2 className="size-10 text-sage-dark" />
        <h2 className="font-serif text-[24px] text-ink">Thank You</h2>
        <p className="max-w-md text-[14px] text-muted">Your answers have been sent to your astrologer.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div>
        <h2 className="font-serif text-[26px] leading-tight text-ink">{title}</h2>
        {intro && <p className="mt-2 whitespace-pre-line text-[14px] text-ink-3">{intro}</p>}
      </div>
      {sections.map((s) => (
        <fieldset key={s.id} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
          <legend className="sr-only">{sectionLabel(s)}</legend>
          <div>
            <h3 className="text-[15px] font-semibold text-ink">{sectionLabel(s)}{s.required || s.kind === "horary" ? <span className="text-accent"> *</span> : <span className="ml-1.5 text-[12px] font-normal text-muted">Optional</span>}</h3>
            {(s.help || (s.kind !== "question" && SECTION_INFO[s.kind].help)) && <p className="mt-1 text-[13px] text-muted">{s.help || (s.kind !== "question" ? SECTION_INFO[s.kind].help : "")}</p>}
          </div>
          {s.kind === "birth" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {kb && <p className="text-[12.5px] text-muted sm:col-span-2">This is what your astrologer has. Correct anything that’s wrong.</p>}
              <Field label="Date of Birth" htmlFor={`${s.id}-d`}><Input id={`${s.id}-d`} type="date" value={birth.date} onChange={(e) => setBirth({ ...birth, date: e.target.value })} max="2100-12-31" /></Field>
              <Field label="Time of Birth" htmlFor={`${s.id}-t`}><Input id={`${s.id}-t`} type="time" value={birth.time} onChange={(e) => setBirth({ ...birth, time: e.target.value })} disabled={birth.unknown} /></Field>
              <div className="flex flex-wrap gap-x-5 gap-y-1 sm:col-span-2">
                <Checkbox label={<span className="text-[13px]">I don’t know my birth time</span>} checked={birth.unknown} onChange={(e) => setBirth({ ...birth, unknown: e.target.checked })} />
                {!birth.unknown && <Checkbox label={<span className="text-[13px]">The time is approximate</span>} checked={birth.approximate} onChange={(e) => setBirth({ ...birth, approximate: e.target.checked })} />}
              </div>
              {!birth.unknown && <Field label="Where Does the Time Come From?" htmlFor={`${s.id}-src`} optional className="sm:col-span-2"><Input id={`${s.id}-src`} value={birth.source} onChange={(e) => setBirth({ ...birth, source: e.target.value })} placeholder="e.g. Birth certificate, my mother’s memory" maxLength={200} /></Field>}
              <Field label="Place of Birth" htmlFor={`${s.id}-p`} className="sm:col-span-2"><PlaceLookup id={`${s.id}-p`} value={birthPlace} onChange={setBirthPlace} endpoint={placesEndpoint} /></Field>
            </div>
          )}
          {s.kind === "contact" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Preferred Name" htmlFor={`${s.id}-n`} optional><Input id={`${s.id}-n`} value={contact.preferredName} onChange={(e) => setContact({ ...contact, preferredName: e.target.value })} maxLength={100} /></Field>
              <Field label="Pronouns" htmlFor={`${s.id}-pr`} optional><Input id={`${s.id}-pr`} value={contact.pronouns} onChange={(e) => setContact({ ...contact, pronouns: e.target.value })} maxLength={60} /></Field>
              <Field label="Phone" htmlFor={`${s.id}-ph`} optional><Input id={`${s.id}-ph`} type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} maxLength={60} /></Field>
            </div>
          )}
          {s.kind === "goals" && <Textarea aria-label={sectionLabel(s)} value={goals} onChange={(e) => setGoals(e.target.value)} rows={4} maxLength={5000} />}
          {s.kind === "lifeEvents" && <LifeEventsEditor value={events} onChange={setEvents} idPrefix={s.id} />}
          {s.kind === "horary" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Your Question" htmlFor={`${s.id}-q`} className="sm:col-span-2"><Textarea id={`${s.id}-q`} value={horary.question} onChange={(e) => setHorary({ ...horary, question: e.target.value })} rows={3} maxLength={2000} placeholder="e.g. Will I get the job I interviewed for on Monday?" /></Field>
              <Field label="Date You Asked" htmlFor={`${s.id}-hd`}><Input id={`${s.id}-hd`} type="date" value={horary.date} onChange={(e) => setHorary({ ...horary, date: e.target.value })} /></Field>
              <Field label="Time You Asked" htmlFor={`${s.id}-ht`}><Input id={`${s.id}-ht`} type="time" value={horary.time} onChange={(e) => setHorary({ ...horary, time: e.target.value })} /></Field>
              <Field label="Where You Were" htmlFor={`${s.id}-hp`} className="sm:col-span-2"><PlaceLookup id={`${s.id}-hp`} value={horaryPlace} onChange={setHoraryPlace} endpoint={placesEndpoint} /></Field>
            </div>
          )}
          {s.kind === "question" && <QuestionInput s={s} value={answers[s.id]} onChange={(v) => setAnswers({ ...answers, [s.id]: v })} />}
        </fieldset>
      ))}
      {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
      <Button type="submit" disabled={busy}><Send /> {busy ? "Sending…" : "Send to Your Astrologer"}</Button>
    </form>
  );
}

function QuestionInput({ s, value, onChange }: { s: IntakeSection; value: string | string[] | undefined; onChange: (v: string | string[]) => void }) {
  const label = sectionLabel(s);
  if (s.answer === "long") return <Textarea aria-label={label} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={4} maxLength={5000} />;
  if (s.answer === "date") return <Input aria-label={label} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="max-w-[220px]" />;
  if (s.answer === "choice")
    return (
      <Select aria-label={label} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="max-w-md">
        <option value="">Choose…</option>
        {(s.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    );
  if (s.answer === "multi") {
    const v = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-1" role="group" aria-label={label}>
        {(s.options ?? []).map((o) => <Checkbox key={o} label={<span className="text-[13px]">{o}</span>} checked={v.includes(o)} onChange={(e) => onChange(e.target.checked ? [...v, o] : v.filter((x) => x !== o))} />)}
      </div>
    );
  }
  return <Input aria-label={label} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} maxLength={5000} />;
}
