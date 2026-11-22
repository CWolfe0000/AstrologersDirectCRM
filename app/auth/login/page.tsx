"use client";

import { ServerLogin } from "@/components/auth/server-forms";
import { DATA_MODE } from "@/lib/utils";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Checkbox } from "@/components/ui/input";
import { AuthHeading, GoogleMark, OrDivider } from "@/components/marketing/auth-ui";

function DemoLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/app"), 600);
  };
  return (
    <>
      <AuthHeading title="Welcome Back to Your Practice." body="Your clients, charts, observations and the work between sessions, together in one place." />
      <Button variant="secondary" className="w-full" onClick={() => router.push("/app")}>
        <GoogleMark /> Continue with Google
      </Button>
      <OrDivider />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" defaultValue="celeste@morrowastrology.com" autoComplete="email" required />
        </Field>
        <Field
          label={
            <span className="flex items-center justify-between">
              Password
              <Link href="/auth/reset" className="text-[12.5px] font-normal text-accent hover:underline">
                Forgot password?
              </Link>
            </span>
          }
          htmlFor="password"
        >
          <Input id="password" type="password" defaultValue="demo-password" autoComplete="current-password" required />
        </Field>
        <Checkbox label="Keep Me Signed In on This Device" defaultChecked />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : null} Sign In
        </Button>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-muted">
        New to AstrologersDirect?{" "}
        <Link href="/auth/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
      <div className="mt-8 rounded-xl border border-line bg-surface p-4">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">Are you a client?</p>
        <Link href="/portal" className="group mt-2 flex items-center gap-3 text-[14px] text-ink">
          <span className="flex size-8 items-center justify-center rounded-full bg-sage-50 text-sage-dark">
            <UserRound className="size-4" />
          </span>
          <span className="flex-1">Sign in as client (portal demo)</span>
          <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return DATA_MODE === "demo" ? <DemoLoginPage /> : <ServerLogin />;
}
