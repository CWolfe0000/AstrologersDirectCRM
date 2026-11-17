"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, CalendarDays, Lock, Paperclip } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDate, fmtTime, nowLocal } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, FileKindIcon, KIND_LABEL, SimulatedBadge } from "@/components/ui/misc";
import { usePortalClientId } from "@/components/portal/portal-shell";
import { sameId, usePractitionerFor } from "@/components/portal/portal-data";
import { readingMeta, useSimulatedDownload } from "@/components/portal/reading-card";
import { mediaUrl } from "@/lib/upload";
import { AudioPlayer, DocumentViewer, VideoPlayer } from "@/components/portal/media";

export default function ReadingDetail() {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const { id } = useParams<{ id: string }>();
  const reading = useStore((s) => s.readings.find((r) => sameId(r.id, id)));
  const consultation = useStore((s) => s.consultations.find((k) => k.id === reading?.consultationId));
  const pr = usePractitionerFor(reading);
  const download = useSimulatedDownload();
  const toast = useStore((s) => s.toast);

  const visible = reading && reading.clientId === PORTAL_CLIENT_ID && reading.status === "delivered";

  // Record the client's first view (the practitioner sees "Opened" in Reading Delivery).
  React.useEffect(() => {
    if (!visible || reading.openedAt) return;
    const at = nowLocal();
    useStore.setState((s) => ({ readings: s.readings.map((r) => (r.id === reading.id ? { ...r, notification: "opened", openedAt: at } : r)) }));
  }, [visible, reading]);

  if (!visible) {
    return (
      <EmptyState
        className="rounded-2xl border border-line bg-surface"
        icon={<Lock />}
        title="This Reading Isn't Available"
        body="It may not have been shared with you yet, or the link has expired."
        action={<Link href="/portal/readings" className="text-sm font-medium text-accent hover:underline">Back to My Readings</Link>}
      />
    );
  }
  const r = reading;
  const media = r.kind === "audio" || r.kind === "video";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/portal/readings" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> My Readings
      </Link>

      <header className="mt-5">
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          <FileKindIcon kind={r.kind} className="size-7 rounded-md [&_svg]:size-4" />
          <span>{readingMeta(r)}</span>
        </div>
        <h1 className="mt-3 font-serif text-[32px] leading-[1.12] text-ink md:text-[42px]">{r.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={pr.name} size="sm" />
            <div className="leading-tight">
              <p className="text-[13.5px] font-medium text-ink">{pr.name}</p>
              <p className="text-[12px] text-muted">{pr.practice}</p>
            </div>
          </div>
          <p className="text-[13px] text-muted">Shared {fmtDate(r.deliveredAt ?? r.createdAt)}</p>
          {r.allowDownload && r.kind !== "link" && (
            <Button variant="secondary" size="sm" className="ml-auto" onClick={() => download(r)}>
              <Download /> Download
            </Button>
          )}
        </div>
      </header>

      {r.message && (
        <figure className="mt-8 rounded-2xl border border-line bg-surface px-6 py-5">
          <figcaption className="eyebrow mb-2">A note from {pr.firstName}</figcaption>
          <blockquote className="font-serif text-[19px] leading-relaxed text-ink-3">“{r.message}”</blockquote>
        </figure>
      )}

      <section className="mt-8">
        {media && (
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-ink">{r.kind === "audio" ? "Listen" : "Watch"}</h2>
            {!r.fileKey && <SimulatedBadge label="Simulated playback" />}
          </div>
        )}
        {r.fileKey && r.kind === "audio" && (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <audio controls preload="metadata" className="w-full" src={mediaUrl("readings", r.id)}>
              Your browser can’t play this recording. <a href={mediaUrl("readings", r.id)}>Open it directly</a>.
            </audio>
          </div>
        )}
        {r.fileKey && r.kind === "video" && (
          <video controls preload="metadata" playsInline className="aspect-video w-full rounded-2xl bg-ink" src={mediaUrl("readings", r.id)}>
            Your browser can’t play this video. <a href={mediaUrl("readings", r.id)}>Open it directly</a>.
          </video>
        )}
        {r.fileKey && r.kind === "pdf" && (
          <>
            <h2 className="mb-3 text-[13px] font-semibold text-ink">Read</h2>
            <iframe title={r.title} src={mediaUrl("readings", r.id)} className="h-[78vh] w-full rounded-2xl border border-line bg-surface" />
          </>
        )}
        {r.fileKey && r.kind === "document" && (
          <a href={mediaUrl("readings", r.id)} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 hover:border-line-strong">
            <FileKindIcon kind="document" className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink group-hover:text-accent">Open {r.fileName ?? "document"}</p>
              <p className="text-[13px] text-muted">Opens in your browser or your document app.</p>
            </div>
          </a>
        )}
        {!r.fileKey && r.kind === "audio" && <AudioPlayer duration={r.durationSec ?? 1800} title={r.title} />}
        {!r.fileKey && r.kind === "video" && <VideoPlayer duration={r.durationSec ?? 1800} title={r.title} poster="Chart walkthrough" />}
        {!r.fileKey && (r.kind === "pdf" || r.kind === "document") && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Read</h2>
              <SimulatedBadge label="Document preview" />
            </div>
            <DocumentViewer pages={r.pages ?? 8} title={r.title} author={pr.name} />
          </>
        )}
        {r.kind === "link" && (
          <a href={r.url} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 hover:border-line-strong">
            <FileKindIcon kind="link" className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink group-hover:text-accent">Open shared reading</p>
              <p className="truncate text-[13px] text-muted">{r.url}</p>
            </div>
            <ExternalLink className="size-5 text-muted" />
          </a>
        )}
        {!r.allowDownload && r.kind !== "link" && (
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
            <Lock className="size-3.5" /> Available to view online. {pr.firstName} hasn&apos;t enabled downloads for this reading.
          </p>
        )}
      </section>

      {r.attachments && r.attachments.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink"><Paperclip className="size-4 text-muted" /> Attachments</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {r.attachments.map((a) => (
              <li key={a.name} className="flex items-center gap-3 px-4 py-3">
                <FileKindIcon kind={a.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] text-ink">{a.name}</p>
                  <p className="text-[12px] text-muted">{KIND_LABEL[a.kind]}{a.sizeMB ? ` · ${a.sizeMB} MB` : ""}</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Download ${a.name}`} onClick={() => toast("Download Started", `${a.name} (simulated)`, "success")}>
                  <Download />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {consultation && (
        <section className="mt-8">
          <h2 className="mb-3 text-[13px] font-semibold text-ink">Related Consultation</h2>
          <Link href={`/portal/consultations#${consultation.id}`} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong">
            <span className="flex size-11 items-center justify-center rounded-xl bg-canvas-2 text-ink-3"><CalendarDays className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-ink">{consultation.type}</p>
              <p className="text-[12.5px] text-muted">{fmtDate(consultation.start)} · {fmtTime(consultation.start)} · {consultation.location}</p>
            </div>
          </Link>
        </section>
      )}
    </div>
  );
}
