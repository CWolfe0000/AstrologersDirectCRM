"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailWarning, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { bootstrap, hasPendingChanges } from "@/lib/sync";
import { api } from "@/lib/api";
import { DATA_MODE } from "@/lib/utils";
import { Wordmark } from "@/components/ui/misc";

/**
 * Server mode: loads the signed-in practice (or client portal) before showing
 * the screens. Demo mode renders children straight away.
 */
function Gate({ view, children }: { view: "app" | "portal"; children: React.ReactNode }) {
  const router = useRouter();
  const as = useSearchParams().get("as");
  const session = useStore((s) => s.session);
  const portalClientId = useStore((s) => s.portalClientId);

  React.useEffect(() => {
    const switchClient = view === "portal" && session.status === "ready" && !!as && as !== portalClientId;
    if (session.status === "idle" || (session.status === "ready" && session.view !== view) || switchClient) void bootstrap(view, { as });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, session.status, session.view]);

  React.useEffect(() => {
    if (session.status !== "error") return;
    const st = session.error?.status;
    if (st === 401) router.replace(`/auth/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    else if (st === 403 && view === "app") router.replace("/portal");
  }, [session, router, view]);

  React.useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges()) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  if (session.status === "ready" && session.view === view) return <>{children}</>;
  if (session.status === "error" && session.error && ![401, 403].includes(session.error.status))
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <Wordmark />
        <p className="font-serif text-2xl">We couldn’t load your {view === "app" ? "workspace" : "portal"}</p>
        <p className="max-w-sm text-[14px] text-muted">{session.error.message}</p>
        <div className="flex gap-2">
          <button className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white" onClick={() => bootstrap(view, { as })}>Try again</button>
          {view === "portal" && <Link href="/app" className="flex h-9 items-center rounded-lg border border-line px-4 text-sm">Back to workspace</Link>}
        </div>
      </div>
    );
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas" aria-busy="true">
      <div className="flex items-center gap-3 text-[14px] text-muted">
        <Loader2 className="size-5 animate-spin text-accent" /> Loading your {view === "app" ? "workspace" : "portal"}…
      </div>
    </div>
  );
}

export function ServerGate({ view, children }: { view: "app" | "portal"; children: React.ReactNode }) {
  if (DATA_MODE === "demo") return <>{children}</>;
  return (
    <React.Suspense>
      <Gate view={view}>{children}</Gate>
    </React.Suspense>
  );
}

/** Banner reminding a practitioner to confirm their email address. */
export function VerifyEmailBanner() {
  const user = useStore((s) => s.session.user);
  const [hidden, setHidden] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  if (DATA_MODE === "demo" || !user || user.emailVerified || user.role !== "owner" || hidden) return null;
  return (
    <div className="flex items-center gap-3 border-b border-[#F1E0C2] bg-warn-50 px-4 py-2 text-[13px] text-[#7C5A22] md:px-6 lg:px-8">
      <MailWarning className="size-4 shrink-0" />
      <span className="flex-1">
        Please confirm your email address ({user.email}).{" "}
        {sent ? (
          "A new link is on its way."
        ) : (
          <button className="font-medium underline" onClick={() => api("/api/auth/resend-verification", { body: {} }).finally(() => setSent(true))}>
            Send the link again
          </button>
        )}
      </span>
      <button aria-label="Dismiss" onClick={() => setHidden(true)}>
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Small "Saving… / All changes saved" indicator for the header. */
export function SaveStatus() {
  const sync = useStore((s) => s.sync);
  const status = useStore((s) => s.session.status);
  if (DATA_MODE === "demo" || status !== "ready") return null;
  const text = sync.error ? "Some changes weren’t saved" : sync.pending > 0 ? "Saving…" : "All changes saved";
  return (
    <span className={`hidden items-center gap-1.5 text-[12px] md:inline-flex ${sync.error ? "text-danger" : "text-muted"}`} aria-live="polite">
      {sync.pending > 0 && !sync.error && <Loader2 className="size-3 animate-spin" />}
      {text}
    </span>
  );
}
