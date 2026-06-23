# Substack Launch Plan — Kuberna Labs

**Theme:** Building the execution rails for the agentic economy, in public
**Cadence:** Weekly pillar post (Wed) + 5 Notes/week distributed across the week
**Voice:** First-person, vulnerable, technically credible, opinionated
**Target subscriber:** Web3 dev (35%), AI agent builder (30%), crypto infra founder (20%), grant/VC (15%)

---

## Publication Setup

### Name & Tagline

**Name:** Execution Rails
**Tagline:** Building the infrastructure for AI agents that touch money. Open-source, cross-chain, TEE-attested.
**Subtitle:** One developer's journey building Kuberna Labs — open-source execution rails for the agentic economy.

### About Page Copy

> I'm the founder of Kuberna Labs, an open-source SDK (42 stars, MIT) that gives AI agents secure execution rails across any blockchain.
>
> Every week, I share:
>
> - **What we built** — architecture decisions, code patterns, and why we chose intents over wallets
> - **What broke** — the 3 AM bugs, the hallucinated chains, the circuit breaker that saved us
> - **What we believe** — the agentic economy thesis, TEE attestation standards, open-source infrastructure sustainability
>
> No hype. No "AI will replace all developers." Just the boring, hard infrastructure work of making agents that can hold value without rugging you.
>
> Subscribe to follow the build. The SDK is free. The lessons are real.

### Post Template

Every post follows this structure:

- **Hook** (first 3 lines) — a specific moment, failure, or insight
- **The problem** — what we were trying to solve
- **The wrong approach** — what didn't work (always include this)
- **The solution** — code, architecture, decision
- **The lesson** — abstracted so readers can apply it
- **Call to action** — subscribe, comment, try the SDK

### SEO Title Convention

Keep post SEO titles under 60 chars. Pattern: [Number/Trigger Word] + [Specific Outcome] + [Kuberna context].

Example post title: "The day our agent hallucinated a chain"
SEO title: "AI agent hallucinated a chain? Here's the fix"

---

## 30-Day Content Plan

### Week 1 — Origin & Identity

---

#### Post 1 (Day 3, Wed): "The 3 AM Problem That Made Us Build Kuberna"

**SEO title:** Why AI agents shouldn't hold wallet keys (3 AM problem)
**Reading time:** 8 min
**Type:** Free

**Hook:**

> It was 3 AM. Our AI agent had just bridged $500 to a chain neither of us had heard of. The logs said "optimal route found." The balance said $0. We had no proof, no recourse, and no idea what went wrong.

**Structure:**

- The story: what the agent actually did that night
- Why it happened: direct wallet access + blackbox LLM decision
- The real problem: you can't trust what you can't trace
- Our solution: intent-based architecture (agent never holds keys)
- The architecture diagram (text-based): User → NLP → Intent → On-chain Escrow → Executor → Settlement → Attestation
- Why this matters for the agentic economy

**CTA:** Try the SDK at github.com/kawacukennedy/kuberna-labs

**Notes from this post (for Days 1-5):**

- Note 1: "Our AI agent bridged $500 to a chain we'd never heard of at 3 AM. Here's what we learned."
- Note 2: "The scariest sentence in agent infrastructure: 'the agent decided it was optimal.'"
- Note 3: "Three things an agent needs before it touches real money: 1. Intent-based execution 2. TEE-attested decisions 3. Circuit breakers"
- Note 4: "Hot take: if your agent can sign transactions directly, you've already lost."
- Note 5: "We open-sourced the fix. 42 stars. MIT. github.com/kawacukennedy/kuberna-labs"

---

#### Post 2 (Day 10, Wed): "We Put Math.sin() in Production and Called It a Price Oracle"

**SEO title:** We used Math.sin() as a price oracle (and learned the hard way)
**Reading time:** 10 min
**Type:** Free

**Hook:**

> I'm going to show you the most embarrassing line of code I've ever written:
>
> ```
> getPrice(token) { return 3200 + Math.sin(timestamp) * 500 }
> ```
>
> This was our "market data provider" in production for two weeks. It generated fake prices that looked real enough to deceive our tests, our demo videos, and honestly, ourselves.

**Structure:**

- The embarrassing code (full confession)
- How it happened: speed over correctness, demo pressure
- The moment we realized: comparing against real Pyth data
- The migration: PriceFeedService with Pyth Hermes API + 30s cache
- The diff: 81 lines changed, 1 test updated — good abstraction
- What we learned: fake data leads to fake confidence

**CTA:** Read the real price feed code at backend/src/services/priceFeed.ts

**Notes from this post:**

- Note 1: "I put Math.sin() in production and called it a 'market data provider.' Two weeks. Real regret."
- Note 2: "Fake data leads to fake confidence. Real agent infrastructure needs real oracles."
- Note 3: "The fix was 81 lines. The lesson was worth 1000."
- Note 4: "Pyth Hermes API + 30s cache = real prices, real agent decisions."
- Note 5: "We open-sourced the whole thing. Every mistake. Every fix. MIT."

---

### Week 2 — Technical Depth

---

#### Post 3 (Day 17, Wed): "The Circuit Breaker That Saved Our Agent From Itself"

**SEO title:** How we built a circuit breaker for AI agent API calls
**Reading time:** 9 min
**Type:** Free

**Hook:**

> Our agent was calling a dead OpenAI endpoint. It kept calling. Each call cost money. Each call returned nothing. The agent didn't know it was failing — it just thought the world was returning empty responses.
>
> This is the problem a circuit breaker solves.

**Structure:**

- The cascade failure pattern (dead API → failed agent → lost opportunity)
- The state machine: CLOSED → OPEN → HALF_OPEN → CLOSED/OPEN
- Our parameters: 3 failures in 5 minutes, 30s probe interval, local LLM fallback
- The code (simplified):
  ```
  if (failures in last 5min >= 3) {
    openDoor = HALF_OPEN
    wait(30_000)
    tryProbe()
    if (probeOk) reset() else lock()
  }
  ```
- Wrapping all 6 OpenAI methods
- Graceful degradation: compromise.js parser works without any API
- Why every agent needs this

**CTA:** Full implementation at backend/src/utils/circuitBreaker.ts

**Notes from this post:**

- Note 1: "Our agent called a dead OpenAI endpoint 47 times before we noticed. Here's the fix."
- Note 2: "A circuit breaker for AI agents: 3 strikes, 5 minute window, graceful fallback."
- Note 3: "Your agent doesn't know it's failing. It just thinks the world is broken."
- Note 4: "Sliding window state machine. 30 lines of TypeScript. Saved us thousands."
- Note 5: "Graceful degradation > perfect uptime. Local LLM fallback > dead agent."

---

#### Post 4 (Day 24, Wed): "Why Our Intent Parser Doesn't Trust GPT-4"

**SEO title:** Why we don't let GPT-4 parse cross-chain intents
**Reading time:** 11 min
**Type:** Free

**Hook:**

> I asked GPT-4 to parse "bridge my ETH to Arbitrum" and it returned:
>
> ```json
> { "sourceChain": "Ethereum", "destChain": "Arbitrum", "token": "ARB" }
> ```
>
> It confused the destination chain with a token name. If an agent executed this, it would swap ETH for ARB tokens instead of bridging. That's not a bug. That's a $10,000 hallucination.

**Structure:**

- The hallucination problem (3 real examples from our testing)
- Why LLMs are bad at structured extraction from financial intents
- Our multi-layered approach:
  - Layer 1: compromise.js NLP (zero-dependency, zero-cost)
  - Layer 2: 12 regex patterns for "X for Y on Z"
  - Layer 3: GPT-4 fallback (only when confidence < 0.6)
  - Layer 4: RAG memory (learns from past parses)
- Confidence scoring: how we know when to trust the output
- 175 tests, zero hallucinated chains in production
- The tradeoff: complexity vs reliability (we chose reliability)

**CTA:** Read the parser at backend/src/services/intentParser.ts

**Notes from this post:**

- Note 1: "GPT-4 thought 'Arbitrum' was a token. That's a $10K hallucination."
- Note 2: "Four layers of intent parsing. Compromise.js → regex → LLM → RAG. Stop when confident."
- Note 3: "175 tests. Zero hallucinated chains. The boring approach wins."
- Note 4: "Zero API key needed for basic parsing. Works offline. Costs nothing."
- Note 5: "LLM fallback activates in ~15% of cases. Pattern matching handles the rest."

---

### Week 3 — Community & Use Cases

---

#### Post 5 (Day 31, Wed): "Someone Deployed an Agent Using Our SDK"

**SEO title:** What happened when someone deployed our open-source agent SDK
**Reading time:** 7 min
**Type:** Free

**Hook:**

> A developer in the NEAR ecosystem deployed a monitoring agent using Kuberna Labs last week. They didn't tell us. We found it because the agent posted an intent on testnet.
>
> It was watching ETH prices across 4 DEXes. Triggering alerts when arb spreads exceeded 2%. Running autonomously.
>
> They told us: "It took me longer to set up the database than to deploy the agent."

**Structure:**

- The story of finding the deployment
- What the agent was doing (full trace analysis)
- How they set it up (clone → env vars → deploy → watch)
- What it means: the abstraction is working
- The feedback loop: what we learned from their usage
- What they want next (more chains, better alerts)

**CTA:** Deploy your own agent. Repo: github.com/kawacukennedy/kuberna-labs

**Notes from this post:**

- Note 1: "Someone deployed an agent using our SDK. We found it on testnet. They never told us."
- Note 2: "'It took me longer to set up the database than to deploy the agent.' — first external user"
- Note 3: "Watching ETH across 4 DEXes. Arb spread alerts. Running for 6 days. No human intervention."
- Note 4: "Clone → env vars → deploy → watch. That's the developer experience we optimised for."
- Note 5: "Your first agent deployment is 10 minutes away. github.com/kawacukennedy/kuberna-labs"

---

#### Post 6 (Day 38, Wed): "Agent Frameworks vs Execution Rails"

**SEO title:** Agent frameworks don't settle trades — you need execution rails
**Reading time:** 9 min
**Type:** Free

**Hook:**

> Every week, a new "AI agent framework" launches. They all do the same thing: give the agent tools to call APIs.
>
> That solves nothing.
>
> An agent that can call an API cannot hold value. Cannot settle a trade. Cannot prove what it did. Cannot be held accountable at 3 AM when it bridges to the wrong chain.

**Structure:**

- The gap: frameworks solve decision-making, not settlement
- What execution rails add:
  - On-chain escrow with dispute windows
  - TEE-attested decision traces
  - Cross-chain intent marketplace
  - Reputation system for executors
- Comparison table:
  - LangChain/ElizaOS/AutoGen → decisions only
  - Hummingbot/Freqtrade → single use case
  - Phala/Marlin → compute only
  - Kuberna → full stack
- Why you need both (framework + rails)
- Our integration approach: bring your own framework

**CTA:** Read the architecture docs at github.com/kawacukennedy/kuberna-labs

**Notes from this post:**

- Note 1: "Every agent framework solves 'how does the agent decide?' None solve 'how does the decision become reality?'"
- Note 2: "Execution rails > agent frameworks. One is philosophy. The other is infrastructure."
- Note 3: "Your ElizaOS agent needs settlement infrastructure. That's what we build."
- Note 4: "Frameworks + rails = complete stack. Most projects build one. We built the missing half."
- Note 5: "Open source. MIT. Cross-chain. TEE-attested. github.com/kawacukennedy/kuberna-labs"

---

### Week 4 — Vision & Fundraising

---

#### Post 7 (Day 45, Wed): "Why NEAR Intents + Kuberna Is the Stack for Agentic Commerce"

**SEO title:** NEAR Intents and Kuberna: the infrastructure stack for agentic commerce
**Reading time:** 10 min
**Type:** Free

**Hook:**

> NEAR's 2026 Infrastructure Committee roadmap calls NEAR Intents the "unified liquidity layer for the entire blockchain industry." They're also prioritizing "multi-chain verifiable execution via TEEs."
>
> We built exactly this.
>
> Not intentionally at first. We were just trying to make our agent work. But six months later, our architecture aligns almost perfectly with what NEAR is betting the next decade on.

**Structure:**

- NEAR's IC 2026 priorities (intents, TEEs, chain abstraction)
- How Kuberna maps to each:
  - Intent-based agent execution → NEAR Intents
  - TEE-attested decisions → NEAR's privacy infra
  - Cross-chain settlement → NEAR's chain abstraction
- The integration we're building (native NEAR Intents support)
- What this unlocks: agents that post intents directly to the NEAR ecosystem
- Grant application status and timeline
- Why this matters for the agentic economy

**CTA:** Star the repo. Follow the NEAR integration.

**Notes from this post:**

- Note 1: "NEAR is building the unified liquidity layer for blockchain. We're building the agent runtime for it."
- Note 2: "TEE-secured execution + intent-based settlement = agentic commerce infrastructure."
- Note 3: "We didn't plan to align with NEAR's roadmap. It just turned out that way."
- Note 4: "Native NEAR Intents support coming to Kuberna. Agents will post intents directly."
- Note 5: "Grant application submitted. Demo in 2 weeks. github.com/kawacukennedy/kuberna-labs"

---

#### Post 8 (Day 52, Wed): "The Agentic Economy Is Not a Metaphor"

**SEO title:** The Agentic Economy is real — here's the infrastructure it needs
**Reading time:** 12 min
**Type:** Free (anchor post, permanent)

**Hook:**

> The Agentic Economy is not a metaphor. It's not a narrative coin. It's an infrastructure requirement that doesn't exist yet.
>
> Today: humans use apps. Apps use blockchains. Humans carry the risk of every transaction.
>
> Tomorrow: agents use blockchains. Agents discover, negotiate, and settle with each other. A new class of economic actor — one that never sleeps, never gets tired, and never apologizes for executing at 3 AM.

**Structure:**

- The current state: humans as transaction bottlenecks
- The shift: agents as first-class economic actors
- Three infrastructure requirements:
  1. Intent-based execution (agents don't hold keys)
  2. Provable decisions (TEE attestation, not trust)
  3. Cross-chain by default (agents don't know what a chain is)
- Where we are: solved 1 and 2, working on 3
- The open question: zkTLS for provable web data
- Timeline: Q3 2026 zkTLS prototype, Q4 production
- Call to builders: this is the hardest problem in crypto infrastructure today

**CTA:** Subscribe. Contribute. Build with us.

**Notes from this post (anchor content, reused across month):**

- Note 1: "The Agentic Economy needs three things. Two exist. One doesn't. We're building all three."
- Note 2: "Agents don't know what a chain is. Settlement must be cross-chain by default."
- Note 3: "If your agent holds keys directly, it's not an agent. It's a honeypot."
- Note 4: "zkTLS is the missing piece. Agents need to prove what they read on the web."
- Note 5: "The hardest infrastructure problem in crypto right now isn't scaling. It's agent safety."

---

### Month 1 Wrap (Day 60)

#### Post 9 (Day 59, Wed): "30 Days of Building in Public — What Worked, What Didn't, What's Next"

**SEO title:** Building Kuberna Labs in public: 30-day retrospective
**Reading time:** 8 min
**Type:** Free

**Structure:**

- Metrics: subscribers, stars (33→89), contributors, grant applications
- Best performing posts and Notes (what resonated)
- What didn't work (long threads, generic advice)
- Key insight: people want "how to deploy" not "why we built it"
- Month 2 preview: Solana integration, NEAR Intents, zkTLS research, Discord launch
- Open ask: hiring a second engineer

---

## Notes Strategy (Daily)

Notes are Substack's growth engine. Post 5x/day, every day, from your long-form content.

### Daily Note Cadence

| Time            | Type                         | Example                                                                                       |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| Morning (8am)   | Hook from latest post        | "The scariest 5 words in agent infrastructure: 'the agent decided it was optimal.'"           |
| Midday (12pm)   | Counter-opinion / hot take   | "Unpopular opinion: your agent framework doesn't need more tools. It needs settlement rails." |
| Afternoon (3pm) | Code snippet or architecture | "The 30-line circuit breaker that keeps our agent alive when OpenAI is down:"                 |
| Evening (6pm)   | Question to audience         | "What's your worst 'the agent did something unexpected' story?"                               |
| Night (9pm)     | Restack or observation       | Restack a Note from someone in your network + add your take                                   |

### Note Writing Rules

1. Every Note is one idea. No threading in Notes.
2. Start with a controversial or specific claim.
3. Link to the relevant post (this drives subscribers).
4. Reply to every comment within 2 hours.
5. Restack 3-5 Notes/day from similar writers.
6. Never post "check out my new post" without adding original insight.

---

## Growth Tactics (First 60 Days)

### Week 1-2: Foundation

- Publish 2 pillar posts
- Post 5 Notes/day
- Set up About page as landing page
- Submit to 10 Substack publications for Recommendations
- Comment on 5 similar publications per day

### Week 3-4: Leverage

- Publish 2 pillar posts
- Continue Notes daily
- Co-author a post with a similar-sized Web3 infra newsletter
- Guest post on a larger publication (reach >5K subscribers)
- Apply to Substack's Explore feature (requires 2+ posts)

### Week 5-6: Accelerate

- Publish 2 pillar posts
- Launch Substack Chat (build community)
- Host one Substack Live (AMA about agent infrastructure)
- Start Threads/X repurposing from Notes
- Apply for Substack Featured newsletter

### Week 7-8: Monetize

- Publish 2 pillar posts
- Launch paid tier:
  - Free: Weekly posts, Notes
  - Paid ($10/mo or $100/yr): Monthly "Build Diary" (deep technical post), access to Substack Chat, early access to new features, quarterly AMA
- Send first paid-only post
- Announce paid tier with a personal story about sustainability

---

## Recommendation Outreach Template

Message to send to 10 similar-sized Substack writers:

> Hi [Name],
>
> I'm a huge fan of [Publication Name]. Your post on [Specific Post] was particularly insightful — especially the part about [Specific Detail].
>
> I recently launched Execution Rails, a newsletter about building open-source infrastructure for AI agents that transact across blockchains. I think our audiences overlap heavily — both of us are writing about the intersection of Web3 and infrastructure.
>
> Would you be open to swapping recommendations? I'd love to feature your publication to my readers.
>
> Best,
> [Your name]

---

## SEO Meta Descriptions for Pillar Posts

| Post                | Meta Description (under 160 chars)                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| The 3 AM Problem    | Why AI agents shouldn't hold wallet keys directly. How intent-based execution with on-chain escrow fixes the 3 AM problem. |
| Math.sin() Oracle   | We used Math.sin() as a price oracle in production. Here's the real Pyth Hermes migration and the lesson about fake data.  |
| Circuit Breaker     | How we built a sliding-window circuit breaker that prevents AI agents from burning money on dead API endpoints.            |
| GPT-4 Intent Parser | Why GPT-4 hallucinates chain names in intent parsing, and the 4-layer fallback system that eliminated errors.              |
| First User          | What happened when a developer deployed an agent using our open-source SDK without telling us.                             |
| Frameworks vs Rails | Agent frameworks give agents tools. Execution rails let them settle trades. You need both.                                 |
| NEAR Intents        | How Kuberna aligns with NEAR's 2026 roadmap for TEE-secured execution and intent-based settlement.                         |
| Agentic Economy     | Three infrastructure requirements for AI agents as first-class economic actors. What exists and what doesn't.              |
| 30-Day Retro        | One month of building Kuberna Labs in public. Metrics, lessons, and what's next.                                           |

---

## Post Formatting Rules

1. **Hook in first 3 lines** — no warmup, no "I've been thinking about..."
2. **Code blocks** — every technical post has at least one real code snippet
3. **Bold key numbers** — "3 AM," "$10K," "175 tests" — scannable
4. **One idea per paragraph** — short paragraphs for mobile reading
5. **Section headers** — every 200-300 words for skimmability
6. **Links to repo** — every post links to specific files, not just the homepage
7. **No AI-generated content** — personal voice is the ranking signal
8. **Title-first** — write the title before the post body
9. **SEO title under 60 chars** — separate from the display title
10. **Include a "why this matters" paragraph** — connect technical detail to the bigger thesis

---

## Paid Tier Design

| Tier | Price            | What they get                                                                                                                      |
| ---- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Free | $0               | Weekly pillar post, all Notes, 1 AMA/year                                                                                          |
| Paid | $10/mo ($100/yr) | Monthly "Build Diary" (full architecture deep-dive with unpublished code), Substack Chat access, early SDK previews, quarterly AMA |

The paid tier is not "paywalled posts." It's a **product bundle**:

- Monthly build diary (detailed engineering decisions, metrics, mistakes)
- Substack Chat (community of agent builders)
- Early access to new SDK features before public release
- Quarterly video AMA where I walk through the codebase

This converts because it's not about withholding content. It's about offering a different kind of access.
