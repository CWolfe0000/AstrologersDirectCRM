"use client";

import * as React from "react";

/** When a page crashes: report it (built-in error monitoring) and offer a way back. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    void fetch("/api/public/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: error.message || "Page crashed", stack: error.stack?.slice(0, 4000), url: window.location.pathname }), keepalive: true }).catch(() => {});
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-[30px] text-ink">Something Went Wrong</h1>
        <p className="mt-2 text-[14px] text-muted">We’ve been told about it and will look into it. Your saved work is safe.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={reset} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-[14px] font-medium text-white hover:bg-accent-hover">Try Again</button>
          <a href="/app" className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-[14px] font-medium text-ink hover:bg-canvas-2">Go to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
