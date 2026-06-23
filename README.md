<div align="center">

# Kuberna Labs

**Agent Orchestration Platform** — Deploy, run, and certify autonomous AI agents that execute cross-chain Web3 tasks.

[![CI Status](https://img.shields.io/github/actions/workflow/status/kawacukennedy/kuberna-labs/ci.yml?branch=main&label=CI&logo=github)](https://github.com/kawacukennedy/kuberna-labs/actions)
[![GitHub Stars](https://img.shields.io/github/stars/kawacukennedy/kuberna-labs?style=flat&logo=github)](https://github.com/kawacukennedy/kuberna-labs/stargazers)
[![NPM Version](https://img.shields.io/npm/v/@kuberna/sdk?label=SDK&logo=npm)](https://www.npmjs.com/package/@kuberna/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-Latest-2D3748?logo=prisma)](https://www.prisma.io/)
[![Twitter Follow](https://img.shields.io/twitter/follow/Arnaud_Kennedy?style=social)](https://x.com/Arnaud_Kennedy)

<br/>

### ⭐️ **If you find this project useful, please star it on GitHub!** ⭐️

*It helps others discover the project and motivates contributors.*

[![Star History Chart](https://api.star-history.com/svg?repos=kawacukennedy/kuberna-labs&type=Date)](https://star-history.com/#kawacukennedy/kuberna-labs&Date)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [Community](#community)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Kuberna Labs gives AI agents secure execution rails across any blockchain: agents parse natural language intents, make autonomous trading decisions, settle via on-chain escrow, and get post-quantum certified for verifiable reputation.

**Target users:** Web3 developers and teams who want to deploy autonomous AI agents that can trade, monitor, and execute on any chain without managing LLM infrastructure, blockchain RPCs, or certification pipelines.

### ✨ What Makes Kuberna Different?

| Feature | Kuberna | Others |
|---------|---------|--------|
| **Natural Language → On-Chain Action** | Parse "swap 1 ETH for USDC on Solana" → escrow → execution → certificate | Require manual intent encoding |
| **Post-Quantum Certificates** | SilentVerify certification for agents | No verifiable reputation |
| **Cross-Chain by Default** | Ethereum, Base, Polygon, Arbitrum, Solana | Usually single-chain |
| **TEE Execution** | Intel SGX enclave provisioning | No hardware-grade security |
| **Local AI Mode** | Zero-dependency intent parser, no API key needed | Require OpenAI/Gemini |

---

## Architecture

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

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 18.0.0 < 26.0.0 |
| npm | >= 9.0.0 |
| PostgreSQL | 14+ (or Supabase free tier) |
| WalletConnect ID | Free from [cloud.walletconnect.com](https://cloud.walletconnect.com) |

### Setup in 2 Minutes

```bash
# 1. Clone and install
git clone https://github.com/kawacukennedy/kuberna-labs.git
cd kuberna-labs
npm install

# 2. Install workspace dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd sdk && npm install && cd ..

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit DATABASE_URL, JWT_SECRET (openssl rand -hex 32)

# 4. Set up database
cd backend && npx prisma migrate dev && cd ..

# 5. Compile smart contracts
npx hardhat compile

# 6. Start the backend (API on port 3000)
cd backend && npm run dev

# 7. In another terminal, start the frontend (port 3001)
cd frontend && npm run dev
```

> **Tip:** Use `docker-compose up` for a fully local environment with PostgreSQL pre-configured.

### Run Tests

```bash
# All contract tests
npx hardhat test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# SDK tests
cd sdk && npm test
```

### Try the SDK

```typescript
import { KubernaClient } from '@kuberna/sdk';

const client = new KubernaClient({
  apiKey: 'your-api-key',
});

// Create an agent with a natural language task
const task = await client.agents.createTask({
  intent: 'swap 1 ETH for USDC on Base when price > 3200',
  strategy: 'limit_order',
});

// Monitor execution
const result = await client.agents.waitForCompletion(task.id);
console.log('Task completed:', result.certificate);
```

---

## Key Features

- **🤖 Autonomous Agent Orchestration** — LLM-powered task execution with full decision tracing
- **🔤 Natural Language Intent Parsing** — Parse "swap 1 ETH for USDC on Solana" into structured intents
- **📊 Agent Decision Engine** — Arbitrage, yield optimization, and stop-loss strategies
- **🔒 On-Chain Escrow** — Secure settlement with dispute resolution
- **🌉 Cross-Chain Intents** — Multi-chain task creation and bidding marketplace
- **💸 Kite x402 Payments** — Agent-controlled micro-payments via Kite protocol
- **🛡️ SilentVerify** — Post-quantum certificate issuance for agents and chain state
- **🖥️ TEE Support** — Intel SGX enclave provisioning for secure execution
- **⭐ Reputation System** — On-chain agent reputation with ERC-8004 alignment
- **🧠 Local AI** — Zero-dependency intent parser with RAG memory (no API key required)

---

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
│   └── prisma/              # Schema reference
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

---

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

---

## Deployment

Kuberna is configured for one-click deployment on [Render](https://render.com) via `render.yaml` (Blueprint). Manual setup also supported.

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for full instructions.

### Production Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase transaction pooler URL |
| `DIRECT_URL` | Supabase direct URL for migrations |
| `JWT_SECRET` | JWT signing key |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |
| `RPC_URL` | Blockchain RPC endpoint |
| `PRIVATE_KEY` | Backend wallet private key |

Optional: `REDIS_URL`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `SMTP_*` for extended features.

---

## Sub-Projects

- [Backend README](./backend/README.md) — Express API, Prisma, Zod
- [Frontend README](./frontend/README.md) — Next.js dashboard
- [SDK README](./sdk/README.md) — `@kuberna/sdk` npm package
- [Contracts README](./contracts/README.md) — Smart contract suite
- [Examples](./examples/README.md) — Agent template examples

---

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) to get started.

### 🎯 Good First Issues

Check out issues labeled [`good first issue`](https://github.com/kawacukennedy/kuberna-labs/labels/good%20first%20issue) for starter tasks.

### 🐛 Report a Bug

Found something wrong? [Open an issue](https://github.com/kawacukennedy/kuberna-labs/issues/new?labels=bug&template=bug_report.md).

### 💡 Suggest a Feature

Have an idea? [Submit a feature request](https://github.com/kawacukennedy/kuberna-labs/issues/new?labels=enhancement&template=feature_request.md).

---

## Community

- **💬 Discord:** [Join the server](https://discord.gg/MZvNuhpXu) — get help, share agents, meet the community
- **🐦 X (Twitter):** [@Arnaud_Kennedy](https://x.com/Arnaud_Kennedy)
- **💬 GitHub Discussions:** [Join the conversation](https://github.com/kawacukennedy/kuberna-labs/discussions)
- **📚 Documentation:** Coming soon
- **🛡️ Security:** Report vulnerabilities to [security@kubernalabs.com](mailto:security@kubernalabs.com)

### Support Us

If Kuberna Labs helps your project, please consider:

1. ⭐ **Starring the repo** — it helps others discover us
2. 💬 **Joining the Discord** — connect with other agent builders
3. 🐦 **Following on X** for updates
4. 💰 **Sponsoring development** via crypto or [GitHub Sponsors](https://github.com/sponsors)

---

## Roadmap

- **Q3 2026:** v1.0 Release — Mainnet contracts, production SDK, dashboard GA
- **Q4 2026:** Agent Marketplace — Community agent templates, strategy sharing
- **Q1 2027:** Cross-Chain Expansion — Solana, NEAR, Polkadot support
- **Q2 2027:** Enterprise — RBAC, audit logging, compliance reporting

---

## Built With

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Hardhat-Latest-FFCB1E?logo=ethereum&logoColor=black" alt="Hardhat" />
  <img src="https://img.shields.io/badge/Prisma-Latest-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/OpenZeppelin-5.x-4E5EE4?logo=openzeppelin&logoColor=white" alt="OpenZeppelin" />
</p>

---

## Contributors

<a href="https://github.com/kawacukennedy/kuberna-labs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kawacukennedy/kuberna-labs" alt="Contributors" />
</a>

---

## License

MIT — see [LICENSE](./LICENSE).

<p align="center">
  <strong>Made with ❤️ by the Kuberna Labs team</strong>
  <br/>
  <sub>If you like this project, </sub>
  <a href="https://github.com/kawacukennedy/kuberna-labs">
    <sub>⭐ star it on GitHub</sub>
  </a>
  <sub>!</sub>
</p>
