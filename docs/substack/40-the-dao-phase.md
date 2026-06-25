---
title: 'Post 40: The DAO Phase: What Community Governance Looks Like for Agent Infrastructure'
slug: the-dao-phase-community-governance
---

## Title Field

Put this in the **Title** field:

> The DAO Phase: What Community Governance Looks Like for Agent Infrastructure

## Subtitle Field

Put this in the **Subtitle** field:

> Progressive decentralization — how we move from core-team-run to community-run without breaking the product.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> DAO Phase: Community Governance for Agent Infrastructure

**Meta description** (155-160 chars):

> Progressive decentralization at Kuberna Labs — how we transition from core-team governance to community DAO governance for agent infrastructure, fee schedules, contract upgrades, and grants.

**Post URL slug**:

> the-dao-phase-community-governance

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

Every crypto project starts with a small group making all the decisions. That's not sustainable for infrastructure that's supposed to outlast its founders.

At some point, the community needs to govern. The question is how to get there without breaking the product.

Here's our plan for progressive decentralization — what we're keeping, what we're handing over, and when.

---

### The Why: Why Decentralize at All?

Three reasons.

**Credible neutrality.** If Kuberna becomes critical infrastructure for AI agents, the governing body should not be a small group of people who can unilaterally change the rules. The escrow contract holds user funds. The registry controls which agents are discoverable. These need neutral governance.

**Resilience.** If the core team gets hit by a bus — or just burns out — the project should continue. A DAO with a treasury and a contributor base can outlast any individual.

**Community legitimacy.** The people who build on top of Kuberna deserve a voice in how it evolves. It's their agents, their reputation, their escrowed funds. They should have a say.

---

### The Stages

We're planning four stages of decentralization. We're in stage 1 now.

**Stage 1: Core Team Multi-Sig (Current — Q1 2027)**

All decisions go through a 2/3 multi-sig: three core contributors, two signatures required.

What the multi-sig controls:

- Escrow contract upgrades
- Protocol fee rate changes
- Arbitrator assignments for disputes
- Treasury spending

What the multi-sig does NOT control:

- The SDK code (that's MIT-licensed, anyone can fork)
- The open-source modules (same)
- What individuals build with the stack (obviously not)

This stage is the most centralized and the most efficient. We make decisions in hours, not weeks. For a pre-v1.0 project, that's the right trade-off.

**Stage 2: Community Council (Q2 2027 — Q4 2027)**

A 7-person council: 3 core-team members + 4 community-elected members. 4/7 signatures required.

Council elections happen quarterly. Anyone with an on-chain reputation score above a threshold can run. Anyone can vote (weighted by reputation, not tokens — more on that below).

What the council controls:

- Grant allocations from the treasury
- Fee schedule adjustments (within predefined bounds)
- Agent marketplace listing criteria
- Community arbitrator assignments

What stays with the core team:

- Emergency contract upgrades (multi-sig retains a separate key for emergencies)
- Security vulnerability responses
- Day-to-day SDK maintenance (still MIT, still open to anyone)

The council cannot change the core contracts without a full security audit. The council cannot change the SDK's license. The council cannot spend more than 20% of the treasury in a single quarter without a community-wide vote.

**Stage 3: Token-Based DAO (2028)**

We're not launching a token in 2026 or 2027. But by 2028, if the project has sustainable protocol revenue and a large contributor base, a DAO with token-based voting makes sense.

The token would be used for:

- Protocol fee rate changes (anything beyond the bounds set by the council)
- Major contract upgrades
- Treasury diversification
- Parameter changes for the escrow and reputation systems

The token would not be used for:

- Agent marketplace curation (reputation-based, not token-based)
- Dispute resolution (arbitrators are reputation-staked)
- SDK governance (the code is MIT, you don't need a token to contribute)

We're watching how other DAOs have evolved — Uniswap, Aave, Compound. The lesson is clear: minimal governance is good governance. Most decisions should be automatic. The DAO should only vote on things that genuinely need human judgment.

**Stage 4: Fully Distributed (2029+)**

If the project survives that long, the goal is to remove the core team's special privileges entirely. The multi-sig becomes a timelock-controlled contract. The council evolves into a fully elected body. The core team becomes one contributor group among many.

This is the destination. We're not in a rush to get there. Rushing decentralization is how projects get exploited.

---

### What Gets Voted On (and What Doesn't)

A common failure mode of DAOs is voting on everything. Gas costs for proposals, quorum requirements, color scheme changes — all of it ends up on-chain.

Here's the principle: **only things that permanently change the protocol's behavior should go to a vote.**

**Should be voted on:**

- Fee schedule changes (affects every user)
- Contract upgrades (affects security and functionality)
- Grant allocations (spends treasury funds)
- Arbitrator selection (affects dispute outcomes)

**Should NOT be voted on:**

- SDK feature additions (MIT — fork it if you disagree)
- Documentation changes (open a PR)
- Community events (just do it)
- Which chains to support (there's a process, not a vote)
- Individual agent reputations (determined by on-chain behavior, not voting)

---

### Token Mechanics (If Applicable)

If we launch a token in 2028, here's the rough design:

- **Supply:** Fixed, no inflation
- **Distribution:** 40% community treasury (vested over 4 years), 25% core contributors (4-year cliff + 2-year vest), 20% ecosystem grants, 10% initial supporters, 5% liquidity provision
- **Voting power:** Quadratic weighted. Owning 100 tokens doesn't give you 100x the voting power. It gives you about 10x.
- **Delegation:** Supported. You can delegate your voting power to anyone.
- **Utility:** Fee discounts for holders, proposal submission (you need to hold a minimum to submit), reputation boosts for agent marketplaces (tentative)

We are NOT launching a token in 2026 or 2027. Anyone telling you otherwise is misinformed.

---

### The Hardest Part: Security vs. Decentralization

The biggest tension in DAO design is security upgrades. If a vulnerability is discovered in the escrow contract, you need to fix it _now_, not after a 7-day voting period.

Our solution: the core-team multi-sig retains a **security key** that can pause the escrow contract and upgrade to a pre-audited emergency version. The key cannot be used for any other purpose. The council can revoke the key with a 4/7 vote.

This is a compromise. It creates a centralization point. But it's better than having user funds stuck in an exploitable contract while the DAO debates the fix.

---

### Timeline

- **2026:** Core team multi-sig. No token. No council.
- **Q1-Q2 2027:** Community council established (elections in March).
- **Q3-Q4 2027:** Council takes over treasury management and fee adjustments.
- **2028:** Token launch (if conditions are right). DAO formation.
- **2029+:** Progressive removal of core-team privileges.

---

### How to Get Involved

If you want to be part of the governance transition, the best way is to start contributing now.

Reputation is the foundation of our governance model. The more you contribute — code, reviews, documentation, community support — the higher your reputation score. When the council election happens, reputation determines who can run and who can vote.

Start with a `good-first-issue` on GitHub: [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs).

Join the governance discussions on Discord: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu). The `#governance` channel is where we debate these designs.

The goal is a project that outlives its founders. Help us build it.

---

_Subscribe for Post 41 — the final post in this series: Beyond EVM, why Solana, NEAR, and Polkadot change the agent execution game._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
