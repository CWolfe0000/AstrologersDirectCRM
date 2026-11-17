"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, ChevronLeft, ChevronRight, ArrowLeft, Globe, CalendarSync, BellRing, SlidersHorizontal } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, SimulatedBadge } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/tabs";
import { Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/dialog";
import { DEMO_TODAY, monthName, fmtShort, sameDay, cn, TODAY, daysFromToday } from "@/lib/utils";
import { AgendaList, ConsultationRow, MonthView, TimeGrid, addDays, startOfWeek, type CalView } from "./calendar-views";
import { ConsultationDetail } from "./consultation-detail";
import { NewConsultationDialog } from "./new-consultation-dialog";
import { useMedia } from "./use-media";

export function ConsultationsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const consultations = useStore((s) => s.consultations);
  const people = useStore((s) => s.people);
  const clients = useStore((s) => s.clients);
  const nameOf = React.useCallback((id: string) => personName(people.find((p) => p.id === id)), [people]);

  const [view, setView] = React.useState<CalView>("month");
  const [date, setDate] = React.useState(new Date(DEMO_TODAY));
  const [type, setType] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [client, setClient] = React.useState(params.get("client") && !params.get("new") ? params.get("client")! : "");
  const [listTab, setListTab] = React.useState<"upcoming" | "past">("upcoming");
  const [showFilters, setShowFilters] = React.useState(false);
  const selectedId = params.get("id");
  const [newOpen, setNewOpen] = React.useState(params.get("new") === "1");
  const [newDate, setNewDate] = React.useState<string | undefined>();
  const xl = useMedia("(min-width: 1280px)");
  const md = useMedia("(min-width: 768px)");

  React.useEffect(() => {
    if (params.get("new") === "1") setNewOpen(true);
  }, [params]);

  // Jump calendar to the selected consultation's date
  React.useEffect(() => {
    const k = consultations.find((c) => c.id === selectedId);
    if (k) setDate(new Date(k.start));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const select = (id: string | null) => {
    const q = new URLSearchParams();
    if (id) q.set("id", id);
    router.replace(`/app/consultations${q.toString() ? "?" + q : ""}`, { scroll: false });
  };

  const types = [...new Set(consultations.map((c) => c.type))].sort();
  const filtered = consultations.filter((k) => (!type || k.type === type) && (!status || k.status === status) && (!client || k.clientId === client));

  const nowIso = TODAY + "T00:00:00";
  const upcoming = filtered.filter((k) => k.start >= nowIso && k.status === "scheduled").sort((a, b) => a.start.localeCompare(b.start));
  const past = filtered.filter((k) => k.start < nowIso || k.status !== "scheduled").filter((k) => k.start < daysFromToday(1) + "").sort((a, b) => b.start.localeCompare(a.start));

  const shift = (dir: number) => {
    const d = new Date(date);
    if (view === "month") d.setMonth(d.getMonth() + dir, 1);
    else d.setDate(d.getDate() + dir * (view === "week" ? 7 : 1));
    setDate(d);
  };

  const label = (() => {
    if (view === "month") return `${monthName(date.getMonth(), true)} ${date.getFullYear()}`;
    if (view === "week") {
      const s = startOfWeek(date);
      const e = addDays(s, 6);
      return `${fmtShort(s)} – ${fmtShort(e)}, ${e.getFullYear()}`;
    }
    return `${monthName(date.getMonth(), true)} ${date.getDate()}, ${date.getFullYear()}`;
  })();

  // items within current period for agenda (mobile)
  const periodItems = filtered.filter((k) => {
    const d = new Date(k.start);
    if (view === "month") return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    if (view === "week") {
      const s = startOfWeek(date);
      return d >= s && d < addDays(s, 7);
    }
    return sameDay(d, date);
  });

  const openCreate = (d?: string) => {
    setNewDate(d);
    setNewOpen(true);
  };

  const common = { date, items: filtered, nameOf, selectedId, onSelect: (id: string) => select(id), onCreate: openCreate };
  const todayCount = consultations.filter((k) => sameDay(k.start, DEMO_TODAY) && k.status === "scheduled").length;
  const weekCount = consultations.filter((k) => {
    const s = startOfWeek(DEMO_TODAY);
    const d = new Date(k.start);
    return d >= s && d < addDays(s, 7) && k.status !== "cancelled";
  }).length;

  const listPanel = (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Segmented
          size="sm"
          value={listTab}
          onChange={setListTab}
          options={[
            { value: "upcoming", label: "Upcoming", count: upcoming.length },
            { value: "past", label: "Past", count: past.length },
          ]}
        />
      </div>
      <div className="scrollbar-thin max-h-[680px] space-y-1.5 overflow-y-auto p-3">
        {(listTab === "upcoming" ? upcoming : past).map((k) => (
          <ConsultationRow key={k.id} k={k} name={nameOf(k.clientId)} selected={selectedId === k.id} onClick={() => select(k.id)} showDate />
        ))}
        {(listTab === "upcoming" ? upcoming : past).length === 0 && <p className="py-8 text-center text-[13px] text-muted">Nothing here with the current filters.</p>}
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Consultations & Calendar" }]}
        title="Consultations & Calendar"
        description={`${todayCount} consultations today · ${weekCount} this week. Select a session to prepare, take notes and create follow-ups.`}
        actions={
          <Button onClick={() => openCreate()}>
            <CalendarPlus /> New Consultation
          </Button>
        }
      />

      {/* toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDate(new Date(DEMO_TODAY))}>Today</Button>
          <div className="flex">
            <Button variant="ghost" size="icon-sm" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft /></Button>
            <Button variant="ghost" size="icon-sm" onClick={() => shift(1)} aria-label="Next"><ChevronRight /></Button>
          </div>
          <h2 className="font-serif text-[22px] leading-none">{label}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
              { value: "day", label: "Day" },
            ]}
          />
          <Button variant={showFilters || type || status || client ? "subtle" : "secondary"} size="sm" onClick={() => setShowFilters((f) => !f)}>
            <SlidersHorizontal /> Filters{[type, status, client].filter(Boolean).length ? ` · ${[type, status, client].filter(Boolean).length}` : ""}
          </Button>
        </div>
      </div>
      {showFilters && (
        <div className="mb-4 grid gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-4">
          <Select value={client} onChange={(e) => setClient(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{nameOf(c.id)}</option>)}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            {types.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-Show</option>
          </Select>
          <Button variant="ghost" size="md" onClick={() => { setType(""); setStatus(""); setClient(""); }}>Clear Filters</Button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          {!md ? (
            <AgendaList {...common} items={periodItems} empty="No consultations in this period." />
          ) : view === "month" ? (
            <MonthView {...common} onPickDay={(d) => { setDate(d); setView("day"); }} />
          ) : (
            <TimeGrid {...common} days={view === "week" ? 7 : 1} />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-muted">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-accent" /> Scheduled</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sage" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-line-strong" /> Cancelled</span>
          </div>

          {!xl && <div className="mt-6">{listPanel}</div>}

          <Card className="mt-6 border-dashed bg-canvas/40 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13.5px] font-semibold">Coming later</p>
              <SimulatedBadge label="Future" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { i: Globe, t: "Self-service booking", d: "Clients book available slots from your practice page." },
                { i: CalendarSync, t: "External calendars", d: "Two-way sync with Google, Outlook and iCloud." },
                { i: BellRing, t: "Automated reminders", d: "Email/SMS reminders and birth-data confirmation." },
              ].map((f) => (
                <div key={f.t} className="flex gap-3">
                  <f.i className="mt-0.5 size-4 shrink-0 text-muted" />
                  <div>
                    <p className="text-[13px] font-medium text-ink-3">{f.t}</p>
                    <p className="text-[12px] text-muted">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {xl && (
          <div className="min-w-0">
            {selectedId ? (
              <Card className="sticky top-24 overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <button onClick={() => select(null)} className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink">
                    <ArrowLeft className="size-3.5" /> All consultations
                  </button>
                  <span className="eyebrow">Consultation</span>
                </div>
                <div className={cn("scrollbar-thin max-h-[calc(100vh-150px)] overflow-y-auto p-5")}>
                  <ConsultationDetail id={selectedId} />
                </div>
              </Card>
            ) : (
              listPanel
            )}
          </div>
        )}
      </div>

      {!xl && (
        <Sheet open={!!selectedId} onOpenChange={(o) => !o && select(null)} title="Consultation" description="Preparation, notes and follow-ups">
          <div className="p-5 md:p-6">{selectedId && <ConsultationDetail id={selectedId} />}</div>
        </Sheet>
      )}

      <NewConsultationDialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o);
          if (!o && params.get("new")) router.replace("/app/consultations", { scroll: false });
        }}
        defaultClientId={params.get("client") ?? undefined}
        defaultDate={newDate}
        onCreated={(k) => select(k.id)}
      />
    </div>
  );
}
