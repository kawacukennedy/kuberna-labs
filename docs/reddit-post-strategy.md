# Reddit Post Strategy — Kuberna Labs Discord Growth

**Goal:** Drive maximum qualified signups to Discord server `https://discord.gg/MZvNuhpXu`

**Based on analysis of 2026 Reddit virality data:** statement titles outperform questions by +1,000 upvotes; text posts with embedded links outperform link posts; 60–80 character titles peak; first 90 minutes determine everything.

---

## Primary Post: `r/ethdev` (~200K Ethereum developers)

**Why:** Most targeted audience — every member is an Ethereum dev working with smart contracts, tooling, or infrastructure. Highest conversion potential. r/programming is 30× larger but posts drown in noise and moderation is extremely strict.

**Post day/time:** Wednesday, 7 AM ET (aligns peak engagement for developer subs)

---

### Title (62 chars — problem-first, specific, first-person)

> **AI agents need on-chain escrow. I built it — here's what broke.**

---

### Post Body (text post, ~500 words)

Early this year, I set out to solve a deceptively simple problem: **how does an AI agent settle a financial transaction on-chain?**

Not "call an API." Not "reply to a prompt." Actually move value — ETH, USDC, whatever — from point A to point B, with cryptographic proof of what happened, and a dispute mechanism in case something goes wrong.

Six months, 18 Solidity contracts, and one embarrassing `Math.sin()` price oracle later, here's what I actually needed.

**The architecture that survived**

Three contracts matter. The rest were noise.

**Escrow.sol** — Holds funds until an intent is fulfilled. The key insight: the agent never holds a private key. It posts an intent. Executors compete to fulfill it. The escrow settles only when conditions are met. `nonReentrant` on `assignExecutor()` and `raiseDispute()` caught a reentrancy vector I'd missed in the first draft.

**Intent Parser** — The agent says "swap 1 ETH for USDC on Solana." The parser needs to output structured JSON without hallucinating. I started with GPT-4. It confused "Arbitrum" with the "ARB" token — a $10,000 hallucination waiting to happen. Now I use a 4-layer fallback: compromise.js → 12 regex patterns → GPT-4 (only when confidence < 0.6) → RAG memory. The LLM is a safety net, not the primary parser.

**Circuit Breaker** — My agent called a dead OpenAI endpoint 47 times before I noticed. Each call cost money. Each returned nothing. The agent didn't know it was failing — it just thought the world was returning empty responses. I built a sliding-window state machine: 3 failures in 5 minutes → OPEN → 30s probe → HALF_OPEN → reset or lock. When the circuit is open, the agent falls back to a local parser. No API call needed. Graceful degradation > perfect uptime.

**What broke that I didn't expect**

- `Math.sin()` as a price oracle. It was a placeholder that somehow made it to staging. Don't laugh — you've done something equivalent.
- Direct wallet integration. First design gave agents a key. Reversed it after a close call in testing. Intent-based execution is harder to build but fundamentally safer.
- The 4-layer parse chain was born from a GPT-4 hallucination that would have cost real money.

**What surprised me**

Cross-chain settlement is not primarily a smart contract problem. It's an **orchestration** problem. The contracts are the easiest part. Making the agent decide correctly, attest to its decision, and fall back gracefully when things fail — that's where the real engineering lives.

**The honest limitation**

All 18 contracts compile and 175 tests pass. What doesn't exist yet: zkTLS integration, Solana support, and a production-grade adapter for existing agent frameworks. I know roughly how to build each. If you've solved any of these, I'd genuinely love to hear how.

---

**What safety patterns do you use when your agent touches real money? I'm especially interested in hearing from anyone who's run agent-incentive experiments on testnets.**

---

### Comments Strategy

**First comment (post within 60 seconds of publishing):**

> Repo: https://github.com/kawacukennedy/kuberna-labs
> Discord: https://discord.gg/MZvNuhpXu — we're discussing contract architecture, intent parsing, and agent safety patterns
>
> MIT licensed, 175 tests, all green. PRs very welcome.

**Second comment (within 5 minutes — engagement bait):**

> If you want to skip the writeup and just see the escrow contract: `contracts/Escrow.sol`
>
> The `nonReentrant` modifiers are on lines 42 and 78. The dispute window logic starts at line 103. Happy to explain the design rationale in the comments.

**Reply strategy (first 2 hours — critical window):**

- Reply to every comment within 15 minutes
- Ask follow-up questions to extend threads
- Never argue — if someone criticizes, agree with the valid part and explain the tradeoff
- Drop the Discord link only when someone asks "where can I discuss this more?"
- Use the H.E.L.P. framework: Headline → Explain → List → Proof + Permission

---

## Secondary Option: `r/MachineLearning` (~3M members)

**Use only if:** r/ethdev post gains traction and you want to cross-post with a different angle.

**Title (75 chars):**

> My AI agent called a dead API 47 times. I open-sourced the circuit breaker that stopped it.

**Body focus:** Lead with the circuit breaker story (most relatable to ML engineers). Mention on-chain escrow as a secondary detail. Drop Discord link in first comment.

**Important:** Do NOT post to both subs simultaneously — triggers spam detection. Post to r/ethdev first, wait 48 hours, then cross-post to r/MachineLearning only if the first gained >50 upvotes.

---

## Pre-Post Checklist

- [ ] Account age >30 days (if creating new: seed with genuine comments for 30 days)
- [ ] Account has 100+ combined karma (if not: comment on 10-15 posts in target sub first)
- [ ] 3+ genuine comments in r/ethdev during prior 30 days (builds history)
- [ ] Read r/ethdev sidebar, wiki, and pinned posts
- [ ] Verify post format matches subreddit rules (text post, not link post)
- [ ] Draft post saved locally (DO NOT delete if removed — creates spam profile gap)
- [ ] Post time: Wednesday, 7:00 AM ET (11:00 UTC)
- [ ] Be available for 2+ hours after posting to reply to comments
- [ ] No link shorteners anywhere
- [ ] No promotional language ("check out," "the best," "revolutionary") in title or body
- [ ] "I built this" disclosure implicit in first-person title
- [ ] Discord invite link in first comment (not in post body)
- [ ] GitHub link in first comment (not in post body)

---

## Success Metrics

| Tier      | Upvotes at 60 min | Outcome                                                                         |
| --------- | ----------------- | ------------------------------------------------------------------------------- |
| ✅ Strong | 50–200            | Top of r/ethdev, Discord influx expected                                        |
| 🚀 Viral  | 200+              | r/all potential, significant growth                                             |
| ⚠️ Alive  | 10–50             | Needs acceleration — reply faster, share in relevant threads                    |
| ❌ Dead   | <10               | Time decay has buried it. Analyze why, wait 2 weeks, retry with different angle |

**Discord conversion expectation:** At 50+ upvotes on r/ethdev, expect 10–30 Discord joins. At 200+, expect 50–150. Higher if the post generates controversy or debate.

---

## If Post Flops — Diagnose

| Symptom                          | Likely Cause                          | Fix                                                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| Removed by mods                  | Rule violation or spam filter         | Check removal reason, wait 24h, send polite modmail                        |
| 0–5 upvotes after 2h             | Wrong title, wrong sub, or dead time  | Retitle with specific number, retarget sub, repost at correct time         |
| 5–20 upvotes but no comments     | Title got click but body lacked depth | Add more technical specifics, share a failure story, ask a better question |
| 20+ upvotes but no Discord joins | Post didn't lead anywhere actionable  | Make sure links are visible in first comment, not buried                   |
