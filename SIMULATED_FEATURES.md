# Simulated features — and what it takes to make them real

> **Two modes.** In **demo** mode (the shareable prototype) everything below is simulated. In **server** mode (the real platform, see README), accounts, the database and email delivery are real. Rows marked ✅ say what changed.

The AstrologersDirect prototype is built for evaluating interface, navigation and
workflow. Everything you can click works, but some of it is simulated. In the
interface, simulated features carry a dashed amber **Simulated** badge or note.
Calculated chart data always shows a **Demonstration positions** label.

## What actually works in the prototype

- Navigation across all 25 screens and three environments (public site, practitioner app, client portal).
- A shared demo data store. New clients, charts, observations, consultations,
  tasks, deliveries and recordings are saved in the browser's `localStorage`
  and stay after a reload. **Reset demo data** in the sidebar or in
  Settings → Data restores the original seed data.
- Search across clients, charts, observations, consultations and readings (⌘K / Ctrl-K).
- Observation autosave and revision history, kept in the demo store.
- Aspect detection, applying/separating status, house placement, house rulers
  and essential dignity. The rules are real, but they run on demonstration
  positions (see the first table row below).
- Client CSV export (a real download).
- The links between screens: a delivery appears in the client portal, and a
  follow-up task created from a consultation shows up in Tasks.

## Simulated features

| Area | What the prototype does | What a production version needs |
|---|---|---|
| **Chart calculations** | `lib/astro/demo-engine.ts` produces deterministic, *approximate* positions (mean-motion formulas plus a seeded generator). House cusps are trisected quadrants, not true Placidus/Koch. Retrograde status is approximate. | An adapter that implements the `AstrologyEngine` interface in `lib/astro/types.ts` around the **existing calculation engine** (for example a Swiss Ephemeris service). Register it with `registerEngine(engine, true)` in `lib/astro/index.ts`. Review the existing engine's API, time-zone and atlas handling first. The UI needs no changes. |
| **Place lookup / atlas** | A short built-in list of cities with coordinates and time zones. | A geocoding and historical time-zone service (atlas), ideally the one the existing engine already uses. |
| **Interpretation engine** | Not connected. | Connect the existing interpretation engine behind its own interface, next to the calculation adapter. |
| **AI Assistant** (chart workspace) | Deterministic responses assembled from real chart data and saved observations. Sources are labelled: *Calculated chart data* / *Your observations* / *Generated interpretation*. | An LLM backend with retrieval over the practitioner's observations, tool access to the calculation engine, a source-attribution contract that keeps the three labels, per-practitioner data isolation, and audit logging. |
| **Persistence** | ✅ **Real in server mode:** Postgres, a practice-scoped API, sensitive fields encrypted at rest. Demo mode still uses browser `localStorage`. | Production hosting (Neon), backups, server-side observation revision history. |
| **Authentication** | ✅ **Real in server mode:** sign-up, login, sessions, email verification, password reset and change, client portal invitations. Demo mode simulates these. | Two-factor authentication, a real session-management screen, sign-in email change. |
| **Two-factor auth, sessions** | Toggles and lists only. | Provided by the auth service. |
| **File uploads / reading delivery** | Reads the selected file's name and size and shows a simulated upload progress bar. No file leaves the browser. One seeded delivery fails on purpose to show the failure state. | Object storage (e.g. S3) with resumable/multipart uploads, virus scanning, signed URLs, download permissions and expiry enforced on the server, and a storage quota. |
| **Client notifications** | In-portal notification on delivery. In server mode an email is also sent to clients with a portal login (needs a Resend key; otherwise logged to the outbox). | A transactional email provider, notification preferences, and open tracking. |
| **Recording Studio** | Recording is simulated by default (timer, meter, player). Real devices (`getUserMedia` / `getDisplayMedia` + `MediaRecorder`) can be tried in the browser, but recordings are not uploaded. | Upload of recorded media to storage, server-side transcoding (HLS), plus later transcription, trimming, chapters and captions. |
| **Media playback in the portal** | Players and the document viewer are simulated: there are no real media files in the demo. | Streaming from storage through signed URLs, a PDF renderer (e.g. pdf.js), and access checks on each request. |
| **Calendar** | Internal calendar only. | External calendar sync (Google/Microsoft), self-service booking, automated reminders, video-call links. |
| **Reports** | Demonstration numbers. Some series are derived from the store, others are seeded. | Analytics queries over real data. Revenue reporting once payments are integrated. |
| **Import** | Simulated CSV import dialog. | A column-mapping importer and importers for common astrology software formats. |
| **Subscription & billing** | Placeholder plan names and usage meters. No prices. | A billing provider (e.g. Stripe), with plans and limits set by the business. |
| **Chart export / print** | Print uses the browser's print dialog. Exports are client-side. | Server-rendered PDF/PNG exports with practice branding. |
| **Marketing forms** (contact, advisory group) | Show a confirmation toast. | A CRM or helpdesk integration. |
