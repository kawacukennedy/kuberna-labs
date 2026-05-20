# Kite AI Integration

Kuberna Labs integrates [Kite AI](https://gokite.ai/) — the payments layer for the agent economy — to enable autonomous AI agents to discover, pay for, and settle with services using **Kite Passport** (session-based spending) and the **x402** payment protocol.

## Architecture

```
User → Kite Passport (passkey approval)
         ↓
Agent → Spending Session (budget, TTL, scope)
         ↓
  x402 HTTP Payment → Pieverse Facilitator → Kite Chain Settlement
         ↓
Service delivers response → Receipt stored in DB
```

## Components

### 1. Kite Passport

- Users create a Passport account at [agentpassport.ai](https://agentpassport.ai)
- Passport provides passkey-secured wallet for agents
- Users fund the wallet with USDC.e on Kite Chain (testnet)
- Agents create spending sessions; users approve with passkey

### 2. Spending Sessions

Each session has:

- **Budget**: max amount per transaction and total
- **TTL**: session expires automatically (e.g. 24h)
- **Scope**: what the agent can pay for
- **Assets**: which tokens can be spent (USDC)

### 3. x402 Payments

- Services return HTTP 402 with machine-readable payment terms
- Agent resends request with `X-PAYMENT` header containing signed authorization
- Pieverse Facilitator settles on Kite Chain
- Service verifies settlement and delivers response

### 4. Kite Chain

- EVM-compatible L1, Chain ID: **2368**
- RPC: `https://rpc-testnet.gokite.ai`
- Explorer: `https://testnet.kitescan.ai`
- USDC.e: `0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e`
- Testnet token: `0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63`
- Faucet: `https://faucet.gokite.ai`

## Environment Variables

```env
KITE_RPC_URL=https://rpc-testnet.gokite.ai
KITE_CHAIN_ID=2368
KITE_PASSPORT_API=https://agentpassport.ai/api
KITE_PAYMENT_TOKEN_ADDRESS=0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e
KITE_FACILITATOR_URL=https://facilitator.pieverse.io
KITE_FACILITATOR_ADDRESS=0x12343e649e6b2b2b77649DFAb88f103c02F3C78b
KITE_SERVICE_WALLET=0xYourServiceWalletAddressOnKite
KITE_TESTNET_TOKEN=0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63
```

## API Endpoints

### Backend (all under `/api/kite`)

| Method | Path                    | Description                       |
| ------ | ----------------------- | --------------------------------- |
| POST   | `/wallet/connect`       | Connect Kite wallet address       |
| GET    | `/wallet`               | Get wallet info and balances      |
| POST   | `/agents/register`      | Register agent with Kite Passport |
| POST   | `/sessions/create`      | Create spending session           |
| GET    | `/sessions/:sessionId`  | Get session status                |
| GET    | `/agents/:agentId/info` | Get agent Kite info               |

### x402 Payments (under `/api/payments/x402`)

| Method | Path                            | Description                  |
| ------ | ------------------------------- | ---------------------------- |
| POST   | `/parse`                        | Parse x402 HTTP 402 response |
| POST   | `/create`                       | Create x402 payment record   |
| POST   | `/settle`                       | Settle via facilitator       |
| POST   | `/verify`                       | Verify on-chain transaction  |
| GET    | `/sessions/:sessionId/payments` | List session payments        |
| GET    | `/payments/:kitePaymentId`      | Get payment details          |

## Setup

### 1. Create Kite Passport Account

1. Go to [agentpassport.ai](https://agentpassport.ai)
2. Sign up with email and set up passkey (Touch ID / Face ID)
3. Get your wallet address from the dashboard

### 2. Fund Your Wallet

- Use the faucet at `https://faucet.gokite.ai` for testnet USDC
- Or transfer USDC.e from another wallet on Kite Chain

### 3. Connect Wallet in Kuberna

```bash
POST /api/kite/wallet/connect
{
  "kiteWalletAddress": "0xYourKiteWalletAddress"
}
```

### 4. Register an Agent

Agent creation automatically registers with Kite Passport. To re-register:

```bash
POST /api/kite/agents/register
{
  "agentId": "agent-uuid"
}
```

### 5. Create Spending Session

```bash
POST /api/kite/sessions/create
{
  "agentId": "agent-uuid",
  "taskSummary": "Execute cross-chain swaps",
  "maxAmountPerTx": 10,
  "maxTotalAmount": 50,
  "ttl": "24h"
}
```

### 6. Approve Session

Open the `approvalUrl` returned by the session creation. Approve with your passkey.

### 7. Execute x402 Payment

The agent can now make paid API calls:

```bash
POST /api/payments/x402/create
{
  "sessionId": "session-uuid",
  "amount": "5",
  "asset": "USDC"
}
```

## SDK Usage

```typescript
import { KubernaSDK } from '@kuberna/sdk';

const sdk = new KubernaSDK({ apiKey: '...' });

// Connect Kite wallet
await sdk.kite.connectWallet('0x...');

// Register agent
await sdk.kite.registerAgent('agent-id');

// Create session
const session = await sdk.kite.createSession({
  agentId: 'agent-id',
  taskSummary: 'My task',
  maxAmountPerTx: 10,
  maxTotalAmount: 50,
});

// Get session status
await sdk.kite.getSessionStatus(session.sessionId);

// Create and settle x402 payment
const payment = await sdk.kite.createX402Payment({
  amount: '5',
  sessionId: session.sessionId,
});

await sdk.kite.settleX402Payment({
  kitePaymentId: payment.kitePaymentId,
  authorization: { ... },
  signature: '0x...',
});
```

## Database Schema

New models:

- `User.kiteWalletAddress` — user's Kite wallet
- `Agent.kiteWalletAddress`, `Agent.kiteAgentDid`, `Agent.kiteSessionId` — agent Kite identity
- `KitePayment` — x402 payment tracking (session, authorization, settlement)

## Testing

```bash
cd backend && npx jest --testPathPattern=kite
```

Tests cover:

- Kite Passport service (agent registration, sessions, wallet)
- x402 payment parsing and settlement
- Facilitator interaction
