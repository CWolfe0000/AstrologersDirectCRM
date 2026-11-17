"use client";

import * as React from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, Legend,
} from "recharts";
import { Users, UserPlus, Repeat, CalendarDays, Send, ListTodo, Sprout, Download } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { computeReport, monthsCsv, type Range } from "./report-data";
import { TODAY, daysFromToday } from "@/lib/utils";

const RANGE_LABEL: Record<Range, string> = { "30d": "last 30 days", "90d": "last 90 days", "12m": "last 12 months", all: "all time" };

const C = { accent: "#824B59", sage: "#83978B", ink: "#29272B", stone: "#D6CFC6", gold: "#B07A2A", muted: "#68645F", line: "#E7E2DC" };
const KIND_COLOR: Record<string, string> = { PDF: C.accent, Document: "#9C6B78", Audio: C.sage, Video: C.gold, Link: C.stone };

const tooltipStyle = {
  contentStyle: { borderRadius: 10, border: `1px solid ${C.line}`, boxShadow: "0 8px 30px rgba(41,39,43,0.10)", fontSize: 12.5, padding: "8px 12px" },
  labelStyle: { color: C.ink, fontWeight: 600, marginBottom: 4 },
  cursor: { fill: "rgba(41,39,43,0.04)" },
};

function pct(cur: number, prev: number, range: Range) {
  if (!prev || range === "all") return undefined;
  const p = Math.round(((cur - prev) / prev) * 100);
  return { value: `${p >= 0 ? "+" : ""}${p}%`, positive: p >= 0 };
}

export function ReportsPage() {
  const [range, setRange] = React.useState<Range>("90d");
  const tasks = useStore((s) => s.tasks);
  const readings = useStore((s) => s.readings);
  const consultations = useStore((s) => s.consultations);
  const clients = useStore((s) => s.clients);
  const clientWork = useStore((s) => s.clientWork);
  const workResponses = useStore((s) => s.workResponses);
  const r = React.useMemo(() => computeReport({ clients, consultations, readings, clientWork, workResponses }, range, TODAY), [clients, consultations, readings, clientWork, workResponses, range]);
  const { totals: t, months: chartMonths, highlighted: inRange, types: typeRows, between } = r;
  const vs = range === "all" ? undefined : "vs previous period";

  const open = tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.due < TODAY);
  const upcoming7 = consultations.filter((k) => k.status === "scheduled" && k.start >= TODAY && k.start < daysFromToday(7));
  const outstanding = [
    { name: "Overdue tasks", value: overdue.length, color: C.accent, href: "/app/tasks?view=overdue" },
    { name: "Open tasks", value: open.length - overdue.length, color: C.stone, href: "/app/tasks" },
    { name: "Draft readings", value: readings.filter((r) => r.status === "draft").length, color: C.gold, href: "/app/delivery" },
    { name: "Ready to send", value: readings.filter((r) => r.status === "ready").length, color: C.sage, href: "/app/delivery" },
    { name: "Failed deliveries", value: readings.filter((r) => r.status === "failed").length, color: "#A9443F", href: "/app/delivery" },
    { name: "Sessions next 7 days", value: upcoming7.length, color: C.ink, href: "/app/consultations" },
  ];
  const outstandingTotal = overdue.length + (open.length - overdue.length) + readings.filter((r) => ["draft", "ready", "failed"].includes(r.status)).length;

  const delTypes = r.deliveryTypes.map((d) => ({ ...d, color: KIND_COLOR[d.name] ?? C.stone }));
  const dels = t.deliveries;
  const cons = t.consultations;
  const typeMax = Math.max(...typeRows.map((x) => x.count), 1);
  const exportCsv = () => {
    const blob = new Blob([monthsCsv(chartMonths)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `practice-report-${TODAY}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Reports & Insights" }]}
        title="Reports & Practice Insights"
        description="A high-level view of your practice: clients, consultations, deliveries and outstanding work."
        actions={
          <>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: "30d", label: "30 Days" },
                { value: "90d", label: "90 Days" },
                { value: "12m", label: "12 Months" },
                { value: "all", label: "All" },
              ]}
            />
            <Button variant="secondary" size="sm" className="hidden md:inline-flex" onClick={exportCsv}><Download /> Export CSV</Button>
          </>
        }
      />

      {clients.length === 0 && (
        <p className="mb-6 rounded-xl border border-dashed border-line bg-surface px-4 py-3.5 text-[13.5px] text-muted">
          Reports fill in as you work: add clients, hold consultations and deliver readings, and the figures here update on their own.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active Clients" value={t.clients} sub={`+${t.newClients} in ${RANGE_LABEL[range]}`} icon={<Users />} />
        <StatCard label="New Clients" value={t.newClients} trend={pct(t.newClients, t.newClientsPrev, range)} sub={vs ?? RANGE_LABEL[range]} icon={<UserPlus />} />
        <StatCard label="Returning Clients" value={t.returning} trend={pct(t.returning, t.returningPrev, range)} sub="Seen again after an earlier session" icon={<Repeat />} />
        <StatCard label="Consultations" value={cons} trend={pct(cons, t.consultationsPrev, range)} sub={vs ?? "Held, all time"} icon={<CalendarDays />} />
        <StatCard label="Reading Deliveries" value={dels} trend={pct(dels, t.deliveriesPrev, range)} sub={vs ?? "Delivered, all time"} icon={<Send />} />
        <StatCard label="Outstanding Work" value={outstandingTotal} sub={<span className="text-accent">{overdue.length} overdue</span>} icon={<ListTodo />} href="/app/tasks" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Consultation Volume" description={`Sessions held per month · highlighted: ${RANGE_LABEL[range]} · this month so far`} />
          <CardBody className="h-[340px] pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMonths} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.line} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: C.muted }} interval={chartMonths.length > 12 ? 1 : 0} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: C.muted }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [v as number, "Consultations"]} />
                <Bar dataKey="consultations" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {chartMonths.map((m) => <Cell key={m.key} fill={inRange.has(m.key) ? C.accent : C.stone} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Deliveries by Type" description={`${dels} readings · ${RANGE_LABEL[range]}`} />
          <CardBody className="flex flex-col items-center gap-4 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative h-[200px] w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={delTypes.length ? delTypes : [{ name: "None", value: 1, color: C.line }]} dataKey="value" isAnimationActive={false} innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                    {(delTypes.length ? delTypes : [{ name: "None", value: 1, color: C.line }]).map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-[30px] leading-none">{dels}</span>
                <span className="text-[11.5px] text-muted">delivered</span>
              </div>
            </div>
            <ul className="w-full space-y-2">
              {delTypes.length === 0 && <li className="text-[13px] text-muted">No readings delivered in this period.</li>}
              {delTypes.map((d) => (
                <li key={d.name} className="flex items-center gap-2.5 text-[13px]">
                  <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="flex-1">{d.name}</span>
                  <span className="tabular-nums text-muted">{d.value}</span>
                  <span className="w-10 text-right tabular-nums text-muted">{dels ? Math.round((d.value / dels) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="New vs Returning Clients" description="New clients added, and clients seen again, per month" />
          <CardBody className="h-[280px] pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartMonths} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.sage} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.sage} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.accent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={C.line} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: C.muted }} interval={chartMonths.length > 12 ? 1 : 0} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: C.muted }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: C.muted }} />
                <Area type="monotone" name="Returning" dataKey="returningClients" stroke={C.sage} strokeWidth={2} fill="url(#gRet)" />
                <Area type="monotone" name="New" dataKey="newClients" stroke={C.accent} strokeWidth={2} fill="url(#gNew)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Outstanding Work" description="Right now, from your tasks, deliveries and calendar" />
          <CardBody className="h-[280px] pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outstanding} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={C.line} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: C.muted }} />
                <YAxis type="category" dataKey="name" width={136} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: C.ink }} />
                <Tooltip {...tooltipStyle} formatter={(v) => [v as number, "Items"]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} label={{ position: "right", fontSize: 11.5, fill: C.muted }}>
                  {outstanding.map((o) => <Cell key={o.name} fill={o.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader title="Top Consultation Types" description={RANGE_LABEL[range]} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-canvas/60 text-[11.5px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">Sessions</th>
                  <th className="hidden px-3 py-2.5 font-semibold sm:table-cell">Share</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Avg. length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {typeRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-muted">No consultations held in this period.</td>
                  </tr>
                )}
                {typeRows.map((t) => (
                  <tr key={t.name}>
                    <td className="px-5 py-2.5 font-medium">{t.name}</td>
                    <td className="px-3 py-2.5 tabular-nums">{t.count}</td>
                    <td className="hidden w-[40%] px-3 py-2.5 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-2">
                          <div className="h-full rounded-full bg-accent/80" style={{ width: `${(t.count / typeMax) * 100}%` }} />
                        </div>
                        <span className="w-9 text-right text-[12px] tabular-nums text-muted">{cons ? Math.round((t.count / cons) * 100) : 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-muted">{t.avg} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Between Sessions" description={`Work shared · ${RANGE_LABEL[range]}`} action={<Sprout className="size-4 text-accent" />} />
          <CardBody>
            {between.shared === 0 ? (
              <p className="text-[13px] text-muted">Nothing shared in this period. Share an assignment, prompt, goal or activity from a client’s Between Sessions tab.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                {[
                  ["Shared", between.shared, `with ${between.clients} ${between.clients === 1 ? "client" : "clients"}`],
                  ["Responded to", between.responded, `${Math.round((between.responded / between.shared) * 100)}% of shared work`],
                  ["Done", between.done, `${Math.round((between.done / between.shared) * 100)}% completed`],
                  ["Client entries", between.entries, "Responses and journal entries"],
                ].map(([label, value, sub]) => (
                  <div key={label as string}>
                    <dt className="text-[12px] text-muted">{label}</dt>
                    <dd className="font-serif text-[28px] leading-tight text-ink">{value}</dd>
                    <dd className="text-[12px] text-muted">{sub}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
