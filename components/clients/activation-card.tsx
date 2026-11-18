"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Waves } from "lucide-react";
import { BODIES, DEFAULT_TIMELINE, ordinal } from "@/lib/astro";
import { fetchTimeline, type TimelineResponse } from "@/lib/astro/timeline-client";
import { HOUSE_TOPICS, activationModel, changesSince, dayIndex, lifecycleOf, nextExact, rankHouses, rankPoints } from "@/lib/astro/activation";
import type { Person } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { usePremium } from "@/components/plan/premium";
import { contactLabel, DAY, fmt, fmtShort } from "@/components/timeline/labels";

const cache = new Map<string, Promise<TimelineResponse>>();

/** A small "what's active now" summary for the client's profile, linking to the full timeline. */
export function ActivationCard({ clientId, person }: { clientId: string; person: Person }) {
  const premium = usePremium();
  const defaults = useStore((s) => s.defaults);
  const consultations = useStore((s) => s.consultations);
  const sessions = React.useMemo(() => consultations.filter((k) => k.clientId === clientId && k.status !== "cancelled").sort((a, b) => (a.start < b.start ? -1 : 1)), [consultations, clientId]);
  const last = sessions.filter((k) => k.start.slice(0, 10) < TODAY).pop() ?? null;
  const next = sessions.find((k) => k.status === "scheduled" && Date.parse(k.start) > Date.now()) ?? null;
  const [data, setData] = React.useState<TimelineResponse | null | "error">(null);

  const back = new Date(Date.parse(`${TODAY}T00:00:00Z`) - 60 * DAY).toISOString().slice(0, 10);
  const from = last && last.start.slice(0, 10) < back && last.start.slice(0, 10) > new Date(Date.parse(`${TODAY}T00:00:00Z`) - 700 * DAY).toISOString().slice(0, 10) ? last.start.slice(0, 10) : back;
  const to = new Date(Date.parse(`${TODAY}T00:00:00Z`) + 365 * DAY).toISOString().slice(0, 10);
  const opts = defaults.timeline ?? DEFAULT_TIMELINE;
  const key = person.birth?.date ? JSON.stringify([person.birth, defaults.zodiac, defaults.houseSystem, from, to, opts]) : null;

  React.useEffect(() => {
    if (!premium || !key) return;
    let p = cache.get(key);
    if (!p) {
      p = fetchTimeline(person.birth, { ...defaults, timeline: undefined }, from, to, opts);
      cache.set(key, p);
    }
    let live = true;
    p.then((x) => live && setData(x), () => { cache.delete(key); if (live) setData("error"); });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, premium]);

  const model = React.useMemo(() => (data && data !== "error" ? activationModel(data.timeline, "moderate") : null), [data]);
  if (!premium || !key) return null;

  return (
    <Card>
      <CardHeader
        title="Current Activation"
        icon={<Waves />}
        description={`As of ${fmt(TODAY)}${next ? ` · next session ${fmtShort(next.start.slice(0, 10))}` : ""}`}
        action={<Link href={`/app/timeline?client=${clientId}`} className="text-[12.5px] font-medium text-accent hover:underline">Open Timeline</Link>}
      />
      <CardBody className="space-y-4 pt-0">
        {data === "error" ? (
          <p className="text-[13px] text-muted">The timeline couldn’t be calculated just now.</p>
        ) : !model ? (
          <p className="flex items-center gap-2 text-[13px] text-muted"><Loader2 className="size-4 animate-spin" /> Calculating…</p>
        ) : (
          <Summary model={model} lastDate={last?.start.slice(0, 10) ?? null} clientId={clientId} />
        )}
      </CardBody>
    </Card>
  );
}

function Summary({ model: m, lastDate, clientId }: { model: ReturnType<typeof activationModel>; lastDate: string | null; clientId: string }) {
  const d = Math.max(0, Math.min(m.nDays - 1, dayIndex(m.tl, TODAY)));
  const at = Date.parse(`${TODAY}T12:00:00Z`);
  const points = rankPoints(m, d).filter((p) => p.score > 0).slice(0, 3);
  const houses = m.natal.hasHouses ? rankHouses(m, d).sort((a, b) => b.score - a.score).filter((h) => h.score > 0).slice(0, 3) : [];
  const fromIdx = lastDate ? Math.max(0, dayIndex(m.tl, lastDate)) : Math.max(0, d - 60);
  const since = changesSince(m, fromIdx, d);
  const nx = nextExact(m, at);
  const bg = m.tl.contacts.filter((c) => c.layer === "background" && (m.series.get(c.id)![d] ?? 0) > 0).sort((a, b) => m.series.get(b.id)![d]! - m.series.get(a.id)![d]!)[0];
  const href = `/app/timeline?client=${clientId}`;
  const pill = "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 text-[12.5px] text-ink hover:bg-canvas-2";
  const names = (cs: typeof since.started) => (cs.length ? `${cs.slice(0, 2).map(contactLabel).join(", ")}${cs.length > 2 ? ` +${cs.length - 2}` : ""}` : null);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Strongest Planets</p>
          <div className="flex flex-wrap gap-1.5">
            {points.length ? points.map((p) => (
              <Link key={p.id} href={href} className={pill}><span className="glyph" aria-hidden>{BODIES[p.id].glyph}</span>{BODIES[p.id].name} <b className="tabular-nums text-accent">{p.score}</b></Link>
            )) : <span className="text-[12.5px] text-muted">Quiet</span>}
          </div>
        </div>
        {m.natal.hasHouses && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Strongest Houses</p>
            <div className="flex flex-wrap gap-1.5">
              {houses.length ? houses.map((h) => (
                <Link key={h.house} href={href} className={pill}>{ordinal(h.house)} · {HOUSE_TOPICS[h.house - 1]!.split(/,| &/)[0]} <b className="tabular-nums text-accent">{h.score}</b></Link>
              )) : <span className="text-[12.5px] text-muted">Quiet</span>}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1 text-[12.5px]">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Since the Last Session{lastDate ? ` (${fmtShort(lastDate)})` : ""}</p>
        <p><span className="text-muted">New:</span> {names(since.started) ?? "nothing new"}</p>
        <p><span className="text-muted">Ended:</span> {names(since.ended) ?? "nothing has ended"}</p>
        {nx && <p><span className="text-muted">Next exact:</span> {contactLabel(nx.contact)} · {fmtShort(new Date(nx.t).toISOString())} <span className="text-muted">({Math.round((nx.t - at) / DAY)} days)</span></p>}
        {bg && <p><span className="text-muted">Background:</span> {contactLabel(bg)} <span className="text-muted">until {fmtShort(new Date(lifecycleOf(bg, at)!.last).toISOString())}</span></p>}
      </div>
      <p className="text-[11.5px] text-muted">Major and moderate influences. Scores run from 0 to 100, where 100 is the strongest activation from the last session to a year ahead.</p>
    </>
  );
}
