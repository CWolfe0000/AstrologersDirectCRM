import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe, Briefcase, UserRound, FlaskConical, ChevronRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Prototype guide" };

const ENVIRONMENTS = [
  {
    icon: Globe,
    name: "Public website",
    body: "Introduces the platform and converts visitors.",
    screens: [
      [1, "Homepage", "/"],
      [2, "Features", "/features"],
      [3, "How It Works", "/how-it-works"],
      [4, "Pricing", "/pricing"],
      [5, "About", "/about"],
      [6, "Contact & Support", "/contact"],
      [7, "Authentication — sign in", "/auth/login"],
      [7, "Authentication — sign up", "/auth/signup"],
      [7, "Authentication — password reset", "/auth/reset"],
      [7, "Authentication — email verification", "/auth/verify"],
      [7, "Authentication — invitation acceptance", "/auth/invite"],
    ],
  },
  {
    icon: Briefcase,
    name: "Practitioner application",
    body: "The professional workspace, signed in as demo astrologer Celeste Morrow.",
    screens: [
      [8, "Practitioner Dashboard", "/app"],
      [9, "Client Directory", "/app/clients"],
      [10, "Client Profile — Amelia Hart", "/app/clients/c1"],
      [10, "Client Profile — Between Sessions", "/app/clients/c1?tab=work"],
      [11, "Chart Directory", "/app/charts"],
      [12, "Chart Workspace — Amelia Hart natal", "/app/charts/ch1"],
      [13, "Notes & Observations", "/app/observations"],
      [14, "Consultations & Calendar", "/app/consultations"],
      [15, "Tasks & Follow-Ups", "/app/tasks"],
      [16, "Reading Delivery", "/app/delivery"],
      [17, "Recording Studio", "/app/studio"],
      [18, "Reports & Practice Insights", "/app/reports"],
      [19, "Notifications", "/app/notifications"],
      [20, "Settings & Practice Configuration", "/app/settings"],
    ],
  },
  {
    icon: UserRound,
    name: "Client portal",
    body: "What a client sees — signed in as demo client Amelia Hart.",
    screens: [
      [21, "Client Portal Dashboard", "/portal"],
      [22, "My Readings", "/portal/readings"],
      [23, "Reading Detail & Media Player", "/portal/readings/r3"],
      [24, "Consultation History", "/portal/consultations"],
      [25, "Account Settings", "/portal/settings"],
      [26, "Between Sessions", "/portal/work"],
    ],
  },
] as const;

const WORKFLOWS: { id: string; title: string; summary: string; steps: [string, string][] }[] = [
  {
    id: "A",
    title: "New client",
    summary: "Create a client, enter birth data and generate their natal chart.",
    steps: [
      ["Create client", "/app/clients/new"],
      ["Enter birth data", "/app/clients/new"],
      ["Generate natal chart", "/app/clients/new"],
      ["Save chart", "/app/charts"],
      ["Open client profile", "/app/clients"],
    ],
  },
  {
    id: "B",
    title: "Chart analysis",
    summary: "Review a client’s chart and record an observation against it.",
    steps: [
      ["Open client", "/app/clients/c1"],
      ["Select chart", "/app/clients/c1?tab=charts"],
      ["Review placements & aspects", "/app/charts/ch1"],
      ["Add observation", "/app/charts/ch1?tab=observations"],
      ["Saved to chart history", "/app/observations?id=o1"],
    ],
  },
  {
    id: "C",
    title: "Returning consultation",
    summary: "Prepare for today’s session with Amelia using her history.",
    steps: [
      ["Open calendar", "/app/consultations"],
      ["Select consultation", "/app/consultations?id=k1"],
      ["Open client history", "/app/clients/c1?tab=consultations"],
      ["Review existing observations", "/app/clients/c1?tab=observations"],
      ["Add session notes", "/app/consultations?id=k1"],
      ["Create follow-up task", "/app/tasks?new=1&client=c1"],
    ],
  },
  {
    id: "D",
    title: "Recorded reading",
    summary: "Record a chart walkthrough and deliver it to the client portal.",
    steps: [
      ["Open client chart", "/app/charts/ch2"],
      ["Launch Recording Studio", "/app/studio?client=c1&chart=ch2"],
      ["Record interpretation", "/app/studio?client=c1&chart=ch2"],
      ["Review recording", "/app/studio?client=c1&chart=ch2"],
      ["Deliver to client portal", "/app/delivery"],
    ],
  },
  {
    id: "E",
    title: "Written reading delivery",
    summary: "Upload a PDF reading and follow it through to the client.",
    steps: [
      ["Open Reading Delivery", "/app/delivery"],
      ["Select client", "/app/delivery?new=1&client=c1"],
      ["Upload PDF & add message", "/app/delivery?new=1&client=c1"],
      ["Send", "/app/delivery"],
      ["Client receives notification", "/portal"],
      ["Client opens reading", "/portal/readings"],
    ],
  },
  {
    id: "F",
    title: "Knowledge retrieval",
    summary: "Search your observations by configuration and jump to the source.",
    steps: [
      ["Search notes", "/app/observations"],
      ["Filter by configuration", "/app/observations?planet=saturn"],
      ["Open observation", "/app/observations?id=o6"],
      ["Go to related chart", "/app/charts/ch2"],
      ["Go to client", "/app/clients/c1"],
    ],
  },
  {
    id: "G",
    title: "Between sessions",
    summary: "Share a journaling prompt with Amelia, then see it, and respond, as she does.",
    steps: [
      ["Open Amelia’s Between Sessions", "/app/clients/c1?tab=work"],
      ["Read her journal entries", "/app/clients/c1?tab=work&work=w1"],
      ["Share something new", "/app/clients/c1?tab=work&newWork=1"],
      ["See it in her portal", "/portal/work"],
      ["Respond as Amelia", "/portal/work/w1"],
    ],
  },
];

const SIMULATED = [
  ["Chart calculations", "The demo uses an approximate demonstration engine. The live platform calculates with Swiss Ephemeris."],
  ["AI assistant", "A preview everywhere: responses are assembled from the chart and your saved observations. A full assistant is in development."],
  ["Files, recordings & delivery", "The demo keeps everything in your browser. The live platform stores files privately and emails clients when something is shared."],
  ["Accounts & sign-in", "The demo is already signed in as Celeste Morrow. The live platform has real accounts, email verification and two-factor sign-in."],
  ["Data", "Demo data lives in your browser and can be reset. The live platform stores your practice in an encrypted database."],
  ["Billing, calendar sync", "Not yet built. Calendar feeds (Google, Apple, Outlook) and reminder emails already work on the live platform."],
];

export default function PrototypeGuidePage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container py-14 md:py-20">
          <p className="eyebrow mb-4 text-accent">Prototype guide</p>
          <h1 className="max-w-3xl font-serif text-[40px] leading-[1.05] text-ink md:text-[56px]">Don’t just imagine a better way to work. Explore it.</h1>
          <div className="mt-5 max-w-2xl space-y-3 text-[16.5px] leading-relaxed text-muted">
            <p>Follow a client from their first chart to a completed consultation, through the work between sessions, to a delivered reading. See the practitioner’s workspace and what the client sees in their portal.</p>
            <p>The demo uses realistic sample data. Changes you make are saved in your browser; use “Reset demo data” in the sidebar to start again.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/app">Open practitioner app <ArrowRight /></ButtonLink>
            <ButtonLink href="/portal" variant="secondary">Open client portal</ButtonLink>
            <ButtonLink href="#simulated" variant="ghost">What’s simulated?</ButtonLink>
          </div>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        <h2 className="font-serif text-[30px] text-ink md:text-[36px]">Screens</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {ENVIRONMENTS.map((env) => (
            <div key={env.name} className="rounded-xl border border-line bg-surface">
              <div className="border-b border-line p-5">
                <env.icon className="size-5 text-accent" />
                <h3 className="mt-3 text-[16px] font-semibold text-ink">{env.name}</h3>
                <p className="mt-1 text-[13px] text-muted">{env.body}</p>
              </div>
              <ul className="p-2">
                {env.screens.map(([n, label, href]) => (
                  <li key={href}>
                    <Link href={href} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] hover:bg-canvas-2">
                      <span className="w-6 shrink-0 text-right font-serif text-[15px] text-accent">{n}</span>
                      <span className="flex-1 text-ink-3 group-hover:text-ink">{label}</span>
                      <ChevronRight className="size-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="container py-14 md:py-20">
          <h2 className="font-serif text-[30px] text-ink md:text-[36px]">Workflows</h2>
          <p className="mt-2 max-w-2xl text-[14.5px] text-muted">Each workflow shows how the screens connect. Click through the steps in order.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {WORKFLOWS.map((w) => (
              <div key={w.id} className="rounded-xl border border-line bg-canvas/40 p-5 md:p-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-[26px] leading-none text-accent">{w.id}</span>
                  <h3 className="text-[16px] font-semibold text-ink">{w.title}</h3>
                </div>
                <p className="mt-1.5 text-[13.5px] text-muted">{w.summary}</p>
                <ol className="mt-4 flex flex-wrap items-center gap-1.5">
                  {w.steps.map(([label, href], i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Link href={href} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-ink-3 transition-colors hover:border-accent/40 hover:text-accent">
                        <span className="text-[11px] font-semibold text-muted">{i + 1}</span> {label}
                      </Link>
                      {i < w.steps.length - 1 && <ArrowRight className="size-3 text-muted" />}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="simulated" className="container scroll-mt-20 py-14 md:py-20">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-5 text-warn" />
          <h2 className="font-serif text-[30px] text-ink md:text-[36px]">What the demo simulates</h2>
        </div>
        <p className="mt-2 max-w-2xl text-[14.5px] text-muted">
          In the demo, anything simulated carries a dashed amber “Simulated” label.
        </p>
        <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
          {SIMULATED.map(([t, d]) => (
            <div key={t} className="grid gap-1 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[240px_1fr] md:gap-6">
              <p className="text-[14px] font-medium text-ink">{t}</p>
              <p className="text-[13.5px] text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
