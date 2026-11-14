"use client";

import Link from "next/link";
import { Download, Play, ExternalLink, FileText, ChevronRight } from "lucide-react";
import type { Reading } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { cn, fmtDate, fmtDuration } from "@/lib/utils";
import { FileKindIcon, KIND_LABEL } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";

export function readingMeta(r: Reading) {
  const parts = [KIND_LABEL[r.kind]];
  if (r.durationSec) parts.push(fmtDuration(r.durationSec));
  if (r.pages) parts.push(`${r.pages} pages`);
  if (r.sizeMB && r.kind !== "link") parts.push(r.sizeMB >= 100 ? `${Math.round(r.sizeMB)} MB` : `${r.sizeMB} MB`);
  return parts.join(" · ");
}

export function useSimulatedDownload() {
  const toast = useStore((s) => s.toast);
  return (r: Reading) => toast("Download started", `${r.fileName ?? r.title} (simulated in the prototype)`, "success");
}

export function ReadingCard({ r, className }: { r: Reading; className?: string }) {
  const download = useSimulatedDownload();
  const isNew = !r.openedAt;
  const primary =
    r.kind === "audio" || r.kind === "video" ? { label: r.kind === "audio" ? "Listen" : "Watch", icon: Play } : r.kind === "link" ? { label: "Open link", icon: ExternalLink } : { label: "Read", icon: FileText };
  return (
    <div className={cn("group flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-line-strong sm:p-5", className)}>
      <Link href={`/portal/readings/${r.id}`} className="flex items-start gap-3.5">
        <FileKindIcon kind={r.kind} className="size-11" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 font-serif text-[19px] leading-snug text-ink group-hover:text-accent">{r.title}</h3>
            {isNew && <Badge tone="accent">New</Badge>}
          </div>
          <p className="mt-1 text-[12.5px] text-muted">
            Shared {fmtDate(r.deliveredAt ?? r.createdAt)} · {readingMeta(r)}
          </p>
        </div>
        <ChevronRight className="mt-1 hidden size-4 text-muted sm:block" />
      </Link>
      {r.message && <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-ink-3">{r.message}</p>}
      <div className="mt-4 flex gap-2">
        {r.kind === "link" && r.url ? (
          <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[14px] font-medium text-white hover:bg-accent-hover sm:h-9 sm:flex-none sm:text-[13px]">
            <primary.icon className="size-4" /> {primary.label}
          </a>
        ) : (
          <Link href={`/portal/readings/${r.id}`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[14px] font-medium text-white hover:bg-accent-hover sm:h-9 sm:flex-none sm:text-[13px]">
            <primary.icon className="size-4" /> {primary.label}
          </Link>
        )}
        {r.allowDownload && r.kind !== "link" && (
          <button onClick={() => download(r)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-[14px] font-medium text-ink hover:bg-canvas-2 sm:h-9 sm:text-[13px]" aria-label={`Download ${r.title}`}>
            <Download className="size-4" /> <span>Download</span>
          </button>
        )}
      </div>
    </div>
  );
}
