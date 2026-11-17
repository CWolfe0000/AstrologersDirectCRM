import Link from "next/link";
import { ArrowRight, BookMarked, CircleDot, LayoutPanelTop, NotebookPen, Sparkles, Users, Workflow } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ProductShot } from "@/components/marketing/product-shot";
import { FinalCta, SectionHeading } from "@/components/marketing/section";

const SCATTERED = [
  ["Charts", "in one program."],
  ["Client histories", "somewhere else."],
  ["Notes", "in documents and notebooks."],
  ["Recordings, appointments and email", "spread across different services."],
];

const BENEFITS = [
  { icon: Users, title: "Understand the whole client.", body: "Birth data, charts, relationships, consultations and every reading you’ve delivered, kept together in one record." },
  { icon: NotebookPen, title: "Build on every observation.", body: "Save interpretations to the chart they describe. Tag them by planet, aspect and house. Return to them whenever you need them." },
  { icon: CircleDot, title: "See the bigger picture.", body: "Natal, relationship and timing techniques in one professional workspace, calculated with Swiss Ephemeris." },
  { icon: LayoutPanelTop, title: "Give clients a better experience.", body: "Deliver readings and recordings to a private portal, with a personal message and the access you choose." },
  { icon: Workflow, title: "Spend your time on the work that matters.", body: "Preparation, consultations, follow-ups and delivery in one connected workflow." },
  { icon: Sparkles, title: "Let intelligence support experience.", body: "An assistant that finds and organises your own work, and leaves interpretation to you.", soon: true },
];

const STEPS = [
  { title: "Bring your clients together.", body: "One organised record for each person you work with." },
  { title: "Explore their charts.", body: "With the techniques and settings you trust." },
  { title: "Preserve what you discover.", body: "Observations stay connected to the charts and consultations that inspired them." },
  { title: "Share your work.", body: "Readings and recordings, delivered through a private client portal." },
  { title: "Build on what came before.", body: "Return to a client’s complete history and continue where you left off." },
];

export default function HomePage() {
  return (
    <>
      {/* Why */}
      <section className="overflow-hidden">
        <div className="container pb-10 pt-14 md:pb-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow mb-5 text-accent">For professional astrologers</p>
            <h1 className="font-serif text-[44px] leading-[1.04] tracking-[-0.01em] text-ink sm:text-[58px] md:text-[72px]">
              Your expertise deserves more than <span className="italic text-accent">ordinary software.</span>
            </h1>
            <div className="mx-auto mt-7 max-w-2xl space-y-4 text-[17px] leading-relaxed text-muted md:text-[18px]">
              <p>Every chart you study, every client you help and every observation you make adds to something invaluable: your professional knowledge.</p>
              <p>We believe that knowledge should grow with you. Not disappear into disconnected programs, notebooks and files.</p>
              <p className="text-ink-3">AstrologersDirect brings your charts, clients, consultations and insights together in one professional workspace.</p>
            </div>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/app" size="lg">
                Explore the Platform <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="secondary">
                See How It Works
              </ButtonLink>
            </div>
            <p className="mt-5 text-[13px] text-muted">Built for professional astrologers. Designed around the way you work.</p>
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
        <div className="container grid gap-12 py-20 md:py-28 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <SectionHeading title="Astrology has evolved. The tools supporting it should too." />
            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-muted">
              <p>Astrologers have spent decades refining their techniques, developing their judgement and helping people understand their lives.</p>
              <p>The technology supporting that work hasn’t kept pace.</p>
            </div>
          </div>
          <div>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {SCATTERED.map(([what, where]) => (
                <li key={what} className="px-5 py-4 text-[16px] text-ink-3">
                  <span className="font-semibold text-ink">{what}</span> {where}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3 text-[16px] leading-relaxed text-ink-3">
              <p>The problem isn’t a lack of expertise.</p>
              <p className="font-serif text-[24px] leading-snug text-ink">It’s that the tools were never designed to work together.</p>
              <p className="text-muted">And when knowledge is scattered, time goes into finding information instead of building on it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Imagine */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <SectionHeading align="center" title="Imagine a practice that remembers what you’ve learned." />
          <div className="mt-10 space-y-5 text-[17px] leading-relaxed text-ink-3">
            <p>Imagine opening a client’s chart and seeing the observations you made three years ago.</p>
            <p>Imagine preparing for a consultation with their history and previous readings in front of you, and the year ahead mapped on a timeline.</p>
            <p>Imagine finding every observation you’ve ever written about Saturn on the Moon, across every client in your practice.</p>
            <p className="text-muted">Not because you built a complicated filing system.</p>
            <p className="font-serif text-[26px] leading-snug text-ink">Because your workspace was designed to remember.</p>
          </div>
          <p className="mt-8 text-center text-[15px] text-muted">That’s the thinking behind AstrologersDirect.</p>
        </div>
      </section>

      {/* How → What */}
      <section className="border-y border-line bg-surface">
        <div className="container py-20 md:py-28">
          <SectionHeading align="center" title="One workspace. A more connected practice." />
          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-surface p-6 md:p-7">
                <div className="flex items-center gap-2">
                  <b.icon className="size-5 text-accent" />
                  {b.soon && <span className="rounded-full border border-line px-2 py-px text-[11px] text-muted">In development</span>}
                </div>
                <h3 className="mt-5 text-[17px] font-semibold text-ink">{b.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{b.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/features" variant="secondary">
              Explore All Features <ArrowRight />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <SectionHeading title="The best technology doesn’t replace expertise. It extends it." />
          <div className="space-y-4 text-[16.5px] leading-relaxed text-ink-3">
            <p>Astrology is an interpretive discipline. It takes judgement, context, experience, and an understanding of the person behind the chart.</p>
            <p>We don’t believe software should make those decisions for you.</p>
            <p>We believe it should give you better access to what you need to make them yourself.</p>
            <p>Your observations remain yours. Your methods remain yours. Your judgement stays at the centre.</p>
            <p className="font-serif text-[26px] leading-snug text-ink">The technology does the organising. You do the interpreting.</p>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="border-y border-line bg-surface">
        <div className="container py-20 md:py-28">
          <SectionHeading title="From your first client to your thousandth." body="Every consultation becomes part of a growing professional record." />
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-line bg-canvas/40 p-5">
                <span className="font-serif text-[28px] text-accent">{i + 1}</span>
                <h3 className="mt-3 text-[15px] font-semibold leading-snug text-ink">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:text-accent-hover">
              See How It Works <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="container py-20 md:py-28">
        <div className="flex flex-col items-start gap-8 rounded-2xl border border-line bg-canvas-2/60 p-8 md:flex-row md:p-12">
          <BookMarked className="size-8 shrink-0 text-sage-dark" />
          <div>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Better tools are only the beginning.</h2>
            <div className="mt-5 max-w-3xl space-y-4 text-[16px] leading-relaxed text-ink-3">
              <p>When astrologers can preserve, search and compare their observations, something bigger becomes possible.</p>
              <p>Individual experience becomes organised knowledge. Recurring patterns become easier to investigate. And the profession gains new ways to learn from the work its practitioners are already doing.</p>
              <p>We believe the future of astrology depends not only on better calculations, but on better ways to connect experience, evidence and interpretation.</p>
              <p className="text-ink">AstrologersDirect is being built with that future in mind.</p>
            </div>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
