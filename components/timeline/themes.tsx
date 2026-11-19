"use client";

import * as React from "react";
import { BODIES } from "@/lib/astro";
import type { ActivationModel } from "@/lib/astro/activation";
import { themeAnalysis, type ThemeId, type ThemePeriod, type ThemeResult, type ThemeTone, type ThemeTriggers } from "@/lib/astro/themes";
import { anchorKeywords } from "@/lib/astro/keywords";
import type { PromiseLevel } from "@/lib/astro/promise";
import { FinancialPromiseView } from "@/components/workspace/financial-promise";
import { cn } from "@/lib/utils";
import type { TargetId, TimelineContact } from "@/lib/astro/timeline";
import { Badge } from "@/components/ui/badge";
import { Glyphs, contactLabel, fmt, fmtShort } from "./labels";
import { dayIso } from "./activation";

const THEMES: Record<ThemeId, { title: string; color: string; about: string; rule: string; none: string }> = {
  marriage: {
    title: "Marriage & Partnership",
    color: "#824B59",
    about: "Directions involving the partnership significators: the times relationships tend to begin, commit, change or end.",
    rule: "Any aspect (conjunctions and oppositions only when the Ascendant–Descendant axis is the only one involved).",
    none: "No direction, slow transit or eclipse involves the partnership significators in this range.",
  },
  career: {
    title: "Career",
    color: "#5E7A62",
    about: "Directions involving the career significators, and slow transits and eclipses on the Midheaven. Each is marked as helpful, pressure or a turning point.",
    rule: "Any aspect, whichever point is at the other end.",
    none: "No direction involves the career significators, and no slow transit or eclipse is on the Midheaven, in this range.",
  },
  money: {
    title: "Money",
    color: "#4D5A70",
    about: "Directions involving the significators of income and of other people's money: earnings, gains, debts and losses.",
    rule: "Any aspect.",
    none: "No direction involves the money significators in this range.",
  },
  home: {
    title: "Home & Relocation",
    color: "#6E4F6E",
    about: "Directions involving the significators of home, family and distance, and slow transits and eclipses on the IC: moves, property and changes in the household.",
    rule: "Any aspect (conjunctions and oppositions only when the Midheaven–IC axis is the only one involved).",
    none: "No direction involves the home significators, and no slow transit or eclipse is on the IC, in this range.",
  },
  accident: {
    title: "Accident-Prone Periods",
    color: "#9A6A1F",
    about: "Hard directions involving the body and vitality points. A prompt for extra care, not a forecast that something will happen.",
    rule: "Hard aspects only, with Mars, Saturn, Uranus or Pluto directed, or to natal Mars or Uranus.",
    none: "No hard direction, slow transit or eclipse of this kind in this range.",
  },
};
const TONE: Record<ThemeTone, { label: string; tone: "sage" | "warn" | "outline" }> = { helpful: { label: "Helpful", tone: "sage" }, pressure: { label: "Pressure", tone: "warn" }, turning: { label: "Turning Point", tone: "outline" } };

/** The theme's intensity over the range, with its periods shaded and the selected date marked. */
function Strip({ r, d, color, label }: { r: ThemeResult; d: number; color: string; label: string }) {
  const n = r.series.length, W = 300, H = 36;
  const x = (i: number) => (i / Math.max(1, n - 1)) * W;
  const step = Math.max(1, Math.floor(n / 300));
  let path = `M0,${H}`;
  for (let i = 0; i < n; i += step) path += ` L${x(i).toFixed(1)},${(H - (r.series[i]! / (r.max || 1)) * (H - 3)).toFixed(1)}`;
  path += ` L${W},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-9 w-full" role="img" aria-label={label}>
      {r.periods.map((p) => <rect key={`${p.anchor.id}-${p.start}`} x={x(p.start)} width={Math.max(2, x(p.end) - x(p.start))} y={0} height={H} fill={color} opacity={0.14} />)}
      <path d={path} fill={color} opacity={0.55} />
      <line x1={x(d)} x2={x(d)} y1={0} y2={H} stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" className="text-ink" />
    </svg>
  );
}

const LEVELS: Record<ThemeId, Record<PromiseLevel, { label: string; tone: "sage" | "warn" | "outline"; note?: string }>> = (() => {
  const topic = {
    strong: { label: "Well Promised", tone: "sage" as const },
    mixed: { label: "Mixed Promise", tone: "outline" as const },
    weak: { label: "Weakly Promised", tone: "warn" as const, note: "The birth chart gives this topic little support, so the periods below may pass quietly or bring difficulty." },
    none: { label: "Little Testimony", tone: "outline" as const, note: "The birth chart says little either way, so the periods below have less to bring out." },
  };
  return {
    marriage: topic,
    career: topic,
    money: topic,
    home: topic,
    accident: {
      strong: { label: "Marked in the Birth Chart", tone: "warn" },
      mixed: { label: "Some Natal Indication", tone: "outline" },
      weak: { label: "Some Natal Indication", tone: "outline" },
      none: { label: "Little Natal Indication", tone: "sage", note: "The birth chart does not mark this out, so the periods below carry less weight." },
    },
  };
})();

/** What the natal chart says about the topic: the ground the periods stand on. */
function Promise({ r }: { r: ThemeResult }) {
  if (r.promise.financial) return <div className="rounded-lg bg-canvas-2 px-3 py-2.5"><FinancialPromiseView f={r.promise.financial} /></div>;
  const l = LEVELS[r.id][r.promise.level];
  return (
    <div className="rounded-lg bg-canvas-2 px-3 py-2.5 text-[12.5px]">
      <p className="flex flex-wrap items-center gap-2 text-[11.5px] font-semibold text-ink">Natal Promise <Badge tone={l.tone}>{l.label}</Badge></p>
      {r.promise.testimonies.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-ink-3">
          {r.promise.testimonies.map((t) => (
            <li key={t.text} className="flex gap-1.5"><span aria-hidden className={t.tone === "support" ? "text-sage-dark" : "text-warn"}>{t.tone === "support" ? "+" : "−"}</span><span><span className="sr-only">{t.tone === "support" ? "Supports: " : r.id === "accident" ? "Indicates: " : "Challenges: "}</span>{t.text}</span></li>
          ))}
        </ul>
      )}
      {l.note && <p className="mt-1.5 text-muted">{l.note}</p>}
    </div>
  );
}

const KIND: Record<ThemePeriod["kind"], string> = { "solar-arc": "Solar Arc", "progression-angle": "Progression to an Angle", progression: "Progression", "transit-angle": "Transit to an Angle", "eclipse-angle": "Eclipse on an Angle" };
const TRIGGERS_SHOWN = 6;
const PERIODS_SHOWN = 4;
const dateLink = "underline decoration-line-strong underline-offset-2 hover:text-accent";

/** One period: the solar arc it rests on, then the transits and eclipses that set it off. */
function Period({ m, p, d, onOpenContact, onAsOf }: { m: ActivationModel; p: ThemePeriod; d: number; onOpenContact: (c: TimelineContact) => void; onAsOf: (date: string) => void }) {
  const [all, setAll] = React.useState(false);
  const keys = React.useMemo(() => anchorKeywords(m.natal, p.anchor), [m, p]);
  const timing = p.triggers.filter((t) => t.slow);
  // When there are many, keep the slow planets' exact hits, then the heaviest, still in date order.
  const keep = all || p.triggers.length <= TRIGGERS_SHOWN ? null : new Set([...p.triggers].sort((a, b) => Number(b.slow) - Number(a.slow) || b.contact.weight - a.contact.weight).slice(0, TRIGGERS_SHOWN));
  const shown = keep ? p.triggers.filter((t) => keep.has(t)) : p.triggers;
  return (
    <li className="border-t border-line pt-2.5 text-[12.5px]">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge tone={p.primary ? "accent" : p.kind === "progression" ? "outline" : "info"}>{KIND[p.kind]}</Badge>
        {p.tone && <Badge tone={TONE[p.tone].tone}>{TONE[p.tone].label}</Badge>}
        {d >= p.start && d <= p.end && <Badge tone="outline">Now Selected</Badge>}
      </p>
      <button type="button" onClick={() => onOpenContact(p.anchor)} className="mt-1 text-left text-[13.5px] font-semibold text-ink hover:text-accent"><Glyphs c={p.anchor} size={14} /> {contactLabel(p.anchor)}</button>
      <p className="mt-0.5 text-muted">
        {p.kind === "eclipse-angle" ? "Counted" : "In Orb"} {p.startOpen ? "Since Before " : ""}{fmtShort(dayIso(m, p.start))} – {p.endOpen ? "Beyond " : ""}{fmt(dayIso(m, p.end))}
        {p.exacts.length ? <> · {p.kind === "eclipse-angle" ? "Eclipse" : "Exact"} {p.exacts.slice(0, 5).map((u, i) => <React.Fragment key={u}>{i > 0 && ", "}<button type="button" className={dateLink} onClick={() => onAsOf(u.slice(0, 10))}>{fmt(u)}</button></React.Fragment>)}</> : p.kind === "transit-angle" ? " · Not Exact in This Range" : " · Exact Outside This Range"}
      </p>
      {p.natalAspect && <p className="mt-0.5 text-ink-3">Repeats the natal {p.natalAspect} of {BODIES[p.anchor.source as TargetId].name} and {BODIES[p.anchor.target].name}.</p>}
      {keys.length > 0 && (
        <dl className="mt-2 space-y-0.5 rounded-lg bg-canvas-2 px-2.5 py-2 text-[12px] text-ink-3">
          <dt className="sr-only">Keywords</dt>
          {keys.map((k) => <dd key={k.label}><b className="font-medium text-ink">{k.label}:</b> {k.text}</dd>)}
        </dl>
      )}
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Triggers on Natal {p.points.map((id) => BODIES[id].name).join(" and ")}</p>
      {p.triggers.length === 0 ? (
        <p className="mt-1 text-muted">No transits or eclipses to {p.points.length > 1 ? "these points" : "this point"} while it is in orb in this range.</p>
      ) : (
        <>
          <ul className="mt-1 space-y-1">
            {shown.map((t) => (
              <li key={t.contact.id} className={cn("flex flex-wrap items-baseline justify-between gap-x-2", t.slow && "font-semibold")}>
                <button type="button" onClick={() => onOpenContact(t.contact)} className="text-left text-ink hover:text-accent"><Glyphs c={t.contact} size={13} /> {contactLabel(t.contact)}</button>
                <span className="text-[12px] tabular-nums text-muted">
                  {t.exact ? "" : "Closest "}
                  {t.dates.slice(0, 3).map((u, i) => (
                    <React.Fragment key={u}>{i > 0 && ", "}<button type="button" className={dateLink} onClick={() => onAsOf(u.slice(0, 10))}>{fmt(u)}</button></React.Fragment>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          {p.triggers.length > TRIGGERS_SHOWN && <button type="button" className="mt-1 text-[12px] text-muted hover:text-accent" onClick={() => setAll(!all)}>{all ? "Show Fewer" : `Show All ${p.triggers.length} Triggers`}</button>}
          {timing.length > 0 && (
            <p className="mt-1.5 text-ink-3">
              Likely timing, from the slow planets' exact hits:{" "}
              {timing.flatMap((t) => t.dates.map((u) => ({ u, c: t.contact }))).sort((a, b) => a.u.localeCompare(b.u)).slice(0, 6).map(({ u, c }, i) => (
                <React.Fragment key={c.id + u}>{i > 0 && ", "}<button type="button" className={dateLink} onClick={() => onAsOf(u.slice(0, 10))}>{fmt(u)}</button> ({BODIES[c.source as TargetId].name})</React.Fragment>
              ))}.
            </p>
          )}
        </>
      )}
    </li>
  );
}

/** Marriage, career, money, home and accident-prone periods across the timeline's range. */
export function LifeThemes({ m, d, triggers, onOpenContact, onAsOf }: { m: ActivationModel; d: number; triggers: ThemeTriggers; onOpenContact: (c: TimelineContact) => void; onAsOf: (date: string) => void }) {
  const results = React.useMemo(() => themeAnalysis(m, triggers), [m, triggers]);
  const [open, setOpen] = React.useState<Partial<Record<ThemeId, boolean>>>({});
  return (
    <div className="space-y-2">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((r) => {
          const t = THEMES[r.id];
          return (
            <article key={r.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
              <div>
                <h3 className="font-serif text-[20px] leading-snug text-ink">{t.title}</h3>
                <p className="mt-1 text-[12.5px] text-muted">{t.about}</p>
              </div>
              <Promise r={r} />
              <Strip r={r} d={d} color={t.color} label={`${t.title}: ${r.periods.length} ${r.periods.length === 1 ? "period" : "periods"} in this range`} />
              {r.periods.length === 0 ? (
                <p className="text-[13px] text-muted">{t.none}</p>
              ) : (
                <ul className="space-y-3">
                  {(open[r.id] ? r.periods : r.periods.slice(0, PERIODS_SHOWN)).slice().sort((a, b) => a.start - b.start).map((p) => <Period key={`${p.anchor.id}-${p.start}`} m={m} p={p} d={d} onOpenContact={onOpenContact} onAsOf={onAsOf} />)}
                  {r.periods.length > PERIODS_SHOWN && (
                    <li className="border-t border-line pt-2.5">
                      <button type="button" className="text-[12px] text-muted hover:text-accent" onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}>{open[r.id] ? "Show the Strongest Four" : `Show ${r.periods.length - PERIODS_SHOWN} More ${r.periods.length - PERIODS_SHOWN === 1 ? "Direction" : "Directions"}`}</button>
                    </li>
                  )}
                </ul>
              )}
              <p className="mt-auto border-t border-line pt-2.5 text-[11.5px] leading-relaxed text-muted">
                <b className="font-medium text-ink-3">Significators:</b> {r.significators.length ? r.significators.map((s) => (s.why === BODIES[s.id].name || s.id === "asc" || s.id === "mc" ? s.why : `${BODIES[s.id].name} (${s.why})`)).join(", ") : "none available"}. {t.rule}
              </p>
            </article>
          );
        })}
      </div>
      <p className="text-[12px] leading-relaxed text-muted">
        Each theme starts from the natal promise: the birth chart's own testimony on the topic, from the dignity and house of the significators, the planets in the house and their natal aspects. A solar arc that repeats a natal aspect between its two points is listed first. A period is the time a solar arc involving one of the significators (as the point aimed at, or as the planet directed) is in orb. A progression (other than the Moon's) to the Ascendant or Midheaven counts the same way; Slow transits (Jupiter to Pluto, by conjunction, square or opposition) and eclipses (by conjunction or opposition) also stand as periods of their own: on the Midheaven for career, on the IC for home, and on the Ascendant for partnership and accidents. Career, money and home can go either way, so each of their periods is marked helpful (a trine, a sextile, or a conjunction from Jupiter, Venus or the Sun), pressure (a hard aspect, or a conjunction from Mars, Saturn, Uranus, Neptune or Pluto) or a turning point; on those three cards, trines from transiting Jupiter and Saturn count as triggers whatever the trigger setting. Other progressions rank last. The four strongest are shown first: those exact in the range, involving the topic's ruler or an angle, or repeating a natal aspect. The keywords under each are the planet, its rulerships and house, the aspect, and the natal point's sign and house. Triggers are the transits and eclipses to the two natal points of that solar arc while it is in orb, {triggers === "hard" ? "by conjunction, square or opposition only" : "by every aspect in use"} (a setting under Bodies, Aspects &amp; Orbs), with the planets and orbs set for this timeline, whatever the significance filter. Exact hits from Saturn, Uranus, Neptune and Pluto are in bold and given as the likely timing. {m.natal.hasHouses ? "" : "House rulers, house placements and the angles need a known birth time, so only the planets are used here. "}These are counting aids with provisional rules, not predictions.
      </p>
    </div>
  );
}
