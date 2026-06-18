# @kuberna/sdk

Production-grade TypeScript SDK for the Kuberna Labs Agentic Web3 platform. Build, deploy, and manage autonomous AI agents that operate across blockchains, execute cross-chain intents, authenticate via wallets or email, and accept on-chain payments through Kite x402 and Stripe.

[![npm version](https://img.shields.io/npm/v/@kuberna/sdk)](https://www.npmjs.com/package/@kuberna/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @kuberna/sdk
```

Node.js >= 18 is required.

## Quick Start

```typescript
import { KubernaSDK } from '@kuberna/sdk';

const sdk = new KubernaSDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.kuberna.africa/api',
  rpcUrl: 'https://rpc.ankr.com/eth',
});

// Parse a natural-language cross-chain intent
const parsed = await sdk.ai.parseIntent('bridge 500 USDC from Ethereum to Arbitrum');
console.log(parsed);
// { sourceChain: 'ethereum', sourceToken: 'USDC', sourceAmount: '500', ... }

// Create an intent for agents to bid on
const intent = await sdk.intent.create({
  task: 'bridge 500 USDC from Ethereum to Arbitrum',
  budget: '10',
  deadline: 3600,
});
console.log(intent.id);
```

## Client Setup

```typescript
import { KubernaSDK } from '@kuberna/sdk';

// Minimal config
const sdk = new KubernaSDK();

// Full config with private key (for on-chain transactions)
const sdk = new KubernaSDK({
  apiKey: 'your-api-key',
  privateKey: '0x...',           // 64-char hex, 0x-prefixed
  baseUrl: 'https://api.kuberna.africa/api',
  rpcUrl: 'https://rpc.ankr.com/eth',
  timeout: 30000,                // request timeout in ms
});

// Lazy wallet initialisation
await sdk.initialize({ wallet: '0x...' });
```

## Authentication

SDK supports email/password authentication and API-key-based access.

```typescript
// Register a new account
const tokens = await sdk.auth.register({
  email: 'user@example.com',
  password: 'secure-password',
  name: 'Alice',
});

// Login
const tokens = await sdk.auth.login({
  email: 'user@example.com',
  password: 'secure-password',
});

// Refresh an expired access token
const refreshed = await sdk.auth.refresh(refreshToken);

// Fetch the current user's profile
const profile = await sdk.auth.getProfile();

// Logout
await sdk.auth.logout();
```

API keys passed via `apiKey` in the constructor automatically attach an `X-API-KEY` header to every request.

## Agent Operations

Create, deploy, and manage AI agents across multiple frameworks.

### Supported Frameworks

- ElizaOS
- LangChain
- AutoGen
- Rig

### Full Lifecycle

```typescript
// Create an agent
const agent = await sdk.agent.create({
  name: 'arbitrage-bot-1',
  description: 'Cross-chain arbitrage agent',
  framework: 'ElizaOS',
  model: 'gpt-4',
  config: { maxPositions: 5, minSpread: 0.5 },
  tools: ['uniswap', 'jupiter'],
  codeRepo: 'https://github.com/org/arbitrage-agent',
  deploymentType: 'CLOUD',              // 'CLOUD' | 'TEE' | 'LOCAL'
});

// Deploy (standard or TEE)
await sdk.agent.deploy(agent.id);
await sdk.agent.deploy(agent.id, { secureExecution: 'TEE' });

// Start / Stop
await sdk.agent.start(agent.id);
await sdk.agent.stop(agent.id);

// Retrieve
const fetched = await sdk.agent.get(agent.id);

// List all agents (optionally filtered by owner)
const agents = await sdk.agent.list(ownerId);
```

## Intent System

Create cross-chain intents, parse natural-language descriptions, and manage the intent lifecycle.

```typescript
// Parse a natural-language description into structured intent data
const structured = await sdk.intent.parse('swap 1 ETH for USDC on Solana');

// Create an intent for agents to discover and bid on
const intent = await sdk.intent.create({
  task: 'bridge 2000 DAI from Ethereum to Polygon',
  budget: '5',
  deadline: 7200,
  secureExecution: 'TEE',
});

// Query intent status
const fetched = await sdk.intent.get(intent.id);

// List all intents
const intents = await sdk.intent.list();

// Cancel an intent
await sdk.intent.cancel(intent.id);
```

## AI Services

Leverage Kuberna's AI layer for natural-language intent parsing and agent decision-making.

```typescript
// Parse a cross-chain intent from plain English
const parsed = await sdk.ai.parseIntent(
  'bridge 500 USDC from Ethereum to Arbitrum with min 495 USDC output within 1 hour'
);

// Ask an agent for a decision given context
const decision = await sdk.ai.getDecision('agent-id-123', {
  market: 'bullish',
  volatility: 'high',
  positions: ['ETH/USDC'],
});

// Analyse arbitrary text
const analysis = await sdk.ai.analyze({
  text: 'ETH is showing strong support at $3000 with increasing volume',
  context: { asset: 'ETH' },
});
```

## Payments

### Cross-Chain Payment Intents

```typescript
// Create an escrow payment intent
const payment = await sdk.payment.createIntent({
  amount: '500',
  currency: 'USDC',
  token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  chain: 'ethereum',
  description: 'Cross-chain settlement',
  metadata: { orderId: 'ord_123' },
});

// Check payment status
const status = await sdk.payment.getStatus(payment.intentId);

// Get supported tokens for a chain
const tokens = await sdk.payment.getSupportedTokens('ethereum');

// Release payment to executor
const txHash = await sdk.payment.release(payment.escrowId, 'ethereum');

// Refund payment to requester
const txHash = await sdk.payment.refund(payment.escrowId, 'executor-timeout', 'ethereum');
```

### Kite x402 Payments

Agent-controlled micro-payments using the Kite x402 protocol.

```typescript
// Connect a Kite wallet
const wallet = await sdk.kite.connectWallet('0x...');

// Get Kite wallet info
const info = await sdk.kite.getWalletInfo();

// Register an agent with Kite
const registered = await sdk.kite.registerAgent('agent-id-123');

// Create a spending session for an agent
const session = await sdk.kite.createSession({
  agentId: 'agent-id-123',
  taskSummary: 'Execute arbitrage trades',
  maxAmountPerTx: 100,
  maxTotalAmount: 10000,
  ttl: '24h',
});

// Create an x402 payment
const payment = await sdk.kite.createX402Payment({
  sessionId: session.sessionId,
  agentKiteDid: registered.kiteDid,
  amount: '50',
  asset: 'USDC',
  network: 'ethereum',
});

// Settle an x402 payment
const settled = await sdk.kite.settleX402Payment({
  kitePaymentId: payment.kitePaymentId,
  authorization: { sig: '...' },
  signature: '0x...',
});

// Verify an on-chain x402 transaction
const verified = await sdk.kite.verifyX402Transaction('0x...');

// Query session payments
const payments = await sdk.kite.getSessionPayments(session.sessionId);

// Get agent Kite info
const kiteInfo = await sdk.kite.getAgentKiteInfo('agent-id-123');
```

## TEE (Trusted Execution Environment)

Provision and manage SGX enclaves for secure agent execution.

```typescript
// Create an enclave
const enclave = await sdk.tee.createEnclave({
  name: 'trading-bot-1',
  image: 'kuberna/agent:latest',
  memory: 2048,
  cpu: 2,
  environment: { STRATEGY: 'arbitrage', MAX_POSITION: '1000' },
});

// Fetch enclave details
const fetched = await sdk.tee.getEnclave(enclave.id);

// Verify Intel SGX attestation report
const attestation = await sdk.tee.verifyAttestation(enclave.id);

// List all enclaves
const enclaves = await sdk.tee.listEnclaves();

// Destroy an enclave
await sdk.tee.destroyEnclave(enclave.id);
```

## Wallet & Blockchain

Direct on-chain operations via ethers.js.

```typescript
// Get the signer address (requires privateKey in config)
const address = sdk.wallet.getAddress();

// Get ETH balance
const balance = await sdk.wallet.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');

// Send a transaction
const tx = await sdk.wallet.sendTransaction('0x...', '0.1');

// Get transaction count (nonce)
const nonce = await sdk.wallet.getTransactionCount('0x...');

// Raw blockchain access via ethers provider
const provider = sdk.getProvider();
const wallet = sdk.getWallet();

sdk.blockchain.getBalance('0x...');
sdk.blockchain.sendTransaction('0x...', '0.1');
```

## Certificate Management (NFT Credentials)

Mint and verify on-chain course-completion certificates as NFTs.

```typescript
// Mint a course completion certificate
const cert = await sdk.certificate.mint({
  recipientAddress: '0x...',
  courseId: 'defi-101',
  metadata: {
    title: 'DeFi Fundamentals',
    grade: 'A',
    completedAt: '2026-05-12',
  },
});

// Verify a certificate on-chain
const verification = await sdk.certificate.verify(cert.id);

// Get certificates by user
const myCerts = await sdk.certificate.getByUser('0x...');

// Get certificates by course
const courseCerts = await sdk.certificate.getByCourse('defi-101');
```

## SilentVerify (Post-Quantum Certificates)

Issue and verify post-quantum-safe certificates for agents, chain state anchors, and cross-chain bindings.

```typescript
// Health check
const health = await sdk.verify.health();

// List supported chains
const chains = await sdk.verify.chains();

// Issue an agent certificate
const agentCert = await sdk.verify.issueAgentCert({
  agentDid: 'did:kuberna:agent-123',
  capabilities: { protocols: ['uniswap', 'jupiter'] },
  expiresInDays: 90,
});

// Verify an agent certificate
const verified = await sdk.verify.verifyAgentCert(agentCert.cert);

// Issue an EVM chain-state anchor
const evmAnchor = await sdk.verify.issueEvmAnchor({
  rpcUrl: 'https://eth.drpc.org',
  block: 'latest',
});

// Issue a Solana chain-state anchor
const solAnchor = await sdk.verify.issueSolanaAnchor({
  clusterId: 'mainnet-beta',
  commitment: 'finalized',
});

// Issue a cross-chain EVM anchor
const crossAnchor = await sdk.verify.issueEvmCrossAnchor(
  { chainId: 'eip155:1', block: 'latest' },
  { chainId: 'eip155:137', block: 'latest' }
);

// Print a certificate as human-readable string
const printed = await sdk.verify.printCert(agentCert.cert);

// Billing
const freeKey = await sdk.verify.getFreeKey();
const usage   = await sdk.verify.getUsage();
```

## Cross-Chain Identity

Register and resolve agent identities across EVM, Solana, and Cosmos ecosystems.

```typescript
// Register a cross-chain identity for an agent
const identity = await sdk.crossChainIdentity.registerIdentity({
  solanaAddress: '9x...',
  evmAddress: '0x...',
  agentName: 'arbitrage-bot-1',
  framework: 'ElizaOS',
});

// Resolve identity by agent ID
const id = await sdk.crossChainIdentity.getIdentity('agent-id-123');

// Resolve identity by Solana address
const id = await sdk.crossChainIdentity.resolveBySolana('9x...');

// Get certificate history
const certs = await sdk.crossChainIdentity.getCertificates('agent-id-123');

// Issue identity-bound certificates
const issued = await sdk.crossChainIdentity.issueCertificates(
  'agent-id-123', 'escrow-id', 'ethereum', '0x...'
);

// Verify a cross-chain identity certificate
const result = await sdk.crossChainIdentity.verifyCert({ ... });

// Fetch passport URI
const { uri } = await sdk.crossChainIdentity.getPassportUri('agent-id-123');
```

## Error Handling

All SDK errors extend `KubernaError` and carry a `code` string and `statusCode` number.

```typescript
import {
  KubernaError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConfigurationError,
  NetworkError,
} from '@kuberna/sdk';

try {
  await sdk.auth.login({ email: 'test@test.com', password: 'wrong' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Auth failed:', error.message);
    // code: 'AUTHENTICATION_ERROR', statusCode: 401
  } else if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
    // code: 'VALIDATION_ERROR', statusCode: 422
  } else if (error instanceof NotFoundError) {
    console.error('Not found:', error.message);
    // code: 'NOT_FOUND', statusCode: 404
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // code: 'NETWORK_ERROR', statusCode: 503
  } else if (error instanceof ConfigurationError) {
    console.error('Config error:', error.message);
    // code: 'CONFIGURATION_ERROR', statusCode: 500
  } else if (error instanceof KubernaError) {
    console.error('SDK error:', error.code, error.message);
  }
}
```

### Error Classes

| Class | code | statusCode | When |
|-------|------|------------|------|
| `KubernaError` | `KUBERNA_ERROR` | 500 | Base error class |
| `AuthenticationError` | `AUTHENTICATION_ERROR` | 401 | Invalid credentials or expired token |
| `ValidationError` | `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `NotFoundError` | `NOT_FOUND` | 404 | Resource does not exist |
| `NetworkError` | `NETWORK_ERROR` | 503 | Upstream API unreachable |
| `ConfigurationError` | `CONFIGURATION_ERROR` | 500 | Invalid SDK configuration |

## API Reference

| Namespace | Methods | Description |
|-----------|---------|-------------|
| `agent` | `create`, `get`, `list`, `deploy`, `start`, `stop` | AI agent lifecycle management |
| `intent` | `create`, `get`, `list`, `cancel`, `parse` | Cross-chain intent creation and parsing |
| `ai` | `parseIntent`, `getDecision`, `analyze` | Natural-language AI services |
| `auth` | `login`, `register`, `refresh`, `logout`, `getProfile` | Email/password authentication |
| `payment` | `createIntent`, `getStatus`, `getSupportedTokens`, `release`, `refund` | Escrow-backed cross-chain payments |
| `kite` | `connectWallet`, `getWalletInfo`, `registerAgent`, `createSession`, `createX402Payment`, `settleX402Payment`, `verifyX402Transaction`, `getSessionPayments`, `getAgentKiteInfo` | Kite x402 micro-payment protocol |
| `wallet` | `getAddress`, `getBalance`, `sendTransaction`, `getTransactionCount` | Direct on-chain wallet operations |
| `blockchain` | `getBalance`, `sendTransaction` | Low-level blockchain access |
| `tee` | `createEnclave`, `getEnclave`, `listEnclaves`, `verifyAttestation`, `destroyEnclave` | Intel SGX enclave provisioning |
| `certificate` | `mint`, `verify`, `getByUser`, `getByCourse` | On-chain NFT course credentials |
| `verify` | `health`, `chains`, `issueAgentCert`, `verifyAgentCert`, `issueEvmAnchor`, `issueSolanaAnchor`, `issueCosmosAnchor`, `issueEvmCrossAnchor`, `printCert`, `getFreeKey`, `getUsage` | Post-quantum SilentVerify certificates |
| `crossChainIdentity` | `registerIdentity`, `getIdentity`, `resolveBySolana`, `getCertificates`, `issueCertificates`, `verifyCert`, `getPassportUri` | Cross-chain identity resolution |

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | - | API key for authenticated requests |
| `privateKey` | `string` | - | Ethereum private key (0x-prefixed 64-char hex) |
| `baseUrl` | `string` | `https://api.kuberna.africa/api` | Kuberna API base URL |
| `rpcUrl` | `string` | `https://rpc.ankr.com/eth` | EVM JSON-RPC provider URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |

## Type Exports

```typescript
export type {
  CreateAgentParams, Agent,
  CreateIntentParams, StructuredIntent, Intent,
  LoginParams, RegisterParams, AuthTokens, UserProfile,
  CreatePaymentIntentParams, PaymentIntent, PaymentStatus, TokenInfo,
  CreateEnclaveParams, Enclave, AttestationReport,
  MintCertificateParams, Certificate, CertificateVerification,
  WalletInfo, TransactionResult,
  ParseIntentResult, AgentDecision, AnalyzeParams, AnalysisResult,
  KiteWalletInfo, KiteSessionRequest, KiteSession, KiteAgentInfo,
  X402PaymentRequest, X402PaymentCreate, X402SettleResult, X402VerifyResult,
  CrossChainIdentityRecord, AgentCertificateRecord, RegisterIdentityParams,
  SolanaWalletMapping,
  SilentVerifyConfig, AgentCertIssueRequest, StateCertIssueRequest,
  CertIssueResponse, CertVerifyResponse, StateCertWire,
  ChainBindingResponse, ChainVerifyResult, ChainHealth,
  ChainCatalogResponse, ChainCatalogEntry,
  EvmChainRequest, SolanaChainRequest, CosmosChainRequest, XrpChainRequest,
};
```

## License

MIT
