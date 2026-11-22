"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListPlus, ListChecks, CalendarClock, AlertCircle, CheckCircle2, Inbox, CalendarDays, ChevronRight, ArrowLeft } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { SearchInput, Select, Checkbox } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/dialog";
import type { Task } from "@/lib/data/types";
import { cn, relDay, TODAY } from "@/lib/utils";
import { NewTaskDialog } from "./new-task-dialog";
import { TaskDetail, isOverdue } from "./task-detail";
import { useMedia } from "@/components/consultations/use-media";

type View = "all" | "today" | "upcoming" | "overdue" | "completed";


const VIEWS: { id: View; label: string; icon: React.ElementType; test: (t: Task) => boolean }[] = [
  { id: "all", label: "All Tasks", icon: Inbox, test: (t) => t.status !== "done" },
  { id: "today", label: "Today", icon: CalendarDays, test: (t) => t.status !== "done" && t.due === TODAY },
  { id: "upcoming", label: "Upcoming", icon: CalendarClock, test: (t) => t.status !== "done" && t.due > TODAY },
  { id: "overdue", label: "Overdue", icon: AlertCircle, test: (t) => isOverdue(t) },
  { id: "completed", label: "Completed", icon: CheckCircle2, test: (t) => t.status === "done" },
];

const PRI_ORDER = { high: 0, medium: 1, low: 2 };

export function TasksPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tasks = useStore((s) => s.tasks);
  const people = useStore((s) => s.people);
  const update = useStore((s) => s.updateTask);
  const toast = useStore((s) => s.toast);
  const [view, setView] = React.useState<View>((params.get("view") as View) || "all");
  const [q, setQ] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [newOpen, setNewOpen] = React.useState(params.get("new") === "1");
  const selectedId = params.get("id");
  const lg = useMedia("(min-width: 1180px)");

  React.useEffect(() => {
    const v = params.get("view") as View | null;
    if (v && VIEWS.some((x) => x.id === v)) setView(v);
    if (params.get("new") === "1") setNewOpen(true);
  }, [params]);

  const select = (id: string | null) => {
    const sp = new URLSearchParams();
    if (view !== "all") sp.set("view", view);
    if (id) sp.set("id", id);
    router.replace(`/app/tasks${sp.toString() ? "?" + sp : ""}`, { scroll: false });
  };

  const name = (id?: string) => (id ? personName(people.find((p) => p.id === id)) : "");
  const current = VIEWS.find((v) => v.id === view)!;
  const list = tasks
    .filter(current.test)
    .filter((t) => !priority || t.priority === priority)
    .filter((t) => !q || (t.title + " " + (t.description ?? "") + " " + name(t.clientId)).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (view === "completed" ? (b.completedAt ?? "").localeCompare(a.completedAt ?? "") : a.due.localeCompare(b.due) || PRI_ORDER[a.priority] - PRI_ORDER[b.priority]));

  const complete = (t: Task, done: boolean) => {
    update(t.id, { status: done ? "done" : "todo" }, done ? "Completed" : "Reopened");
    if (done) toast("Task Completed", t.title, "success");
  };

  const sideNav = (
    <nav className="flex gap-1 overflow-x-auto pb-1 no-scrollbar lg:flex-col lg:overflow-visible lg:pb-0">
      {VIEWS.map((v) => {
        const n = tasks.filter(v.test).length;
        const active = v.id === view;
        return (
          <button
            key={v.id}
            onClick={() => {
              setView(v.id);
              router.replace(`/app/tasks${v.id !== "all" ? "?view=" + v.id : ""}`, { scroll: false });
            }}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors",
              active ? "bg-surface font-medium text-ink shadow-card ring-1 ring-line" : "text-muted hover:bg-canvas-2 hover:text-ink",
            )}
          >
            <v.icon className={cn("size-4", v.id === "overdue" && n > 0 ? "text-danger" : "")} />
            <span className="flex-1">{v.label}</span>
            <span className={cn("rounded-full px-1.5 text-[11px]", v.id === "overdue" && n > 0 ? "bg-danger-50 text-danger" : "bg-canvas-3 text-muted")}>{n}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Tasks & Follow-Ups" }]}
        title="Tasks & Follow-Ups"
        description="Preparation, follow-ups and practice admin — linked to the clients and consultations they belong to."
        actions={<Button onClick={() => setNewOpen(true)}><ListPlus /> New Task</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)] min-[1180px]:grid-cols-[210px_minmax(0,1fr)_400px]">
        <div>{sideNav}</div>
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks or clients…" className="flex-1" />
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:w-44" aria-label="Filter by Priority">
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </Select>
          </div>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-[13px] font-semibold">{current.label}</p>
              <p className="text-[12px] text-muted">{list.length} {list.length === 1 ? "task" : "tasks"}</p>
            </div>
            {list.length === 0 ? (
              <EmptyState icon={<ListChecks />} title="Nothing Here" body={view === "overdue" ? "You're all caught up." : "No tasks match these filters."} />
            ) : (
              <ul className="divide-y divide-line">
                {list.map((t) => {
                  const od = isOverdue(t);
                  const cl = t.checklist.length;
                  const cd = t.checklist.filter((c) => c.done).length;
                  return (
                    <li key={t.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas/70", selectedId === t.id && "bg-accent-50/40")}>
                      <Checkbox checked={t.status === "done"} onChange={(e) => complete(t, e.target.checked)} aria-label="Complete Task" />
                      <button onClick={() => select(t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-[13.5px] font-medium", t.status === "done" && "text-muted line-through")}>{t.title}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted">
                            {t.clientId && <span>{name(t.clientId)}</span>}
                            {cl > 0 && <span>{cd}/{cl} checklist</span>}
                            {t.status === "in-progress" && <span className="text-[#4B5D73]">In progress</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={cn("text-[12px]", od ? "font-medium text-danger" : "text-muted")}>{t.status === "done" ? "Done" : od ? `Overdue · ${relDay(t.due)}` : relDay(t.due)}</span>
                          <Badge tone={t.priority === "high" ? "danger" : t.priority === "medium" ? "warn" : "neutral"} className="text-[10.5px] capitalize">
                            {t.priority}
                          </Badge>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {lg && (
          <div className="min-w-0">
            <Card className="sticky top-24 overflow-hidden">
              {selectedId ? (
                <>
                  <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                    <button onClick={() => select(null)} className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink"><ArrowLeft className="size-3.5" /> Close</button>
                    <span className="eyebrow">Task detail</span>
                  </div>
                  <div className="scrollbar-thin max-h-[calc(100vh-150px)] overflow-y-auto p-5">
                    <TaskDetail id={selectedId} onDeleted={() => select(null)} />
                  </div>
                </>
              ) : (
                <EmptyState icon={<ListChecks />} title="Select a Task" body="Open a task to edit details, work through its checklist and see its history." />
              )}
            </Card>
          </div>
        )}
      </div>

      {!lg && (
        <Sheet open={!!selectedId} onOpenChange={(o) => !o && select(null)} title="Task" description="Details, checklist and history">
          <div className="p-5">{selectedId && <TaskDetail id={selectedId} onDeleted={() => select(null)} />}</div>
        </Sheet>
      )}

      <NewTaskDialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o);
          if (!o && params.get("new")) router.replace("/app/tasks", { scroll: false });
        }}
        defaultClientId={params.get("client") ?? undefined}
        onCreated={(t) => select(t.id)}
      />
    </div>
  );
}
