import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { InsightCard, Locked, Section } from "@/components/reading";
import { oneIn, plural } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { timingRepeats } from "@/lib/server/moments";
import { exPattern, loadContext } from "@/lib/server/readings";
import { seeded } from "@/lib/server/reference";

export const metadata: Metadata = { title: "Patterns" };

const STRENGTH = { strong: "Strong repeat", clear: "Clear repeat", faint: "Faint repeat" } as const;

export default async function Exes() {
  const user = await requireUser();
  const ctx = await loadContext(user.id);
  const pattern = exPattern(user.id, ctx);
  const found = pattern?.repeats.length ?? 0;
  const expected = pattern?.expectedByChance ?? 0;
  // What was in force in your own chart when each relationship began, and when each ended.
  const dated = (pick: (e: (typeof ctx.exes)[number]) => string | null | undefined) => ctx.exes.flatMap((e) => (pick(e) ? [{ name: e.name, date: pick(e)! }] : []));
  const begins = ctx.self ? timingRepeats(ctx.self.chart, dated((e) => e.startDate ?? e.metDate), seeded(user.id + "begin")) : null;
  const ends = ctx.self ? timingRepeats(ctx.self.chart, dated((e) => e.endDate), seeded(user.id + "end")) : null;
  const timing = [
    { title: "When Your Relationships Begin", data: begins, n: dated((e) => e.startDate ?? e.metDate).length, word: "beginnings" },
    { title: "When Your Relationships End", data: ends, n: dated((e) => e.endDate).length, word: "endings" },
  ];
  const aboveChance = found >= expected * 1.5 && found - expected >= 2;

  return (
    <div>
      <PageHeader title="Patterns" subtitle="What repeats across the people you have been with, checked against chance: in their charts, in how their charts met yours, and in your own chart when relationships began and ended.">
        <Link href="/app/people/new?kind=ex" className="btn-primary">Add a past partner</Link>
      </PageHeader>

      {!ctx.self && <p className="card">Add <Link className="link" href="/app">your own birth details</Link> first: partners are read against your chart.</p>}
      {ctx.self && ctx.exes.length < 2 && (
        <p className="card text-ink-2">
          {ctx.exes.length === 0 ? "Add at least two past partners under People to see what they have in common." : "Add one more past partner. A pattern needs at least two people, and three or more make it much more reliable."}
        </p>
      )}

      {pattern && (
        <>
          <section className="card">
            <p className="eyebrow">Across {plural(pattern.partners, "partner")}: {ctx.exes.map((e) => e.name).join(", ")}</p>
            <h2 className="mt-1 text-[26px]">{found === 0 ? "No Repeats That Stand Out" : `${plural(found, "Repeat")} Found`}</h2>
            <p className="mt-2 max-w-3xl text-ink-2">
              We checked {pattern.checked} signatures. A random group of {pattern.partners} people born in the same years would show about {expected.toFixed(1)}.{" "}
              {found === 0
                ? "Your partners have less in common than a random group does, which is a finding in itself: you don’t choose by type."
                : aboveChance
                  ? "Yours shows clearly more than chance, so there is a real pattern here."
                  : "Yours is about what chance gives, so treat the repeats below as hints, not proof."}
              {pattern.partners < 3 && " With two partners coincidences are common. Each person you add makes the picture sharper."}
            </p>
          </section>

          {pattern.facts.length > 0 && (
            <Section title="The Plain Facts" intro="No astrology needed for these.">
              <ul className="card space-y-2 text-ink-2">{pattern.facts.map((f) => <li key={f}>{f}</li>)}</ul>
            </Section>
          )}

          {timing.map((t) =>
            t.n >= 2 && t.data ? (
              <Section key={t.title} title={t.title} intro={`What was in force in your own chart on those dates, across ${t.n} ${t.word}. Random days in your adult life would show about ${t.data.expectedByChance.toFixed(1)} repeats like these.`}>
                {t.data.repeats.length === 0 ? (
                  <p className="card text-ink-2">Nothing in your chart repeats across these dates more than chance would give.</p>
                ) : user.premium ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {t.data.repeats.slice(0, 6).map((r) => (
                      <InsightCard key={r.key} insight={{ title: r.title, body: r.body, basis: `${r.names.join(", ")} · true on ${oneIn(r.baseRate).replace("people", "days")}` }} tag={<span className="chip bg-accent-50 text-accent">{r.count} of {r.of}</span>} />
                    ))}
                  </div>
                ) : (
                  <Locked title={`${plural(t.data.repeats.length, "Repeat")} In The Timing Of Your ${t.word[0]!.toUpperCase()}${t.word.slice(1)}`}><p>Subscribe to see what was in force in your chart each time.</p></Locked>
                )}
              </Section>
            ) : null,
          )}
          {timing.every((t) => t.n < 2) && (
            <p className="mt-8 rounded-lg bg-warn-50 px-4 py-3 text-[13px] text-ink-2">Add the dates each relationship began and ended, on each person’s details, to see what was happening in your chart at those times and whether it repeats.</p>
          )}

          {found > 0 && (
            <Section title="What Repeats" intro="Least likely to be coincidence first. The usual rate is how common each one is among people born in the same years.">
              {user.premium ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {pattern.repeats.map((r) => (
                    <InsightCard
                      key={r.key}
                      insight={{ title: r.title, body: r.body, basis: `${r.names.join(", ")} · usual rate ${oneIn(r.baseRate)}` }}
                      tag={<span className={`chip ${r.strength === "faint" ? "bg-canvas-2 text-ink-2" : "bg-accent-50 text-accent"}`}>{r.count} of {r.of} · {STRENGTH[r.strength]}</span>}
                    />
                  ))}
                </div>
              ) : (
                <Locked title={`${plural(found, "Repeat")} Across Your Partners`}>
                  <p>
                    {plural(pattern.repeats.filter((r) => r.strength !== "faint").length, "is", "are")} strong or clear, and the rest are faint. Subscribe to see what each one is, which partners share it, and how common it is.
                  </p>
                </Locked>
              )}
            </Section>
          )}
        </>
      )}
    </div>
  );
}
