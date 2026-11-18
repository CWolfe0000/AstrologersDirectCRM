"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CircleDot, History, Loader2, Pin, RotateCcw, Trash2, UserRound, Info, CalendarDays, ChevronDown } from "lucide-react";
import type { Observation } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, fmtDate, fmtTime, relTime, stripHtml, DATA_MODE } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { Sheet } from "@/components/ui/dialog";
import { RichEditor } from "./rich-editor";
import { TagPicker } from "./tag-picker";
import { ScopeBadge, ownershipFor, ownershipSentence } from "./obs-meta";

type Draft = Pick<Observation, "title" | "body" | "scope" | "chartId" | "clientId" | "personIds" | "planets" | "aspects" | "houses" | "tags" | "consultationId" | "pinned">;

export interface ObservationEditorProps {
  /** Existing observation to edit; if absent the editor starts a new draft from `initial`. */
  observationId?: string | null;
  initial?: Partial<Draft> & Pick<Draft, "chartId" | "clientId" | "personIds" | "scope">;
  /** Lock the linked chart (e.g. when editing from inside the chart workspace). */
  lockChart?: boolean;
  onCreated?: (id: string) => void;
  onDeleted?: () => void;
  compact?: boolean;
}

export function ObservationEditor({ observationId, initial, lockChart, onCreated, onDeleted, compact }: ObservationEditorProps) {
  const existing = useStore((s) => (observationId ? s.observations.find((o) => o.id === observationId) : undefined));
  const charts = useStore((s) => s.charts);
  const clients = useStore((s) => s.clients);
  const people = useStore((s) => s.people);
  const consultations = useStore((s) => s.consultations);
  const upsert = useStore((s) => s.upsertObservation);
  const del = useStore((s) => s.deleteObservation);
  const toast = useStore((s) => s.toast);

  const seed = (): Draft => ({
    title: existing?.title ?? initial?.title ?? "",
    body: existing?.body ?? initial?.body ?? "",
    scope: existing?.scope ?? initial!.scope,
    chartId: existing?.chartId ?? initial!.chartId,
    clientId: existing?.clientId ?? initial!.clientId,
    personIds: existing?.personIds ?? initial!.personIds,
    planets: existing?.planets ?? initial?.planets ?? [],
    aspects: existing?.aspects ?? initial?.aspects ?? [],
    houses: existing?.houses ?? initial?.houses ?? [],
    tags: existing?.tags ?? initial?.tags ?? [],
    consultationId: existing?.consultationId ?? initial?.consultationId,
    pinned: existing?.pinned ?? false,
  });

  const [id, setId] = React.useState<string | null>(observationId ?? null);
  const [d, setD] = React.useState<Draft>(seed);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">(existing ? "saved" : "idle");
  const [savedAt, setSavedAt] = React.useState<string | null>(existing?.updatedAt ?? null);
  const [resetKey, setResetKey] = React.useState(`${observationId ?? "new"}-0`);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [showTags, setShowTags] = React.useState(!compact);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirtySinceRevision = React.useRef(false);
  const latest = React.useRef(d);
  latest.current = d;
  const idRef = React.useRef(id);
  idRef.current = id;

  // Switching to another observation resets the editor
  React.useEffect(() => {
    if (observationId && observationId === idRef.current) return; // just created by this editor
    setId(observationId ?? null);
    setD(seed());
    setStatus(observationId ? "saved" : "idle");
    setSavedAt(existing?.updatedAt ?? null);
    setResetKey(`${observationId ?? "new"}-${Date.now()}`);
    dirtySinceRevision.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observationId]);

  const onCreatedRef = React.useRef(onCreated);
  onCreatedRef.current = onCreated;
  const save = React.useCallback(
    (revisionSummary?: string) => {
      const cur = latest.current;
      const hasContent = cur.title.trim() || stripHtml(cur.body);
      if (!idRef.current && !hasContent) return;
      // note: never pass `id: undefined` — it would override the generated id
      const payload = { ...cur, title: cur.title.trim() || "Untitled observation", ...(idRef.current ? { id: idRef.current } : {}) };
      const saved = upsert(payload, idRef.current ? revisionSummary : undefined);
      if (!idRef.current) {
        setId(saved.id);
        idRef.current = saved.id;
        onCreatedRef.current?.(saved.id);
      }
      setStatus("saved");
      setSavedAt(saved.updatedAt);
    },
    [upsert],
  );

  const change = (patch: Partial<Draft>) => {
    setD((prev) => ({ ...prev, ...patch }));
    dirtySinceRevision.current = true;
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      saveRef.current();
    }, 800);
  };

  const saveRef = React.useRef(save);
  saveRef.current = save;
  // Flush pending changes on unmount
  React.useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        if (dirtySinceRevision.current) saveRef.current("Edited");
      }
    },
    [],
  );

  const onBlurContainer = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dirtySinceRevision.current && idRef.current) {
      clearTimeout(timer.current);
      save("Edited");
      dirtySinceRevision.current = false;
    }
  };

  const chart = charts.find((c) => c.id === d.chartId);
  const clientCharts = charts.filter((c) => c.clientId === d.clientId);
  const clientConsults = consultations.filter((k) => k.clientId === d.clientId).sort((a, b) => (b.start > a.start ? 1 : -1));
  const revisions = existing ? [...existing.revisions].reverse() : [];

  const setChart = (chartId: string) => {
    const c = charts.find((x) => x.id === chartId);
    if (c) change({ ...ownershipFor(c) });
  };
  const setClient = (clientId: string) => {
    const first = charts.find((c) => c.clientId === clientId && c.type === "natal") ?? charts.find((c) => c.clientId === clientId);
    if (first) change({ ...ownershipFor(first), consultationId: undefined });
  };

  const restore = (body: string, at: string) => {
    setD((prev) => ({ ...prev, body }));
    latest.current = { ...latest.current, body };
    setResetKey(`${id}-restore-${Date.now()}`);
    save(`Restored version from ${fmtDate(at)}`);
    dirtySinceRevision.current = false;
    setHistoryOpen(false);
    toast("Version Restored", "The previous text is now current. The replaced text is kept in history.", "success");
  };

  return (
    <div onBlur={onBlurContainer} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScopeBadge scope={d.scope} />
          <span className="flex items-center gap-1.5 text-[12px] text-muted" aria-live="polite">
            {status === "saving" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Saving…
              </>
            ) : status === "saved" && savedAt ? (
              <>
                <Check className="size-3.5 text-sage-dark" /> Saved · {fmtTime(savedAt)}
              </>
            ) : (
              "Not saved yet — starts autosaving as you type"
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {id && (
            <>
              <Button variant="ghost" size="icon-sm" onClick={() => change({ pinned: !d.pinned })} aria-label={d.pinned ? "Unpin" : "Pin"} title={d.pinned ? "Unpin" : "Pin"}>
                <Pin className={cn(d.pinned && "fill-accent text-accent")} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
                <History /> History{existing ? ` (${existing.revisions.length})` : ""}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete observation"
                title="Delete"
                onClick={() => {
                  if (!confirm("Delete this observation? This can’t be undone.")) return;
                  clearTimeout(timer.current);
                  timer.current = undefined;
                  del(id);
                  toast("Observation Deleted");
                  onDeleted?.();
                }}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      <textarea
        ref={(el) => {
          if (el) {
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
          }
        }}
        rows={1}
        value={d.title}
        onChange={(e) => {
          e.currentTarget.style.height = "auto";
          e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
          change({ title: e.target.value.replace(/\n/g, " ") });
        }}
        placeholder="Observation title"
        aria-label="Observation title"
        className="w-full resize-none overflow-hidden bg-transparent font-serif text-[24px] leading-tight text-ink outline-none placeholder:text-muted/50"
      />

      <RichEditor value={d.body} onChange={(body) => change({ body })} resetKey={resetKey} minHeight={compact ? 140 : 200} />

      <div className="flex items-start gap-2 rounded-lg bg-canvas-2/70 px-3 py-2.5 text-[12px] text-ink-3">
        <Info className="mt-0.5 size-3.5 shrink-0 text-muted" />
        <span>{ownershipSentence(d.scope, chart, people)}</span>
      </div>

      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        <Field label="Linked Client">
          <Select value={d.clientId} onChange={(e) => setClient(e.target.value)} disabled={lockChart}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{personName(people.find((p) => p.id === c.id))}</option>
            ))}
          </Select>
        </Field>
        <Field label="Linked Chart">
          <Select value={d.chartId} onChange={(e) => setChart(e.target.value)} disabled={lockChart}>
            {clientCharts.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </Select>
        </Field>
        <Field label="Related Consultation" optional className={compact ? "" : "sm:col-span-2"}>
          <Select value={d.consultationId ?? ""} onChange={(e) => change({ consultationId: e.target.value || undefined })}>
            <option value="">None</option>
            {clientConsults.map((k) => (
              <option key={k.id} value={k.id}>
                {fmtDate(k.start)} — {k.type} ({k.status})
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
        <span className="text-muted">Kind of note</span>
        <Segmented
          size="sm"
          value={d.tags.includes("client-reported") ? "client" : "mine"}
          onChange={(v) => change({ tags: v === "client" ? [...d.tags.filter((t) => t !== "client-reported"), "client-reported"] : d.tags.filter((t) => t !== "client-reported") })}
          options={[
            { value: "mine", label: "My Interpretation" },
            { value: "client", label: "What the Client Reported" },
          ]}
        />
      </div>

      <div className="rounded-lg border border-line">
        <button type="button" onClick={() => setShowTags((s) => !s)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left">
          <span className="text-[13px] font-medium text-ink">
            Configuration tags
            <span className="ml-2 text-[12px] font-normal text-muted">
              {[d.planets.length && `${d.planets.length} points`, d.aspects.length && `${d.aspects.length} aspects`, d.houses.length && `${d.houses.length} houses`, d.tags.length && `${d.tags.length} tags`].filter(Boolean).join(" · ") || "None yet"}
            </span>
          </span>
          <ChevronDown className={cn("size-4 text-muted transition-transform", showTags && "rotate-180")} />
        </button>
        {showTags && (
          <div className="border-t border-line p-3.5">
            <TagPicker planets={d.planets} aspects={d.aspects} houses={d.houses} tags={d.tags} onChange={(p) => change(p)} compact={compact} />
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-2">
          {chart && (
            <Link href={`/app/charts/${chart.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink-3 hover:border-line-strong hover:text-ink">
              <CircleDot className="size-3.5" /> Open chart: {chart.title}
            </Link>
          )}
          <Link href={`/app/clients/${d.clientId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink-3 hover:border-line-strong hover:text-ink">
            <UserRound className="size-3.5" /> Open client: {personName(people.find((p) => p.id === d.clientId))}
          </Link>
          {d.consultationId && (
            <Link href={`/app/consultations?id=${d.consultationId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink-3 hover:border-line-strong hover:text-ink">
              <CalendarDays className="size-3.5" /> Open consultation
            </Link>
          )}
        </div>
      )}

      {existing && <p className="text-[11.5px] text-muted">Created {fmtDate(existing.createdAt)} · Last edited {relTime(existing.updatedAt)}</p>}

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen} title="Revision History" description={d.title || "Untitled observation"} width="max-w-md">
        <ol className="relative px-6 py-5">
          <li className="relative border-l border-line pb-6 pl-5">
            <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-accent" />
            <p className="text-[13px] font-medium text-ink">Current version</p>
            <p className="text-[12px] text-muted">{savedAt ? `${fmtDate(savedAt)} · ${fmtTime(savedAt)}` : "Unsaved"}</p>
          </li>
          {revisions.map((r, i) => (
            <li key={i} className="relative border-l border-line pb-6 pl-5 last:pb-0">
              <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-line-strong" />
              <p className="text-[13px] font-medium text-ink">{r.summary}</p>
              <p className="text-[12px] text-muted">
                {fmtDate(r.at)} · {fmtTime(r.at)}
              </p>
              {r.body && (
                <div className="mt-2 rounded-lg border border-line bg-canvas/60 p-3">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted">Text before this change</p>
                  <p className="line-clamp-4 text-[12.5px] text-ink-3">{stripHtml(r.body)}</p>
                  <Button variant="secondary" size="xs" className="mt-2" onClick={() => restore(r.body!, r.at)}>
                    <RotateCcw /> Restore This Text
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ol>
        {DATA_MODE !== "demo" && existing && <ServerVersions observationId={existing.id} onRestore={(body, at) => restore(body, at)} />}
      </Sheet>
    </div>
  );
}

/** Versions of the text kept on the server (one per 10 minutes of editing). */
function ServerVersions({ observationId, onRestore }: { observationId: string; onRestore: (body: string, at: string) => void }) {
  const [versions, setVersions] = React.useState<{ id: string; at: string; title: string; body: string }[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    api<{ versions: { id: string; at: string; title: string; body: string }[] }>(`/api/v1/observations/${encodeURIComponent(observationId)}/history`)
      .then((r) => setVersions(r.versions))
      .catch((e: Error) => setError(e.message));
  }, [observationId]);
  return (
    <div className="border-t border-line px-6 py-5">
      <p className="text-[13px] font-semibold text-ink">Saved versions</p>
      <p className="mb-3 text-[12px] text-muted">Kept on the server automatically while you write: one version for every 10 minutes of editing.</p>
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      {!versions && !error && <p className="text-[12.5px] text-muted">Loading…</p>}
      {versions?.length === 0 && <p className="text-[12.5px] text-muted">No saved versions yet.</p>}
      <ul className="space-y-3">
        {versions?.map((v) => (
          <li key={v.id} className="rounded-lg border border-line bg-canvas/60 p-3">
            <p className="text-[12px] text-muted">{fmtDate(v.at)} · {fmtTime(v.at)}</p>
            <p className="mt-1 line-clamp-3 text-[12.5px] text-ink-3">{stripHtml(v.body) || "(empty)"}</p>
            <Button variant="secondary" size="xs" className="mt-2" onClick={() => onRestore(v.body, v.at)}>
              <RotateCcw /> Restore This Version
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
