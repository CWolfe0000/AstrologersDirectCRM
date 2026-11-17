"use client";

import { ServerVerify } from "@/components/auth/server-forms";
import { DATA_MODE } from "@/lib/utils";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { AuthHeading } from "@/components/marketing/auth-ui";

function Verify() {
  const router = useRouter();
  const email = useSearchParams().get("email") || "your email address";
  const toast = useStore((s) => s.toast);
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const verify = () => {
    setLoading(true);
    setTimeout(() => router.push("/app"), 700);
  };

  return (
    <>
      <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent">
        <MailCheck className="size-6" />
      </span>
      <AuthHeading title="Verify your email" body={<>We sent a six-digit code to <span className="font-medium text-ink">{email}</span>. Enter it below, or use the link in the email.</>} />
      <div className="flex justify-between gap-2">
        {code.map((c, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={c}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => e.key === "Backspace" && !c && i > 0 && refs.current[i - 1]?.focus()}
            inputMode="numeric"
            aria-label={`Digit ${i + 1}`}
            className="h-14 w-full min-w-0 rounded-lg border border-line bg-surface text-center font-serif text-[26px] text-ink focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        ))}
      </div>
      <Button size="lg" className="mt-6 w-full" onClick={verify} disabled={loading}>
        {loading && <Loader2 className="animate-spin" />} Verify and Open My Workspace
      </Button>
      <p className="mt-3 text-center text-[12px] text-muted">Prototype: any code (or none) is accepted.</p>
      <p className="mt-8 text-center text-[13.5px] text-muted">
        Didn’t receive it?{" "}
        <button className="font-medium text-accent hover:underline" onClick={() => toast("Code re-sent", "Simulated — no email was sent.")}>
          Resend code
        </button>{" "}
        · <Link href="/auth/signup" className="hover:text-ink">Change email</Link>
      </p>
    </>
  );
}

function DemoVerifyPage() {
  return (
    <React.Suspense>
      <Verify />
    </React.Suspense>
  );
}

export default function VerifyPage() {
  return DATA_MODE === "demo" ? <DemoVerifyPage /> : <ServerVerify />;
}
