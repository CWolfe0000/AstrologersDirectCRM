"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";
import { isPremiumChart } from "@/lib/plan";
import { PremiumBadge, PremiumNote, usePremium } from "@/components/plan/premium";
import { CHART_TYPES, HOUSE_SYSTEMS, ZODIACS, chartTypeMeta, type HouseSystem, type ZodiacType } from "@/lib/astro";
import type { ChartRecord, ChartType } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, fmtClock, fmtDate, monthName, TODAY } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/misc";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { EngineNotice, useChartView } from "@/components/chart/chart-helpers";

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
  const [titleTouched, setTitleTouched] = React.useState(false);

  const meta = chartTypeMeta(type);
  const name = (id?: string) => personName(people.find((p) => p.id === id));
  // People available for this client: the client + their associated people
  const pool = people.filter((p) => p.id === clientId || p.clientId === clientId);
  const others = people.filter((p) => p.id !== personA && (p.id === clientId || p.clientId === clientId || clients.some((c) => c.id === p.id)));

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
    if (meta.people === 2 && b) return `${a.firstName} & ${b.firstName} — ${meta.short}`;
    if (type === "natal") return `${name(personA)} — Natal`;
    if (type === "solar-return") return `${a.firstName} — Solar Return ${refDate.slice(0, 4)}`;
    return `${a.firstName} — ${meta.short} ${monthName(+refDate.slice(5, 7) - 1)} ${refDate.slice(0, 4)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personA, personB, type, refDate, people]);
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
      settings: { houseSystem, zodiac },
      createdAt: "",
      updatedAt: "",
    }),
    [title, type, personA, personB, clientId, refDate, houseSystem, zodiac, meta],
  );
  const view = useChartView(draft);
  const valid = !!personA && (meta.people === 1 || (!!personB && personB !== personA)) && title.trim().length > 0;
  const subject = people.find((p) => p.id === personA);

  const save = () => {
    if (!valid) return;
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = draft;
    void _id; void _c; void _u;
    const c = addChart(rest);
    toast("Chart saved", `“${c.title}” is filed under ${name(clientId)}.`, "success");
    router.push(`/app/charts/${c.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Create chart"
        description="Charts are always created for a person on file and saved to a client record."
        breadcrumbs={[{ label: "Charts", href: "/app/charts" }, { label: "Create chart" }]}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="1. Chart type" />
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
                  <p className="flex items-center justify-between gap-2 text-[13.5px] font-medium text-ink">
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
            <CardHeader title="2. Client & subjects" description="Choose the client record this chart is filed under, then who is charted." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Client record">
                <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  {clients.filter((c) => c.status !== "archived").map((c) => (
                    <option key={c.id} value={c.id}>{name(c.id)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={meta.people === 2 ? "Person A (inner wheel)" : "Subject"}>
                <Select value={personA} onChange={(e) => setPersonA(e.target.value)}>
                  {pool.map((p) => (
                    <option key={p.id} value={p.id}>
                      {personName(p)}{p.relationship ? ` (${p.relationship})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              {meta.people === 2 && (
                <Field label="Person B (outer wheel)" hint="Associated people of this client are listed first.">
                  <Select value={personB} onChange={(e) => setPersonB(e.target.value)}>
                    {[...others].sort((a, b) => Number(b.clientId === clientId) - Number(a.clientId === clientId)).map((p) => (
                      <option key={p.id} value={p.id}>
                        {personName(p)}{p.relationship ? ` (${p.relationship})` : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {meta.timing && (
                <Field label={type === "solar-return" ? "Return year (date within year)" : "Reference date"}>
                  <Input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
                </Field>
              )}
              {subject && (
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
              <Field label="House system">
                <Select value={houseSystem} onChange={(e) => setHouseSystem(e.target.value as HouseSystem)}>
                  {HOUSE_SYSTEMS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </Select>
              </Field>
              <Field label="Zodiac">
                <Select value={zodiac} onChange={(e) => setZodiac(e.target.value as ZodiacType)}>
                  {ZODIACS.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </Select>
              </Field>
              <Field label="Chart title" className="sm:col-span-2">
                <Input value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} />
              </Field>
            </CardBody>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="Preview" description={title || "Untitled chart"} action={<EngineNotice compact />} />
            <CardBody>
              {view ? <ChartWheel view={view} /> : <div className="aspect-square rounded-full bg-canvas-2" />}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <ButtonLink href="/app/charts" variant="secondary" className="sm:flex-1">Cancel</ButtonLink>
                <Button onClick={save} disabled={!valid || locked} className="sm:flex-[2]">
                  Save & open workspace <ArrowRight />
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
