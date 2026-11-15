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

Requirements: Node.js 18.18+ (tested on Node 22) and Postgres 14+.

### Two modes

| Mode | What it is | Set with |
|---|---|---|
| **server** (default) | The real platform: accounts, a Postgres database, encrypted client data | `NEXT_PUBLIC_DATA_MODE=server` |
| **demo** | The clickable prototype: seeded data kept in the browser, no backend | `NEXT_PUBLIC_DATA_MODE=demo` |

### Server mode (real accounts and database)

```bash
npm install
cp .env.example .env.local
# Edit .env.local:
#   DATABASE_URL        your Postgres connection string
#   APP_ENCRYPTION_KEY  output of: openssl rand -base64 32   (never change it once data exists)
npm run db:migrate
npm run dev             # http://localhost:3000 → Get Started
```

After signing up, use **Load sample data** in the sidebar to explore with example clients.

Uploaded files are stored under `.uploads/` by default. Set `STORAGE_DRIVER=s3` and the `S3_*` variables to use a bucket (see `.env.example`).

Without `RESEND_API_KEY`, emails (verification, password reset, client invitations, reading notifications) are not sent. They are printed to the server log and stored in the `outbox` table, so you can open the links locally.

### Demo mode (no database)

```bash
NEXT_PUBLIC_DATA_MODE=demo npm run dev
```

The single-file version used for the shareable prototype link is built with `npm run build:standalone`. That build always uses demo mode.

### Tests

```bash
npm run typecheck     # also checks the server schema keeps up with the UI's data types
npm test              # unit tests
npm run build && npm start &
npm run test:e2e      # end-to-end smoke test (needs Playwright + Chromium)
node tests/e2e/flows.mjs
node tests/e2e/files.mjs
node tests/e2e/recording.mjs     # uses Chromium's simulated microphone
node tests/e2e/twofactor.mjs     # takes ~2 minutes: waits for fresh authenticator codes
node tests/e2e/conflicts.mjs     # two devices, one account
CRON_SECRET=… node tests/e2e/practice-tools.mjs   # CSV import, calendar feed, reminders (server needs the same CRON_SECRET)
node tests/e2e/pwa.mjs           # installable app + offline page
node tests/e2e/a11y.mjs [--mobile] [--all]   # accessibility scan (axe-core)

# Test runs create many accounts from one address: start the server with RATE_LIMIT_MULTIPLIER=20 (never in production).
```

CI (`.github/workflows/ci.yml`) runs all of these against a Postgres service on every push.

### Deploying

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for Neon, Vercel, Resend and Cloudflare R2 setup.

### Production build

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

## Demo data (demo mode)

- Today's date in the demo is fixed at **Saturday, November 14, 2026**, so
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
  auth/             sign up, log in, reset, verify, invitation (real in server mode)
  app/              practitioner application (sidebar shell)
  portal/           client portal (simplified shell, mobile tab bar)
  api/auth/*        accounts: sign-up, login, logout, verify, reset, invitations, password change
  api/v1/*          practice data: bootstrap, records, settings, sample data, portal endpoints
components/
  ui/               reusable design-system primitives (button, card, badge, tabs, dialog, …)
  app/              practitioner shell: sidebar, header, global search, quick-create, server gate
  chart/            chart wheel (SVG), thumbnails, chart helpers
  …                 feature components per area
lib/
  astro/            astrology engine abstraction + demonstration engine
  data/             typed demonstration data
  store.tsx         Zustand store used by every screen
  sync.ts           server mode: loads the practice, saves store changes to the API in the background
  server/           database (Drizzle), encryption, auth, validation, records, email
drizzle/            SQL migrations
docs/               PLAN.md (build checklist), sky-engine-review.md
```

### How data flows in server mode

1. After sign-in, `/api/v1/bootstrap` loads the whole practice into the store. The client portal gets a filtered view of one client's own records.
2. Screens read and write the store exactly as in the prototype.
3. `lib/sync.ts` compares each change against the previous state and saves new or changed records with `PUT /api/v1/records/:collection/:id`, and removed ones with `DELETE`. Saves are retried, and failures are shown to the user.
4. The server validates every record strictly (`lib/server/validation.ts`) and scopes it to the signed-in practice. It encrypts sensitive fields (`lib/server/records.ts`, `SEALED_FIELDS`) before storing them.

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

Next.js 15 (App Router) · TypeScript · Postgres + Drizzle ORM · Zod · Tailwind CSS · Radix UI primitives
(the components follow shadcn/ui conventions and are written locally in
`components/ui`) · Lucide icons · Recharts · Zustand.

Fonts: DM Serif Display (headings) and Inter (interface), both self-hosted
through Fontsource.
