# AstrologersDirect — build plan

**Phase 1** is the goal: a private beta that real astrologers can use with real clients.

Status key: ✅ done · 🟡 in progress · ⬜ not started · 🔒 blocked (the reason is named)

## Phase 1 — Foundation and private beta

### Accounts and security
- ✅ Practitioner sign-up, login and logout, using hashed session tokens in an httpOnly cookie
- ✅ Email verification, password reset and password change (changing the password signs out other devices)
- ✅ Client portal invitations (set-password link) and client login
- ✅ Every record belongs to one practice. The API scopes every query to the signed-in practice. Tested: a second practice sees nothing from the first.
- ✅ Encryption at rest (AES-256-GCM) for birth data, client contact details, notes, observation text and messages
- ✅ Rate limits on login, sign-up, reset and invitations. Same-origin check on every write.
- ✅ Two-factor authentication: authenticator app with QR setup, 10 single-use recovery codes, a code step at sign-in. A password reset no longer signs you in when two-factor is on.
- ✅ Session list and remote sign-out in Settings → Security
- ⬜ Sign-in email change with re-verification
- ✅ Internal security review (AI-assisted, 2026-11-15). Fixed: 2FA brute force (5 tries per sign-in ticket, account lockout after 8 failures, codes can't be replayed, the client IP is taken from the trusted proxy); sign-in links no longer kept in the outbox in production; invites can't reset an existing password or skip 2FA; turning off portal access ends the client's sessions; stored files deleted with the account; open-redirect after login; content types allowlisted, and downloads served as attachments in a sandbox; recovery-code race; expiry lasts through the whole expiry day; account deletion needs the password.
- ⬜ Open from that review (lower priority): a client of two astrologers on the platform can only be invited by the first. Agreed design (2026-11-15): one login and **one portal** per client, showing readings, sessions and files from every astrologer they see (grouped/filterable by astrologer); each astrologer still sees only their own records. Also, an unverified sign-up can claim an address; rate limits are kept per server instance; "delivered" emails can repeat if a reading is toggled; encrypted fields aren't bound to their row (defence in depth); 2FA setup doesn't re-ask for the password.
- ⬜ Professional security review before real client data goes in

### Data
- ✅ Postgres schema and migrations (`drizzle/`)
- ✅ All 25 screens save to the database in the background, using the existing store with no screen rewrites. Shows "Saving… / All changes saved" and retries failed saves.
- ✅ Sample-data loader, with dates shifted so "today" is the real today
- ✅ Export of all practice data as JSON, deletion of all client records, and account deletion
- ✅ Edit-conflict protection: every record has a version, and a save from a device with an outdated copy is refused. The newest saved version wins, and for observations the other device's text is kept as a revision, so nothing is lost.
- ✅ Changes and deletions made on another device appear within a minute, or as soon as the window is focused
- ✅ Observation history kept on the server (encrypted, one version per 10 minutes of editing), with restore from the History panel
- ✅ CSV client import: automatic column matching, US or international dates, 12- or 24-hour times, coordinates with automatic time zone, matching against known cities, a review step to fix birthplaces, duplicate and bad-row detection, and a natal chart created for each client
- ✅ Consultation reminder emails to clients (off by default, sent 3, 24 or 48 hours before, never twice, no notes included), plus a portal notification
- ✅ Private calendar feed (.ics) for Google, Apple or Outlook calendars. It shows first name and last initial, session type and location only, and regenerating the link revokes the old one.
- ✅ The practice time zone comes from the browser at sign-up, with the full time zone list in Settings

### Calculations: Sky engine
- ✅ Reuse review (`docs/sky-engine-review.md`)
- 🟡 Sky maintenance fixes: mirror drift, lockfile, a test syntax error, the birth-year range. ChatGPT is handling these in the Sky repo.
- ✅ Chart technique calculations built and unit-tested, not yet in the app (`lib/astro/techniques`, see `docs/techniques.md`): neutral synastry (inter-aspects, strict-cusp overlays, no scores), midpoint composite (two house methods), secondary progressions (four angle methods), solar arcs (three arc types), solar returns (precession option, relocation). Defaults are provisional until you decide.
- 🔒 Make those defaults final (your method answers), and verify against reference charts (`tests/fixtures/reference-charts.template.json`)
- ⬜ Extract Sky's calculation core into a shared package
- ✅ Swiss Ephemeris on the server (2026-11-15): the same `sweph` version and checksum-pinned data files as Sky, a license gate (`SWISS_EPHEMERIS_LICENSE`), and `/api/v1/astro/*` for natal, positions, progressed, solar arc and solar return. It matches Sky exactly on the sample chart. A separate astro service is no longer needed unless Vercel can't run `sweph`.
- ✅ Make the `AstrologyEngine` interface asynchronous and add loading states to the chart screens (shared cache; the previous chart stays on screen while recalculating)
- ✅ Chart workspace on real calculations in server mode (natal, transits, progressions, solar arcs, solar returns), labelled "not yet checked against reference charts"
- ✅ **Convergence timeline** (`/app/timeline`): transits, progressions, solar arcs, lunations and eclipses to the natal chart over 3–24 months or a custom range (up to 3 years). It shows orb windows, every exact pass (retrograde flagged), stations, a day-by-day density strip, and the busiest periods with their focus point and house. Opens the chart at any date and files observations on a timing chart. Orbs (per technique and per planet), planets, aspects and techniques are each practice's own saved defaults (Settings → Astrology, or "Save as my defaults" on the timeline).
- ⬜ Synastry and composite screens on the new techniques (built and tested in `lib/astro/techniques`)

### Files and delivery
- ✅ File storage with two drivers: local disk for development, and S3-compatible storage for production (e.g. Cloudflare R2). In production, browsers upload directly to the bucket with signed URLs, so large files never pass through Vercel.
- ✅ Real reading uploads with real progress, plus client file uploads. Download, "view only" and expiry rules are enforced on the server for every request. Audio and video support seeking.
- 🟡 S3 driver is written and type-checked but not yet run against a real bucket (needs an R2 or S3 account)
- ⬜ Clean up abandoned uploads (files uploaded but never attached to a reading)
- ✅ Email to the client when a reading is delivered (needs Resend configured to actually send)
- ✅ Real audio, video and PDF viewing in the portal for uploaded files (sample data still uses the simulated players)

### Email
- ✅ Email sending through Resend. Without a key, emails go to the `outbox` table and the server log.
- 🔒 Connect Resend for AstrologersDirect. Needs an API key and a verified sending domain.

### Hosting
- 🔒 Neon database for AstrologersDirect (needs your Neon account)
- 🔒 Vercel project for the web app (needs your Vercel account)
- ⬜ Production environment variables and a backup policy

### Billing
- ⬜ Stripe subscription (plans and prices to be decided)

### Accessibility and installable app
- ✅ Accessibility review: axe-core scan of 46 screens at desktop and phone width. Serious and critical issues went from 669 to 0 (contrast, form labels, control names, link names, keyboard access to scrolling regions). The scan now runs in CI.
- ✅ "Skip to content" link, labelled landmarks, a main region on every page
- ✅ Installable app (PWA): manifest, app icons, app shortcuts, a service worker that caches static files only (never data), and an offline page
- ⬜ Manual screen-reader pass (VoiceOver/NVDA) on the main workflows. Automated checks catch most but not all issues.

### Quality
- ✅ Unit tests: encryption, validation, and a check that the server schema keeps up with the UI's data types
- ✅ End-to-end smoke test: sign-up → verify → sample data → edit persists → wizard → encryption → invite → portal isolation → second-practice isolation → login
- ✅ UI flow test: consultation, task, observation, link delivery, settings and delete. Fails on any rejected save.
- ✅ Two-factor test (full lifecycle) and RFC 4226 test vectors
- ✅ Recording test (Chromium simulated microphone)
- ✅ Storage test: real upload, client viewing and downloading, view-only and expiry rules, Range requests, private and shared files, isolation between practices, and file removal on delete
- ✅ GitHub Actions CI: typecheck, unit tests, migrations, build, every end-to-end test (including the timeline, on real Swiss Ephemeris files), and the standalone demo build

## Phase 2: recording and intelligence
- ✅ (started early) Recordings made with real devices upload when saved or delivered, and play in the portal (tested with a simulated microphone)
- Server-side transcoding (WebM to MP4/HLS) for wider playback support
- AI assistant over the practitioner's own observations and chart data, keeping Sky's split of calculated facts vs generated text
- Reports from real data, reminder emails, importers from other astrology software

## Phase 3: integrations and polish
- Google and Outlook calendar sync, self-service booking, payments
- Transcription and captions
- Accessibility review, performance work, packaged mobile apps (Capacitor)

## Decisions needed from you
1. Method for progressed angles; solar return conventions; composite house method; default aspects and orbs (see `docs/sky-engine-review.md`)
2. Whether births before 1800 need supporting
- ✅ Decided 2026-11-15: timeline orbs are each astrologer's own settings (built-in defaults 1°/1°/3°/5°); default transiting planets Mars outward; density weighting as built.
- ✅ Decided 2026-11-15: the Swiss Ephemeris Professional License covers any tool you make, AstrologersDirect included. Set `SWISS_EPHEMERIS_LICENSE=confirmed` in production.
3. Hosting accounts: Neon, Vercel, Resend (domain), and later Cloudflare R2 for file storage
