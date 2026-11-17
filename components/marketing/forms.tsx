"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

/** Hidden from people; bots that fill every field get a quiet success and nothing is sent. */
function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
      <label>
        Website <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

function useSend() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const send = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/contact", { body });
      return true;
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, send };
}

export function ContactForm() {
  const [sent, setSent] = React.useState(false);
  const [f, setF] = React.useState({ name: "", email: "", topic: "general", message: "", website: "" });
  const { busy, error, send } = useSend();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  if (sent) {
    return (
      <div className="flex flex-col items-start rounded-xl border border-line bg-surface p-8">
        <CheckCircle2 className="size-8 text-sage-dark" />
        <h3 className="mt-4 font-serif text-[26px] text-ink">Thank you — message received.</h3>
        <p className="mt-2 text-[14px] text-muted">We’ll reply to {f.email || "you"} by email, usually within two working days.</p>
        <Button variant="secondary" className="mt-6" onClick={() => { setF((x) => ({ ...x, message: "" })); setSent(false); }}>
          Send another message
        </Button>
      </div>
    );
  }
  return (
    <form
      className="relative grid gap-4 rounded-xl border border-line bg-surface p-6 md:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await send({ kind: "contact", ...f })) setSent(true);
      }}
    >
      <Honeypot value={f.website} onChange={(website) => setF((x) => ({ ...x, website }))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name">
          <Input id="c-name" required maxLength={120} placeholder="Your name" value={f.name} onChange={set("name")} />
        </Field>
        <Field label="Email" htmlFor="c-email">
          <Input id="c-email" type="email" required maxLength={254} placeholder="you@example.com" value={f.email} onChange={set("email")} />
        </Field>
      </div>
      <Field label="Topic" htmlFor="c-topic">
        <Select id="c-topic" value={f.topic} onChange={set("topic")}>
          <option value="general">General inquiry</option>
          <option value="support">Product support</option>
          <option value="early">Early access & pricing</option>
          <option value="partnership">Partnerships & press</option>
          <option value="data">Privacy & data</option>
        </Select>
      </Field>
      <Field label="Message" htmlFor="c-msg">
        <Textarea id="c-msg" required rows={5} maxLength={5000} placeholder="How can we help?" value={f.message} onChange={set("message")} />
      </Field>
      <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-[12px] text-muted" role={error ? "alert" : undefined}>{error ? <span className="text-danger">{error}</span> : "Your message goes to hello@astrologersdirect.com."}</p>
        <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
      </div>
    </form>
  );
}

export function AdvisoryForm() {
  const [done, setDone] = React.useState(false);
  const [f, setF] = React.useState({ name: "", email: "", website: "" });
  const { busy, error, send } = useSend();
  if (done)
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white">
        <CheckCircle2 className="size-6 text-[#B7C8BD]" />
        <p className="mt-3 font-serif text-[22px]">You’re on the list.</p>
        <p className="mt-1 text-[13.5px] text-[#CFCAD0]">Thank you. We’ll be in touch by email.</p>
      </div>
    );
  return (
    <form
      className="relative grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await send({ kind: "advisory", ...f })) setDone(true);
      }}
    >
      <Honeypot value={f.website} onChange={(website) => setF((x) => ({ ...x, website }))} />
      <Input required maxLength={120} placeholder="Your name" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} className="border-white/15 bg-white/5 text-white placeholder:text-white/40" aria-label="Your name" />
      <Input required type="email" maxLength={254} placeholder="Email address" value={f.email} onChange={(e) => setF((x) => ({ ...x, email: e.target.value }))} className="border-white/15 bg-white/5 text-white placeholder:text-white/40" aria-label="Email" />
      <Button type="submit" size="md" disabled={busy}>
        {busy ? "Sending…" : "Join the advisory group"}
      </Button>
      {error && <p role="alert" className="text-[13px] text-[#F2B8B5] sm:col-span-3">{error}</p>}
    </form>
  );
}
