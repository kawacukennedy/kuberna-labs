---
title: 'Post 16: Kite x402 — Agent-Controlled Micro-Payments Without a Wallet'
slug: kite-x402-micropayments
---

## Title Field

Put this in the **Title** field:

> Kite x402: Agent-Controlled Micro-Payments Without a Wallet

## Subtitle Field

Put this in the **Subtitle** field:

> Spending sessions with max-per-tx and total caps, TTL, agent DID binding — autonomous payments without private keys.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Kite x402: Agent Micropayments Without a Wallet

**Meta description** (155-160 chars):

> Kite x402 lets AI agents make autonomous micropayments with spending sessions, per-tx caps, TTL, and DID binding — no private key management.

**Post URL slug**:

> kite-x402-micropayments

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

Here's a problem that comes up all the time in agent development: your agent needs to pay for something. An API call. A data feed. A solver's execution fee. A small reward for a user.

But your agent shouldn't hold private keys. And you don't want to approve every $0.03 transaction manually.

Kite **x402** solves this. It's a protocol for agent-controlled micro-payments that works without the agent holding any private key material. Let's break down how.

---

### The x402 Protocol

x402 is not new — it was described in the HTTP 402 "Payment Required" specification and has seen implementations in various forms. What Kuberna Labs adds is **agent-specific session management** with DID binding, spending caps, and integration with the on-chain escrow system.

The core flow:

```
Agent             Session Server            Merchant
  │                     │                      │
  │  1. Request session │                      │
  │ ──────────────────>│                      │
  │                     │                      │
  │  2. Issue session   │                      │
  │    (caps, TTL, DID) │                      │
  │ <──────────────────│                      │
  │                     │                      │
  │  3. Payment request │                      │
  │ ─────────────────────────────────────────>│
  │                     │                      │
  │  4. Forward auth    │                      │
  │ <──────────────────│─────────────────────│
  │                     │                      │
  │  5. Authorize       │                      │
  │ ──────────────────>│                      │
  │                     │                      │
  │  6. Settlement      │                      │
  │                     │─────────────────────>│
```

The agent never signs a transaction. The session server (configured by the agent's owner) handles the actual on-chain settlement. The agent just presents its session token and signs the payment request with its DID.

---

### Spending Session Lifecycle

A spending session is a time-limited, capped authorization:

```typescript
const session = await agent.createSpendingSession({
  maxPerTx: '0.01 ETH', // per-transaction cap
  totalCap: '0.1 ETH', // total session cap
  ttl: 3600, // 1 hour
  allowedRecipients: ['*'], // any merchant (use with caution)
  intentId: intent.id, // bind to a specific intent
  autoRenew: false, // don't auto-renew
});

console.log(session.token);
// "x402_sess_abc123..._def456..."
```

The session token is a signed JWT containing:

```json
{
  "iss": "did:kuberna:owner-address",
  "sub": "did:kuberna:agent-address",
  "aud": "x402.kuberna",
  "iat": 1719000000,
  "exp": 1719003600,
  "caps": {
    "maxPerTx": "10000000000000000", // 0.01 ETH in wei
    "totalCap": "100000000000000000", // 0.1 ETH in wei
    "spent": "0",
    "txCount": 0
  },
  "intentId": "0x..."
}
```

The session server validates the JWT signature, checks the caps, and executes the payment. Caps are enforced at the session server level, not the contract level — meaning revocation is instant (just delete the session from the server's state).

---

### Agent DID Binding

The session is cryptographically bound to the agent's DID. To authorize a payment, the agent signs a payment request:

```typescript
const payment = await agent.signPaymentRequest({
  sessionToken: session.token,
  recipient: '0xmerchant...',
  amount: '0.005 ETH',
  data: 'API call: sentiment analysis',
  nonce: crypto.randomBytes(8).toString('hex'),
});

// Merchant verifies:
// 1. Payment request is signed by agent's DID
// 2. Session token is valid (signed by owner, not expired)
// 3. Amount is within session caps
// 4. Agent DID matches session's 'sub' claim

const verified = await kite.verifyPaymentRequest(payment);
```

This means:

- The merchant knows the agent authorized the payment (DID signature)
- The agent knows the merchant can't drain the session (caps enforced by session server)
- The owner knows the agent can't exceed the budget (total cap)
- Neither agent nor merchant holds the funding private key

---

### Integration with Escrow

x402 payments can optionally be routed through the Kuberna escrow system. This adds dispute resolution:

```typescript
const escrowedPayment = await agent.createEscrowedPayment({
  session: session,
  recipient: '0xmerchant...',
  amount: '0.005 ETH',
  disputeWindow: 3600, // 1 hour to dispute
  conditions: {
    expectedResponseHash: 'sha256(required_data)',
    // Merchant must provide the data that matches this hash
  },
});

// If merchant doesn't deliver, agent disputes within window
// Escrow returns funds to agent
```

The dispute window gives the agent time to verify the merchant delivered the expected result. For API calls, this means checking that the response matches the expected format. For data feeds, it means verifying the data is fresh and signed.

---

### Security Model

x402 is not magic. It shifts trust from the agent to the session server. Here's the threat model:

| Threat                     | Mitigation                                           |
| -------------------------- | ---------------------------------------------------- |
| Session token leaked       | TTL limits window; revocation deletes server-side    |
| Agent compromised          | Per-tx cap limits damage; DID key should be separate |
| Session server compromised | Server only holds session state, not funding keys    |
| Funding key compromised    | Owner can revoke all sessions and rotate funding key |
| Replay attack              | Payment nonce prevents double-spending               |
| Merchant fraud             | Escrow integration allows dispute                    |

The session server is the weakest link. It handles authorization but doesn't hold the funding private key (that stays with the owner's wallet, ideally a hardware wallet). The server holds a **session authorization key** that can only issue tokens within the owner's pre-configured parameters.

For higher security, run the session server inside a TEE (Phala or Marlin) so the session state is encrypted at rest and the authorization code is attested:

```typescript
const teeSessionServer = new KiteSessionServer({
  tee: 'phala',
  mrenclave: whitelistedHash,
  // Session server code is measured and attested
});
```

---

### When to Use x402

x402 shines for low-value, high-frequency payments:

| Use Case              | Amount      | Frequency   | x402 Fit             |
| --------------------- | ----------- | ----------- | -------------------- |
| LLM API calls         | $0.01-0.10  | Per request | ✅ Excellent         |
| Data feed access      | $0.001-0.01 | Per query   | ✅ Excellent         |
| Solver fees           | $1-100      | Per intent  | ✅ Good              |
| User rewards          | $0.10-10    | Per action  | ✅ Good              |
| Large escrow (>$1000) | $1000+      | Rare        | ❌ Use direct escrow |

For anything over ~$500, skip x402 and use the direct escrow system. The convenience of x402 isn't worth the (small but nonzero) session server risk.

---

### Code Example: Agent Buying Compute

```typescript
import { KubernaAgent } from '@kuberna/sdk';

const agent = new KubernaAgent({
  did: 'did:kuberna:0xagent...',
  apiKey: process.env.KUBERNA_API_KEY,
});

// Create a spending session for compute purchases
const session = await agent.createSpendingSession({
  maxPerTx: '0.01 ETH',
  totalCap: '0.05 ETH',
  ttl: 86400, // 24 hours
  allowedRecipients: ['0xcomputenode...'],
});

// Agent autonomously buys compute as needed
for (const task of tasks) {
  const cost = await computeNode.getQuote(task);
  if (cost <= session.remaining && cost <= session.maxPerTx) {
    const payment = await agent.pay({
      session,
      recipient: '0xcomputenode...',
      amount: cost,
      description: `Compute: ${task.id}`,
    });
    const result = await computeNode.run(task, payment.id);
    // result is delivered and verified
  }
}
```

The agent runs autonomously for 24 hours, spending up to 0.05 ETH total. No manual approvals needed. If the compute node cheats, the payment is escrowed and the agent can dispute.

---

The full x402 implementation is in the Kuberna SDK, [MIT-licensed on GitHub](https://github.com/kawacukennedy/kuberna-labs). The session server reference implementation is in `src/x402/`. It runs as a standalone Node.js service or inside a Phala TEE.

Want to try x402? [Join the Discord](https://discord.gg/MZvNuhpXu) and grab a test session token from the #x402 channel.

**Subscribe to this series** — Post 17 is a step-by-step tutorial: deploy your first cross-chain AI agent in 10 minutes, no blockchain experience needed.

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
