import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { removePerson } from "@/app/actions";
import { InsightCard, Locked, NoteList, Placements, Section, GiftList, TriggerList } from "@/components/reading";
import { formatDate, oneIn, plural } from "@/lib/format";
import { composite as readComposite } from "@/lib/reading/composite";
import { coupleReport } from "@/lib/reading/couple";
import { attunement } from "@/lib/reading/elements";
import { checkAgainst } from "@/lib/reading/exes";
import { placementsOf } from "@/lib/reading/own";
import { stelliumBetween } from "@/lib/reading/stellium";
import { difficultAspects, gifts } from "@/lib/reading/triggers";
import { requireUser } from "@/lib/server/auth";
import { compositeHouses, exPattern, loadContext } from "@/lib/server/readings";
import { TransitCard } from "@/components/transit-card";
import { transitWindows } from "@/lib/server/timing";

export const metadata: Metadata = { title: "Together" };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const ctx = await loadContext(user.id);
  const person = [...ctx.exes, ...ctx.matches].find((p) => p.id === id);
  if (!person) notFound();
  const isEx = person.kind === "ex";
  const back = isEx ? { href: "/app/exes", label: "Past partners" } : { href: "/app/people", label: "Someone new" };

  const header = (
    <>
      <Link href={back.href} className="link text-sm">← {back.label}</Link>
      <div className="mt-3 rounded-3xl bg-night px-6 py-8 text-cream sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-line">{isEx ? "Past partner" : "You and"}</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{person.name}</h1>
        <p className="mt-2 text-cream/70">Born {formatDate(person.birth.date)}{person.birth.time ? ` at ${person.birth.time}` : ", time unknown"}, {person.birth.place}</p>
        <div className="mt-5"><Placements placements={placementsOf(person.chart)} /></div>
      </div>
    </>
  );
  const footer = (
    <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6">
      <Link href={`/app/people/${person.id}/edit`} className="btn-ghost">Edit details</Link>
      <form action={removePerson}>
        <input type="hidden" name="id" value={person.id} />
        <input type="hidden" name="back" value={isEx ? "exes" : "people"} />
        <button type="submit" className="btn text-rose-hover hover:bg-rose-soft">Delete {person.name}</button>
      </form>
    </div>
  );

  if (!ctx.self)
    return (
      <div>
        {header}
        <p className="card mt-8">Add <Link className="link" href="/app">your own birth details</Link> to read the two of you together.</p>
        {footer}
      </div>
    );

  const report = coupleReport(ctx.self.chart, person.chart, person.name);
  const comp = readComposite(ctx.self.chart, person.chart, compositeHouses(ctx.self, person));
  const pattern = isEx ? null : exPattern(user.id, ctx);
  const check = pattern?.repeats.length ? checkAgainst(ctx.self.chart, pattern.repeats, { chart: person.chart, hasTime: !!person.birth.time }) : null;
  // Each person alone, then what the other sets off.
  const yours = difficultAspects(ctx.self.chart, person.chart, null, person.name);
  const theirs = difficultAspects(person.chart, ctx.self.chart, person.name, null);
  const elements = attunement(ctx.self.chart, person.chart, person.name);
  const allLevels = [...elements.lights, ...elements.levels];
  const inTune = allLevels.filter((l) => l.relation !== "discordant").length;
  const relationTag = (l: (typeof allLevels)[number]) => (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${l.relation === "discordant" ? "bg-rose-soft text-rose-hover" : "bg-gold-soft text-gold"}`}>{l.relation === "same" ? "Same Element" : l.relation === "compatible" ? "Feed Each Other" : "Cross Purposes"}</span>
  );
  const stelliums = [stelliumBetween(person.chart, ctx.self.chart, person.name, null), stelliumBetween(ctx.self.chart, person.chart, null, person.name)].filter((x) => x !== null);
  const yourGifts = gifts(ctx.self.chart, person.chart, null, person.name);
  const theirGifts = gifts(person.chart, ctx.self.chart, person.name, null);
  const setOff = (xs: typeof yours) => xs.filter((a) => a.triggers.length).length;
  const eased = (xs: typeof yours) => xs.filter((a) => a.eased.length).length;
  const broughtOut = (xs: typeof yourGifts) => xs.filter((g) => g.broughtOut.length).length;
  const judged = check ? check.carried.length + check.absent.length : 0;

  return (
    <div>
      {header}
      <NoteList notes={report.notes} />

      {!isEx && (
        <Section title="Against your pattern" intro="The repeats found across your past partners, and whether this person carries them.">
          {!check ? (
            <p className="card text-ink-2">
              {ctx.exes.length < 2 ? <>There is no pattern to check against yet. <Link className="link" href="/app/exes">Add at least two past partners</Link> first.</> : "Your past partners show no repeats that stand out, so there is nothing to check this person against."}
            </p>
          ) : (
            <>
              <div className="card">
                <p className="heading font-display text-2xl font-semibold">{person.name} repeats {check.carried.length} of the {plural(judged, "repeat")} in your pattern.</p>
                <p className="mt-2 text-ink-2">
                  {check.carried.length === 0 ? "On the chart, this person is a break from your past." : check.carried.length * 2 >= judged ? "On the chart, this is familiar ground for you." : "Some familiar ground, and some that is new."}
                  {check.unknown.length > 0 && ` ${plural(check.unknown.length, "repeat")} can’t be judged without their birth time.`}
                </p>
              </div>
              {user.premium ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {check.carried.map((r) => (
                    <InsightCard key={r.key} insight={{ title: r.title, body: r.body, basis: `Also true of ${r.names.join(", ")} · usual rate ${oneIn(r.baseRate)}` }} tag={<span className="rounded-full bg-rose-soft px-3 py-1 text-sm font-semibold text-rose-hover">Repeats</span>} />
                  ))}
                  {check.absent.map((r) => (
                    <InsightCard key={r.key} insight={{ title: r.title, body: `Not here. ${r.count} of your ${r.of} past partners had this; ${person.name} doesn’t.`, basis: `True of ${r.names.join(", ")}` }} tag={<span className="rounded-full bg-cream-2 px-3 py-1 text-sm font-semibold text-ink-2">Breaks the pattern</span>} />
                  ))}
                </div>
              ) : judged > 0 ? (
                <Locked title="See which ones"><p>Subscribe to see which repeats {person.name} carries, which they break, and what each one means.</p></Locked>
              ) : null}
            </>
          )}
        </Section>
      )}

      {user.premium ? (
        <>
          <Section
            title="Your elements together"
            intro="Whether the two of you run on the same kind of energy. Where your elements are in tune you feed each other; where they are not, it takes energy. None of this decides the outcome: awareness and what you both want change a great deal."
          >
            <div className="card grid gap-4 sm:grid-cols-2">
              <p><span className="font-semibold">You.</span> <span className="text-ink-2">{elements.yours}</span></p>
              <p><span className="font-semibold">{person.name}.</span> <span className="text-ink-2">{elements.theirs}</span></p>
              {elements.supplies.map((t) => <p key={t} className="text-ink-2 sm:col-span-2">{t}</p>)}
            </div>
            <h3 className="mt-4 text-xl font-semibold">The core: Sun and Moon</h3>
            <p className="-mt-2 text-ink-2">{elements.lightsVerdict}</p>
            <div className="grid gap-4 lg:grid-cols-2">{elements.lights.map((l) => <InsightCard key={l.title} insight={l} tag={relationTag(l)} />)}</div>
            <h3 className="mt-4 text-xl font-semibold">Attraction</h3>
            <p className="card text-ink-2">{elements.attraction}</p>
            <h3 className="mt-4 text-xl font-semibold">Planet by planet</h3>
            <p className="-mt-2 text-ink-2">The Sun, Moon and rising sign cannot be retuned. Mercury, Venus and Mars can be adjusted to the other person, at some cost in energy.</p>
            <div className="grid gap-4 lg:grid-cols-2">{elements.levels.map((l) => <InsightCard key={l.title} insight={l} tag={relationTag(l)} />)}</div>
          </Section>
          <Section title="How your charts meet" intro="The contacts between your two charts, strongest first. No contact is good or bad in itself: the easy ones can make a couple complacent, and the hard ones supply much of the passion and the growth.">
            <p className="card text-ink-2">{report.bedrock}</p>
            {report.fusions.length > 0 && (
              <>
                <h3 className="mt-4 text-xl font-semibold">Where you fuse</h3>
                <p className="-mt-2 text-ink-2">Conjunctions: the strongest contacts, where one person’s planet sits on the other’s.</p>
                <div className="grid gap-4 lg:grid-cols-2">{report.fusions.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
              </>
            )}
            <h3 className="mt-4 text-xl font-semibold">What flows</h3>
            {report.flowing.length ? <div className="grid gap-4 lg:grid-cols-2">{report.flowing.map((i) => <InsightCard key={i.title} insight={i} />)}</div> : <p className="card text-ink-2">No close sextiles or trines between the two charts. Ease is something you would build.</p>}
            <h3 className="mt-4 text-xl font-semibold">What challenges</h3>
            {report.challenging.length ? <div className="grid gap-4 lg:grid-cols-2">{report.challenging.map((i) => <InsightCard key={i.title} insight={i} />)}</div> : <p className="card text-ink-2">No close squares or oppositions between the two charts. That is comfortable, and it can leave a couple short of spark.</p>}
          </Section>
          <Section
            title="What you set off in each other"
            intro="Each of you has difficult aspects in your own chart, whoever you are with. The other person’s planets can press on them (conjunction, square, opposition) or ease them (trine, sextile)."
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xl font-semibold">In you</h3>
                {yours.length ? (
                  <TriggerList aspects={yours} quiet={`Nothing in ${person.name}’s chart touches this. It stays quiet between you.`} />
                ) : (
                  <p className="card text-ink-2">Your chart has no difficult aspects between the relationship planets, so there is nothing here for {person.name} to set off.</p>
                )}
              </div>
              <div>
                <h3 className="mb-3 text-xl font-semibold">In {person.name}</h3>
                {theirs.length ? (
                  <TriggerList aspects={theirs} quiet="Nothing in your chart touches this. It stays quiet between you." />
                ) : (
                  <p className="card text-ink-2">{person.name}’s chart has no difficult aspects between the relationship planets{person.birth.time ? "" : " that can be read without a birth time"}.</p>
                )}
              </div>
            </div>
          </Section>
          <Section
            title="What you bring out in each other"
            intro="Each of you also has supportive aspects in your own chart. These are the strengths the other person’s planets land on or support."
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xl font-semibold">In you</h3>
                {yourGifts.length ? <GiftList gifts={yourGifts} quiet={`Nothing in ${person.name}’s chart touches this. It is yours either way.`} /> : <p className="card text-ink-2">Your chart has no supportive aspects between the relationship planets.</p>}
              </div>
              <div>
                <h3 className="mb-3 text-xl font-semibold">In {person.name}</h3>
                {theirGifts.length ? <GiftList gifts={theirGifts} quiet="Nothing in your chart touches this. It is theirs either way." /> : <p className="card text-ink-2">{person.name}’s chart has no supportive aspects between the relationship planets{person.birth.time ? "" : " that can be read without a birth time"}.</p>}
              </div>
            </div>
          </Section>
          {stelliums.length > 0 && (
            <Section title="Stelliums" intro="Three or more personal planets in one sign. In a relationship a stellium lands in one part of the other person’s life, and it helps when they have a planet in the same sign. This is a tendency, not a rule.">
              <div className="grid gap-4 lg:grid-cols-2">{stelliums.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
            </Section>
          )}
          {report.overlays.length > 0 && (
            <Section title="Where you land in each other’s lives" intro="The house of one person’s chart that the other’s Sun, Moon, rising sign, Venus and Mars fall in. The more that land in one house, the more that part of life wakes up when you are together.">
              <div className="grid gap-4 lg:grid-cols-2">
                {report.overlays.map((o) => <InsightCard key={o.title} insight={o} tag={o.emphasis ? <span className="rounded-full bg-rose-soft px-3 py-1 text-sm font-semibold text-rose-hover">Emphasis</span> : undefined} />)}
              </div>
            </Section>
          )}
          <Section title="The relationship itself" intro="The composite chart is made of the midpoints between your planets. It describes the two of you as one thing: what the relationship is for, and how you handle it.">
            {comp.notes.map((n) => <p key={n} className="rounded-xl bg-gold-soft px-4 py-3 text-sm text-ink-2">{n}</p>)}
            {comp.core.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{comp.core.map((i) => <InsightCard key={i.title} insight={i} />)}</div>}
            {comp.easy.length > 0 && (
              <>
                <h3 className="mt-4 text-xl font-semibold">What holds it together</h3>
                <div className="grid gap-4 lg:grid-cols-2">{comp.easy.map((i) => <InsightCard key={i.basis} insight={i} />)}</div>
              </>
            )}
            {comp.hard.length > 0 && (
              <>
                <h3 className="mt-4 text-xl font-semibold">What tests it</h3>
                <div className="grid gap-4 lg:grid-cols-2">{comp.hard.map((i) => <InsightCard key={i.basis} insight={i} />)}</div>
              </>
            )}
            <h3 className="mt-4 text-xl font-semibold">By sign</h3>
            <div className="grid gap-4 lg:grid-cols-2">{comp.signs.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
          </Section>
          {!isEx && <RelationshipTiming points={comp.points} />}
        </>
      ) : (
        <Section title="The two of you together">
          <Locked title={`${plural(report.fusions.length + report.flowing.length, "flowing contact")} and ${plural(report.challenging.length, "challenging contact")} between your charts`}>
            <p>
              {person.name} sets off {setOff(yours)} and eases {eased(yours)} of the {plural(yours.length, "difficult aspect")} in your chart, and brings out {broughtOut(yourGifts)} of your {plural(yourGifts.length, "strength")}. You set off {setOff(theirs)}, ease {eased(theirs)} and bring out {broughtOut(theirGifts)} in theirs. Your elements are in tune on {inTune} of {plural(allLevels.length, "link")}. Subscribe to see which ones and how, along with each contact, where you land in each other’s lives, the relationship’s own chart and its timing for the next 12 months.
            </p>
          </Locked>
        </Section>
      )}
      {footer}
    </div>
  );
}

function RelationshipTiming({ points }: { points: { sun: number; moon: number | null; venus: number; asc: number | null; mc: number | null } }) {
  const targets = [{ id: "c-sun", lon: points.sun }, { id: "c-venus", lon: points.venus }];
  if (points.moon !== null) targets.push({ id: "c-moon", lon: points.moon });
  // Transits over the angles of the composite are the strongest timing signal.
  if (points.asc !== null) targets.push({ id: "c-asc", lon: points.asc });
  if (points.mc !== null) targets.push({ id: "c-mc", lon: points.mc });
  const windows = transitWindows(targets);
  return (
    <Section title="The next 12 months for the two of you" intro="Periods when a slow planet is on the relationship’s chart. The ones on its angles tend to mark events.">
      {windows.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {windows.map((w) => <TransitCard key={w.basis + w.start} w={w} />)}
        </div>
      ) : (
        <p className="card text-ink-2">No slow planet reaches the relationship’s chart in the next 12 months.</p>
      )}
    </Section>
  );
}
