"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { Consultation } from "@/lib/data/types";
import { cn, dayName, fmtTime, sameDay, DEMO_TODAY, fmtDay, monthName } from "@/lib/utils";
import { formatLabel } from "@/lib/booking/formats";

export type CalView = "month" | "week" | "day";

export function ymd(d: Date) {
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function eventTone(k: Consultation, selected: boolean) {
  const base =
    k.status === "completed"
      ? "bg-sage-50 text-sage-dark border-l-sage"
      : k.status === "cancelled" || k.status === "no-show"
        ? "bg-canvas-2 text-muted border-l-line-strong line-through"
        : "bg-accent-50 text-accent-hover border-l-accent";
  return cn(base, "border-l-2", selected && "ring-2 ring-accent/40");
}

type Common = {
  date: Date;
  items: Consultation[];
  nameOf: (id: string) => string;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onCreate: (date: string) => void;
};

export function MonthView({ date, items, nameOf, selectedId, onSelect, onCreate, onPickDay }: Common & { onPickDay: (d: Date) => void }) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weeks = days[35]!.getMonth() !== date.getMonth() ? 5 : 6;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line bg-canvas/60">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="px-2.5 py-2 text-[11.5px] font-semibold uppercase tracking-wider text-muted">{dayName(i)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.slice(0, weeks * 7).map((d, i) => {
          const inMonth = d.getMonth() === date.getMonth();
          const isToday = sameDay(d, DEMO_TODAY);
          const evs = items.filter((k) => sameDay(k.start, d)).sort((a, b) => a.start.localeCompare(b.start));
          return (
            <div
              key={i}
              className={cn("group relative min-h-[112px] border-b border-r border-line p-1.5 [&:nth-child(7n)]:border-r-0", !inMonth && "bg-canvas/50")}
            >
              <div className="mb-1 flex items-center justify-between">
                <button
                  onClick={() => onPickDay(d)}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[12px] hover:bg-canvas-2",
                    isToday ? "bg-accent font-semibold text-white hover:bg-accent-hover" : inMonth ? "text-ink" : "text-muted/60",
                  )}
                >
                  {d.getDate()}
                </button>
                <button
                  onClick={() => onCreate(ymd(d))}
                  className="rounded p-0.5 text-muted opacity-0 hover:bg-canvas-2 hover:text-ink group-hover:opacity-100"
                  aria-label="New Consultation on This Day"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {evs.slice(0, 3).map((k) => (
                  <button
                    key={k.id}
                    onClick={() => onSelect(k.id)}
                    className={cn("block w-full truncate rounded px-1.5 py-0.5 text-left text-[11.5px] leading-[18px]", eventTone(k, selectedId === k.id))}
                    title={`${k.type} — ${nameOf(k.clientId)}`}
                  >
                    <span className="font-medium">{fmtTime(k.start).replace(":00", "")}</span> {nameOf(k.clientId).split(" ")[0]}
                  </button>
                ))}
                {evs.length > 3 && (
                  <button onClick={() => onPickDay(d)} className="px-1.5 text-[11px] text-muted hover:text-ink">+{evs.length - 3} more</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const H0 = 7;
const H1 = 21;
const PX = 52;

export function TimeGrid({ date, items, nameOf, selectedId, onSelect, onCreate, days }: Common & { days: number }) {
  const start = days === 1 ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : startOfWeek(date);
  const cols = Array.from({ length: days }, (_, i) => addDays(start, i));
  const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid border-b border-line bg-canvas/60" style={{ gridTemplateColumns: `56px repeat(${days}, minmax(0,1fr))` }}>
        <div />
        {cols.map((d) => {
          const isToday = sameDay(d, DEMO_TODAY);
          return (
            <div key={d.toISOString()} className="border-l border-line px-2 py-2 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{dayName(d.getDay())}</div>
              <div className={cn("mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-[14px]", isToday && "bg-accent font-semibold text-white")}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="scrollbar-thin max-h-[640px] overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${days}, minmax(0,1fr))` }}>
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: PX }} className="pr-2 pt-0.5 text-right text-[10.5px] text-muted">
                {h % 12 || 12} {h >= 12 ? "PM" : "AM"}
              </div>
            ))}
          </div>
          {cols.map((d) => {
            const evs = items.filter((k) => sameDay(k.start, d));
            return (
              <div key={d.toISOString()} className={cn("relative border-l border-line", sameDay(d, DEMO_TODAY) && "bg-accent-50/25")}>
                {hours.map((h) => (
                  <button
                    key={h}
                    style={{ height: PX }}
                    onClick={() => onCreate(ymd(d))}
                    className="block w-full border-b border-line/60 hover:bg-canvas/70"
                    aria-label={`New consultation ${fmtDay(d)} ${h}:00`}
                  />
                ))}
                {evs.map((k) => {
                  const s = new Date(k.start);
                  const top = (s.getHours() + s.getMinutes() / 60 - H0) * PX;
                  const height = Math.max((k.durationMin / 60) * PX - 3, 22);
                  return (
                    <button
                      key={k.id}
                      onClick={() => onSelect(k.id)}
                      style={{ top, height }}
                      className={cn("absolute inset-x-1 overflow-hidden rounded-md px-2 py-1 text-left shadow-card", eventTone(k, selectedId === k.id))}
                    >
                      <p className="truncate text-[11.5px] font-semibold">{nameOf(k.clientId)}</p>
                      {height > 34 && <p className="truncate text-[11px] opacity-80">{fmtTime(k.start)} · {k.type}</p>}
                      {days === 1 && height > 60 && <p className="truncate text-[11px] opacity-70">{formatLabel(k.location)} · {k.durationMin} min</p>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AgendaList({ items, nameOf, selectedId, onSelect, empty }: Omit<Common, "date" | "onCreate"> & { empty?: string }) {
  const groups = new Map<string, Consultation[]>();
  [...items].sort((a, b) => a.start.localeCompare(b.start)).forEach((k) => {
    const key = k.start.slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), k]);
  });
  if (groups.size === 0) return <p className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-[13px] text-muted">{empty ?? "No consultations in this period."}</p>;
  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([day, ks]) => (
        <div key={day}>
          <p className={cn("mb-1.5 text-[12px] font-semibold", sameDay(day, DEMO_TODAY) ? "text-accent" : "text-muted")}>
            {sameDay(day, DEMO_TODAY) ? "Today · " : ""}
            {fmtDay(day)}
          </p>
          <div className="space-y-1.5">
            {ks.map((k) => (
              <ConsultationRow key={k.id} k={k} name={nameOf(k.clientId)} selected={selectedId === k.id} onClick={() => onSelect(k.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConsultationRow({ k, name, selected, onClick, showDate }: { k: Consultation; name: string; selected?: boolean; onClick: () => void; showDate?: boolean }) {
  const d = new Date(k.start);
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors hover:border-line-strong",
        selected ? "border-accent/50 ring-1 ring-accent/20" : "border-line",
      )}
    >
      {showDate ? (
        <div className="w-11 shrink-0 text-center">
          <div className="text-[10.5px] font-semibold uppercase text-muted">{monthName(d.getMonth())}</div>
          <div className="font-serif text-[20px] leading-none">{d.getDate()}</div>
        </div>
      ) : (
        <span
          className={cn(
            "h-9 w-1 shrink-0 rounded-full",
            k.status === "completed" ? "bg-sage" : k.status === "scheduled" ? "bg-accent" : "bg-line-strong",
          )}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13.5px] font-medium", k.status === "cancelled" && "text-muted line-through")}>{name}</p>
        <p className="truncate text-[12px] text-muted">
          {fmtTime(k.start)} · {k.type}
        </p>
      </div>
      <span className="hidden text-[11.5px] text-muted sm:block">{k.durationMin}m</span>
    </button>
  );
}
