import type { Metadata } from "next";
import Link from "next/link";
import { InsightCard, Locked, Section } from "@/components/reading";
import { TransitCard } from "@/components/transit-card";
import { formatDate, plural } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { loadContext, ownTiming } from "@/lib/server/readings";
import { houseTransits, progressions } from "@/lib/server/timing";

export const metadata: Metadata = { title: "Calendar" };

export default async function Timing() {
  const user = await requireUser();
  const { self } = await loadContext(user.id);
  if (!self) return <p className="card">Add <Link className="link" href="/app">your own birth details</Link> to see your calendar.</p>;
  const windows = ownTiming(self.chart);
  const houses = houseTransits(self.chart);
  const progressed = progressions(self.chart);
  const shown = user.premium ? windows : windows.slice(0, 1);
  const hidden = windows.length - shown.length + houses.length + progressed.moon.length + progressed.venus.length;
  return (
    <div>
      <h1 className="text-4xl font-semibold">Your relationship calendar</h1>
      <p className="mt-2 max-w-2xl text-ink-2">
        What is working on the relationship side of your chart over the next 12 months. Each period is a question put to you, with a task and a trap. None of it says what will happen: that part is yours.
      </p>
      {!self.chart.houses && <p className="mt-5 rounded-xl bg-gold-soft px-4 py-3 text-sm text-ink-2">Without a birth time this calendar uses your Sun, Venus and Mars only. <Link className="link" href="/app/you">Add your birth time</Link> to include your Moon, your partnership axis, the houses and your current chapter.</p>}

      {user.premium && progressed.moon.length > 0 && (
        <Section title="The chapter you are in" intro="Your progressed Moon: where your heart is, for two or three years at a time. Everything else is read against this.">
          <div className="grid gap-4 lg:grid-cols-2">{progressed.moon.map((i) => <InsightCard key={i.title} insight={i} />)}</div>
        </Section>
      )}
      {user.premium && progressed.venus.length > 0 && (
        <Section title="How your relationships are changing" intro="Your progressed Venus meeting a point in your birth chart: an adjustment in how you relate that lasts two or three years.">
          <div className="grid gap-4 lg:grid-cols-2">{progressed.venus.map((i) => <InsightCard key={i.basis} insight={i} />)}</div>
        </Section>
      )}
      {user.premium && houses.length > 0 && (
        <Section title="The houses of love" intro="Slow planets moving through your houses of romance, partnership and intimacy. These are themes of a year or more.">
          <div className="grid gap-4 lg:grid-cols-2">
            {houses.map((h) => (
              <InsightCard key={h.title} insight={{ ...h, body: `${h.body} The trap: ${h.trap.charAt(0).toLowerCase()}${h.trap.slice(1)}` }} tag={<span className="rounded-full bg-gold-soft px-3 py-1 text-sm font-semibold text-gold">{h.from ? `From ${formatDate(h.from)}` : "Now"}</span>} />
            ))}
          </div>
        </Section>
      )}

      <Section title="The next 12 months" intro="Periods when Jupiter, Saturn, Uranus, Neptune or Pluto is working on one of your relationship points. The ones marked Major touch your Sun, Moon or partnership axis; read the others in their light.">
        {windows.length === 0 && <p className="card text-ink-2">No slow planet reaches your relationship points in the next 12 months. Read this year as the aftermath of the last such period, or the lead-in to the next.</p>}
        <ol className="grid gap-4">{shown.map((w) => <li key={w.basis + w.start}><TransitCard w={w} /></li>)}</ol>
      </Section>
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
