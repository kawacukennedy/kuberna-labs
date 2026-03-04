<div align="center">
  <img src="/images/kuberna-logo.svg" alt="Kuberna Labs" width="200"/>
  <h1>Kuberna Labs</h1>
  <p><strong>Architecting the Agentic Web3 Enterprise</strong></p>
</div>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
  </a>
</p>

## Overview

Kuberna Labs is a hybrid educational and technological platform that empowers developers to build, deploy, and manage autonomous AI agents operating across decentralized networks. It combines a hands-on learning environment with production-grade infrastructure for cross-chain finance, zero-knowledge privacy, and trusted execution environments.

**Vision**: To become the definitive operating system for the agentic economy, where intelligent agents seamlessly interact with both Web2 and Web3 systems, governed by cryptographic guarantees and decentralized infrastructure.

**Mission**: Equip the next generation of founders and enterprises with the tools, knowledge, and secure infrastructure to build revenue-generating autonomous agents that operate at machine speed across any blockchain.

## Key Features

### Education Platform
- Comprehensive course management with video, document, lab, and quiz content types
- Live workshops with integrated streaming, interactive coding environments, and recordings
- Progress tracking with on-chain verifiable certificates (Ethereum, NEAR)
- Self-serve SDK with templated agent code in TypeScript, Python, and Rust
- Community forums with full-text search, moderation, and notification support

### Agent Builder IDE
- Browser-based IDE with Monaco editor, syntax highlighting, and AI-assisted code completion
- Integrated file tree, terminal, debugger, and sandbox execution
- GitHub integration for version control (commit, push, pull, create PR)
- Pre-built agent templates for DeFi trading, governance monitoring, data fetching, and more
- Isolated testing sandbox with mainnet fork support

### Intent Marketplace
- Natural language task posting with NLP-parsed structured intents (EIP-7683)
- Solver network with competitive bidding and automatic or manual bid selection
- Smart contract escrow with multi-chain support (ERC-20 and native tokens)
- Decentralized reputation system based on success rate, response time, and ratings
- Dispute resolution via decentralized arbitration (Kleros)

### Execution Infrastructure
- Multi-chain support: Ethereum, Solana, NEAR, Polygon, Arbitrum
- TEE deployment via Phala Network and Marlin Oyster with on-chain remote attestation
- zkTLS integration via Reclaim Protocol and zkPass for verified Web2 data
- Decentralized compute via Akash Network, Phala, and Hyperbolic
- Real-time logging and monitoring with WebSocket-based log streaming

### Payment System
- Crypto payments in NEAR, ETH, SOL, USDC, USDT, DAI
- Fiat on-ramp via MoonPay, Stripe Crypto, and Transak
- Recurring subscription billing with Superfluid streaming or Stripe
- Per-token balance tracking and batch payment processing

## Architecture

```
kuberna-labs/
├── contracts/          # Solidity smart contracts (Hardhat)
│   ├── Escrow.sol              # Escrow management with fee splitting
│   ├── Payment.sol             # Multi-token payment processing
│   ├── Multisig.sol            # Multi-owner threshold wallet
│   ├── Intent.sol              # Cross-chain intent protocol (ERC-7683)
│   ├── AgentRegistry.sol       # On-chain agent registration
│   ├── CertificateNFT.sol      # Verifiable credential NFTs
│   ├── ReputationNFT.sol       # Dynamic reputation tokens
│   ├── GovernanceToken.sol     # ERC-20 voting token
│   ├── Attestation.sol         # TEE remote attestation
│   ├── CrossChainRouter.sol    # Bridge message routing
│   ├── PriceOracle.sol         # Multi-source price feeds
│   ├── Dispute.sol             # On-chain dispute resolution
│   ├── FeeManager.sol          # Platform fee configuration
│   ├── Subscription.sol        # Recurring payment subscriptions
│   ├── Treasury.sol            # DAO treasury management
│   ├── Vesting.sol             # Token vesting schedules
│   ├── CourseNFT.sol           # Course access NFTs
│   └── Workshop.sol            # Workshop registration
├── backend/            # Node.js API server
│   ├── prisma/                 # Database schema and migrations
│   └── src/
│       ├── routes/             # REST API endpoints
│       ├── middleware/         # Auth, error handling
│       ├── services/           # Business logic
│       ├── types/              # TypeScript definitions
│       └── utils/              # Shared utilities
├── frontend/           # Web application
│   └── src/
│       ├── components/         # UI components
│       ├── hooks/              # React hooks (wallet, contracts)
│       ├── lib/                # Contract ABIs, chain config
│       ├── services/           # Contract interaction services
│       └── types/              # TypeScript definitions
├── test/               # Contract test suite
└── scripts/            # Deployment scripts
```

## Technology Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20, OpenZeppelin v5, Hardhat |
| Backend API | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Message Queue | NATS, BullMQ, Redis |
| Authentication | JWT, bcrypt, viem (Web3 signature verification) |
| Frontend | React, TypeScript, wagmi, viem, TanStack Query |
| Containerization | Docker, Phala TEE Enclaves |
| Testing | Mocha/Chai (contracts), Jest/Supertest (backend) |

## Prerequisites

- Node.js >= v20.0.0
- PostgreSQL 14+
- Redis 7+
- npm or yarn

## Installation

### 1. Clone and install dependencies

```bash
git clone https://github.com/kawacukennedy/kuberna-labs.git
cd kuberna-labs

# Install root dependencies (smart contracts)
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment configuration

Copy the example environment files and configure them:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Required environment variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT token signing |
| `REDIS_URL` | Redis connection string |
| `CORS_ORIGIN` | Allowed CORS origin |
| `VITE_ESCROW_ADDRESS` | Deployed escrow contract address |
| `VITE_CERTIFICATE_ADDRESS` | Deployed certificate NFT address |

### 3. Database setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Compile smart contracts

```bash
npx hardhat compile
```

### 5. Run tests

```bash
# Contract tests
npx hardhat test

# Backend tests
cd backend && npm test
```

### 6. Start development servers

```bash
# Start local blockchain
npx hardhat node

# Start backend (in a separate terminal)
cd backend && npm run dev

# Deploy contracts to local network
npx hardhat run scripts/deploy.ts --network localhost
```

## Smart Contract Deployment

### Local development

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### Sepolia testnet

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Mainnet

```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

After deployment, update the contract addresses in your environment variables or the frontend configuration.

## API Documentation

The backend exposes the following REST API endpoints:

| Endpoint | Description |
|---|---|
| `POST /api/auth/register` | Register with email/password |
| `POST /api/auth/login` | Email/password login |
| `POST /api/auth/web3-nonce` | Generate Web3 login nonce |
| `POST /api/auth/web3-login` | Web3 wallet login with signature |
| `POST /api/auth/web3-register` | Register with wallet signature |
| `GET /api/auth/me` | Get current user profile |
| `GET /api/users` | List users (paginated) |
| `GET /api/users/:id` | Get user details |
| `GET /api/courses` | List courses (paginated) |
| `POST /api/courses` | Create a new course |
| `GET /api/agents` | List agents (paginated) |
| `POST /api/agents` | Create a new agent |
| `POST /api/agents/:id/deploy` | Deploy an agent |
| `GET /api/intents` | List marketplace intents |
| `POST /api/intents` | Create a new intent |
| `POST /api/intents/:id/bids` | Place a bid on an intent |
| `POST /api/intents/:id/bids/:bidId/accept` | Accept a bid |
| `GET /api/payments/plans` | Get subscription plans |
| `POST /api/payments/checkout` | Initiate payment |
| `GET /api/workshops` | List workshops |
| `GET /api/forum/topics` | List forum topics |
| `GET /api/analytics/overview` | Platform analytics |

All authenticated endpoints require a `Bearer` token in the `Authorization` header.

## Security

- Web3 authentication uses nonce-based challenge-response with cryptographic signature verification
- Smart contracts use OpenZeppelin's `ReentrancyGuard` and access control patterns
- Multisig wallet requires threshold confirmations for all treasury operations
- Escrow funds are released only upon verified proof of completion
- TEE deployments include remote attestation for tamper-proof execution
- All sensitive data encrypted at rest and in transit

For security concerns, please review our [SECURITY.md](./SECURITY.md) and contact security@kubernalabs.com.

## Contributing

We welcome contributions from the community. Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

Built by the Kuberna Labs Team — Kigali, Rwanda