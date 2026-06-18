# Kuberna Labs

**Agent Orchestration Platform** — Deploy, run, and certify AI agents that autonomously execute cross-chain Web3 tasks.

Kuberna Labs gives AI agents secure execution rails across any blockchain: agents parse natural language intents, make autonomous trading decisions, settle via on-chain escrow, and get post-quantum certified for verifiable reputation.

Target users: Web3 developers and teams who want to deploy autonomous AI agents that can trade, monitor, and execute on any chain without managing LLM infrastructure, blockchain RPCs, or certification pipelines.

## Architecture

This monorepo contains five main packages:

```
User Task ("swap 1 ETH for USDC on Solana")
  -> LLM Intent Parser (GPT-4 or local)
  -> Agent Decision Engine (arbitrage/yield/stop-loss)
  -> Intent Creation & On-Chain Escrow
  -> Task Completion -> SilentVerify Cert
  -> Reputation Update + Decision Trace
```

| Package | Directory | Description |
|---------|-----------|-------------|
| Backend API | `backend/` | Express + Prisma + Zod REST API (port 3000) |
| Frontend | `frontend/` | Next.js 14 dashboard with pages router |
| SDK | `sdk/` | `@kuberna/sdk` npm package for programmatic access |
| Smart Contracts | `contracts/` | Solidity contracts (Escrow, Intent, Registry, NFTs) |
| Prisma Schema | `prisma/` | Shared database schema and migrations |

## Quick Start

```bash
# 1. Install dependencies
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL and JWT_SECRET

# 3. Run database migrations
cd backend && npx prisma migrate dev && cd ..

# 4. Start backend (API on port 3000)
cd backend && npm run dev

# 5. In another terminal, start frontend (dev server on port 3001)
cd frontend && npm run dev
```

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 18.0.0 < 26.0.0 |
| npm | >= 9.0.0 |
| PostgreSQL | 14+ (or Supabase free tier) |
| WalletConnect Project ID | Free from https://cloud.walletconnect.com |

### Install

```bash
git clone https://github.com/kawacukennedy/kuberna-labs.git
cd kuberna-labs
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd sdk && npm install && cd ..
```

### Environment Variables

Copy the example env file and configure:

```bash
cp backend/.env.example backend/.env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string (transaction pooler for Supabase)
- `DIRECT_URL` — Direct database URL (for Prisma Migrate only)
- `JWT_SECRET` — JWT signing key (`openssl rand -hex 32`)
- `RPC_URL` — Blockchain RPC endpoint (e.g. `https://sepolia.base.org`)

See `backend/.env.example` for all available options.

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
# All tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Contract tests
npx hardhat test
```

## Project Structure

```
kuberna-labs/
├── backend/                 # Express + Prisma API server
│   ├── src/
│   │   ├── index.ts         # Express entry point
│   │   ├── routes/          # REST API route handlers (19 modules)
│   │   ├── services/        # Business logic (agent, AI, payments, blockchain)
│   │   ├── middleware/       # Auth, validation, rate limiting, error handling
│   │   ├── validations/     # Zod schemas for request validation
│   │   └── utils/           # Prisma client, logger, ABIs
│   └── prisma/              # Schema reference (main schema in ../prisma/)
├── frontend/                # Next.js 14 dashboard
│   └── src/
│       ├── pages/           # App pages (agents, dashboard, courses, marketplace)
│       ├── components/      # Reusable UI (dashboard, layout, shared, Wallet)
│       ├── context/         # AuthContext provider
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Wagmi, viem, contract config
│       ├── services/        # Contract interaction services
│       └── styles/          # Tailwind CSS configuration
├── sdk/                     # @kuberna/sdk TypeScript SDK
├── contracts/               # Solidity smart contracts
│   ├── Escrow.sol           # Escrow with dispute resolution
│   ├── Intent.sol           # Cross-chain intent marketplace
│   ├── AgentRegistry.sol    # Agent identity and registry
│   ├── CertificateNFT.sol   # Course completion NFTs
│   ├── ReputationNFT.sol    # Agent reputation (ERC-8004 aligned)
│   ├── CrossChainRouter.sol # Cross-chain message passing
│   └── ...                  # Payment, Subscription, Treasury, etc.
├── prisma/                  # Shared Prisma schema + migrations
├── deployments/             # Deployed contract addresses per chain
├── scripts/                 # Hardhat deploy and setup scripts
├── test/                    # Hardhat contract tests
├── examples/                # Agent template examples
├── docs/                    # Additional documentation
├── packages/                # Internal packages (aip-adapter)
├── hardhat.config.ts        # Hardhat configuration
├── docker-compose.yml       # Local Docker setup
└── render.yaml              # Render blueprint deployment
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm test` | Run Hardhat contract tests |
| `npm run compile` | Compile Solidity contracts |
| `npm run build:all` | Build SDK, backend, and frontend |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint TypeScript with ESLint |
| `npm run db:deploy` | Deploy Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run deploy:sepolia` | Deploy contracts to Sepolia |
| `npm run deploy:base` | Deploy contracts to Base Sepolia |

## Deployment

Kuberna is configured for one-click deployment on [Render](https://render.com) via `render.yaml` (Blueprint). Manual setup also supported.

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for full instructions.

Required environment variables in production:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase transaction pooler URL |
| `DIRECT_URL` | Supabase direct URL for migrations |
| `JWT_SECRET` | JWT signing key |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |
| `RPC_URL` | Blockchain RPC endpoint |
| `PRIVATE_KEY` | Backend wallet private key |

Optional: `REDIS_URL`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `SMTP_*` for extended features.

## Sub-Projects

- [Backend README](./backend/README.md) — Express API, Prisma, Zod
- [Frontend README](./frontend/README.md) — Next.js dashboard
- [SDK README](./sdk/README.md) — `@kuberna/sdk` npm package
- [Contracts README](./contracts/README.md) — Smart contract suite
- [Examples](./examples/README.md) — Agent template examples

## Key Features

- **Autonomous Agent Orchestration** — LLM-powered task execution with full decision tracing
- **Natural Language Intent Parsing** — Parse "swap 1 ETH for USDC on Solana" into structured intents
- **Agent Decision Engine** — Arbitrage, yield optimization, and stop-loss strategies
- **On-Chain Escrow** — Secure settlement with dispute resolution
- **Cross-Chain Intents** — Multi-chain task creation and bidding marketplace
- **Kite x402 Payments** — Agent-controlled micro-payments via Kite protocol
- **SilentVerify** — Post-quantum certificate issuance for agents and chain state
- **TEE Support** — Intel SGX enclave provisioning for secure execution
- **Reputation System** — On-chain agent reputation with ERC-8004 alignment
- **Local AI** — Zero-dependency intent parser with RAG memory (no API key required)

## License

MIT — see [LICENSE](./LICENSE).
