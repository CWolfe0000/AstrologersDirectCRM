import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { signName } from "@/lib/astro/zodiac";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { loadContext } from "@/lib/server/readings";

export const metadata: Metadata = { title: "People" };

export default async function People() {
  const user = await requireUser();
  const ctx = await loadContext(user.id);
  const people = [...ctx.matches, ...ctx.exes];
  return (
    <div>
      <PageHeader title="People" subtitle="Everyone you have been with, are with, or have just met. Each one is read with your chart.">
        <Link href="/app/people/new?kind=ex" className="btn-ghost">Add a past partner</Link>
        <Link href="/app/people/new?kind=match" className="btn-primary">Add someone new</Link>
      </PageHeader>
      {!ctx.self && <p className="card mb-5">Add <Link className="link" href="/app">your own birth details</Link> first.</p>}
      {people.length === 0 ? (
        <p className="card text-ink-2">Nobody here yet. Add at least two past partners to see what they have in common.</p>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead className="border-b border-line text-[11.5px] uppercase tracking-wider text-muted">
              <tr>
                {["Name", "Status", "Sun", "Moon", "Venus", "Mars", "Together"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((p) => (
                <tr key={p.id} className="hover:bg-canvas">
                  <th scope="row" className="px-4 py-3 font-medium"><Link href={`/app/people/${p.id}`} className="link !text-ink">{p.name}</Link></th>
                  <td className="px-4 py-3"><span className={`chip ${p.kind === "ex" ? "bg-canvas-2 text-ink-2" : "bg-sage-50 text-sage-dark"}`}>{p.kind === "ex" ? "Past" : "Current Or New"}</span></td>
                  <td className="px-4 py-3">{signName(p.chart.bodies.sun.lon)}</td>
                  <td className="px-4 py-3">{p.chart.moonSignCertain ? signName(p.chart.bodies.moon.lon) : "Uncertain"}</td>
                  <td className="px-4 py-3">{signName(p.chart.bodies.venus.lon)}</td>
                  <td className="px-4 py-3">{signName(p.chart.bodies.mars.lon)}</td>
                  <td className="px-4 py-3 text-muted">{p.startDate ? `${formatDate(p.startDate)}${p.endDate ? ` – ${formatDate(p.endDate)}` : p.kind === "ex" ? "" : " – now"}` : p.startYear ? `${p.startYear}–${p.endYear ?? ""}` : "No dates"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
