---
title: 'Post 25: Set Up Agent-to-Agent Payments With Kite x402 in Your dApp'
slug: agent-to-agent-payments-kite-x402
---

## Title Field

Put this in the **Title** field:

> Set Up Agent-to-Agent Payments With Kite x402 in Your dApp

## Subtitle Field

Put this in the **Subtitle** field:

> One agent pays another for data or execution — no private keys, no manual signing, fully autonomous.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Agent-to-agent payments with Kite x402 — no private keys required

**Meta description** (155-160 chars):

> Kite x402 enables autonomous agent payments. Create spending sessions, execute payments, verify on-chain. Full code for buyer and seller agents.

**Post URL slug**:

> agent-to-agent-payments-kite-x402

## Body

Put this in the main body editor:

Agents need to pay each other. Agent A needs price data from Agent B. Agent B needs to charge for each query. But neither agent has a private key — they can't sign transactions. They shouldn't hold keys.

Kite x402 solves this. It's a payment protocol that uses **HTTP 402 Payment Required** semantics: the seller returns a payment challenge, the buyer fulfills it with a signed payment (using session keys), and the seller releases the resource.

No wallet, no private key, no manual signing. Just autonomous agent-to-agent payments.

---

### How x402 Works

The flow has four steps:

1. **Agent A (buyer)** requests a resource from Agent B (seller).
2. **Agent B** returns HTTP 402 with a payment requirement: chain, token, amount, and a deadline.
3. **Agent A** creates a spending session (a temporary key authorized to spend a fixed amount), pays via that session key, and includes the proof in a new request.
4. **Agent B** verifies the payment proof on-chain, confirms funds are locked in escrow, and returns the resource.

All of this happens in under 2 seconds on L2s like Arbitrum or Base.

---

### Step 1: Create a Spending Session

A spending session is a temporary authorization. The agent's operator creates it and delegates spending power:

```typescript
import { KiteClient } from '@kuberna/kite';

const kite = new KiteClient({
  operatorKey: process.env.OPERATOR_KEY!, // the human's key
  rpcUrl: process.env.RPC_URL!,
});

// Create a session for the agent
const session = await kite.createSession({
  agentId: 'price-bot-v2',
  maxAmount: '1000', // 1000 USDC total budget
  tokenAddress: '0xA0b8...', // USDC on Arbitrum
  expiry: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
  scope: ['pay-for-data', 'pay-for-execution'],
});

// Export the session key to the agent
console.log(`Session key: ${session.key}`);
console.log(`Session ID: ${session.id}`);
```

The operator key signs once. The session key is then usable by the agent for the next 30 days (or until the budget runs out). If the agent is compromised, the operator can revoke the session without touching their primary key.

---

### Step 2: Agent A Requests Data (Buyer Side)

```typescript
// Buyer agent: requests price data
import { KiteSession } from '@kuberna/kite';

const sessionKey = process.env.SESSION_KEY!;
const session = new KiteSession({ key: sessionKey });

async function fetchPrice(pair: string): Promise<number> {
  // Step 2a: Initial request — expect 402
  const initial = await fetch(`https://agent-b.kuberna.xyz/v1/prices?pair=${pair}`, {
    headers: { Accept: 'application/json' },
  });

  if (initial.status !== 402) {
    return initial.json(); // free endpoint
  }

  // Step 2b: Parse the payment challenge
  const paymentRequired = await initial.json();
  // {
  //   "chain": "arbitrum",
  //   "token": "0xA0b8...",
  //   "amount": "0.5",          // 0.50 USDC
  //   "deadline": 1719000000,
  //   "sellerAddress": "0x7B2..."
  // }

  // Step 2c: Create payment proof using session key
  const paymentProof = await session.pay({
    chain: paymentRequired.chain,
    token: paymentRequired.token,
    amount: paymentRequired.amount,
    recipient: paymentRequired.sellerAddress,
    reference: `price-query-${pair}-${Date.now()}`,
  });

  // Step 2d: Retry with payment proof
  const paid = await fetch(`https://agent-b.kuberna.xyz/v1/prices?pair=${pair}`, {
    headers: {
      Accept: 'application/json',
      'X-Payment-Proof': JSON.stringify(paymentProof),
    },
  });

  return paid.json();
}

// Use it
const ethPrice = await fetchPrice('ETH/USDC');
console.log(`ETH/USDC: $${ethPrice}`);
```

The agent doesn't hold a private key. It holds a session key that can only spend within strict bounds. If the session key leaks, the damage is capped at 1000 USDC and the operator can revoke it instantly.

---

### Step 3: Agent B Serves Data (Seller Side)

```typescript
// Seller agent: serves price data, charges per query
import { KiteVerifier } from '@kuberna/kite';
import express from 'express';

const app = express();
const verifier = new KiteVerifier({
  rpcUrl: process.env.RPC_URL!,
});

const PRICE_CACHE = new Map<string, { price: number; timestamp: number }>();

app.get('/v1/prices', async (req, res) => {
  const pair = req.query.pair as string;

  // Step 3a: Check if buyer has paid
  const proof = req.headers['x-payment-proof'];

  if (!proof) {
    // Require payment: 0.50 USDC per query
    return res.status(402).json({
      chain: 'arbitrum',
      token: '0xA0b8...', // USDC
      amount: '0.5',
      deadline: Math.floor(Date.now() / 1000) + 300, // 5 min
      sellerAddress: process.env.SELLER_ADDRESS!,
    });
  }

  // Step 3b: Verify the payment on-chain
  const isValid = await verifier.verifyPayment({
    proof: JSON.parse(proof as string),
    expectedAmount: '0.5',
    expectedToken: '0xA0b8...',
    expectedRecipient: process.env.SELLER_ADDRESS!,
  });

  if (!isValid) {
    return res.status(402).json({ error: 'Invalid or expired payment proof' });
  }

  // Step 3c: Return the data
  const cached = PRICE_CACHE.get(pair);
  if (cached && Date.now() - cached.timestamp < 10000) {
    return res.json({ pair, price: cached.price });
  }

  const price = await fetchFreshPrice(pair);
  PRICE_CACHE.set(pair, { price, timestamp: Date.now() });

  res.json({ pair, price });
});

app.listen(3001);
```

The seller verifies the payment proof on-chain before releasing data. The verification checks:

- The session exists and hasn't been revoked
- The session has sufficient remaining budget
- The payment is correctly addressed to the seller
- The signature is valid

---

### Step 4: Complete Example — Agent A Buys From Agent B

Here's a full script showing two agents communicating:

```typescript
// agent-a.ts — requester
import { KiteSession } from '@kuberna/kite';

async function main() {
  const session = new KiteSession({
    key: process.env.SESSION_KEY!,
  });

  // Agent A needs prices every 5 minutes to rebalance a yield position
  const pairs = ['ETH/USDC', 'BTC/USDC', 'MATIC/USDC'];

  setInterval(async () => {
    for (const pair of pairs) {
      const response = await fetch(`https://price-agent.kuberna.xyz/v1/prices?pair=${pair}`, {
        headers: {
          'X-Session-Id': session.id,
          'X-Payment-Proof': JSON.stringify(
            await session.createPayment({
              amount: '0.5',
              token: 'USDC',
              chain: 'arbitrum',
            })
          ),
        },
      });
      const data = await response.json();
      console.log(`${pair}: $${data.price}`);

      // Agent A uses price to decide whether to rebalance
      await evaluateRebalance(pair, data.price);
    }
  }, 300_000);
}
```

```typescript
// agent-b.ts — price oracle provider
import { KiteVerifier } from '@kuberna/kite';

// ... (Express server as shown above)
```

Both agents are fully autonomous. Neither operator needs to sign anything after setting up the session.

---

### Verifying Payments On-Chain

The verifier contract stores session state and validates proofs:

```solidity
contract KiteVerifier {
  mapping(bytes32 => Session) public sessions;

  struct Session {
    address operator;
    address agentAddress;
    uint256 maxAmount;
    uint256 spent;
    uint256 expiry;
    bool revoked;
  }

  function verifyPayment(
    bytes32 sessionId,
    uint256 amount,
    bytes calldata signature,
    address expectedRecipient
  ) external returns (bool) {
    Session storage s = sessions[sessionId];
    require(!s.revoked, 'Session revoked');
    require(block.timestamp < s.expiry, 'Session expired');
    require(s.spent + amount <= s.maxAmount, 'Budget exceeded');

    bytes32 message = keccak256(
      abi.encodePacked(sessionId, amount, expectedRecipient, block.chainid)
    );

    address signer = recoverSigner(message, signature);
    require(signer == s.agentAddress, 'Invalid signature');

    s.spent += amount;
    return true;
  }
}
```

---

### Pricing Models

x402 supports flexible pricing:

- **Fixed per-query.** 0.50 USDC per price request. Simple.
- **Tiered.** 100 free queries/month, then 0.25 USDC each.
- **Subscription.** Pay once for a session with maxAmount, get unlimited queries within a time window.
- **Revenue share.** Agent A pays Agent B 10% of any profit generated from the data.

The pricing model is negotiated in the 402 response. The buyer can accept, counter-offer, or walk away.

---

### Why This Matters for Agent Infrastructure

Most "agent payment" systems today require the agent to hold a private key. That's backwards. The agent should not hold keys — the operator authorizes a spending policy, and the agent executes within it.

Kite x402 separates **authorization** (the operator signs once to create a session) from **authentication** (the agent proves it's the authorized session holder). This is the correct security model for autonomous agents.

---

### Running It Yourself

The Kite SDK is in the Kuberna repo:

[github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs) — `/packages/kite-x402`

There's a Docker Compose that runs both agents locally with Hardhat for testing:

```bash
git clone https://github.com/kawacukennedy/kuberna-labs
cd kuberna-labs/examples/x402
docker compose up
```

This starts a local Anvil chain, deploys the verifier contract, and runs both agent A and agent B in separate containers. You can watch the payments flow in the logs.

The Discord at [discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu) has a `#x402` channel where people are building payment agents. Someone's building a data marketplace where 50 oracle agents compete on price and quality, and x402 handles all the settlement.

_Subscribe below. Next post: a hot take on agent frameworks — why they're all commodities and execution rails are the real moat._
