import type { Metadata } from "next";
import Link from "next/link";
import { PersonRow } from "@/components/person-row";
import { InsightCard, Locked, Section } from "@/components/reading";
import { oneIn, plural } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { timingRepeats } from "@/lib/server/moments";
import { exPattern, loadContext } from "@/lib/server/readings";
import { seeded } from "@/lib/server/reference";

export const metadata: Metadata = { title: "Past Partners" };

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
    { title: "When your relationships begin", data: begins, n: dated((e) => e.startDate ?? e.metDate).length, word: "beginnings" },
    { title: "When your relationships end", data: ends, n: dated((e) => e.endDate).length, word: "endings" },
  ];
  const aboveChance = found >= expected * 1.5 && found - expected >= 2;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Past partners</h1>
          <p className="mt-2 max-w-2xl text-ink-2">Add the people you have been with. A birth date is enough. Datebyfate looks for what repeats, and checks it against chance.</p>
        </div>
        <Link href="/app/exes/new" className="btn-dark">Add a past partner</Link>
      </div>

      {!ctx.self && <p className="card mt-8">Add <Link className="link" href="/app">your own birth details</Link> first: partners are read against your chart.</p>}

      {ctx.exes.length > 0 && <ul className="mt-8 grid gap-3 md:grid-cols-2">{ctx.exes.map((p) => <PersonRow key={p.id} person={p} />)}</ul>}

      {ctx.self && ctx.exes.length < 2 && (
        <p className="card mt-8 text-ink-2">
          {ctx.exes.length === 0 ? "Nobody here yet. Add at least two past partners to see what they have in common." : "Add one more past partner. A pattern needs at least two people, and three or more make it much more reliable."}
        </p>
      )}

      {pattern && (
        <>
          <section className="mt-10 rounded-3xl bg-night px-6 py-8 text-cream sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-line">Across {plural(pattern.partners, "partner")}</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{found === 0 ? "No repeats that stand out" : `${plural(found, "repeat")} found`}</h2>
            <p className="mt-3 max-w-2xl text-cream/85">
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
            <Section title="The plain facts" intro="No astrology needed for these.">
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
                      <InsightCard key={r.key} insight={{ title: r.title, body: r.body, basis: `${r.names.join(", ")} · true on ${oneIn(r.baseRate).replace("people", "days")}` }} tag={<span className="rounded-full bg-rose-soft px-3 py-1 text-sm font-semibold text-rose-hover">{r.count} of {r.of}</span>} />
                    ))}
                  </div>
                ) : (
                  <Locked title={`${plural(t.data.repeats.length, "repeat")} in the timing of your ${t.word}`}><p>Subscribe to see what was in force in your chart each time.</p></Locked>
                )}
              </Section>
            ) : null,
          )}
          {timing.every((t) => t.n < 2) && (
            <p className="mt-8 rounded-xl bg-gold-soft px-4 py-3 text-sm text-ink-2">Add the dates each relationship began and ended, on each person’s details, to see what was happening in your chart at those times and whether it repeats.</p>
          )}

          {found > 0 && (
            <Section title="What repeats" intro="Least likely to be coincidence first. The usual rate is how common each one is among people born in the same years.">
              {user.premium ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {pattern.repeats.map((r) => (
                    <InsightCard
                      key={r.key}
                      insight={{ title: r.title, body: r.body, basis: `${r.names.join(", ")} · usual rate ${oneIn(r.baseRate)}` }}
                      tag={<span className={`rounded-full px-3 py-1 text-sm font-semibold ${r.strength === "faint" ? "bg-cream-2 text-ink-2" : "bg-rose-soft text-rose-hover"}`}>{r.count} of {r.of} · {STRENGTH[r.strength]}</span>}
                    />
                  ))}
                </div>
              ) : (
                <Locked title={`${plural(found, "repeat")} across your partners`}>
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
