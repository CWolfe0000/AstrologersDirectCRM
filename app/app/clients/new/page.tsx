"use client";

import { selectIntakeForms } from "@/lib/intake";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Sparkles, AlertTriangle, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { flushNow } from "@/lib/sync";
import { sendIntakeForm } from "@/components/intake/send";
import { DATA_MODE } from "@/lib/utils";
import { useChartView } from "@/components/chart/chart-helpers";
import { BODIES, fmtDeg, signOf, HOUSE_SYSTEMS, type BirthData, type HouseSystem } from "@/lib/astro";
import type { ChartRecord, Person } from "@/lib/data/types";
import { cn, fmtDate, fmtClock, TODAY } from "@/lib/utils";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { EngineNotice } from "@/components/chart/chart-helpers";
import { PlaceLookup, type PlaceValue } from "@/components/clients/place-lookup";

const STEPS = ["Contact details", "Birth data", "Natal chart", "Review & save"];

export default function NewClientPage() {
  const router = useRouter();
  const s = useStore();
  const [step, setStep] = React.useState(0);
  const [contact, setContact] = React.useState({ firstName: "", lastName: "", email: "", phone: "", pronouns: "", source: "", tags: "", notes: "" });
  const [birth, setBirth] = React.useState({ date: "", time: "12:00", timeAccuracy: "exact" as BirthData["timeAccuracy"] });
  const [place, setPlace] = React.useState<PlaceValue | null>(null);
  const [houseSystem, setHouseSystem] = React.useState<HouseSystem>(s.defaults.houseSystem);
  const [invite, setInvite] = React.useState(true);
  const intakeForms = useStore(selectIntakeForms);
  const [formId, setFormId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const c = (k: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContact((x) => ({ ...x, [k]: e.target.value }));

  const contactOk = contact.firstName.trim() && contact.lastName.trim() && /.+@.+\..+/.test(contact.email);
  const birthOk = !!birth.date && !!place && (birth.timeAccuracy === "unknown" || !!birth.time);
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();

  const effectiveHouse: HouseSystem = birth.timeAccuracy === "unknown" ? "whole-sign" : houseSystem;
  const tempPerson: Person | null = birthOk
    ? {
        id: "__new",
        firstName: contact.firstName,
        lastName: contact.lastName,
        birth: { date: birth.date, time: birth.timeAccuracy === "unknown" ? "12:00" : birth.time, timeAccuracy: birth.timeAccuracy, place: place!.place, lat: place!.lat, lon: place!.lon, tz: place!.tz },
      }
    : null;
  const tempKey = JSON.stringify(tempPerson);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const extraPeople = React.useMemo(() => (tempPerson ? [tempPerson] : undefined), [tempKey]);
  const tempChart = React.useMemo<ChartRecord | undefined>(
    () => (tempPerson ? { id: "__new", title: "", type: "natal", personIds: ["__new"], clientId: "__new", createdAt: "", updatedAt: "", settings: { houseSystem: effectiveHouse } } : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tempKey, effectiveHouse],
  );
  const view = useChartView(tempChart, undefined, extraPeople);

  const canNext = step === 0 ? contactOk : step === 1 ? birthOk : true;

  const save = async () => {
    if (!tempPerson) return;
    setSaving(true);
    const client = s.addClient(
      {
        email: contact.email.trim(),
        phone: contact.phone.trim() || undefined,
        pronouns: contact.pronouns.trim() || undefined,
        status: "new",
        source: contact.source.trim() || undefined,
        tags: contact.tags.split(",").map((t) => t.trim()).filter(Boolean),
        // With live data the invitation endpoint marks the client invited once the email is sent.
        portalAccess: invite && DATA_MODE === "demo" ? "invited" : "none",
        summary: contact.notes.trim() || undefined,
      },
      { firstName: contact.firstName.trim(), lastName: contact.lastName.trim(), birth: tempPerson.birth },
    );
    const chart = s.addChart({
      title: `${fullName} — Natal${birth.timeAccuracy === "unknown" ? " (noon, whole sign)" : birth.timeAccuracy === "approximate" ? " (approx. time)" : ""}`,
      type: "natal",
      personIds: [client.id],
      clientId: client.id,
      settings: { houseSystem: effectiveHouse },
    });
    void chart;
    if (invite && DATA_MODE === "server") {
      try {
        await flushNow();
        const form = intakeForms.find((f) => f.id === formId);
        if (form) await sendIntakeForm(form, client.id);
        else await api("/api/v1/portal/invite", { body: { clientId: client.id } });
        useStore.setState((st) => ({ clients: st.clients.map((c) => (c.id === client.id ? { ...c, portalAccess: "invited" } : c)) }));
        s.toast("Client Created", `${fullName}'s record and natal chart have been saved, and a portal invitation${form ? ` with “${form.title}”` : ""} was emailed to ${contact.email.trim()}.`, "success");
      } catch (e) {
        s.toast("Client Created, Invitation Not Sent", `${(e as Error).message} You can send it from the client’s menu.`, "error");
      }
    } else {
      s.toast("Client Created", `${fullName}'s record and natal chart have been saved.${invite ? " Portal invitation queued (simulated in the demo)." : ""}`, "success");
    }
    router.push(`/app/clients/${client.id}`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Add a New Client"
        description="Create the client record, enter birth data and generate their natal chart in one pass."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Clients", href: "/app/clients" }, { label: "New Client" }]}
      />

      {/* Stepper */}
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              disabled={i > step && !(i === step + 1 && canNext)}
              onClick={() => i <= step && setStep(i)}
              className="group flex w-full flex-col items-start gap-2 text-left disabled:cursor-not-allowed"
            >
              <span className={cn("h-1 w-full rounded-full", i <= step ? "bg-accent" : "bg-line")} />
              <span className="flex items-center gap-2 text-[12.5px]">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    i < step ? "bg-accent text-white" : i === step ? "border border-accent text-accent" : "border border-line-strong text-muted",
                  )}
                >
                  {i < step ? <Check className="size-3" /> : i + 1}
                </span>
                <span className={cn("hidden sm:inline", i === step ? "font-medium text-ink" : "text-muted")}>{label}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <CardBody className="p-5 md:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <StepTitle title="Contact Details" body="How you'll reach this client. Only name and email are required." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name" htmlFor="fn"><Input id="fn" value={contact.firstName} onChange={c("firstName")} autoFocus /></Field>
                <Field label="Last Name" htmlFor="ln"><Input id="ln" value={contact.lastName} onChange={c("lastName")} /></Field>
                <Field label="Email" htmlFor="em"><Input id="em" type="email" value={contact.email} onChange={c("email")} placeholder="name@example.com" /></Field>
                <Field label="Phone" htmlFor="ph" optional><Input id="ph" value={contact.phone} onChange={c("phone")} /></Field>
                <Field label="Pronouns" htmlFor="pr" optional><Input id="pr" value={contact.pronouns} onChange={c("pronouns")} placeholder="e.g. she/her" /></Field>
                <Field label="How Did They Find You?" htmlFor="src" optional><Input id="src" value={contact.source} onChange={c("source")} placeholder="Referral, website, podcast…" /></Field>
                <Field label="Tags" htmlFor="tg" optional hint="Comma-separated, e.g. Career, Relationship" className="sm:col-span-2"><Input id="tg" value={contact.tags} onChange={c("tags")} /></Field>
                <Field label="Intake Notes" htmlFor="nt" optional className="sm:col-span-2"><Textarea id="nt" value={contact.notes} onChange={c("notes")} placeholder="What are they hoping to explore?" /></Field>
              </div>
              <Button variant="link" size="sm" onClick={() => {
                setContact({ firstName: "Lena", lastName: "Fischer", email: "lena.fischer@example.com", phone: "", pronouns: "she/her", source: "Website", tags: "First reading, Career", notes: "Wants to understand a career change in 2027." });
                setBirth({ date: "1991-07-08", time: "06:25", timeAccuracy: "exact" });
                setPlace({ place: "Paris, France", lat: 48.86, lon: 2.35, tz: "Europe/Paris" });
              }}>
                <Sparkles /> Fill with Sample Client
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <StepTitle title="Birth Data" body={`Used to calculate ${contact.firstName || "the client"}'s natal chart. You can refine this later.`} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date of Birth" htmlFor="bd"><Input id="bd" type="date" value={birth.date} onChange={(e) => setBirth((b) => ({ ...b, date: e.target.value }))} max={TODAY} /></Field>
                <Field label="Time of Birth" htmlFor="bt" hint={birth.timeAccuracy === "unknown" ? "A noon chart with whole-sign houses will be used." : "Local time at the place of birth."}>
                  <Input id="bt" type="time" value={birth.time} disabled={birth.timeAccuracy === "unknown"} onChange={(e) => setBirth((b) => ({ ...b, time: e.target.value }))} />
                </Field>
                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-[13px] font-medium">How reliable is the birth time?</p>
                  <Segmented
                    value={birth.timeAccuracy}
                    onChange={(v) => setBirth((b) => ({ ...b, timeAccuracy: v }))}
                    options={[
                      { value: "exact", label: "Exact (Recorded)" },
                      { value: "approximate", label: "Approximate" },
                      { value: "unknown", label: "Unknown" },
                    ]}
                  />
                  {birth.timeAccuracy !== "exact" && (
                    <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-warn">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      House placements and angles will be flagged as uncertain throughout the client&apos;s record.
                    </p>
                  )}
                </div>
                <Field label="Place of Birth" htmlFor="bp" className="sm:col-span-2"><PlaceLookup id="bp" value={place} onChange={setPlace} /></Field>
              </div>
            </div>
          )}

          {step === 2 && view && (
            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <StepTitle title={`${fullName} — Natal`} body={`${fmtDate(birth.date)}${birth.timeAccuracy !== "unknown" ? ` · ${fmtClock(birth.time)}` : " · time unknown"} · ${place?.place}`} />
                  <EngineNotice compact />
                </div>
                <div className="mx-auto max-w-[520px]">
                  <ChartWheel view={view} />
                </div>
              </div>
              <div className="space-y-4">
                <Field label="House System" htmlFor="hs" hint={birth.timeAccuracy === "unknown" ? "Whole sign is used when the birth time is unknown." : undefined}>
                  <Select id="hs" value={effectiveHouse} disabled={birth.timeAccuracy === "unknown"} onChange={(e) => setHouseSystem(e.target.value as HouseSystem)}>
                    {HOUSE_SYSTEMS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </Select>
                </Field>
                <div className="rounded-lg border border-line">
                  <p className="border-b border-line px-3 py-2 text-[12px] font-semibold text-muted">Key placements</p>
                  <ul className="divide-y divide-line text-[13px]">
                    {(["sun", "moon", "mercury", "venus", "mars"] as const).map((id) => {
                      const b = view.inner.bodies.find((x) => x.id === id);
                      if (!b) return null;
                      return (
                        <li key={id} className="flex items-center justify-between px-3 py-1.5">
                          <span className="flex items-center gap-2"><span className="glyph w-4 text-center">{BODIES[id].glyph}</span>{BODIES[id].name}</span>
                          <span className="text-muted">{fmtDeg(b.lon, true)} · H{b.house}</span>
                        </li>
                      );
                    })}
                    <li className="flex items-center justify-between px-3 py-1.5">
                      <span>Ascendant</span>
                      <span className={cn("text-muted", birth.timeAccuracy !== "exact" && "text-warn")}>{signOf(view.inner.asc).name}{birth.timeAccuracy !== "exact" && " (uncertain)"}</span>
                    </li>
                  </ul>
                </div>
                <p className="flex items-start gap-1.5 text-[12px] text-muted"><Info className="mt-0.5 size-3.5 shrink-0" />The chart will be saved to the client record and opens in the Chart Workspace for full analysis.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <StepTitle title="Review & Save" body="Everything below will be created together." />
              <div className="grid gap-4 md:grid-cols-3">
                <Summary title="Client Record" rows={[["Name", fullName], ["Email", contact.email], ["Phone", contact.phone || "—"], ["Status", "New"]]} />
                <Summary title="Birth Data" rows={[["Date", fmtDate(birth.date)], ["Time", birth.timeAccuracy === "unknown" ? "Unknown" : `${fmtClock(birth.time)} (${birth.timeAccuracy})`], ["Place", place?.place ?? ""], ["Time zone", place?.tz ?? ""]]} />
                <Summary title="Natal Chart" rows={[["Chart", `${fullName} — Natal`], ["House system", HOUSE_SYSTEMS.find((h) => h.id === effectiveHouse)!.name], ["Zodiac", "Tropical"], ["Engine", "Demonstration"]]} />
              </div>
              <div className="rounded-lg border border-line bg-canvas/60 p-4">
                <Checkbox checked={invite} onChange={(e) => setInvite(e.target.checked)} label={<span>Invite {contact.firstName} to the client portal{DATA_MODE === "demo" && <span className="text-muted"> (email invitation is simulated in the demo)</span>}</span>} />
                {invite && intakeForms.length > 0 && (
                  <label className="mt-3 block max-w-sm">
                    <span className="mb-1 block text-[12.5px] font-medium text-ink-3">Intake Form to Include</span>
                    <Select value={formId} onChange={(e) => setFormId(e.target.value)}>
                      <option value="">No Form</option>
                      {intakeForms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                    </Select>
                  </label>
                )}
              </div>
            </div>
          )}
        </CardBody>
        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3.5 md:px-8">
          <Button variant="ghost" onClick={() => (step === 0 ? router.push("/app/clients") : setStep(step - 1))}>
            <ChevronLeft /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
              {step === 1 ? "Generate natal chart" : step === 2 ? "Continue" : "Next"} <ChevronRight />
            </Button>
          ) : (
            <Button onClick={save} disabled={saving}>
              <Check /> Save Client & Chart
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function StepTitle({ title, body }: { title: string; body?: string }) {
  return (
    <div>
      <h2 className="font-serif text-[24px] leading-tight">{title}</h2>
      {body && <p className="mt-1 text-[13px] text-muted">{body}</p>}
    </div>
  );
}

function Summary({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="eyebrow mb-3">{title}</p>
      <dl className="space-y-2 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
