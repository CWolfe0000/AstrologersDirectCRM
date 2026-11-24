import { POINT_NAMES } from "@/lib/astro/zodiac";
import { formatDate } from "@/lib/format";
import type { Window } from "@/lib/server/timing";

const span = (w: Window) => `${w.active ? "Under Way" : formatDate(w.start)} – ${w.ongoing ? "Beyond A Year" : formatDate(w.end)}`;

/**
 * The calendar, one card per planet: what that planet brings and its trap are said once, and each
 * period it makes is listed underneath with what it touches, how it arrives and its dates.
 */
export function TransitGroups({ windows }: { windows: Window[] }) {
  const planets = [...new Set(windows.map((w) => w.planet))];
  return (
    <div className="grid gap-4">
      {planets.map((planet) => {
        const mine = windows.filter((w) => w.planet === planet);
        const first = mine[0]!;
        return (
          <article key={planet} className="card">
            <h3 className="text-xl font-semibold">{POINT_NAMES[planet as keyof typeof POINT_NAMES]}: {first.title}</h3>
            <p className="mt-2 text-ink-2">{first.theme}</p>
            <p className="mt-2 text-ink-2"><span className="font-semibold">The trap.</span> {first.trap}</p>
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {mine.map((w) => (
                <li key={w.basis + w.start} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[15rem_1fr]">
                  <div>
                    <p className="heading font-semibold">{w.touches}</p>
                    <p className="text-sm font-semibold text-gold">{span(w)}</p>
                    {w.major && <p className="mt-1 inline-block rounded-full bg-rose-soft px-2.5 py-0.5 text-xs font-semibold text-rose-hover">Major</p>}
                  </div>
                  <div>
                    <p className="text-ink-2">{w.body}</p>
                    <p className="mt-1 text-sm text-muted">
                      {w.passes.length ? `Exact ${w.passes.map((p) => `${formatDate(p.date)}${p.retrograde ? " (retrograde, an inward pass)" : ""}`).join(", ")}.` : `Closest ${formatDate(w.peak)}, not exact within the year.`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
