---
title: 'Post 38: The Road to v1.0: Mainnet Deployment, Agent Marketplace, and Beyond'
slug: road-to-v1-0-mainnet-marketplace
---

## Title Field

Put this in the **Title** field:

> The Road to v1.0: Mainnet Deployment, Agent Marketplace, and Beyond

## Subtitle Field

Put this in the **Subtitle** field:

> Q3-Q4 2026 detailed roadmap. What's shipping next and when.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Kuberna Labs v1.0 Roadmap: Mainnet, Marketplace & More

**Meta description** (155-160 chars):

> Detailed Q3-Q4 2026 roadmap for Kuberna Labs v1.0: mainnet escrow contracts on ETH/Polygon/Arbitrum, agent marketplace launch, community template registry, and SDK API freeze.

**Post URL slug**:

> road-to-v1-0-mainnet-marketplace

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

We've spent the last six months building the foundation. SDK, contracts, TEE integration, intent parser, reputation system — all working in testnet.

Now it's time to ship v1.0.

This post is the detailed roadmap for Q3 and Q4 2026. Dates are estimated. Some things will slip. But the priorities are locked.

---

### What v1.0 Means

v1.0 is not a feature release. It's a stability release. The goal is:

1. Mainnet deployment of all core contracts
2. SDK API freeze (no breaking changes without a major version bump)
3. Production-grade documentation
4. The first version of the agent marketplace

We're currently at `v0.5.0`. We'll hit `v1.0.0` by December 2026.

---

### Q3 2026 (July — September)

**July: Mainnet Contracts on Ethereum, Polygon, Arbitrum**

The three core contracts — `Escrow.sol`, `ReputationManager.sol`, and `Registry.sol` — will deploy to Ethereum mainnet, Polygon, and Arbitrum in mid-July.

The escrow contract on mainnet will start with:

- A 0.1% protocol fee (configurable by governance after v1.0)
- 24-hour auto-release for undisputed executions
- 7-day dispute window with multi-sig arbitrator (core team initially, transitioning to community arbitration post-v1.0)
- Support for ETH, ERC-20, and ERC-721 settlements

The contracts have been audited by two independent firms. Reports will be published at deploy time.

**August: Solana SVM Mainnet Support**

The Rust adapter for Solana will leave beta. This means agents can submit intents that resolve to Solana instructions, not just EVM transactions.

Key work: the intent parser must understand Solana's account model (rent exemptions, PDA derivation, CPI calls). The cross-chain escrow must handle Solana's different finality (400ms slots, no reorgs).

**September: SDK v1.0 API Freeze**

We're locking the public API surface of `@kuberna/sdk`. After September 30:

- No breaking changes to exported functions
- No breaking changes to the `Intent` / `Execution` / `Receipt` types
- No breaking changes to the escrow interface

Internal modules can still change. But if you're building on top of the SDK, your code will work without changes through at least v1.5.

September is also when we ship the **formal verification report** for the escrow contract (funded by the EF grant, if approved). The Coq proofs will be in `/contracts/formal-verification/`.

---

### Q4 2026 (October — December)

**October: v1.0 Release Candidate**

All core contracts deployed and verified on Etherscan + Solscan. All SDK modules passing 200+ tests. Documentation at `docs.kuberna-labs.dev` complete with:

- Quickstart guide (5-minute setup)
- Cross-chain execution tutorial
- TEE attestation integration guide
- Escrow contract reference
- Agent reputation scoring guide

The release candidate will be tagged `v1.0.0-rc.1`. We'll ask the community to test in testnet for 30 days and report issues.

**November: Agent Marketplace Launch**

The marketplace is a registry where anyone can publish an agent configuration and users can discover and execute them.

Agent marketplace features:

- **Agent listing:** publisher uploads an agent definition (intent patterns, supported chains, fee structure, TEE attestation policy)
- **User discovery:** browse by chain, by function (trading, yield, monitoring, security), by reputation score
- **One-click execution:** user connects a wallet, approves an intent scope, and the agent runs on their behalf
- **Reputation display:** every agent's on-chain reputation score is displayed on its listing page

Agents on the marketplace are still non-custodial. The user signs intents. The agent executes within the intent scope. The escrow holds funds only during active execution windows.

The marketplace smart contract is a simple registry: `AgentMarketplace.sol` with `registerAgent()`, `updateAgent()`, and `resolveAgent()` functions. The front end is a Next.js app hosted at `market.kuberna-labs.dev`.

**December: v1.0 Final**

If the RC passes 30 days without critical issues, we tag `v1.0.0`.

Post-v1.0 priorities (Q1 2027):

- Community arbitration system (transition from core-team multi-sig)
- NEAR Protocol integration
- zkTLS proof aggregation (research done, implementation starts)
- Agent template registry (community-submitted intent patterns)

---

### Feature Prioritization Criteria

How we decide what goes in and what gets pushed:

**Must-have for v1.0:**

- Multi-chain escrow with 100% test coverage
- SDK API that doesn't change
- Community arbitration basics
- Agent marketplace v1

**Nice-to-have for v1.0:**

- zkTLS integration (might slip to Q1 2027)
- Agent template registry (might slip)
- Mobile SDK (not starting until 2027)

**Out of scope for v1.0:**

- DAO governance (tokens, voting, treasury management)
- Non-EVM execution beyond Solana
- MEV protection (needs more research)
- Per-agent private key infrastructure (we don't believe in it)

---

### How the Community Influences the Roadmap

The roadmap is not set in stone. We have a `#roadmap-discussion` channel on Discord where anyone can argue for a priority shift.

The criteria we use: **how many agents does this unblock?**

If integrating NEAR enables 10 new agent use cases, it competes with zkTLS proof aggregation, which enables 2 use cases. NEAR gets priority.

If the community disagrees, we open a GitHub Discussion with a poll and a week-long comment period. The majority wins, with a veto from the core team if the decision affects security or sustainability.

The repo is at [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs). The roadmap is in `ROADMAP.md` at the root.

Discord: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu).

We ship in public. Come shape what ships next.

---

_Subscribe for Post 39 — 2027 predictions: universal agent identities, zkTLS at scale, and the end of single-chain agents._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
