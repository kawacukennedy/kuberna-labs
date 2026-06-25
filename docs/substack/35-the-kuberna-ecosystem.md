---
title: 'Post 35: The Kuberna Ecosystem: What the Community Is Building With Agent Execution Rails'
slug: the-kuberna-ecosystem-community-projects
---

## Title Field

Put this in the **Title** field:

> The Kuberna Ecosystem: What the Community Is Building With Agent Execution Rails

## Subtitle Field

Put this in the **Subtitle** field:

> A Telegram trading bot, a yield optimizer, a cross-chain NFT flipper — real projects, real deployments.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Kuberna Ecosystem: Community Projects Built on Agent Rails

**Meta description** (155-160 chars):

> A Telegram trading bot, a yield optimizer, a cross-chain NFT flipper. Three real projects built by the Kuberna community using our open-source SDK for agent execution rails.

**Post URL slug**:

> the-kuberna-ecosystem-community-projects

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

The best part of building open source is watching what other people build with your stuff.

We shipped the Kuberna SDK three months ago. Since then, community members have deployed agents for Telegram trading, automated yield optimization, and cross-chain NFT flipping. Some of these are side projects. One of them is handling real money.

Here are the projects we're most excited about.

---

### Project 1: OrbitBot — Telegram Trading Agent

**What it does:** A Telegram bot that accepts natural language trading intents and executes them across Ethereum, Base, and Arbitrum.

**How it uses the SDK:**

- `intent-parser` for parsing messages like "buy $500 of ETH on Base with 2% slippage"
- `Escrow.sol` for holding user funds during execution
- `circuit-breaker` to handle OpenAI API outages gracefully
- `tee-verifier` for attestation receipts that prove the agent didn't front-run

**What the builder learned:**

Alex, the developer, had never built on crypto before. "I thought I needed to understand every chain's RPC endpoints, gas models, and bridge contracts. Turns out the SDK handles all of that. I wrote the Telegram integration in two days and the cross-chain execution in one."

OrbitBot has executed 47 trades across 3 chains since launch. Total value: about 12 ETH. Zero disputes so far.

**What's next:** Alex is adding Solana support and a stop-loss feature that monitors positions across all supported chains simultaneously.

---

### Project 2: Harvest — Cross-Chain Yield Optimizer

**What it does:** Monitors lending rates across Aave (Ethereum), Compound (Base), and Radiant (Arbitrum). When a rate differential exceeds the cost of bridging, it moves assets to the highest-yielding pool.

**How it uses the SDK:**

- `@kuberna/sdk` for multi-chain balance monitoring
- `intent-parser` with custom yield-specific patterns ("Move 10 ETH from Aave to Compound if the spread exceeds 50 bps")
- `reputation` for tracking the optimizer's historical performance
- Cross-chain escrow for atomic position migration

**What the builder learned:**

Priya runs Harvest as a side project. "The hardest part wasn't the code — it was the bridge costs. The SDK gave me a `estimateBridgeCost()` function that saved me from writing my own gas estimation for every bridge provider. I would have given up on the cross-chain part if I had to implement that myself."

Harvest is currently managing about 8 ETH. It's outperforming manual yield optimization by roughly 15 bps per week.

**What's next:** Automated rebalancing triggers based on impermanent loss calculations, and a dashboard that shows cross-chain positions.

---

### Project 3: FlipBot — Cross-Chain NFT Arbitrage Agent

**What it does:** Monitors NFT floor prices for the same collection across Ethereum and Base (via Mintify and Reservoir). When the price gap exceeds configured thresholds, it buys on the cheaper chain and sells on the more expensive one.

**How it uses the SDK:**

- `intent-parser` for complex multi-step intents ("buy Bored Ape #8874 on Base, bridge to Ethereum, list at 5% above purchase price")
- `Escrow.sol` for holding the NFT during the cross-chain transfer
- `tee-verifier` for execution attestations that prove the agent didn't snipe the listing
- `circuit-breaker` for rate-limited API calls to NFT marketplaces

**What the builder learned:**

Jake runs FlipBot with a small fund from friends. "The first time I ran it, I realized my intent parser was too permissive. It parsed 'buy cheap ape, sell high' as a valid intent — which, technically, it is, but it doesn't specify the target return. The SDK's confidence scoring caught it and rejected the intent. Saved me from a silly trade."

FlipBot has completed 12 arbitrage trades. Average return per trade: 0.08 ETH minus gas and fees. Small but consistent.

**What's next:** Jake is working on a version that monitors Blur bids and lists simultaneously, so the agent can act as a market maker.

---

### Project 4: AuditBot — Automated Smart Contract Fuzzing Agent

**What it does:** A continuous fuzzing service that takes a contract address, runs Foundry-based invariant tests against it, and reports findings to a Discord webhook.

**How it uses the SDK:**

- The **execution rails** pattern — AuditBot doesn't hold funds but uses the same intent → execution → verification pipeline
- `tee-verifier` to attest that the fuzzing runs happened in a controlled environment
- `reputation` to track which auditors produce quality findings

**What the builder learned:**

Carlos built AuditBot for his own use and open-sourced it. "I was surprised how much of the SDK applied to non-financial agents. The circuit breaker for API rate limits, the intent parser for specifying fuzzing parameters, the attestation module for proving my fuzzing runs — it all transferred directly."

AuditBot has found 3 real vulnerabilities in other people's contracts during fuzz runs. Two were acknowledged. One was a critical reentrancy bug in a new lending protocol.

---

### The Pattern

Looking across these projects, a pattern emerges:

**Every agent follows the same architecture:** intent → execution → verification → settlement.

The intent varies (trade, optimize, flip, fuzz). The verification varies (TEE attestation, on-chain proofs, reputation checks). But the pipeline is identical. That's what the SDK standardizes.

We didn't expect this. We built the SDK for cross-chain DeFi agents. The community extended it to NFT trading, security auditing, and yield optimization — use cases we never considered.

---

### Building Your Own

All of these projects are open-source. Links are in the `#community-projects` channel on our Discord: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu).

The SDK is at [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs).

If you build something with it — a bot, an agent, a tool — let us know. We'll feature it in a future post.

The ecosystem grows when people build, not when we market. Go build.

---

_Subscribe for Post 36 — full transparency on how we fund open-source agent infrastructure, including grant applications, GitHub Sponsors, and protocol revenue._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
