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
- ⬜ Real CSV client import

### Calculations: Sky engine
- ✅ Reuse review (`docs/sky-engine-review.md`)
- 🟡 Sky maintenance fixes: mirror drift, lockfile, a test syntax error, the birth-year range. ChatGPT is handling these in the Sky repo.
- ⬜ Extract Sky's calculation core into a shared package
- ⬜ Astro API service on Render: natal and transits endpoints
- ✅ Make the `AstrologyEngine` interface asynchronous and add loading states to the chart screens (shared cache; the previous chart stays on screen while recalculating)
- ⬜ Connect the chart workspace to real natal calculations, replacing the demo engine for natal charts
- 🔒 Progressions, solar arcs and solar returns. Blocked on your method decisions (see the Sky review).
- 🔒 New synastry and composite module. Blocked on the composite house-method decision and on reference charts.

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

### Quality
- ✅ Unit tests: encryption, validation, and a check that the server schema keeps up with the UI's data types
- ✅ End-to-end smoke test: sign-up → verify → sample data → edit persists → wizard → encryption → invite → portal isolation → second-practice isolation → login
- ✅ UI flow test: consultation, task, observation, link delivery, settings and delete. Fails on any rejected save.
- ✅ Two-factor test (full lifecycle) and RFC 4226 test vectors
- ✅ Recording test (Chromium simulated microphone)
- ✅ Storage test: real upload, client viewing and downloading, view-only and expiry rules, Range requests, private and shared files, isolation between practices, and file removal on delete
- ✅ GitHub Actions CI: typecheck, unit tests, migrations, build, both end-to-end tests, and the standalone demo build

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
3. Hosting accounts: Neon, Vercel, Resend (domain), and later Cloudflare R2 for file storage
