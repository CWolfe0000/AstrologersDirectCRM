#!/usr/bin/env bash
# Vercel build (runs automatically: package.json "vercel-build").
#  1. Download the Swiss Ephemeris data files (checksum-verified).
#  2. Production only: apply database migrations before the new version goes live.
#     Preview deployments never migrate the production database.
#  3. Build the app.
set -euo pipefail
npm run ephemeris
if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "Applying database migrations…"
  # Migrations use the direct (unpooled) connection when it is set.
  DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" npx drizzle-kit migrate
fi
npm run build
