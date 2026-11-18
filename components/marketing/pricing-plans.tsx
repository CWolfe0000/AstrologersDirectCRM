"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Cycle = "monthly" | "annual";

const PLANS = [
  {
    id: "solo",
    name: "Solo",
    tagline: "Build your foundation.",
    for: "For independent astrologers establishing their practice. Bring your clients, charts, observations and reading delivery together from the start.",
    highlights: ["Client management", "Natal & synastry charts", "Notes & observations", "Between-session work with clients", "Reading delivery", "Private client portal"],
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Build on everything you’ve learned.",
    for: "For established astrologers who want deeper analytical tools and a more connected workflow.",
    highlights: ["Everything in Solo", "Transits, progressions, solar arcs & returns", "Convergence timeline", "Recording Studio", "Intelligent assistance", "Practice insights"],
    featured: true,
  },
  {
    id: "practice",
    name: "Practice",
    tagline: "Grow together without losing what makes your work yours.",
    for: "For practices with several astrologers or support staff. Shared resources and coordinated workflows, with the right access and privacy for each person.",
    highlights: ["Everything in Professional", "Multiple practitioners", "Shared knowledge collections", "Priority support"],
  },
];

type Cell = boolean | string;
const ROWS: { group: string; rows: [string, Cell, Cell, Cell][] }[] = [
  {
    group: "Practice",
    rows: [
      ["Client records", "Allowance TBD", "Allowance TBD", "Allowance TBD"],
      ["Associated people & relationship charts", true, true, true],
      ["Consultations & calendar", true, true, true],
      ["Tasks & follow-ups", true, true, true],
      ["Between sessions: assignments, prompts, goals & activities", true, true, true],
      ["Practice insights", false, true, true],
      ["Practitioner seats", "1", "1", "TBD"],
    ],
  },
  {
    group: "Astrology",
    rows: [
      ["Natal & synastry charts, aspects and grids", true, true, true],
      ["Transits, progressions, solar arcs & solar returns", false, true, true],
      ["Midpoint composite charts", false, true, true],
      ["Horary, electional & astrocartography", false, true, true],
      ["Convergence timeline", false, true, true],
      ["Notes & observations with revision history", true, true, true],
      ["Intelligent assistance", false, "Usage TBD", "Usage TBD"],
    ],
  },
  {
    group: "Delivery",
    rows: [
      ["Reading delivery (PDF, audio, video, links)", true, true, true],
      ["Recording Studio", false, true, true],
      ["Branded client portal", true, true, true],
      ["Storage allowance", "TBD", "TBD", "TBD"],
      ["Maximum upload size", "TBD", "TBD", "TBD"],
    ],
  },
];

function CellView({ v }: { v: Cell }) {
  if (v === true) return <Check className="mx-auto size-4 text-sage-dark" aria-label="Included" />;
  if (v === false) return <Minus className="mx-auto size-4 text-line-strong" aria-label="Not included" />;
  return <span className="text-[12.5px] text-muted">{v}</span>;
}

export function PricingPlans() {
  const [cycle, setCycle] = React.useState<Cycle>("annual");
  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <Segmented<Cycle>
          value={cycle}
          onChange={setCycle}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "annual", label: "Annual" },
          ]}
        />
        <p className="text-[12.5px] text-muted">{cycle === "annual" ? "Annual billing will include a discount — details to be announced." : "Billed monthly. Cancel anytime."}</p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={cn("flex flex-col rounded-2xl border bg-surface p-7", p.featured ? "border-accent/40 shadow-pop" : "border-line shadow-card")}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[28px] text-ink">{p.name}</h3>
              {p.featured && <Badge tone="accent">Most practices</Badge>}
            </div>
            <p className="mt-1 font-serif text-[18px] italic text-accent">{p.tagline}</p>
            <p className="mt-2 min-h-[63px] text-[14px] text-muted">{p.for}</p>
            <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-canvas px-4 py-4">
              <p className="font-serif text-[22px] text-ink">Pricing to be announced</p>
              <p className="mt-0.5 text-[12.5px] text-muted">{cycle === "annual" ? "per year, billed annually" : "per month"} · placeholder</p>
            </div>
            <ul className="mt-6 flex-1 space-y-2.5">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-[14px] text-ink-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-sage-dark" /> {h}
                </li>
              ))}
            </ul>
            <ButtonLink href={`/auth/signup?plan=${p.id}`} variant={p.featured ? "primary" : "secondary"} className="mt-8 w-full">
              Join Early Access
            </ButtonLink>
          </div>
        ))}
      </div>

      <div className="mt-20">
        <h2 className="font-serif text-[30px] text-ink md:text-[36px]">Compare plans</h2>
        <p className="mt-2 text-[14px] text-muted">Storage and usage allowances are placeholders and will be confirmed before launch.</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface" tabIndex={0} role="region" aria-label="Plan comparison table">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-canvas">
                <th className="px-5 py-3.5 font-medium text-muted">Capability</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="w-[18%] px-4 py-3.5 text-center font-semibold text-ink">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((g) => (
                <React.Fragment key={g.group}>
                  <tr className="border-b border-line bg-canvas/50">
                    <td colSpan={4} className="px-5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {g.group}
                    </td>
                  </tr>
                  {g.rows.map(([label, ...cells]) => (
                    <tr key={label} className="border-b border-line/70 last:border-0">
                      <td className="px-5 py-3 text-ink-3">{label}</td>
                      {cells.map((c, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          <CellView v={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
