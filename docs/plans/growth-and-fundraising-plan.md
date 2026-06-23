# Growth & Fundraising Plan — Kuberna Labs

**Date:** June 2026 | **GitHub Stars:** 42 | **Stage:** Pre-seed, Bootstrapped

---

## Plan A: User Acquisition & Attention

### 5 Developer Communities & Engagement Posts

#### 1. r/ethdev (Reddit — 230k+ Ethereum devs)

**Post title:** We gave AI agents Ethereum wallets and watched them trade across 3 chains — here's what broke

**Body:**

> It's 3 AM and your agent just drained itself on a bridge you've never heard of.
>
> We spent 6 months building Kuberna Labs — an open-source SDK that lets AI agents autonomously execute cross-chain transactions. The idea was simple: parse "swap 1 ETH for USDC on Solana" as a natural language intent, then let the agent figure out the rest.
>
> What we actually had to solve:
>
> - Intent parsing that doesn't hallucinate chains (compromise + LLM + in-memory RAG)
> - On-chain escrow so agents can't rug themselves (non-reentrant, dispute-enabled)
> - TEE attestation so you can prove what the agent did
> - A circuit breaker because OpenAI does go down
>
> The whole thing is MIT open-source: https://github.com/kawacukennedy/kuberna-labs
>
> Happy to answer questions about the TEE integration or why we chose intents over direct execution. Would love PRs from anyone who's fought with cross-chain settlement and won.

---

#### 2. r/AI_Agents (Reddit — 309k members)

**Post title:** 42 days of shipping: an open-source SDK that gives AI agents cross-chain execution rails

**Body:**

> Most "AI agent frameworks" stop at "agent can call an API." We wanted agents that can hold assets, sign transactions, and settle across chains.
>
> Kuberna Labs is an open-source SDK (MIT) where:
>
> - You say "swap 1 ETH for USDC on Solana"
> - The agent parses the intent, finds the route, posts it as an on-chain intent
> - Executors bid on it, escrow holds funds, the job gets done
> - Every decision is traced and optionally TEE-certified
>
> We're at 42 GitHub stars and actively looking for feedback from anyone building in the agent x crypto space. The hardest part was making the intent parser work without hallucinating — we ended up with compromise + local LLM + RAG memory.
>
> Repo: https://github.com/kawacukennedy/kuberna-labs
>
> What's the most frustrating thing you've hit when trying to give an agent blockchain access?

---

#### 3. Smart Agents Protocol Discord / Swarms Discord

**Post title (Discord):** `#showcase — Kuberna Labs: cross-chain execution rails for AI agents, fully open-source`

**Body:**

> Hey team — we just open-sourced Kuberna Labs, an agent orchestration platform that lets you deploy AI agents that can autonomously trade and execute across Ethereum, Solana, NEAR, and Base.
>
> Key architectural decisions that might be useful to this community:
>
> - **Intent-based execution** (not direct tx signing) — agents post intents to an on-chain marketplace, executors bid, escrow settles
> - **Local-first AI** — the intent parser works with zero API keys using compromise.js + local memory + optional RAG
> - **TEE support** — we integrated Intel SGX enclave provisioning so agent actions can be cryptographically attested
> - **Circuit breaker** — 3-strikes-and-you're-out pattern wrapping OpenAI calls, because agents that can't fail gracefully are dangerous
>
> Would love to hear how others here are handling the "agent decides to do something stupid" problem. We went with on-chain escrow + dispute windows as our safety net.
>
> MIT licensed, 42 stars, pre-seed: https://github.com/kawacukennedy/kuberna-labs

---

#### 4. AI x Web3 School Telegram (1000+ builders)

**Message:**

> Just open-sourced Kuberna Labs — execution rails for AI agents across any chain. Key highlights for anyone building at this intersection:
>
> - **SDK & API**: deploy agents that parse "swap 1 ETH for USDC on Solana" and execute it autonomously
> - **Architecture**: natural language → structured intent → on-chain escrow → TEE certification
> - **Pure open-source**: MIT, 42 stars, monorepo with backend (Express/Prisma), frontend (Next.js), SDK (TypeScript), and Solidity contracts
>
> The hardest technical challenge was making the intent parser reliable without an LLM API key — we used compromise.js + pattern matching + optional RAG memory as a fallback chain. Happy to discuss the tradeoffs.
>
> Repo: https://github.com/kawacukennedy/kuberna-labs
>
> If anyone here has built cross-chain agents, I'd love to compare notes on the settlement layer.

---

#### 5. Farcaster / Warpcast (Ethereum builder community)

**Cast:**

> At 3 AM, your AI agent just bridged to a chain you've never heard of and you have no idea why.
>
> Kuberna Labs is an open-source SDK (MIT) that lets you deploy AI agents with:
>
> - Cross-chain execution via on-chain intents
> - TEE-attested decision traces
> - Zero-API-key intent parsing
> - Circuit breakers so agents can't runaway
>
> 42 stars, pre-seed, building in public: https://github.com/kawacukennedy/kuberna-labs
>
> We're specifically looking for feedback from anyone who's tried to give an agent real assets. What's your nightmare scenario?

---

### 30-Day Content Calendar: X (Twitter) & LinkedIn

**Theme pillars:** Technical progress (40%), Community wins & use cases (30%), Thought leadership on Agentic Economy (30%)

| Week              | Mon (X)                                                                                                                 | Tue (X)                                                                                                                                                                       | Wed (LinkedIn)                                                                                                                            | Thu (X)                                                                                                    | Fri (X + LinkedIn)                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **W1: Launch**    | "We open-sourced an SDK that lets AI agents trade across any chain. Here's why intents > direct execution." + repo link | Thread: The 6 things you need before giving an agent wallet access (escrow, circuit breaker, TEE, intent parser, trace, reputation)                                           | Long post: "Why 2026 is the year AI agents stop being chatbots and start being counterparties" — architecture deep-dive                   | Short demo video: agent receives "swap 1 ETH for USDC on Solana", full trace visualization                 | Weekly recap: 42 stars, 1 fork, first 3 PRs. Highlight: "the intent parser works without OpenAI"                              |
| **W2: Technical** | "We replaced Math.sin() with a real price oracle. This is what productionizing agent infrastructure looks like."        | Thread: How our circuit breaker saved an agent from itself (3 OpenAI failures in 5min → graceful fallback → no lost funds)                                                    | "The TEE gap in agent infrastructure — why every agent needs attestable execution"                                                        | Code snippet: the intent parser regex chain vs LLM fallback decision tree                                  | Community spotlight: someone built a trading bot using our SDK. Their feedback.                                               |
| **W3: Use Cases** | "Use case: automated yield farmer that rebalances across Aave, Compound, and Marinade based on real-time APY"           | Thread: "Stop building chatbots. Build agents that hold assets." — 5 real agent templates we ship (arb bot, yield farmer, stop-loss, governance monitor, cross-chain swapper) | "From 33 to 60 stars: what we learned about open-source growth for Web3 infrastructure" (growth tactics that worked)                      | User story: a dev deployed an agent in 10 minutes. Show the code path.                                     | "The 3 AM problem" — why intents are safer than direct agent wallets (on-chain escrow, dispute windows, executor competition) |
| **W4: Vision**    | "NEAR Intents + Kuberna = unified liquidity across every chain. This is what chain abstraction actually looks like."    | Thread: "Agentic Commerce is coming. Here's the infrastructure stack you need." (parsing → decision → execution → settlement → certification → reputation)                    | "We applied for [NEAR Grant / Solana AI Grant]. Here's our mini-application and why we think open-source agent tooling is a public good." | "175 tests, 15 suites, all green. We don't talk enough about how boring infrastructure makes agents safe." | Monthly recap: stars grown, PRs merged, grant applications submitted, what's next (zkTLS integration, more chains)            |

---

## Plan B: Grant & Fundraising Hunt

### Active Grant Programs (Deep Search Results)

#### 1. NEAR Foundation Grants — AI & Infrastructure Track

- **Amount:** $10K–$100K (standard $10K–$50K, strategic $50K–$100K+)
- **Deadline:** Rolling
- **Focus:** AI, DeFi, infrastructure, consumer apps on NEAR
- **Alignment:** NEAR's 2026 IC roadmap specifically calls out "TEE-secured price oracles," "multi-chain verifiable execution via TEEs," and "NEAR Intents as unified liquidity layer" — all areas Kuberna directly builds
- **Application:** near.foundation → grants
- **Bonus:** NEAR Infrastructure Committee also funds open RFPs — Kuberna's TEE-secured execution aligns with their 2026 privacy/infra priorities

#### 2. Solana Foundation — AI Integration Grant ($1M Fund)

- **Amount:** $5K–$25K per project
- **Deadline:** Rolling (via solana.org/grants — select "AI" category)
- **Focus:** Open-source tools bridging high-speed ledger technology with AI
- **Alignment:** Kuberna's SDK-style agent execution tooling is exactly the "developer tooling" category Solana funds. The $5K–$25K range is ideal for pre-seed tooling projects.
- **Also consider:** Solana Foundation's convertible grants ($40K avg check for public goods)

#### 3. Stellar Community Fund (SCF v7) — Build Award

- **Amount:** Up to $150K in XLM (milestone-based, 4 tranches)
- **Deadline:** Rolling interest indication → invited to submit
- **Focus:** Open-source projects building on Stellar and Soroban
- **Alignment:** Kuberna's cross-chain intent layer could integrate Soroban smart contracts, enabling Stellar-based agents to participate in the multi-chain intent marketplace
- **Note:** Requires a plan to open-source smart contracts; Kuberna is already MIT licensed

#### 4. Chainlink Community Grant Program

- **Amount:** Varies by track (community, integration, research)
- **Deadline:** Rolling
- **Focus:** Developer tooling, oracle infrastructure, smart contract economy
- **Alignment:** Kuberna already uses a price feed (Pyth Hermes); integrating Chainlink Data Feeds as an oracle source would qualify for an Integration Grant
- **Also consider:** Chainlink BUILD program for early-stage teams (ongoing support vs one-time grant)

#### 5. Ethereum Foundation ESP — Existing DevTool Track

- **Amount:** Varies (previous rounds ~$250K across 10+ projects)
- **Deadline:** Rolling Wishlist + RFPs
- **Focus:** Maintaining and improving existing Ethereum developer tooling
- **Alignment:** Kuberna's SDK and agent infrastructure is developer tooling for the Ethereum ecosystem; the "Glamsterdam Grants Round" specifically funds tooling that helps the ecosystem adapt to protocol upgrades

---

### Top 3 Mini-Application Drafts

#### Grant #1: NEAR Foundation — "TEE-Secured Agent Execution for NEAR Intents"

> Kuberna Labs is an open-source, MIT-licensed SDK that enables AI agents to autonomously execute cross-chain transactions via on-chain intents, TEE-attested execution, and zkTLS-based verification. We are seeking a $50,000 NEAR Foundation Grant to integrate NEAR Intents as a first-class settlement layer. In 2026, the NEAR Infrastructure Committee has prioritized multi-chain verifiable execution via TEEs, privacy-preserving agent infrastructure, and scaling NEAR Intents as a unified liquidity layer — all of which Kuberna directly addresses. Our SDK already parses natural language intents, routes them through an agent decision engine, and settles via on-chain escrow with TEE attestation. With this grant, we would: (1) add native NEAR Intents support to our SDK so agents can post intents directly to the NEAR ecosystem, (2) integrate NEAR's Fast Auth for agent wallet creation, and (3) publish a reference implementation of a TEE-secured cross-chain agent using NEAR as the settlement backbone. The project is open-source (42 GitHub stars, MIT), pre-seed, and bootstrapped. This grant directly aligns with NEAR's 2026 vision of agentic commerce where users operate with intent.

#### Grant #2: Solana Foundation AI Integration Grant — "Open-Source Agent Tooling for Solana's High-Speed Ledger"

> Kuberna Labs is an open-source SDK (MIT, 42 stars) that gives AI agents autonomous cross-chain execution rails. We request $25,000 from the Solana Foundation's AI Integration Grant fund to build first-class Solana support into our agent runtime. Solana's high-speed, low-cost architecture is the ideal settlement layer for AI agents that need to execute hundreds of micro-transactions per minute — a workload that chokes on other chains. Currently, our SDK supports EVM chains and NEAR; this grant would fund adding Solana Program Library (SPL) token support, Solana Pay integration for agent-initiated payments, and a reference arbitrage agent that demonstrates Solana's throughput advantage. All code will be open-source under MIT, contributing to Solana's AI tooling ecosystem. The Solana Foundation's stated goal for this fund is "solving AI's massive data and transaction requirements by routing computational load onto a ledger designed for web-scale throughput" — Kuberna is precisely this: a developer tool that routes agent transactions onto high-speed chains. Our project is live, tested (175 passing tests), and already gaining community traction.

#### Grant #3: Ethereum Foundation ESP — "Cross-Chain Agent Execution as Ethereum Developer Infrastructure"

> Kuberna Labs is requesting support from the Ethereum Foundation Ecosystem Support Program to maintain and extend our open-source SDK as critical infrastructure for Ethereum developers deploying autonomous AI agents. The SDK provides Ethereum developers with a production-grade agent runtime that includes: (1) natural language intent parsing that compiles to structured on-chain intents, (2) an agent decision engine with arbitrage, yield, and stop-loss strategies that interact with Ethereum L1 and L2s, (3) on-chain escrow using Solidity contracts with non-reentrant dispute resolution, and (4) full decision tracing for auditability. As Ethereum's Glamsterdam upgrade approaches, our SDK needs to maintain compatibility with new EVM opcodes, gas repricing, and enshrined PBS — without this maintenance, developers building on our tooling face breaking changes. ESP's "Existing DevTool" track was designed for exactly this scenario: sustaining and improving tooling that the Ethereum developer ecosystem depends on. Our project is MIT-licensed, has 42 GitHub stars, 175 passing tests, and is already deployed on Ethereum testnets (Sepolia, Base Sepolia). We are pre-seed and bootstrapped; ESP support would ensure our tooling remains compatible with Ethereum's evolving protocol.

---

### 5 Early-Stage Venture Funds (AI x Web3 / Developer Tooling Thesis)

| Fund                                   | Thesis                                                                                                                                                                   | Check Size  | Stage           | Warm Intro Strategy                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frachtis** (frachtis.com)            | "AI agents will use crypto rails" — believes autonomous programs will trade, govern, and execute strategies on-chain. Crypto-native pre-seed fund from Chorus One alums. | $250K–$500K | Pre-seed / Seed | **Via portfolio:** Lys Labs (AI agent intelligence layer) — reach out to Frachtis partner with a note: "We're building the execution layer your portfolio company Lys Labs' agents would settle on. Happy to do a joint demo."                                                                        |
| **Canonical** (canonical.cc)           | "Infrastructure of a post-AGI world" — open infrastructure, agentic protocols, programmable money rails. Backs deeply technical founders at day zero.                    | $500K–$1.5M | Pre-seed / Seed | **Via network:** Partner Anand Iyer (ex-Lightspeed, Pear). Best approach: have a mutual connection from EF or NEAR ecosystem intro with a 1-paragraph summary: "Open-source agent execution rails, MIT, cross-chain, TEE-attested, 42 stars bootstrapped."                                            |
| **Zero Prime Ventures** (zeroprime.vc) | "Day zero engineer-founders" building AI infrastructure, platforms, and applications. Portfolio includes Modal, Dagster, MotherDuck — strong developer tools DNA.        | $250K–$1M   | Pre-seed / Seed | **Via portfolio:** Modal (serverless AI infra) — approach: "Kuberna agents need serverless inference. We'd love to integrate Modal as a compute partner. Also raising — can you intro us to Pete?"                                                                                                    |
| **mshrmm** (mshrmm.com)                | "Onchain, AI × Crypto & Payments" — network-native teams where crypto and AI compound. APAC distribution advantage. Writes first checks.                                 | $100K–$500K | Pre-seed        | **Direct approach:** Their site says "Tell us what you need." Send a concise note: "Open-source SDK for AI agents to execute cross-chain. 42 stars, MIT, bootstrapped. Need $250K for Solana integration + hiring. We settle on NEAR Intents — your APAC network could help us reach NEAR ecosystem." |
| **Darkmode Ventures** (darkmode.vc)    | "AI developer platforms and enterprise software" — pre-seed/seed, first-check investors. Founders-turned-investors who write $150K–$250K.                                | $150K–$250K | Pre-seed        | **Via portfolio:** Check their portfolio for companies building complementary AI dev tools. Approach: "We're building the most boring, reliable infrastructure layer for AI agents that touch money. You invest in AI dev platforms — our SDK is exactly that, but for Web3."                         |

---

### Warm Intro Strategy Summary

| Target     | Best Warm Path                            | Key Message                                                                            |
| ---------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| Frachtis   | Via Lys Labs portfolio connection         | "Your agents need settlement rails. We're the open-source layer for that."             |
| Canonical  | Mutual connection (NEAR/EF ecosystem)     | "Day-zero infrastructure for agentic commerce. TEEs + intents + cross-chain."          |
| Zero Prime | Via Modal/Hex portfolio intro             | "Developer tools for agents. 42 stars, bootstrapped, MIT. Serverless compute partner." |
| mshrmm     | Direct outreach (they accept cold intros) | "Open-source, AI × crypto, NEAR-aligned. APAC distribution + capital."                 |
| Darkmode   | Via portfolio AI dev tool company         | "First check for the agent execution layer. Dev tool for Web3 AI."                     |

---

### Summary Roadmap

```
Month 1-2:  ── Post in all 5 communities ── Apply NEAR Grant ── Apply Solana AI Grant
               │                              │                    │
               └── 30-day content calendar ─── ┘                    │
                                                                     │
Month 3-4:  ── Warm intros to 5 VCs ── Apply EF ESP ── Apply Chainlink Grant
               │                         │                 │
               └── Publish demo videos ──┘                 └── Integrate CL data feeds

Month 5-6:  ─── Follow up grants ── SCF v7 application ── Raise pre-seed round
```
