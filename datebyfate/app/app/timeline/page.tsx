import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { Locked, Section } from "@/components/reading";
import { TimelineScroll } from "@/components/timeline-scroll";
import { plural } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { loadContext } from "@/lib/server/readings";
import { TECHNIQUE_NAMES, timelineFor, type RomanceWindow, type Technique, type Timeline, type TimelineEvent } from "@/lib/server/timeline";

export const metadata: Metadata = { title: "Timeline" };

/** Twelve months back and forty-eight ahead. */
const MONTHS = 60;
const BACK = 12;
const MONTH_W = 28;
const LABEL_W = 96;
const LANE_H = 22;

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const DAY = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const INITIAL = new Intl.DateTimeFormat("en-US", { month: "narrow", timeZone: "UTC" });
const monthYear = (d: Date) => MONTH_YEAR.format(d);
const anchor = (e: TimelineEvent) => `e-${e.id.replace(/[^a-z0-9]+/gi, "-")}`;

/** "Mar 2027 – Jul 2028", or one month. */
const span = (from: Date, to: Date) => (monthYear(from) === monthYear(to) ? monthYear(from) : `${monthYear(from)} – ${monthYear(to)}`);
const eventSpan = (e: TimelineEvent) =>
  e.from.getTime() === e.to.getTime() ? DAY.format(e.from) : e.openStart && e.openEnd ? "Throughout" : e.openStart ? `Until ${monthYear(e.to)}` : e.openEnd ? `From ${monthYear(e.from)}` : span(e.from, e.to);
const join = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

const ROMANCE_BAR = ["border-line-strong bg-canvas-2 text-muted", "border-accent-200 bg-accent-100 text-accent-hover", "border-accent bg-accent text-white"];

export default async function TimelinePage({ searchParams }: { searchParams: Promise<{ who?: string; from?: string; list?: string }> }) {
  const [{ who, from, list }, user] = await Promise.all([searchParams, requireUser()]);
  const { self, matches, exes } = await loadContext(user.id);
  if (!self) return <p className="card">Add <Link className="link" href="/app">your own birth details</Link> to see your timeline.</p>;
  const others = [...matches, ...exes];
  const person = others.find((p) => p.id === who) ?? self;
  const other = person !== self;

  const now = new Date();
  const birthYear = Number(person.birth.date.slice(0, 4));
  const year = from && /^\d{4}$/.test(from) ? Math.min(Math.max(Number(from), birthYear), Math.min(birthYear + 110, 2390)) : null;
  const start = year ? new Date(Date.UTC(year, 0, 1)) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - BACK, 1));
  const range = { from: start, months: MONTHS };
  const timeline = timelineFor(person.chart, Date.parse(person.chart.utc), range);
  const own = other ? timelineFor(self.chart, Date.parse(self.chart.utc), range) : null;
  const shared = own ? timeline.months.filter((m, i) => m.strength && own.months[i]!.strength) : [];

  /** Pixels from the start of the track to a moment: whole months, then the part of a month. */
  const x = (d: Date) => {
    const k = (d.getUTCFullYear() - start.getUTCFullYear()) * 12 + d.getUTCMonth() - start.getUTCMonth();
    const a = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), b = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    return Math.min(MONTHS, Math.max(0, k + (d.getTime() - a) / (b - a))) * MONTH_W;
  };
  const width = MONTHS * MONTH_W;
  const today = now >= timeline.from && now < timeline.to ? x(now) : null;
  // The full list of contacts is long, so it is its own view: ?list=1.
  const listed = list === "1";
  const href = (id: string, y: number | null, withList = listed) => {
    const q = new URLSearchParams();
    if (id !== self.id) q.set("who", id);
    if (y) q.set("from", String(y));
    if (withList) q.set("list", "1");
    const s = q.toString();
    return s ? `/app/timeline?${s}` : "/app/timeline";
  };
  const startYear = start.getUTCFullYear();
  const whose = other ? `${person.name}’s` : "your";
  const byTechnique = (["transit", "progression", "solar-arc"] as Technique[]).map((t) => ({ technique: t, events: timeline.events.filter((e) => e.technique === t) }));
  const years = [...new Set(timeline.months.map((m) => m.start.getUTCFullYear()))].map((y) => ({ year: y, months: timeline.months.filter((m) => m.start.getUTCFullYear() === y).length }));

  return (
    <div className="min-w-0">
      <PageHeader title="Timeline" subtitle={`What transits, progressions and solar arcs are touching in ${whose} chart, month by month, and the periods where they agree about love.`}>
        <Link href={href(person.id, startYear - 4)} className="btn-ghost">Earlier</Link>
        {year !== null && <Link href={href(person.id, null)} className="btn-ghost">Today</Link>}
        <Link href={href(person.id, startYear + 4)} className="btn-ghost">Later</Link>
      </PageHeader>

      {others.length > 0 && (
        <nav aria-label="Whose timeline" className="mb-5 flex flex-wrap gap-2">
          {[self, ...others].map((p) => (
            <Link key={p.id} href={href(p.id, year)} aria-current={p === person ? "page" : undefined} className={`chip h-8 border px-3.5 text-[13px] ${p === person ? "border-accent bg-accent text-white" : "border-line-strong bg-white text-ink hover:bg-canvas"}`}>
              {p === self ? "You" : p.name}
            </Link>
          ))}
        </nav>
      )}

      <p className="mb-4 max-w-3xl text-[13.5px] text-muted">Progressions and solar arcs set the background for a year or two at a time; a transit is the timer. A window opens when a strong transit to your relationship points peaks while a progression or solar arc points the same way. It is marked ideal when both do. This convergence rule is Datebyfate’s own, and nothing here predicts an event.</p>
      {timeline.notes.map((n) => (
        <p key={n} className="mb-4 rounded-lg bg-warn-50 px-4 py-3 text-[13px] text-ink-2">{n}{!other && <> <Link className="link" href="/app/you">Add your birth time</Link> to include them.</>}</p>
      ))}

      <TimelineScroll focus={today} gutter={LABEL_W} label={`Timeline, ${span(timeline.months[0]!.start, timeline.months[MONTHS - 1]!.start)}`}>
        <div className="relative" style={{ width: LABEL_W + width }}>
          <div className="flex border-b border-line">
            <RowLabel />
            <div style={{ width }}>
              <div className="flex pt-5">
                {years.map((y) => (
                  <div key={y.year} className="border-l border-line-strong text-[12px] font-semibold tabular-nums text-ink first:border-l-0" style={{ width: y.months * MONTH_W }}>
                    {/* The year stays in view while its months scroll past. */}
                    {y.months > 1 && <span className="sticky inline-block px-1.5" style={{ left: LABEL_W }}>{y.year}</span>}
                  </div>
                ))}
              </div>
              <div className="flex pb-1">
                {timeline.months.map((m) => <div key={m.key} title={monthYear(m.start)} className="text-center text-[10.5px] text-muted" style={{ width: MONTH_W }}>{INITIAL.format(m.start)}</div>)}
              </div>
            </div>
          </div>
          {own && <WindowRow label="Romance Windows: You" timeline={own} width={width} />}
          <WindowRow label={other ? `Romance Windows: ${person.name}` : "Romance Windows"} timeline={timeline} width={width} />
          {user.premium && byTechnique.map(({ technique, events }) => <EventRow key={technique} label={TECHNIQUE_NAMES[technique]} events={events} x={x} width={width} base={href(person.id, year, true)} />)}
          {today !== null && (
            <div aria-hidden className="pointer-events-none absolute inset-y-0 z-10 w-px bg-ink/70" style={{ left: LABEL_W + today }}>
              <span className="absolute left-1 top-0.5 rounded bg-ink px-1 text-[10px] font-medium leading-4 text-white">Today</span>
            </div>
          )}
        </div>
      </TimelineScroll>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
        <Key className="bg-accent-200" text="Good window" />
        <Key className="bg-accent" text="Ideal window" />
        {user.premium && <><Key className="border border-accent bg-accent" text="Strongly supports romance" /><Key className="border border-accent-200 bg-accent-100" text="Supports romance" /><Key className="border border-line-strong bg-canvas-2" text="Other contacts" /></>}
      </div>

      {own && (
        <p className="card mt-5 text-ink-2">
          {shared.length ? <><span className="font-semibold text-ink">You both have a romance window in:</span> {join(monthRuns(shared.map((m) => m.start)))}.</> : `You and ${person.name} have no romance window in the same month of this range.`}
        </p>
      )}

      <Section title={other ? `${person.name}’s Romance Windows` : "Your Romance Windows"} intro={`${plural(timeline.windows.length, "window")} between ${monthYear(timeline.months[0]!.start)} and ${monthYear(timeline.months[MONTHS - 1]!.start)}. Each window is a run of months in which a strong transit to the relationship points peaks with a progression or solar arc behind it. It marks a period that favours love; what happens in it is up to the people involved.`}>
        {timeline.windows.length === 0 && <p className="card text-ink-2">No strong transit meets a progression or solar arc about love in this range. Look earlier or later, or read the contacts one at a time.</p>}
        {user.premium ? (
          <div className="grid gap-4 lg:grid-cols-2">{timeline.windows.map((w) => <WindowCard key={w.from.toISOString()} window={w} />)}</div>
        ) : timeline.windows.length > 0 || timeline.events.length > 0 ? (
          <Locked title={`${plural(timeline.windows.length, "romance window")} and ${plural(timeline.events.length, "contact")} in this timeline`}>
            <p>Subscribe to see the dates of each window, which techniques converge in it and what each factor is about, with every transit, progression and solar arc drawn on the timeline.</p>
          </Locked>
        ) : null}
      </Section>

      {user.premium && !listed && (
        <p className="mt-8"><Link href={`${href(person.id, year, true)}#contacts`} className="btn-ghost">Show Every Contact In This Range ({timeline.events.length})</Link></p>
      )}
      {user.premium && listed && <div id="contacts" />}
      {user.premium && listed && byTechnique.map(({ technique, events }) => (
        <Section key={technique} title={TECHNIQUE_NAMES[technique]} intro={INTRO[technique]}>
          {events.length === 0 ? <p className="card text-ink-2">Nothing by this technique reaches {whose} relationship points in this range.</p> : (
            <ul className="card divide-y divide-line">
              {events.map((e) => <EventItem key={e.id} event={e} />)}
            </ul>
          )}
        </Section>
      ))}
    </div>
  );
}

const INTRO: Record<Technique, string> = {
  transit: "Jupiter, Saturn, Uranus, Neptune and Pluto in the sky now, meeting the relationship points of the birth chart or passing through its 5th and 7th houses. The effect builds toward the exact dates and fades after them.",
  progression: "The chart’s own unfolding, a day after birth for each year of life. Progressed planets within one degree of a natal point, and the progressed Moon in the 5th and 7th houses.",
  "solar-arc": "Every point of the birth chart moved forward by the same arc, the distance the progressed Sun has travelled: about a degree a year. A contact is in range for about two years. Trines and sextiles are quieter than conjunctions, squares and oppositions.",
};

function RowLabel({ children }: { children?: React.ReactNode }) {
  return <div className="heading sticky left-0 z-20 flex shrink-0 items-center border-r border-line bg-white px-2.5 py-2 text-[11.5px] font-semibold leading-tight text-ink" style={{ width: LABEL_W }}>{children}</div>;
}

/** Faint month lines behind a row. */
const monthLines = { backgroundImage: "linear-gradient(to right, #F0EDE7 1px, transparent 1px)", backgroundSize: `${MONTH_W}px 100%` };

function WindowRow({ label, timeline, width }: { label: string; timeline: Timeline; width: number }) {
  // One band for each run of months of the same strength.
  const bands: { at: number; months: number; strength: 2 | 3; from: Date; to: Date }[] = [];
  timeline.months.forEach((m, i) => {
    if (!m.strength) return;
    const last = bands[bands.length - 1];
    if (last && last.at + last.months === i && last.strength === m.strength) (last.months++, (last.to = m.start));
    else bands.push({ at: i, months: 1, strength: m.strength, from: m.start, to: m.start });
  });
  return (
    <div className="flex border-b border-line">
      <RowLabel>{label}</RowLabel>
      <div className="relative h-10" style={{ width, ...monthLines }}>
        {bands.map((b) => (
          <div key={b.at} title={`${span(b.from, b.to)}: ${b.strength === 3 ? "ideal, all three techniques agree" : "good, two techniques agree"}`} className={`absolute inset-y-2 rounded-[3px] ${b.strength === 3 ? "bg-accent" : "bg-accent-200"}`} style={{ left: b.at * MONTH_W + 1, width: b.months * MONTH_W - 1 }}>
            <span className="sr-only">{span(b.from, b.to)}: {b.strength === 3 ? "ideal, all three techniques agree" : "good, two techniques agree"}</span>
          </div>
        ))}
        {bands.length === 0 && <span className="sticky inline-block py-2.5 pl-2 text-[12px] text-muted" style={{ left: LABEL_W }}>None in this range</span>}
      </div>
    </div>
  );
}

function EventRow({ label, events, x, width, base }: { label: string; events: TimelineEvent[]; x: (d: Date) => number; width: number; base: string }) {
  // Pack the bars into as few lanes as will hold them without overlap.
  const ends: number[] = [];
  const bars = events.map((e) => {
    const left = x(e.from);
    const w = Math.max(8, x(e.to) - left);
    let lane = ends.findIndex((end) => end + 2 <= left);
    if (lane < 0) lane = ends.length;
    ends[lane] = left + w;
    return { e, left: Math.min(left, width - 8), w: Math.min(w, width - Math.min(left, width - 8)), lane };
  });
  return (
    <div className="flex border-b border-line last:border-b-0">
      <RowLabel>{label}</RowLabel>
      <div className="relative" style={{ width, height: Math.max(1, ends.length) * LANE_H + 10, ...monthLines }}>
        {bars.map(({ e, left, w, lane }) => (
          <a key={e.id} href={`${base}#${anchor(e)}`} title={`${e.title} (${eventSpan(e)})`} className={`heading absolute overflow-hidden whitespace-nowrap rounded-[3px] border px-1 text-[10.5px] font-medium leading-[16px] hover:z-10 hover:brightness-95 ${ROMANCE_BAR[e.romance]}`} style={{ left, width: w, top: 5 + lane * LANE_H, height: LANE_H - 4 }}>
            {w >= 40 ? e.title.replace(" Your ", " ") : <span className="sr-only">{e.title}</span>}
          </a>
        ))}
        {bars.length === 0 && <span className="sticky inline-block py-1.5 pl-2 text-[12px] text-muted" style={{ left: LABEL_W }}>Nothing in this range</span>}
      </div>
    </div>
  );
}

function Key({ className, text }: { className: string; text: string }) {
  return <span className="inline-flex items-center gap-1.5"><span aria-hidden className={`inline-block h-2.5 w-5 rounded-[3px] ${className}`} />{text}</span>;
}

function RomanceChip({ romance }: { romance: 0 | 1 | 2 }) {
  if (!romance) return null;
  return <span className={`chip ${romance === 2 ? "bg-accent text-white" : "bg-accent-50 text-accent"}`}>{romance === 2 ? "Strongly supports romance" : "Supports romance"}</span>;
}

/** The months as runs: "Mar 2027 – Jul 2027", "Jan 2028". */
function monthRuns(months: Date[]) {
  const runs: [Date, Date][] = [];
  for (const m of months) {
    const last = runs[runs.length - 1];
    if (last && Date.UTC(last[1].getUTCFullYear(), last[1].getUTCMonth() + 1, 1) === m.getTime()) last[1] = m;
    else runs.push([m, m]);
  }
  return runs.map(([a, b]) => span(a, b));
}

function WindowCard({ window: w }: { window: RomanceWindow }) {
  const factors = [...w.factors].sort((a, b) => b.romance - a.romance || a.from.getTime() - b.from.getTime());
  return (
    <article className="card">
      <p className="eyebrow">{w.strength === 3 ? "Ideal: All Three Techniques" : "Good: Two Techniques"}</p>
      <h3 className="mt-1 text-xl">{span(w.from, w.to)}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {w.techniques.map((t) => <span key={t} className={`chip ${w.strength === 3 ? "bg-accent text-white" : "bg-accent-50 text-accent"}`}>{TECHNIQUE_NAMES[t]}</span>)}
      </div>
      <p className="mt-3 text-ink-2">{w.summary}</p>
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {factors.map((f) => (
          <li key={f.id} className="py-2.5">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="heading font-semibold text-ink">{f.title}</span>
              <span className="text-[12.5px] tabular-nums text-muted">{TECHNIQUE_NAMES[f.technique].replace(/s$/, "")} · {eventSpan(f)}</span>
              {f.romance === 2 && <RomanceChip romance={2} />}
            </p>
            <p className="mt-1 text-[14px] text-ink-2">{f.body}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

function EventItem({ event: e }: { event: TimelineEvent }) {
  const point = e.from.getTime() === e.to.getTime();
  return (
    <li id={anchor(e)} className="grid scroll-mt-20 gap-x-6 gap-y-0.5 py-3 sm:grid-cols-[11rem_1fr]">
      <div>
        <p className="font-semibold tabular-nums">{eventSpan(e)}</p>
        {!point && e.exact.length > 0 && <p className="text-[12.5px] text-muted">Exact {join(e.exact.map((d) => DAY.format(d)))}</p>}
      </div>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="heading font-semibold text-ink">{e.title}</span><RomanceChip romance={e.romance} /></p>
        <p className="mt-1 text-ink-2">{e.body}</p>
      </div>
    </li>
  );
}
