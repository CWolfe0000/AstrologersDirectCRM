"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { DATA_MODE } from "@/lib/utils";

/** Unread message counts for the menu badges (practitioner app and client portal), polled once a minute. */
const state = { app: 0, portal: 0 };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
let timers: Partial<Record<"app" | "portal", ReturnType<typeof setInterval>>> = {};

export async function refreshUnread(side: "app" | "portal") {
  if (DATA_MODE !== "server") return;
  try {
    if (side === "app") state.app = (await api<{ unread: number }>("/api/v1/messages?count=1")).unread;
    else state.portal = (await api<{ conversations: { unread: number }[] }>("/api/v1/portal/messages")).conversations.reduce((n, c) => n + c.unread, 0);
    emit();
  } catch {
    /* signed out or a preview: no badge */
  }
}

export function useUnreadMessages(side: "app" | "portal", enabled = true) {
  React.useEffect(() => {
    if (!enabled || DATA_MODE !== "server") return;
    void refreshUnread(side);
    timers[side] ??= setInterval(() => document.visibilityState === "visible" && void refreshUnread(side), 60_000);
  }, [side, enabled]);
  return React.useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => state[side],
    () => 0,
  );
}
void timers;
