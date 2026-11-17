"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { usePortalClientId } from "./portal-shell";
import { DEMO_TODAY, isoLocal } from "@/lib/utils";

/** Only delivered readings for the signed-in client — never drafts, failures or other clients. */
export function useMyReadings() {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const readings = useStore((s) => s.readings);
  return useMemo(
    () =>
      readings
        .filter((r) => r.clientId === PORTAL_CLIENT_ID && r.status === "delivered")
        .sort((a, b) => (b.deliveredAt ?? "").localeCompare(a.deliveredAt ?? "")),
    [readings, PORTAL_CLIENT_ID],
  );
}

/** Client-safe consultation view: strips practitioner-only fields. */
export function useMyConsultations() {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const consultations = useStore((s) => s.consultations);
  return useMemo(
    () =>
      consultations
        .filter((k) => k.clientId === PORTAL_CLIENT_ID)
        .map(({ id, type, start, durationMin, status, location, sharedSummary, readingIds, chartIds }) => ({
          id, type, start, durationMin, status, location, sharedSummary, readingIds, chartIds,
        }))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [consultations, PORTAL_CLIENT_ID],
  );
}

export function useSharedFiles() {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const files = useStore((s) => s.files);
  return useMemo(() => files.filter((f) => f.clientId === PORTAL_CLIENT_ID && !f.private), [files, PORTAL_CLIENT_ID]);
}

export const PORTAL_NOW = isoLocal(DEMO_TODAY);

/** Work shared with the signed-in client (never drafts or archived items), newest first. */
export function useMyWork() {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const work = useStore((s) => s.clientWork);
  return useMemo(
    () => work.filter((w) => w.clientId === PORTAL_CLIENT_ID && (w.status === "shared" || w.status === "completed")).sort((a, b) => (b.sharedAt ?? "").localeCompare(a.sharedAt ?? "")),
    [work, PORTAL_CLIENT_ID],
  );
}

type Practice = ReturnType<typeof useStore.getState>["portalPractices"][number];

/** Which practice a portal record came from (server mode scopes every record by practice). */
export function practiceOf(r: unknown): string | undefined {
  return (r as { practiceId?: string } | undefined)?.practiceId;
}

/** Every astrologer this client works with. Demo and single-practice previews fall back to the one practitioner. */
export function usePortalPractices(): Practice[] {
  const list = useStore((s) => s.portalPractices);
  const pr = useStore((s) => s.practitioner);
  return useMemo(() => (list.length ? list : [{ ...pr, id: "" }]), [list, pr]);
}

/** The astrologer who shared a given record. */
export function usePractitionerFor(r: unknown): Practice {
  const all = usePortalPractices();
  const id = practiceOf(r);
  return all.find((p) => p.id === id) ?? all[0];
}

/** "Maya", "Maya and Leo", "Maya, Leo and Ana". */
export function joinNames(names: string[]) {
  const n = names.filter(Boolean);
  return n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}

/** Match a route id to a portal record; older links carry the bare (unscoped) id. */
export function sameId(recordId: string, routeId: string) {
  const id = decodeURIComponent(routeId);
  return recordId === id || (!id.includes("~") && recordId.endsWith(`~${id}`));
}
