"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";

const EXPERIENCE = ["", "Under 2 years", "2–5 years", "5–10 years", "10+ years"];

export function RequestAccessForm() {
  const [f, setF] = React.useState({ name: "", email: "", practice: "", website: "", experience: "", about: "", company: "" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  if (done)
    return (
      <div className="rounded-2xl border border-line bg-surface p-8">
        <CheckCircle2 className="size-8 text-sage-dark" />
        <h2 className="mt-4 font-serif text-[28px] leading-tight text-ink">Thank You. Your Request Is In.</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">We’ve emailed {f.email} to confirm. We review every request personally and will be in touch as soon as there’s a place for you.</p>
      </div>
    );
  return (
    <form
      className="relative grid gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card sm:grid-cols-2 md:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await api("/api/public/access-request", { body: { ...f, emailConsent: true } });
          setDone(true);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label>Company <input tabIndex={-1} autoComplete="off" value={f.company} onChange={set("company")} /></label>
      </div>
      <Field label="Your Name" htmlFor="ra-name"><Input id="ra-name" required maxLength={120} autoComplete="name" value={f.name} onChange={set("name")} /></Field>
      <Field label="Email" htmlFor="ra-email"><Input id="ra-email" type="email" required maxLength={254} autoComplete="email" value={f.email} onChange={set("email")} /></Field>
      <Field label="Practice Name" htmlFor="ra-practice" optional><Input id="ra-practice" maxLength={160} value={f.practice} onChange={set("practice")} /></Field>
      <Field label="Website or Social Profile" htmlFor="ra-web" optional><Input id="ra-web" maxLength={300} placeholder="e.g. yourpractice.com" value={f.website} onChange={set("website")} /></Field>
      <Field label="Years in Practice" htmlFor="ra-exp" optional className="sm:col-span-2">
        <Select id="ra-exp" value={f.experience} onChange={set("experience")}>
          {EXPERIENCE.map((x) => <option key={x} value={x}>{x || "Choose…"}</option>)}
        </Select>
      </Field>
      <Field label="Tell Us About Your Practice" htmlFor="ra-about" optional className="sm:col-span-2">
        <Textarea id="ra-about" rows={4} maxLength={2000} value={f.about} onChange={set("about")} placeholder="The work you do, the tools you use now, and what you’d most like AstrologersDirect to help with." />
      </Field>
      <div className="sm:col-span-2">
        <Checkbox required label={<span className="text-[13px] text-muted">I agree to receive emails from AstrologersDirect about my request, the beta, new features and offers, as described in the <Link href="/legal/privacy" className="text-accent underline">Privacy Policy</Link>. I can unsubscribe at any time.</span>} />
      </div>
      <div className="flex flex-col-reverse items-start justify-between gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <p className="text-[12.5px] text-muted" role={error ? "alert" : undefined}>{error ? <span className="text-danger">{error}</span> : "Free during the beta."}</p>
        <Button type="submit" size="lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Request Access</Button>
      </div>
    </form>
  );
}
