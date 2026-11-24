#!/usr/bin/env bash
# Vercel build: download the ephemeris files, migrate the production database, build.
set -euo pipefail
npm run ephemeris
node scripts/check-ephemeris.cjs
if [ "${VERCEL_ENV:-}" = "production" ]; then
  DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" npx drizzle-kit migrate
fi
npm run build
