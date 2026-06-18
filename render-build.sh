#!/usr/bin/env bash
# Kuberna Labs - Render Build Script
set -euo pipefail

# Run database migrations (safe for idempotency)
npx prisma generate
npx prisma migrate deploy

# Build all packages
npm run build:all
