---
title: 'Post 41: Beyond EVM: Why Solana, NEAR, and Polkadot Change the Agent Execution Game'
slug: beyond-evm-solana-near-polkadot-agent-execution
---

## Title Field

Put this in the **Title** field:

> Beyond EVM: Why Solana, NEAR, and Polkadot Change the Agent Execution Game

## Subtitle Field

Put this in the **Subtitle** field:

> Parallel execution (Solana), sharded state (NEAR), shared security (Polkadot) — how the multi-VM future affects agent design.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Beyond EVM: Solana, NEAR & Polkadot Agent Execution

**Meta description** (155-160 chars):

> Solana's parallel execution, NEAR's sharded state, Polkadot's shared security — how non-EVM chains change agent design, and what Kuberna Labs is building for the multi-VM future.

**Post URL slug**:

> beyond-evm-solana-near-polkadot-agent-execution

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

The EVM is a great execution environment. It's battle-tested, well-documented, and supported by practically every wallet and explorer.

It's also a sequential state machine. One transaction at a time. One contract call at a time. Global consensus on every state transition.

That architecture was designed for human-paced transactions — a swap here, a transfer there. It was not designed for agents that need to execute thousands of decisions per minute across multiple contexts.

Non-EVM chains solve this in fundamentally different ways. Here's how solana, NEAR, and Polkadot change the agent execution game — and what Kuberna is building to support them.

---

### Solana: Parallel Execution for High-Frequency Agents

Solana's SVM processes transactions in parallel, not sequentially. The runtime identifies non-overlapping account accesses and executes them simultaneously on multiple cores.

**What this means for agents:**

An agent running on Solana can execute multiple independent actions in the same slot. Market-making agents can update bids and asks across dozens of markets simultaneously. Monitoring agents can check 100+ oracle feeds in parallel and trigger actions based on aggregate conditions.

This is impossible on EVM. Each EVM transaction is processed one at a time. If an agent needs to check 100 prices, it either does it off-chain (defeating the purpose of on-chain logic) or submits 100 separate transactions over 20 minutes.

**The trade-off:**

Solana's parallel execution requires a different programming model. Accounts must be declared upfront. Cross-program invocation (CPI) has restrictions on account ownership. An agent designed for EVM can't be ported to Solana without significant rework.

Our approach: the `@kuberna/sdk` abstract's execution behind an intent layer. The agent expresses _what_ it wants ("check prices across serum markets A, B, C, and D"), and the SDK translates that intent into the optimal execution pattern for the target chain. For Solana, it generates a batch of parallelizable instructions. For EVM, it sequences them as separate transactions.

**Solana enables:**

- Real-time market making with sub-second latency
- Cross-program arbitrage agents
- High-frequency liquidation monitoring

---

### NEAR: Sharded State for Cross-Shard Intents

NEAR uses sharding: the network's state is split across multiple shards, each processed by a different validator subset. A transaction that touches accounts in different shards requires a cross-shard receipt — an asynchronous message between shards.

**What this means for agents:**

An agent on NEAR can operate across shards, but must account for asynchronous execution. If an agent triggers an action on shard 1 that depends on state from shard 2, the receipt propagation takes 2-3 seconds.

This changes the agent's mental model. On EVM, everything is synchronous — if the transaction succeeds, all state changes are immediately consistent. On NEAR, cross-shard state is _eventually consistent_. The agent must design for this: initiate the intent, wait for receipts, confirm settlement.

**The trade-off:**

The complexity is real. An agent that assumes synchronous state will break on NEAR. A cross-shard intent that reads account A (shard 1) and writes account B (shard 2) cannot be atomic in the EVM sense.

Our SDK handles this through the **intent lifecycle**. The agent submits an intent. The SDK breaks it into shard-local actions, submits them, monitors receipt propagation, and only marks the intent as "settled" when all cross-shard receipts are confirmed. The agent never sees the asynchrony.

**NEAR enables:**

- Agents that manage state across logical domains
- Intent execution that spans different NEAR applications without migration
- Scalable agent operations that don't compete for a single chain's throughput

---

### Polkadot: Shared Security for Specialized Agent Runtimes

Polkadot's architecture is fundamentally different from both Solana and NEAR. The relay chain provides shared security, while parachains run their own runtimes with custom logic.

**What this means for agents:**

An agent on Polkadot can leverage parachains designed for specific purposes. One parachain might optimize for high-frequency trading (with custom runtime logic that handles order matching at the protocol level). Another might focus on identity and reputation (with specialized storage for agent attestation records). The relay chain handles cross-parachain messaging (XCM).

The agent operates across parachains: query reputation on the identity parachain, execute trades on the trading parachain, settle funds on a general-purpose parachain. Each parachain is optimized for its function.

**The trade-off:**

Polkadot's complexity is the highest of the three. XCM is still evolving. Parachain runtimes are written in Rust (Substrate framework). The cross-chain messaging model is more powerful than EVM bridges but requires deeper understanding.

For agent builders, the entry barrier is high. Not many agent developers know Substrate development.

Our strategy: the SDK treats parachains as execution endpoints, not development targets. You write your agent logic in the SDK. The SDK deploys it to the appropriate parachain runtime (or routes intents to existing parachains). You don't need to learn Substrate to have an agent on Polkadot.

**Polkadot enables:**

- Purpose-built agent runtimes (e.g., a parachain dedicated to cross-chain intent solving)
- Sovereign execution environments with shared security
- Agents that use parachain-specific features (custom gas models, private execution)

---

### The Multi-VM SDK Architecture

Supporting EVM, SVM, NEAR runtime, and Substrate pallets in a single SDK is a challenge. Here's how we structure it.

**Layer 1 — Intent abstraction:**
The agent writes a platform-agnostic intent: "Swap 1 ETH for USDC at the best available price." The intent parser extracts the semantic meaning without reference to any specific VM.

**Layer 2 — Route resolution:**
The route resolver evaluates all supported chains and runtimes. It considers: available liquidity (which DEXes on which chains), execution latency (Solana vs. EVM), bridge costs, and the agent's own capabilities (does the agent have a TEE on Solana? Does it need EVM-specific dispute resolution?).

**Layer 3 — Adapter dispatch:**
The selected adapter translates the intent into chain-specific instructions.

- For EVM: an array of contract calls and EIP-1559 parameters
- For Solana: a set of parallelizable instructions with account declarations
- For NEAR: shard-local actions with receipt monitoring
- For Polkadot: XCM messages targeting specific parachains

**Layer 4 — Execution monitoring:**
The SDK monitors the execution across all involved runtimes. For EVM, it waits for transaction receipts. For Solana, it confirms slot finalization. For NEAR, it tracks receipt propagation across shards. For Polkadot, it follows XCM message delivery.

The agent only sees the final result: success or failure. The complexity of multi-VM execution is handled inside the SDK.

---

### What This Means for Agent Designers

If you're designing an agent today, don't assume EVM-only will be sufficient six months from now. The market is moving toward a multi-VM world.

**High-frequency strategies go to Solana.** If your agent needs to react in under 1 second, EVM can't compete.

**Complex state management goes to NEAR.** If your agent needs to maintain context across different application domains, NEAR's sharded model is better than EVM's single-state approach.

**Custom execution environments go to Polkadot.** If you need a runtime that's purpose-built for your agent's logic (custom fee model, specialized storage, private execution), build a parachain.

**Everything else stays on EVM.** For standard DeFi operations — swaps, lending, yield — EVM is still the most mature and best-supported environment.

---

### The Future: VM-Agnostic Agents

The end state is VM-agnostic agents. The agent doesn't know or care which runtime executes its intents. It submits an intent. The infrastructure routes it to the best runtime.

This is where Kuberna is headed. Our SDK already handles EVM and SVM. NEAR and Polkadot adapters are in development. The intent abstraction layer is designed to support any Turing-complete runtime.

Agent execution should not be limited by the chain it was written for. The chain should be an implementation detail.

The repo with the multi-VM adapters: [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs).

The Discord where we argue about SVM vs. EVM vs. WASM runtime trade-offs: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu).

---

### A Note on This Series

This is Post 41 — the final post in the launch series.

We started with Post 1: "We Built an Open-Source SDK for Cross-Chain AI Agents — Here's What Broke." We covered the intent parser, the TEE attestation system, the circuit breaker, the escrow contract, cross-chain execution, the contributor community, the funding model, the roadmap, predictions, and governance.

If you've read all 41 posts, you know more about agent execution infrastructure than most people in the industry. You've seen the architecture decisions, the trade-offs, the failures, and the plan forward.

The next phase: we ship v1.0. The posts will continue, but they'll be about specific launches, technical deep dives, and community stories.

Thank you for reading. Thank you for the comments, the issue filings, and the PRs.

Now go build an agent.

---

_Subscribe to stay updated on the v1.0 launch and future technical deep dives. The best is yet to come._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
