import type { Metadata } from "next";
import Link from "next/link";
import { saveSelf } from "@/app/actions";
import { PageHeader } from "@/components/app-shell";
import { AspectTable, PlacementsTable } from "@/components/chart/tables";
import { ChartWheel } from "@/components/chart/wheel";
import { SelfForm } from "@/components/forms";
import { Locked, PatternBody, PatternHeadline, Section, type PatternPart } from "@/components/reading";
import { Tabs } from "@/components/tabs";
import { TransitGroups } from "@/components/transit-card";
import { formatDate, plural } from "@/lib/format";
import { elementReading } from "@/lib/reading/elements";
import { ownPattern, placementsOf } from "@/lib/reading/own";
import { requireUser } from "@/lib/server/auth";
import { loadContext, ownTiming } from "@/lib/server/readings";

export const metadata: Metadata = { title: "You" };

const TABS = [
  { id: "pattern", label: "Pattern" },
  { id: "elements", label: "Elements" },
  { id: "dynamics", label: "Dynamics" },
  { id: "intimacy", label: "Arc of intimacy" },
  { id: "aspects", label: "Aspects" },
];

export default async function You({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab: raw }, user] = await Promise.all([searchParams, requireUser()]);
  const ctx = await loadContext(user.id);

  if (!ctx.self)
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title={`Welcome, ${user.name}`} subtitle="Start with your own birth details. Everything else is read against your chart." />
        <div className="card"><SelfForm action={saveSelf} submit="Show my chart" /></div>
      </div>
    );

  const tab = TABS.some((t) => t.id === raw) ? raw! : "pattern";
  const self = ctx.self;
  const pattern = ownPattern(self.chart);
  const windows = tab === "pattern" ? ownTiming(self.chart) : [];
  return (
    <div>
      <PageHeader title="You" subtitle={`Born ${formatDate(self.birth.date)}${self.birth.time ? ` at ${self.birth.time}` : ", time unknown"}, ${self.birth.place}`}>
        <Link href="/app/you" className="btn-ghost">Change birth details</Link>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,560px)_1fr]">
        <div className="card self-start"><ChartWheel chart={self.chart} label={`${user.name}’s birth chart`} /></div>
        <div className="space-y-5">
          <PatternHeadline pattern={pattern} placements={placementsOf(self.chart)} />
          <div className="card">
            <h3 className="mb-3 text-[18px]">Placements</h3>
            <PlacementsTable chart={self.chart} />
          </div>
        </div>
      </div>

      <div className="mt-8"><Tabs base="/app" tabs={TABS} current={tab} /></div>

      {tab === "aspects" ? (
        <div className="card">
          <h2 className="mb-3 text-[22px]">Aspects in your chart</h2>
          <p className="mb-4 text-muted">Orbs of 8° for the conjunction, opposition, square and trine and 4° for the sextile, with 2° more when the Sun or Moon is involved.</p>
          <AspectTable chart={self.chart} />
        </div>
      ) : (
        <PatternBody pattern={pattern} elements={elementReading(self.chart)} part={tab as PatternPart} />
      )}

      {tab === "pattern" && (
        <>
          <Section title="Your next relationship period">
            {windows[0] ? <TransitGroups windows={[windows[0]]} /> : <p className="card text-ink-2">No slow planet reaches your relationship points in the next 12 months. Read this year as the aftermath of the last such period, or the lead-in to the next.</p>}
            {windows.length > 1 &&
              (user.premium ? (
                <Link href="/app/calendar" className="link">See all {windows.length} periods in your calendar</Link>
              ) : (
                <Locked title={`${plural(windows.length - 1, "more period")} in your next 12 months`}><p>Your calendar lists each one with its dates.</p></Locked>
              ))}
          </Section>
          <section className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="text-[20px]">Is it true of your past?</h2>
              <p className="mt-2 text-ink-2">{ctx.exes.length === 0 ? "This is what your chart says. Add the people you have been with and see what they actually had in common." : `You have added ${plural(ctx.exes.length, "past partner")}.${ctx.exes.length < 2 ? " Add one more to see what repeats." : ""}`}</p>
              <Link href={ctx.exes.length >= 2 ? "/app/patterns" : "/app/people/new?kind=ex"} className="btn-dark mt-4">{ctx.exes.length >= 2 ? "See your patterns" : "Add a past partner"}</Link>
            </div>
            <div className="card">
              <h2 className="text-[20px]">Met someone?</h2>
              <p className="mt-2 text-ink-2">Add them to see your two charts together, and whether they fit your pattern or break it.</p>
              <Link href="/app/people/new?kind=match" className="btn-dark mt-4">Add someone new</Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
