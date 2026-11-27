import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { removePerson } from "@/app/actions";
import { PageHeader } from "@/components/app-shell";
import { AspectGrid, AspectTable, PlacementsTable } from "@/components/chart/tables";
import { ChartWheel } from "@/components/chart/wheel";
import { GiftList, InsightCard, Locked, NoteList, ScoreCards, ScoreSummary, Section, TriggerList } from "@/components/reading";
import { Tabs } from "@/components/tabs";
import { TransitGroups } from "@/components/transit-card";
import { formatDate, oneIn, plural } from "@/lib/format";
import { STATUS_LABEL, statusOf } from "@/lib/people";
import { composite as readComposite } from "@/lib/reading/composite";
import { coupleReport } from "@/lib/reading/couple";
import { attunement } from "@/lib/reading/elements";
import { checkAgainst } from "@/lib/reading/exes";
import { scoresBetween } from "@/lib/reading/scores";
import { stelliumBetween } from "@/lib/reading/stellium";
import { difficultAspects, gifts } from "@/lib/reading/triggers";
import { requireUser } from "@/lib/server/auth";
import { momentReading } from "@/lib/server/moments";
import { compositeHouses, exPattern, loadContext } from "@/lib/server/readings";
import { transitWindows } from "@/lib/server/timing";

export const metadata: Metadata = { title: "Person" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "between", label: "Between you" },
  { id: "triggers", label: "Triggers and support" },
  { id: "relationship", label: "The relationship" },
  { id: "time", label: "At the time" },
];

export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab: raw }, user] = await Promise.all([params, searchParams, requireUser()]);
  const ctx = await loadContext(user.id);
  const person = [...ctx.exes, ...ctx.matches].find((p) => p.id === id);
  if (!person) notFound();
  const isEx = person.kind === "ex";
  const tab = TABS.some((t) => t.id === raw) ? raw! : "overview";
  const base = `/app/people/${person.id}`;

  const facts = [
    person.metDate && `Met ${formatDate(person.metDate)}`,
    person.startDate && `Began ${formatDate(person.startDate)}`,
    person.endDate && `Ended ${formatDate(person.endDate)}`,
    person.ending && `Ended by ${person.ending === "me" ? "you" : person.ending === "them" ? "them" : "both of you"}`,
    person.livedTogether && "Lived together",
    person.married && "Married",
    person.children && "Children together",
    person.stayedFriends === true ? "Stayed friends" : person.stayedFriends === false ? "Not in touch as friends" : null,
    person.met && `First met in ${person.met.place}`,
  ].filter((x): x is string => !!x);

  const header = (
    <>
      <Link href="/app/people" className="link text-[13px]">← People</Link>
      <div className="mt-3">
        <PageHeader
          title={person.name}
          subtitle={`${STATUS_LABEL[statusOf(person)]} · Born ${formatDate(person.birth.date)}${person.birth.time ? ` at ${person.birth.time}` : ", time unknown"}, ${person.birth.place}`}
        >
          <Link href={`${base}/edit`} className="btn-ghost">Edit details</Link>
          <form action={removePerson}>
            <input type="hidden" name="id" value={person.id} />
            <button type="submit" className="btn border border-danger/30 bg-white text-danger hover:bg-danger-50">Delete</button>
          </form>
        </PageHeader>
      </div>
    </>
  );

  if (!ctx.self)
    return (
      <div>
        {header}
        <p className="card">Add <Link className="link" href="/app">your own birth details</Link> to read the two of you together.</p>
      </div>
    );
  const self = ctx.self;

  const locked = (title: string, body: React.ReactNode) => <Locked title={title}><p>{body}</p></Locked>;

  /* ---------- Overview: their chart, the record, and how they sit against your pattern ---------- */
  const overview = () => {
    const pattern = isEx ? null : exPattern(user.id, ctx);
    const check = pattern?.repeats.length ? checkAgainst(self.chart, pattern.repeats, { chart: person.chart, hasTime: !!person.birth.time }) : null;
    const judged = check ? check.carried.length + check.absent.length : 0;
    return (
      <>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,520px)_1fr]">
          <div className="card self-start"><ChartWheel chart={person.chart} label={`${person.name}’s birth chart`} /></div>
          <div className="space-y-5">
            <div className="card">
              <h3 className="mb-3 text-[18px]">The Relationship</h3>
              {facts.length ? <ul className="flex flex-wrap gap-1.5">{facts.map((f) => <li key={f} className="chip border border-line bg-white">{f}</li>)}</ul> : <p className="text-muted">No dates or details yet. <Link className="link" href={`${base}/edit`}>Add them</Link> to see what was happening in your chart at the time.</p>}
            </div>
            <div className="card">
              <h3 className="mb-3 text-[18px]">Placements</h3>
              <PlacementsTable chart={person.chart} />
            </div>
          </div>
        </div>
        {!isEx && (
          <Section title="Against Your Pattern" intro="The repeats found across your past partners, and whether this person carries them.">
            {!check ? (
              <p className="card text-ink-2">{ctx.exes.length < 2 ? <>There is no pattern to check against yet. <Link className="link" href="/app/people/new?kind=ex">Add at least two past partners</Link> first.</> : "Your past partners show no repeats that stand out, so there is nothing to check this person against."}</p>
            ) : (
              <>
                <div className="card">
                  <p className="heading font-display text-[20px]">{person.name} repeats {check.carried.length} of the {plural(judged, "repeat")} in your pattern.</p>
                  <p className="mt-2 text-ink-2">
                    {check.carried.length === 0 ? "On the chart, this person is a break from your past." : check.carried.length * 2 >= judged ? "On the chart, this is familiar ground for you." : "Some familiar ground, and some that is new."}
                    {check.unknown.length > 0 && ` ${plural(check.unknown.length, "repeat")} can’t be judged without their birth time.`}
                  </p>
                </div>
                {user.premium ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {check.carried.map((r) => <InsightCard key={r.key} insight={{ title: r.title, body: r.body, basis: `Also true of ${r.names.join(", ")} · usual rate ${oneIn(r.baseRate)}` }} tag={<span className="chip bg-accent-50 text-accent">Repeats</span>} />)}
                    {check.absent.map((r) => <InsightCard key={r.key} insight={{ title: r.title, body: `Not here. ${r.count} of your ${r.of} past partners had this; ${person.name} doesn’t.`, basis: `True of ${r.names.join(", ")}` }} tag={<span className="chip bg-canvas-2 text-ink-2">Breaks The Pattern</span>} />)}
                  </div>
                ) : judged > 0 ? (
                  locked("See Which Ones", `Subscribe to see which repeats ${person.name} carries, which they break, and what each one means.`)
                ) : null}
              </>
            )}
          </Section>
        )}
      </>
    );
  };

  /* ---------- Between you: the bi-wheel and every contact between the two charts ---------- */
  const between = () => {
    const report = coupleReport(self.chart, person.chart, person.name);
    const scores = scoresBetween(self.chart, person.chart, person.name);
    const elements = attunement(self.chart, person.chart, person.name);
    const stelliums = [stelliumBetween(person.chart, self.chart, person.name, null), stelliumBetween(self.chart, person.chart, null, person.name)].filter((x) => x !== null);
    const relationTag = (l: (typeof elements.levels)[number]) => <span className={`chip ${l.relation === "discordant" ? "bg-accent-50 text-accent" : "bg-sage-50 text-sage-dark"}`}>{l.relation === "same" ? "Same Element" : l.relation === "compatible" ? "Feed Each Other" : "Cross Purposes"}</span>;
    if (!user.premium)
      return (
        <>
          <ScoreSummary scores={scores} name={person.name} />
          <div className="card mx-auto mt-5 max-w-[560px]"><ChartWheel chart={self.chart} outer={person.chart} label="Your birth chart" outerLabel={`${person.name}’s planets`} /></div>
          <div className="mt-6">{locked(`${plural(report.fusions.length + report.flowing.length, "Flowing Contact")} And ${plural(report.challenging.length, "Challenging Contact")} Between Your Charts`, "Subscribe to see your scores for love language, emotional, intellectual and physical compatibility and staying power, and to read each contact, your elements together, where you land in each other’s lives, and the full aspect grid.")}</div>
        </>
      );
    return (
      <>
        <NoteList notes={[...report.notes, ...scores.notes]} />
        <ScoreSummary scores={scores} name={person.name} />
        <div className="mt-5"><ScoreCards scores={scores} /></div>
        <p className="mt-3 max-w-3xl text-[12.5px] text-muted">The scores compare your charts planet by planet through the elements, after Stephen Arroyo, and add the aspects your planets actually make to each other. Arroyo describes levels of harmony and gives no numbers: the numbers and weights are Datebyfate’s own. A low score names where the work is. It is not a verdict.</p>
        <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,560px)_1fr]">
          <div className="card self-start">
            <ChartWheel chart={self.chart} outer={person.chart} label="Your birth chart" outerLabel={`${person.name}’s planets`} />
            <p className="mt-2 text-center text-[12.5px] text-muted">Your chart inside, {person.name}’s planets outside. Lines are aspects between the two.</p>
          </div>
          <div className="card min-w-0">
            <h3 className="mb-3 text-[18px]">Aspect Grid</h3>
            <AspectGrid inner={self.chart} outer={person.chart} innerLabel="You" outerLabel={person.name} />
            <p className="mt-3 text-[12.5px] text-muted">Orbs of 7°, and 5° for the sextile.</p>
          </div>
        </div>
        <Section title="How Your Charts Meet" intro="The contacts between your two charts, strongest first. No contact is good or bad in itself: the easy ones can make a couple complacent, and the hard ones supply much of the passion and the growth.">
          <p className="card text-ink-2">{report.bedrock}</p>
          {report.fusions.length > 0 && (
            <div>
              <h3 className="mb-3 mt-2 text-[18px]">Where You Fuse</h3>
              <div className="grid gap-4 lg:grid-cols-2">{report.fusions.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
            </div>
          )}
          <div>
            <h3 className="mb-3 mt-2 text-[18px]">What Flows</h3>
            {report.flowing.length ? <div className="grid gap-4 lg:grid-cols-2">{report.flowing.map((i) => <InsightCard key={i.title} insight={i} />)}</div> : <p className="card text-ink-2">No close sextiles or trines between the two charts. Ease is something you would build.</p>}
          </div>
          <div>
            <h3 className="mb-3 mt-2 text-[18px]">What Challenges</h3>
            {report.challenging.length ? <div className="grid gap-4 lg:grid-cols-2">{report.challenging.map((i) => <InsightCard key={i.title} insight={i} />)}</div> : <p className="card text-ink-2">No close squares or oppositions between the two charts. That is comfortable, and it can leave a couple short of spark.</p>}
          </div>
        </Section>
        <Section title="Your Elements Together" intro="Whether the two of you run on the same kind of energy. Where your elements are in tune you feed each other; where they are not, it takes energy. None of this decides the outcome.">
          <div className="card grid gap-4 sm:grid-cols-2">
            <p><span className="font-semibold">You.</span> <span className="text-ink-2">{elements.yours}</span></p>
            <p><span className="font-semibold">{person.name}.</span> <span className="text-ink-2">{elements.theirs}</span></p>
            {elements.supplies.map((t) => <p key={t} className="text-ink-2 sm:col-span-2">{t}</p>)}
          </div>
          <div>
            <h3 className="mt-2 text-[18px]">The Core: Sun And Moon</h3>
            <p className="mb-3 mt-1 text-ink-2">{elements.lightsVerdict}</p>
            <div className="grid gap-4 lg:grid-cols-2">{elements.lights.map((l) => <InsightCard key={l.title} insight={l} tag={relationTag(l)} />)}</div>
          </div>
          <div>
            <h3 className="mb-3 mt-2 text-[18px]">Attraction</h3>
            <p className="card text-ink-2">{elements.attraction}</p>
          </div>
          <div>
            <h3 className="mb-3 mt-2 text-[18px]">Planet By Planet</h3>
            <div className="grid gap-4 lg:grid-cols-2">{elements.levels.map((l) => <InsightCard key={l.title} insight={l} tag={relationTag(l)} />)}</div>
          </div>
        </Section>
        {stelliums.length > 0 && (
          <Section title="Stelliums" intro="Three or more personal planets in one sign. A stellium lands in one part of the other person’s life, and it helps when they have a planet in the same sign. This is a tendency, not a rule.">
            <div className="grid gap-4 lg:grid-cols-2">{stelliums.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
          </Section>
        )}
        {report.overlays.length > 0 && (
          <Section title="Where You Land In Each Other’s Lives" intro="The house of one person’s chart that the other’s Sun, Moon, rising sign, Venus and Mars fall in.">
            <div className="grid gap-4 lg:grid-cols-2">{report.overlays.map((o) => <InsightCard key={o.title} insight={o} tag={o.emphasis ? <span className="chip bg-accent-50 text-accent">Emphasis</span> : undefined} />)}</div>
          </Section>
        )}
      </>
    );
  };

  /* ---------- Triggers and support: each person's own aspects, and what the other does to them ---------- */
  const triggers = () => {
    const yours = difficultAspects(self.chart, person.chart, null, person.name);
    const theirs = difficultAspects(person.chart, self.chart, person.name, null);
    const yourGifts = gifts(self.chart, person.chart, null, person.name);
    const theirGifts = gifts(person.chart, self.chart, person.name, null);
    const n = (xs: typeof yours, k: "triggers" | "eased") => xs.filter((a) => a[k].length).length;
    if (!user.premium)
      return locked(
        "What You Set Off, Ease And Bring Out In Each Other",
        `${person.name} sets off ${n(yours, "triggers")} and eases ${n(yours, "eased")} of the ${plural(yours.length, "difficult aspect")} in your chart, and brings out ${yourGifts.filter((g) => g.broughtOut.length).length} of your ${plural(yourGifts.length, "strength")}. You set off ${n(theirs, "triggers")} and ease ${n(theirs, "eased")} in theirs. Subscribe to see which ones and how.`,
      );
    const column = (title: string, child: React.ReactNode) => (
      <div>
        <h3 className="mb-3 text-[18px]">{title}</h3>
        {child}
      </div>
    );
    return (
      <>
        <Section title="What You Set Off In Each Other" intro="Each of you has difficult aspects in your own chart, whoever you are with. The other person’s planets can press on them (conjunction, square, opposition) or ease them (trine, sextile).">
          <div className="grid gap-8 lg:grid-cols-2">
            {column("In you", yours.length ? <TriggerList aspects={yours} quiet={`Nothing in ${person.name}’s chart touches this. It stays quiet between you.`} /> : <p className="card text-ink-2">Your chart has no difficult aspects between the relationship planets.</p>)}
            {column(`In ${person.name}`, theirs.length ? <TriggerList aspects={theirs} quiet="Nothing in your chart touches this. It stays quiet between you." /> : <p className="card text-ink-2">{person.name}’s chart has no difficult aspects between the relationship planets{person.birth.time ? "" : " that can be read without a birth time"}.</p>)}
          </div>
        </Section>
        <Section title="What You Bring Out In Each Other" intro="Each of you also has supportive aspects in your own chart. These are the strengths the other person’s planets land on or support.">
          <div className="grid gap-8 lg:grid-cols-2">
            {column("In you", yourGifts.length ? <GiftList gifts={yourGifts} quiet={`Nothing in ${person.name}’s chart touches this. It is yours either way.`} /> : <p className="card text-ink-2">Your chart has no supportive aspects between the relationship planets.</p>)}
            {column(`In ${person.name}`, theirGifts.length ? <GiftList gifts={theirGifts} quiet="Nothing in your chart touches this. It is theirs either way." /> : <p className="card text-ink-2">{person.name}’s chart has no supportive aspects between the relationship planets{person.birth.time ? "" : " that can be read without a birth time"}.</p>)}
          </div>
        </Section>
      </>
    );
  };

  /* ---------- The relationship: the composite chart ---------- */
  const relationship = () => {
    const comp = readComposite(self.chart, person.chart, compositeHouses(self, person), person.name);
    const targets = [{ id: "c-sun", lon: comp.points.sun }, { id: "c-venus", lon: comp.points.venus }];
    if (comp.points.moon !== null) targets.push({ id: "c-moon", lon: comp.points.moon });
    if (comp.points.asc !== null) targets.push({ id: "c-asc", lon: comp.points.asc });
    if (comp.points.mc !== null) targets.push({ id: "c-mc", lon: comp.points.mc });
    const windows = isEx ? [] : transitWindows(targets);
    return (
      <>
        {comp.notes.map((n) => <p key={n} className="mb-4 rounded-lg bg-warn-50 px-4 py-3 text-[13px] text-ink-2">{n}</p>)}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,520px)_1fr]">
          <div className="card self-start"><ChartWheel chart={comp.chart} label={`The composite chart of you and ${person.name}`} /></div>
          <div className="space-y-5">
            <div className="card">
              <p className="eyebrow">The Relationship Itself</p>
              <p className="mt-2 text-ink-2">The composite chart is made of the midpoints between your planets. It describes the two of you as a third thing with needs of its own. Nothing in it is a verdict.</p>
              {comp.pattern && <p className="mt-3 text-ink-2">{comp.pattern}</p>}
            </div>
            <div className="card">
              <h3 className="mb-3 text-[18px]">Placements</h3>
              <PlacementsTable chart={comp.chart} />
            </div>
          </div>
        </div>
        {user.premium ? (
          <>
            {comp.sections.map((sec) => (
              <Section key={sec.title} title={sec.title} intro={sec.intro}>
                <div className="grid gap-4 lg:grid-cols-2">{sec.items.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
              </Section>
            ))}
            {comp.others.length > 0 && (
              <Section title="The Other Planets">
                <ul className="card space-y-2">{comp.others.map((o) => <li key={o.title}><span className="heading font-semibold">{o.title}.</span> <span className="text-ink-2">{o.body}</span></li>)}</ul>
              </Section>
            )}
            {(comp.easy.length > 0 || comp.hard.length > 0) && (
              <Section title="Aspects To Its Sun And Moon" intro="How the two of you handle what the relationship is about.">
                <div className="grid gap-4 lg:grid-cols-2">
                  {comp.easy.map((i) => <InsightCard key={i.basis} insight={i} tag={<span className="chip bg-sage-50 text-sage-dark">Holds It Together</span>} />)}
                  {comp.hard.map((i) => <InsightCard key={i.basis} insight={i} tag={<span className="chip bg-accent-50 text-accent">Tests It</span>} />)}
                </div>
              </Section>
            )}
            {!isEx && (
              <Section title="The Next 12 Months For The Two Of You" intro="Slow planets on the relationship’s chart. The ones on its angles tend to mark events.">
                {windows.length ? <TransitGroups windows={windows} /> : <p className="card text-ink-2">No slow planet reaches the relationship’s chart in the next 12 months.</p>}
              </Section>
            )}
          </>
        ) : (
          <div className="mt-6">{locked("The Relationship’s Own Chart, Read In Full", "Subscribe for its lunar nodes, Sun, Moon, rising sign, Venus, Mars and Saturn by sign and house, and its next 12 months.")}</div>
        )}
      </>
    );
  };

  /* ---------- At the time: your chart on the dates that mattered ---------- */
  const time = () => {
    const moments = ([["The day you met", person.metDate], ["The day it began", person.startDate], ["The day it ended", person.endDate]] as [string, string | null | undefined][]).filter((m): m is [string, string] => !!m[1]);
    if (!moments.length) return <p className="card text-ink-2">Add the day you met, the day it began{isEx ? " and the day it ended" : ""}, on <Link className="link" href={`${base}/edit`}>{person.name}’s details</Link>, to see what was working on your chart at those times.</p>;
    if (!user.premium) return locked("Your Chart On The Dates That Mattered", "Subscribe to see the slow planets on your relationship points and your progressed Moon on each date.");
    return (
      <>
        {moments.map(([label, date]) => {
          const items = momentReading(self.chart, date);
          return (
            <Section key={label} title={`${label}, ${formatDate(date)}`} intro="Slow planets on your Sun, Moon, Venus, Mars and partnership axis or in your houses of love, and your progressed Moon.">
              {items.length ? <div className="grid gap-4 lg:grid-cols-2">{items.map((i) => <InsightCard key={i.title} insight={i} />)}</div> : <p className="card text-ink-2">No slow planet was on your relationship points that day.</p>}
            </Section>
          );
        })}
      </>
    );
  };

  return (
    <div>
      {header}
      <Tabs base={base} tabs={TABS} current={tab} />
      <div className="[&>section:first-child]:mt-0">
        {tab === "overview" && overview()}
        {tab === "between" && between()}
        {tab === "triggers" && triggers()}
        {tab === "relationship" && relationship()}
        {tab === "time" && time()}
      </div>
      {tab === "overview" && person.chart && (
        <div className="card mt-8">
          <h2 className="mb-3 text-[20px]">Aspects In {person.name}’s chart</h2>
          <AspectTable chart={person.chart} />
        </div>
      )}
    </div>
  );
}
