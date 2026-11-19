import Link from "next/link";
import type { Insight, OwnPattern, Placement } from "@/lib/reading/own";

export function InsightCard({ insight, tag }: { insight: Insight; tag?: React.ReactNode }) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h3 className="text-xl font-semibold">{insight.title}</h3>
        {tag}
      </div>
      <p className="mt-2 text-ink-2">{insight.body}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted">{insight.basis}</p>
    </article>
  );
}

export function Section({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold sm:text-[28px]">{title}</h2>
      {intro && <p className="mt-1.5 max-w-2xl text-muted">{intro}</p>}
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

export function NoteList({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <ul className="mt-6 space-y-2">
      {notes.map((n) => <li key={n} className="rounded-xl bg-gold-soft px-4 py-3 text-sm text-ink-2">{n}</li>)}
    </ul>
  );
}

/** What a locked section says: what is behind it, in real numbers, and the way in. */
export function Locked({ title, children, signedIn = true }: { title: string; children: React.ReactNode; signedIn?: boolean }) {
  return (
    <div className="rounded-2xl border border-rose-line bg-rose-soft p-6">
      <p className="eyebrow">Subscribers</p>
      <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      <div className="mt-2 text-ink-2">{children}</div>
      <Link href={signedIn ? "/pricing" : "/signup"} className="btn-primary mt-4">{signedIn ? "See plans" : "Create a free account"}</Link>
    </div>
  );
}

export function Placements({ placements }: { placements: Placement[] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Your placements">
      {placements.map((p) => (
        <li key={p.point} className="rounded-full border border-cream/25 px-3 py-1 text-sm text-cream/90">
          <span className="text-cream/60">{p.point}</span> {p.sign}
        </li>
      ))}
    </ul>
  );
}

/** Your own pattern: the free reading and the top of the member's home page. */
export function PatternView({ pattern, placements, children }: { pattern: OwnPattern; placements: Placement[]; children?: React.ReactNode }) {
  return (
    <div>
      <div className="rounded-3xl bg-night px-6 py-9 text-cream sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-line">Your pattern</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{pattern.headline.name}</h1>
        <p className="mt-3 max-w-2xl text-lg text-cream/85">{pattern.headline.line}</p>
        <div className="mt-6"><Placements placements={placements} /></div>
      </div>
      <NoteList notes={pattern.notes} />
      <Section title="How you are in love" intro="Venus, the Moon and Mars: affection, safety and desire.">
        <div className="grid gap-4 lg:grid-cols-3">{pattern.core.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
      </Section>
      {pattern.drawnTo.length > 0 && (
        <Section title="Who you are drawn to" intro="Your 7th house: the partner your chart describes, and where partnership takes you.">
          <div className="grid gap-4 lg:grid-cols-2">{pattern.drawnTo.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
        </Section>
      )}
      <Section
        title="Your recurring dynamics"
        intro={pattern.dynamics.length ? "What tends to happen once you are in a relationship, closest aspect first." : undefined}
      >
        {pattern.dynamics.length ? (
          <div className="grid gap-4 lg:grid-cols-2">{pattern.dynamics.map((i) => <InsightCard key={i.basis} insight={i} />)}</div>
        ) : (
          <p className="card text-ink-2">Your chart has no close aspects between the relationship planets, so no single dynamic dominates. Your pattern is described best by the placements above.</p>
        )}
      </Section>
      {children}
    </div>
  );
}
