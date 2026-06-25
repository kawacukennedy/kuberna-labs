---
title: "Post 33: We Open-Sourced the Whole Thing: Inside Kuberna Labs' Contributor Community"
slug: we-open-sourced-the-whole-thing-inside-kuberna-labs-contributor-community
---

## Title Field

Put this in the **Title** field:

> We Open-Sourced the Whole Thing: Inside Kuberna Labs' Contributor Community

## Subtitle Field

Put this in the **Subtitle** field:

> 175 tests, 19 backend route modules, Solidity + Rust + TypeScript across 5 chains — how an MIT project gets built in the open.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Inside Kuberna Labs' Open-Source Contributor Community

**Meta description** (155-160 chars):

> 175 tests, 19 route modules, Solidity + Rust + TypeScript across 5 chains. Here's how Kuberna Labs builds MIT-licensed agent infrastructure in public — contributor stories and all.

**Post URL slug**:

> we-open-sourced-the-whole-thing-inside-kuberna-labs-contributor-community

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

When we pushed the first commit to `kuberna-labs/sdk`, it was just me, a laptop, and a `README.md` that said "coming soon."

Six months later, here's the state of the repo:

- 175 tests across 8 test suites
- 19 backend route modules in TypeScript
- Solidity contracts for 5 EVM chains
- Rust modules for Solana SVM integration
- 1,847 GitHub stars
- 43 contributors
- Zero merge commits without passing CI

Nobody planned for this to grow the way it did. It happened because we made a series of decisions about _how_ to be open source, not just _that_ we were open source.

Here's what those decisions look like from the inside.

---

### How Contributions Are Organized

We get asked a lot: "I want to contribute but I don't know where to start."

The answer is in our GitHub issues. Every issue is tagged with one of four labels that tell you exactly what you're getting into:

**`good-first-issue`** — These are small, well-scoped, and come with step-by-step instructions in the issue body. Example: "Add test coverage for the escrow auto-release edge case when the recipient address is the zero address." The expected change is usually one file, 20-50 lines. We assign a mentor from the core team who reviews your approach before you write code.

**`help-wanted`** — Bigger scope, more autonomy. These are features or fixes that need someone to own them. Example: "Implement the Solana SVM intent parser adapter." You'll need to understand both our parser architecture and Solana's transaction model. We'll answer questions but you drive the implementation.

**`backend`** / **`contracts`** / **`sdk`** — Category labels so you can filter by what you're interested in. If you only want to write Solidity, you never need to look at the TypeScript issues.

**`research`** — Open-ended investigations. "What's the best approach for zkTLS proof aggregation?" No expected code output. We want findings, trade-off analyses, and recommendations. Some of our best engineering decisions have come from `research`-tagged issues.

Every issue also has a complexity estimate: `effort: small`, `effort: medium`, `effort: large`. This is our best guess based on similar past work. It's usually wrong by about 2x, but it gives a starting point.

---

### What First-Time PRs Look Like

Let me show you three real first-time contributions that shaped the project.

**PR #127 — A documentation fix:**
A contributor noticed our TEE attestation docs referenced an outdated Intel SDK version. They updated the version number and added a note about the deprecation timeline. One file, three lines changed. It took them 10 minutes. It saved future contributors hours of confusion.

**PR #208 — A test addition:**
Our reputation scoring contract had a gap: it didn't test what happened when a dispute was resolved in favor of the executor (not the agent). A first-time contributor wrote a Foundry test for that exact scenario. They found that the reputation adjustment was calculating the wrong delta. The test caught the bug. We fixed the contract.

**PR #311 — A feature implementation:**
Someone needed the SDK to support a specific Arbitrum Nitro feature — retryable tickets with calldata. They implemented the adapter, wrote tests, and documented it. This was a 400-line PR from someone who'd never written TypeScript for a cross-chain context before. We reviewed it, made three comments about error handling patterns, and merged it.

These three PRs tell the same story: you don't need to be an expert in all 5 chains to contribute. You need to find one thing that matters to you and fix it better than it was before.

---

### The Review Process (No Egos)

Our CODEOWNERS file assigns review responsibilities by module. If you touch `packages/contracts/`, at least one of our Solidity maintainers reviews it. If you touch `packages/sdk/src/routes/`, one of the TypeScript maintainers reviews it.

The review protocol is simple:

1. Reviewer reads the diff within 48 hours
2. Reviewer leaves specific, actionable comments — "This function doesn't handle the case where `amount` is zero" not "This needs work"
3. Contributor addresses feedback or explains why the current approach is correct
4. Second review if the change is non-trivial
5. Merge

We don't do drive-by reviews. Every review is assigned in the PR. Reviewers are expected to understand the context before commenting.

The rule we enforce hardest: **no personal criticism**. We review code, not people. If a PR has issues, we describe the issues. "This approach leaks gas because the loop can exceed block gas limit" is a valid review comment. "This is poorly written" is not. That distinction matters for keeping new contributors coming back.

---

### Building in Public Philosophy

"Building in public" is a buzzword in crypto. Everyone claims to do it. Most projects publish their roadmap, tweet about progress, and call it transparency.

We try to do something different: **we build the project _inside_ the public channels**.

All planning happens on Discord, in threads that anyone can read. Feature proposals are GitHub Discussions posts, not Google Docs. Architecture decisions are documented in ADRs (Architecture Decision Records) in the repo itself — not in a Notion page no one can see.

When we debated whether to support Solana SVM through a separate crate or a unified adapter, the entire conversation happened in a public GitHub issue. External contributors weighed in. A contributor from the Solana ecosystem made the case for the unified adapter approach. Their argument won. That decision is now recorded in `docs/adr/003-svm-adapter-architecture.md`.

This has a real cost: it's slower. Internal discussions that could happen in a 5-minute Slack huddle take 48 hours of async GitHub comments. But the result is a decision that everyone can see, everyone had a chance to influence, and everyone understands the reasoning behind.

---

### What We've Learned About Open Source

**Not all contributions are code.** We've had people contribute: fuzzing harnesses for the escrow contract, translation of documentation into Korean and Spanish, architecture diagrams, a VS Code extension for intent debugging, and a thorough security audit of our circuit breaker logic that caught a race condition.

**The barrier to a second contribution is higher than the barrier to the first.** Most projects focus on getting people to submit a first PR. That's important. But getting them to submit a second is harder. We addressed this by creating a contributor progression path: first PR gets a shoutout in Discord. Fifth PR gets a contributor badge. Tenth PR gets write access to the repo.

**Documentation is an infinite time sink.** We spend about 30% of our engineering time on docs. It feels too high. It's probably not enough.

---

### The Numbers

As of this week:

- 1,847 stars on GitHub
- 43 total contributors (18 with multiple PRs)
- 175 tests, 100% pass rate
- Average merge time for first-time PRs: 3.2 days
- Average merge time for returning contributors: 1.1 days
- Most active time zone: UTC-5 (East Coast US) surprisingly, not UTC+8 (Asia) which is common in crypto

The repository is at [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs).

The Discord where all the planning happens: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu).

If you've been thinking about contributing to an open-source project, start with a `good-first-issue`. Pick something small. Read the instructions. Ask questions in the issue thread. We don't bite.

---

_Subscribe for Post 34 — a full contributor story from someone who found us through the PQ certificate system and became a core maintainer._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
