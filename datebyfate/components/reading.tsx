import Link from "next/link";
import type { Insight, OwnPattern, Placement } from "@/lib/reading/own";
import type { ElementBalance } from "@/lib/reading/elements";
import type { DifficultAspect, Gift, Trigger } from "@/lib/reading/triggers";

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
export function PatternView({ pattern, placements, elements, children }: { pattern: OwnPattern; placements: Placement[]; elements: { balance: ElementBalance; insights: Insight[] }; children?: React.ReactNode }) {
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
      <Section title="Your elements" intro="Fire, earth, air and water are the kinds of energy you run on. What your chart is full of comes naturally. What it lacks you have to cultivate, and it is often what draws you to other people.">
        <ElementBars balance={elements.balance} />
        <div className="grid gap-4 lg:grid-cols-2">{elements.insights.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
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

function Touches({ label, items }: { label: string; items: Trigger[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <ul className="mt-2 space-y-2">
        {items.map((t) => (
          <li key={t.title}>
            <span className="font-semibold">{t.title}.</span> <span className="text-ink-2">{t.body}</span> <span className="whitespace-nowrap text-sm text-muted">{t.orb.toFixed(1)}° from exact</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AspectCard({ name, body, basis, tag, active, quiet, children }: { name: string; body: string; basis: string; tag: string; active: boolean; quiet: string; children: React.ReactNode }) {
  return (
    <article className={`card ${active ? "" : "!bg-transparent !shadow-none"}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h4 className="font-display text-xl font-semibold">{name}</h4>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${!active ? "bg-cream-2 text-ink-2" : tag.startsWith("Set Off") ? "bg-rose-soft text-rose-hover" : "bg-gold-soft text-gold"}`}>{tag}</span>
      </div>
      <p className="mt-2 text-ink-2">{body}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted">{basis}</p>
      {children}
      {!active && <p className="mt-3 text-sm text-muted">{quiet}</p>}
    </article>
  );
}

/** One person's difficult aspects, with what the other person's chart does to each: sets it off, eases it, or both. */
export function TriggerList({ aspects, quiet }: { aspects: DifficultAspect[]; quiet: string }) {
  return (
    <div className="grid gap-4">
      {aspects.map((a) => {
        const tag = a.triggers.length && a.eased.length ? "Set Off And Eased" : a.triggers.length ? "Set Off" : a.eased.length ? "Eased" : "Left Alone";
        return (
          <AspectCard key={a.key} name={a.name} body={a.body} basis={a.basis} tag={tag} active={tag !== "Left Alone"} quiet={quiet}>
            <Touches label="Set off by" items={a.triggers} />
            <Touches label="Eased by" items={a.eased} />
          </AspectCard>
        );
      })}
    </div>
  );
}

/** One person's supportive aspects, with what in the other person's chart brings each out. */
export function GiftList({ gifts, quiet }: { gifts: Gift[]; quiet: string }) {
  return (
    <div className="grid gap-4">
      {gifts.map((g) => (
        <AspectCard key={g.key} name={g.name} body={g.body} basis={g.basis} tag={g.broughtOut.length ? "Brought Out" : "Not Touched"} active={g.broughtOut.length > 0} quiet={quiet}>
          <Touches label="Brought out by" items={g.broughtOut} />
        </AspectCard>
      ))}
    </div>
  );
}

const ELEMENT_COLOR = { fire: "bg-rose", earth: "bg-gold", air: "bg-ink-2", water: "bg-[#3F6C8A]" } as const;

/** The share of a chart in each element. */
export function ElementBars({ balance }: { balance: ElementBalance }) {
  return (
    <dl className="card grid gap-3">
      {(["fire", "earth", "air", "water"] as const).map((e) => (
        <div key={e} className="grid grid-cols-[4.5rem_1fr] items-center gap-x-3 sm:grid-cols-[4.5rem_1fr_14rem]">
          <dt className="font-semibold capitalize">{e}</dt>
          <dd className="flex items-center gap-3">
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-2"><span className={`block h-full rounded-full ${ELEMENT_COLOR[e]}`} style={{ width: `${Math.round(balance.shares[e] * 100)}%` }} /></span>
            <span className="w-10 text-right text-sm tabular-nums text-muted">{Math.round(balance.shares[e] * 100)}%</span>
          </dd>
          <dd className="col-span-2 text-sm text-muted sm:col-span-1">{balance.points[e].join(", ") || "None"}</dd>
        </div>
      ))}
    </dl>
  );
}
