import type { Metadata } from "next";
import { ProductShot } from "@/components/marketing/product-shot";
import { FinalCta, PageIntro } from "@/components/marketing/section";

export const metadata: Metadata = { title: "How It Works" };

const STEPS = [
  {
    title: "Every Client Has a Place.",
    body: [
      "Start with a client’s birth information, contact details and the people in their life.",
      "Their charts, consultations, observations and readings belong to one record that grows with your work together.",
    ],
    close: "Enter it once. Build on it for years.",
  },
  {
    title: "Work with the Charts You Need.",
    body: [
      "Open a client’s chart and begin. Explore placements, aspects, houses, relationships and timing with your own settings.",
      "Create more charts without losing the connection to the person you’re studying.",
    ],
    close: "The chart workspace is part of the client record, not a separate destination.",
  },
  {
    title: "Turn Observations into Lasting Knowledge.",
    body: [
      "Write down what you notice as you work. Attach it to the chart it describes, tag it by configuration, and come back to it whenever you need it.",
      "Prepare for consultations with what you’ve already learned.",
    ],
    close: "Your experience accumulates, instead of starting over with every appointment.",
  },
  {
    title: "Deliver Work You’re Proud Of.",
    body: [
      "Upload a written report, or record a walkthrough of the chart in the studio.",
      "Send it to the client’s private portal with a personal message and the access you choose. They’re notified by email.",
    ],
    close: "A professional delivery, without a collection of disconnected services.",
  },
  {
    title: "Keep the Conversation Going.",
    body: [
      "Share a journaling prompt, an assignment, a goal or a practice to try before you meet again.",
      "Your client responds in their portal, in their own time. You see what they wrote, and when they’ve finished, on their record.",
    ],
    close: "The relationship doesn’t pause between appointments. Neither does the work.",
  },
  {
    title: "Pick Up Where You Left Off.",
    body: [
      "Six months later, your client returns.",
      "Their charts are there. Their previous readings are there. Everything they wrote between sessions is there, alongside your observations and consultation history.",
    ],
    close: "You spend your time exploring what’s changed, not searching for what happened.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro eyebrow="How it works" title="A Practice Built Around the Whole Client Journey.">
        <div className="mt-5 max-w-2xl space-y-3 text-[17px] leading-relaxed text-muted">
          <p>A client relationship isn’t a series of separate appointments. It’s one continuous story.</p>
          <p>From the first consultation to the tenth, AstrologersDirect keeps that story organized, connected and ready when you need it. Here’s what that looks like.</p>
        </div>
      </PageIntro>
      <div className="container pb-6">
        <ProductShot src="/screenshots/client-profile.png" alt="A client record in AstrologersDirect" url="app.astrologersdirect.com" />
      </div>
      <div className="container py-16 md:py-24">
        <ol className="grid gap-x-16 gap-y-14 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="font-serif text-[22px] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-2 font-serif text-[28px] leading-tight text-ink md:text-[32px]">{s.title}</h2>
              <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-muted">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <p className="mt-4 border-l-2 border-accent-200 pl-4 text-[15px] font-medium text-ink">{s.close}</p>
            </li>
          ))}
        </ol>
      </div>
      <FinalCta title="See the Difference for Yourself." body="Join the beta and bring your own clients, charts and consultations into one place." />
    </>
  );
}
