"use client";

import * as React from "react";
import { BODIES } from "@/lib/astro";
import type { ActivationModel } from "@/lib/astro/activation";
import { themeAnalysis, type ThemeId, type ThemeResult } from "@/lib/astro/themes";
import type { TimelineContact } from "@/lib/astro/timeline";
import { Badge } from "@/components/ui/badge";
import { Glyphs, TECH, contactLabel, fmt, fmtShort } from "./labels";
import { dayIso } from "./activation";

const THEMES: Record<ThemeId, { title: string; color: string; about: string; rule: string; none: string }> = {
  marriage: {
    title: "Marriage & Partnership",
    color: "#824B59",
    about: "When contacts gather on the partnership significators: the times relationships tend to begin, commit, change or end.",
    rule: "Any aspect to these points (conjunctions and oppositions only for the Ascendant–Descendant axis).",
    none: "No partnership convergence in this range.",
  },
  career: {
    title: "Career Success",
    color: "#5E7A62",
    about: "When helpful contacts gather on the career significators.",
    rule: "Trines and sextiles from any planet, and any aspect from Jupiter, Venus or the Sun.",
    none: "No career convergence in this range.",
  },
  accident: {
    title: "Accident-Prone Periods",
    color: "#9A6A1F",
    about: "When hard contacts pile up on the body and vitality points. A prompt for extra care, not a forecast that something will happen.",
    rule: "Hard aspects only, from Mars, Saturn, Uranus or Pluto, to natal Mars or Uranus, or from an eclipse.",
    none: "No convergence of this kind in this range.",
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
      {r.periods.map((p) => <rect key={p.start} x={x(p.start)} width={Math.max(2, x(p.end) - x(p.start))} y={0} height={H} fill={color} opacity={0.14} />)}
      <path d={path} fill={color} opacity={0.55} />
      <line x1={x(d)} x2={x(d)} y1={0} y2={H} stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" className="text-ink" />
    </svg>
  );
}

/** Marriage, career and accident-prone convergence across the timeline's range. */
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
                <p className="text-[13px] text-muted">{t.none} {r.contactCount > 0 ? `${r.contactCount} ${r.contactCount === 1 ? "contact counts" : "contacts count"}, but no two stand out together.` : ""}</p>
              ) : (
                <ul className="space-y-3">
                  {r.periods.map((p) => {
                    const here = d >= p.start && d <= p.end;
                    return (
                      <li key={p.start} className="border-t border-line pt-2.5 text-[12.5px]">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <b className="text-[13px] font-semibold text-ink">{p.startOpen ? "Before " : ""}{fmtShort(dayIso(m, p.start))} – {fmt(dayIso(m, p.end))}{p.endOpen ? " and After" : ""}</b>
                          {here && <Badge tone="accent">Now Selected</Badge>}
                        </p>
                        <p className="mt-0.5 text-muted">
                          {p.contacts.length} Contacts · {p.techniques.length > 1 ? <b className="font-medium text-ink">{p.techniques.length} Techniques Agree</b> : `${TECH[p.techniques[0]!].label} Only`} · Peak{" "}
                          <button type="button" className="underline decoration-line-strong underline-offset-2 hover:text-accent" onClick={() => onAsOf(dayIso(m, p.peak))}>{fmtShort(dayIso(m, p.peak))}</button>
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {p.contacts.slice(0, 4).map((c) => (
                            <li key={c.id}>
                              <button type="button" onClick={() => onOpenContact(c)} className="text-left text-ink hover:text-accent"><Glyphs c={c} size={13} /> {contactLabel(c)}</button>
                            </li>
                          ))}
                          {p.contacts.length > 4 && <li className="text-muted">+{p.contacts.length - 4} More</li>}
                        </ul>
                      </li>
                    );
                  })}
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
        A period is a stretch where at least two counted contacts are in orb together and their combined intensity stands out from the rest of the range. Every contact in the range is used, whatever the significance filter. Lunations are left out. {m.natal.hasHouses ? "" : "House rulers, house placements and the angles need a known birth time, so only the planets are used here. "}These are counting aids with provisional rules, not predictions.
      </p>
    </div>
  );
}
