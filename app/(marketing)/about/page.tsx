import type { Metadata } from "next";
import { Compass, Layers, KeyRound, Search, UserRound } from "lucide-react";
import { PageIntro } from "@/components/marketing/section";
import { AdvisoryForm } from "@/components/marketing/forms";

export const metadata: Metadata = { title: "About" };

const PRINCIPLES = [
  { icon: UserRound, title: "The astrologer comes first.", body: "Technology should support professional judgement, not replace it." },
  { icon: Layers, title: "Knowledge should accumulate.", body: "What you discover through your work should stay accessible and useful for years." },
  { icon: Compass, title: "Complexity shouldn’t mean complication.", body: "Sophisticated tools can be powerful without being difficult to use." },
  { icon: KeyRound, title: "Your work belongs to you.", body: "Your clients, observations and methods stay under your control, and you can export them at any time." },
  { icon: Search, title: "Better questions lead to better understanding.", body: "We want to make it easier to investigate patterns, compare observations and learn from experience." },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro eyebrow="About AstrologersDirect" title="We believe astrology deserves better tools. And a stronger future.">
        <div className="mt-5 max-w-2xl space-y-3 text-[17px] leading-relaxed text-muted">
          <p>Professional astrology is built on more than calculations. It’s built on observation, interpretation, experience, and the ongoing study of how planetary configurations show up in people’s lives.</p>
          <p>Every working astrologer adds to that understanding. Yet much of what practitioners learn stays scattered across notebooks, isolated chart programs and years of client records.</p>
          <p className="text-ink">We believe that knowledge deserves a better home. That’s why we’re building AstrologersDirect.</p>
        </div>
      </PageIntro>

      <section className="container grid gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="eyebrow mb-3 text-accent">Our mission</p>
          <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Help astrologers do their best work, and build on it.</h2>
        </div>
        <div className="space-y-4 text-[16px] leading-relaxed text-ink-3">
          <p>We believe the future of astrology depends on giving practitioners better ways to work, to preserve what they know, and to investigate what they observe.</p>
          <p>That starts with something practical: professional software designed around the whole practice.</p>
          <p className="font-medium text-ink">Not just the chart.</p>
          <p>The person behind it. The consultation. The observations. The questions that emerge. The insight that develops over time.</p>
          <p>When those stay connected, astrologers spend less time managing information and more time deepening their understanding.</p>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="container grid gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow mb-3 text-accent">Why we’re building something different</p>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">The goal isn’t more convenient software. It’s more useful knowledge.</h2>
          </div>
          <div className="space-y-4 text-[16px] leading-relaxed text-ink-3">
            <p>Most professions have technology designed around how their practitioners actually work.</p>
            <p>Astrologers have sophisticated chart programs. But the work around those charts is managed somewhere else. We believe that separation limits what professional software can do.</p>
            <ul className="space-y-1.5 border-l-2 border-accent-200 pl-4 font-serif text-[20px] leading-snug text-ink">
              <li>A chart should connect to its client.</li>
              <li>An observation should connect to its source.</li>
              <li>A consultation should build on the last.</li>
            </ul>
            <p>And years of professional experience should be easy to retrieve, examine and learn from.</p>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <p className="eyebrow mb-3 text-accent">Our principles</p>
        <h2 className="max-w-2xl font-serif text-[32px] leading-tight text-ink md:text-[40px]">What we believe.</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title}>
              <p.icon className="size-5 text-accent" />
              <h3 className="mt-4 text-[16px] font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="container grid gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow mb-3 text-accent">Our vision</p>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">A more connected profession.</h2>
          </div>
          <div className="space-y-4 text-[16px] leading-relaxed text-ink-3">
            <p>Imagine searching decades of your own observations. Investigating recurring configurations. Building research collections from real client experience.</p>
            <p>Imagine professional knowledge that is easier to organise, examine, and share responsibly, always under the practitioner’s control.</p>
            <p>That’s the future we’re working toward. It begins with building a better workspace for the astrologers doing the work today.</p>
          </div>
        </div>
      </section>

      <section className="container py-20 md:py-28">
        <div className="rounded-2xl bg-ink px-6 py-12 md:px-14 md:py-16">
          <p className="eyebrow mb-3 text-[#C9B3BA]">Build it with us</p>
          <h2 className="max-w-2xl font-serif text-[32px] leading-tight text-white md:text-[42px]">The people who understand astrology best are the people who practise it.</h2>
          <p className="mt-4 max-w-2xl text-[15.5px] text-[#CFCAD0]">We’re inviting working astrologers to use AstrologersDirect, share what they experience, and help decide what the profession needs next.</p>
          <div className="mt-8 max-w-3xl">
            <AdvisoryForm />
          </div>
        </div>
      </section>
    </>
  );
}
