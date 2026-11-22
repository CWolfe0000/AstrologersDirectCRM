import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/section";
import { CHANGELOG } from "@/lib/changelog";

export const metadata: Metadata = { title: "What’s New", description: "What we’ve built for astrologers lately, much of it from their suggestions." };

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function WhatsNewPage() {
  return (
    <>
      <PageIntro eyebrow="What’s New" title="What We’ve Built Lately">
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">AstrologersDirect is in private beta and changing quickly, much of it from astrologers’ suggestions. Use Suggest a Feature in the app to tell us what you need.</p>
      </PageIntro>
      <section className="container max-w-3xl pb-24">
        <ol className="space-y-12">
          {CHANGELOG.map((r) => (
            <li key={r.date} className="border-l-2 border-accent/30 pl-6">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">{fmt(r.date)}</p>
              <h2 className="mt-1 font-serif text-[28px] leading-tight text-ink">{r.title}</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[15.5px] leading-relaxed text-ink-3">
                {r.items.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
