import { formatDate } from "@/lib/format";
import type { Window } from "@/lib/server/timing";

const span = (w: Window) => `${w.active ? "Under Way" : formatDate(w.start)} – ${w.ongoing ? "Beyond A Year" : formatDate(w.end)}`;

export function TransitCard({ w }: { w: Window }) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h3 className="text-xl font-semibold">{w.title}</h3>
        <span className="flex flex-wrap gap-2">
          {w.major && <span className="rounded-full bg-rose-soft px-3 py-1 text-sm font-semibold text-rose-hover">Major</span>}
          <span className="rounded-full bg-gold-soft px-3 py-1 text-sm font-semibold text-gold">{span(w)}</span>
        </span>
      </div>
      <p className="mt-2 text-ink-2">{w.body}</p>
      <p className="mt-2 text-ink-2"><span className="font-semibold">The trap.</span> {w.trap}</p>
      <p className="mt-2 text-sm text-muted">
        {w.passes.length
          ? `Exact on ${w.passes.map((p) => `${formatDate(p.date)}${p.retrograde ? " (retrograde: an inward, private pass)" : ""}`).join(", ")}.`
          : `Closest on ${formatDate(w.peak)}; it is not exact within the year.`}{" "}
        The effect builds toward these dates and fades after them.
      </p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted">{w.basis}</p>
    </article>
  );
}

