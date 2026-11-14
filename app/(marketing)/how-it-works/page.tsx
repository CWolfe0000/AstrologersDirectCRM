import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductShot } from "@/components/marketing/product-shot";
import { FinalCta, PageIntro } from "@/components/marketing/section";

export const metadata: Metadata = { title: "How It Works" };

const STEPS = [
  {
    title: "Create or import a client",
    body: "Add a client with their contact details and birth data — date, time, place and how reliable the time is. Partners and family members can be added as associated people with their own birth data. Existing client lists can be imported.",
    shot: "/screenshots/client-profile.png",
    link: { href: "/app/clients/new", label: "Try adding a client" },
    detail: ["Birth-time accuracy recorded alongside the data", "Natal chart generated automatically", "Portal invitation when you’re ready"],
  },
  {
    title: "Generate and analyse charts",
    body: "Open the chart workspace from the client profile. Review placements, aspects, houses and rulers, switch house systems, adjust orbs, or create synastry, composite and timing charts — all filed under the same client.",
    shot: "/screenshots/chart-workspace.png",
    link: { href: "/app/charts/ch1", label: "Open Amelia Hart’s natal chart" },
    detail: ["Natal, relationship and timing techniques", "Calculated facts kept separate from interpretations", "Saved configurations for repeat work"],
  },
  {
    title: "Save observations and consultation records",
    body: "Write observations directly against the chart. They autosave, keep their revision history and are tagged by planet, aspect and house. Before and after each consultation, prep notes, session notes and follow-up tasks live on the appointment.",
    shot: "/screenshots/observations.png",
    link: { href: "/app/observations", label: "Browse observations" },
    detail: ["Autosave and revision history", "Follow-up tasks created from the session", "Prep notes that surface what you wrote last time"],
  },
  {
    title: "Deliver readings and recordings",
    body: "Upload a finished PDF, audio or video reading — or record one in the Recording Studio while navigating the chart. Add a personal message, decide whether downloads are allowed, preview, and send to the client portal.",
    shot: "/screenshots/delivery.png",
    link: { href: "/app/delivery", label: "Open Reading Delivery" },
    detail: ["Upload, record or share a link", "Client notified automatically", "Opened status tracked"],
  },
  {
    title: "Build on the client’s history over time",
    body: "When a client returns, everything is waiting: earlier charts, the observations you made about them, past consultations and every reading delivered. Clients have their own private portal with their materials.",
    shot: "/screenshots/portal.png",
    link: { href: "/portal", label: "See the client portal" },
    detail: ["Complete consultation history", "Searchable knowledge across clients", "A calm, branded client experience"],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="How it works"
        title="A typical astrologer’s workflow, connected end to end."
        body="Follow a client from first enquiry to a delivered reading — and into the next consultation. Every screen below is from the working prototype."
      />
      <div className="container py-16 md:py-24">
        <ol className="relative space-y-20 md:space-y-28">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-full border border-accent-100 bg-accent-50 font-serif text-[22px] text-accent">{i + 1}</span>
                  <span className="eyebrow">Step {i + 1} of {STEPS.length}</span>
                </div>
                <h2 className="mt-5 font-serif text-[30px] leading-tight text-ink md:text-[38px]">{s.title}</h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-muted">{s.body}</p>
                <ul className="mt-6 space-y-2 border-l-2 border-line pl-4">
                  {s.detail.map((d) => (
                    <li key={d} className="text-[14px] text-ink-3">
                      {d}
                    </li>
                  ))}
                </ul>
                <Link href={s.link.href} className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:text-accent-hover">
                  {s.link.label} <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                <ProductShot src={s.shot} alt={`${s.title} — screenshot`} url={s.shot.includes("portal") ? "portal.morrowastrology.com" : undefined} />
              </div>
            </li>
          ))}
        </ol>
      </div>
      <FinalCta title="See the workflow for yourself." body="The prototype is fully navigable with realistic demonstration data. Start with the dashboard or follow a guided workflow." />
    </>
  );
}
