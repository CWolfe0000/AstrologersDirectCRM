"use client";

import * as React from "react";
import Link from "next/link";
import { Send, RotateCcw, AlertTriangle, ExternalLink, Trash2, CheckCircle2, Circle, Loader2, ArrowUpRight } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { KeyValue, KIND_LABEL, SectionTitle } from "@/components/ui/misc";
import { ChartTypeBadge } from "@/components/chart/chart-helpers";
import { cn, fmtDate, fmtTime, fmtDuration } from "@/lib/utils";
import { PortalPreview } from "./portal-preview";

export function ReadingDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const r = useStore((s) => s.readings.find((x) => x.id === id));
  const people = useStore((s) => s.people);
  const charts = useStore((s) => s.charts);
  const consultations = useStore((s) => s.consultations);
  const update = useStore((s) => s.updateReading);
  const deliver = useStore((s) => s.deliverReading);
  const toast = useStore((s) => s.toast);
  const [retrying, setRetrying] = React.useState(false);

  if (!r) return <p className="text-sm text-muted">Delivery not found.</p>;
  const person = people.find((p) => p.id === r.clientId);
  const chart = charts.find((c) => c.id === r.chartId);
  const consultation = consultations.find((k) => k.id === r.consultationId);

  const send = () => {
    deliver(r.id);
    toast("Reading delivered", `${person?.firstName} has been notified in their portal.`, "success");
  };
  const retry = () => {
    setRetrying(true);
    setTimeout(() => {
      update(r.id, { sizeMB: r.sizeMB && r.sizeMB > 1500 ? 980 : r.sizeMB, fileName: r.fileName?.replace(/(\.\w+)$/, "_compressed$1") });
      deliver(r.id);
      setRetrying(false);
      toast("Retry succeeded", "Re-encoded at a lower bitrate and delivered (simulated).", "success");
    }, 1600);
  };

  const steps = [
    { label: "Prepared", at: r.createdAt, done: true },
    { label: "Delivered to portal", at: r.deliveredAt, done: r.status === "delivered" },
    { label: r.notification === "failed" ? "Notification failed" : "Client notified", at: r.deliveredAt, done: r.notification === "sent" || r.notification === "opened", failed: r.notification === "failed" },
    { label: "Opened by client", at: r.openedAt, done: r.notification === "opened" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={r.status} />
          {r.status === "delivered" && <StatusBadge status={r.notification} />}
        </div>
        <h2 className="mt-2 font-serif text-[24px] leading-tight">{r.title}</h2>
        <p className="mt-1 text-[13px] text-muted">
          For <Link href={`/app/clients/${r.clientId}`} className="text-ink hover:text-accent">{personName(person)}</Link>
        </p>
      </div>

      {r.status === "failed" && (
        <div className="rounded-lg border border-danger/25 bg-danger-50 p-3.5 text-[13px] text-danger">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" /> Delivery failed</p>
          <p className="mt-1 text-danger">{r.failureReason ?? "The upload did not complete."}</p>
          <Button size="sm" variant="danger" className="mt-3" onClick={retry} disabled={retrying}>
            {retrying ? <Loader2 className="animate-spin" /> : <RotateCcw />} {retrying ? "Retrying…" : "Retry delivery"}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(r.status === "draft" || r.status === "ready") && (
          <Button onClick={send} disabled={!r.fileName && !r.url}><Send /> Send to client portal</Button>
        )}
        {r.status === "draft" && (
          <Button variant="secondary" onClick={() => { update(r.id, { status: "ready" }); toast("Marked ready to send", r.title); }} disabled={!r.fileName && !r.url}>Mark ready</Button>
        )}
        {r.status === "delivered" && r.clientId === "c1" && (
          <ButtonLink variant="secondary" href={`/portal/readings/${r.id}`}><ExternalLink /> View in client portal</ButtonLink>
        )}
      </div>
      {r.status === "draft" && !r.fileName && !r.url && (
        <p className="-mt-3 text-[12.5px] text-warn">No file attached yet — upload the finished reading before sending.</p>
      )}

      <KeyValue
        items={[
          { label: "Type", value: KIND_LABEL[r.kind] },
          { label: r.kind === "link" ? "Link" : "File", value: <span className="break-all">{r.url ?? r.fileName ?? "—"}</span> },
          { label: "Size / length", value: [r.sizeMB ? `${r.sizeMB} MB` : null, r.pages ? `${r.pages} pages` : null, r.durationSec ? fmtDuration(r.durationSec) : null].filter(Boolean).join(" · ") || "—" },
          { label: "Prepared", value: fmtDate(r.createdAt) },
          { label: "Chart", value: chart ? <Link href={`/app/charts/${chart.id}`} className="inline-flex items-center gap-1.5 hover:text-accent">{chart.title} <ChartTypeBadge type={chart.type} /></Link> : "—" },
          { label: "Consultation", value: consultation ? <Link href={`/app/consultations?id=${consultation.id}`} className="hover:text-accent">{consultation.type} · {fmtDate(consultation.start)}</Link> : "—" },
        ]}
      />

      <div>
        <SectionTitle>Access</SectionTitle>
        <label className="flex items-center justify-between gap-4 rounded-lg border border-line p-3">
          <span>
            <span className="block text-[13.5px]">Allow download</span>
            <span className="block text-[12px] text-muted">{r.expiresAt ? `Access expires ${fmtDate(r.expiresAt)}` : "No expiry"}</span>
          </span>
          <Switch checked={r.allowDownload} disabled={r.kind === "link"} onCheckedChange={(v) => { update(r.id, { allowDownload: v }); toast(v ? "Download enabled" : "Download disabled", r.title); }} />
        </label>
      </div>

      <div>
        <SectionTitle>Delivery timeline</SectionTitle>
        <ol className="space-y-3">
          {steps.map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              {s.failed ? <AlertTriangle className="mt-0.5 size-4 text-danger" /> : s.done ? <CheckCircle2 className="mt-0.5 size-4 text-sage-dark" /> : <Circle className="mt-0.5 size-4 text-line-strong" />}
              <div>
                <p className={cn("text-[13px]", !s.done && !s.failed && "text-muted")}>{s.label}</p>
                {s.done && s.at && <p className="text-[11.5px] text-muted">{fmtDate(s.at)}{s.at.length > 10 ? ` · ${fmtTime(s.at)}` : ""}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <SectionTitle>Client view</SectionTitle>
        <PortalPreview title={r.title} kind={r.kind} message={r.message} fileName={r.fileName} sizeMB={r.sizeMB} url={r.url} allowDownload={r.allowDownload} durationSec={r.durationSec} clientFirstName={person?.firstName} />
      </div>

      {r.status !== "delivered" && (
        <div className="flex justify-end border-t border-line pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-50"
            onClick={() => {
              useStore.setState((s) => ({ readings: s.readings.filter((x) => x.id !== r.id) }));
              toast("Delivery removed", r.title);
              onClose();
            }}
          >
            <Trash2 /> Delete {r.status === "draft" ? "draft" : "delivery"}
          </Button>
        </div>
      )}
      {r.status === "delivered" && (
        <Link href={`/app/clients/${r.clientId}?tab=readings`} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline">
          All readings for {person?.firstName} <ArrowUpRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
