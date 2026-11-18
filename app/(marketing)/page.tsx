import Link from "next/link";
import {
  ArrowRight, CalendarCheck, Check, CircleDot, Download, Lock, LayoutPanelTop, NotebookPen, ShieldCheck, Sparkles, Sprout, Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ProductShot } from "@/components/marketing/product-shot";
import { FinalCta, SectionHeading } from "@/components/marketing/section";
import { Faq } from "@/components/marketing/faq";
import { APP_URL, SIGNUP_URL } from "@/lib/site";

const FEATURES = [
  { icon: Users, title: "Client Records", body: "Every client’s charts, people, sessions, notes and readings in one record that grows with your work together.", href: "/features#clients" },
  { icon: CircleDot, title: "Professional Charts", body: "Natal, synastry, transits, progressions, solar returns, horary, electional and astrocartography, on Swiss Ephemeris.", href: "/features#charts" },
  { icon: CalendarCheck, title: "Booking & Calendar", body: "Your own booking page, session reminders, and a calendar that prepares each consultation for you.", href: "/features#consultations" },
  { icon: NotebookPen, title: "Notes & Observations", body: "Write down what you notice, tied to the chart it describes, with full version history.", href: "/features#observations" },
  { icon: LayoutPanelTop, title: "Readings & Client Portal", body: "Record or upload readings and deliver them to a private, professional client portal.", href: "/features#portal" },
  { icon: Sprout, title: "Between Sessions", body: "Share prompts, assignments and goals. Clients respond in their portal; you see it on their record.", href: "/features#between" },
];

const STEPS = [
  { title: "Add Your Clients", body: "Import your list from a spreadsheet or add clients one at a time. Their natal chart is ready straight away." },
  { title: "Work From One Place", body: "Prepare from their chart and your past notes, hold the session, and record what you discovered." },
  { title: "Keep the Relationship Going", body: "Deliver the reading to their portal, share work for between sessions, and pick up where you left off." },
];

const TRUST = [
  { icon: Lock, title: "Private by Design", body: "Birth data, contact details and your notes are encrypted. Clients only ever see what you choose to share." },
  { icon: Download, title: "Your Data Is Yours", body: "Export all of your practice data at any time. Your knowledge is never locked inside the software." },
  { icon: ShieldCheck, title: "Precise Calculations", body: "Swiss Ephemeris, the professional standard, with your own house system, zodiac, points and orbs." },
];

const BETA = ["Everything in AstrologersDirect, free during the beta", "A direct line to the team building it", "A say in what we build next", "Import your existing clients from a spreadsheet"];

const FAQ = [
  { q: "Who is AstrologersDirect for?", a: "Working astrologers who see clients: whether you’re building your first client base or running an established practice." },
  { q: "What does the beta cost?", a: "Nothing. Everything is free during the beta. We’ll announce plans well before it ends, and nothing is charged without your agreement." },
  { q: "Do my clients need an account?", a: "Only if you invite them to their client portal, which is free for them. They can also book with you without one." },
  { q: "Which chart techniques are included?", a: "Natal, synastry, midpoint composite, transits, secondary progressions, solar arcs, solar returns, horary, electional astrology, astrocartography and the convergence timeline." },
  { q: "Who can see my notes?", a: "Only you. Observations, preparation notes and session notes are private practitioner records and never appear in the client portal." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="container pb-10 pt-14 md:pb-14 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-accent-100 bg-accent-50 px-3 py-1 text-[12.5px] font-medium text-accent">
              <Sparkles className="size-3.5" /> Now in Beta
            </p>
            <h1 className="font-serif text-[44px] leading-[1.04] tracking-[-0.01em] text-ink sm:text-[58px] md:text-[72px]">
              Better Tools. <span className="italic text-accent">Stronger Client Relationships.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted md:text-[18px]">
              AstrologersDirect brings your clients, charts, consultations and the work between sessions together in one professional workspace, so every session builds on the last.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href={SIGNUP_URL} size="lg">
                Join the Beta <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="secondary">
                See How It Works
              </ButtonLink>
            </div>
            <p className="mt-5 text-[13.5px] text-muted">
              Already a member? <a href={`${APP_URL}/auth/login`} className="font-medium text-accent hover:underline">Sign in</a>
            </p>
          </div>
        </div>
        <div className="container pb-16 md:pb-24">
          <div className="relative mx-auto max-w-6xl">
            <div className="absolute inset-x-10 -bottom-6 top-12 -z-10 rounded-3xl bg-canvas-3/70" aria-hidden />
            <ProductShot src="/screenshots/dashboard.png" alt="The AstrologersDirect practitioner dashboard" url="app.astrologersdirect.com" priority />
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="border-y border-line bg-surface">
        <div className="container grid gap-10 py-16 md:py-20 lg:grid-cols-2 lg:gap-20">
          <SectionHeading title="Your Work Doesn’t End with the Reading. Why Should Your Software?" />
          <div className="space-y-4 text-[16px] leading-relaxed text-ink-3">
            <p>Client records in one place. Notes somewhere else. Appointments, recordings and follow-ups scattered across different tools.</p>
            <p>Most astrology software calculates charts and leaves the rest to you. AstrologersDirect is built around the whole client relationship.</p>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="container py-16 md:py-24">
        <SectionHeading align="center" title="One Workspace. Every Part of Your Practice." />
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="group bg-surface p-6 transition-colors hover:bg-canvas md:p-7">
              <f.icon className="size-5 text-accent" />
              <h3 className="mt-4 text-[16.5px] font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{f.body}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link href="/features" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:text-accent-hover">See All Features <ArrowRight className="size-4" /></Link>
        </p>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface">
        <div className="container py-16 md:py-24">
          <SectionHeading align="center" title="How It Works" />
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="flex size-10 items-center justify-center rounded-full bg-accent-50 font-serif text-[20px] text-accent">{i + 1}</span>
                <h3 className="mt-4 text-[17px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trust */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading title="Built for the Trust Your Clients Place in You." />
          <div className="grid gap-8 sm:grid-cols-3">
            {TRUST.map((t) => (
              <div key={t.title}>
                <t.icon className="size-5 text-accent" />
                <h3 className="mt-3 text-[15.5px] font-semibold text-ink">{t.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The beta */}
      <section className="container pb-16 md:pb-24">
        <div className="grid gap-10 rounded-2xl border border-line bg-surface p-8 shadow-card md:p-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow mb-3 text-accent">The Beta</p>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Free While We Build It Together.</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted">Create your account in a minute and start with your own clients straight away. In return, we ask for one thing: your honest feedback.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={SIGNUP_URL} size="lg">Create Your Free Account</ButtonLink>
              <ButtonLink href="/pricing" size="lg" variant="secondary">Pricing</ButtonLink>
            </div>
          </div>
          <ul className="space-y-3 self-center">
            {BETA.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15.5px] text-ink-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><Check className="size-3.5" /></span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-line bg-surface">
        <div className="container grid gap-10 py-16 md:py-24 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow mb-3 text-accent">FAQ</p>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Frequently Asked Questions</h2>
            <p className="mt-3 text-[14.5px] text-muted">More on the <Link href="/pricing" className="text-accent underline underline-offset-2">Pricing</Link> page, or <Link href="/contact" className="text-accent underline underline-offset-2">contact us</Link>.</p>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>

      <FinalCta title="Build Stronger Client Relationships." />
    </>
  );
}
