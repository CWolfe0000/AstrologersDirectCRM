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
