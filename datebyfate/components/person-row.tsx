import Link from "next/link";
import type { Chart } from "@/lib/astro/types";
import { signName } from "@/lib/astro/zodiac";
import type { Person } from "@/lib/people";

export function PersonRow({ person }: { person: Person & { chart: Chart } }) {
  const years = person.startYear ? `${person.startYear}–${person.endYear ?? ""}` : null;
  return (
    <li>
      <Link href={`/app/people/${person.id}`} className="card flex items-center justify-between gap-4 !p-4 hover:border-ink">
        <span>
          <span className="heading font-display text-xl font-semibold">{person.name}</span>
          <span className="mt-0.5 block text-sm text-muted">
            Sun in {signName(person.chart.bodies.sun.lon)} · Venus in {signName(person.chart.bodies.venus.lon)}
            {years && ` · ${years}`}
            {!person.birth.time && " · no birth time"}
          </span>
        </span>
        <span className="text-rose" aria-hidden="true">→</span>
      </Link>
    </li>
  );
}
