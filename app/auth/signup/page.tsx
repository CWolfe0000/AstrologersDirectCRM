"use client";

import { ServerSignup } from "@/components/auth/server-forms";
import { DATA_MODE } from "@/lib/utils";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Checkbox } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuthHeading, GoogleMark, OrDivider } from "@/components/marketing/auth-ui";

function SignupForm() {
  const router = useRouter();
  const plan = useSearchParams().get("plan");
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  return (
    <>
      <AuthHeading title="Build stronger client relationships." body="Create your practice and join the early practitioner community shaping AstrologersDirect. It takes a few minutes." />
      {plan && (
        <p className="-mt-4 mb-6 text-[13px] text-muted">
          Interested in <Badge tone="accent" className="capitalize">{plan}</Badge> — pricing to be announced.
        </p>
      )}
      <Button variant="secondary" className="w-full" onClick={() => router.push("/auth/verify")}>
        <GoogleMark /> Sign Up with Google
      </Button>
      <OrDivider />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => router.push(`/auth/verify?email=${encodeURIComponent(email)}`), 600);
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="fn">
            <Input id="fn" required autoComplete="given-name" />
          </Field>
          <Field label="Last name" htmlFor="ln">
            <Input id="ln" required autoComplete="family-name" />
          </Field>
        </div>
        <Field label="Work email" htmlFor="em">
          <Input id="em" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Practice name" htmlFor="pn" optional>
          <Input id="pn" placeholder="e.g. Morrow Astrological Consulting" />
        </Field>
        <Field label="How many clients do you see each month?" htmlFor="vol">
          <Select id="vol" defaultValue="10-30">
            <option value="0-10">Fewer than 10</option>
            <option value="10-30">10 – 30</option>
            <option value="30-60">30 – 60</option>
            <option value="60+">More than 60</option>
          </Select>
        </Field>
        <Field label="Password" htmlFor="pw" hint="At least 12 characters.">
          <Input id="pw" type="password" required minLength={12} autoComplete="new-password" />
        </Field>
        <Checkbox required label={<span className="text-[13px] text-muted">I agree to the <Link href="/legal/terms" className="text-accent underline">Terms</Link> and <Link href="/legal/privacy" className="text-accent underline">Privacy Policy</Link>.</span>} />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Create Account
        </Button>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

function DemoSignupPage() {
  return (
    <React.Suspense>
      <SignupForm />
    </React.Suspense>
  );
}

export default function SignupPage() {
  return DATA_MODE === "demo" ? <DemoSignupPage /> : <ServerSignup />;
}
