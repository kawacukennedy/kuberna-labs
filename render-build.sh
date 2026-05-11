#!/usr/bin/env bash
# Kuberna Labs - Render Build Script
# Orchestrates the full build pipeline for production deployment
set -euo pipefail

echo "=== Kuberna Labs Render Build ==="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Step 1: Install root dependencies (for SDK symlink etc.)
echo "--- Installing root dependencies ---"
npm ci --include=dev

# Step 2: Build the SDK (needed by frontend)
echo "--- Building SDK ---"
cd sdk
npm ci --include=dev
npm run build
cd ..

# Step 3: Install and build backend
echo "--- Building Backend ---"
cd backend
npm ci --include=dev
npx prisma generate
npm run build
cd ..

# Step 4: Install and build frontend
echo "--- Building Frontend ---"
cd frontend
npm ci --include=dev
npm run build
cd ..

# Step 5: Prune dev dependencies (reduce disk footprint)
echo "--- Pruning dev dependencies ---"
npm prune --production || true
cd backend && npm prune --production || true && cd ..
cd frontend && npm prune --production || true && cd ..

echo "=== Build Complete ==="
