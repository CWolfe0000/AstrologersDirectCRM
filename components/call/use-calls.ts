"use client";

import * as React from "react";
import { isCall } from "@/lib/booking/formats";

let cached: Promise<boolean> | null = null;
/** Whether built-in calls are switched on (asked once per page load). */
export function useCallsEnabled() {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    cached ??= fetch("/api/public/calls").then((r) => r.json()).then((d) => !!d.enabled, () => false);
    void cached.then(setOn);
  }, []);
  return on;
}

/** A session held on a built-in call: a live format with no outside link, while calls are on. */
export const onBuiltInCall = (k: { location: string; meetingUrl?: string | null }, enabled: boolean) => enabled && isCall(k.location) && !k.meetingUrl;
