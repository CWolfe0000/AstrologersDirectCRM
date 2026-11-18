import type { Metadata } from "next";
import { Check } from "lucide-react";
import { RequestAccessForm } from "@/components/marketing/request-access-form";

export const metadata: Metadata = { title: "Request Access", description: "Join the AstrologersDirect private beta." };

const PERKS = ["Free access to everything during the beta", "A direct line to the team building it", "A say in what we build next", "Import your existing client list from a spreadsheet"];

export default function RequestAccessPage() {
  return (
    <section className="container grid gap-12 py-14 md:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <div>
        <p className="eyebrow mb-4 text-accent">Private Beta</p>
        <h1 className="font-serif text-[40px] leading-[1.08] text-ink md:text-[52px]">Join the AstrologersDirect Beta</h1>
        <p className="mt-5 text-[16.5px] leading-relaxed text-muted">We’re welcoming working astrologers a few at a time, so we can support each of you well and build what the profession actually needs.</p>
        <ul className="mt-8 space-y-3">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[15px] text-ink-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><Check className="size-3.5" /></span>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[13.5px] text-muted">In return, we ask for your honest feedback. Tell us what works, what doesn’t, and what you wish it did.</p>
      </div>
      <RequestAccessForm />
    </section>
  );
}
