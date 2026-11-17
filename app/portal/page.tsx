"use client";

import Link from "next/link";
import { ArrowRight, Video, Phone, MapPin, Mail, Globe, FileText, Headphones, Film, Bell, Check, FolderOpen } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { cn, fmtDay, fmtDate, fmtLong, fmtTime, relTime, sameDay, fmtDuration } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/ui/misc";
import { mediaUrl } from "@/lib/upload";
import { DATA_MODE } from "@/lib/utils";
import { usePortalClientId } from "@/components/portal/portal-shell";
import { joinNames, practiceOf, useMyConsultations, useMyReadings, useMyWork, usePortalPractices, useSharedFiles, PORTAL_NOW } from "@/components/portal/portal-data";
import { WorkCard } from "@/components/portal/work-card";
import { workState } from "@/components/client-work/work-meta";
import { ReadingCard } from "@/components/portal/reading-card";
import { AddToCalendar } from "@/components/portal/session-actions";

const LOC_ICON = { "Video call": Video, Phone: Phone, "In person": MapPin } as const;

export default function PortalHome() {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const me = useStore((s) => s.people.find((p) => p.id === PORTAL_CLIENT_ID));
  const practices = usePortalPractices();
  const sessionWho = (k: unknown) => practices.find((p) => p.id === practiceOf(k)) ?? practices[0]!;
  const notes = useStore((s) => s.portalNotifications);
  const markRead = useStore((s) => s.markPortalNotification);
  const toast = useStore((s) => s.toast);
  const readings = useMyReadings();
  const upcoming = useMyConsultations().filter((k) => k.status === "scheduled" && k.start >= PORTAL_NOW.slice(0, 10));
  const files = useSharedFiles();
  const work = useMyWork();
  const workResponses = useStore((s) => s.workResponses);
  const openWork = work.filter((w) => !workState(w, workResponses).done);
  const media = readings.filter((r) => r.kind === "audio" || r.kind === "video");

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <section className="animate-fade-in">
        <p className="eyebrow">{fmtLong(PORTAL_NOW)}</p>
        <h1 className="mt-2 font-serif text-[36px] leading-[1.1] text-ink md:text-[44px]">Good Morning, {me?.firstName ?? "there"}.</h1>
        <p className="mt-2 max-w-xl text-[15px] text-muted">
          Everything {joinNames(practices.map((p) => p.firstName)) || "your astrologer"} {practices.length > 1 ? "have" : "has"} shared with you lives here: your readings, recordings, sessions, and the work you’re doing between them.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {/* Upcoming */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-[24px] text-ink">Upcoming Sessions</h2>
              <Link href="/portal/consultations" className="text-[13px] font-medium text-accent hover:underline">All sessions</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-8 text-center text-sm text-muted">No sessions scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 3).map((k, i) => {
                  const today = sameDay(k.start, PORTAL_NOW);
                  const Icon = LOC_ICON[k.location];
                  return (
                    <div key={k.id} className={cn("flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center", today ? "border-accent-100 bg-accent-50/60" : "border-line bg-surface")}>
                      <div className={cn("flex size-14 shrink-0 flex-col items-center justify-center rounded-xl", today ? "bg-accent text-white" : "bg-canvas-2 text-ink")}>
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">{fmtDay(k.start).slice(5, 8)}</span>
                        <span className="font-serif text-[22px] leading-none">{new Date(k.start).getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-semibold text-ink">{k.type}</p>
                          {today && <Badge tone="accent" dot>Today</Badge>}
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                          <span>{fmtDay(k.start)} · {fmtTime(k.start)}</span>
                          <span>{k.durationMin} min</span>
                          <span className="inline-flex items-center gap-1"><Icon className="size-3.5" />{k.location}</span>
                        </p>
                      </div>
                      {today && k.location === "Video call" && k.meetingUrl ? (
                        <a href={k.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 text-[15px] font-medium text-white hover:bg-accent-hover sm:w-auto">
                          <Video className="size-[18px]" /> Join video call
                        </a>
                      ) : i === 0 || today ? (
                        <AddToCalendar k={k} who={sessionWho(k).name} zone={sessionWho(k).timezone} className="w-full sm:w-auto" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Between sessions */}
          {openWork.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-[24px] text-ink">Between Sessions</h2>
                <Link href="/portal/work" className="text-[13px] font-medium text-accent hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {openWork.slice(0, 3).map((w) => (
                  <WorkCard key={w.id} w={w} />
                ))}
              </div>
            </section>
          )}

          {/* Recent readings */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-[24px] text-ink">Recent Readings</h2>
              <Link href="/portal/readings" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                Reading library <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {readings.slice(0, 4).map((r) => (
                <ReadingCard key={r.id} r={r} />
              ))}
            </div>
          </section>

          {/* Quick access */}
          <section>
            <h2 className="mb-4 font-serif text-[24px] text-ink">Quick Access</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink"><Headphones className="size-4 text-sage-dark" /> Recordings</p>
                <ul className="mt-3 divide-y divide-line">
                  {media.map((r) => (
                    <li key={r.id}>
                      <Link href={`/portal/readings/${r.id}`} className="flex items-center gap-3 py-2.5 hover:text-accent">
                        {r.kind === "audio" ? <Headphones className="size-4 text-muted" /> : <Film className="size-4 text-muted" />}
                        <span className="min-w-0 flex-1 truncate text-[13.5px]">{r.title}</span>
                        <span className="text-[12px] text-muted">{r.durationSec ? fmtDuration(r.durationSec) : ""}</span>
                      </Link>
                    </li>
                  ))}
                  {media.length === 0 && <li className="py-3 text-[13px] text-muted">No recordings yet.</li>}
                </ul>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink"><FolderOpen className="size-4 text-accent" /> Shared files</p>
                <ul className="mt-3 divide-y divide-line">
                  {files.map((f) => (
                    <li key={f.id}>
                      <button onClick={() => (f.fileKey ? (window.location.href = mediaUrl("files", f.id, true)) : toast("Download started", `${f.name} (simulated)`, "success"))} className="flex w-full items-center gap-3 py-2.5 text-left hover:text-accent">
                        <FileText className="size-4 text-muted" />
                        <span className="min-w-0 flex-1 truncate text-[13.5px]">{f.name}</span>
                        <span className="text-[12px] text-muted">{fmtDate(f.uploadedAt)}</span>
                      </button>
                    </li>
                  ))}
                  {readings.filter((r) => r.kind === "pdf" || r.kind === "document").slice(0, 2).map((r) => (
                    <li key={r.id}>
                      <Link href={`/portal/readings/${r.id}`} className="flex items-center gap-3 py-2.5 hover:text-accent">
                        <FileText className="size-4 text-muted" />
                        <span className="min-w-0 flex-1 truncate text-[13.5px]">{r.fileName ?? r.title}</span>
                        <span className="text-[12px] text-muted">{fmtDate(r.deliveredAt ?? r.createdAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-6">
          {practices.map((pr) => (
          <div key={pr.id || "practitioner"} className="rounded-2xl border border-line bg-surface p-5">
            <p className="eyebrow">Your astrologer</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={pr.name} size="lg" />
              <div>
                <p className="font-serif text-[20px] leading-tight text-ink">{pr.name}</p>
                <p className="text-[12.5px] text-muted">{pr.title}</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] font-medium text-ink-3">{pr.practice}</p>
            {pr.bio && <p className="mt-2 text-[13px] leading-relaxed text-muted">{pr.bio}</p>}
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
              {pr.email && <a href={`mailto:${pr.email}`} className="flex items-center gap-2 text-ink-3 hover:text-accent"><Mail className="size-4 text-muted" />{pr.email}</a>}
              {pr.phone && <p className="flex items-center gap-2 text-ink-3"><Phone className="size-4 text-muted" />{pr.phone}</p>}
              {pr.website && <p className="flex items-center gap-2 text-ink-3"><Globe className="size-4 text-muted" />{pr.website}</p>}
            </div>
            {DATA_MODE === "demo" ? (
              <Button variant="secondary" className="mt-4 w-full" onClick={() => toast("Message sent", `${pr.firstName} will reply by email. (Simulated)`, "success")}>
                <Mail /> Message {pr.firstName}
              </Button>
            ) : pr.email ? (
              <a href={`mailto:${pr.email}`} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface text-[13.5px] font-medium text-ink hover:border-line-strong">
                <Mail className="size-4" /> Email {pr.firstName || "your astrologer"}
              </a>
            ) : null}
          </div>
          ))}

          <div className="rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="flex items-center gap-2 text-[14px] font-semibold"><Bell className="size-4 text-muted" /> Notifications</p>
              {DATA_MODE === "demo" && <SimulatedBadge label="Demo" />}
            </div>
            <ul>
              {notes.slice(0, 5).map((n) => (
                <li key={n.id} className={cn("flex gap-3 border-b border-line/70 px-5 py-3.5 last:border-0", !n.read && "bg-accent-50/40")}>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-line-strong" : "bg-accent")} />
                  <Link href={n.href ?? "/portal"} onClick={() => markRead(n.id)} className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{n.title}</p>
                    <p className="text-[12.5px] text-muted">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted">{relTime(n.at)}</p>
                  </Link>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="h-fit rounded p-1 text-muted hover:bg-canvas-2 hover:text-ink" aria-label="Mark as read" title="Mark as read">
                      <Check className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <p className="px-1 text-[12px] leading-relaxed text-muted">
            Signed in as {personName(me)}. Your materials are private to you and {joinNames(practices.map((p) => p.name)) || "your astrologer"}.
          </p>
        </aside>
      </div>
    </div>
  );
}
