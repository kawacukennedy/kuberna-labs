---
title: 'Post 37: Building in Public: Our GitHub Ops Rhythm, Code Review Culture, and Ship Cadence'
slug: building-in-public-github-ops-rhythm
---

## Title Field

Put this in the **Title** field:

> Building in Public: Our GitHub Ops Rhythm, Code Review Culture, and Ship Cadence

## Subtitle Field

Put this in the **Subtitle** field:

> PR templates, CI pipeline, review rotation, issue labeling, security disclosures — practical ops for open-source infra.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> GitHub Ops Rhythm: How Kuberna Labs Ships Open-Source Code

**Meta description** (155-160 chars):

> PR templates, CI pipeline across 5 chains, review rotation, issue labeling, security disclosures. The practical ops behind building open-source agent infrastructure in public.

**Post URL slug**:

> building-in-public-github-ops-rhythm

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

Open source is a coordination problem disguised as a technical one.

Anyone can push code to a public repo. The hard part is doing it in a way that doesn't burn out maintainers, confuse contributors, or introduce security holes.

We've been iterating on our ops since day one. Some things work. Some things we've had to change. Here's the current state of how we operate.

---

### PR Workflow

Every pull request goes through the same pipeline, no exceptions.

**Step 1 — Template.**
We use a PR template with four sections:

- **What does this PR do?** (one sentence)
- **Related issues** (link to the GitHub issue)
- **Changes made** (bullet list of files and what changed)
- **Testing** (what tests were run, what the results were)

If the PR template isn't filled out, the CI check fails. It enforces a minimal standard of context.

**Step 2 — CI pipeline.**
Every PR triggers:

- `lint` — ESLint for TypeScript, Solhint for Solidity, Clippy for Rust
- `typecheck` — `tsc --noEmit` for TypeScript
- `test:unit` — unit tests across all three language modules
- `test:integration` — integration tests that require an RPC endpoint (we use anvil for EVM chains)
- `test:coverage` — coverage report, but we don't enforce a minimum threshold (yet)
- `audit:deps` — `npm audit`, `cargo audit`, and a custom script that checks for known vulnerabilities in Solidity dependencies

The full CI pipeline takes about 12 minutes for TypeScript-only changes. Rust and Solidity changes take longer because of compilation. We're working on caching strategies.

**Step 3 — Assignment.**
A maintainer is auto-assigned based on the files changed (CODEOWNERS). If the PR touches `packages/contracts/`, the Solidity maintainer gets assigned. If it touches `packages/sdk/`, the TypeScript maintainer gets assigned.

**Step 4 — Review.**
First review within 48 hours. Second review if the change touches the escrow contract, the reputation system, or TEE attestation. Minimum one approving review before merge.

**Step 5 — Merge.**
Squash merge with a descriptive commit message. No merge commits. Linear history enforced.

---

### Review Culture (The Hard Part)

Code review is where open-source projects either thrive or die.

We've established a few hard rules:

**No personal criticism.** Period. "This is wrong" is not a review comment. "This function doesn't handle the case where `amount` is zero, which would cause a revert" is a review comment.

**Review the approach, not just the code.** When someone submits a PR, we ask: "Is this the right way to solve the problem?" before diving into syntax. If the approach needs to change, we say so early, before the contributor has polished every line.

**Two-review rule for sensitive code.** The escrow contract, the TEE verifier module, and the reputation scoring system require two independent reviews before merge. One reviewer can miss something. Two reviewers catching the same thing independently is unlikely.

**Rotating review schedule.** Three core maintainers rotate weekly: one is primary reviewer, one is secondary, one is on "research" duty (ADRs, specification reviews, architectural discussions). This prevents anyone from being the bottleneck.

We don't enforce a maximum PR size, but the community self-regulates. The average PR is 150 lines. PRs over 500 lines rarely get quick reviews. If you're submitting 500+ lines, break it into smaller PRs.

---

### Issue Labeling System

Our issue labels serve as a triage system:

- `bug` — confirmed bug. Includes reproduction steps or a link to a failing test.
- `enhancement` — feature request. Needs a use case and an acceptance criteria.
- `good-first-issue` — beginner-friendly. Includes step-by-step instructions and a mentor.
- `help-wanted` — open for anyone to pick up. No assigned mentor, but maintainers answer questions.
- `research` — open-ended investigation. Output is a document or a discussion post, not necessarily code.
- `security` — privately reported via security.md. Not publicly visible until resolved.
- `blocked` — waiting on external dependency (e.g., an API provider, a chain upgrade).

Every issue gets a label within 24 hours of filing. Unlabeled issues are triaged during the weekly maintainer sync.

---

### Security Disclosures

Our `SECURITY.md` is at the root of the repo.

For critical vulnerabilities: email `security@kuberna-labs.dev` (PGP key published in the repo). We commit to acknowledging within 24 hours and shipping a fix within 7 days.

For non-critical issues: file a public issue with the `security` label or tag `@kuberna/security` in Discord. Public disclosure is fine for issues that don't risk user funds.

Since launch, we've received 4 security reports:

- 1 critical: a reentrancy path in the escrow contract's dispute resolution (reported, fixed, disclosed — 3 days)
- 2 medium: gas griefing vectors in the reputation contract (reported, fixed, no disclosure needed)
- 1 informational: a potential timing side-channel in the TEE attestation verification (analyzed, determined not exploitable in practice, documented the reasoning)

All reporters were acknowledged and offered a spot on our security contributors list (if they wanted it). Two accepted.

---

### Release Process

We ship on a **bi-weekly cadence** — every other Tuesday.

The release process:

1. `main` branch is tagged with the version (semver: `v0.4.0`, etc.)
2. CI runs the full pipeline against the tagged commit
3. If CI passes, the release is published to npm (`@kuberna/sdk`), crates.io (`kuberna-svm`), and as a GitHub Release
4. A changelog is generated from commit messages since the last tag
5. A release announcement goes to Discord (`#releases` channel)
6. A summary post goes to Substack (short version, linking back to the full changelog)

We don't do hotfix releases unless a security vulnerability is involved. Everything else waits for the next bi-weekly cycle.

---

### Communication Channels

We use three primary channels:

**GitHub — synchronous async.**
Issues for bugs and feature requests. Discussions for architectural decisions. PRs for code changes. ADRs for permanent records.

**Discord — real-time async.**
Development discussions, contributor questions, community projects. We have dedicated channels for each chain (ethereum, arbitrum, base, polygon, solana), plus a `#contributors` channel for PR coordination. Join at [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu).

**Substack — outward-facing.**
This series. Long-form technical content and community stories. Not a development channel — a documentation and communication channel.

We don't use Telegram, Twitter, or email for project communication. Everything that matters happens in GitHub or Discord, where it's archived and searchable.

---

### The Bottom Line

This ops system is not perfect. We spend too much time on reviews. Our CI pipeline has false positives. The bi-weekly release cadence sometimes stretches to 3 weeks when life intervenes.

But it's transparent. Anyone can read our PRs, see our reviews, watch our CI, and understand our decisions. That's the point.

The repo: [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs).

All of this is open to improvement. If you see something in our ops that could be better, open an issue with the `enhancement` tag. We'll review it within 48 hours.

---

_Subscribe for Post 38 — the detailed roadmap to v1.0: mainnet contracts, the agent marketplace, and everything else coming in Q3-Q4 2026._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
