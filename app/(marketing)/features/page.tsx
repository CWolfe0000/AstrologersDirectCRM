import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Mic, MonitorPlay, Pause, Video } from "lucide-react";
import { ProductShot } from "@/components/marketing/product-shot";
import { FinalCta, PageIntro } from "@/components/marketing/section";
import { FEATURES } from "@/components/marketing/features-data";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <>
      <PageIntro eyebrow="Features" title="Every Tool Serves One Purpose: The Relationship with Your Client.">
        <div className="mt-5 max-w-2xl space-y-3 text-[17px] leading-relaxed text-muted">
          <p>Your work is more than the sum of its charts, appointments and files.</p>
          <p>It’s a relationship that unfolds over months and years. Every part of AstrologersDirect is designed to support it: before the session, during it, and in everything that happens between.</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <a key={f.id} href={`#${f.id}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] text-ink-3 transition-colors hover:border-line-strong hover:text-ink">
              <f.icon className="size-3.5 text-accent" /> {f.title}
            </a>
          ))}
        </div>
      </PageIntro>

      <div className="container divide-y divide-line">
        {FEATURES.map((f, i) => (
          <section key={f.id} id={f.id} className="scroll-mt-20 py-16 md:py-24">
            <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <p className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent-50 text-accent">
                    <f.icon className="size-[18px]" />
                  </span>
                  <span className="eyebrow">{f.title}</span>
                  {f.status && <span className="rounded-full border border-line px-2 py-px text-[11px] text-muted">{f.status}</span>}
                </p>
                <h2 className="mt-5 font-serif text-[32px] leading-tight text-ink md:text-[40px]">{f.headline}</h2>
                <div className="mt-4 space-y-3 text-[15.5px] leading-relaxed text-muted">
                  {f.story.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {f.close && <p className="font-medium text-ink">{f.close}</p>}
                </div>
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <ul className="space-y-2.5">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-ink-3">
                        <Check className="mt-0.5 size-4 shrink-0 text-sage-dark" /> {p}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-2.5">
                    {f.detail.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-ink-3">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={f.href} className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:text-accent-hover">
                  {f.cta} <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                {f.id === "portal" ? (
                  <div className="flex items-end justify-center gap-6">
                    <ProductShot src={f.shot} alt={`${f.title} screenshot`} className="hidden flex-1 sm:block" url="app.astrologersdirect.com/portal" />
                    <ProductShot src="/screenshots/portal-mobile.png" alt="Client portal on mobile" device="phone" className="w-[46%] max-w-[220px] sm:-ml-20 sm:w-[34%]" />
                  </div>
                ) : (
                  <ProductShot src={f.shot} alt={`${f.title} screenshot`} />
                )}
                {f.id === "recording" && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(
                      [
                        [Mic, "Audio only"],
                        [Video, "Webcam + mic"],
                        [MonitorPlay, "Screen + mic"],
                        [Pause, "Screen, webcam + mic"],
                      ] as const
                    ).map(([Icon, l]) => (
                      <div key={l} className="rounded-lg border border-line bg-surface p-3 text-[12.5px] text-ink-3">
                        <Icon className="mb-2 size-4 text-accent" /> {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      <FinalCta title="Your Practice Works Better When Everything Works Together." body="Each feature solves a problem. Together, they change how your practice works." />
    </>
  );
}
