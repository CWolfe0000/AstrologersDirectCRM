"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, CalendarDays, CircleDot, Send, UserPlus, CalendarPlus, NotebookPen, Mic, ArrowRight, Video, Phone, MapPin, Clock,
  ListChecks, AlertCircle, Activity as ActivityIcon, User,
} from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { cn, DEMO_TODAY, fmtLong, fmtTime, fmtDay, fmtShort, relTime, relDay, sameDay } from "@/lib/utils";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatCard, EmptyState } from "@/components/ui/misc";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { isUpcoming, lastConsultation, nextConsultation, TODAY_ISO } from "@/components/clients/helpers";
import type { Activity, Consultation } from "@/lib/data/types";

const ACTIONS = [
  { label: "Add Client", href: "/app/clients/new", icon: UserPlus },
  { label: "Create Chart", href: "/app/charts/new", icon: CircleDot },
  { label: "Schedule Consultation", href: "/app/consultations?new=1", icon: CalendarPlus },
  { label: "Add Observation", href: "/app/observations?new=1", icon: NotebookPen },
  { label: "Record Reading", href: "/app/studio", icon: Mic },
  { label: "Deliver Reading", href: "/app/delivery?new=1", icon: Send },
];

const LOC_ICON = { "Video call": Video, Phone: Phone, "In person": MapPin } as const;

const ACT_ICON: Record<Activity["kind"], { i: React.ElementType; c: string }> = {
  observation: { i: NotebookPen, c: "bg-sage-50 text-sage-dark" },
  chart: { i: CircleDot, c: "bg-accent-50 text-accent" },
  reading: { i: Send, c: "bg-[#F3EDE4] text-[#7A6145]" },
  consultation: { i: CalendarDays, c: "bg-[#ECEEF3] text-[#4D5A70]" },
  client: { i: User, c: "bg-sage-50 text-sage-dark" },
  task: { i: ListChecks, c: "bg-warn-50 text-warn" },
  recording: { i: Mic, c: "bg-accent-50 text-accent" },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const s = useStore();
  const name = (id?: string) => personName(s.people.find((p) => p.id === id));
  const [taskView, setTaskView] = React.useState<"overdue" | "upcoming" | "follow">("overdue");
  const [hello, setHello] = React.useState("Good morning");
  React.useEffect(() => setHello(greeting()), []);

  const activeClients = s.clients.filter((c) => c.status !== "archived");
  const newClients = s.clients.filter((c) => c.status === "new").length;
  const upcoming = s.consultations.filter(isUpcoming).sort((a, b) => a.start.localeCompare(b.start));
  const today = upcoming.filter((k) => sameDay(k.start, DEMO_TODAY));
  const later = upcoming.filter((k) => !sameDay(k.start, DEMO_TODAY)).slice(0, 4);
  const thisWeek = upcoming.filter((k) => new Date(k.start).getTime() < DEMO_TODAY.getTime() + 7 * 86400000).length;
  const activeCharts = s.charts.filter((c) => s.clients.find((x) => x.id === c.clientId)?.status !== "archived");
  const recentlyOpened = s.charts.filter((c) => c.lastOpenedAt && c.lastOpenedAt >= "2026-11-07").length;
  const pending = s.readings.filter((r) => r.status !== "delivered");
  const failed = pending.filter((r) => r.status === "failed").length;

  const openTasks = s.tasks.filter((t) => t.status !== "done");
  const overdue = openTasks.filter((t) => t.due < TODAY_ISO).sort((a, b) => a.due.localeCompare(b.due));
  const upcomingTasks = openTasks.filter((t) => t.due >= TODAY_ISO).sort((a, b) => a.due.localeCompare(b.due));
  const followUps = openTasks.filter((t) => t.consultationId).sort((a, b) => a.due.localeCompare(b.due));
  const taskList = (taskView === "overdue" ? overdue : taskView === "upcoming" ? upcomingTasks : followUps).slice(0, 6);

  const recentClients = [...activeClients]
    .map((c) => {
      const acts = s.activity.filter((a) => a.clientId === c.id).sort((a, b) => b.at.localeCompare(a.at));
      const last = lastConsultation(s.consultations, c.id);
      const lastAt = [acts[0]?.at, last?.start].filter(Boolean).sort().reverse()[0];
      return { c, lastAt, lastText: acts[0]?.text ?? (last ? `${last.type}` : "Client record created"), next: nextConsultation(s.consultations, c.id) };
    })
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-1.5">{fmtLong(DEMO_TODAY)}</p>
          <h1 className="font-serif text-[30px] leading-[1.1] md:text-[36px]">
            {hello}, {s.practitioner.firstName}.
          </h1>
          <p className="mt-1.5 text-muted">
            You have <span className="font-medium text-ink">{today.length} consultations today</span>, {overdue.length} overdue {overdue.length === 1 ? "task" : "tasks"} and {pending.length} readings awaiting delivery.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/app/consultations" variant="secondary" size="sm">
            <CalendarDays /> Open calendar
          </ButtonLink>
          <ButtonLink href="/app/clients/new" size="sm">
            <UserPlus /> Add client
          </ButtonLink>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard label="Total clients" value={activeClients.length} sub={`${newClients} new this month`} icon={<Users />} href="/app/clients" />
        <StatCard label="Upcoming consultations" value={upcoming.length} sub={`${thisWeek} in the next 7 days`} icon={<CalendarDays />} href="/app/consultations" />
        <StatCard label="Active charts" value={activeCharts.length} sub={`${recentlyOpened} opened this week`} icon={<CircleDot />} href="/app/charts" />
        <StatCard
          label="Pending deliveries"
          value={pending.length}
          sub={failed ? <span className="text-danger">{failed} failed — needs attention</span> : "All on track"}
          icon={<Send />}
          href="/app/delivery"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Today */}
          <Card>
            <CardHeader
              title="Today's schedule"
              description={fmtDay(DEMO_TODAY)}
              icon={<Clock />}
              action={
                <ButtonLink href="/app/consultations?new=1" variant="ghost" size="sm">
                  <CalendarPlus /> Schedule
                </ButtonLink>
              }
            />
            {today.length === 0 ? (
              <EmptyState icon={<CalendarDays />} title="No consultations today" />
            ) : (
              <ul className="divide-y divide-line">
                {today.map((k) => (
                  <TodayRow key={k.id} k={k} name={name(k.clientId)} />
                ))}
              </ul>
            )}
            {later.length > 0 && (
              <div className="border-t border-line bg-canvas/60 px-5 py-4">
                <p className="eyebrow mb-2.5">Coming up</p>
                <ul className="space-y-2">
                  {later.map((k) => (
                    <li key={k.id}>
                      <Link href={`/app/consultations?id=${k.id}`} className="flex items-center gap-3 rounded-lg px-1 py-1 text-[13px] hover:bg-canvas-2">
                        <span className="w-24 shrink-0 text-muted">{fmtDay(k.start)}</span>
                        <span className="w-16 shrink-0 text-muted">{fmtTime(k.start)}</span>
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{name(k.clientId)}</span> <span className="text-muted">· {k.type}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent clients */}
            <Card>
              <CardHeader title="Recent clients" icon={<Users />} action={<Link href="/app/clients" className="text-[12.5px] font-medium text-accent hover:underline">View all</Link>} />
              {recentClients.length === 0 && (
                <p className="px-5 py-6 text-[13px] text-muted">
                  No clients yet. <Link href="/app/clients/new" className="font-medium text-accent hover:underline">Add your first client</Link>.
                </p>
              )}
              <ul className="divide-y divide-line">
                {recentClients.map(({ c, lastAt, lastText, next }) => (
                  <li key={c.id}>
                    <Link href={`/app/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas/70">
                      <Avatar name={name(c.id)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13.5px] font-medium">{name(c.id)}</p>
                          {c.status === "new" && <StatusBadge status="new" />}
                        </div>
                        <p className="truncate text-[12px] text-muted">
                          {lastAt ? relTime(lastAt) : "—"} · {lastText}
                        </p>
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="text-[11px] text-muted">Next</p>
                        <p className="text-[12px] font-medium">{next ? fmtShort(next.start) : "—"}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader title="Recent activity" icon={<ActivityIcon />} />
              {s.activity.length === 0 && <p className="px-5 py-6 text-[13px] text-muted">Changes to clients, charts, observations and readings will appear here.</p>}
              <ul className="px-5 py-3">
                {s.activity.slice(0, 7).map((a, i, arr) => {
                  const m = ACT_ICON[a.kind];
                  return (
                    <li key={a.id} className="relative flex gap-3 pb-3.5">
                      {i < arr.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-22px)] w-px bg-line" />}
                      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", m.c)}>
                        <m.i className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        {a.href ? (
                          <Link href={a.href} className="text-[13px] leading-snug hover:text-accent">
                            {a.text}
                          </Link>
                        ) : (
                          <p className="text-[13px] leading-snug">{a.text}</p>
                        )}
                        <p className="mt-0.5 text-[11.5px] text-muted">
                          {relTime(a.at)}
                          {a.clientId && <> · {name(a.clientId)}</>}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick actions" />
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 xl:grid-cols-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => router.push(a.href)}
                  className="flex flex-col items-start gap-2 rounded-lg border border-line bg-canvas/50 p-3 text-left text-[12.5px] font-medium transition-colors hover:border-accent-200 hover:bg-accent-50/50"
                >
                  <a.icon className="size-4 text-accent" />
                  {a.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardBody className="pb-4">
              <MiniCalendar consultations={s.consultations} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tasks" icon={<ListChecks />} action={<Link href="/app/tasks" className="text-[12.5px] font-medium text-accent hover:underline">All tasks</Link>} />
            <div className="px-4 pt-3">
              <Segmented
                size="sm"
                value={taskView}
                onChange={setTaskView}
                className="w-full [&>button]:flex-1 [&>button]:justify-center"
                options={[
                  { value: "overdue", label: "Overdue", count: overdue.length },
                  { value: "upcoming", label: "Upcoming", count: upcomingTasks.length },
                  { value: "follow", label: "Follow-ups", count: followUps.length },
                ]}
              />
            </div>
            <ul className="p-2">
              {taskList.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted">Nothing here — nicely done.</li>}
              {taskList.map((t) => {
                const late = t.due < TODAY_ISO;
                return (
                  <li key={t.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-canvas/70">
                    <Checkbox
                      className="mt-0.5"
                      checked={false}
                      onChange={() => {
                        s.updateTask(t.id, { status: "done" }, "Completed from dashboard");
                        s.toast("Task completed", t.title, "success");
                      }}
                      aria-label={`Complete ${t.title}`}
                    />
                    <Link href={`/app/tasks?id=${t.id}`} className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug">{t.title}</p>
                      <p className={cn("mt-0.5 flex items-center gap-1 text-[11.5px]", late ? "text-danger" : "text-muted")}>
                        {late && <AlertCircle className="size-3" />}
                        {late ? `Overdue · ${fmtShort(t.due)}` : `Due ${relDay(t.due)}`}
                        {t.clientId && <span className="text-muted"> · {name(t.clientId)}</span>}
                      </p>
                    </Link>
                    {t.priority === "high" && <Badge tone="danger" className="shrink-0">High</Badge>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TodayRow({ k, name }: { k: Consultation; name: string }) {
  const Loc = LOC_ICON[k.location];
  const end = new Date(new Date(k.start).getTime() + k.durationMin * 60000);
  const past = end.getTime() < DEMO_TODAY.getTime();
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex w-full items-center gap-4 sm:w-auto">
        <div className="w-[74px] shrink-0">
          <p className="text-[14px] font-semibold">{fmtTime(k.start)}</p>
          <p className="text-[11.5px] text-muted">{k.durationMin} min</p>
        </div>
        <span className={cn("h-10 w-[3px] shrink-0 rounded-full", past ? "bg-line-strong" : "bg-accent")} />
        <div className="min-w-0 flex-1 sm:w-64">
          <Link href={`/app/clients/${k.clientId}`} className="block truncate text-[14px] font-medium hover:text-accent">
            {name}
          </Link>
          <p className="flex items-center gap-1.5 truncate text-[12.5px] text-muted">
            {k.type} · <Loc className="size-3.5" /> {k.location}
          </p>
        </div>
      </div>
      {k.prepNotes && <p className="line-clamp-2 flex-1 text-[12.5px] text-muted sm:pl-2">{k.prepNotes}</p>}
      <div className="flex shrink-0 gap-2 sm:ml-auto">
        {k.chartIds[0] && (
          <ButtonLink href={`/app/charts/${k.chartIds[0]}`} variant="secondary" size="xs">
            <CircleDot /> Chart
          </ButtonLink>
        )}
        <ButtonLink href={`/app/consultations?id=${k.id}`} variant="secondary" size="xs">
          Details <ArrowRight />
        </ButtonLink>
      </div>
    </li>
  );
}
