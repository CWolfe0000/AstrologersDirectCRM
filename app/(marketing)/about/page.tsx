import type { Metadata } from "next";
import { Compass, Link2, BookMarked, Sparkles, ShieldCheck, Gem } from "lucide-react";
import { PageIntro } from "@/components/marketing/section";
import { AdvisoryForm } from "@/components/marketing/forms";

export const metadata: Metadata = { title: "About" };

const PRINCIPLES = [
  { icon: Compass, title: "Organised around relationships", body: "The platform is built around the practitioner–client relationship, not around isolated charts or appointments." },
  { icon: Gem, title: "Sophisticated, yet accessible", body: "Professional chart tools without the steep learning curve — and without sacrificing depth." },
  { icon: Link2, title: "Everything connected", body: "Charts, clients, consultations, observations and delivered readings stay linked to one another." },
  { icon: BookMarked, title: "Knowledge that accumulates", body: "Your observations are preserved and retrievable — years of insight never lost in a notebook." },
  { icon: Sparkles, title: "AI that supports judgement", body: "Assistance retrieves, summarises and organises. It never replaces the astrologer’s interpretation." },
  { icon: ShieldCheck, title: "Premium for everyone involved", body: "A polished, private experience for practitioners and for the clients they serve." },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About AstrologersDirect"
        title="Better tools for the people who practise astrology professionally."
        body="Therapists, counsellors and coaches have modern practice software. Astrologers have been left to piece together chart programs, calendars, inboxes and notebooks. We think their expertise deserves better."
      />

      <section className="container grid gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="eyebrow mb-3 text-accent">Our mission</p>
          <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Less administration. More astrology.</h2>
        </div>
        <div className="space-y-5 text-[16px] leading-relaxed text-ink-3">
          <p>
            Professional astrologers carry an extraordinary amount of knowledge: technique, years of client history, and countless observations about how charts play out in real lives. Yet most of that knowledge lives in scattered files, and much of the working week is spent on administration.
          </p>
          <p>
            AstrologersDirect combines the analytical capabilities of traditional professional astrology software with the client management, consultation workflows and client portals that other professions take for granted — designed together from the beginning.
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="container py-16 md:py-24">
          <p className="eyebrow mb-3 text-accent">Product philosophy</p>
          <h2 className="max-w-2xl font-serif text-[32px] leading-tight text-ink md:text-[40px]">Calm, capable, elegant and intuitive.</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title}>
                <p.icon className="size-5 text-accent" />
                <h3 className="mt-4 text-[16px] font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="eyebrow mb-3 text-accent">Vision</p>
          <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">A professional home for the whole practice.</h2>
        </div>
        <div className="space-y-5 text-[16px] leading-relaxed text-ink-3">
          <p>
            We imagine a workspace where returning to a client feels like opening a well-kept case file: every chart, every session, every insight exactly where you left it. Where delivering a reading takes minutes. Where clients feel looked after between sessions.
          </p>
          <p>
            Over time, we want to help astrologers do research across their own practice — finding patterns in configurations across clients, building professional collections, and contributing to anonymised studies — always under the practitioner’s control.
          </p>
          <p className="font-serif text-[22px] italic text-ink">Professional without being corporate. Premium without being pretentious.</p>
        </div>
      </section>

      <section className="container pb-20 md:pb-28">
        <div className="rounded-2xl bg-ink px-6 py-12 md:px-14 md:py-16">
          <p className="eyebrow mb-3 text-[#C9B3BA]">Participate</p>
          <h2 className="max-w-2xl font-serif text-[32px] leading-tight text-white md:text-[42px]">Help us build it with you.</h2>
          <p className="mt-4 max-w-2xl text-[15.5px] text-[#CFCAD0]">
            AstrologersDirect is being developed in conversation with working astrologers. Join the practitioner advisory group to test early versions, join feedback sessions and influence what we build next.
          </p>
          <div className="mt-8 max-w-3xl">
            <AdvisoryForm />
          </div>
        </div>
      </section>
    </>
  );
}
