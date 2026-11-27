import Link from "next/link";
import { ARC_OF_INTIMACY } from "@/lib/reading/natal-love";
import type { Insight, OwnPattern, Placement } from "@/lib/reading/own";
import type { ElementBalance } from "@/lib/reading/elements";
import type { DifficultAspect, Gift, Trigger } from "@/lib/reading/triggers";
import type { Scores } from "@/lib/reading/scores";

export function InsightCard({ insight, tag }: { insight: Insight; tag?: React.ReactNode }) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h3 className="text-[18px] leading-snug">{insight.title}</h3>
        {tag}
      </div>
      <p className="mt-2 text-ink-2">{insight.body}</p>
      {insight.expressions && insight.expressions.length > 0 && (
        <div className="mt-3">
          <p className="eyebrow">How It Shows Up</p>
          <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-ink-2 marker:text-accent">
            {insight.expressions.map((e) => <li key={e}>{e}</li>)}
          </ul>
          {insight.lean && <p className="mt-2.5 text-[13px] text-muted">{insight.lean}</p>}
        </div>
      )}
      <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] font-medium uppercase tracking-wider text-muted">{insight.basis}</p>
    </article>
  );
}

const scoreTone = (n: number) => (n >= 65 ? "bg-sage" : n >= 50 ? "bg-warn" : "bg-accent");

/** The overall score, large, with its band. */
export function ScoreSummary({ scores, name }: { scores: Scores; name: string }) {
  return (
    <div className="card flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[44px] leading-none">{scores.overall}</span>
        <span className="text-muted">/ 100</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="eyebrow">Overall Compatibility With {name}</p>
        <p className="mt-1 text-ink-2">{scores.band}. A weighted average of the areas below, with core harmony counting most. Two charts picked at random score about 57, and eight in ten fall between 49 and 66.</p>
      </div>
    </div>
  );
}

/** One card per area: the score, a bar, and the links it was built from. */
export function ScoreCards({ scores }: { scores: Scores }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {scores.areas.map((a) => (
        <article key={a.id} className="card">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[18px] leading-snug">{a.title}</h3>
            <span className="whitespace-nowrap font-display text-[26px] leading-none">{a.score}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${a.score} out of 100`}>
            <div className={`h-full rounded-full ${scoreTone(a.score)}`} style={{ width: `${a.score}%` }} />
          </div>
          <p className="mt-1.5 text-[12px] font-medium uppercase tracking-wider text-muted">{a.band}</p>
          <p className="mt-2 text-ink-2">{a.about}</p>
          {a.factors.length > 0 ? (
            <details className="mt-3 border-t border-line pt-2.5">
              <summary className="cursor-pointer text-[13px] font-medium text-accent">What this is built from ({a.factors.length})</summary>
              <ul className="mt-2 space-y-1.5 text-[13px] text-ink-2">
                {a.factors.map((f) => (
                  <li key={f.label} className="flex justify-between gap-3">
                    <span>{f.label}</span>
                    <span className="whitespace-nowrap text-muted">{f.value}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p className="mt-3 border-t border-line pt-2.5 text-[13px] text-muted">No close contacts of this kind between your charts.</p>
          )}
        </article>
      ))}
    </div>
  );
}

export function Section({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[22px]">{title}</h2>
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
    <div className="rounded-xl border border-accent-200 bg-accent-50 p-5">
      <p className="eyebrow !text-accent">Subscribers</p>
      <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      <div className="mt-2 text-ink-2">{children}</div>
      <Link href={signedIn ? "/pricing" : "/signup"} className="btn-primary mt-4">{signedIn ? "See plans" : "Create a free account"}</Link>
    </div>
  );
}

export function Placements({ placements }: { placements: Placement[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Placements">
      {placements.map((p) => (
        <li key={p.point} className="chip border border-line bg-white text-ink">
          <span className="mr-1 text-muted">{p.point}</span> {p.sign}
        </li>
      ))}
    </ul>
  );
}

export type PatternPart = "pattern" | "elements" | "dynamics" | "intimacy" | "all";

/** The headline of a pattern: its name, and the one line that goes with it. */
export function PatternHeadline({ pattern, placements }: { pattern: OwnPattern; placements: Placement[] }) {
  return (
    <div className="card">
      <p className="eyebrow">Your Pattern</p>
      <h2 className="mt-1 text-[26px] leading-tight">{pattern.headline.name}</h2>
      <p className="mt-2 text-ink-2">{pattern.headline.line}</p>
      <div className="mt-4"><Placements placements={placements} /></div>
    </div>
  );
}

/** The readings of your own chart, whole or one part at a time (the tabs on the You page). */
export function PatternBody({ pattern, elements, part }: { pattern: OwnPattern; elements: { balance: ElementBalance; insights: Insight[] }; part: PatternPart }) {
  const show = (p: PatternPart) => part === "all" || part === p;
  return (
    <div className="[&>section:first-of-type]:mt-0">
      {show("pattern") && <NoteList notes={pattern.notes} />}
      {show("pattern") && (
        <Section title="How You Are In Love" intro="Your Sun, Moon, rising sign, Venus and Mars. Each comes with the several forms it takes, and the aspects that planet makes in your chart say which way it leans.">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{pattern.core.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
        </Section>
      )}
      {show("pattern") && pattern.stellium && (
        <Section title="Where Your Chart Is Concentrated">
          <InsightCard insight={pattern.stellium} />
        </Section>
      )}
      {show("pattern") && pattern.nodes.length > 0 && (
        <Section title="Your Nodes" intro="The lunar nodes in your chart: what you fall back on in love, and what love asks you to grow into.">
          <div className="grid gap-4 lg:grid-cols-2">{pattern.nodes.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
        </Section>
      )}
      {show("pattern") && pattern.drawnTo.length > 0 && (
        <Section title="Who You Are Drawn To" intro="Your Descendant and the ruler of your 7th house.">
          <div className="grid gap-4 lg:grid-cols-2">{pattern.drawnTo.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
        </Section>
      )}
      {show("elements") && (
        <Section title="Your Elements" intro="Fire, earth, air and water are the kinds of energy you run on. What your chart is full of comes naturally. What it lacks you have to cultivate, and it is often what draws you to other people.">
          <ElementBars balance={elements.balance} />
          <div className="grid gap-4 lg:grid-cols-2">{elements.insights.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
        </Section>
      )}
      {show("dynamics") && (
        <Section title="Your Recurring Dynamics" intro={pattern.dynamics.length ? "The aspects between your Sun, Moon, Venus and Mars and the other planets: what tends to happen once you are in a relationship, closest aspect first." : undefined}>
          {pattern.dynamics.length ? (
            <div className="grid gap-4 lg:grid-cols-2">{pattern.dynamics.map((i) => <InsightCard key={i.basis} insight={i} />)}</div>
          ) : (
            <p className="card text-ink-2">Your chart has no close aspects between the relationship planets, so no single dynamic dominates.</p>
          )}
        </Section>
      )}
      {show("intimacy") &&
        (pattern.arc.length > 0 ? (
          <Section title="Your Arc Of Intimacy" intro={ARC_OF_INTIMACY}>
            {pattern.arc.map((a) => (
              <div key={a.house}>
                <p className="mb-3 text-ink-2">{a.meaning}</p>
                <div className="grid gap-4 lg:grid-cols-2">{a.items.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
              </div>
            ))}
          </Section>
        ) : part === "intimacy" ? (
          <p className="card text-ink-2">You have no planets in your 4th to 8th houses, or your birth time is not known, so there is nothing to read here.</p>
        ) : null)}
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
