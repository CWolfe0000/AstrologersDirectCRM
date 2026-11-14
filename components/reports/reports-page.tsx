"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, Legend,
} from "recharts";
import { Users, UserPlus, Repeat, CalendarDays, Send, ListTodo, FlaskConical, Wallet, Download } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BASE_CLIENTS, CONSULT_TYPES, demoSeries } from "./demo-series";

type Range = "30d" | "90d" | "12m" | "all";
const RANGE_MONTHS: Record<Range, number> = { "30d": 1, "90d": 3, "12m": 12, all: 24 };
const RANGE_LABEL: Record<Range, string> = { "30d": "last 30 days", "90d": "last 90 days", "12m": "last 12 months", all: "last 24 months" };

const C = { accent: "#824B59", sage: "#83978B", ink: "#29272B", stone: "#D6CFC6", gold: "#B07A2A", muted: "#77736F", line: "#E7E2DC" };

const tooltipStyle = {
  contentStyle: { borderRadius: 10, border: `1px solid ${C.line}`, boxShadow: "0 8px 30px rgba(41,39,43,0.10)", fontSize: 12.5, padding: "8px 12px" },
  labelStyle: { color: C.ink, fontWeight: 600, marginBottom: 4 },
  cursor: { fill: "rgba(41,39,43,0.04)" },
};

function pct(cur: number, prev: number) {
  if (!prev) return undefined;
  const p = Math.round(((cur - prev) / prev) * 100);
  return { value: `${p >= 0 ? "+" : ""}${p}%`, positive: p >= 0 };
}

export function ReportsPage() {
  const [range, setRange] = React.useState<Range>("90d");
  const series = React.useMemo(demoSeries, []);
  const tasks = useStore((s) => s.tasks);
  const readings = useStore((s) => s.readings);
  const consultations = useStore((s) => s.consultations);

  const n = RANGE_MONTHS[range];
  const cur = series.slice(-n);
  const prev = series.slice(-2 * n, -n);
  const sum = (arr: typeof series, f: (m: (typeof series)[number]) => number) => arr.reduce((a, m) => a + f(m), 0);
  const del = (m: (typeof series)[number]) => m.deliveries.pdf + m.deliveries.audio + m.deliveries.video + m.deliveries.link;

  const totalClients = BASE_CLIENTS + sum(series, (m) => m.newClients);
  const newC = sum(cur, (m) => m.newClients);
  const retC = Math.round(sum(cur, (m) => m.returningClients) * (n === 1 ? 0.9 : 0.55));
  const retPrev = Math.round(sum(prev, (m) => m.returningClients) * (n === 1 ? 0.9 : 0.55));
  const cons = sum(cur, (m) => m.consultations);
  const dels = sum(cur, del);

  // live outstanding work from the prototype store
  const open = tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.due < "2026-11-14");
  const upcoming7 = consultations.filter((k) => k.status === "scheduled" && k.start >= "2026-11-14" && k.start < "2026-11-21");
  const outstanding = [
    { name: "Overdue tasks", value: overdue.length, color: C.accent, href: "/app/tasks?view=overdue" },
    { name: "Open tasks", value: open.length - overdue.length, color: C.stone, href: "/app/tasks" },
    { name: "Draft readings", value: readings.filter((r) => r.status === "draft").length, color: C.gold, href: "/app/delivery" },
    { name: "Ready to send", value: readings.filter((r) => r.status === "ready").length, color: C.sage, href: "/app/delivery" },
    { name: "Failed deliveries", value: readings.filter((r) => r.status === "failed").length, color: "#A9443F", href: "/app/delivery" },
    { name: "Sessions next 7 days", value: upcoming7.length, color: C.ink, href: "/app/consultations" },
  ];
  const outstandingTotal = overdue.length + (open.length - overdue.length) + readings.filter((r) => ["draft", "ready", "failed"].includes(r.status)).length;

  const chartMonths = series.slice(-Math.max(6, n));
  const inRange = new Set(cur.map((m) => m.key));
  const delTypes = [
    { name: "PDF", value: sum(cur, (m) => m.deliveries.pdf), color: C.accent },
    { name: "Audio", value: sum(cur, (m) => m.deliveries.audio), color: C.sage },
    { name: "Video", value: sum(cur, (m) => m.deliveries.video), color: C.gold },
    { name: "Link", value: sum(cur, (m) => m.deliveries.link), color: C.stone },
  ];
  const typeRows = CONSULT_TYPES.map((t) => ({ ...t, count: sum(cur, (m) => m.types[t.name] ?? 0) })).sort((a, b) => b.count - a.count);
  const typeMax = Math.max(...typeRows.map((t) => t.count), 1);

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
                { value: "30d", label: "30 days" },
                { value: "90d", label: "90 days" },
                { value: "12m", label: "12 months" },
                { value: "all", label: "All" },
              ]}
            />
            <Button variant="secondary" size="sm" className="hidden md:inline-flex" onClick={() => useStore.getState().toast("Export queued", "CSV export is simulated in the prototype.")}><Download /> Export</Button>
          </>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border-2 border-dashed border-warn/50 bg-warn-50/80 px-4 py-3.5">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-warn" />
        <div className="text-[13px] text-[#7C5A22]">
          <p className="text-[14px] font-semibold">Demonstration data</p>
          <p>Trend figures are generated sample history for a practice of about {totalClients} clients — not your records. The <strong>Outstanding work</strong> panel reflects the live prototype data (tasks, deliveries and sessions you can edit).</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total clients" value={totalClients} sub={`+${newC} in ${RANGE_LABEL[range]}`} icon={<Users />} />
        <StatCard label="New clients" value={newC} trend={pct(newC, sum(prev, (m) => m.newClients))} sub="vs previous period" icon={<UserPlus />} />
        <StatCard label="Returning clients" value={retC} trend={pct(retC, retPrev)} sub="Booked again" icon={<Repeat />} />
        <StatCard label="Consultations" value={cons} trend={pct(cons, sum(prev, (m) => m.consultations))} sub="vs previous period" icon={<CalendarDays />} />
        <StatCard label="Reading deliveries" value={dels} trend={pct(dels, sum(prev, del))} sub="PDF, audio, video & links" icon={<Send />} />
        <StatCard label="Outstanding work" value={outstandingTotal} sub={<span className="text-accent">{overdue.length} overdue · live</span>} icon={<ListTodo />} href="/app/tasks" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Consultation volume" description={n < 6 ? `Monthly · highlighted: ${RANGE_LABEL[range]} (November in progress)` : "Monthly · November in progress"} />
          <CardBody className="h-[300px] pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMonths} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.line} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: C.muted }} interval={n > 12 ? 1 : 0} />
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
          <CardHeader title="Deliveries by type" description={`${dels} readings · ${RANGE_LABEL[range]}`} />
          <CardBody className="flex flex-col items-center gap-4 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative h-[200px] w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={delTypes} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                    {delTypes.map((d) => <Cell key={d.name} fill={d.color} />)}
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
          <CardHeader title="New vs returning clients" description="Clients seen per month" />
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
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: C.muted }} interval={n > 12 ? 1 : 0} />
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
          <CardHeader title="Outstanding work" description="Live from your tasks, deliveries and calendar" action={<Badge tone="sage" dot>Live</Badge>} />
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
          <CardHeader title="Top consultation types" description={RANGE_LABEL[range]} />
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

        <Card className="border-dashed bg-canvas/40">
          <CardBody className="flex h-full flex-col">
            <span className="flex size-10 items-center justify-center rounded-lg bg-canvas-2 text-muted"><Wallet className="size-5" /></span>
            <p className="mt-4 font-serif text-[22px] leading-tight">Revenue & financial reporting</p>
            <p className="mt-2 text-[13px] text-muted">
              Income by month, outstanding invoices and revenue per consultation type will appear here once payment integrations are connected.
            </p>
            <div className="mt-5 space-y-2 opacity-60">
              {[70, 45, 85].map((w, i) => <div key={i} className="h-2 rounded-full bg-canvas-3" style={{ width: `${w}%` }} />)}
            </div>
            <p className="mt-auto pt-6 text-[12px] text-muted">
              Planned · see <Link href="/pricing" className="underline">pricing</Link> for upcoming plan features.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
