"use client";

import * as React from "react";
import Link from "next/link";
import { Video, Phone, MapPin, Lock, FileText, Clock, CalendarPlus, PenLine, Headphones, Mic } from "lucide-react";
import { mediaUrl } from "@/lib/upload";
import { useStore } from "@/lib/store";
import { cn, fmtDate, fmtTime, monthName, sameDay } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/tabs";
import { FileKindIcon } from "@/components/ui/misc";
import { practiceOf, useMyConsultations, useMyReadings, usePortalPractices, useSharedFiles, PORTAL_NOW } from "@/components/portal/portal-data";
import { AddToCalendar, SessionActions } from "@/components/portal/session-actions";
import { formatLabel } from "@/lib/booking/formats";

const LOC_ICON = { "Video call": Video, Phone: Phone, "In person": MapPin, "Written reading": PenLine, "Audio call": Headphones, "Live session": Video, "Recorded reading": Mic } as const;

export default function PortalConsultations() {
  const all = useMyConsultations();
  const readings = useMyReadings();
  const files = useSharedFiles();
  const toast = useStore((s) => s.toast);
  const practices = usePortalPractices();
  const who = (k: unknown) => practices.find((p) => p.id === practiceOf(k)) ?? practices[0]!;
  const [view, setView] = React.useState<"upcoming" | "past">("upcoming");
  const upcoming = all.filter((k) => k.status === "scheduled" && k.start.slice(0, 10) >= PORTAL_NOW.slice(0, 10));
  const past = all.filter((k) => !upcoming.includes(k)).reverse();
  const list = view === "upcoming" ? upcoming : past;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-[34px] leading-tight text-ink md:text-[40px]">Consultations</h1>
        <div className="flex flex-wrap gap-2">
          {practices.filter((p) => p.bookingUrl).map((p) => (
            <a key={p.id || "p"} href={p.bookingUrl} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-[13.5px] font-medium text-white hover:bg-accent-hover">
              <CalendarPlus className="size-4" /> Book a Session{practices.length > 1 ? ` With ${p.firstName}` : ""}
            </a>
          ))}
        </div>
      </div>
      <p className="mt-1.5 text-[15px] text-muted">Your sessions with your astrologer, and what was shared from each.</p>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-ink-3">
        <Lock className="mt-0.5 size-4 shrink-0 text-sage-dark" />
        <span>Your astrologer&apos;s private working notes are not shown here. You&apos;ll see session details, summaries and materials shared with you.</span>
      </div>

      <Segmented
        className="mt-6"
        value={view}
        onChange={setView}
        options={[
          { value: "upcoming", label: "Upcoming", count: upcoming.length },
          { value: "past", label: "Previous", count: past.length },
        ]}
      />

      <ol className="mt-6 space-y-4">
        {list.map((k) => {
          const d = new Date(k.start);
          const Icon = LOC_ICON[k.location];
          const today = sameDay(k.start, PORTAL_NOW);
          const related = readings.filter((r) => k.readingIds.includes(r.id));
          const shared = files.filter((f) => f.uploadedAt.slice(0, 7) === k.start.slice(0, 7));
          return (
            <li key={k.id} id={k.id} className={cn("scroll-mt-24 rounded-2xl border bg-surface p-5 sm:p-6", today ? "border-accent-100" : "border-line")}>
              <div className="flex gap-4">
                <div className={cn("flex size-14 shrink-0 flex-col items-center justify-center rounded-xl", today ? "bg-accent text-white" : "bg-canvas-2 text-ink")}>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">{monthName(d.getMonth())}</span>
                  <span className="font-serif text-[22px] leading-none">{d.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-[20px] leading-tight text-ink">{k.type}</h2>
                    {today ? <StatusBadge status="new" label="Today" /> : <StatusBadge status={k.status} />}
                  </div>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
                    <span>{fmtDate(k.start)} · {fmtTime(k.start)}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{k.durationMin} min</span>
                    <span className="inline-flex items-center gap-1"><Icon className="size-3.5" />{formatLabel(k.location)}</span>
                  </p>
                </div>
              </div>

              {k.sharedSummary && (
                <div className="mt-4 rounded-xl bg-canvas px-4 py-3">
                  <p className="eyebrow mb-1">Session summary</p>
                  <p className="text-[13.5px] leading-relaxed text-ink-3">{k.sharedSummary}</p>
                </div>
              )}

              {(related.length > 0 || (view === "past" && shared.length > 0)) && (
                <div className="mt-4">
                  <p className="mb-2 text-[12.5px] font-semibold text-ink">Shared materials</p>
                  <ul className="space-y-2">
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link href={`/portal/readings/${r.id}`} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 hover:border-line-strong hover:bg-canvas">
                          <FileKindIcon kind={r.kind} className="size-8 [&_svg]:size-4" />
                          <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{r.title}</span>
                          <span className="text-[12px] text-accent">Open</span>
                        </Link>
                      </li>
                    ))}
                    {view === "past" &&
                      shared.map((f) => (
                        <li key={f.id}>
                          <button onClick={() => (f.fileKey ? (window.location.href = mediaUrl("files", f.id, true)) : toast("Download Started", `${f.name} (simulated)`, "success"))} className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left hover:border-line-strong hover:bg-canvas">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-canvas-2 text-ink-3"><FileText className="size-4" /></span>
                            <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{f.name}</span>
                            <span className="text-[12px] text-accent">Download</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {view === "upcoming" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <SessionActions k={k} today={today} who={who(k).firstName || who(k).name || "Your astrologer"} />
                  <AddToCalendar k={k} who={who(k).name || "your astrologer"} zone={who(k).timezone} className="h-10" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {list.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-muted">No {view === "upcoming" ? "upcoming" : "previous"} consultations.</p>}
    </div>
  );
}
