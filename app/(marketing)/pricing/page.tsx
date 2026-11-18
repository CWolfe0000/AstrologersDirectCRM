import type { Metadata } from "next";
import { SIGNUP_URL } from "@/lib/site";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageIntro, FinalCta } from "@/components/marketing/section";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = { title: "Pricing", description: "AstrologersDirect is free during the beta." };

const INCLUDED = [
  "Unlimited clients, associated people and charts",
  "Natal, synastry, composite, transits, progressions, solar arcs and solar returns",
  "Horary, electional astrology and astrocartography",
  "The convergence timeline",
  "Consultations, calendar, reminders and your own booking page",
  "Notes and observations with full version history",
  "Reading delivery, the recording studio and a private client portal",
  "Between Sessions: assignments, prompts, goals and activities",
  "Practice reports, data export and two-step verification",
];

const FAQ = [
  { q: "What does the beta cost?", a: "Nothing. Everything in AstrologersDirect is free during the beta." },
  { q: "What happens when the beta ends?", a: "We’ll announce plans and prices well before the beta ends. Nothing is ever charged without your agreement, and you can export all of your data at any time." },
  { q: "How do I join?", a: "Create your account. It takes a minute, and there’s no card to enter." },
  { q: "Can I import my existing clients?", a: "Yes. Import your client list and birth data from a spreadsheet (CSV)." },
  { q: "Which calculation engine does AstrologersDirect use?", a: "Swiss Ephemeris, the professional standard, with Astrodienst’s data files." },
  { q: "Do my clients need to pay for the client portal?", a: "No. Clients are invited by you and sign in for free." },
  { q: "Who can see my observations?", a: "Only you. Observations, preparation notes and session notes are private practitioner records and never appear in the client portal." },
];

export default function PricingPage() {
  return (
    <>
      <PageIntro eyebrow="Pricing" title="Free During the Beta." body="Every feature, for every beta practitioner. In return, we ask for your honest feedback." />
      <section className="container pb-16 md:pb-20">
        <div className="grid gap-10 rounded-2xl border border-line bg-surface p-8 shadow-card md:p-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow text-accent">Beta</p>
            <p className="mt-3 font-serif text-[56px] leading-none text-ink">$0</p>
            <p className="mt-2 text-[14.5px] text-muted">for as long as the beta runs</p>
            <ButtonLink href={SIGNUP_URL} size="lg" className="mt-8">Create Your Free Account</ButtonLink>
            <p className="mt-4 text-[13px] text-muted">We’ll announce plans well before the beta ends. Nothing is charged without your agreement.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-1">
            {INCLUDED.map((x) => (
              <li key={x} className="flex items-start gap-3 text-[15px] text-ink-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><Check className="size-3.5" /></span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="container pb-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow mb-3 text-accent">FAQ</p>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Frequently Asked Questions</h2>
            <p className="mt-3 text-[14.5px] text-muted">Can’t find what you’re looking for? <a href="/contact" className="text-accent underline underline-offset-2">Contact us</a>.</p>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>
      <FinalCta />
    </>
  );
}
