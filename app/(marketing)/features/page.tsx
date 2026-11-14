import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Mic, MonitorPlay, Pause, Video } from "lucide-react";
import { ProductShot } from "@/components/marketing/product-shot";
import { FinalCta, PageIntro } from "@/components/marketing/section";
import { FEATURES } from "@/components/marketing/features-data";

export const metadata: Metadata = { title: "Features" };

const ORDER = ["charts", "clients", "observations", "ai", "consultations", "recording", "delivery", "portal"] as const;

const RECORDING = {
  id: "recording",
  icon: Mic,
  title: "Recording Studio",
  body: "Record audio-only readings, webcam and microphone, or your screen as you walk through the chart — with the client’s chart available to navigate while you record. Review, rename, save to the client record or deliver straight to their portal.",
  points: ["Four recording modes: audio, webcam, screen, screen + webcam", "Navigate the chart while recording", "Review, rename, discard, save or deliver"],
  shot: "/screenshots/studio.png",
  href: "/app/studio",
};

const DETAIL: Record<string, string[]> = {
  charts: ["Seven house systems and tropical or sidereal zodiac", "Planet and point visibility, aspect selection and orbs", "Placements, aspects, houses, rulers and planetary condition tabs"],
  clients: ["Overview, charts, associated people, consultations, observations, readings and files tabs", "Birth-time accuracy recorded with the data", "Status, tags and portal access for each client"],
  observations: ["Three-column knowledge base: filters, directory, editor", "Natal, relationship and timing scopes kept separate", "Navigate from any observation to its chart or client"],
  ai: ["Facts, observations and generated text visibly distinguished", "Grounded in the chart and your saved notes", "Prototype: responses are simulated"],
  consultations: ["Month, week and day calendar views", "Consultation detail panel with every linked item", "Future: self-service booking and external calendars"],
  delivery: ["Draft, ready, delivered and failed queues", "Client access permissions and download control", "Notification and open status"],
  portal: ["Reading library with filters by type", "Consultation history with shared materials", "Mobile-first media playback"],
  recording: ["Microphone and camera selection", "Live microphone level indicator", "Future: transcription, chapters and captions"],
};

export default function FeaturesPage() {
  const all = [...FEATURES, RECORDING];
  const items = ORDER.map((id) => all.find((f) => f.id === id)!);
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="Professional astrology software and practice management, together."
        body="Each part of AstrologersDirect is useful on its own. Together, they keep the full story of every client connected."
      >
        <div className="mt-10 flex flex-wrap gap-2">
          {items.map((f) => (
            <a key={f.id} href={`#${f.id}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] text-ink-3 transition-colors hover:border-line-strong hover:text-ink">
              <f.icon className="size-3.5 text-accent" /> {f.title}
            </a>
          ))}
        </div>
      </PageIntro>

      <div className="container divide-y divide-line">
        {items.map((f, i) => (
          <section key={f.id} id={f.id} className="scroll-mt-20 py-16 md:py-24">
            <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent-50 text-accent">
                  <f.icon className="size-5" />
                </span>
                <h2 className="mt-5 font-serif text-[32px] leading-tight text-ink md:text-[40px]">{f.title}</h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-muted">{f.body}</p>
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-3">What it does</p>
                    <ul className="space-y-2.5">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-ink-3">
                          <Check className="mt-0.5 size-4 shrink-0 text-sage-dark" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="eyebrow mb-3">In practice</p>
                    <ul className="space-y-2.5">
                      {(DETAIL[f.id] ?? []).map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-ink-3">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Link href={f.href} className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:text-accent-hover">
                  Open {f.title} in the prototype <ArrowRight className="size-4" />
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
                {f.id === "recording" && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      [Mic, "Audio only"],
                      [Video, "Webcam + mic"],
                      [MonitorPlay, "Screen + mic"],
                      [Pause, "Screen, webcam + mic"],
                    ].map(([I, l]) => {
                      const Icon = I as typeof Mic;
                      return (
                        <div key={l as string} className="rounded-lg border border-line bg-surface p-3 text-[12.5px] text-ink-3">
                          <Icon className="mb-2 size-4 text-accent" /> {l as string}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      <FinalCta />
    </>
  );
}
