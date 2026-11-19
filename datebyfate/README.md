# Datebyfate

A relationship pattern tool, offered on subscription.

| | What it does | Plan |
|---|---|---|
| Your pattern | From your birth chart: how you love, what you need, who you are drawn to, your recurring dynamics | Free (no account needed at `/reading`) |
| Next relationship period | The next transit to your relationship points | Free |
| Pattern across past partners | What your exes share, each repeat compared with its base rate among random people born in the same years | Subscription (free members see the counts) |
| Someone new | Which repeats a new person carries or breaks; synastry and composite read as strengths and friction | Subscription |
| Calendar | Every relationship transit in the next 12 months | Subscription |

This is a standalone Next.js app. It lives in the AstrologersDirect repository for now and shares nothing with it at runtime; the folder can be moved to its own repository as it is. The Swiss Ephemeris adapter and time-zone helpers were adapted from AstrologersDirect (`lib/server/swiss.ts`, `lib/timezones.ts`).

## Run it

Node 20+ and Postgres 14+.

```bash
npm install
cp .env.example .env.local     # set DATABASE_URL and APP_ENCRYPTION_KEY (openssl rand -base64 32)
npm run db:migrate
npm run ephemeris              # Swiss Ephemeris data files → .sweph-ephe/
npm run dev
```

Give an account subscriber access without paying: `npm run plan -- you@example.com premium`.

## Tests

```bash
npm run typecheck
npm test                                   # charts, pattern statistics, couple report, timing
npm run build && npx next start -p 3100 &
npm run test:e2e                           # full walk-through in a browser (needs DATABASE_URL)
```

## Before launch

1. **Stripe.** Create a product with a monthly and a yearly price and set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`. Add a webhook to `<APP_URL>/api/stripe/webhook` for `checkout.session.completed` and `customer.subscription.created/updated/deleted`, and set `STRIPE_WEBHOOK_SECRET`. Turn on the customer portal in Stripe. The prices shown on the site are in `lib/plans.ts`; keep them equal to the Stripe prices. Checkout, the portal and the webhook have not been run against a real Stripe account yet.
2. **Swiss Ephemeris licence.** Commercial use needs a Professional License from Astrodienst that covers Datebyfate. Until then keep `SWISS_EPHEMERIS_LICENSE=staging` for testing only; set it to `confirmed` once licensed.
3. **Email.** Set `RESEND_API_KEY` and `EMAIL_FROM` so that password-reset emails are sent.
4. **Legal pages.** `/privacy` and `/terms` describe what the software does in plain language. They need the operator's company details and a lawyer's review.
5. **Birthplaces.** The built-in list has about 7,300 cities. Set `GEONAMES_USERNAME` (free account) to search every town.
6. **Hosting.** On Vercel set the project's root directory to `datebyfate`; `npm run vercel-build` downloads the ephemeris files and migrates the production database.

## Where things are

- `lib/reading/text.ts` — every sentence a reading can contain.
- `lib/reading/own.ts`, `exes.ts`, `couple.ts` — the rules that assemble readings. `exes.ts` explains the base-rate method.
- `lib/server/` — charts (Swiss Ephemeris), accounts, encrypted people, timing, Stripe.
- `app/actions.ts` — every form on the site.
