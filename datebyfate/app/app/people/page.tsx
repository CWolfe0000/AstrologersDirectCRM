import type { Metadata } from "next";
import Link from "next/link";
import { PersonRow } from "@/components/person-row";
import { requireUser } from "@/lib/server/auth";
import { loadContext } from "@/lib/server/readings";

export const metadata: Metadata = { title: "Someone new" };

export default async function People() {
  const user = await requireUser();
  const ctx = await loadContext(user.id);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Someone new</h1>
          <p className="mt-2 max-w-2xl text-ink-2">People you have met, are seeing, or are with now. Each one is read with your chart and checked against the pattern from your past partners.</p>
        </div>
        <Link href="/app/people/new" className="btn-dark">Add someone</Link>
      </div>
      {!ctx.self && <p className="card mt-8">Add <Link className="link" href="/app">your own birth details</Link> first.</p>}
      {ctx.matches.length > 0 ? (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">{ctx.matches.map((p) => <PersonRow key={p.id} person={p} />)}</ul>
      ) : (
        <p className="card mt-8 text-ink-2">Nobody here yet.</p>
      )}
    </div>
  );
}
