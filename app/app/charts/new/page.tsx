"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";
import { isPremiumChart } from "@/lib/plan";
import { PremiumBadge, PremiumNote, usePremium } from "@/components/plan/premium";
import { CHART_TYPES, HOUSE_SYSTEMS, ZODIACS, chartTypeMeta, type HouseSystem, type ZodiacType } from "@/lib/astro";
import type { ChartRecord, ChartType, ElectionData } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, fmtClock, fmtDate, monthName, nowLocal, TODAY } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/misc";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { EngineNotice, useChartView } from "@/components/chart/chart-helpers";
import { AddPersonDialog, relationshipLabel } from "@/components/clients/dialogs";
import { PlaceLookup, type PlaceValue } from "@/components/clients/place-lookup";
import { AstroMap } from "@/components/workspace/astro-map";
import { ElectionFinder } from "@/components/chart/election-finder";

const NEW = "__new";

export default function NewChartPage() {
  return (
    <React.Suspense>
      <NewChart />
    </React.Suspense>
  );
}

function NewChart() {
  const router = useRouter();
  const params = useSearchParams();
  const people = useStore((s) => s.people);
  const clients = useStore((s) => s.clients);
  const defaults = useStore((s) => s.defaults);
  const addChart = useStore((s) => s.addChart);
  const toast = useStore((s) => s.toast);

  const [type, setType] = React.useState<ChartType>((params.get("type") as ChartType) || "natal");
  const premium = usePremium();
  const locked = !premium && isPremiumChart(type);
  const [clientId, setClientId] = React.useState(params.get("client") ?? "c1");
  const [personA, setPersonA] = React.useState(params.get("client") ?? "c1");
  const [personB, setPersonB] = React.useState(params.get("with") ?? "");
  const [refDate, setRefDate] = React.useState(TODAY);
  const [houseSystem, setHouseSystem] = React.useState<HouseSystem>(defaults.houseSystem);
  const [zodiac, setZodiac] = React.useState<ZodiacType>(defaults.zodiac);
  const [title, setTitle] = React.useState("");
  /** Which slot a newly added person fills ("A" or "B"), while the Add Person dialog is open. */
  const [adding, setAdding] = React.useState<"B" | null>(null);
  const [titleTouched, setTitleTouched] = React.useState(false);
  // Horary: the question, and the moment and place it was asked (defaults to now).
  const [question, setQuestion] = React.useState("");
  const [askedDate, setAskedDate] = React.useState(TODAY);
  const [askedTime, setAskedTime] = React.useState(() => nowLocal().slice(11, 16));
  const [askedPlace, setAskedPlace] = React.useState<PlaceValue | null>(null);
  const isHorary = type === "horary";
  const isElection = type === "election";
  const [election, setElection] = React.useState<ElectionData | null>(null);
  const [electionPurpose, setElectionPurpose] = React.useState("");
  const isMap = type === "astrocartography";
  // Horary is traditionally read with Regiomontanus houses.
  React.useEffect(() => {
    setHouseSystem(isHorary || isElection ? "regiomontanus" : defaults.houseSystem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHorary, isElection]);

  const meta = chartTypeMeta(type);
  const name = (id?: string) => personName(people.find((p) => p.id === id));
  // People available for this client: the client + their associated people
  const pool = people.filter((p) => p.id === clientId || p.clientId === clientId);
  const others = people.filter((p) => p.id !== personA && (p.id === clientId || p.clientId === clientId || clients.some((c) => c.id === p.id)));

  // Opened without a client (e.g. from the Create menu): start with the first active client.
  const activeClients = clients.filter((c) => c.status !== "archived");
  React.useEffect(() => {
    if (activeClients.length && !activeClients.some((c) => c.id === clientId)) {
      setClientId(activeClients[0].id);
      setPersonA(activeClients[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClients.length, clientId]);
  // Single-person charts are always the client's own; other people's birth data lives on the client's file.
  React.useEffect(() => {
    if (meta.people === 1) setPersonA(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.people, clientId]);
  React.useEffect(() => {
    if (!pool.some((p) => p.id === personA)) setPersonA(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);
  React.useEffect(() => {
    if (meta.people === 2 && (!personB || personB === personA)) {
      const assoc = people.find((p) => p.clientId === clientId && p.id !== personA);
      setPersonB(assoc?.id ?? others[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, personA, clientId]);

  const autoTitle = React.useMemo(() => {
    const a = people.find((p) => p.id === personA);
    const b = people.find((p) => p.id === personB);
    if (!a) return "";
    if (type === "horary") {
      const q = question.trim().replace(/\?$/, "");
      return `${a.firstName} — Horary${q ? `: ${q.length > 48 ? q.slice(0, 47).trimEnd() + "…" : q}?` : ""}`;
    }
    if (type === "astrocartography") return `${name(personA)} — Astrocartography`;
    if (type === "election") {
      const what = electionPurpose.trim() || "Election";
      return `${a.firstName} — ${what}${election ? `, ${fmtDate(election.at.slice(0, 10))}` : ""}`;
    }
    if (meta.people === 2 && b) return `${a.firstName} & ${b.firstName} — ${meta.short}`;
    if (type === "natal") return `${name(personA)} — Natal`;
    if (type === "solar-return") return `${a.firstName} — Solar Return ${refDate.slice(0, 4)}`;
    return `${a.firstName} — ${meta.short} ${monthName(+refDate.slice(5, 7) - 1)} ${refDate.slice(0, 4)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personA, personB, type, refDate, people, question, electionPurpose, election]);
  React.useEffect(() => {
    if (!titleTouched) setTitle(autoTitle);
  }, [autoTitle, titleTouched]);

  const draft: ChartRecord = React.useMemo(
    () => ({
      id: "draft",
      title,
      type,
      personIds: meta.people === 2 ? [personA, personB].filter(Boolean) : [personA],
      clientId,
      refDate: meta.timing ? refDate : undefined,
      election: isElection && election ? { ...election, purpose: electionPurpose.trim() } : undefined,
      horary: isHorary && askedPlace ? { question: question.trim() || "…", at: `${askedDate}T${askedTime}`, ...askedPlace } : undefined,
      settings: { houseSystem, zodiac },
      createdAt: "",
      updatedAt: "",
    }),
    [title, type, personA, personB, clientId, refDate, houseSystem, zodiac, meta, isHorary, askedPlace, question, askedDate, askedTime, isElection, election, electionPurpose],
  );
  const view = useChartView((isHorary && !askedPlace) || (isElection && !election) ? undefined : draft);
  const valid =
    !!personA && (meta.people === 1 || (!!personB && personB !== personA)) && title.trim().length > 0 && (!isHorary || (!!question.trim() && !!askedPlace && /^\d\d:\d\d$/.test(askedTime))) && (!isElection || !!election);
  const subject = people.find((p) => p.id === personA);

  const save = () => {
    if (!valid) return;
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = draft;
    void _id; void _c; void _u;
    const c = addChart(rest);
    toast("Chart Saved", `“${c.title}” is filed under ${name(clientId)}.`, "success");
    router.push(`/app/charts/${c.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Create Chart"
        description="Charts are always created for a person on file and saved to a client record."
        breadcrumbs={[{ label: "Charts", href: "/app/charts" }, { label: "Create Chart" }]}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="1. Chart Type" />
            <CardBody className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {CHART_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    type === t.id ? "border-accent bg-accent-50/60 ring-1 ring-accent/30" : "border-line hover:border-line-strong",
                  )}
                >
                  <p className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[13.5px] font-medium text-ink">
                    {t.name}
                    {isPremiumChart(t.id) && <PremiumBadge locked={!premium} />}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted">{t.description}</p>
                </button>
              ))}
              {locked && (
                <div className="sm:col-span-2 lg:col-span-full">
                  <PremiumNote>{chartTypeMeta(type).name} charts are part of Premium. Natal and synastry charts are on every plan.</PremiumNote>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={isHorary ? "2. Client & Question" : isElection ? "2. Client & Event" : meta.people === 2 ? "2. Client & People" : "2. Client"}
              description={isHorary ? "The client asking (the querent), their question, and when and where you received it." : isElection ? "What’s being started, when it could happen and where. We check every moment in the range and rank the best." : meta.people === 2 ? "Choose the client record this chart is filed under, then who is in each wheel." : "Choose whose chart this is."}
            />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label={meta.people === 2 || isHorary || isElection ? "Client Record" : "Client"}>
                <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  {clients.filter((c) => c.status !== "archived").map((c) => (
                    <option key={c.id} value={c.id}>{name(c.id)}</option>
                  ))}
                </Select>
              </Field>
              {isHorary && (
                <>
                  <Field label="Question" className="sm:col-span-2" hint="In the querent’s own words, as closely as you can.">
                    <Textarea rows={2} maxLength={1000} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Will I get the job I interviewed for on Monday?" />
                  </Field>
                  <Field label="Date Asked"><Input type="date" value={askedDate} onChange={(e) => setAskedDate(e.target.value)} /></Field>
                  <Field label="Time Asked" hint="Local time where it was asked. Defaults to now."><Input type="time" value={askedTime} onChange={(e) => setAskedTime(e.target.value)} /></Field>
                  <Field label="Where It Was Asked" className="sm:col-span-2" hint="Usually where you were when you received and understood the question.">
                    <PlaceLookup value={askedPlace} onChange={setAskedPlace} id="horary-place" />
                  </Field>
                </>
              )}
              {isElection && (
                <ElectionFinder
                  clientFirst={people.find((p) => p.id === clientId)?.firstName ?? "the client"}
                  natal={people.find((p) => p.id === clientId)?.birth}
                  settings={{ ...defaults, houseSystem, zodiac }}
                  purpose={electionPurpose}
                  onPurpose={setElectionPurpose}
                  onPick={setElection}
                />
              )}
              {meta.people === 2 && (
              <Field label="Person A (Inner Wheel)">
                <Select value={personA} onChange={(e) => setPersonA(e.target.value)}>
                  {pool.map((p) => (
                    <option key={p.id} value={p.id}>
                      {personName(p)}{p.relationship ? ` (${relationshipLabel(p.relationship)})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              )}
              {meta.people === 2 && (
                <Field label="Person B (Outer Wheel)" hint={`${name(clientId)}’s associated people are listed first. Not on file yet? Choose “Add a new person”.`}>
                  <Select value={personB} onChange={(e) => (e.target.value === NEW ? setAdding("B") : setPersonB(e.target.value))}>
                    {/* A placeholder, so "Add a New Person" is always a change, even when it's the only choice. */}
                    {!others.some((p) => p.id === personB) && <option value="">Choose a person…</option>}
                    {[...others].sort((a, b) => Number(b.clientId === clientId) - Number(a.clientId === clientId)).map((p) => (
                      <option key={p.id} value={p.id}>
                        {personName(p)}{p.relationship ? ` (${relationshipLabel(p.relationship)})` : ""}
                      </option>
                    ))}
                    <option value={NEW}>+ Add a New Person…</option>
                  </Select>
                </Field>
              )}
              {meta.timing && (
                <Field label={type === "solar-return" ? "Return year (date within year)" : "Reference date"}>
                  <Input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
                </Field>
              )}
              {subject && !isHorary && !isElection && (
                <div className="rounded-lg border border-line bg-canvas/60 p-3 text-[12.5px] sm:col-span-2">
                  <p className="font-medium text-ink">Birth data on file — {personName(subject)}</p>
                  <p className="mt-0.5 text-muted">
                    {fmtDate(subject.birth.date)} · {fmtClock(subject.birth.time)} ({subject.birth.timeAccuracy}) · {subject.birth.place}
                  </p>
                  {subject.birth.timeAccuracy !== "exact" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-warn">
                      <Info className="size-3.5" /> Birth time is {subject.birth.timeAccuracy}. Consider whole-sign houses until rectified.
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="3. Settings" description="Defaults come from Settings › Astrology defaults. You can change them later in the workspace." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              {!isMap && (
              <>
              <Field label="House System" hint={isHorary ? "Regiomontanus is the traditional choice for horary." : undefined}>
                <Select value={houseSystem} onChange={(e) => setHouseSystem(e.target.value as HouseSystem)}>
                  {HOUSE_SYSTEMS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </Select>
              </Field>
              <Field label="Zodiac">
                <Select value={zodiac} onChange={(e) => setZodiac(e.target.value as ZodiacType)}>
                  {ZODIACS.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </Select>
              </Field>
              </>
              )}
              <Field label="Chart Title" className="sm:col-span-2">
                <Input value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} />
              </Field>
            </CardBody>
          </Card>
        </div>

        <AddPersonDialog
          open={!!adding}
          onOpenChange={(o) => !o && setAdding(null)}
          clientId={clientId}
          onAdded={(p) => setPersonB(p.id)}
        />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="Preview" description={title || "Untitled chart"} action={<EngineNotice compact />} />
            <CardBody>
              {isMap && subject && !locked ? (
                <AstroMap birth={subject.birth} settings={{ ...defaults, houseSystem, zodiac }} compact />
              ) : view ? (
                <ChartWheel view={view} />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-full bg-canvas-2 p-10 text-center text-[12.5px] text-muted">{isHorary && !askedPlace ? "Add where the question was asked to see the chart." : isElection && !election ? "Find times, then choose one to see its chart." : ""}</div>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <ButtonLink href="/app/charts" variant="secondary" className="sm:flex-1">Cancel</ButtonLink>
                <Button onClick={save} disabled={!valid || locked} className="sm:flex-[2]">
                  Save & Open Workspace <ArrowRight />
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
