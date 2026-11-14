"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const toast = useStore((s) => s.toast);
  const [sent, setSent] = React.useState(false);
  if (sent) {
    return (
      <div className="flex flex-col items-start rounded-xl border border-line bg-surface p-8">
        <CheckCircle2 className="size-8 text-sage-dark" />
        <h3 className="mt-4 font-serif text-[26px] text-ink">Thank you — message received.</h3>
        <p className="mt-2 text-[14px] text-muted">We usually reply within two working days. (Prototype: no message was actually sent.)</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }
  return (
    <form
      className="grid gap-4 rounded-xl border border-line bg-surface p-6 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
        toast("Message sent", "Simulated — no email was sent from the prototype.", "success");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name">
          <Input id="c-name" required placeholder="Your name" />
        </Field>
        <Field label="Email" htmlFor="c-email">
          <Input id="c-email" type="email" required placeholder="you@example.com" />
        </Field>
      </div>
      <Field label="Topic" htmlFor="c-topic">
        <Select id="c-topic" defaultValue="general">
          <option value="general">General inquiry</option>
          <option value="support">Product support</option>
          <option value="early">Early access & pricing</option>
          <option value="partnership">Partnerships & press</option>
          <option value="data">Privacy & data</option>
        </Select>
      </Field>
      <Field label="Message" htmlFor="c-msg">
        <Textarea id="c-msg" required rows={5} placeholder="How can we help?" />
      </Field>
      <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-[12px] text-muted">Prototype form — submissions are simulated.</p>
        <Button type="submit">Send message</Button>
      </div>
    </form>
  );
}

export function AdvisoryForm() {
  const toast = useStore((s) => s.toast);
  const [done, setDone] = React.useState(false);
  if (done)
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white">
        <CheckCircle2 className="size-6 text-[#B7C8BD]" />
        <p className="mt-3 font-serif text-[22px]">You’re on the list.</p>
        <p className="mt-1 text-[13.5px] text-[#CFCAD0]">We’ll be in touch about the next practitioner session.</p>
      </div>
    );
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
        toast("Thanks for joining", "Simulated — you've been added to the advisory group list.", "success");
      }}
    >
      <Input required placeholder="Your name" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" aria-label="Your name" />
      <Input required type="email" placeholder="Email address" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" aria-label="Email" />
      <Button type="submit" size="md">
        Join the advisory group
      </Button>
    </form>
  );
}
