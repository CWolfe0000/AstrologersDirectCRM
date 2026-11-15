"use client";

import { Download, Play, ExternalLink, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { FileKindIcon, KIND_LABEL } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import type { ReadingKind } from "@/lib/data/types";
import { fmtDate, fmtDuration, TODAY } from "@/lib/utils";

/** How a delivered reading appears to the client in their portal. */
export function PortalPreview({
  title,
  kind,
  message,
  fileName,
  sizeMB,
  url,
  allowDownload,
  durationSec,
  clientFirstName,
}: {
  title: string;
  kind: ReadingKind;
  message: string;
  fileName?: string;
  sizeMB?: number;
  url?: string;
  allowDownload: boolean;
  durationSec?: number;
  clientFirstName?: string;
}) {
  const pr = useStore((s) => s.practitioner);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-canvas shadow-card">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex gap-1">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </div>
        <p className="flex-1 truncate text-center text-[11.5px] text-muted">Client portal · {pr.practice}</p>
      </div>
      <div className="p-5">
        <p className="eyebrow">New reading{clientFirstName ? ` for ${clientFirstName}` : ""}</p>
        <h3 className="mt-1 font-serif text-[22px] leading-tight">{title || "Untitled reading"}</h3>
        <div className="mt-3 flex items-center gap-2.5">
          <Avatar name={pr.name} size="sm" />
          <div className="text-[12.5px]">
            <p className="font-medium">{pr.name}</p>
            <p className="text-muted">Delivered {fmtDate(TODAY)}</p>
          </div>
        </div>
        {message && <p className="mt-4 whitespace-pre-line rounded-lg border border-line bg-surface p-3.5 text-[13.5px] leading-relaxed text-ink-3">{message}</p>}
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
          <FileKindIcon kind={kind} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium">{kind === "link" ? url || "External link" : fileName || "No file selected"}</p>
            <p className="text-[12px] text-muted">
              {KIND_LABEL[kind]}
              {sizeMB ? ` · ${sizeMB < 1 ? Math.round(sizeMB * 1024) + " KB" : sizeMB.toFixed(1) + " MB"}` : ""}
              {durationSec ? ` · ${fmtDuration(durationSec)}` : ""}
            </p>
          </div>
          {kind === "link" ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12.5px] font-medium text-white"><ExternalLink className="size-3.5" /> Open</span>
          ) : kind === "audio" || kind === "video" ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12.5px] font-medium text-white"><Play className="size-3.5" /> Play</span>
          ) : (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12.5px] font-medium text-white">View</span>
          )}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted">
          {allowDownload ? <><Download className="size-3.5" /> Download available</> : <><Lock className="size-3.5" /> Streaming only — download disabled</>}
        </p>
      </div>
    </div>
  );
}
