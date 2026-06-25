---
title: 'Post 11: Cross-Chain Intents — How ERC-7683 Powers the Agent Marketplace'
slug: cross-chain-intents-erc7683
---

## Title Field

Put this in the **Title** field:

> Cross-Chain Intents: How ERC-7683 Powers the Agent Marketplace

## Subtitle Field

Put this in the **Subtitle** field:

> Intent lifecycle — create with budget/deadline constraints, solver competition, bid acceptance, TEE-verified execution, settlement.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Cross-Chain Intents & ERC-7683 for AI Agents

**Meta description** (155-160 chars):

> How ERC-7683 lets AI agents create cross-chain intents with budget constraints, solver competition, TEE-verified execution, and on-chain settlement.

**Post URL slug**:

> cross-chain-intents-erc7683

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

If you've been following this series, you know Kuberna Labs is about giving AI agents secure execution rails across any blockchain. Today we're diving into the mechanism that makes cross-chain agency actually work: **intents**.

Not transactions. Intents.

---

### What's an Intent, Really?

An intent is what an agent _wants_ to happen, not the specific steps to make it happen. "Swap 1 ETH for USDC on Base" is an intent. The solver network figures out _how_ — which DEX, what route, what timing. The agent just states what it wants and the constraints it's willing to accept.

ERC-7683 formalizes this into a standard that any agent, any solver, any chain can understand. Kuberna Labs wraps ERC-7683 into the SDK so your agent creates intents the same way whether it's settling on Ethereum, Base, Polygon, Arbitrum, or Solana.

Here's the lifecycle, soup to nuts.

---

### 1. Intent Creation With Constraints

When your agent wants something, it calls `createIntent()` from the SDK:

```typescript
const intent = await agent.createIntent({
  action: {
    type: 'swap',
    input: { token: 'ETH', amount: '1.0', chain: 'ethereum' },
    output: { token: 'USDC', chain: 'base' },
  },
  constraints: {
    budget: '4000 USDC', // max output tolerance
    deadline: '2026-07-01T12:00:00Z', // expires in 24h
    minConfidence: 0.95, // solver must be 95%+ confident
    targetChains: ['base', 'polygon', 'arbitrum'],
    teeRequired: true, // must execute in TEE
    attestationRequired: ['sgx', 'phala'],
  },
});
```

Every constraint gets encoded on-chain as a struct in the intent contract. The `budget` field is critical — it's the maximum the agent is willing to lose, denominated in the output token. If a solver quotes 3950 USDC and the actual execution gets 3920, the escrow covers the difference and the solver's reputation takes a hit.

The `deadline` prevents intents from living forever. Miss the window? Intent expires, escrow unlocks, agent moves on.

---

### 2. Solver Network Competition

Once the intent is on-chain (or in the off-chain intent pool for Solana), solvers pick it up. Solver nodes run a competitive auction:

1. **Quote submission**: Solvers inspect the intent constraints and submit a sealed bid: "I'll execute this for 3900 USDC, using Curve on Base, with SGX attestation."
2. **Bid scoring**: The scoring function considers price, solver reputation score, past success rate, and stake amount.
3. **Winning bid selection**: The solver with the best composite score wins. Ties break by stake amount (more skin in the game wins).

This isn't a blind Dutch auction. It's a reputation-weighted sealed-bid system. A new solver with zero history can still win — they just need to undercut on price enough to offset their reputation deficit. Over time, consistent execution builds score.

The solver doesn't just bid a price. They bid a **plan**:

```json
{
  "solverId": "0xabc...",
  "price": "3900 USDC",
  "route": ["ETH → DAI on Uniswap", "DAI → USDC on Aerodrome"],
  "teeProvider": "phala",
  "estimatedGas": "0.002 ETH",
  "signedQuote": "0x..."
}
```

This gets hashed and committed on-chain. The solver can't change the route after winning.

---

### 3. Bid Acceptance and Escrow Lock

The agent (or its human overseer, if configured) accepts the best bid. The SDK calls `acceptBid()`:

```typescript
const receipt = await agent.acceptBid(intent.id, winningBid);
```

This triggers:

- **Escrow lock**: The input tokens (1 ETH) move from the agent's wallet into the Kuberna escrow contract.
- **Bond lock**: The solver's bond (say, 0.5 ETH) also locks into escrow. If execution fails or cheats, the bond goes to the agent.
- **Deadline start**: The execution timer starts ticking. The solver's clock is now running.

Both parties have skin in the game now. The escrow contract is a simple but powerful primitive: two ETH addresses, one balance, a set of conditions. Release to solver on successful TEE attestation. Release to agent on timeout or dispute.

---

### 4. TEE-Verified Execution

This is where the magic happens. The solver doesn't just execute the swap. They execute it inside a Trusted Execution Environment (TEE) — Intel SGX enclave, Phala Network, or Marlin Oyster.

The execution produces:

- The swap result (tokens moved)
- An **attestation quote** proving the execution ran inside the enclave
- An **MRENCLAVE hash** matching the expected solver code
- A **signed receipt** including the input and output state

The solver submits this on-chain:

```solidity
function submitExecution(
  bytes32 intentId,
  bytes memory result,
  bytes memory teeQuote,
  bytes32 mrenclave
) external onlySolver(intentId) {
  require(block.timestamp < deadline, 'Deadline passed');
  require(verifyTeeQuote(teeQuote, mrenclave), 'Invalid TEE proof');
  escrow.release(intentId, result);
}
```

The escrow doesn't release funds until the TEE attestation is verified. If the attestation fails — or never arrives — the agent claims a refund plus the solver's bond.

---

### 5. Settlement and Solver Reputation

Once the attestation checks out and the agent verifies the output matches expectations, settlement happens:

- Output tokens go to the agent's wallet
- Input tokens (minus the solver's fee) go to the solver
- Solver's bond unlocks

But there's one more step: **reputation update**.

The SDK automatically pushes a reputation event:

```solidity
reputation.recordExecution(
  solverId,
  intentId,
  block.timestamp,
  true, // success
  executionTime, // how fast?
  fee // how much did they charge?
);
```

This feeds into the on-chain reputation system we covered in Post 14. Every successful (or failed) execution updates the solver's score. Time-based decay means old wins stop mattering after ~90 days. New solvers can climb the ranks.

---

### Why This Matters for Agents

Without intents, every agent needs to:

- Know every chain's DEX landscape
- Manage gas on every chain
- Handle reorgs and failed transactions
- Compete for block space

With ERC-7683 intents, the agent just states **what** and lets the solver market figure out **how**. The agent stays lean. The solvers compete on execution quality. TEE attestation keeps everyone honest.

Kuberna Labs is MIT-licensed and the entire SDK + contracts are open source. Check the [GitHub repo](https://github.com/kawacukennedy/kuberna-labs) for the intent contract implementations and the solver node code. Questions or want to run a solver node? [Join the Discord](https://discord.gg/MZvNuhpXu) — there's a dedicated #solvers channel.

The future of AI agency isn't monolithic agents that do everything. It's specialized agents expressing intents and networks of solvers executing them. ERC-7683 is the substrate that makes that future possible.

**Subscribe to this series** — Post 12 goes deep on TEE attestation and what SGX enclaves actually prove about your agent's behavior.

---

_Have thoughts on the intent/solver model? Drop into the [Discord](https://discord.gg/MZvNuhpXu) — I'd love to hear what you're building._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
