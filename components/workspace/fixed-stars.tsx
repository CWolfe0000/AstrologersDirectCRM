"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { BODIES, fmtDeg, signOf, type BodyId, type ChartView } from "@/lib/astro";
import type { ZodiacType } from "@/lib/astro/types";
import { lots } from "@/lib/astro/traditional";
import { starContacts } from "@/lib/astro/fixed-stars";
import { DATA_MODE } from "@/lib/utils";
import { Breakdown, BTable } from "@/components/ui/breakdown";

type Star = { name: string; lon: number; lat: number; mag: number | null };
const cache = new Map<string, Promise<Star[]>>();
const pointName = (k: string) => BODIES[k as BodyId]?.name ?? (k === "fortune" ? "Part of Fortune" : k);

/** Fixed stars conjunct the chart's planets and angles, from the Swiss Ephemeris star catalog. */
export function FixedStars({ view, utc, zodiac = "tropical" }: { view: ChartView; utc: string; zodiac?: ZodiacType }) {
  const [stars, setStars] = React.useState<Star[] | null | "error">(null);
  React.useEffect(() => {
    if (DATA_MODE !== "server") return;
    const key = `${utc}|${zodiac}`;
    let p = cache.get(key);
    if (!p) {
      p = api<{ stars: Star[] }>("/api/v1/astro/stars", { body: { utc, settings: { zodiac } } }).then((r) => r.stars);
      cache.set(key, p);
    }
    let live = true;
    p.then((s) => live && setStars(s), () => { cache.delete(key); if (live) setStars("error"); });
    return () => { live = false; };
  }, [utc, zodiac]);

  if (DATA_MODE !== "server") return null;
  const contacts = stars && stars !== "error" ? starContacts(view.inner, stars, { fortune: lots(view.inner).fortune }) : [];
  return (
    <section>
      <h3 className="mb-2 text-[13px] font-semibold text-ink">Fixed Stars</h3>
      {stars === null ? (
        <p className="flex items-center gap-2 text-[12.5px] text-muted"><Loader2 className="size-4 animate-spin" /> Finding star positions…</p>
      ) : stars === "error" ? (
        <p className="text-[12.5px] text-muted">Star positions couldn’t be calculated.</p>
      ) : contacts.length === 0 ? (
        <p className="text-[12.5px] text-muted">No major star within orb of a planet or angle.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c, i) => (
            <li key={i} className="rounded-lg border border-line px-3 py-2 text-[12.5px]">
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-ink">{c.star.name} on {pointName(c.point)}</span>
                <span className="shrink-0 tabular-nums text-muted">{c.orb.toFixed(2)}°</span>
              </p>
              <p className="text-muted">{c.star.keywords}. <span className="text-[11.5px]">Nature: {c.star.nature}.</span></p>
            </li>
          ))}
        </ul>
      )}
      {stars && stars !== "error" && (
        <Breakdown className="mt-2">
          <BTable className="min-w-0" head={["Star", "Position", "Latitude", "Magnitude"]} rows={stars.filter((s) => contacts.some((c) => c.star.name === s.name)).map((s) => [s.name, `${fmtDeg(s.lon)} ${signOf(s.lon).name}`, `${s.lat.toFixed(1)}°`, s.mag?.toFixed(2) ?? "–"])} />
          <p>Positions of date from the Swiss Ephemeris star catalog (sefstars.txt), {stars.length} traditional stars. A star counts when its ecliptic longitude is within 1.5° of a luminary or angle, or 1° of a planet or the Part of Fortune; latitude isn’t used, and parans aren’t computed. Natures follow Ptolemy; the keywords are the traditional associations (Robson, Brady), a starting point rather than a verdict.</p>
        </Breakdown>
      )}
    </section>
  );
}
