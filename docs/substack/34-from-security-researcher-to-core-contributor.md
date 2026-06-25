---
title: "Post 34: From Security Researcher to Core Contributor — One Dev's Journey Into Agent Infrastructure"
slug: from-security-researcher-to-core-contributor
---

## Title Field

Put this in the **Title** field:

> From Security Researcher to Core Contributor — One Dev's Journey Into Agent Infrastructure

## Subtitle Field

Put this in the **Subtitle** field:

> What brought them in, what they built, what they learned — a contributor story with real technical depth.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> From Security Researcher to Core Contributor at Kuberna Labs

**Meta description** (155-160 chars):

> How a smart contract security researcher found the Kuberna project through its PQ certificate system, submitted a PR for dispute resolution edge cases, and became a core contributor.

**Post URL slug**:

> from-security-researcher-to-core-contributor

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

_This is a guest post by Marcus, who goes by `marcus-sec` on GitHub. He started as a first-time contributor three months ago and now maintains our escrow and reputation contracts._

---

I audit smart contracts for a living. I've read more Solidity than most people have read emails. Reentrancy guards, access control, oracle manipulation — I can spot these patterns in my sleep.

When I found Kuberna Labs, I wasn't looking for a project to contribute to. I was looking at the repo because someone in a security Discord mentioned their post-quantum certificate system. I thought it was a gimmick.

Three months later, I'm a core contributor. Here's how that happened.

---

### What Caught My Eye: The PQ Certificates

The post-quantum signature scheme in the SilentVerify module is not a gimmick. It's real.

Kuberna uses SPHINCS+ (stateless hash-based signatures) for agent execution certificates. In plain English: when your agent completes a task, it produces a signed receipt that's secure against quantum attackers. No one can forge a receipt even with a quantum computer.

I was skeptical. I cloned the repo, read the module, and found a real implementation with:

- SPHINCS+-Haraka parameter set for fast verification
- A hybrid mode that chains SPHINCS+ with ECDSA for backward compatibility
- A certificate chain that includes the TEE's MRENCLAVE hash as an extension field

The architecture was sound. The code was clean. I filed one issue about a missing error case — what happens if the SPHINCS+ key generation fails due to insufficient entropy in the TEE? — and moved on.

A core contributor replied within four hours. They agreed it was a valid edge case and asked if I wanted to open a PR.

---

### The First PR: Dispute Resolution Edge Cases

I didn't intend to submit a PR. I audit code; I don't write it. But the issue stuck in my head. The escrow contract had a `dispute` function with a `_resolveDispute` internal call. I'd read through it and found a subtle issue.

The contract allowed the arbitrator to resolve a dispute with any status — `VALID`, `INVALID`, or `FRAUD`. But the reputation system only handled `VALID` and `FRAUD`. If the arbitrator returned `INVALID` (meaning the execution was neither valid nor fraudulent — perhaps the agent and executor both made mistakes), the reputation update would silently revert.

This wasn't a critical bug. It was a design gap. The dispute resolution model didn't account for the full outcome space.

I forked the repo. I wrote a test that demonstrated the reverting call. Then I wrote a fix: a new reputation adjustment path for `INVALID` resolutions that split the penalty between agent and executor. It was 60 lines of Solidity and 80 lines of tests.

The review was thorough. The core team asked why I used a 50/50 split instead of a proportional model. I explained that proportional splits require oracle data for fault attribution, which adds complexity and attack surface. They agreed. The PR merged in 3 days.

That was my first contribution to an open-source project in five years.

---

### What Kept Me Around

Three things made me stay.

**One: the review culture.** My Solidity is good. But the reviewers found two things I missed: an unchecked block that could silently overflow in edge conditions, and a gas optimization in the reputation storage layout. They pointed out the issues without making it personal. "This unchecked arithmetic can overflow if `totalPenalty` exceeds `type(uint256).max - baseFee`" — factual, specific, actionable. That's the gold standard for code review.

**Two: the research-first approach.** When I raised the question about proportional vs. fixed-split penalties, instead of giving me an answer, they opened a `research` issue and asked me to write up the trade-offs. I spent a week analyzing different dispute resolution models across DeFi protocols. My findings shaped the final design. The project valued my analysis, not just my code.

**Three: the scope of the problems.** Auditing contracts is intellectually stimulating but narrow. You look at the same patterns repeatedly. Kuberna's cross-chain architecture forced me to think about problems I'd never encountered: how do you verify an execution that starts on Ethereum and settles on Solana? What does dispute resolution look like when the evidence is split across two chains with different finality models?

These are genuinely novel problems. They don't have established solutions. That's rare in smart contract development in 2026.

---

### What I Built

Over three months, I've contributed:

- The dispute resolution edge case fix (PR #217)
- A complete rewrite of the reputation scoring contract to support multi-chain reputation aggregation (PR #289)
- An invariant testing suite for the escrow contract using Foundry's fuzzer (PR #342)
- Three ADRs documenting our escrow architecture decisions
- Reviews on 12 PRs from other contributors

The reputation rewrite was the biggest. Originally, reputation was per-chain: an agent had a score on Ethereum, a separate score on Arbitrum, etc. But agents were starting to operate across chains in a single workflow. A single execution might start on Ethereum, use data from Solana, and settle on Base. Which chain's reputation updates?

We created a unified reputation model: a global score with chain-specific weights. If an agent executes across 5 chains, the reputation update is weighted by the economic significance of each leg. The Ethereum leg gets higher weight because it holds more value. The Solana leg gets weight proportional to its execution speed advantage. The math is in `contracts/reputation/ReputationManager.sol` if you want to see it.

---

### What I Learned

Three things that surprised me:

**Open-source infrastructure projects are harder than auditing.** When you audit, you point out flaws and move on. You don't have to fix them. Contributing means you own the outcome. If my reputation model has a bug, agents lose reputation incorrectly. That's real.

**The TEE attestation model is more practical than I expected.** I was skeptical of hardware trust assumptions. But seeing how the attestation chain works — platform certificate → enclave measurement → application hash — made me realize that for most agent use cases, the threat model is adequate. The attacker needs to compromise Intel's root key at the hardware level. That's a state-level attack. Most disputes are about data provenance, not hardware security.

**The community is the differentiator.** I contribute to several open-source projects. Kuberna's Discord is the only one where I can ask a question about SPHINCS+ key management and get an answer from someone who's actually deployed it in production within the hour. The knowledge density is unusual.

---

### Why You Should Contribute

You don't need to be a security researcher. You don't need to know Solidity. The project needs:

- Rust developers for the Solana SVM module
- TypeScript developers for the SDK routing
- Technical writers for documentation
- Test engineers for fuzzing and invariant testing
- People who just want to read the code and file issues

The repo is at [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs). The `good-first-issue` label has 7 open issues right now.

The Discord is [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu). Join the `#contributors` channel and say hi.

I was a skeptic. I became a contributor. You might too.

---

_Subscribe for Post 35 — showcasing what the community is building with the SDK. Real projects, real deployments, real code._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
