"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Layers, NotebookPen, Sparkles } from "lucide-react";
import { BODIES, fmtDeg, ordinal, signOf } from "@/lib/astro";
import type { TargetId, TimelineContact } from "@/lib/astro/timeline";
import {
  HOUSE_TOPICS, activeOn, changesAt, changesSince, clusterThemes, clusterTitle, clustersAt, heightened, lifecycleOf, rankHouses, rankPoints, scale,
  type ActivationModel, type Change, type Cluster,
} from "@/lib/astro/activation";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/tabs";
import { Sheet } from "@/components/ui/dialog";
import { DAY, Glyphs, contactLabel, fmt, fmtShort } from "./labels";

export const dayIso = (m: ActivationModel, d: number) => new Date(Date.parse(m.tl.from) + d * DAY).toISOString().slice(0, 10);
const atMs = (m: ActivationModel, d: number) => Date.parse(m.tl.from) + d * DAY + DAY / 2;
const isoOf = (ms: number) => new Date(ms).toISOString();
const isAngle = (id: TargetId) => id === "asc" || id === "mc";

export function TrendTag({ trend }: { trend: "rising" | "easing" | "steady" }) {
  if (trend === "rising") return <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent"><ArrowUpRight className="size-3" />Rising</span>;
  if (trend === "easing") return <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-sage-dark"><ArrowDownRight className="size-3" />Easing</span>;
  return <span className="inline-flex items-center gap-0.5 text-[11px] text-muted"><ArrowRight className="size-3" />Steady</span>;
}

export function placementOf(m: ActivationModel, id: TargetId) {
  const p = m.natal.byId.get(id);
  if (!p) return "";
  const where = id === "asc" ? "the 1st-house cusp" : id === "mc" ? "the 10th-house cusp" : p.house ? `${ordinal(p.house)} house` : "";
  return `${fmtDeg(p.lon)} ${signOf(p.lon).name}${where ? ` · ${where}` : ""}`;
}
export function rulesOf(m: ActivationModel, id: TargetId) {
  const r = m.natal.ruledBy(id);
  return r.length ? `Rules the ${r.map(ordinal).join(" & ")}` : "";
}

// ---------------------------------------------------------------------------
// Overview: planets, houses, what's changing

export function ActivationOverview({ m, d, lastSession, onOpenContact, onPoint, onHouse }: { m: ActivationModel; d: number; lastSession: { date: string; type: string } | null; onOpenContact: (c: TimelineContact) => void; onPoint: (id: TargetId) => void; onHouse: (h: number) => void }) {
  const points = rankPoints(m, d);
  const houses = rankHouses(m, d);
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.05fr_1fr_1fr]">
      <Card>
        <CardHeader title="Planets" description="Natal planets and angles, ranked by how strongly they’re activated on this date." />
        <CardBody className="pt-0">
          <ul className="space-y-0.5">
            {points.slice(0, 8).map((p) => {
              const rules = rulesOf(m, p.id);
              const house = m.natal.byId.get(p.id)?.house;
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => onPoint(p.id)} className="grid w-full grid-cols-[22px_minmax(0,1fr)_36px] items-center gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-canvas-2">
                    <span className={cn("text-center text-ink", isAngle(p.id) ? "text-[10px] font-semibold" : "glyph text-[17px]")} aria-hidden>{BODIES[p.id].glyph}</span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-medium text-ink">
                        Natal {BODIES[p.id].name}
                        {p.id === m.natal.chartRuler && <Badge tone="sage">Chart Ruler</Badge>}
                        <TrendTag trend={p.trend} />
                      </span>
                      <span className="block text-[11.5px] text-muted">{isAngle(p.id) ? "Angle" : house ? `${ordinal(house)} house` : ""}{rules ? ` · ${rules}` : ""}</span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-canvas-2"><span className="block h-full rounded-full bg-accent" style={{ width: `${p.score}%` }} /></span>
                    </span>
                    <span className="text-right text-[15px] font-semibold tabular-nums text-ink">{p.score}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11.5px] text-muted">100 = the strongest any point reaches in this range.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Houses" description={m.natal.hasHouses ? "Contacts to the planets in each house, its ruler and its cusp. Select a house to see how its score is made." : "Houses need a known birth time."} />
        <CardBody className="pt-0">
          {m.natal.hasHouses && (
            <div className="grid grid-cols-4 gap-1.5">
              {houses.map((h) => (
                <button
                  key={h.house}
                  type="button"
                  onClick={() => onHouse(h.house)}
                  className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-line px-2 py-1.5 text-left hover:border-line-strong"
                  style={{ background: `rgb(var(--accent) / ${(h.score / 100) * 0.2})` }}
                >
                  <span className="flex justify-between text-[11px] text-muted"><span>{ordinal(h.house)}</span><span className="glyph">{m.natal.houseRulers(h.house).map((r) => BODIES[r].glyph).join("")}</span></span>
                  <span className="text-[18px] font-semibold tabular-nums text-ink">{h.score}</span>
                  <span className="truncate text-[10.5px] text-muted">{HOUSE_TOPICS[h.house - 1]}</span>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <WhatsChanging m={m} d={d} lastSession={lastSession} onOpenContact={onOpenContact} />
    </div>
  );
}

function WhatsChanging({ m, d, lastSession, onOpenContact }: { m: ActivationModel; d: number; lastSession: { date: string; type: string } | null; onOpenContact: (c: TimelineContact) => void }) {
  const [mode, setMode] = React.useState<"now" | "since">("now");
  const lastIdx = lastSession ? Math.floor((Date.parse(`${lastSession.date}T00:00:00Z`) - Date.parse(m.tl.from)) / DAY) : null;
  const canSince = lastIdx !== null && lastIdx >= 0 && lastIdx < d;
  const now = React.useMemo(() => changesAt(m, d), [m, d]);
  const since = React.useMemo(() => (canSince ? changesSince(m, lastIdx!, d) : null), [m, d, canSince, lastIdx]);
  const col = (title: string, tone: string, items: { c: TimelineContact; note: string }[]) => (
    <div>
      <p className={cn("mb-1 flex justify-between text-[11.5px] font-semibold uppercase tracking-wide", tone)}>
        {title} <span className="tabular-nums text-muted">{items.length}</span>
      </p>
      {items.length === 0 ? (
        <p className="px-1.5 text-[12px] text-muted">Nothing in this group.</p>
      ) : (
        <ul>
          {items.slice(0, 5).map(({ c, note }) => (
            <li key={c.id}>
              <button type="button" onClick={() => onOpenContact(c)} className="grid w-full grid-cols-[56px_minmax(0,1fr)] items-baseline gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] hover:bg-canvas-2">
                <Glyphs c={c} size={13} />
                <span className="text-ink">{contactLabel(c)} <span className="text-[11.5px] text-muted">· {note}</span></span>
              </button>
            </li>
          ))}
          {items.length > 5 && <li className="px-1.5 text-[11.5px] text-muted">+{items.length - 5} more</li>}
        </ul>
      )}
    </div>
  );
  const days = (t: number) => Math.round((t - atMs(m, d)) / DAY);
  const changeNote = (x: Change, kind: "i" | "s" | "e") =>
    kind === "i" ? `exact ${fmtShort(isoOf(x.at))} (${days(x.at)} days)` : kind === "s" ? `${x.final ? "final pass, leaves orb" : "out of orb"} ${fmtShort(isoOf(x.at))}` : x.contact.events ? fmtShort(isoOf(x.at)) : `enters orb ${fmtShort(isoOf(x.at))}`;
  return (
    <Card className="lg:col-span-2 xl:col-span-1">
      <CardHeader
        title="What’s Changing"
        description={mode === "now" ? "What’s building, fading and about to begin, from the As Of date." : `Since the last consultation${lastSession ? `, ${lastSession.type}, on ${fmt(lastSession.date)}` : ""}.`}
        action={canSince ? <Segmented size="sm" value={mode} onChange={setMode} options={[{ value: "now", label: "From This Date" }, { value: "since", label: "Since Last Session" }]} /> : undefined}
      />
      <CardBody className="space-y-3 pt-0">
        {mode === "now" || !since ? (
          <>
            {col("Intensifying", "text-accent", now.intensifying.map((x) => ({ c: x.contact, note: changeNote(x, "i") })))}
            {col("Separating", "text-sage-dark", now.separating.map((x) => ({ c: x.contact, note: changeNote(x, "s") })))}
            {col("Emerging", "text-warn", now.emerging.map((x) => ({ c: x.contact, note: changeNote(x, "e") })))}
          </>
        ) : (
          <>
            {col("New Since Then", "text-accent", since.started.map((c) => ({ c, note: "now in orb" })))}
            {col("Ended Since Then", "text-sage-dark", since.ended.map((c) => ({ c, note: "no longer in orb" })))}
            {col("Still Active", "text-warn", since.continuing.map((c) => ({ c, note: lifecycleOf(c, atMs(m, d))?.phase.toLowerCase() ?? "in orb" })))}
          </>
        )}
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Point and house detail

function History({ ids }: { ids: TargetId[] }) {
  const observations = useStore((s) => s.observations);
  const clientId = React.useContext(ClientContext);
  const list = observations.filter((o) => o.clientId === clientId && o.planets.some((p) => ids.includes(p as TargetId))).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  return (
    <section>
      <h3 className="mb-2 text-[13px] font-semibold text-ink">From This Client’s History</h3>
      {list.length === 0 ? (
        <p className="text-[12.5px] text-muted">No earlier notes mention {ids.length > 1 ? "these planets" : `natal ${BODIES[ids[0]!].name}`}.</p>
      ) : (
        <ul className="space-y-2">
          {list.slice(0, 4).map((o) => {
            const reported = o.tags.includes("client-reported");
            return (
              <li key={o.id} className="rounded-lg border border-line px-3 py-2 text-[12.5px]">
                <p className={cn("text-[11px] font-semibold", reported ? "text-sage-dark" : "text-accent")}>{reported ? "Client Reported" : "Your Observation"} · {fmt(o.createdAt.slice(0, 10))}</p>
                <p className="font-medium text-ink">{o.title || "Untitled"}</p>
                <p className="line-clamp-2 text-muted">{o.body.replace(/<[^>]+>/g, " ").slice(0, 200)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** The client whose timeline is shown, for the history lookups. */
export const ClientContext = React.createContext<string>("");

export function PointSheet({ m, d, id, onClose, onOpenContact, onNote }: { m: ActivationModel; d: number; id: TargetId; onClose: () => void; onOpenContact: (c: TimelineContact) => void; onNote: (targets: TargetId[], title: string) => void }) {
  const s = m.ps(id);
  const sp = heightened(s, d);
  const cs = activeOn(m, d, (c) => c.target === id);
  const config = m.natal.points.filter((p) => p.id !== id && m.natal.natalAspect(id, p.id) && (s[d] ?? 0) > 0 && (m.ps(p.id)[d] ?? 0) > 0);
  const rules = rulesOf(m, id);
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Natal ${BODIES[id].name}`}
      description={`${placementOf(m, id)}${rules ? ` · ${rules}` : ""}${id === m.natal.chartRuler ? " · Chart ruler" : ""}`}
      footer={<Button variant="secondary" onClick={() => onNote([id], `Natal ${BODIES[id].name}`)}><NotebookPen /> Add Note About Natal {BODIES[id].name}</Button>}
    >
      <div className="space-y-5 px-6 py-5">
        <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]">
          <dt className="text-muted">Activation</dt>
          <dd><b className="text-[20px] tabular-nums">{scale(s[d] ?? 0, m.pointMax)}</b> / 100 on {fmt(dayIso(m, d))} <TrendTag trend={rankPoints(m, d).find((x) => x.id === id)!.trend} /></dd>
          <dt className="text-muted">Heightened</dt>
          <dd>{sp ? `${fmt(dayIso(m, sp[0]))} – ${fmt(dayIso(m, sp[1]))}${sp[0] > d ? " (upcoming)" : ""}` : "Not in this range"}<span className="block text-[11.5px] text-muted">When its score is at least half its peak for this range.</span></dd>
          {config.length > 0 && (
            <>
              <dt className="text-muted">Configuration</dt>
              <dd>Also activated now: {config.map((p) => `natal ${BODIES[p.id].name} (${m.natal.natalAspect(id, p.id)} natally)`).join(", ")}.</dd>
            </>
          )}
        </dl>
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-ink">Contributing Contacts</h3>
          {cs.length === 0 ? (
            <p className="text-[12.5px] text-muted">Nothing in orb on this date with the current filter.</p>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted"><th className="py-1.5 font-medium">Contact</th><th className="py-1.5 font-medium">Phase</th><th className="py-1.5 text-right font-medium">Points</th></tr></thead>
              <tbody>
                {cs.map((c) => (
                  <tr key={c.id} className="border-b border-line/70">
                    <td className="py-1.5 pr-2"><button type="button" className="text-left text-ink hover:text-accent" onClick={() => onOpenContact(c)}><Glyphs c={c} size={13} /> {contactLabel(c)}</button></td>
                    <td className="py-1.5 pr-2 text-muted">{c.events ? "Eclipse season" : lifecycleOf(c, atMs(m, d))?.phase}</td>
                    <td className="py-1.5 text-right tabular-nums">{scale(m.series.get(c.id)![d] ?? 0, m.pointMax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-2 text-[11.5px] text-muted">Points: each contact’s intensity on this date (planet and aspect weight × how close to exact), on the same 0–100 scale.</p>
        </section>
        <History ids={[id]} />
      </div>
    </Sheet>
  );
}

export function HouseSheet({ m, d, h, onClose, onOpenContact }: { m: ActivationModel; d: number; h: number; onClose: () => void; onOpenContact: (c: TimelineContact) => void }) {
  const parts = m.houseParts(h, d);
  const total = parts.reduce((a, p) => a + p.value, 0);
  const s = m.houseSeries[h - 1]!;
  const sp = heightened(s, d);
  const occ = m.natal.occupants(h);
  const rulers = m.natal.houseRulers(h);
  const ids: TargetId[] = [...occ, ...rulers, ...(h === 1 ? (["asc"] as TargetId[]) : h === 10 ? (["mc"] as TargetId[]) : [])];
  const cs = activeOn(m, d, (c) => ids.includes(c.target));
  const kind = { occupant: "Planet in the house", ruler: "Ruler", "modern-ruler": "Modern ruler", cusp: "Cusp" } as const;
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={`${ordinal(h)} House`} description={`${HOUSE_TOPICS[h - 1]} · cusp ${fmtDeg(m.natal.cusps![h - 1]!)} ${signOf(m.natal.cusps![h - 1]!).name}`}>
      <div className="space-y-5 px-6 py-5">
        <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]">
          <dt className="text-muted">Activation</dt>
          <dd><b className="text-[20px] tabular-nums">{scale(total, m.houseMax)}</b> / 100 on {fmt(dayIso(m, d))}</dd>
          <dt className="text-muted">Ruler</dt>
          <dd>{rulers.map((r, i) => <span key={r} className="block">{BODIES[r].name}{i ? " (modern)" : ""}, {placementOf(m, r)}</span>)}{rulers[0] === m.natal.chartRuler && <Badge tone="sage">Also the Chart Ruler</Badge>}</dd>
          <dt className="text-muted">In the House</dt>
          <dd>{occ.length ? occ.map((o) => <span key={o} className="block">{BODIES[o].name} {placementOf(m, o).split(" · ")[0]}</span>) : "No planets"}</dd>
          <dt className="text-muted">Heightened</dt>
          <dd>{sp ? `${fmt(dayIso(m, sp[0]))} – ${fmt(dayIso(m, sp[1]))}${sp[0] > d ? " (upcoming)" : ""}` : "Not in this range"}</dd>
        </dl>
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-ink">How the Score Is Made</h3>
          <table className="w-full text-[12.5px]">
            <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted"><th className="py-1.5 font-medium">Through</th><th className="py-1.5 font-medium">Point</th><th className="py-1.5 text-right font-medium">Weight</th><th className="py-1.5 text-right font-medium">Points</th></tr></thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.kind + p.id} className="border-b border-line/70">
                  <td className="py-1.5">{p.kind === "cusp" ? (p.id === "asc" ? "Cusp (Ascendant)" : "Cusp (Midheaven)") : kind[p.kind]}</td>
                  <td className="py-1.5">{BODIES[p.id].name}</td>
                  <td className="py-1.5 text-right tabular-nums">×{p.factor}</td>
                  <td className="py-1.5 text-right tabular-nums">{scale(p.value, m.houseMax)}</td>
                </tr>
              ))}
              <tr><td className="py-1.5 font-semibold" colSpan={3}>Total</td><td className="py-1.5 text-right font-semibold tabular-nums">{scale(total, m.houseMax)}</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-[11.5px] text-muted">Contacts to a planet in the house, to the house’s ruler (modern rulers at half weight) and, for the 1st and 10th, to the Ascendant or Midheaven.</p>
        </section>
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-ink">Contacts Behind It</h3>
          {cs.length === 0 ? <p className="text-[12.5px] text-muted">Nothing in orb on this date with the current filter.</p> : (
            <ul>
              {cs.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => onOpenContact(c)} className="grid w-full grid-cols-[56px_minmax(0,1fr)] gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] hover:bg-canvas-2">
                    <Glyphs c={c} size={13} />
                    <span>{contactLabel(c)} <span className="text-muted">· via {occ.includes(c.target as never) ? "a planet in the house" : isAngle(c.target) ? "the cusp" : "the ruler"}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <History ids={ids} />
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Convergence analysis

export function ConvergenceAnalysis({ m, d, onOpenContact, onNote }: { m: ActivationModel; d: number; onOpenContact: (c: TimelineContact) => void; onNote: (targets: TargetId[], title: string) => void }) {
  const clusters = React.useMemo(() => clustersAt(m, d), [m, d]);
  if (clusters.length === 0)
    return (
      <Card>
        <CardBody className="text-[13px] text-muted">No two active contacts share a natal point, ruler or natal aspect on this date with the current filter. Try “All Contacts”, or another date.</CardBody>
      </Card>
    );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {clusters.map((cl) => <ClusterCard key={cl.targets.join("+")} m={m} cl={cl} onOpenContact={onOpenContact} onNote={onNote} />)}
    </div>
  );
}

function ClusterCard({ m, cl, onOpenContact, onNote }: { m: ActivationModel; cl: Cluster; onOpenContact: (c: TimelineContact) => void; onNote: (targets: TargetId[], title: string) => void }) {
  const title = clusterTitle(cl);
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{fmtShort(dayIso(m, cl.span[0]))} – {fmt(dayIso(m, cl.span[1]))} · {cl.contacts.length} Contacts</p>
      <h3 className="font-serif text-[20px] leading-snug text-ink">{title}</h3>
      <p className="text-[12.5px] text-muted">
        {cl.targets.map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && " · "}
            Natal {BODIES[t].name} <span className="text-[11.5px]">({isAngle(t) ? "angle" : `${m.natal.byId.get(t)?.house ? ordinal(m.natal.byId.get(t)!.house!) : ""}${m.natal.ruledBy(t).length ? `, rules ${m.natal.ruledBy(t).map(ordinal).join(" & ")}` : ""}`})</span>
          </React.Fragment>
        ))}
      </p>
      <div className="space-y-2 text-[12.5px]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Contributing Configurations</p>
        <ul className="space-y-1">
          {cl.contacts.slice(0, 5).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-2">
              <button type="button" onClick={() => onOpenContact(c)} className="text-left text-ink hover:text-accent"><Glyphs c={c} size={13} /> {contactLabel(c)}</button>
              <Badge tone={c.layer === "background" ? "outline" : "accent"}>{c.layer === "background" ? "Background" : "Trigger"}</Badge>
            </li>
          ))}
          {cl.contacts.length > 5 && <li className="text-muted">+{cl.contacts.length - 5} more</li>}
        </ul>
        {cl.links.length > 0 && (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">How They Connect</p>
            <ul className="list-disc space-y-0.5 pl-4">{cl.links.map((l) => <li key={l.b}>{l.why.join("; ").replace(/^n/, "N")}</li>)}</ul>
          </>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Timing</p>
        <p>
          {cl.techniques.length > 1 ? <b className="font-medium">{cl.techniques.length} techniques agree ({cl.techniques.join(", ")}). </b> : `${cl.techniques[0]!.charAt(0).toUpperCase()}${cl.techniques[0]!.slice(1)} only. `}
          Together in orb {fmt(dayIso(m, cl.span[0]))} – {fmt(dayIso(m, cl.span[1]))} ({cl.span[1] - cl.span[0] + 1} days).
        </p>
      </div>
      <div className="rounded-lg bg-canvas-2 px-3 py-2.5 text-[13px] text-ink-3">
        <p className="mb-1 flex items-center gap-2 text-[11.5px] font-semibold text-ink"><Layers className="size-3.5" /> Themes <span className="font-normal text-muted">From planet and house meanings</span></p>
        {clusterThemes(cl)}
      </div>
      <p className="flex items-start gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2 text-[12px] text-muted">
        <Sparkles className="mt-0.5 size-3.5 shrink-0" /> A combined AI interpretation of the whole configuration is planned. It will be labeled as an AI draft until you edit it.
      </p>
      <History ids={cl.targets} />
      <div>
        <Button size="sm" variant="secondary" onClick={() => onNote(cl.targets, title)}><NotebookPen /> Add Note to This Configuration</Button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Background influences

export function BackgroundInfluences({ m, d, onOpenContact }: { m: ActivationModel; d: number; onOpenContact: (c: TimelineContact) => void }) {
  const list = m.tl.contacts.filter((c) => c.layer === "background" && c.windows.length).sort((a, b) => b.weight - a.weight);
  const a = Date.parse(m.tl.from), b = Date.parse(m.tl.to);
  const pct = (iso: string) => Math.min(100, Math.max(0, ((Date.parse(iso) - a) / (b - a)) * 100));
  return (
    <Card>
      <CardHeader icon={<Layers />} title="Background Influences" description="The long cycles that set the tone of the period: slow transits, progressions and solar arcs. Duration is shown separately from intensity." />
      {list.length === 0 ? (
        <CardBody className="text-[13px] text-muted">No background influences in this range.</CardBody>
      ) : (
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[720px] text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-2 font-medium">Influence</th><th className="py-2 font-medium">In Orb</th><th className="py-2 text-right font-medium">Exact Passes</th><th className="py-2 text-right font-medium">Days in Range</th><th className="py-2 text-right font-medium">Intensity</th><th className="w-[200px] px-5 py-2 font-medium">This Range</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const L = lifecycleOf(c, atMs(m, d))!;
                return (
                  <tr key={c.id} className="border-b border-line/70 hover:bg-canvas-2">
                    <td className="px-5 py-1.5"><button type="button" onClick={() => onOpenContact(c)} className="text-left text-ink hover:text-accent"><Glyphs c={c} size={13} /> {contactLabel(c)}</button></td>
                    <td className="py-1.5 text-ink-3">{L.firstOpen ? "Before " : ""}{fmt(isoOf(L.first))} – {fmt(isoOf(L.last))}{L.lastOpen ? " +" : ""}</td>
                    <td className="py-1.5 text-right tabular-nums">{L.exacts.length}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.durationDays}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.weight.toFixed(1)}</td>
                    <td className="px-5 py-1.5">
                      <span className="relative block h-3">
                        {c.windows.map((w, i) => <span key={i} className="absolute top-1 h-1.5 rounded-full bg-ink/25" style={{ left: `${pct(w.start)}%`, width: `${Math.max(0.6, pct(w.end) - pct(w.start))}%` }} />)}
                        {L.exacts.map((x) => <span key={x.t} className="absolute top-0.5 size-2 -translate-x-1/2 rotate-45 bg-ink" style={{ left: `${pct(isoOf(x.t))}%` }} />)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle, inside the contact sheet

/** "1 year, 6 months" / "5 months" / "12 days". */
const fmtSpan = (ms: number) => {
  const d = Math.round(ms / DAY);
  if (d < 60) return `${d} days`;
  const months = Math.round(d / 30.44);
  const y = Math.floor(months / 12), m = months % 12;
  return [y && `${y} year${y > 1 ? "s" : ""}`, m && `${m} month${m > 1 ? "s" : ""}`].filter(Boolean).join(", ") + ` (${d} days)`;
};

export function LifecycleSection({ c, at, full }: { c: TimelineContact; at: number; full: TimelineContact | null | "loading" }) {
  const src = full && full !== "loading" ? full : c;
  const L = lifecycleOf(src, at);
  if (!L) return null;
  const t = (ms: number) => fmt(isoOf(ms));
  const days = (ms: number) => Math.round((ms - at) / DAY);
  return (
    <section>
      <h3 className="mb-2 text-[13px] font-semibold text-ink">Lifecycle</h3>
      <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-lg border border-line p-3 text-[12.5px]">
        <dt className="text-muted">First Entered Orb</dt>
        <dd>{L.firstOpen ? `Before ${t(L.first)}` : t(L.first)}</dd>
        <dt className="text-muted">Exact Contacts</dt>
        <dd>{L.exacts.length ? L.exacts.map((x, i) => <span key={x.t} className="block">{i + 1}. {t(x.t)}{x.retrograde ? " · Retrograde" : ""}{x.t < at ? <span className="text-muted"> (past)</span> : ""}</span>) : "None: it comes close without perfecting"}</dd>
        {L.stations.length > 0 && (<><dt className="text-muted">Stations</dt><dd>{L.stations.map((s) => <span key={s.t} className="block">Turns {s.kind} {t(s.t)}</span>)}</dd></>)}
        <dt className="text-muted">On {fmtShort(isoOf(at))}</dt>
        <dd><span className="font-medium">{L.phase}</span>{L.next && <span className="block">Next exact {t(L.next.t)} · in {days(L.next.t)} days</span>}</dd>
        <dt className="text-muted">Final Exit From Orb</dt>
        <dd>{t(L.last)}{L.lastOpen ? " or later" : ""}{L.last > at && <span className="text-muted"> · {days(L.last)} days from then</span>}</dd>
        <dt className="text-muted">Whole Period</dt>
        <dd>{fmtSpan(L.last - L.first)}{L.firstOpen || L.lastOpen ? " or more" : ""} · {src.windows.length} pass{src.windows.length === 1 ? "" : "es"} through orb</dd>
        <dt className="text-muted">Layer</dt>
        <dd>{c.layer === "background" ? "Background influence" : "Short-term trigger"} · intensity weight {c.weight}</dd>
      </dl>
      <p className="mt-1.5 text-[11.5px] text-muted">{full === "loading" ? "Looking beyond this range for the full cycle…" : full ? "The whole cycle around the As Of date: passes less than a year apart, looking up to three years either way." : "Within this range only."}</p>
    </section>
  );
}

/** Open a timing chart with a new observation about these natal points, filed for the As Of date. */
export function useConfigurationNote(clientId: string, personId: string, clientName: string, asOf: string) {
  const router = useRouter();
  const addChart = useStore((s) => s.addChart);
  return (targets: TargetId[], title: string) => {
    const ch = addChart({ title: `${clientName.split(" ")[0]} — ${title} (${fmtShort(asOf)})`, type: "transits", personIds: [personId], clientId, refDate: asOf });
    const q = new URLSearchParams({ note: "1", title, planets: targets.filter((t) => t !== "asc" && t !== "mc").join(",") });
    router.push(`/app/charts/${ch.id}?${q}`);
  };
}
