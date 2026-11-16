#!/usr/bin/env bash
# Kuberna Labs - Render Build Script
# Render runs `npm ci` at the repo root before this script, so every workspace
# already has its dependencies and the *:noci tasks are the right ones to call.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"

# Prisma: the client must exist before TypeScript compiles the backend.
npx prisma generate

# Migrations: `prisma migrate deploy` is the production-safe path, but this repo
# has no baselined migrations yet (backend/prisma/migrations is empty), and
# `migrate deploy` against an existing database with freshly generated SQL would
# try to re-create live tables. Skip it until the baseline migration is
# committed, and say so loudly rather than failing the deploy.
if find prisma/migrations -mindepth 1 -maxdepth 1 -type d 2>/dev/null | read -r _; then
  npx prisma migrate deploy
else
  echo "WARNING: no Prisma migrations found; skipping 'prisma migrate deploy'."
  echo "         The database schema is NOT being changed by this build."
fi

# Compile SDK -> backend -> frontend. The frontend export must exist before the
# API starts, because Express serves frontend/out as the site root.
# build:frontend:noci first regenerates frontend/src/generated/deployments.ts
# from deployments/*-latest.json, so /contracts always matches what shipped.
cd "$ROOT"
npm run build:sdk:noci
npm run build:backend:noci
npm run build:frontend:noci
