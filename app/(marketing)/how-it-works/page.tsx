import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductShot } from "@/components/marketing/product-shot";
import { FinalCta, PageIntro } from "@/components/marketing/section";

export const metadata: Metadata = { title: "How It Works" };

const STEPS = [
  {
    title: "Every client has a place.",
    body: [
      "Start with a client’s birth information, contact details and the people in their life.",
      "Their charts, consultations, observations and readings belong to one record that grows with your work together.",
    ],
    close: "Enter it once. Build on it for years.",
    shot: "/screenshots/client-profile.png",
    link: { href: "/app/clients/c1", label: "Explore Client Records" },
  },
  {
    title: "Work with the charts you need.",
    body: [
      "Open a client’s chart and begin. Explore placements, aspects, houses, relationships and timing with your own settings.",
      "Create more charts without losing the connection to the person you’re studying.",
    ],
    close: "The chart workspace is part of the client record, not a separate destination.",
    shot: "/screenshots/chart-workspace.png",
    link: { href: "/app/charts/ch1", label: "Explore Chart Analysis" },
  },
  {
    title: "Turn observations into lasting knowledge.",
    body: [
      "Write down what you notice as you work. Attach it to the chart it describes, tag it by configuration, and come back to it whenever you need it.",
      "Prepare for consultations with what you’ve already learned.",
    ],
    close: "Your experience accumulates, instead of starting over with every appointment.",
    shot: "/screenshots/observations.png",
    link: { href: "/app/observations", label: "Explore Observations" },
  },
  {
    title: "Deliver work you’re proud of.",
    body: [
      "Upload a written report, or record a walkthrough of the chart in the studio.",
      "Send it to the client’s private portal with a personal message and the access you choose. They’re notified by email.",
    ],
    close: "A professional delivery, without a collection of disconnected services.",
    shot: "/screenshots/delivery.png",
    link: { href: "/app/delivery", label: "Explore Reading Delivery" },
  },
  {
    title: "Pick up where you left off.",
    body: [
      "Six months later, your client returns.",
      "Their charts are there. Their previous readings are there. Your observations and consultation history are there.",
    ],
    close: "You spend your time exploring what’s changed, not searching for what happened.",
    shot: "/screenshots/portal.png",
    link: { href: "/portal", label: "Explore the Client Portal" },
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro eyebrow="How it works" title="Less time managing your practice. More time practising astrology.">
        <div className="mt-5 max-w-2xl space-y-3 text-[17px] leading-relaxed text-muted">
          <p>The best workflow is the one you don’t have to think about.</p>
          <p>From the first consultation to the tenth, AstrologersDirect keeps your work organised, connected and ready when you need it. Here’s what that looks like.</p>
        </div>
      </PageIntro>
      <div className="container py-16 md:py-24">
        <ol className="relative space-y-20 md:space-y-28">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <span className="font-serif text-[22px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-3 font-serif text-[30px] leading-tight text-ink md:text-[38px]">{s.title}</h2>
                <div className="mt-4 space-y-3 text-[15.5px] leading-relaxed text-muted">
                  {s.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                <p className="mt-5 border-l-2 border-accent-200 pl-4 text-[15px] font-medium text-ink">{s.close}</p>
                <Link href={s.link.href} className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:text-accent-hover">
                  {s.link.label} <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                <ProductShot src={s.shot} alt={`${s.title} Screenshot`} url={s.shot.includes("portal") ? "app.astrologersdirect.com/portal" : undefined} />
              </div>
            </li>
          ))}
        </ol>
      </div>
      <FinalCta title="See the difference for yourself." body="Explore the prototype, built around realistic client scenarios. Follow a consultation from beginning to end, and see how the pieces fit together." />
    </>
  );
}
