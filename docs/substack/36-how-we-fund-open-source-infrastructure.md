---
title: 'Post 36: How We Fund Open-Source Agent Infrastructure — Transparently'
slug: how-we-fund-open-source-agent-infrastructure
---

## Title Field

Put this in the **Title** field:

> How We Fund Open-Source Agent Infrastructure — Transparently

## Subtitle Field

Put this in the **Subtitle** field:

> Grants, GitHub Sponsors, protocol revenue. What works, what doesn't, and the numbers behind sustainable MIT development.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> How We Fund Open-Source Agent Infrastructure Transparently

**Meta description** (155-160 chars):

> Full transparency on Kuberna Labs' funding: grants, GitHub Sponsors, protocol revenue. $45K raised so far, $12K/mo burn rate, and what's working for sustainable MIT development.

**Post URL slug**:

> how-we-fund-open-source-agent-infrastructure

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

"Open source is not a business model" is a cliché because it's true.

We're building Kuberna Labs as an MIT-licensed project. Anyone can fork it, modify it, deploy it, sell it. We don't charge license fees. We don't have a BSL transition. We don't have an enterprise edition.

So how do we pay for the infrastructure, tooling, and time that goes into maintaining 175 tests across 5 chains?

Here's the full breakdown, numbers and all.

---

### Grant Funding

We've submitted grant applications to four programs:

**Ethereum Foundation (EF) — Academic Grant.**
Applied: January 2026. Status: under review.
Amount requested: $50,000 USD.
Purpose: Formal verification of the escrow contract's dispute resolution logic. We're working with a university research group to write Coq proofs for the core invariants.
Why we applied: Formal verification is expensive but valuable for a contract that holds user funds. The EF grant would cover the researcher's time.

**Arbitrum Foundation — Developer Grant.**
Applied: February 2026. Status: approved, $15,000.
Amount: $15,000 in ARB tokens (distributed linearly over 6 months).
Purpose: Building and maintaining the Arbitrum-specific SDK modules — Nitro retryable tickets, custom fee estimation, and multi-hop bridge support.
Vesting: We've received $5,000 worth so far. The remaining $10,000 vests monthly through August.

**Solana Foundation — Ecosystem Grant.**
Applied: March 2026. Status: under review.
Amount requested: $25,000 USDC.
Purpose: Solana SVM integration — the Rust adapter, the cross-chain intent parser for SVM, and a reference implementation demonstrating EVM → SVM execution.
Why it might get rejected: Solana grants favor projects that are Solana-native. We're cross-chain by design. We'll find out next month.

**Optimism — RetroPGF.**
Applied: Not yet. We qualify for round 5 (applications open August 2026).
Expected amount: Uncertain. RetroPGF is based on community voting. Comparable projects have received $10K-$50K.
Strategy: We're building Optimism support regardless. If RetroPGF funds it, great. If not, the integration still ships.

**Total grant funding received to date: $5,000 (ARB).**
**Total grant funding pending: $75,000 (across EF, Solana, and remaining Arbitrum vesting).**

---

### GitHub Sponsors

We launched GitHub Sponsors in April 2026. Here's where we stand:

- **Total sponsors:** 23
- **Monthly recurring:** $470/month
- **One-time donations:** $1,200
- **Top tier:** $100/month (2 sponsors)
- **Median tier:** $10/month (11 sponsors)

The sponsors page is at `github.com/sponsors/kawacukennedy`.

GitHub Sponsors is not going to pay the bills at this level. But it's meaningful in a different way: every sponsor is a signal that someone finds the project valuable enough to put money behind. That signal matters when we talk to grant committees and protocol foundations.

If you're reading this and finding the posts useful, the $10/month tier genuinely helps. It covers one CI runner instance.

---

### Protocol Revenue

This is the part of the model that's still being designed.

The escrow contract takes a **0.1% fee** on successful executions. The fee is split: 60% goes to a protocol treasury, 40% goes to the executor who fulfilled the intent.

In April, the escrow processed approximately 340 executions across all supported chains. Total fee revenue: 0.24 ETH (~$450 at current prices).

This is not enough to sustain the project. But it's growing month over month (February: 0.08 ETH, March: 0.15 ETH, April: 0.24 ETH).

The treasury is a Gnosis Safe multi-sig (2/3 — three core contributors). Treasury funds are used for:

- Infrastructure costs (servers, RPC endpoints, CI)
- Bounties for specific features (currently: $500 for zkTLS integration)
- Community events (Discord hackathons, workshop materials)

The fee rate is intentionally low. We'd rather have more executions at 0.1% than fewer executions at 0.5%. The long-term value is in adoption, not fee extraction.

---

### Cost Breakdown

Here's where the money goes each month.

**Infrastructure:**

- 2 TEE-capable cloud instances (Phala workers): $320/month
- RPC endpoints (Alchemy + Helius for Solana): $200/month
- CI/CD (GitHub Actions + self-hosted runner for TEE tests): $80/month
- DNS, monitoring, logging: $40/month
- **Total infra: $640/month**

**Tools:**

- Figma (contract architecture diagrams): $12/month
- Notion (internal docs): $0 (free tier)
- Sentry (error tracking): $29/month
- Observable (test dashboards): $0 (open source)
- **Total tools: $41/month**

**Time (the big one):**

- Core contributors: 3 people at roughly 20 hours/week each
- At a conservative $75/hour rate for smart contract / infrastructure engineering: $9,000/month equivalent
- **Total time value: $9,000/month**

**Total cost to run the project: $681/month (cash) + $9,000/month (time).**

---

### What's Working

**Grants are worth the effort.** The Arbitrum grant application took about 8 hours total. The $15,000 award works out to ~$1,875/hour for that time. Even accounting for the vesting schedule and ARB price risk, it's the best return on any activity we've done.

**Protocol revenue is growing but small.** The month-over-month trend is encouraging. At the current growth rate, fee revenue covers infrastructure costs by August or September.

**GitHub Sponsors is a sentiment signal, not a revenue stream.** That's fine. We didn't launch it expecting to fund the project through sponsorships. We launched it to show community support when applying for grants and partnerships.

---

### What's Not Working

**RetroPGF is uncertain.** We can't plan around a funding source that depends on community voting. We're building Optimism support anyway, but we're not allocating budget based on potential RetroPGF returns.

**The 0.1% fee is probably too low in the long run.** For high-value executions (10+ ETH), the fee is meaningful. For the majority of executions (under 1 ETH), the fee is negligible. We'll re-evaluate after mainnet launch when volume is higher.

**Grant cycles are slow.** Our EF application has been under review for 4 months. We're not holding our breath.

---

### The Sustainability Thesis

Long-term, the project is sustainable if one of three things happens:

1. Execution volume grows enough that 0.1% fees cover the team's time
2. Grant funding becomes a reliable, recurring source (e.g., protocol ecosystem grants)
3. The project spins out a commercially viable service (managed TEE hosting, priority relay, etc.) while keeping the core SDK MIT-licensed

We're pursuing all three in parallel. If you have other ideas, we're listening. The Discord is [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu).

The repo is [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs).

Full financial transparency is a core value. If you want to see exactly where every dollar goes, the treasury is on-chain. The multi-sig address is in our docs. Check it anytime.

---

_Subscribe for Post 37 — our GitHub ops rhythm, code review culture, and how we actually ship code across 5 chains without breaking everything._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
