# Web3 Infrastructure Setup Guide

## Overview

This document provides setup instructions for the Kuberna Labs Web3 Infrastructure project, including smart contracts, backend services, and development tools.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0
- Redis >= 7.0
- Git

## Project Structure

```
kuberna-labs/
├── contracts/          # Solidity smart contracts
├── test/              # Smart contract tests
├── scripts/           # Deployment scripts
├── backend/           # Backend API services
│   ├── src/          # TypeScript source code
│   ├── prisma/       # Database schema and migrations
│   └── __tests__/    # Backend tests
├── sdk/              # TypeScript SDK for agents
├── frontend/         # Web UI (if applicable)
└── examples/         # Example implementations
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kuberna-labs/web3-infrastructure.git
cd web3-infrastructure
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

| Purpose | Connection String |
|---------|------------------|
| **Transaction pooler** (recommended for apps) | `postgresql://postgres.rjlnyyqanqhvikhjfmvk:InkomokoArchive2026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| **Session pooler** (for migrations) | `postgresql://postgres.rjlnyyqanqhvikhjfmvk:InkomokoArchive2026@aws-1-eu-north-1.pooler.supabase.com:5432/postgres` |

Set in your `.env`:

```env
DATABASE_URL="postgresql://postgres.rjlnyyqanqhvikhjfmvk:InkomokoArchive2026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.rjlnyyqanqhvikhjfmvk:InkomokoArchive2026@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
```

> **Why two URLs?**  
> `DATABASE_URL` uses the **transaction pooler** (port 6543) which works behind IPv4-only hosts like Render, Vercel, and Railway. The `connection_limit=1` prevents connection pool exhaustion in serverless environments.  
> `DIRECT_URL` uses the **session pooler** (port 5432) — used internally by `prisma migrate` to run DDL statements. This is required for IPv4-only networks (the direct IPv6 Supabase host is not reachable from most environments).

---

## 3. Deploy Migrations

### Automatically (GitHub Actions)

Every push to `main` triggers `.github/workflows/supabase-migrations.yml`, which runs:

```bash
npx prisma migrate deploy
```

The workflow requires these **GitHub Secrets**:

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Transaction pooler URL with `?pgbouncer=true` |
| `DIRECT_URL` | Direct connection URL (port 5432) |

### Manually (Local)

```bash
# 1. Ensure .env has DATABASE_URL and DIRECT_URL
# 2. Create .env symlink so the backend can find it
ln -sf ../.env backend/.env

# 3. Generate the Prisma client
cd backend
npx prisma migrate dev --name init
npx prisma generate

# 4. Deploy pending migrations
npx prisma migrate deploy
```

### 6. Start Local Services

#### Start Redis (in separate terminal)
```bash
redis-server
```

#### Start NATS (in separate terminal)
```bash
# Install NATS server: https://docs.nats.io/running-a-nats-service/introduction/installation
nats-server
```

#### Start PostgreSQL
Ensure PostgreSQL is running and accessible at the DATABASE_URL specified in `.env`

## Development Workflow

### Compile Smart Contracts

```bash
npm run compile
```

This compiles all Solidity contracts in the `contracts/` directory and generates TypeScript types in `typechain-types/`.

---

## 4. Prisma Schema & Table Naming

The Prisma schema lives at `/prisma/schema.prisma` (project root). The backend's `package.json` references it via:

```json
"prisma": { "schema": "../prisma/schema.prisma" }
```

All database tables use **snake_case plural** naming (e.g., `users`, `profiles`, `intents`, `tee_deployments`) via Prisma's `@@map` annotation. This keeps the TypeScript model names PascalCase while the database uses conventional PostgreSQL naming.

To regenerate the Prisma Client after schema changes:

```bash
cd backend
npx prisma generate
```

---

## 5. One-Time Data Migration

If you have existing data in a local PostgreSQL database, migrate it to Supabase:

```bash
npm test
```

The script is **idempotent** — it uses upserts on unique fields so you can re-run it safely.

---

## 6. Verify the Connection

```bash
npm run node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 test accounts.

## 7. Architecture Overview

In a separate terminal (with local node running):

```bash
npm run deploy:local
```

### Run Backend Development Server

---

## 8. Troubleshooting

### "Can't reach database server"

Ensure your IP is allowlisted in Supabase Dashboard → Authentication → Settings → **Network Restrictions**.

### "prepared statement already exists" errors

The `?pgbouncer=true` flag in `DATABASE_URL` enables prepared statement support for PgBouncer.  
If you still see issues, try the session pooler (port 5432):

```env
DATABASE_URL="postgresql://postgres.rjlnyyqanqhvikhjfmvk:InkomokoArchive2026@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
```

The API server will start at `http://localhost:3000`.

1. Check the workflow logs for the exact error.
2. Run the migration locally to reproduce: `npx prisma migrate deploy`.
3. If you need to roll back: `npx prisma migrate resolve --rolled-back <migration-name>`.
4. **Never run destructive operations** on the Supabase database directly.

---

## 9. Running the Backend

```bash
# 1. Ensure .env symlink exists (read from root .env)
cd backend
ln -sf ../.env .env  # creates backend/.env -> ../.env

# 2. Start the compiled server
node dist/index.js

# Or with the `start` script
npm start
```

> **Note:** `npm run dev` (ts-node) is currently not supported because `src/index.ts` does not exist. Use the compiled version via `npm start`.

### Health Check

```bash
curl http://localhost:3000/health

# Expected:
# {"status":"ok","database":"connected","provider":"supabase","uptime":...}
```
