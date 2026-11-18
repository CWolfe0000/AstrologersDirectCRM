import type { Metadata } from "next";
import Link from "next/link";
import { Mail, BookOpen, PlayCircle, Compass, ShieldCheck, ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/marketing/section";
import { ContactForm } from "@/components/marketing/forms";

export const metadata: Metadata = { title: "Contact & Support" };

const HELP = [
  { icon: Compass, title: "How It Works", body: "From a client’s first consultation to their tenth: how the pieces fit together.", href: "/how-it-works" },
  { icon: BookOpen, title: "Charts & Observations", body: "Chart techniques, house systems, orbs and private observations.", href: "/features#charts" },
  { icon: PlayCircle, title: "Recording & Delivery", body: "Recording modes, reading delivery and the client portal.", href: "/features#recording" },
  { icon: ShieldCheck, title: "Privacy & Security", body: "Who sees what, two-factor authentication and data export.", href: "/legal/privacy" },
];

export default function ContactPage() {
  return (
    <>
      <PageIntro eyebrow="Contact & Support" title="We’d Love to Hear from You." body="Questions about AstrologersDirect or the beta? Send us a note, and we’ll reply within two working days." />
      <section className="container grid gap-12 py-16 md:py-20 lg:grid-cols-[1.2fr_0.8fr]">
        <ContactForm />
        <div className="space-y-4">
          {[
            { icon: Mail, title: "Email Us", body: "hello@astrologersdirect.com", sub: "Questions, product support, the beta, partnerships and press." },
          ].map((c) => (
            <div key={c.title} className="flex gap-4 rounded-xl border border-line bg-surface p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent">
                <c.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold text-ink">{c.title}</p>
                <a href={`mailto:${c.body}`} className="break-all text-[14px] text-accent hover:underline">{c.body}</a>
                <p className="mt-1 text-[13px] text-muted">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="help" className="scroll-mt-20 border-t border-line bg-surface">
        <div className="container py-16 md:py-24">
          <div>
            <p className="eyebrow mb-3 text-accent">Help</p>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Support Resources</h2>
            <p className="mt-3 max-w-xl text-[15px] text-muted">Beta practitioners can also reply to any of our emails: a real person reads every one.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HELP.map((h) => (
              <Link key={h.title} href={h.href} className="group rounded-xl border border-line bg-canvas/40 p-5 transition-colors hover:border-line-strong hover:bg-surface">
                <h.icon className="size-5 text-accent" />
                <p className="mt-4 text-[15px] font-semibold text-ink">{h.title}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{h.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent">
                  Read more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
