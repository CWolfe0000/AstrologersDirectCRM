import Link from "next/link";
import { ArrowRight, Check, FileStack, NotebookTabs, CalendarX2, Repeat, CircleDot } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ProductShot } from "@/components/marketing/product-shot";
import { FinalCta, SectionHeading } from "@/components/marketing/section";
import { FEATURES } from "@/components/marketing/features-data";

const PROBLEMS = [
  { icon: CircleDot, title: "Disconnected chart software", body: "Charts live in desktop software that knows nothing about the client, the consultation, or what you said last time." },
  { icon: NotebookTabs, title: "Scattered client notes", body: "Observations end up in notebooks, documents and email threads — impossible to find when the client returns." },
  { icon: CalendarX2, title: "Separate scheduling and communication", body: "Calendars, email, file sharing and payment each live in a different tool, stitched together by hand." },
  { icon: Repeat, title: "Lost observations, repeated admin", body: "Insight from years of work is hard to retrieve, while the same administrative steps are repeated for every reading." },
];

const STEPS = [
  { n: "01", title: "Create or import a client", body: "Enter birth data once. Add partners and family members with their own details." },
  { n: "02", title: "Generate and analyse charts", body: "Natal, relationship and timing charts, all attached to the client record." },
  { n: "03", title: "Save observations and consultation records", body: "Autosaved interpretations, prep notes, session notes and follow-ups." },
  { n: "04", title: "Deliver readings and recordings", body: "Upload a reading or record one in the studio, then send it to the client portal." },
  { n: "05", title: "Build on the client’s history over time", body: "Every return visit starts with everything you already know." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="container pb-10 pt-14 md:pb-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow mb-5 text-accent">Practice management for professional astrologers</p>
            <h1 className="font-serif text-[48px] leading-[1.02] tracking-[-0.01em] text-ink sm:text-[64px] md:text-[80px]">
              Your Practice. <span className="italic text-accent">Connected.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted md:text-[18px]">
              Charts, clients, consultations and your professional knowledge — finally in one workspace. Spend less time on administration and more time practising astrology.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/app" size="lg">
                Explore the Platform <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="secondary">
                See How It Works
              </ButtonLink>
            </div>
            <p className="mt-5 text-[13px] text-muted">Your expertise deserves better tools.</p>
          </div>
        </div>
        <div className="container pb-16 md:pb-24">
          <div className="relative mx-auto max-w-6xl">
            <div className="absolute inset-x-10 -bottom-6 top-12 -z-10 rounded-3xl bg-canvas-3/70" aria-hidden />
            <ProductShot src="/screenshots/dashboard.png" alt="AstrologersDirect practitioner dashboard" url="app.astrologersdirect.com/dashboard" priority />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-line bg-surface">
        <div className="container py-20 md:py-28">
          <SectionHeading
            eyebrow="The problem"
            title="Astrologers work across too many disconnected tools."
            body="Professional astrology software calculates charts beautifully, but the practice that surrounds them — clients, sessions, notes and deliveries — is left to spreadsheets, inboxes and memory."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="bg-surface p-6 md:p-7">
                <p.icon className="size-5 text-accent" />
                <h3 className="mt-5 text-[16px] font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="container py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="The solution"
              title="One connected professional workspace."
              body="AstrologersDirect is organised around the relationship between you and each client. Every chart, observation, consultation and delivered reading is connected — so your accumulated knowledge is always one click away."
            />
            <ul className="mt-8 space-y-3">
              {["Charts stay linked to the people they describe", "Observations persist across years of consultations", "Readings reach clients through a private, branded portal", "Assistance that organises your work without replacing your judgement"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-ink-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-dark">
                    <Check className="size-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-3 text-center text-[13px] sm:grid-cols-3">
              {[
                ["Clients", "Profiles & history"],
                ["Charts", "Natal to timing"],
                ["Observations", "Your knowledge base"],
                ["Consultations", "Calendar & notes"],
                ["Delivery", "Readings & recordings"],
                ["Client portal", "Private access"],
              ].map(([t, s], i) => (
                <div key={t} className={`rounded-xl border p-5 ${i === 0 ? "border-accent-100 bg-accent-50" : "border-line bg-surface"}`}>
                  <p className="font-serif text-[20px] text-ink">{t}</p>
                  <p className="mt-1 text-muted">{s}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[12.5px] text-muted">Every module reads from — and writes back to — the same client record.</p>
          </div>
        </div>
      </section>

      {/* Feature showcase */}
      <section className="border-y border-line bg-surface">
        <div className="container py-20 md:py-28">
          <SectionHeading align="center" eyebrow="Feature showcase" title="Everything your practice needs, designed together." />
          <div className="mt-16 space-y-20 md:space-y-28">
            {FEATURES.map((f, i) => (
              <div key={f.id} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent-50 text-accent">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-serif text-[30px] leading-tight text-ink md:text-[36px]">{f.title}</h3>
                  <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{f.body}</p>
                  <ul className="mt-6 space-y-2.5">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[14px] text-ink-3">
                        <Check className="mt-0.5 size-4 shrink-0 text-sage-dark" /> {p}
                      </li>
                    ))}
                  </ul>
                  <Link href={f.href} className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:text-accent-hover">
                    Open in the prototype <ArrowRight className="size-4" />
                  </Link>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                  {f.id === "portal" ? (
                    <div className="flex items-end justify-center gap-6">
                      <ProductShot src={f.shot} alt={`${f.title} screenshot`} className="hidden flex-1 sm:block" url="portal.morrowastrology.com" />
                      <ProductShot src="/screenshots/portal-mobile.png" alt="Client portal on mobile" device="phone" className="w-[46%] max-w-[220px] sm:-ml-20 sm:w-[34%]" />
                    </div>
                  ) : (
                    <ProductShot src={f.shot} alt={`${f.title} screenshot`} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <ButtonLink href="/features" variant="secondary">
              See all features <ArrowRight />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20 md:py-28">
        <SectionHeading eyebrow="How it works" title="From first enquiry to a lifetime of readings." body="A typical client journey in AstrologersDirect follows five simple steps." />
        <ol className="mt-12 grid gap-4 md:grid-cols-5">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl border border-line bg-surface p-5">
              <span className="font-serif text-[28px] text-accent">{s.n}</span>
              <h3 className="mt-3 text-[15px] font-semibold leading-snug text-ink">{s.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:text-accent-hover">
            Walk through the full workflow <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="container">
        <div className="flex flex-col items-start gap-5 rounded-xl border border-line bg-canvas-2/60 p-7 md:flex-row md:items-center md:p-9">
          <FileStack className="size-7 shrink-0 text-sage-dark" />
          <p className="flex-1 font-serif text-[22px] leading-snug text-ink md:text-[26px]">
            “The technology should support the astrologer’s expertise, not compete with it.”
          </p>
          <Link href="/about" className="text-[14px] font-medium text-accent hover:underline">
            Our philosophy
          </Link>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
