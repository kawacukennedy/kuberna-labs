<div align="center">

# ⚡ Kuberna Labs

**The Full-Stack Platform for Agentic Web3.** Build, deploy, certify, and monetize autonomous AI agents that execute real work across decentralized networks.

[![CI Status](https://img.shields.io/github/actions/workflow/status/kawacukennedy/kuberna-labs/ci.yml?branch=main&label=CI&logo=github)](https://github.com/kawacukennedy/kuberna-labs/actions)
[![GitHub Stars](https://img.shields.io/github/stars/kawacukennedy/kuberna-labs?style=flat&logo=github)](https://github.com/kawacukennedy/kuberna-labs/stargazers)
[![NPM Version](https://img.shields.io/npm/v/@kuberna/sdk?label=SDK&logo=npm)](https://www.npmjs.com/package/@kuberna/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Conformance](https://img.shields.io/badge/Conformance-20%2F20-6f42c1)](./CONFORMANCE.md)

<br/>

> ### ⭐ Star us — we ship proof, not promises. Every star funds the next public milestone.
>
> Live benchmark: **128/128 x402 payments settled · 20/20 conformance vectors passing · 7/7 SilentVerify E2E**

[![Star History](/docs/assets/star-history.svg)](https://star-history.com/#kawacukennedy/kuberna-labs&Date)

</div>

---

## 📋 Table of Contents

- [Why Kuberna](#why-kuberna)
- [Live Proof](#live-proof)
- [Partners & Citations](#partners--citations)
- [Quick Start](#quick-start)
- [Try the SDK](#try-the-sdk)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

---

## Why Kuberna

Kuberna Labs gives AI agents secure execution rails across any blockchain: agents parse natural language intents, make autonomous decisions, settle via on-chain escrow, pay through the **x402 rail**, and get **post-quantum certified** for verifiable reputation.

| Feature                                | Kuberna                                                                  | Others                         |
| -------------------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| **Natural Language → On-Chain Action** | Parse "swap 1 ETH for USDC on Solana" → escrow → execution → certificate | Require manual intent encoding |
| **Post-Quantum Certificates**          | SilentVerify certification for agents                                    | No verifiable reputation       |
| **x402 Agent Payments**                | Agents pay for resources via EIP-3009, real money on Base mainnet        | Single-rail or signer-only     |
| **Cross-Chain by Default**             | Ethereum, Base, Polygon, Arbitrum, Solana                                | Usually single-chain           |
| **TEE Execution**                      | Intel SGX enclave provisioning                                           | No hardware-grade security     |
| **Local AI Mode**                      | Zero-dependency intent parser, no API key needed                         | Require OpenAI/Gemini          |

**Target users:** Web3 developers and teams deploying autonomous AI agents that trade, monitor, and execute on any chain — without managing LLM infrastructure, blockchain RPCs, or certification pipelines.

---

## Live Proof

This repo is **build in public**. Numbers below are measured, not aspirational.

| Milestone | Result | Evidence |
| --------- | ------ | -------- |
| **x402 payments** | 5 payments settled on Base mainnet ($0.01 each, real money) | `reports/`, settlement hashes on BaseScan |
| **Burst load test** | 128/128 UserOps submitted, 0 failures | `reports/tollbeam-base-sepolia-burst-*.json` |
| **Conformance** | 20/20 verification vectors pass | [`CONFORMANCE.md`](./CONFORMANCE.md) |
| **SilentVerify E2E** | 7/7 pipeline stages passing | `scripts/test-silentverify-pipeline.ts` |
| **Contract tests** | 33+ Dispute contract edge-case guards | `test/Dispute.ts` |
| **Discord ops** | CI + star alerts live, 4 scheduled broadcasts | `.github/workflows/` |

---

## Partners & Citations

Kuberna is load-bearing for other projects. See [`CONFORMANCE.md`](./CONFORMANCE.md) for pinned cross-repo citations.

| Partner / Project | Relationship | Status |
| ----------------- | ------------ | ------ |
| **elizaOS/eliza** | Agent Certification Framework discussion `#9810` — Kuberna conformance vector set adopted | Active |
| **0xddneto/AI-Proof-of-Us** | Reciprocal pinned conformance fixtures, mutual citations | Live |
| **awesome-erc8004** | ERC-8004 certification implementation reference | Listed |
| **Tollbeam** | x402 payment rail — first external team to put real payments through it | Live |
| **Rooster Agents** | Founding Agent #1 (KubernaAgent) — full sandbox lifecycle traced on-chain | Live |
| **Virtuals** | Sponsored compute — Claude Opus 4 via ACP | Live |
| **Pyth Network** | Price oracle (ETH, BTC, USDC) | Live |
| **Discord** | CI notifications + GitHub star alerts | Live |

---

## Quick Start

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

# Backend / Frontend / SDK tests
cd backend && npm test
cd frontend && npm test
cd sdk && npm test
```

---

## Try the SDK

Install from npm: `npm install @kuberna/sdk` (v1.0.5 live).

```typescript
import { KubernaClient } from '@kuberna/sdk';

const client = new KubernaClient({ apiKey: 'your-api-key' });

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

## Architecture

```
User Task ("swap 1 ETH for USDC on Solana")
  -> LLM Intent Parser (GPT-4 / Claude Opus 4 / local)
  -> Agent Decision Engine (arbitrage/yield/stop-loss)
  -> Intent Creation & On-Chain Escrow
  -> x402 Payment Rail (Tollbeam) — agent buys resources w/ USDC
  -> Task Completion -> SilentVerify Cert
  -> Reputation Update + Decision Trace
```

| Package         | Directory    | Description                                         |
| --------------- | ------------ | --------------------------------------------------- |
| Backend API     | `backend/`   | Express + Prisma + Zod REST API (port 3000)         |
| Frontend        | `frontend/`  | Next.js 14 dashboard with pages router              |
| SDK             | `sdk/`       | `@kuberna/sdk` npm package for programmatic access  |
| Smart Contracts | `contracts/` | Solidity contracts (Escrow, Intent, Registry, NFTs) |
| Prisma Schema   | `prisma/`    | Shared database schema and migrations               |

---

## Key Features

- **🤖 Autonomous Agent Orchestration** — LLM-powered task execution with full decision tracing
- **🔤 Natural Language Intent Parsing** — Parse "swap 1 ETH for USDC on Solana" into structured intents
- **📊 Agent Decision Engine** — Arbitrage, yield optimization, and stop-loss strategies
- **🔒 On-Chain Escrow** — Secure settlement with dispute resolution
- **🌉 Cross-Chain Intents** — Multi-chain task creation and bidding marketplace
- **💸 x402 Payments** — Agent-controlled micro-payments via Tollbeam rail (EIP-3009)
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
│   │   ├── middleware/      # Auth, validation, rate limiting, error handling
│   │   ├── validations/     # Zod schemas for request validation
│   │   └── utils/           # Prisma client, logger, ABIs
│   └── prisma/              # Schema reference
├── frontend/                # Next.js 14 dashboard
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

| Script                   | Description                      |
| ------------------------ | -------------------------------- |
| `npm run dev`            | Start frontend dev server        |
| `npm test`               | Run Hardhat contract tests       |
| `npm run compile`        | Compile Solidity contracts       |
| `npm run build:all`      | Build SDK, backend, and frontend |
| `npm run format`         | Format code with Prettier        |
| `npm run lint`           | Lint TypeScript with ESLint      |
| `npm run db:deploy`      | Deploy Prisma migrations         |
| `npm run db:generate`    | Generate Prisma client           |
| `npm run deploy:sepolia` | Deploy contracts to Sepolia      |
| `npm run deploy:base`    | Deploy contracts to Base Sepolia |

---

## Roadmap

- **Q3 2026:** v1.0 Release — Mainnet contracts, production SDK, dashboard GA
- **Q4 2026:** Agent Marketplace — Community agent templates, strategy sharing
- **Q1 2027:** Cross-Chain Expansion — Solana, NEAR, Polkadot support
- **Q2 2027:** Enterprise — RBAC, audit logging, compliance reporting

---

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) to get started.

- 🎯 **Good first issues:** [`good first issue`](https://github.com/kawacukennedy/kuberna-labs/labels/good%20first%20issue)
- 🐛 **Report a bug:** [Open an issue](https://github.com/kawacukennedy/kuberna-labs/issues/new?labels=bug&template=bug_report.md)
- 💡 **Suggest a feature:** [Submit a feature request](https://github.com/kawacukennedy/kuberna-labs/issues/new?labels=enhancement&template=feature_request.md)

---

## Community

- **💬 Discord:** [Join the server](https://discord.gg/MZvNuhpXu)
- **🐦 X (Twitter):** [@Arnaud_Kennedy](https://x.com/Arnaud_Kennedy)
- **💬 GitHub Discussions:** [Join the conversation](https://github.com/kawacukennedy/kuberna-labs/discussions)
- **🛡️ Security:** Report vulnerabilities to [security@kubernalabs.com](mailto:security@kubernalabs.com)

### Contributors

[![Contributors](https://img.shields.io/github/contributors/kawacukennedy/kuberna-labs?logo=github)](https://github.com/kawacukennedy/kuberna-labs/graphs/contributors)

|                                                                                                 | Contributor                                       | Role           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------- |
| <img src="https://avatars.githubusercontent.com/u/105758154?v=4" width="32" height="32" alt=""> | [kawacukennedy](https://github.com/kawacukennedy) | Creator & Lead |
| <img src="https://avatars.githubusercontent.com/u/66347959?v=4" width="32" height="32" alt="">  | [lovewave02](https://github.com/lovewave02)       | Contributor    |
| <img src="https://avatars.githubusercontent.com/u/154255646?v=4" width="32" height="32" alt=""> | [KaustAbhinand](https://github.com/KaustAbhinand) | Contributor    |
| <img src="https://avatars.githubusercontent.com/u/149085611?v=4" width="32" height="32" alt=""> | [TiagooopNOC](https://github.com/TiagooopNOC)     | Contributor    |

---

## License

MIT — see [LICENSE](./LICENSE).

<p align="center">
  <strong>Made with ❤️ by the Kuberna Labs team</strong>
  <br/>
  <a href="https://github.com/kawacukennedy/kuberna-labs">⭐ star it on GitHub</a> ·
  <a href="https://www.npmjs.com/package/@kuberna/sdk">install the SDK</a> ·
  <a href="./CONFORMANCE.md">read the conformance evidence</a>
</p>