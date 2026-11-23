"use client";

import * as React from "react";

/** Sends unexpected browser errors to the built-in error monitoring (the page path only, no query or form data). */
export function ErrorReporter() {
  React.useEffect(() => {
    let sent = 0;
    const report = (message: string, stack?: string) => {
      if (sent >= 5 || !message) return; // a broken page shouldn't flood
      sent++;
      void fetch("/api/public/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message.slice(0, 500), stack: stack?.slice(0, 4000), url: window.location.pathname }), keepalive: true }).catch(() => {});
    };
    const onError = (e: ErrorEvent) => report(e.message, e.error instanceof Error ? e.error.stack : undefined);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      // Expected API errors (validation, sign-in, offline) are shown to the person, not bugs.
      if (r && typeof r === "object" && "status" in r) return;
      report(r instanceof Error ? r.message : String(r), r instanceof Error ? r.stack : undefined);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);
  return null;
}
