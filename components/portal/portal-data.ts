"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PORTAL_CLIENT_ID } from "./portal-shell";

/** Only delivered readings for the signed-in client — never drafts, failures or other clients. */
export function useMyReadings() {
  const readings = useStore((s) => s.readings);
  return useMemo(
    () =>
      readings
        .filter((r) => r.clientId === PORTAL_CLIENT_ID && r.status === "delivered")
        .sort((a, b) => (b.deliveredAt ?? "").localeCompare(a.deliveredAt ?? "")),
    [readings],
  );
}

/** Client-safe consultation view: strips practitioner-only fields. */
export function useMyConsultations() {
  const consultations = useStore((s) => s.consultations);
  return useMemo(
    () =>
      consultations
        .filter((k) => k.clientId === PORTAL_CLIENT_ID)
        .map(({ id, type, start, durationMin, status, location, sharedSummary, readingIds, chartIds }) => ({
          id, type, start, durationMin, status, location, sharedSummary, readingIds, chartIds,
        }))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [consultations],
  );
}

export function useSharedFiles() {
  const files = useStore((s) => s.files);
  return useMemo(() => files.filter((f) => f.clientId === PORTAL_CLIENT_ID && !f.private), [files]);
}

export const PORTAL_NOW = "2026-11-14T09:00:00";
