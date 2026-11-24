import type { Metadata } from "next";
import Link from "next/link";
import { saveSelf } from "@/app/actions";
import { SelfForm } from "@/components/forms";
import { Locked, PatternView, Section } from "@/components/reading";
import { TransitGroups } from "@/components/transit-card";
import { formatDate, plural } from "@/lib/format";
import { elementReading } from "@/lib/reading/elements";
import { ownPattern, placementsOf } from "@/lib/reading/own";
import { requireUser } from "@/lib/server/auth";
import { loadContext, ownTiming } from "@/lib/server/readings";

export const metadata: Metadata = { title: "Your Pattern" };

export default async function AppHome() {
  const user = await requireUser();
  const ctx = await loadContext(user.id);

  if (!ctx.self)
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="text-4xl font-semibold">Welcome, {user.name}</h1>
        <p className="mb-6 mt-2 text-ink-2">Start with your own birth details. Everything else is read against your chart.</p>
        <div className="card"><SelfForm action={saveSelf} submit="Show my pattern" /></div>
      </div>
    );

  const windows = ownTiming(ctx.self.chart);
  const next = windows[0];
  return (
    <PatternView pattern={ownPattern(ctx.self.chart)} placements={placementsOf(ctx.self.chart)} elements={elementReading(ctx.self.chart)}>
      <Section title="Your next relationship period">
        {next ? (
<TransitGroups windows={[next]} />
        ) : (
          <p className="card text-ink-2">No slow planet reaches your relationship points in the next 12 months. Read this year as the aftermath of the last such period, or the lead-in to the next.</p>
        )}
        {windows.length > 1 && (user.premium ? <Link href="/app/timing" className="link">See all {windows.length} periods in your calendar</Link> : (
          <Locked title={`${plural(windows.length - 1, "more period")} in your next 12 months`}>
            <p>Your calendar lists each one with its start, peak and end dates.</p>
          </Locked>
        ))}
      </Section>

      <section className="mt-12 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-2xl font-semibold">Is it true of your past?</h2>
          <p className="mt-2 text-ink-2">
            {ctx.exes.length === 0 ? "This is what your chart says. Add the people you have been with and see what they actually had in common." : `You have added ${plural(ctx.exes.length, "past partner")}.${ctx.exes.length < 2 ? " Add one more to see what repeats." : ""}`}
          </p>
          <Link href={ctx.exes.length ? "/app/exes" : "/app/exes/new"} className="btn-dark mt-4">{ctx.exes.length ? "See past partners" : "Add a past partner"}</Link>
        </div>
        <div className="card">
          <h2 className="text-2xl font-semibold">Met someone?</h2>
          <p className="mt-2 text-ink-2">Add them to see what the two of you are like together, and whether they fit your pattern or break it.</p>
          <Link href="/app/people/new" className="btn-dark mt-4">Add someone new</Link>
        </div>
      </section>
      <p className="mt-10 text-sm text-muted">
        Born {formatDate(ctx.self.birth.date)}{ctx.self.birth.time ? ` at ${ctx.self.birth.time}` : ", time unknown"}, {ctx.self.birth.place}. <Link href="/app/you" className="link">Change birth details</Link>
      </p>
    </PatternView>
  );
}
