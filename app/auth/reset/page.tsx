"use client";

import { ServerReset } from "@/components/auth/server-forms";
import { DATA_MODE } from "@/lib/utils";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { AuthHeading } from "@/components/marketing/auth-ui";

function DemoResetPage() {
  const [stage, setStage] = React.useState<"form" | "loading" | "sent" | "new" | "done">("form");
  const [email, setEmail] = React.useState("");

  if (stage === "sent")
    return (
      <>
        <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-sage-50 text-sage-dark">
          <Send className="size-5" />
        </span>
        <AuthHeading title="Check your inbox" body={<>If an account exists for <span className="font-medium text-ink">{email}</span>, you’ll receive a link to reset your password within a few minutes.</>} />
        <Button variant="secondary" className="w-full" onClick={() => setStage("new")}>
          Open Reset Link (Demo)
        </Button>
        <p className="mt-6 text-center text-[13.5px] text-muted">
          <button className="text-accent hover:underline" onClick={() => setStage("form")}>
            Try a different email
          </button>
        </p>
      </>
    );

  if (stage === "new" || stage === "done")
    return (
      <>
        <AuthHeading title="Choose a new password" body="Use at least 12 characters. You’ll be signed out of other devices." />
        {stage === "done" ? (
          <div className="rounded-xl border border-sage-100 bg-sage-50 p-4 text-[14px] text-sage-dark">
            Password updated. <Link href="/auth/login" className="font-medium underline">Sign in</Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setStage("done");
            }}
          >
            <Field label="New Password" htmlFor="np">
              <Input id="np" type="password" required minLength={12} autoComplete="new-password" />
            </Field>
            <Field label="Confirm New Password" htmlFor="cp">
              <Input id="cp" type="password" required minLength={12} autoComplete="new-password" />
            </Field>
            <Button type="submit" size="lg" className="w-full">
              Update Password
            </Button>
          </form>
        )}
      </>
    );

  return (
    <>
      <Link href="/auth/login" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Back to sign in
      </Link>
      <AuthHeading title="Reset your password" body="Enter the email you use for AstrologersDirect and we’ll send you a reset link." />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setStage("loading");
          setTimeout(() => setStage("sent"), 600);
        }}
      >
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={stage === "loading"}>
          {stage === "loading" && <Loader2 className="animate-spin" />} Send Reset Link
        </Button>
      </form>
    </>
  );
}

export default function ResetPage() {
  return DATA_MODE === "demo" ? <DemoResetPage /> : <ServerReset />;
}
