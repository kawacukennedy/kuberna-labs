#!/usr/bin/env bash
# Kuberna Labs - Render Build Script
set -euo pipefail

# Run from the backend directory for correct Prisma schema resolution
cd "$(dirname "$0")/backend"

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# Build all packages
cd ..
npm run build:all
