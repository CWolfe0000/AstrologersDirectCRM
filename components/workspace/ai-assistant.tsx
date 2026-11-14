"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, Calculator, Quote, Sparkles, NotebookPen, Loader2 } from "lucide-react";
import { ASPECTS, BODIES, PLANET_IDS, bodyIn, dignityOf, fmtDeg, fmtOrb, signOf, type BodyId, type ChartView } from "@/lib/astro";
import type { ChartRecord, Consultation, Observation, Person } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, fmtDate, stripHtml } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/ui/misc";
import { ownershipFor } from "@/components/observations/obs-meta";

type Reply = { calculated: string[]; observations: string[]; obsNote?: string; generated: string[]; topic: string };
type Msg = { role: "user"; text: string } | { role: "assistant"; reply: Reply };

const SUGGESTIONS = [
  "Summarise the Saturn configurations",
  "What have I written about the Moon before?",
  "Compare observations across consultations",
  "Organise my notes on this chart",
];

function ordinalHouse(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]!);
}

/**
 * SIMULATED assistant. Deterministic responses built only from (1) engine
 * output for this chart and (2) the practitioner's saved observations. The
 * "generated interpretation" text is templated — in production this would
 * call an LLM with the same three, separately-labelled sources.
 */
function respond(q: string, ctx: { chart: ChartRecord; view: ChartView; obs: Observation[]; people: Person[]; consultations: Consultation[] }): Reply {
  const { chart, view, obs, people, consultations } = ctx;
  const ql = q.toLowerCase();
  const subjectIds = chart.personIds;
  const relevant = obs.filter((o) => o.clientId === chart.clientId || o.personIds.some((p) => subjectIds.includes(p)));
  const name = (id?: string) => personName(people.find((p) => p.id === id));
  const planet = (PLANET_IDS as BodyId[]).find((p) => ql.includes(BODIES[p].name.toLowerCase()));

  const describe = (ring: "inner" | "outer", id: BodyId) => {
    const pts = ring === "outer" ? view.outer! : view.inner;
    const b = bodyIn(pts, id);
    if (!b) return null;
    const dig = dignityOf(id, b.lon);
    return `${ring === "outer" ? "Outer-wheel " : ""}${BODIES[id].name} ${fmtDeg(b.lon)} ${signOf(b.lon).name}${id !== "asc" && id !== "mc" ? `, ${ordinalHouse(b.house)} house` : ""}${b.speed < 0 ? ", retrograde" : ""}${dig && dig !== "Peregrine" ? ` (${dig.toLowerCase()})` : ""}`;
  };
  const aspectLine = (a: ChartView["aspects"][number]) =>
    `${a.aRing === "outer" ? "Outer " : ""}${BODIES[a.a].name} ${ASPECTS[a.type].name.toLowerCase()} ${a.bRing === "outer" ? "outer " : ""}${BODIES[a.b].name} — orb ${fmtOrb(a.orb)}, ${a.applying ? "applying" : "separating"}`;

  if (planet && !ql.includes("written")) {
    const asp = view.aspects.filter((a) => a.a === planet || a.b === planet).slice(0, 5);
    const calc = [describe("inner", planet), view.outer ? describe("outer", planet) : null, ...asp.map(aspectLine)].filter(Boolean) as string[];
    const about = relevant.filter((o) => o.planets.includes(planet));
    const tags = Array.from(new Set(about.flatMap((o) => o.tags))).slice(0, 4);
    const b = bodyIn(view.inner, planet);
    const tight = asp[0];
    const gen = [
      `${BODIES[planet].name} sits in the ${b ? ordinalHouse(b.house) : "—"} house in ${b ? signOf(b.lon).name : "—"}${tight ? `, and its tightest contact is the ${ASPECTS[tight.type].name.toLowerCase()} with ${BODIES[tight.a === planet ? tight.b : tight.a].name} (${fmtOrb(tight.orb)}${tight.applying ? ", applying" : ""}).` : ", with no major aspects inside current orbs."}`,
      about.length
        ? `Your earlier notes connect ${BODIES[planet].name} with ${tags.length ? tags.map((t) => `“${t}”`).join(", ") : "themes you've recorded"} — consider whether the current configuration brings that thread forward rather than starting a new one.`
        : `You haven't recorded observations about ${BODIES[planet].name} for these people yet; this may be worth a note after the session.`,
    ];
    return { topic: `${BODIES[planet].name} configurations`, calculated: calc, observations: about.map((o) => o.id), generated: gen };
  }

  if (planet || ql.includes("written") || ql.includes("before")) {
    const p = planet ?? "moon";
    const about = relevant.filter((o) => o.planets.includes(p)).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    const b = bodyIn(view.inner, p);
    return {
      topic: `Your notes on ${BODIES[p].name}`,
      calculated: [describe("inner", p)].filter(Boolean) as string[],
      observations: about.map((o) => o.id),
      obsNote: about.length ? `${about.length} saved observation${about.length === 1 ? "" : "s"} mention ${BODIES[p].name}, oldest first.` : undefined,
      generated: about.length
        ? [
            `Across ${about.length} note${about.length === 1 ? "" : "s"} from ${fmtDate(about[0]!.createdAt)} to ${fmtDate(about[about.length - 1]!.updatedAt)}, the recurring thread is ${Array.from(new Set(about.flatMap((o) => o.tags))).slice(0, 3).join(", ") || "the same placement"}.`,
            b ? `The ${BODIES[p].name} in the ${ordinalHouse(b.house)} house remains the anchor for these observations.` : "",
          ].filter(Boolean)
        : [`Nothing saved yet about ${BODIES[p].name} for ${chart.personIds.map(name).join(" & ")}.`],
    };
  }

  if (ql.includes("compare") || ql.includes("consultation")) {
    const withK = relevant.filter((o) => o.consultationId).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    const ks = Array.from(new Set(withK.map((o) => o.consultationId!)))
      .map((id) => consultations.find((k) => k.id === id))
      .filter(Boolean) as Consultation[];
    const tagCount = new Map<string, number>();
    withK.forEach((o) => o.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)));
    const recurring = [...tagCount.entries()].filter(([, n]) => n > 1).map(([t]) => t);
    return {
      topic: "Observations across consultations",
      calculated: view.aspects.slice(0, 3).map(aspectLine),
      observations: withK.map((o) => o.id),
      obsNote: ks.length ? `Linked to ${ks.length} consultation${ks.length === 1 ? "" : "s"}: ${ks.map((k) => `${k.type} (${fmtDate(k.start)})`).join("; ")}.` : undefined,
      generated: ks.length
        ? [
            recurring.length
              ? `Themes that recur across sessions: ${recurring.map((t) => `“${t}”`).join(", ")}. These have persisted, which suggests a structural pattern rather than a passing transit.`
              : "Each session's notes focus on a different theme; there is no strong repeated tag yet.",
            `Most recent session note: “${withK[withK.length - 1]!.title}”. Consider opening with how that has developed.`,
          ]
        : ["No observations are linked to consultations for this client yet."],
    };
  }

  if (ql.includes("organi") || ql.includes("structure") || ql.includes("notes")) {
    const scoped = relevant.filter((o) => o.personIds.some((p) => subjectIds.includes(p)));
    const groups = new Map<string, Observation[]>();
    scoped.forEach((o) => {
      const k = o.planets[0] ? BODIES[o.planets[0]].name : "General";
      groups.set(k, [...(groups.get(k) ?? []), o]);
    });
    return {
      topic: "Organising your notes",
      calculated: [`${view.inner.bodies.length} points calculated · ${view.aspects.length} aspects within current orbs`, ...view.aspects.slice(0, 2).map(aspectLine)],
      observations: scoped.map((o) => o.id),
      generated: [
        `Suggested outline, grouped by primary planet: ${[...groups.entries()].map(([k, v]) => `${k} (${v.length})`).join(" · ") || "no notes yet"}.`,
        `Natal notes: ${scoped.filter((o) => o.scope === "natal").length}, relationship notes: ${scoped.filter((o) => o.scope === "relationship").length}, timing notes: ${scoped.filter((o) => o.scope === "timing").length}. Keep these separate when preparing — relationship notes belong to the shared chart.`,
      ],
    };
  }

  // Fallback: chart overview
  return {
    topic: "Chart overview",
    calculated: view.aspects.slice(0, 5).map(aspectLine),
    observations: relevant.filter((o) => o.chartId === chart.id).map((o) => o.id),
    generated: [
      `The tightest configurations in this chart are listed above. I can only draw on the calculated data and your saved observations — try asking about a specific planet (e.g. “Saturn”), or ask what you've written before.`,
    ],
  };
}

export function AiAssistant({ chart, view, onSaved }: { chart: ChartRecord; view: ChartView; onSaved: (id: string) => void }) {
  const obs = useStore((s) => s.observations);
  const people = useStore((s) => s.people);
  const consultations = useStore((s) => s.consultations);
  const upsert = useStore((s) => s.upsertObservation);
  const toast = useStore((s) => s.toast);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [msgs, busy]);

  const ask = (q: string) => {
    if (!q.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "assistant", reply: respond(q, { chart, view, obs, people, consultations }) }]);
      setBusy(false);
    }, 650);
  };

  const saveDraft = (r: Reply) => {
    const o = upsert({
      ...ownershipFor(chart),
      title: `Draft: ${r.topic}`,
      body: `<p><em>AI-generated draft — review and edit before relying on it.</em></p>${r.generated.map((g) => `<p>${g}</p>`).join("")}`,
      tags: ["ai-draft"],
    });
    toast("Saved as draft observation", "Marked #ai-draft. Edit it to make it your own.", "success");
    onSaved(o.id);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
            <Sparkles className="size-4 text-accent" /> Chart assistant
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">Answers draw on this chart's calculated data and your saved observations, labelled separately.</p>
        </div>
        <SimulatedBadge />
      </div>

      <div className="flex-1 space-y-4">
        {msgs.length === 0 && (
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="block w-full rounded-lg border border-line bg-surface px-3 py-2 text-left text-[12.5px] text-ink-3 transition-colors hover:border-accent/40 hover:text-ink">
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-8 rounded-xl rounded-br-sm bg-ink px-3 py-2 text-[13px] text-white">
              {m.text}
            </div>
          ) : (
            <div key={i} className="space-y-2">
              <div className="rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#4B5D73]">
                  <Calculator className="size-3" /> Calculated chart data
                  <span className="font-normal normal-case tracking-normal text-[#7C5A22]">· demo engine</span>
                </p>
                {m.reply.calculated.length ? (
                  <ul className="space-y-0.5 text-[12.5px] text-ink-3">
                    {m.reply.calculated.map((c, j) => (
                      <li key={j}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12.5px] text-muted">No matching calculated factors.</p>
                )}
              </div>
              <div className="rounded-lg border border-accent-100 bg-accent-50/50 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">
                  <Quote className="size-3" /> Your observations
                </p>
                {m.reply.obsNote && <p className="mb-1.5 text-[12px] text-muted">{m.reply.obsNote}</p>}
                {m.reply.observations.length ? (
                  <ul className="space-y-2">
                    {m.reply.observations.slice(0, 5).map((id) => {
                      const o = obs.find((x) => x.id === id);
                      if (!o) return null;
                      return (
                        <li key={id} className="border-l-2 border-accent-200 pl-2.5">
                          <Link href={`/app/observations?id=${o.id}`} className="text-[12.5px] font-medium text-ink hover:text-accent hover:underline">
                            {o.title}
                          </Link>
                          <p className="line-clamp-2 text-[12px] italic text-ink-3">“{stripHtml(o.body)}”</p>
                          <p className="text-[11px] text-muted">{fmtDate(o.createdAt)} · {o.scope}</p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[12.5px] text-muted">None of your saved observations match.</p>
                )}
              </div>
              <div className="rounded-lg border border-dashed border-sage bg-sage-50/60 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-sage-dark">
                  <Sparkles className="size-3" /> Generated interpretation
                  <span className="font-normal normal-case tracking-normal text-muted">· AI draft for your judgment</span>
                </p>
                <div className="space-y-1.5 text-[12.5px] text-ink-3">
                  {m.reply.generated.map((g, j) => (
                    <p key={j}>{g}</p>
                  ))}
                </div>
                <Button variant="secondary" size="xs" className="mt-2.5" onClick={() => saveDraft(m.reply)}>
                  <NotebookPen /> Save as observation
                </Button>
              </div>
            </div>
          ),
        )}
        {busy && (
          <p className="flex items-center gap-2 text-[12.5px] text-muted">
            <Loader2 className="size-3.5 animate-spin" /> Reading chart data and your notes…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className={cn("sticky bottom-0 mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 pl-3 focus-within:border-accent/50")}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this chart…" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted/70" />
        <Button type="submit" size="icon-sm" disabled={!input.trim() || busy} aria-label="Send">
          <ArrowUp />
        </Button>
      </form>
    </div>
  );
}
