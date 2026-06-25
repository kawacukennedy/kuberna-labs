# Kuberna Labs - Project Structure

## Overview

Kuberna Labs is a hybrid educational and technological platform that empowers developers to build, deploy, and manage autonomous AI agents operating across decentralized networks.

## Directory Structure

```
kubernalabs/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── constants/          # Application constants
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.ts        # Authentication middleware
│   │   │   └── errorHandler.ts # Error handling
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts        # Authentication routes
│   │   │   ├── users.ts       # User management
│   │   │   ├── agents.ts      # Agent management
│   │   │   ├── intents.ts     # Intent marketplace
│   │   │   ├── courses.ts     # Course management
│   │   │   ├── payments.ts    # Payment handling
│   │   │   ├── workshops.ts   # Workshop management
│   │   │   ├── forum.ts       # Forum discussions
│   │   │   ├── notifications.ts
│   │   │   ├── analytics.ts
│   │   │   ├── apiKeys.ts
│   │   │   └── disputes.ts
│   │   ├── services/          # Business logic
│   │   │   ├── blockchain.ts   # Blockchain interactions
│   │   │   ├── payment.ts     # Payment processing
│   │   │   ├── tee.ts         # TEE deployment
│   │   │   ├── ztls.ts        # zkTLS integration
│   │   │   ├── queue.ts       # Message queue
│   │   │   ├── ai.ts          # AI services
│   │   │   ├── fiat.ts        # Fiat on-ramp
│   │   │   ├── webhook.ts     # Webhook handling
│   │   │   └── chains.ts      # Multi-chain support
│   │   ├── utils/             # Utility functions
│   │   │   ├── prisma.ts      # Database client
│   │   │   ├── abis.ts        # Contract ABIs
│   │   │   ├── validation.ts  # Input validation
│   │   │   ├── apiResponse.ts # Response helpers
│   │   │   ├── database.ts    # DB utilities
│   │   │   └── logger.ts      # Logging utility
│   │   ├── types/            # TypeScript types
│   │   └── index.ts           # Application entry
│   └── prisma/
│       └── schema.prisma      # Database schema
│
├── frontend/                   # React/Next.js frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Libraries & config
│   │   │   ├── wagmi.ts      # Wallet config
│   │   │   ├── chains.ts     # Chain configs
│   │   │   └── adapters/      # Chain adapters
│   │   ├── services/          # API services
│   │   ├── types/            # TypeScript types
│   │   └── pages/             # Page components
│   └── package.json
│
├── contracts/                 # Solidity smart contracts
│   ├── Intent.sol            # Intent marketplace
│   ├── Escrow.sol           # Escrow management
│   ├── AgentRegistry.sol     # Agent registration
│   ├── CertificateNFT.sol   # Course certificates
│   ├── ReputationNFT.sol    # Agent reputation
│   ├── Payment.sol           # Payment processing
│   ├── Attestation.sol       # TEE attestations
│   └── ...
│
├── sdk/                       # JavaScript/TypeScript SDK
│   ├── src/
│   │   ├── index.ts         # Main export
│   │   ├── agent.ts          # Agent management
│   │   ├── intent.ts         # Intent operations
│   │   └── blockchain.ts     # Blockchain utils
│   └── package.json
│
├── examples/                  # Example agents
│   └── basic-agent/
│
└── scripts/                  # Deployment scripts
    ├── deploy.ts
    └── setup-local.ts
```

## Backend Architecture

### Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Web3 signatures
- **Messaging**: NATS for event streaming
- **Blockchain**: ethers.js + viem

### API Design Patterns

1. **RESTful Endpoints**: All routes follow REST conventions
2. **Pagination**: List endpoints support `page` and `limit` parameters
3. **Error Handling**: Consistent error response format
4. **Authentication**: JWT tokens with role-based access

### Middleware Stack

```
Request → Auth → Validation → Route Handler → Error Handler → Response
```

### Service Layer

Services encapsulate business logic and interact with:

- Database (via Prisma)
- Blockchain (via ethers.js)
- External APIs
- Message queues (NATS)

## Smart Contracts

### Core Contracts

| Contract       | Purpose                        |
| -------------- | ------------------------------ |
| KubernaIntent  | Intent marketplace             |
| KubernaEscrow  | Fund escrow management         |
| AgentRegistry  | Agent registration & tracking  |
| CertificateNFT | Course completion certificates |
| ReputationNFT  | Agent reputation scores        |
| KubernaPayment | Payment processing             |
| Attestation    | TEE/zkTLS attestations         |

### Contract Interactions

1. **Intent Flow**:

   - User creates intent → KubernaIntent contract
   - Solvers submit bids
   - Requester accepts bid
   - Escrow funded → KubernaEscrow
   - Task execution → Completion proof
   - Payment release

2. **TEE Deployment**:
   - Agent deployed to TEE (Phala/Marlin)
   - Attestation generated
   - Attestation submitted → Attestation contract
   - On-chain verification

## Frontend Architecture

### Technology Stack

- **Framework**: React 18+ / Next.js
- **Styling**: Tailwind CSS
- **Wallet**: wagmi + viem
- **State**: React Query

### Component Structure

```
pages/
├── index.tsx           # Landing page
├── dashboard/          # User dashboard
├── agents/             # Agent management
├── marketplace/        # Intent marketplace
├── courses/            # Educational content
├── workshops/          # Live workshops
└── settings/          # User settings
```

## SDK Usage

The Kuberna SDK is published on npm as [`@kuberna/sdk`](https://www.npmjs.com/package/@kuberna/sdk).

```bash
npm install @kuberna/sdk
```

### Client Initialization

```typescript
import { KubernaClient } from '@kuberna/sdk';

const client = new KubernaClient({
  baseUrl: 'https://api.kuberna.com',
});
```

### AI Intent Parsing

```typescript
// Parse natural language into structured intent
const intent = await client.ai.parseIntent('swap 1 ETH for USDC on Solana');
// { sourceChain: 'ethereum', sourceToken: 'ETH', sourceAmount: '1.0', destChain: 'solana', ... }

// Get agent decision
const decision = await client.ai.getDecision('agent-id', {
  strategies: ['arbitrage', 'yield'],
});

// Analyze market conditions
const analysis = await client.ai.analyze('ETH', {
  indicators: ['price', 'volume'],
});
```

### Authentication

```typescript
const tokens = await client.auth.login({
  wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  signature: '0x...',
});
```

### Payment Intents

```typescript
const payment = await client.payment.createIntent({
  sourceChain: 'ethereum',
  sourceToken: 'USDC',
  sourceAmount: '500',
  destChain: 'arbitrum',
  destToken: 'USDC',
});

const status = await client.payment.getStatus(payment.id);
```

### TEE Deployment

```typescript
const enclave = await client.tee.createEnclave({
  name: 'trading-bot',
  image: 'kuberna/agent:latest',
});

const attestation = await client.tee.verifyAttestation(enclave.id);
```

### Certificate Management

```typescript
const cert = await client.certificate.mint({
  courseId: 'defi-101',
  recipient: '0x...',
});
```

### Error Handling

```typescript
import { KubernaError, ValidationError, NotFoundError } from '@kuberna/sdk';

try {
  await client.payment.getStatus('invalid-id');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation:', error.details);
  }
}
```

### SDK Tests

```bash
cd sdk
npm install
npm test
```

## Environment Variables

### Backend

```env
# Database
DATABASE_URL=postgresql://...

# Blockchain
RPC_URL=http://localhost:8545
PRIVATE_KEY=0x...
ESCROW_ADDRESS=0x...
INTENT_ADDRESS=0x...

# Authentication
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d

# External Services
NATS_URL=nats://localhost:4222
STRIPE_SECRET_KEY=sk_...

# App
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

## Testing

```bash
# Backend tests
npm run test

# Contract tests
npx hardhat test

# Linting
npm run lint
```

## Deployment

### Local Development

```bash
# Start local blockchain
npx hardhat node

# Deploy contracts
npm run deploy:local

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev
```

### Production

```bash
# Build contracts
npm run compile

# Deploy to testnet
npm run deploy:sepolia

# Deploy to mainnet
npm run deploy:mainnet
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT
