# Kuberna Labs

**Agent Orchestration Platform** — Deploy, run, and certify AI agents that autonomously execute cross-chain Web3 tasks.

Kuberna Labs gives AI agents secure execution rails across any blockchain: agents parse natural language intents, make autonomous trading decisions, settle via on-chain escrow, and get post-quantum certified for verifiable reputation — all without writing agent boilerplate.

**Target users:** Web3 developers and teams who want to deploy autonomous AI agents that can trade, monitor, and execute on any chain without managing LLM infrastructure, blockchain RPCs, or certification pipelines.

## Architecture Overview

```
User Task ("swap 1 ETH for USDC on Solana")
  → LLM Intent Parser (GPT-4 or local)     ← AI decision pathway
  → Agent Decision Engine (arbitrage/yield/stop-loss)  ← Autonomous strategy
  → Intent Creation & On-Chain Escrow       ← Execution rail
  → Task Completion → SilentVerify Cert    ← Post-quantum certification
  → Reputation Update + Decision Trace     ← Observability
```

Every agent operation is logged as a decision trace — inspect what your agent thought, why it acted, and what happened next via `GET /api/agents/:id/trace`.

## Core Distinction: Infrastructure vs. Orchestration

| This is NOT just infra tooling | This IS agent orchestration                                  |
| ------------------------------ | ------------------------------------------------------------ |
| Smart contract ABI management  | LLM-parsed natural language → structured intents             |
| RPC endpoint configuration     | Autonomous strategy evaluation (arbitrage, yield, stop-loss) |
| Wallet connection helpers      | On-chain escrow settlement with SilentVerify certification   |
| Static agent templates         | Full decision trace with AI reasoning for every action       |

## Prerequisites

| Tool                     | Version                                   |
| ------------------------ | ----------------------------------------- |
| Node.js                  | >= 18.0.0                                 |
| npm                      | >= 9.0.0                                  |
| Supabase account         | Free tier (for database)                  |
| WalletConnect Project ID | Free from https://cloud.walletconnect.com |

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials (see "Supabase Setup" below)
# Minimum required: DATABASE_URL, DIRECT_URL, JWT_SECRET

# 3. Run database migrations
cd backend && npx prisma migrate dev && cd ..

# 4. Start backend (API on port 3000)
cd backend && npm run dev

# 5. In another terminal, start frontend (dev server on port 3001)
cd frontend && npm run dev
```

## Supabase Database Setup

1. **Create a project** at https://supabase.com (free tier works).
2. **Go to Project Settings → Database** and find the connection strings:
   - **Connection string (transaction pooler)**: `postgresql://postgres.project-ref:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
   - **Direct connection**: `postgresql://postgres.project-ref:password@db.project-ref.supabase.co:5432/postgres`
3. **Set these in your `.env`**:

```
DATABASE_URL="postgresql://postgres.project-ref:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.project-ref:password@db.project-ref.supabase.co:5432/postgres"
```

> **Why two URLs?** Supabase uses PgBouncer for connection pooling. `DATABASE_URL` (transaction pooler) is used for normal app queries. `DIRECT_URL` bypasses the pooler and is only used by Prisma Migrate (which needs direct database access).

### Common Supabase Connection Errors

| Error                                                | Cause                | Fix                                                                                                             |
| ---------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `no pg_hba.conf entry`                               | Wrong host/port      | Use pooler (`*.pooler.supabase.com:6543`) for `DATABASE_URL`, direct (`db.*.supabase.co:5432`) for `DIRECT_URL` |
| `too many connections`                               | Pooler limit hit     | Add `&connection_limit=1` to `DATABASE_URL`                                                                     |
| `SSL required`                                       | Missing `sslmode`    | Append `?sslmode=require` to connection strings                                                                 |
| `password authentication failed`                     | Wrong password       | Reset via Supabase Dashboard → Database → Reset password                                                        |
| `Prisma needs direct database access for migrations` | `DIRECT_URL` missing | Set `DIRECT_URL` in your `.env` or environment variables                                                        |

## Deploy to Render (One-Click)

Kuberna Labs is configured for zero-manual-intervention deployment on [Render](https://render.com).

### Prerequisites

1. A [Render account](https://dashboard.render.com/register)
2. A Supabase PostgreSQL database (see "Supabase Database Setup" above)
3. Smart contracts deployed on your target chain (testnet or mainnet)
4. A [WalletConnect Project ID](https://cloud.walletconnect.com) (free)

### Option A: Deploy via Blueprint (Recommended)

1. Fork/clone this repository to your GitHub account.
2. In Render Dashboard, click **New → Blueprint**.
3. Connect your GitHub repo.
4. Render reads `render.yaml` and prompts for `sync: false` variables.
5. Fill in the required variables (see below).
6. Click **Apply** – Render builds and deploys automatically.

### Option B: Manual Web Service Setup

1. In Render Dashboard, click **New → Web Service**.
2. Connect your GitHub repo.
3. Configure the service:

   | Setting               | Value                  |
   | --------------------- | ---------------------- |
   | **Name**              | `kuberna-labs`         |
   | **Environment**       | `Node`                 |
   | **Build Command**     | `npm run build:all`    |
   | **Start Command**     | `npm run start:render` |
   | **Health Check Path** | `/health`              |
   | **Plan**              | `Starter` or higher    |

4. Add environment variables (see table below).
5. Click **Create Web Service**.

### Required Environment Variables

| Variable                               | Description                               | Example                                                                                                                 |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                         | Supabase transaction pooler URL (runtime) | `postgresql://postgres.p-ref:pass@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL`                           | Supabase direct URL (Prisma Migrate only) | `postgresql://postgres.p-ref:pass@db.p-ref.supabase.co:5432/postgres`                                                   |
| `JWT_SECRET`                           | JWT signing key (`openssl rand -hex 32`)  | `a1b2c3d4...`                                                                                                           |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud ID                    | `abc123...`                                                                                                             |

### Required for Web3 Features

| Variable                          | Description                      | Example                    |
| --------------------------------- | -------------------------------- | -------------------------- |
| `RPC_URL`                         | Blockchain RPC endpoint          | `https://sepolia.base.org` |
| `PRIVATE_KEY`                     | Backend wallet private key       | `0xabc...`                 |
| `ESCROW_CONTRACT_ADDRESS`         | Deployed Escrow contract         | `0x123...`                 |
| `INTENT_CONTRACT_ADDRESS`         | Deployed Intent contract         | `0x456...`                 |
| `AGENT_REGISTRY_CONTRACT_ADDRESS` | Deployed AgentRegistry contract  | `0x789...`                 |
| `CERTIFICATE_CONTRACT_ADDRESS`    | Deployed CertificateNFT contract | `0xabc...`                 |
| `REPUTATION_CONTRACT_ADDRESS`     | Deployed ReputationNFT contract  | `0xdef...`                 |

### Optional

| Variable                                              | Description                  | Notes                                |
| ----------------------------------------------------- | ---------------------------- | ------------------------------------ |
| `REDIS_URL`                                           | Redis connection string      | Rate limiting; falls back gracefully |
| `STRIPE_SECRET_KEY`                                   | Stripe API key               | For fiat payments                    |
| `OPENAI_API_KEY`                                      | OpenAI API key               | For AI agent features                |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP credentials             | For email notifications              |
| `FROM_EMAIL`                                          | Sender email address         | `noreply@yourdomain.com`             |
| `FRONTEND_DIST_PATH`                                  | Frontend build output path   | `../frontend/out`                    |
| `ALLOWED_ORIGINS`                                     | Comma-separated CORS origins | `https://your-app.onrender.com`      |

### GitHub Secrets (for Automated Migrations)

The `.github/workflows/migrate-database.yml` workflow runs Prisma Migrate automatically on pushes to `main`/`develop` that change `prisma/schema.prisma`.

Add these secrets in your repo **Settings → Secrets and variables → Actions**:

| Secret         | Value                                |
| -------------- | ------------------------------------ |
| `DATABASE_URL` | Your Supabase transaction pooler URL |
| `DIRECT_URL`   | Your Supabase direct connection URL  |

### Post-Deployment

1. **Run initial migration**: If starting with an empty database:

   ```bash
   # Locally (one-time):
   cd backend && npx prisma migrate dev --name init
   git add prisma/migrations && git commit -m "Initial migration"
   git push
   # GitHub workflow will deploy migration to production
   ```

2. **Verify deployment**: Visit `https://your-app.onrender.com/health` – expect `{"status":"ok"}`.

3. **Visit the app**: `https://your-app.onrender.com/` shows the Kuberna Labs dashboard.

## Project Structure

```
kuberna-labs/
├── render.yaml              # Render blueprint (infra as code)
├── render-build.sh          # Build script for Render
├── .renderignore            # Files excluded from deployment
├── contracts/               # Smart contracts (Solidity)
├── backend/                 # Node.js + Express + Prisma API
│   ├── src/
│   │   ├── index.ts         # Express server entry point
│   │   ├── routes/          # REST API routes
│   │   ├── services/        # Business logic services
│   │   │   ├── intentParser.ts    # NL intent parser (rule-based + compromise)
│   │   │   ├── agentDecision.ts   # Agent decision engine (arbitrage/yield/stop-loss)
│   │   │   ├── localMemory.ts     # RAG memory with TF-IDF + cosine similarity
│   │   │   ├── embeddingService.ts # Transformers.js + hash fallback embeddings
│   │   │   └── ragService.ts      # Retrieval-augmented generation pipeline
│   │   ├── middleware/       # Auth, validation, rate limiting
│   │   └── utils/           # Prisma, logger, ABIs
│   └── prisma/              # Schema and migrations (includes IntentMemory, AgentMemory)
│   └── prisma/              # Schema and migrations
├── frontend/                # Next.js dashboard (static export)
│   └── src/
│       ├── pages/           # Application pages
│       ├── components/      # Reusable UI components
│       ├── lib/             # Wagmi, contracts, chains config
│       ├── services/        # Smart contract interaction services
│       └── context/         # Auth context provider
├── sdk/                     # @kuberna/sdk TypeScript SDK
└── examples/                # Agent template examples
```

## Architecture

- **Backend API**: Express server on configurable `PORT` (Render assigns dynamically)
- **Frontend**: Next.js static export served by Express middleware
- **Database**: PostgreSQL via Prisma ORM (migrations run automatically on deploy)
- **Blockchain**: Contract interaction via ethers.js/viem (separately deployed contracts)
- **Optional**: Redis for rate limiting, NATS for message queue

## AI Agent System

Kuberna Labs has two AI tiers: a **local zero-dependency parser** and an **OpenAI GPT-4 pipeline** for full autonomous agent behavior.

### 1. Autonomous Agent Orchestration (LLM-Powered)

The headline feature: give an agent a task in plain English and it runs autonomously.

```
POST /api/agents/:id/run
Body: { "task": "swap 1 ETH for USDC on Solana, avoid DEXes with low liquidity" }

Response:
{
  "steps": [
    { "step": "resolve_agent",        "status": "completed" },
    { "step": "llm_intent_parsing",    "status": "completed",
      "output": { "model": "gpt-4-turbo-preview",
                  "parsedIntent": { "sourceChain": "solana", "sourceToken": "ETH", ... } }},
    { "step": "market_analysis",       "status": "completed",
      "output": { "prices": { "ETH": 3200, ... }, "apy": { "Aave": 3.5, ... } }},
    { "step": "agent_decision",        "status": "completed",
      "output": { "action": { "type": "postIntent",
                              "reason": "Arbitrage: 2.3% diff on Raydium vs Orca",
                              "confidence": 0.72 } }},
    { "step": "intent_creation",       "status": "completed",
      "output": { "id": "...", "status": "OPEN" }},
    { "step": "decision_trace_logging","status": "completed" }
  ]
}
```

- **Service**: `backend/src/services/agentOrchestrator.ts`
- **Route**: `backend/src/routes/agentOrchestrator.ts`
- **Decision trace**: `GET /api/agents/:id/trace` — inspect every past decision
- **Preview mode**: `POST /api/agents/:id/preview` — see what the agent would do without executing
- **LLM**: Uses `gpt-4-turbo-preview` (requires `OPENAI_API_KEY`) or falls back to local intent parser

### 2. Natural Language Intent Parser

- **Service**: `backend/src/services/intentParser.ts`
- **API**: `POST /api/intents/parse` with `{ description: string }`
- **Libraries**: `compromise` (NLP entity extraction), custom regex patterns
- **Method**: Hybrid rule-based parser with RAG-enhanced retrieval
- **Confidence scoring**: Rule match (0.6-1.0), keyword fallback (<0.6), RAG memory (>0.9)
- **SDK**: `sdk.intent.parse("swap 1 ETH for USDC on Solana")`

### 3. Agent Decision Engine

- **Service**: `backend/src/services/agentDecision.ts`
- **API**: `POST /api/agents/:id/decide` with `{ strategies: string[] }`
- **Strategies**: Arbitrage (cross-DEX price diff), Yield optimization (APY comparison), Stop-loss (price drop detection)
- **Market data**: Deterministic mock provider based on block timestamp

### 4. AI-Assisted Agent Creation Wizard

- **Component**: `frontend/src/components/AIAssistant.tsx`
- **Integration**: Embedded in `/agents` page creation wizard
- **Heuristics**: Framework/tool suggestions based on description keywords
- **Intent parsing**: Real-time via backend `/api/intents/parse`

### 5. Local Memory & RAG System

- **Service**: `backend/src/services/localMemory.ts`
- **Embeddings**: Transformers.js (`Xenova/all-MiniLM-L6-v2`) with hash fallback
- **Storage**: Prisma models (`IntentMemory`, `AgentMemory`)
- **Retrieval**: Cosine similarity + Jaccard coefficient matching
- **Auto-learning**: Successful parses stored and retrieved for future queries

### 6. OpenAI Integration (Optional)

When `OPENAI_API_KEY` is set, Kuberna uses GPT-4 for:

- Intent parsing with higher accuracy and broader language understanding
- Agent code generation (ElizaOS, LangChain, AutoGen, Rig frameworks)
- Code assistance (explain, debug, optimize, complete)
- Test case generation and agent code validation

See `backend/src/services/ai.ts` for the full integration.

### Configuration (.env)

```bash
# AI Parser
AI_PARSER_RULE_SET=default
AI_PARSER_MIN_CONFIDENCE=0.6

# Agent Decision Engine
AGENT_ARBITRAGE_THRESHOLD=0.5
AGENT_MAX_SLIPPAGE=1.0
AGENT_STOP_LOSS_PERCENT=5.0
AGENT_MIN_YIELD_DIFF=1.0

# OpenAI (optional — enables LLM-powered agent orchestration)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

> **Note**: Transformers.js models are auto-downloaded on first use. The embedding model (~80MB) is cached at `~/.cache/xenova/transformers-v3/`.

## SDK (npm Package)

The Kuberna SDK is published on npm as [`@kuberna/sdk`](https://www.npmjs.com/package/@kuberna/sdk).

```bash
npm install @kuberna/sdk
```

```typescript
import { KubernaClient } from '@kuberna/sdk';

const client = new KubernaClient({ baseUrl: 'https://api.kuberna.com' });

// Parse intents, manage agents, handle payments, deploy to TEE
const intent = await client.ai.parseIntent('swap 1 ETH for USDC on Solana');
const agent = await client.tee.createEnclave({ name: 'my-agent' });
const payment = await client.payment.createIntent({
  sourceChain: 'ethereum',
  sourceToken: 'ETH',
  sourceAmount: '1.0',
  destChain: 'solana',
  destToken: 'USDC',
});
```

See [SDK README](./sdk/README.md) for complete API documentation.

## Kite AI Integration (Agent Payments)

Kuberna integrates [Kite AI](https://gokite.ai/) — the payments layer for the agent economy. AI agents can discover, pay for, and settle with services using **Kite Passport** (session-based spending) and the **x402** payment protocol.

### Architecture

```
User → Kite Passport (passkey approval) → Agent → Spending Session
  → x402 Payment → Pieverse Facilitator → Kite Chain Settlement
```

### Key Components

- **Kite Passport**: Users create an account at [agentpassport.ai](https://agentpassport.ai), fund a wallet with USDC.e on Kite Chain, and approve spending sessions with passkeys
- **Spending Sessions**: Budget (per-tx + total), TTL, asset scope — agents spend only within the envelope
- **x402 Payments**: HTTP 402 `Payment Required` flow with `X-PAYMENT` header, settled via the Pieverse facilitator
- **Kite Chain**: EVM-compatible L1 (Chain ID 2368, RPC `https://rpc-testnet.gokite.ai`)

### Setup

1. Create Passport account at [agentpassport.ai](https://agentpassport.ai)
2. Fund wallet via faucet or transfer USDC.e
3. Connect wallet: `POST /api/kite/wallet/connect`
4. Register agent (auto on creation) for Kite DID
5. Create spending session: `POST /api/kite/sessions/create`
6. Approve session URL (passkey)
7. Execute x402 payments via SDK: `sdk.kite.createX402Payment()`

See [KITE.md](./KITE.md) for full integration guide and API reference.

## Smart Contracts

Smart contracts are deployed separately (not part of this Render deployment). After deploying contracts, set their addresses in the environment variables listed above. Deployment scripts are in `scripts/` and `hardhat.config.ts`.

## License

MIT
