"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { DATA_MODE } from "@/lib/utils";

const KEY = "ad-2fa-nudge-dismissed";

/** Practitioners sign in with emailed links, so their email is the key: suggest two-factor until it's on (or dismissed). */
export function TwoFactorNudge() {
  const user = useStore((s) => s.session.user);
  const [dismissed, setDismissed] = React.useState(true);
  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);
  if (DATA_MODE !== "server" || !user || user.role !== "owner" || user.twoFactor || dismissed) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-sage-100 bg-sage-50 px-4 py-3">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sage-dark" />
      <p className="flex-1 text-[13.5px] text-ink-3">
        <span className="font-medium text-ink">Protect your clients’ data with two-factor sign-in.</span> You sign in with emailed links, so your email account is the key to your practice. An authenticator app adds a second lock.{" "}
        <Link href="/app/settings?section=security" className="font-medium text-sage-dark underline underline-offset-2">Turn it on</Link>
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        className="rounded-md p-1 text-muted hover:bg-white/60 hover:text-ink"
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem(KEY, "1");
          } catch {}
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
