# Kuberna Labs — Supabase Database Setup

This guide walks through configuring Kuberna Labs to use **Supabase PostgreSQL** as the production database.

## Quick Start

```bash
# 1. Ensure .env has DATABASE_URL and DIRECT_URL (copy from .env.example)
# 2. Create .env symlink for backend
ln -sf ../.env backend/.env

# 3. Generate Prisma client
cd backend && npx prisma generate

# 4. Deploy migrations
npx prisma migrate deploy

# 5. Start the server
npm start
```

## Connection Strings

| Purpose | Connection String |
|---------|------------------|
| **Transaction pooler** (runtime) | `postgresql://postgres.project:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| **Session pooler** (migrations) | `postgresql://postgres.project:password@aws-1-eu-north-1.pooler.supabase.com:5432/postgres` |

## Prisma Schema

The schema lives at `/prisma/schema.prisma`. All 38 tables use snake_case naming via `@@map` (e.g., `users`, `intents`, `tee_deployments`).

## CI/CD

`.github/workflows/supabase-migrations.yml` runs `prisma migrate deploy` on push to `main`. Requires GitHub Secrets:
- `DATABASE_URL` — transaction pooler URL
- `DIRECT_URL` — session pooler URL

## Migration Rules

- ✅ `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, `CREATE INDEX`
- ❌ `DROP TABLE`, `DROP COLUMN` — use multi-step instead

## Verification

```bash
curl http://localhost:3000/health
# {"status":"ok","database":"connected","provider":"supabase"}
```
