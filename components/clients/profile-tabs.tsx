"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays, CircleDot, NotebookPen, ListChecks, Clock, Video, Phone, MapPin, ArrowRight, Plus, Heart, Users, Info,
  Lock, Globe, Upload, Download, Pin, Mic, Send, ExternalLink, Play,
} from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { chartTypeMeta } from "@/lib/astro";
import type { ChartRecord, Client, Consultation, Observation, Person } from "@/lib/data/types";
import { cn, fmtDate, fmtTime, fmtShort, fmtDuration, relDay, relTime, stripHtml, fmtClock, DATA_MODE } from "@/lib/utils";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState, KeyValue, FileKindIcon, KIND_LABEL, SimulatedBadge } from "@/components/ui/misc";
import { mediaUrl, uploadFile } from "@/lib/upload";
import { SearchInput } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { ChartThumb, ChartTypeBadge, EngineNotice } from "@/components/chart/chart-helpers";
import { isUpcoming, TODAY_ISO, fmtCoord } from "./helpers";
import { AddPersonDialog } from "./dialogs";

const LOC = { "Video call": Video, Phone: Phone, "In person": MapPin } as const;

function useClientData(clientId: string) {
  const s = useStore();
  return {
    s,
    charts: s.charts.filter((c) => c.clientId === clientId),
    consultations: s.consultations.filter((k) => k.clientId === clientId).sort((a, b) => b.start.localeCompare(a.start)),
    observations: s.observations.filter((o) => o.clientId === clientId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    tasks: s.tasks.filter((t) => t.clientId === clientId),
    readings: s.readings.filter((r) => r.clientId === clientId).sort((a, b) => (b.deliveredAt ?? b.createdAt).localeCompare(a.deliveredAt ?? a.createdAt)),
    files: s.files.filter((f) => f.clientId === clientId),
    activity: s.activity.filter((a) => a.clientId === clientId),
    associated: s.people.filter((p) => p.clientId === clientId),
    name: (id?: string) => personName(s.people.find((p) => p.id === id)),
  };
}

function ConsultationLine({ k }: { k: Consultation }) {
  const L = LOC[k.location];
  return (
    <Link href={`/app/consultations?id=${k.id}`} className="flex items-center gap-3 rounded-lg border border-line p-3 hover:border-line-strong">
      <div className="flex w-12 shrink-0 flex-col items-center rounded-md bg-canvas-2 py-1">
        <span className="text-[10px] font-semibold uppercase text-accent">{fmtShort(k.start).split(" ")[0]}</span>
        <span className="font-serif text-[20px] leading-none">{new Date(k.start).getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium">{k.type}</p>
        <p className="flex items-center gap-1.5 text-[12px] text-muted">
          {fmtTime(k.start)} · {k.durationMin} min · <L className="size-3" /> {k.location}
        </p>
      </div>
      <ArrowRight className="size-4 text-muted" />
    </Link>
  );
}

// ——— Overview ————————————————————————————————————————————————————————
export function OverviewTab({ client, person, onTab }: { client: Client; person: Person; onTab: (t: string) => void }) {
  const d = useClientData(client.id);
  const next = d.consultations.filter(isUpcoming).sort((a, b) => a.start.localeCompare(b.start))[0];
  const natal = d.charts.find((c) => c.type === "natal" && c.personIds[0] === client.id);
  const openTasks = d.tasks.filter((t) => t.status !== "done").sort((a, b) => a.due.localeCompare(b.due));
  const completed = d.consultations.filter((k) => k.status === "completed").length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Basic information" icon={<Info />} />
          <CardBody>
            {client.summary && <p className="mb-5 text-[14px] leading-relaxed text-ink-3">{client.summary}</p>}
            <KeyValue
              cols={3}
              className="grid-cols-2"
              items={[
                { label: "Client since", value: fmtDate(client.createdAt) },
                { label: "Source", value: client.source ?? "—" },
                { label: "Consultations", value: `${completed} completed` },
                { label: "Charts", value: d.charts.length },
                { label: "Observations", value: d.observations.length },
                { label: "Readings delivered", value: d.readings.filter((r) => r.status === "delivered").length },
                { label: "Birth coordinates", value: fmtCoord(person.birth.lat, person.birth.lon) },
                { label: "Time zone", value: person.birth.tz },
                { label: "Portal access", value: <StatusBadge status={client.portalAccess} label={client.portalAccess === "active" ? "Active" : undefined} /> },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent notes" icon={<NotebookPen />} action={<button onClick={() => onTab("observations")} className="text-[12.5px] font-medium text-accent hover:underline">All observations</button>} />
          {d.observations.length === 0 ? (
            <EmptyState icon={<NotebookPen />} title="No observations yet" body="Observations you save in the chart workspace appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {d.observations.slice(0, 3).map((o) => (
                <ObservationRow key={o.id} o={o} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent activity" icon={<Clock />} />
          <ul className="px-5 py-2">
            {d.activity.length === 0 && <li className="py-4 text-[13px] text-muted">No recent activity.</li>}
            {d.activity.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4 border-b border-line/70 py-2.5 last:border-0">
                {a.href ? <Link href={a.href} className="text-[13px] hover:text-accent">{a.text}</Link> : <span className="text-[13px]">{a.text}</span>}
                <span className="shrink-0 text-[11.5px] text-muted">{relTime(a.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Upcoming consultation" icon={<CalendarDays />} />
          <CardBody>
            {next ? (
              <>
                <ConsultationLine k={next} />
                {next.prepNotes && (
                  <div className="mt-3 rounded-lg bg-canvas/80 p-3">
                    <p className="eyebrow mb-1">Preparation notes</p>
                    <p className="line-clamp-4 text-[12.5px] text-ink-3">{next.prepNotes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <p className="text-[13px] text-muted">Nothing scheduled.</p>
                <ButtonLink href={`/app/consultations?new=1&client=${client.id}`} variant="secondary" size="sm" className="mt-3">
                  <Plus /> Schedule
                </ButtonLink>
              </div>
            )}
          </CardBody>
        </Card>

        {natal && (
          <Card>
            <CardHeader title="Natal chart" icon={<CircleDot />} action={<EngineNotice compact />} />
            <Link href={`/app/charts/${natal.id}`} className="block p-5 hover:bg-canvas/50">
              <ChartThumb chart={natal} className="mx-auto max-w-[240px]" />
              <p className="mt-3 text-center text-[12.5px] font-medium text-accent">Open in chart workspace →</p>
            </Link>
          </Card>
        )}

        <Card>
          <CardHeader title="Outstanding tasks" icon={<ListChecks />} action={<Link href={`/app/tasks?new=1&client=${client.id}`} className="text-[12.5px] font-medium text-accent hover:underline">Add</Link>} />
          <ul className="p-2">
            {openTasks.length === 0 && <li className="px-3 py-4 text-[13px] text-muted">No open tasks.</li>}
            {openTasks.map((t) => (
              <li key={t.id}>
                <Link href={`/app/tasks?id=${t.id}`} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-canvas/70">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", t.priority === "high" ? "bg-danger" : t.priority === "medium" ? "bg-warn" : "bg-line-strong")} />
                  <div className="min-w-0">
                    <p className="text-[13px]">{t.title}</p>
                    <p className={cn("text-[11.5px]", t.due < TODAY_ISO ? "text-danger" : "text-muted")}>{t.due < TODAY_ISO ? "Overdue · " : "Due "}{relDay(t.due)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ——— Charts ———————————————————————————————————————————————————————————
const CHART_GROUPS: { title: string; types: ChartRecord["type"][]; desc: string }[] = [
  { title: "Natal", types: ["natal"], desc: "Birth charts for the client and associated people" },
  { title: "Transits & timing", types: ["transits", "progressions", "solar-arc", "solar-return"], desc: "Saved timing charts" },
  { title: "Synastry", types: ["synastry"], desc: "Relationship comparison bi-wheels" },
  { title: "Composite", types: ["composite"], desc: "Midpoint composite charts" },
];

export function ChartsTab({ client }: { client: Client }) {
  const d = useClientData(client.id);
  const known = CHART_GROUPS.flatMap((g) => g.types);
  const other = d.charts.filter((c) => !known.includes(c.type));
  const groups = [...CHART_GROUPS.map((g) => ({ ...g, charts: d.charts.filter((c) => g.types.includes(c.type)) })), { title: "Other saved configurations", desc: "", types: [], charts: other }];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">Every chart is linked to the people it describes and filed under this client.</p>
        <div className="flex items-center gap-2">
          <EngineNotice compact />
          <ButtonLink href={`/app/charts/new?client=${client.id}`} size="sm"><Plus /> Create chart</ButtonLink>
        </div>
      </div>
      {groups.map((g) =>
        g.charts.length === 0 && g.title === "Other saved configurations" ? null : (
          <section key={g.title}>
            <div className="mb-3 flex items-baseline gap-3">
              <h3 className="font-serif text-[20px]">{g.title}</h3>
              <span className="text-[12.5px] text-muted">{g.charts.length} {g.charts.length === 1 ? "chart" : "charts"}</span>
            </div>
            {g.charts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong px-5 py-6 text-center text-[13px] text-muted">
                No {g.title.toLowerCase()} charts yet.{" "}
                <Link href={`/app/charts/new?client=${client.id}&type=${g.types[0]}`} className="font-medium text-accent hover:underline">Create one</Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {g.charts.map((c) => (
                  <ChartCard key={c.id} chart={c} names={c.personIds.map((id) => d.name(id))} />
                ))}
              </div>
            )}
          </section>
        ),
      )}
    </div>
  );
}

function ChartCard({ chart, names }: { chart: ChartRecord; names: string[] }) {
  return (
    <Link href={`/app/charts/${chart.id}`} className="group block rounded-xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-line-strong">
      <div className="mb-2 flex items-center justify-between">
        <ChartTypeBadge type={chart.type} />
        {chart.favorite && <Pin className="size-3.5 text-accent" />}
      </div>
      <ChartThumb chart={chart} className="mx-auto max-w-[180px]" />
      <p className="mt-3 truncate text-[13.5px] font-medium group-hover:text-accent">{chart.title}</p>
      <p className="truncate text-[12px] text-muted">
        {names.join(" & ")}
        {chart.refDate && ` · ${fmtDate(chart.refDate)}`}
      </p>
      <p className="mt-1 text-[11.5px] text-muted">Updated {relTime(chart.updatedAt)}{chart.savedConfig && ` · ${chart.savedConfig}`}</p>
    </Link>
  );
}

// ——— Associated people ————————————————————————————————————————————————
export function PeopleTab({ client }: { client: Client }) {
  const d = useClientData(client.id);
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[13px] text-muted">
          People relevant to {d.name(client.id).split(" ")[0]}&apos;s consultations. Each has their own birth data and natal chart; their natal observations stay with them.
        </p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus /> Add person</Button>
      </div>
      {d.associated.length === 0 ? (
        <Card>
          <EmptyState icon={<Users />} title="No associated people" body="Add a partner, family member or business partner to create synastry and composite charts." action={<Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Plus /> Add person</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {d.associated.map((p) => {
            const linked = d.charts.filter((c) => c.personIds.includes(p.id));
            const n = personName(p);
            return (
              <Card key={p.id}>
                <div className="flex items-start gap-3 p-5">
                  <Avatar name={n} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold">{n}</p>
                      <Badge tone="accent">{p.relationship}</Badge>
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {fmtDate(p.birth.date)} · {p.birth.timeAccuracy === "unknown" ? "time unknown" : fmtClock(p.birth.time)}
                      {p.birth.timeAccuracy === "approximate" && <span className="text-warn"> (approx.)</span>} · {p.birth.place}
                    </p>
                    {p.notes && <p className="mt-2 text-[13px] text-ink-3">{p.notes}</p>}
                  </div>
                </div>
                <div className="border-t border-line px-5 py-3">
                  <p className="eyebrow mb-2">Linked charts</p>
                  <div className="flex flex-wrap gap-2">
                    {linked.map((c) => (
                      <Link key={c.id} href={`/app/charts/${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[12.5px] hover:border-line-strong">
                        <ChartTypeBadge type={c.type} className="px-1.5 py-0" /> {c.title.split("—").slice(-1)[0]?.trim()}
                      </Link>
                    ))}
                    {linked.length === 0 && <span className="text-[12.5px] text-muted">None yet</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-line bg-canvas/50 px-5 py-3">
                  <ButtonLink href={`/app/charts/new?client=${client.id}&type=synastry&with=${p.id}`} variant="secondary" size="xs"><Heart /> Create synastry</ButtonLink>
                  <ButtonLink href={`/app/charts/new?client=${client.id}&type=composite&with=${p.id}`} variant="secondary" size="xs"><CircleDot /> Create composite</ButtonLink>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <AddPersonDialog open={open} onOpenChange={setOpen} clientId={client.id} />
    </div>
  );
}

// ——— Consultations ————————————————————————————————————————————————————
export function ConsultationsTab({ client }: { client: Client }) {
  const d = useClientData(client.id);
  const [view, setView] = React.useState<"all" | "upcoming" | "past">("all");
  const upcoming = d.consultations.filter(isUpcoming).sort((a, b) => a.start.localeCompare(b.start));
  const past = d.consultations.filter((k) => !isUpcoming(k));
  const list = view === "upcoming" ? upcoming : view === "past" ? past : [...upcoming, ...past];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={view} onChange={setView} size="sm" options={[{ value: "all", label: "All", count: d.consultations.length }, { value: "upcoming", label: "Upcoming", count: upcoming.length }, { value: "past", label: "Past", count: past.length }]} />
        <ButtonLink href={`/app/consultations?new=1&client=${client.id}`} size="sm"><Plus /> Schedule consultation</ButtonLink>
      </div>
      {list.length === 0 ? (
        <Card><EmptyState icon={<CalendarDays />} title="No consultations" /></Card>
      ) : (
        <div className="space-y-3">
          {list.map((k) => {
            const L = LOC[k.location];
            const tasks = d.tasks.filter((t) => t.consultationId === k.id);
            const charts = k.chartIds.map((id) => d.charts.find((c) => c.id === id)).filter(Boolean) as ChartRecord[];
            const up = isUpcoming(k);
            return (
              <Card key={k.id} className={cn(up && "border-l-[3px] border-l-accent")}>
                <div className="flex flex-col gap-4 p-5 md:flex-row">
                  <div className="w-44 shrink-0">
                    <p className="text-[14px] font-semibold">{fmtDate(k.start)}</p>
                    <p className="text-[12.5px] text-muted">{fmtTime(k.start)} · {k.durationMin} min</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted"><L className="size-3.5" /> {k.location}</p>
                    <StatusBadge status={k.status} className="mt-2" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/app/consultations?id=${k.id}`} className="text-[15px] font-medium hover:text-accent">{k.type}</Link>
                    {(k.sessionNotes || k.prepNotes) && (
                      <p className="mt-1 line-clamp-2 text-[13px] text-ink-3">
                        <span className="font-medium text-muted">{k.sessionNotes ? "Session notes: " : "Prep: "}</span>
                        {k.sessionNotes ?? k.prepNotes}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {charts.map((c) => (
                        <Link key={c.id} href={`/app/charts/${c.id}`} className="inline-flex items-center gap-1.5 rounded-md bg-canvas-2 px-2 py-1 text-[12px] hover:bg-canvas-3">
                          <CircleDot className="size-3 text-accent" /> {c.title}
                        </Link>
                      ))}
                      {k.readingIds.length > 0 && <Badge tone="sage"><Send className="size-3" /> {k.readingIds.length} reading</Badge>}
                      {k.recordingIds.length > 0 && <Badge tone="neutral"><Mic className="size-3" /> Recording</Badge>}
                    </div>
                    {tasks.length > 0 && (
                      <div className="mt-3 border-t border-line pt-3">
                        <p className="eyebrow mb-1.5">Follow-up tasks</p>
                        {tasks.map((t) => (
                          <Link key={t.id} href={`/app/tasks?id=${t.id}`} className="flex items-center gap-2 py-0.5 text-[12.5px] hover:text-accent">
                            <ListChecks className="size-3.5 text-muted" /> <span className={cn(t.status === "done" && "text-muted line-through")}>{t.title}</span>
                            <StatusBadge status={t.status !== "done" && t.due < TODAY_ISO ? "overdue" : t.status} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ——— Observations ————————————————————————————————————————————————————
function ObservationRow({ o }: { o: Observation }) {
  return (
    <li>
      <Link href={`/app/observations?id=${o.id}`} className="block px-5 py-3.5 hover:bg-canvas/60">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13.5px] font-medium">
            {o.pinned && <Pin className="mr-1 inline size-3 text-accent" />}
            {o.title}
          </p>
          <span className="shrink-0 text-[11.5px] text-muted">{fmtDate(o.updatedAt)}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted">{stripHtml(o.body)}</p>
        {(o.tags.length > 0 || o.houses.length > 0) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {o.houses.map((h) => <Badge key={h} tone="outline">House {h}</Badge>)}
            {o.tags.slice(0, 3).map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
          </div>
        )}
      </Link>
    </li>
  );
}

export function ObservationsTab({ client }: { client: Client }) {
  const d = useClientData(client.id);
  const [q, setQ] = React.useState("");
  const [scope, setScope] = React.useState<"all" | Observation["scope"]>("all");
  const filtered = d.observations.filter((o) => (scope === "all" || o.scope === scope) && (!q || `${o.title} ${stripHtml(o.body)} ${o.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())));

  // Group: natal by the person interpreted; relationship & timing by chart context.
  const groups = new Map<string, { title: string; sub: string; scope: Observation["scope"]; chartId: string; items: Observation[] }>();
  filtered.forEach((o) => {
    const chart = d.charts.find((c) => c.id === o.chartId);
    const key = o.scope === "natal" ? `natal:${o.personIds[0]}` : `${o.scope}:${o.chartId}`;
    if (!groups.has(key)) {
      const first = d.name(o.personIds[0]).split(" ")[0];
      groups.set(key, {
        title: o.scope === "natal" ? `${first}'s natal chart` : chart?.title ?? "Chart",
        sub: o.scope === "natal" ? "Natal observations — belong to this individual" : o.scope === "relationship" ? `Relationship context · ${chartTypeMeta(chart?.type ?? "synastry").name}` : `Timing · ${chart ? chartTypeMeta(chart.type).name : ""}`,
        scope: o.scope,
        chartId: o.chartId,
        items: [],
      });
    }
    groups.get(key)!.items.push(o);
  });
  const order = { natal: 0, relationship: 1, timing: 2 };
  const sorted = [...groups.values()].sort((a, b) => order[a.scope] - order[b.scope] || (a.title.startsWith(d.name(client.id).split(" ")[0]!) ? -1 : 1));

  return (
    <div>
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-sage-100 bg-sage-50/60 px-4 py-3 text-[12.5px] text-sage-dark">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          <span className="font-medium">How observations are filed:</span> natal observations belong to the person whose natal chart is being interpreted, even when that person is a partner or family member. Synastry and composite observations belong to the specific relationship chart. They are never merged just because the charts sit under the same client.
        </p>
      </div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput placeholder="Search observations…" value={q} onChange={(e) => setQ(e.target.value)} className="md:w-72" />
        <Segmented size="sm" value={scope} onChange={setScope} options={[{ value: "all", label: "All" }, { value: "natal", label: "Natal" }, { value: "relationship", label: "Relationship" }, { value: "timing", label: "Timing" }]} />
        <ButtonLink href={`/app/observations?new=1&client=${client.id}`} size="sm" className="md:ml-auto"><Plus /> Add observation</ButtonLink>
      </div>
      {sorted.length === 0 ? (
        <Card><EmptyState icon={<NotebookPen />} title="No observations found" /></Card>
      ) : (
        <div className="space-y-5">
          {sorted.map((g) => (
            <Card key={g.title + g.chartId}>
              <CardHeader
                title={g.title}
                description={g.sub}
                icon={g.scope === "natal" ? <CircleDot /> : g.scope === "relationship" ? <Heart /> : <Clock />}
                action={<Link href={`/app/charts/${g.chartId}`} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline">Open chart <ArrowRight className="size-3" /></Link>}
              />
              <ul className="divide-y divide-line">
                {g.items.map((o) => <ObservationRow key={o.id} o={o} />)}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ——— Readings ————————————————————————————————————————————————————————
export function ReadingsTab({ client }: { client: Client }) {
  const d = useClientData(client.id);
  const recs = d.s.recordings.filter((r) => r.clientId === client.id && r.status === "saved");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">Documents, audio and video shared with {d.name(client.id).split(" ")[0]} through the client portal.</p>
        <div className="flex gap-2">
          <ButtonLink href={`/app/studio?client=${client.id}`} variant="secondary" size="sm"><Mic /> Record</ButtonLink>
          <ButtonLink href={`/app/delivery?new=1&client=${client.id}`} size="sm"><Send /> Deliver reading</ButtonLink>
        </div>
      </div>
      <Card>
        {d.readings.length === 0 ? (
          <EmptyState icon={<Send />} title="No readings yet" />
        ) : (
          <ul className="divide-y divide-line">
            {d.readings.map((r) => (
              <li key={r.id}>
                <Link href={`/app/delivery?id=${r.id}`} className="flex flex-col gap-3 px-5 py-4 hover:bg-canvas/60 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FileKindIcon kind={r.kind} />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium">{r.title}</p>
                      <p className="truncate text-[12px] text-muted">
                        {KIND_LABEL[r.kind]}
                        {r.durationSec ? ` · ${fmtDuration(r.durationSec)}` : r.pages ? ` · ${r.pages} pages` : ""}
                        {r.sizeMB ? ` · ${r.sizeMB >= 100 ? Math.round(r.sizeMB) : r.sizeMB} MB` : ""}
                        {r.deliveredAt ? ` · Delivered ${fmtDate(r.deliveredAt)}` : ` · Created ${fmtDate(r.createdAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 pl-12 sm:pl-0">
                    <StatusBadge status={r.status} />
                    {r.status === "delivered" && <StatusBadge status={r.notification} label={r.notification === "opened" ? "Opened by client" : undefined} />}
                    {!r.allowDownload && r.status === "delivered" && <Badge tone="outline"><Lock className="size-3" /> Stream only</Badge>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {recs.length > 0 && (
        <Card>
          <CardHeader title="Saved recordings not yet delivered" icon={<Mic />} />
          <ul className="divide-y divide-line">
            {recs.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent-50 text-accent"><Play className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{r.title}</p>
                  <p className="text-[12px] text-muted">{fmtDuration(r.durationSec)} · recorded {relTime(r.createdAt)}</p>
                </div>
                <ButtonLink href={`/app/delivery?new=1&client=${client.id}&recording=${r.id}`} variant="secondary" size="xs"><Send /> Deliver</ButtonLink>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ——— Files ———————————————————————————————————————————————————————————
export function FilesTab({ client }: { client: Client }) {
  const d = useClientData(client.id);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const onFile = (f?: File) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const kind = ext === "pdf" ? "pdf" : ["jpg", "jpeg", "png", "heic"].includes(ext) ? "image" : ["doc", "docx", "txt"].includes(ext) ? "doc" : ["mp3", "m4a", "wav"].includes(ext) ? "audio" : "other";
    const sizeKB = Math.max(1, Math.round(f.size / 1024));
    if (DATA_MODE === "demo") {
      d.s.addFile({ clientId: client.id, name: f.name, kind, sizeKB, private: true });
      d.s.toast("File added", `${f.name} was added as a private practitioner file (stored in this browser only).`, "success");
      return;
    }
    setUploading({ name: f.name, pct: 0 });
    uploadFile(f, (pct) => setUploading({ name: f.name, pct })).then(
      (r) => {
        d.s.addFile({ clientId: client.id, name: f.name, kind, sizeKB, private: true, fileKey: r.key, contentType: r.contentType });
        d.s.toast("File uploaded", `${f.name} is private until you share it with the client.`, "success");
        setUploading(null);
      },
      (e: Error) => {
        d.s.toast("Upload failed", e.message, "error");
        setUploading(null);
      },
    );
  };
  const [uploading, setUploading] = React.useState<{ name: string; pct: number } | null>(null);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <Lock className="size-3.5" /> Private files are visible only to you. Shared files appear in the client&apos;s portal.
        </div>
        <div className="flex items-center gap-2">
          {DATA_MODE === "demo" && <SimulatedBadge label="Simulated storage" />}
          <Button size="sm" disabled={!!uploading} onClick={() => inputRef.current?.click()}><Upload /> {uploading ? `Uploading ${Math.round(uploading.pct)}%` : "Upload file"}</Button>
          <input ref={inputRef} type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </div>
      <Card>
        {d.files.length === 0 ? (
          <EmptyState icon={<Upload />} title="No files yet" body="Upload intake forms, birth certificates or resources." />
        ) : (
          <ul className="divide-y divide-line">
            {d.files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                <FileKindIcon kind={f.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{f.name}</p>
                  <p className="text-[12px] text-muted">
                    {f.sizeKB >= 1024 ? `${(f.sizeKB / 1024).toFixed(1)} MB` : `${f.sizeKB} KB`} · Uploaded {fmtDate(f.uploadedAt)}
                    {f.note && ` · ${f.note}`}
                  </p>
                </div>
                <button
                  onClick={() => d.s.files && useStore.setState((st) => ({ files: st.files.map((x) => (x.id === f.id ? { ...x, private: !x.private } : x)) }))}
                  title="Toggle visibility"
                >
                  {f.private ? <Badge tone="neutral"><Lock className="size-3" /> Private</Badge> : <Badge tone="sage"><Globe className="size-3" /> Shared with client</Badge>}
                </button>
                {f.fileKey ? (
                  <a href={mediaUrl("files", f.id, true)} aria-label={`Download ${f.name}`} className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-canvas-2"><Download className="size-4" /></a>
                ) : (
                  <Button variant="ghost" size="icon-sm" aria-label="Download" onClick={() => d.s.toast("Download simulated", f.name)}><Download /></Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted"><ExternalLink className="size-3" /> Click a visibility badge to toggle whether the client can see a file.</p>
    </div>
  );
}
