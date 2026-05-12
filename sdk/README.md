# @kuberna/sdk

Production-grade SDK for Kuberna Labs — Agentic Web3 Enterprise.

## Installation

```bash
npm install @kuberna/sdk
```

## Usage

```typescript
import { KubernaClient } from '@kuberna/sdk';

const client = new KubernaClient({
  baseUrl: 'https://api.kuberna.com',
});

// AI agent operations
const intent = await client.ai.parseIntent('swap 1 ETH for USDC');
const decision = await client.ai.getDecision('agent-id');

// Authentication
const tokens = await client.auth.login({
  wallet: '0x...',
  signature: '0x...',
});

// Payments
const payment = await client.payment.createIntent({
  sourceChain: 'ethereum',
  sourceToken: 'ETH',
  sourceAmount: '1.0',
  destChain: 'solana',
  destToken: 'USDC',
});

// Wallet operations
const balance = await client.wallet.getBalance('0x...');

// TEE operations
const enclave = await client.tee.createEnclave({ name: 'my-enclave' });

// Certificate operations
const cert = await client.certificate.mint({
  courseId: 'course-123',
  recipient: '0x...',
});
```

## API

| Namespace | Methods |
|-----------|---------|
| `ai` | `parseIntent`, `getDecision`, `analyze` |
| `auth` | `login`, `register`, `refresh`, `logout`, `getProfile` |
| `payment` | `createIntent`, `getStatus`, `getSupportedTokens`, `release`, `refund` |
| `wallet` | `getBalance`, `sendTransaction`, `getTransactionCount` |
| `tee` | `createEnclave`, `verifyAttestation`, `listEnclaves`, `destroyEnclave` |
| `certificate` | `mint`, `verify`, `getByUser`, `getByCourse` |

## License

MIT
