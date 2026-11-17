import { ArrowRight, CalendarCheck, HeartHandshake, LayoutPanelTop, MessagesSquare, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ProductShot } from "@/components/marketing/product-shot";
import { SectionHeading } from "@/components/marketing/section";

const SCATTERED = ["Client records in one place.", "Notes somewhere else.", "Appointments, recordings, follow-ups and messages scattered across different tools."];

const PILLARS = [
  { icon: Users, title: "Know your clients better.", body: "Keep their charts, personal history, previous consultations and your observations together." },
  { icon: MessagesSquare, title: "Make every consultation count.", body: "Prepare with context, record important insights, and build on previous conversations." },
  { icon: HeartHandshake, title: "Stay connected between sessions.", body: "Share assignments, journaling prompts, goals and follow-up activities that support your clients’ ongoing development. They respond in their portal; you see it on their record." },
  { icon: LayoutPanelTop, title: "Deliver a professional experience.", body: "Record and share readings, share files and resources, and give clients a private portal for their work with you." },
  { icon: CalendarCheck, title: "Spend less time managing. More time practising.", body: "Appointments, client records, follow-up tasks and reminders in one place, instead of a collection of disconnected systems." },
];

export default function HomePage() {
  return (
    <>
      {/* Why */}
      <section className="overflow-hidden">
        <div className="container pb-10 pt-14 md:pb-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow mb-5 text-accent">For professional astrologers</p>
            <h1 className="font-serif text-[46px] leading-[1.04] tracking-[-0.01em] text-ink sm:text-[60px] md:text-[76px]">
              Better Tools. <span className="italic text-accent">Stronger Client Relationships.</span>
            </h1>
            <div className="mx-auto mt-7 max-w-2xl space-y-4 text-[17px] leading-relaxed text-muted md:text-[18px]">
              <p className="text-ink-3">A meaningful consultation doesn’t end when the session is over.</p>
              <p>The conversations continue. New questions emerge. Life changes. Clients return with new experiences, new challenges and new opportunities for growth.</p>
              <p>We believe the tools astrologers use should support that entire journey. Not just the moment a chart is calculated.</p>
              <p className="text-ink-3">AstrologersDirect brings your clients, charts, consultations, notes and ongoing work together in one professional workspace.</p>
            </div>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/app" size="lg">
                Explore the Platform <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="secondary">
                See How It Works
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="container pb-16 md:pb-24">
          <div className="relative mx-auto max-w-6xl">
            <div className="absolute inset-x-10 -bottom-6 top-12 -z-10 rounded-3xl bg-canvas-3/70" aria-hidden />
            <ProductShot src="/screenshots/dashboard.png" alt="AstrologersDirect practitioner dashboard" url="app.astrologersdirect.com" priority />
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="border-y border-line bg-surface">
        <div className="container grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading title="Your work doesn’t end with the reading. Why should your software?" />
            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-muted">
              <p className="text-ink-3">Every client has a story.</p>
              <p>Their birth chart is one part of it. Their experiences, relationships, goals, and the work you’ve done together are the rest.</p>
              <p>Yet most astrology software focuses on calculating and displaying charts, and leaves practitioners to manage everything else themselves.</p>
            </div>
          </div>
          <div className="lg:pt-4">
            <ul className="divide-y divide-line rounded-xl border border-line">
              {SCATTERED.map((t) => (
                <li key={t} className="px-5 py-4 text-[16px] text-ink-3">
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 font-serif text-[24px] leading-snug text-ink">We believe professional astrology deserves a platform built around the entire client relationship.</p>
          </div>
        </div>
      </section>

      {/* How → What */}
      <section className="container py-20 md:py-28">
        <SectionHeading align="center" title="One platform. Every part of your practice." />
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-6">
          {PILLARS.map((p, i) => (
            <div key={p.title} className={`bg-surface p-6 md:p-7 ${i < 3 ? "lg:col-span-2" : "lg:col-span-3"} ${i === PILLARS.length - 1 ? "sm:col-span-2" : ""}`}>
              <p.icon className="size-5 text-accent" />
              <h3 className="mt-5 text-[17px] font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="border-y border-line bg-surface">
        <div className="container grid gap-12 py-20 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <SectionHeading title="Because the relationship is the real work." />
          <div className="space-y-4 text-[16.5px] leading-relaxed text-ink-3">
            <p>A chart can tell you where to begin.</p>
            <p>But understanding how someone experiences those patterns takes time, conversation and trust.</p>
            <p>The most valuable insights often emerge over several consultations, as clients reflect, make decisions, and return with new experiences.</p>
            <p>AstrologersDirect is designed to preserve that continuity.</p>
            <p className="font-serif text-[24px] leading-snug text-ink">So every consultation can build on the last. And every client can feel remembered, understood and supported.</p>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="container py-20 md:py-28">
        <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-14 text-center md:px-16 md:py-20">
          <h2 className="mx-auto max-w-2xl font-serif text-[38px] leading-[1.1] text-white md:text-[52px]">
            Your Practice, <span className="italic text-[#E3C9D0]">Connected.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15.5px] text-[#CFCAD0]">Professional chart tools. Client management. Consultation records. Reading delivery. Ongoing client engagement.</p>
          <p className="mx-auto mt-3 max-w-xl text-[15.5px] text-white">Everything you need to support the work you do, and the people you do it for.</p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/features" size="lg">
              Explore AstrologersDirect <ArrowRight />
            </ButtonLink>
          </div>
          <p className="mx-auto mt-8 max-w-xl text-[12.5px] text-[#9C969E]">AstrologersDirect is in private beta. The AI assistant is still in development.</p>
        </div>
      </section>
    </>
  );
}
