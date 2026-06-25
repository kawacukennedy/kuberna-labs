---
title: We Built an Open-Source SDK for Cross-Chain AI Agents — Here's What Broke
published: false
tags: ai, blockchain, opensource, discuss
cover_image: https://opengraph.githubassets.com/1/kawacukennedy/kuberna-labs
description: 'Building an open-source SDK that lets AI agents execute cross-chain transactions autonomously. Intent parsing, on-chain escrow, TEE attestation, and what broke along the way.'
series: Building an Open-Source Agent Execution Layer
---

It's 3 AM and your AI agent just bridged $500 to a chain you've never heard of.

The logs say "optimal route found." The balance says $0. The agent can't explain why.

This is the problem we spent 6 months solving.

We built Kuberna Labs — an MIT-licensed SDK that gives AI agents secure execution rails across any blockchain. The whole thing is open-source: [github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)

Here's what we actually had to build.

---

## What "agent execution" actually means

Most people think "AI agent" means a chatbot with tool access. That's not what we're building.

An agent that _calls an API_ and an agent that _settles a financial transaction_ are fundamentally different problems. The first is about formatting HTTP requests. The second is about moving value across chains, proving what happened, and resolving disputes when something goes wrong.

Agent execution, in our definition, means:

1. An agent forms an **intent** ("swap 1 ETH for USDC on Solana")
2. That intent is **parsed** into a structured, verifiable format
3. **Executors** compete to fulfill the intent at the best price
4. An **escrow contract** holds funds until conditions are met
5. A **TEE attestation** proves the agent's decision was made correctly

Every layer above had to be built from scratch. No off-the-shelf solutions existed for open-source agent settlement.

## Why intent-based execution is safer than direct wallets

Giving an agent a private key is the obvious approach. And it's terrifying.

If an agent holds a key, that key is accessible wherever the agent runs. A compromised agent means a drained wallet. There's no intermediary, no dispute window, no recourse.

Our architecture inverts this: **the agent never holds keys.** It posts intents. Executors compete to fulfill those intents. An on-chain escrow contract settles the transaction only when conditions are met.

```
const sdk = new KubernaSDK({ apiKey: process.env.KUBERNA_API_KEY })

const intent = await sdk.intents.create({
  sourceChain: "ethereum",
  destChain: "solana",
  sourceToken: "ETH",
  destToken: "USDC",
  sourceAmount: "1.0",
})
```

The agent posts an intent. The SDK handles the rest. No keys, no custody, no single point of failure.

## How we stop the intent parser from hallucinating chains

This was the hardest technical problem we solved.

We started with GPT-4 to parse natural language intents. The results were terrifying:

```typescript
// Input: "bridge my ETH to Arbitrum"
// GPT-4 output:
{ sourceChain: "Ethereum", destChain: "Arbitrum", token: "ARB" }
```

It confused the destination **chain** with the **ARB token**. If an agent executed this parse, it would swap ETH for ARB instead of bridging. That's a $10,000 hallucination.

We built a 4-layer fallback system:

1. **compromise.js** — zero-dependency NLP that works fully offline. Handles 80% of intents.
2. **12 regex patterns** — matching "X for Y on Z" and variations. Deterministic, no failure mode.
3. **GPT-4 fallback** — only when confidence < 0.6 from layers 1 and 2. Activated in ~15% of cases.
4. **RAG memory** — learns from past parses. Common patterns are promoted to layer 2 over time.

Each layer assigns a confidence score. We stop at the first layer with score > 0.6.

The result: zero hallucinated chains in production. 175 tests covering every edge case.

## What on-chain escrow looks like for AI agents

Trustless settlement requires an escrow contract that handles the agent-specific edge cases:

```solidity
function assignExecutor(
  bytes32 intentId,
  address executor,
  bytes calldata params
) external nonReentrant onlyAgent(intentId) {
  Escrow storage e = escrows[intentId];
  require(e.status == EscrowStatus.PENDING, 'not pending');
  e.executor = executor;
  e.executorParams = params;
  e.status = EscrowStatus.ASSIGNED;
  emit ExecutorAssigned(intentId, executor, params);
}
```

The `nonReentrant` modifier on `assignExecutor` and `raiseDispute` prevents reentrancy attacks. Every intent has a dispute window. If the agent disagrees with execution, funds are held pending resolution.

## Why TEE attestation matters for provable decisions

An agent's decision trace must be provable. Without attestation, the agent can claim "I don't know what happened" and you have no way to verify.

We run decision-making inside an SGX enclave. Every inference produces a cryptographic receipt:

```json
{
  "intentId": "0xabc...",
  "decision": "executor_selected",
  "executorAddress": "0xdef...",
  "confidence": 0.87,
  "attestation": "sgx://enclave-123/receipt/0x789..."
}
```

This receipt is stored on-chain. Anyone can verify that the agent made the decision it claims to have made, inside a trusted execution environment, at a specific point in time.

## The circuit breaker problem

An agent that can't stop calling a dead API is an agent that burns money.

We implemented a sliding-window circuit breaker around all OpenAI calls:

- **CLOSED** — normal operation
- 3 failures in 5 minutes → **OPEN**
- 30 second probe interval → **HALF_OPEN**
- Probe succeeds → **CLOSED**
- Probe fails → back to **OPEN**

```typescript
const circuit = new CircuitBreaker(intentParser, {
  threshold: 3,
  windowMs: 300_000,
  probeIntervalMs: 30_000,
});

const result = await circuit.call('swap 1 ETH for USDC on Solana');
```

When the circuit is open, the agent falls back to the local compromise.js parser. No API call needed. The agent still works — it just makes simpler decisions.

Graceful degradation > perfect uptime.

## What broke (the honest part)

Not everything went smoothly. Here's what we got wrong:

**Math.sin() as a price oracle.** Our first "market data provider" used `Math.sin()` to generate fake price data. It was a placeholder that somehow made it to staging. A real API integration would have caught this earlier.

**Direct wallet integration.** Our first design gave agents access to a wallet. We reversed this after a close call in testing. The intent-based architecture is harder to build but fundamentally safer.

**No circuit breaker.** We deployed the first version without rate limiting on API calls. The agent called a dead OpenAI endpoint 47 times before we noticed. Each call cost money. Each call returned nothing.

**Intent parser hallucinating chains.** The GPT-4 hallucination problem above cost us a week of refactoring. The 4-layer system was born from failure.

## Where we're going next

- **zkTLS integration** — proving agent decisions without revealing sensitive data
- **Solana support** — the first non-EVM chain in the execution layer
- **NEAR Intents** — cross-chain settlement using NEAR's intent infrastructure

---

The whole thing is MIT. 175 tests, all green. If you've fought with cross-chain settlement and won (or lost), I'd love to hear about it in the comments. PRs very welcome.

---

_Next in this series: [Why We Don't Let GPT-4 Parse Financial Intents (And What We Use Instead)](/next-post-link)_
