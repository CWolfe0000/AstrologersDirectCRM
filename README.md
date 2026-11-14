# AstrologersDirect — Prototype

**Your Practice. Connected.**

A navigable, high-fidelity prototype of AstrologersDirect. It combines practice
management with professional chart software for astrologers. The prototype
covers three connected environments:

| Environment | Entry point | Screens |
|---|---|---|
| Public website | `/` | Home, Features, How It Works, Pricing, About, Contact & Support, Authentication (sign up, log in, reset, verify, invitation) |
| Practitioner application | `/app` | Dashboard, Clients, Client Profile, Charts, Chart Workspace, Notes & Observations, Consultations & Calendar, Tasks, Reading Delivery, Recording Studio, Reports, Notifications, Settings |
| Client portal | `/portal` | Dashboard, My Readings, Reading Detail & Player, Consultation History, Account Settings |

**Start at `/prototype`.** That page is the guide: it lists all 25 screens and
gives a clickable walkthrough for each of the six workflows (A–F) in the brief.

## Running it

Requirements: Node.js 18.18+ (tested on Node 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

### Regenerating the marketing screenshots

The public site shows real screenshots of the prototype, stored in
`public/screenshots/`. To regenerate them after UI changes:

```bash
npm run build && npm start            # terminal 1
npx playwright install chromium       # first time only
npm run screenshots                   # terminal 2
```

## Demo data

- Today's date in the prototype is fixed at **Saturday, November 14, 2026**, so
  schedules, overdue tasks and activity always look the same.
- The practitioner is **Celeste Morrow** of Morrow Astrological Consulting. She
  has 12 clients, plus associated people, 24 charts, consultations, observations,
  tasks, deliveries and recordings.
- The client portal is signed in as **Amelia Hart**. Readings delivered to Amelia
  from the practitioner app appear in the portal straight away.
- Any changes you make are saved in your browser (`localStorage`). Use **Reset
  demo data** in the sidebar, or in Settings → Data, to restore the original data.

## Simulated functionality

Simulated features carry a dashed amber **Simulated** badge in the interface.
**Chart positions come from a demonstration engine.** They are approximate and
always labelled. They are not verified calculations and must not be used for
interpretation.

[`SIMULATED_FEATURES.md`](./SIMULATED_FEATURES.md) lists every simulated
feature and what it would take to make it functional.

## Architecture

```
app/
  (marketing)/      public website, prototype guide, legal
  auth/             sign up, log in, reset, verify, invitation
  app/              practitioner application (sidebar shell)
  portal/           client portal (simplified shell, mobile tab bar)
components/
  ui/               reusable design-system primitives (button, card, badge, tabs, dialog, …)
  app/              practitioner shell: sidebar, header, global search, quick-create
  chart/            chart wheel (SVG), thumbnails, chart helpers
  …                 feature components per area
lib/
  astro/            astrology engine abstraction + demonstration engine
  data/             typed demonstration data
  store.tsx         Zustand store (persisted) — the seam for a real API
```

### Astrology engine integration

The UI never calls a calculation engine directly. It only uses the
`AstrologyEngine` interface (`lib/astro/types.ts`), through `buildChart()` and
`getEngine()` in `lib/astro/index.ts`. To connect the existing calculation
engine:

1. Review the existing engine's architecture, API, and how it handles time zones and the atlas.
2. Implement an adapter for `natal`, `positionsAt`, `progressed` and `solarArc`. Synastry, composite and aspects are derived in `lib/astro/index.ts` and can be swapped out too.
3. Call `registerEngine(adapter, true)`. Mark the engine `verified: true` to remove the demonstration labels.

### Data model highlights

- **Clients and people.** Every client is also a `Person` with birth data. Associated people (partners, family) are `Person` records linked to a client. Charts always point to the people they chart and the client they are filed under.
- **Observation ownership.** Each observation has a `scope`:
  - `natal` observations belong to the one person whose natal chart they interpret.
  - `relationship` observations belong to a specific synastry or composite chart.
  - `timing` observations belong to a transit, progression or solar-arc chart.

  Natal and relationship observations are never merged, even when the charts belong to the same client.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Radix UI primitives
(the components follow shadcn/ui conventions and are written locally in
`components/ui`) · Lucide icons · Recharts · Zustand.

Fonts: DM Serif Display (headings) and Inter (interface), both self-hosted
through Fontsource.
