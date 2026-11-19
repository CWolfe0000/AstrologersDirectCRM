"use client";

import * as React from "react";
import { BODIES } from "@/lib/astro";
import type { ActivationModel } from "@/lib/astro/activation";
import { themeAnalysis, type ThemeId, type ThemePeriod, type ThemeResult } from "@/lib/astro/themes";
import type { TimelineContact } from "@/lib/astro/timeline";
import { Badge } from "@/components/ui/badge";
import { Glyphs, contactLabel, fmt, fmtShort } from "./labels";
import { dayIso } from "./activation";

const THEMES: Record<ThemeId, { title: string; color: string; about: string; rule: string; none: string }> = {
  marriage: {
    title: "Marriage & Partnership",
    color: "#824B59",
    about: "Solar arcs involving the partnership significators: the times relationships tend to begin, commit, change or end.",
    rule: "Any aspect (conjunctions and oppositions only when the Ascendant–Descendant axis is the only one involved).",
    none: "No solar arc or progression involves the partnership significators in this range.",
  },
  career: {
    title: "Career Success",
    color: "#5E7A62",
    about: "Helpful solar arcs involving the career significators.",
    rule: "Trines and sextiles, and any aspect when Jupiter, Venus or the Sun is the directed planet.",
    none: "No helpful solar arc or progression involves the career significators in this range.",
  },
  accident: {
    title: "Accident-Prone Periods",
    color: "#9A6A1F",
    about: "Hard solar arcs involving the body and vitality points. A prompt for extra care, not a forecast that something will happen.",
    rule: "Hard aspects only, with Mars, Saturn, Uranus or Pluto directed, or to natal Mars or Uranus.",
    none: "No hard solar arc or progression of this kind in this range.",
  },
};

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

const TRIGGERS_SHOWN = 6;
const dateLink = "underline decoration-line-strong underline-offset-2 hover:text-accent";

/** One period: the solar arc it rests on, then the transits and eclipses that set it off. */
function Period({ m, p, d, onOpenContact, onAsOf }: { m: ActivationModel; p: ThemePeriod; d: number; onOpenContact: (c: TimelineContact) => void; onAsOf: (date: string) => void }) {
  const [all, setAll] = React.useState(false);
  const arc = p.anchor.technique === "solar-arc";
  // When there are many, keep the heaviest (slow planets, eclipses), still in date order.
  const keep = all || p.triggers.length <= TRIGGERS_SHOWN ? null : new Set([...p.triggers].sort((a, b) => b.contact.weight - a.contact.weight).slice(0, TRIGGERS_SHOWN));
  const shown = keep ? p.triggers.filter((t) => keep.has(t)) : p.triggers;
  return (
    <li className="border-t border-line pt-2.5 text-[12.5px]">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge tone={arc ? "accent" : "outline"}>{arc ? "Solar Arc" : "Progression"}</Badge>
        {d >= p.start && d <= p.end && <Badge tone="outline">Now Selected</Badge>}
      </p>
      <button type="button" onClick={() => onOpenContact(p.anchor)} className="mt-1 text-left text-[13.5px] font-semibold text-ink hover:text-accent"><Glyphs c={p.anchor} size={14} /> {contactLabel(p.anchor)}</button>
      <p className="mt-0.5 text-muted">
        In Orb {p.startOpen ? "Since Before " : ""}{fmtShort(dayIso(m, p.start))} – {p.endOpen ? "Beyond " : ""}{fmt(dayIso(m, p.end))}
        {p.exact ? <> · Exact <button type="button" className={dateLink} onClick={() => onAsOf(p.exact!.slice(0, 10))}>{fmt(p.exact)}</button></> : " · Exact Outside This Range"}
      </p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Triggers on Natal {p.points.map((id) => BODIES[id].name).join(" and ")}</p>
      {p.triggers.length === 0 ? (
        <p className="mt-1 text-muted">No transits or eclipses to {p.points.length > 1 ? "these points" : "this point"} while it is in orb in this range.</p>
      ) : (
        <>
          <ul className="mt-1 space-y-1">
            {shown.map((t) => (
              <li key={t.contact.id} className="flex flex-wrap items-baseline justify-between gap-x-2">
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
          {p.peak !== null && p.triggers.length > 1 && <p className="mt-1.5 text-ink-3">Triggers are strongest together around <button type="button" className={dateLink} onClick={() => onAsOf(dayIso(m, p.peak!))}>{fmt(dayIso(m, p.peak))}</button>.</p>}
        </>
      )}
    </li>
  );
}

/** Marriage, career and accident-prone periods across the timeline's range. */
export function LifeThemes({ m, d, onOpenContact, onAsOf }: { m: ActivationModel; d: number; onOpenContact: (c: TimelineContact) => void; onAsOf: (date: string) => void }) {
  const results = React.useMemo(() => themeAnalysis(m), [m]);
  return (
    <div className="space-y-2">
      <div className="grid gap-4 lg:grid-cols-3">
        {results.map((r) => {
          const t = THEMES[r.id];
          return (
            <article key={r.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
              <div>
                <h3 className="font-serif text-[20px] leading-snug text-ink">{t.title}</h3>
                <p className="mt-1 text-[12.5px] text-muted">{t.about}</p>
              </div>
              <Strip r={r} d={d} color={t.color} label={`${t.title}: ${r.periods.length} ${r.periods.length === 1 ? "period" : "periods"} in this range`} />
              {r.periods.length === 0 ? (
                <p className="text-[13px] text-muted">{t.none}</p>
              ) : (
                <ul className="space-y-3">
                  {r.periods.map((p) => <Period key={`${p.anchor.id}-${p.start}`} m={m} p={p} d={d} onOpenContact={onOpenContact} onAsOf={onAsOf} />)}
                  {r.anchorCount > r.periods.length && <li className="border-t border-line pt-2.5 text-[12px] text-muted">+{r.anchorCount - r.periods.length} More {r.anchorCount - r.periods.length === 1 ? "Direction" : "Directions"} Not Shown</li>}
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
        A period is the time a solar arc involving one of the significators (as the point aimed at, or as the planet directed) is in orb. Solar arcs come first; a secondary progression to a significator is shown only when fewer than four solar arcs qualify. Triggers are the transits and eclipses to the two natal points of that solar arc while it is in orb, using the planets, aspects and orbs set for this timeline, whatever the significance filter. {m.natal.hasHouses ? "" : "House rulers, house placements and the angles need a known birth time, so only the planets are used here. "}These are counting aids with provisional rules, not predictions.
      </p>
    </div>
  );
}
