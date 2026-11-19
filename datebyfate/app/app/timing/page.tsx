import type { Metadata } from "next";
import Link from "next/link";
import { InsightCard, Locked } from "@/components/reading";
import { formatDate, plural } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { loadContext, ownTiming } from "@/lib/server/readings";

export const metadata: Metadata = { title: "Calendar" };

export default async function Timing() {
  const user = await requireUser();
  const { self } = await loadContext(user.id);
  if (!self) return <p className="card">Add <Link className="link" href="/app">your own birth details</Link> to see your calendar.</p>;
  const windows = ownTiming(self.chart);
  const shown = user.premium ? windows : windows.slice(0, 1);
  return (
    <div>
      <h1 className="text-4xl font-semibold">Your relationship calendar</h1>
      <p className="mt-2 max-w-2xl text-ink-2">
        The periods in the next 12 months when a slow planet is on one of your relationship points. Each has a start, a peak and an end. They describe the weather, and what you do in it is up to you.
      </p>
      {!self.chart.houses && <p className="mt-5 rounded-xl bg-gold-soft px-4 py-3 text-sm text-ink-2">Without a birth time this calendar uses Venus and Mars only. <Link className="link" href="/app/you">Add your birth time</Link> to include your partnership axis, 7th-house ruler and Moon.</p>}
      {windows.length === 0 && <p className="card mt-8 text-ink-2">No slow planet reaches your relationship points in the next 12 months.</p>}
      <ol className="mt-8 grid gap-4">
        {shown.map((w) => (
          <li key={w.basis + w.start}>
            <InsightCard
              insight={w}
              tag={
                <span className="rounded-full bg-gold-soft px-3 py-1 text-sm font-semibold text-gold">
                  {w.active ? "Now" : formatDate(w.start)} – {w.ongoing ? "next year" : formatDate(w.end)} · peak {formatDate(w.peak)}
                </span>
              }
            />
          </li>
        ))}
      </ol>
      {!user.premium && windows.length > 1 && (
        <div className="mt-4">
          <Locked title={`${plural(windows.length - 1, "more period")} in your next 12 months`}><p>Subscribe to see every period with its dates.</p></Locked>
        </div>
      )}
    </div>
  );
}
