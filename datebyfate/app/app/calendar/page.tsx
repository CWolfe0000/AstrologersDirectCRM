import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { ChartWheel } from "@/components/chart/wheel";
import { InsightCard, Locked, Section } from "@/components/reading";
import { TransitGroups } from "@/components/transit-card";
import { formatDate, plural } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { loadContext, ownTiming, relationshipTargets } from "@/lib/server/readings";
import { bodiesAt } from "@/lib/server/swiss";
import { houseTransits, lifeCycle, progressions, triggerDays } from "@/lib/server/timing";

export const metadata: Metadata = { title: "Calendar" };

export default async function Timing() {
  const user = await requireUser();
  const { self } = await loadContext(user.id);
  if (!self) return <p className="card">Add <Link className="link" href="/app">your own birth details</Link> to see your calendar.</p>;
  const windows = ownTiming(self.chart);
  const houses = houseTransits(self.chart);
  const progressed = progressions(self.chart, Date.now(), self.birth.lat);
  const cycle = lifeCycle(self.chart);
  const triggers = triggerDays(relationshipTargets(self.chart), windows);
  const shown = user.premium ? windows : windows.slice(0, 1);
  const hidden = windows.length - shown.length + houses.length + progressed.moon.length + progressed.venus.length + cycle.length + triggers.length;
  return (
    <div>
      <PageHeader title="Calendar" subtitle="What is working on the relationship side of your chart over the next 12 months. Each period is a question put to you, with a task and a trap. None of it says what will happen." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,520px)_1fr]">
        <div className="card self-start">
          <ChartWheel chart={self.chart} outer={{ bodies: bodiesAt(Date.now()), houses: null, moonSignCertain: true, utc: new Date().toISOString() }} label="Your birth chart" outerLabel="The sky today" />
          <p className="mt-2 text-center text-[12.5px] text-muted">Your chart inside, today’s sky outside.</p>
        </div>
        <div className="space-y-5">
          {cycle.length > 0 && user.premium ? cycle.map((c) => <InsightCard key={c.title} insight={c} tag={<span className="chip bg-accent-50 text-accent">{c.from ? `From ${formatDate(c.from)}` : "Now"}</span>} />) : null}
          {user.premium && progressed.moon.map((i) => <InsightCard key={i.title} insight={i} />)}
          {(!user.premium || (!progressed.moon.length && !cycle.length)) && <p className="card text-ink-2">The outer ring shows where the planets are today against your birth chart. The periods below are the ones that touch your Sun, Moon, Venus, Mars and partnership axis.</p>}
        </div>
      </div>
      {!self.chart.houses && <p className="mt-5 rounded-lg bg-warn-50 px-4 py-3 text-[13px] text-ink-2">Without a birth time this calendar uses your Sun, Venus and Mars only. <Link className="link" href="/app/you">Add your birth time</Link> to include your Moon, your partnership axis, the houses and your current chapter.</p>}

      {user.premium && progressed.venus.length > 0 && (
        <Section title="How your relationships are changing" intro="Your progressed Venus meeting a point in your birth chart: an adjustment in how you relate that lasts two or three years.">
          <div className="grid gap-4 lg:grid-cols-2">{progressed.venus.map((i) => <InsightCard key={i.basis} insight={i} />)}</div>
        </Section>
      )}
      {user.premium && houses.length > 0 && (
        <Section title="The houses of love" intro="Slow planets moving through your houses of romance, partnership and intimacy. These are themes of a year or more.">
          <div className="grid gap-4 lg:grid-cols-2">
            {houses.map((h) => (
              <InsightCard key={h.title} insight={{ ...h, body: `${h.body} The trap: ${h.trap.charAt(0).toLowerCase()}${h.trap.slice(1)}` }} tag={<span className="chip bg-warn-50 text-warn">{h.from ? `From ${formatDate(h.from)}` : "Now"}</span>} />
            ))}
          </div>
        </Section>
      )}

      <Section title="The next 12 months" intro="One card for each slow planet at work on your relationship points, with every period it makes this year. The effect of a period builds toward its exact dates and fades after them. Periods marked Major touch your Sun, Moon or partnership axis; read the others in their light.">
        {windows.length === 0 && <p className="card text-ink-2">No slow planet reaches your relationship points in the next 12 months. Read this year as the aftermath of the last such period, or the lead-in to the next.</p>}
        <TransitGroups windows={shown} />
      </Section>
      {user.premium && triggers.length > 0 && (
        <Section title="The next six weeks: which days" intro="Fast planets do not make a theme of their own. On these days one of them touches a point a slow planet is already working on, and sets it off.">
          <ul className="card divide-y divide-line">
            {triggers.map((t) => (
              <li key={t.date + t.title} className="grid gap-x-6 gap-y-0.5 py-2.5 sm:grid-cols-[8rem_1fr]">
                <p className="font-semibold tabular-nums">{formatDate(t.date)}</p>
                <p className="text-ink-2"><span className="heading font-semibold text-ink">{t.title}.</span> {t.body} <span className="text-sm text-muted">Sets off: {t.sets}.</span></p>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {!user.premium && hidden > 0 && (
        <div className="mt-4">
          <Locked title={`${plural(hidden, "more reading")} in your calendar`}>
            <p>Subscribe to see every period with its dates, the chapter you are in now, how your relationships are changing, and the slow planets in your houses of love.</p>
          </Locked>
        </div>
      )}
    </div>
  );
}
