# @kuberna/sdk

Production-grade SDK for Kuberna Labs — Agentic Web3 Enterprise.

[![npm version](https://img.shields.io/npm/v/@kuberna/sdk)](https://www.npmjs.com/package/@kuberna/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @kuberna/sdk
```

## Quick Start

```typescript
import { KubernaClient } from '@kuberna/sdk';

const client = new KubernaClient({
  baseUrl: 'https://api.kuberna.com',
});

// Parse a natural language intent
const intent = await client.ai.parseIntent('swap 1 ETH for USDC on Solana');
console.log(intent);
// { sourceChain: 'ethereum', sourceToken: 'ETH', sourceAmount: '1.0', destChain: 'solana', ... }
```

## Client Setup

```typescript
import { KubernaClient } from '@kuberna/sdk';

// Default configuration
const client = new KubernaClient({
  baseUrl: 'https://api.kuberna.com',
});

// With authentication token
const authenticated = new KubernaClient({
  baseUrl: 'https://api.kuberna.com',
  apiKey: 'your-api-key',
});
```

## Workflows

### Authentication

```typescript
// Login with wallet signature
const tokens = await client.auth.login({
  wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  signature: '0x...', // EIP-191 signed message
});

// Register new user
const registered = await client.auth.register({
  wallet: '0x...',
  signature: '0x...',
  email: 'user@example.com',
});

// Refresh expired token
const refreshed = await client.auth.refresh(refreshToken);

// Get current user profile
const profile = await client.auth.getProfile();

// Logout
await client.auth.logout();
```

### AI Agent Operations

```typescript
// Parse a natural language intent
const intent = await client.ai.parseIntent('bridge 500 USDC from Ethereum to Arbitrum');
// Returns structured intent with confidence score

// Get agent decision for a specific strategy
const decision = await client.ai.getDecision('agent-id-123', {
  strategies: ['arbitrage', 'yield'],
});

// Analyze market conditions
const analysis = await client.ai.analyze('ETH', {
  indicators: ['price', 'volume', 'volatility'],
});
```

### Cross-Chain Payments

```typescript
// Create a payment intent
const payment = await client.payment.createIntent({
  sourceChain: 'ethereum',
  sourceToken: 'ETH',
  sourceAmount: '1.5',
  destChain: 'solana',
  destToken: 'USDC',
  minDestAmount: '4500',
  timeoutSeconds: 3600,
});

// Check payment status
const status = await client.payment.getStatus(payment.id);
// { status: 'pending' | 'filled' | 'settled' | 'expired', ... }

// Get supported tokens across chains
const tokens = await client.payment.getSupportedTokens();

// Release a payment (seller)
const released = await client.payment.release(payment.id);

// Refund a payment (buyer)
const refund = await client.payment.refund(payment.id);
```

### TEE (Trusted Execution Environment)

```typescript
// Create a new TEE enclave for secure agent execution
const enclave = await client.tee.createEnclave({
  name: 'trading-bot-1',
  image: 'kuberna/agent:latest',
  env: {
    STRATEGY: 'arbitrage',
    MAX_POSITION: '1000',
  },
});

// Verify attestation report
const attestation = await client.tee.verifyAttestation(enclave.id);

// List all enclaves
const enclaves = await client.tee.listEnclaves();

// Destroy an enclave
await client.tee.destroyEnclave(enclave.id);
```

### Certificate Management (NFT Credentials)

```typescript
// Mint a course completion certificate as NFT
const cert = await client.certificate.mint({
  courseId: 'defi-101',
  recipient: '0x...',
  metadata: {
    title: 'DeFi Fundamentals',
    grade: 'A',
    completedAt: '2026-05-12',
  },
});

// Verify a certificate
const isValid = await client.certificate.verify(cert.tokenId);

// Get certificates for a user
const myCerts = await client.certificate.getByUser('0x...');

// Get certificates for a course
const courseCerts = await client.certificate.getByCourse('defi-101');
```

### Wallet Operations

```typescript
// Get wallet balance
const balance = await client.wallet.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
// { eth: '1.5', usdc: '5000', ... }

// Send a transaction
const tx = await client.wallet.sendTransaction({
  to: '0x...',
  value: '0.1',
  data: '0x...',
});

// Get transaction count (nonce)
const nonce = await client.wallet.getTransactionCount('0x...');
```

### Error Handling

```typescript
import {
  KubernaError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  NetworkError,
} from '@kuberna/sdk';

try {
  await client.auth.login({ wallet: '0x...', signature: 'invalid' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Invalid input:', error.details);
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof KubernaError) {
    console.error('SDK error:', error.code, error.message);
  }
}
```

## API Reference

| Namespace | Methods | Description |
|-----------|---------|-------------|
| `ai` | `parseIntent`, `getDecision`, `analyze` | Natural language intent parsing and agent decisions |
| `auth` | `login`, `register`, `refresh`, `logout`, `getProfile` | Wallet-based authentication |
| `payment` | `createIntent`, `getStatus`, `getSupportedTokens`, `release`, `refund` | Cross-chain payment intents |
| `wallet` | `getBalance`, `sendTransaction`, `getTransactionCount` | Wallet queries and transactions |
| `tee` | `createEnclave`, `verifyAttestation`, `listEnclaves`, `destroyEnclave` | TEE secure execution |
| `certificate` | `mint`, `verify`, `getByUser`, `getByCourse` | NFT course certificates |

## License

MIT
