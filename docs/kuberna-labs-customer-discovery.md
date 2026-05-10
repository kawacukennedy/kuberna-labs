# Kuberna Labs — Customer Discovery Research Report

## Compiled: May 2026

| Priority | Count |
|----------|-------|
| Critical | 18 |
| High | 22 |
| Medium | 15 |
| **Total** | **55** |

---

# CRITICAL PRIORITY (18 contacts)

---

## 1. Shaw Walters — Creator, ElizaOS
- **Role:** Founder, Eliza Labs
- **Org:** ElizaOS (ai16z)
- **X/Twitter:** @shawmakesmagic
- **GitHub:** github.com/lalalune
- **Email:** inquiries@elizalabs.ai (via ElizaOS org)
- **LinkedIn:** Linked to Eliza Labs (SF-based)
- **Why:** Created ElizaOS (17K+ GitHub stars), the leading Web3-native AI agent framework. His framework underpins most on-chain agents today. If Kuzerna Labs becomes the execution layer for Eliza agents, Shaw is the key gatekeeper.
- **Interview Questions:**
  1. What are the biggest pain points ElizaOS developers report when trying to make their agents actually execute on-chain transactions (vs. just chatting)?
  2. How do you think about the trust gap between an agent's LLM reasoning layer and its ability to sign/execute financial transactions?
  3. What would need to be true for you to recommend or embed an execution layer like Kuzerna Labs into the ElizaOS default plugin set?

---

## 2. Peter Steinberger — Creator, OpenClaw (now at OpenAI)
- **Role:** Creator of OpenClaw; now AI Agent Lead @ OpenAI
- **Org:** OpenAI / OpenClaw Foundation
- **X/Twitter:** @steipete
- **GitHub:** github.com/steipete
- **Email:** N/A (via OpenClaw community)
- **LinkedIn:** Peter Steinberger (Austria)
- **Why:** OpenClaw is the fastest-growing open-source AI agent framework in history (250K+ GitHub stars). It is designed for local-first, autonomous execution. Steinberger's architecture decisions (SOUL.md, skill system, gateway pattern) define how agents interact with external systems. He's now at OpenAI shaping their agent strategy.
- **Interview Questions:**
  1. OpenClaw's architecture separates the gateway from execution — what specific friction did you encounter trying to give agents reliable on-chain financial execution capabilities?
  2. How do you think about the tradeoff between agent autonomy (signing transactions) vs. security boundaries in the OpenClaw skill system?
  3. What would an ideal "agent execution layer" look like to you — one that you'd consider building into OpenClaw core vs. leaving to plugins?

---

## 3. Jesse Pollak — Creator of Base
- **Role:** Head of Base & Coinbase Wallet, Coinbase Exec Team
- **Org:** Coinbase
- **X/Twitter:** @jessepollak
- **LinkedIn:** linkedin.com/in/jessepollak
- **Email:** N/A (public)
- **Why:** Coinbase is going "AI Native by 2028." Pollak has publicly stated AI agents are the next wave for crypto payments. Base is the L2 with the most aggressive AI-agent recruitment. He controls Coinbase Wallet direction — the default wallet for millions of users.
- **Interview Questions:**
  1. You've said AI agents are the next big wave for crypto — what specific infrastructure gaps do you see in how agents discover, pay for, and settle on-chain execution today?
  2. Base is actively recruiting agentic projects — what patterns do you see in the most promising agent teams, and what common failure modes cause them to stall?
  3. How should an execution layer design for Coinbase Wallet integration — what would make you want to embed it as a default agent capability?

---

## 4. Mark Toda — Co-Author, ERC-7683
- **Role:** Engineer @ Uniswap Labs
- **Org:** Uniswap Labs
- **X/Twitter:** @mark_toda
- **GitHub:** github.com/marktoda
- **LinkedIn:** Mark Toda (Uniswap Labs)
- **Why:** Co-authored ERC-7683 (with Matt Rice/Nick Pai), the cross-chain intents standard. He literally wrote the spec that defines how intent-based settlement works. If Kuzerna Labs wants to be ERC-7683 compatible, he's the person who understands the design rationale and edge cases.
- **Interview Questions:**
  1. What design tradeoffs did you make in ERC-7683 that you now regret or see as limiting for agentic use cases?
  2. How do you think about solver networks evolving to serve AI agents vs. human users — do agents need different settlement guarantees?
  3. What's the biggest gap in the ERC-7683 ecosystem today that an execution-layer protocol should solve?

---

## 5. Madhavan (Maddy) Malolan — Co-Founder & CEO, Reclaim Protocol
- **Role:** Co-Founder & CEO
- **Org:** Reclaim Protocol (YC W21)
- **X/Twitter:** @madhavanmalolan
- **GitHub:** github.com/madhavanmalolan
- **Email:** madhavan@reclaimprotocol.org
- **LinkedIn:** linkedin.com/in/madhavanmalolan
- **Why:** He invented zkTLS — a core primitive for verifiable web data. His team is actively working at the intersection of zkTLS + AI agents. He deeply understands the trust problem: "how does an agent verify the data it receives before executing?"
- **Interview Questions:**
  1. You've said zkTLS lets AI agents autonomously verify user data — what's the hardest technical problem you're still solving around agentic verification?
  2. How do you see zkTLS and TEEs complementing vs. competing as trust mechanisms for agent execution?
  3. What's the most surprising use case developers have built with zkTLS that changed how you think about the primitive?

---

## 6. Kevin Wang — Lead Developer, dstack (Phala TEE SDK)
- **Role:** Core Developer, dstack @ Phala Network
- **Org:** Phala Network
- **GitHub:** github.com/kvinwang (Phala-Network/dstack)
- **X/Twitter:** @kvinwang (Phala contributor)
- **LinkedIn:** Via Phala team
- **Why:** Built dstack — the SDK that lets any Docker app deploy into TEE. He's the person who knows exactly what TEEs can and cannot do for agent execution. His work directly enables agents to run in attested environments.
- **Interview Questions:**
  1. What are the real-world limitations of Intel TDX/SGX for running AI agent workloads — what frustrates you daily?
  2. How do you think about the latency/trust tradeoff — what's the fastest attestation cycle you can realistically achieve for an agent needing to sign a transaction?
  3. If you were building an agent execution layer on top of dstack, what would you design differently from what exists today?

---

## 7. Siddhartha Dutta — Co-Founder & CEO, Marlin Protocol
- **Role:** CEO & Co-Founder
- **Org:** Marlin Protocol
- **X/Twitter:** @siddharthadutta
- **GitHub:** github.com/marlinprotocol (org)
- **Email:** info@marlin.org
- **LinkedIn:** linkedin.com/in/duttasiddhartha
- **Why:** Marlin's Oyster provides TEE-based coprocessors for off-chain compute. They're explicitly building for AI + DeFi agents. Marlin is backed by Binance Labs and Electric Capital. He knows the TEE coprocessor landscape better than almost anyone.
- **Interview Questions:**
  1. Your team built a DeFi AI agent reference implementation on Oyster — what were the biggest integration headaches you encountered?
  2. How do you see the TEE coprocessor market evolving for agent workloads vs. traditional smart contract coprocessing?
  3. What's the most important capability Oyster is missing today for supporting production agent economies?

---

## 8. Greg Osuri — CEO & Founder, Akash Network
- **Role:** CEO, Overclock Labs (creators of Akash)
- **Org:** Overclock Labs / Akash Network
- **X/Twitter:** @gregosuri
- **GitHub:** github.com/gosuri
- **Email:** Via overclocklabs.com
- **LinkedIn:** linkedin.com/in/gregosuri
- **Why:** Akash is the leading decentralized compute marketplace. As AI agents need cost-effective, censorship-resistant compute, Akash is a natural substrate. He's also a prolific founder (AngelHack, Firebase alum).
- **Interview Questions:**
  1. What do you see as the key infrastructure bottleneck preventing AI agents from deploying and paying for compute autonomously on Akash?
  2. How should an agent execution layer integrate with Akash — as a provider, a tenant, or a middleware layer?
  3. What feedback have you heard from AI/ML developers about the friction of deploying agents on decentralized compute?

---

## 9. Illia Polosukhin — Co-Founder, NEAR Protocol & NEAR AI
- **Role:** Co-Founder & CEO of NEAR Foundation; Co-Author of "Attention Is All You Need"
- **Org:** NEAR Foundation / NEAR AI
- **X/Twitter:** @ilblackdragon
- **GitHub:** github.com/ilblackdragon
- **Email:** Via NEAR Foundation
- **LinkedIn:** Illia Polosukhin (NEAR)
- **Why:** He co-authored the Transformer paper. He's now building NEAR AI — "User-Owned AGI." He launched the $20M AI Agent Fund and the NEAR AI Agent Market. His vision directly overlaps with Kuzerna Labs' mission.
- **Interview Questions:**
  1. NEAR AI's vision is user-owned AGI — how does the execution layer for agents fit into that vision, and what gaps do you see in existing infrastructure?
  2. You launched the Agent Market powered by NEAR Intents — what have you learned about what agents actually need to transact vs. what you assumed they'd need?
  3. What would you want an execution-layer protocol to prove before you'd recommend it to NEAR ecosystem builders?

---

## 10. Adeniyi Abiodun — Co-Founder & CPO, Mysten Labs (Sui)
- **Role:** Co-Founder & CPO
- **Org:** Mysten Labs (Sui, Walrus)
- **X/Twitter:** @AdeniyiSui
- **LinkedIn:** Adeniyi Abiodun (Mysten Labs)
- **Why:** He's architecting Sui's entire agentic execution strategy. Sui's object model is designed from the ground up for agent execution (PTBs, object ownership, zkLogin). He wrote "The Sui Developer Stack: Powering the Agentic Web."
- **Interview Questions:**
  1. Sui's object model treats agents as first-class participants — what unique infrastructure needs have you identified that generic blockchains can't serve?
  2. How do you think about the relationship between Sui-native execution (PTBs) and off-chain execution layers like what Kuzerna Labs is building?
  3. What are the most common failure modes you see in agent projects building on Sui, and how much of that is infrastructure vs. product-market fit?

---

## 11. Anatoly Yakovenko — Co-Founder, Solana Labs
- **Role:** Co-Founder
- **Org:** Solana Labs
- **X/Twitter:** @aeyakovenko
- **GitHub:** github.com/anatoly
- **Why:** Solana is seeing an explosion of agent activity. Yakovenko personally backed the OpenClaw incubator and has signaled AI is a top priority for Solana. His perspective on agent execution at Solana's speed is invaluable.
- **Interview Questions:**
  1. Solana's sub-cent fees make agent micropayments viable — what new categories of agent behavior does this unlock that aren't possible on other chains?
  2. What's your thesis on where the agent execution bottleneck is — on-chain compute, off-chain coordination, or the trust layer between them?
  3. How should Solana think about competing with Base and NEAR for the agent ecosystem?

---

## 12. George Zeng — CPO, NEAR Protocol & GM, NEAR AI
- **Role:** Chief Product Officer, NEAR Protocol / GM, NEAR AI
- **Org:** NEAR Foundation
- **X/Twitter:** @georgezeng
- **LinkedIn:** George Zeng (NEAR)
- **Why:** Leads NEAR's entire AI product strategy. Launched IronClaw (agent runtime), NEAR AI Cloud, and Private Chat. Former COO of dYdX. He deeply understands both DeFi infrastructure and AI agent needs.
- **Interview Questions:**
  1. IronClaw provides a verifiable runtime for agents — what specific limitations of existing TEE/infrastructure led you to build it from scratch?
  2. What's the hardest product decision you've faced in balancing agent autonomy with user safety guarantees?
  3. How do you see the execution layer market evolving — will every L1 have its own agent runtime, or will there be chain-agnostic standards?

---

## 13. Matt Rice — Co-Author, ERC-7683; Co-Founder, Across Protocol
- **Role:** Co-Founder
- **Org:** Across Protocol
- **X/Twitter:** @maerice
- **LinkedIn:** Matt Rice (Across)
- **Why:** Co-authored ERC-7683 with Mark Toda. Across has processed billions in cross-chain intent volume. He designed the settlement system that ERC-7683 standardizes.
- **Interview Questions:**
  1. Across has settled billions in intents — what patterns in filler/solver behavior surprised you when AI agents started participating?
  2. How would you redesign ERC-7683 if you knew agents would be the primary users instead of humans?
  3. What's the most important metric for an execution layer's health that most people ignore?

---

## 14. Anil Murty — Head of Product, Overclock Labs (Akash)
- **Role:** Head of Product / VP Product & Engineering
- **Org:** Overclock Labs (Akash Network)
- **X/Twitter:** @anilmurty
- **GitHub:** @anilcse
- **LinkedIn:** Anil Murty (Overclock Labs)
- **Why:** He drives Akash's product direction — Console 2.0, provider experience, developer UX. He's been focused on reducing friction for non-crypto users deploying on decentralized compute. He knows exactly what developers struggle with.
- **Interview Questions:**
  1. Your Console 2.0 work focused on eliminating crypto friction for deployment — what similar friction exists for AI agents needing to deploy and pay for compute?
  2. What's the most common deployment failure mode you see, and how much of it is infrastructure vs. UX?
  3. How should an execution layer integrate with Akash to make agent deployment as easy as "push to deploy"?

---

## 15. Cameron Dennis — Director of AI, NEAR Foundation
- **Role:** Director of AI
- **Org:** NEAR Foundation
- **X/Twitter:** @camdennis
- **LinkedIn:** Cameron Dennis (NEAR)
- **Why:** He's building NEAR's AI strategy from the ground up — launched NEAR AI Cloud, Private Chat, and leads partnerships with Phala and other TEE providers. He manages the intersection of AI products and infrastructure.
- **Interview Questions:**
  1. You've been hands-on in building NEAR's AI products — what infrastructure gaps did you encounter that made you think "someone should build an execution layer for this"?
  2. How do you evaluate TEE providers (Phala, Marlin, etc.) for agent workloads — what are your criteria?
  3. What would make Kuzerna Labs a partner vs. a competitor in your view?

---

## 16. Roshan Raghupathy — Co-Founder & Lead, Marlin Protocol
- **Role:** Co-Founder / Core Engineer
- **Org:** Marlin Protocol
- **GitHub:** github.com/roshanrags
- **X/Twitter:** @roshanrags
- **Email:** info@marlin.org
- **Why:** Lead engineer behind Marlin's Oyster platform. Built the TEE coprocessor infrastructure from the ground up. He understands the low-level TEE attestation, key management, and sandboxing challenges.
- **Interview Questions:**
  1. What's the most painful technical limitation of TEEs that you haven't been able to solve yet, and how does it affect agent workloads?
  2. How do you handle the key management problem for agents — where does the agent's private key live, and who controls signing?
  3. What's your vision for how TEE-based execution layers will evolve over the next 2 years?

---

## 17. Joseph Beverley — Founder Success Manager (AI x Web3), NEAR Foundation
- **Role:** Founder Success Manager, AI x Web3
- **Org:** NEAR Foundation
- **LinkedIn:** linkedin.com/in/joseph-beverley-0558a0bb
- **X/Twitter:** @josephbeverley
- **Why:** Former SingularityNET strategic lead. Now directly responsible for supporting AI x Web3 founders in the NEAR ecosystem. He knows the pain points of every AI agent startup building on NEAR.
- **Interview Questions:**
  1. What are the top 3 recurring infrastructure complaints you hear from AI x Web3 founders in your portfolio?
  2. When a promising AI agent startup fails, what's usually the reason — and is it ever an execution-layer problem?
  3. What would you need to see from an execution layer protocol before you'd actively recommend it to your founders?

---

## 18. Florian — Founder & Head of Quant, Stratium
- **Role:** Founder & Head of Quant
- **Org:** StratiumSol (Solana copy trading bot)
- **X/Twitter:** @StratiumSol
- **Email:** Via stratiumsol.com
- **Why:** Built a production copy trading bot on Solana with 825ms execution. He understands the gap between "agent makes a decision" and "agent executes the trade." His bot is exactly the kind of high-frequency agent Kuzerna Labs would serve.
- **Interview Questions:**
  1. What's the weakest link in your execution pipeline from signal detection to trade settlement?
  2. How do you think about trust — why should your bot be allowed to sign transactions autonomously, and what guardrails do you need?
  3. If an execution layer could guarantee atomic cross-chain settlement for your trades, what would that be worth to you?

---

# HIGH PRIORITY (22 contacts)

---

## 19. Davis (wtfsayo) — Top ElizaOS Contributor
- **Role:** Core Contributor
- **Org:** ElizaOS
- **GitHub:** github.com/wtfsayo
- **X/Twitter:** @wtfsayo
- **Why:** Second most active contributor to ElizaOS (after Shaw). Builds core infrastructure for the most popular Web3 agent framework. Understands exactly what Eliza agents need for execution.
- **Interview Questions:**
  1. The Eliza plugin system handles blockchain interactions — what's the most common request from plugin developers that's hard to implement?
  2. What's missing in Eliza today for agents that need to execute complex multi-step transactions?

---

## 20. Brian Fox — Co-Founder, Akash Network
- **Role:** Co-Founder (Creator of GNU Bash Shell)
- **Org:** Overclock Labs / Akash Network
- **X/Twitter:** @brianfox
- **Why:** Legendary open-source developer (created Bash). His perspective on decentralized compute infrastructure and open-source agent economics is unique.
- **Interview Questions:**
  1. As someone who created foundational open-source infrastructure, what do you think the "Bash of AI agents" looks like?
  2. What's the biggest misconception about decentralized compute for AI workloads?

---

## 21. Jarrod Barnes — Head of Founder Success, NEAR Foundation
- **Role:** Head of Founder Success
- **Org:** NEAR Foundation
- **LinkedIn:** Jarrod Barnes (NEAR)
- **Email:** Via NEAR Foundation
- **Why:** Runs the NEAR AI Incubation program. Directly works with founders building AI x Web3. Controls ecosystem grants and support allocation.
- **Interview Questions:**
  1. What criteria do you use to evaluate AI agent startups for the incubation program?
  2. What infrastructure gap do you see most frequently across your portfolio companies?

---

## 22. Shai Perednik — Principal Ecosystem Architect, NEAR Foundation
- **Role:** Principal Ecosystem Architect
- **Org:** NEAR Foundation
- **X/Twitter:** @shaiss
- **GitHub:** github.com/shaiss
- **LinkedIn:** Shai Perednik (NEAR)
- **Why:** Builds NEAR Intents workshops and developer education. Former Head of Enablement at Polygon. Deeply technical on cross-chain transaction patterns.
- **Interview Questions:**
  1. What have you learned from running NEAR Intents workshops about what developers struggle with most in cross-chain execution?
  2. How should an execution layer abstract chain differences while still giving developers control?

---

## 23. Ayush Ranjan — Software Engineer / DevRel, Marlin Protocol
- **Role:** Software Engineer - Developer Relations
- **Org:** Marlin Protocol
- **LinkedIn:** Ayush Ranjan (Marlin)
- **GitHub:** github.com/ayush-ranjan-official
- **Why:** Built the DeFi AI Agent reference implementation on Marlin's Oyster TEE. 7x global hackathon winner. He's actually hands-on building agents on TEEs.
- **Interview Questions:**
  1. When you built the DeFi AI agent on Oyster, what was the hardest part about getting the agent to actually execute trades from inside the TEE?
  2. What documentation or tooling do you wish existed when you were building?

---

## 24. Abdul Rashid Reshamwala — Engineering Lead, Reclaim Protocol
- **Role:** Engineering Lead
- **Org:** Reclaim Protocol
- **LinkedIn:** Abdul Rashid Reshamwala (Reclaim)
- **GitHub:** github.com/AbdulRashidReshamwala
- **Why:** Leads engineering for Reclaim's zkTLS implementation. He knows the low-level protocol details, performance bottlenecks, and integration challenges.
- **Interview Questions:**
  1. What are the throughput/latency limits of zkTLS proof generation, and how do they affect real-time agent use cases?
  2. How do you see zkTLS and TEEs being used together vs. separately for agent verification?

---

## 25. Austin Griffith — Builder Growth, Ethereum Foundation
- **Role:** Builder Growth Lead
- **Org:** Ethereum Foundation
- **X/Twitter:** @austingriffith
- **GitHub:** github.com/austintgriffith
- **Why:** He wired up an OpenClaw agent to deploy production smart contracts, moderate NFT marketplaces, and build games — all while sleeping. He's the perfect example of an advanced agent builder who needs execution infrastructure.
- **Interview Questions:**
  1. When your OpenClaw agent was deploying contracts autonomously, what specific execution failures did you encounter and how did you handle them?
  2. What guardrails do you wish existed for agent transaction signing?

---

## 26. Lord of a Few — Founder, Daydreams
- **Role:** Founder
- **Org:** Daydreams
- **X/Twitter:** @lordofafew
- **Why:** Built the Langoustine69 agent that shipped 80+ paid x402 endpoints in one week. He's actually running a profitable micro-agent economy right now.
- **Interview Questions:**
  1. Running 80+ paid endpoints — what's your biggest operational headache in keeping agents earning and executing?
  2. What's the #1 feature you'd want from an execution layer that you don't have today?

---

## 27. Cygaar — Top ElizaOS & Agent Infrastructure Builder
- **Role:** Core Contributor / Developer
- **Org:** ElizaOS / Agent Ecosystem
- **GitHub:** github.com/cygaar
- **X/Twitter:** @cygaar
- **Why:** Major ElizaOS core contributor. Builds agent infrastructure and blockchain integrations.
- **Interview Questions:**
  1. What's the hardest technical challenge in bridging Eliza agents to real on-chain execution?
  2. How should agent identity (ERC-8004) and execution layer interact?

---

## 28. Shakker Nerd (shakkernerd) — Top ElizaOS Contributor
- **Role:** Core Contributor
- **Org:** ElizaOS
- **GitHub:** github.com/shakkernerd
- **Why:** One of the top 5 ElizaOS contributors by commits. Involved in core architecture decisions.
- **Interview Questions:**
  1. What's the most requested feature from Eliza users that relates to execution/transacting?
  2. What do you think an "execution layer" should provide that Eliza plugins can't?

---

## 29. Tina — TEE Community Lead, Flashbots
- **Role:** TEE Community / Ecosystem Lead
- **Org:** Flashbots
- **X/Twitter:** @tina_flashbots
- **Why:** Organized the TEE Hacker House initiative that brought together Phala, Marlin, and other TEE builders. She knows everyone in the TEE-Web3 space and understands the community's pain points.
- **Interview Questions:**
  1. From organizing TEE Hacker Houses, what are the most common technical frustrations builders express about TEE development?
  2. Where do you see the TEE + AI agent intersection going in the next 12 months?

---

## 30. Andrew Miller — Researcher, Flashbots / Teleport
- **Role:** Researcher
- **Org:** Flashbots / Teleport / UIUC
- **X/Twitter:** @socrates1024
- **Why:** His pioneering concept of Docker-based P2P TEE SDK inspired Phala's dstack. Deeply involved in TEE research and agent infrastructure design at Flashbots.
- **Interview Questions:**
  1. Your vision of a P2P TEE SDK inspired dstack — what's the next big leap for TEE infrastructure that nobody's building yet?
  2. How should we think about TEEs vs. ZK for agent execution verification?

---

## 31. Sxy Sun — Teleport Team
- **Role:** Builder
- **Org:** Teleport
- **X/Twitter:** @sxysun
- **Why:** Key contributor to Teleport and TEE infrastructure. Recognized in Phala's dstack acknowledgements.
- **Interview Questions:**
  1. What's the most underappreciated challenge in making TEEs accessible for mainstream agent developers?
  2. How should key management work for agents running inside TEEs?

---

## 32. Prateesh Goyal — Co-Founder, Marlin Protocol
- **Role:** Co-Founder
- **Org:** Marlin Protocol
- **LinkedIn:** Prateesh Goyal (Marlin)
- **Why:** Founding team member focused on research and development. Deep understanding of Marlin's technical architecture.
- **Interview Questions:**
  1. What research problems in verifiable computing are most relevant to AI agent execution?
  2. How do you see Marlin's Oyster evolving to support agent-specific workloads?

---

## 33. Tyler Wright — Program Manager, Akash Network
- **Role:** Ecosystem / Program Manager
- **Org:** Overclock Labs (Akash Network)
- **LinkedIn:** Tyler Wright (Akash)
- **X/Twitter:** @brewsterdrinkwater
- **Why:** Runs SIGs and community coordination for Akash. He has direct line of sight into what builders need and complain about.
- **Interview Questions:**
  1. What feedback do you hear most frequently from developers building on Akash about the deployment/execution experience?
  2. What's the single biggest friction point preventing more AI/agent workloads on Akash?

---

## 34. Niranjan Agaram — Web3 Data Architect / Agent Builder
- **Role:** Independent Web3 Data Architect
- **X/Twitter:** @niranjanagaram
- **Email:** niranjanagaram@gmail.com
- **GitHub:** github.com/NiranjanAgaram
- **Why:** Freelance builder shipping agentic AI + Web3 solutions in 48-hour sprints. Built on LangGraph, CrewAI, and RAG pipelines. He's exactly the kind of power user who'd build on Kuzerna Labs.
- **Interview Questions:**
  1. As someone shipping agent systems rapidly, what execution infrastructure do you consistently have to build from scratch?
  2. What would make you choose Kuzerna Labs over building your own execution layer?

---

## 35. Ibrahim Arshad — LangChain & Blockchain Contributor
- **Role:** AI & Blockchain Developer
- **GitHub:** github.com/ibrahim1023
- **Why:** Contributes to LangChain core while also building on Uniswap and other blockchain protocols. Bridges the AI agent framework and DeFi worlds.
- **Interview Questions:**
  1. What's missing in LangChain's tool integration for blockchain execution?
  2. What would an ideal LangChain-compatible execution layer look like?

---

## 36. Sajjad Haider Sayed — Software Developer, Reclaim Protocol
- **Role:** Software Developer
- **Org:** Reclaim Protocol
- **LinkedIn:** Sajjad Haider Sayed (Reclaim)
- **GitHub:** github.com/sajjad21990
- **Email:** Via LinkedIn
- **Why:** Builds core Reclaim Protocol SDKs and integrations. Hands-on with zkTLS implementation details.
- **Interview Questions:**
  1. What were the hardest parts of building the zkFetch SDK, and how do you see it being used by AI agents?
  2. What integration patterns with agent frameworks have you observed from developers using Reclaim?

---

## 37. Greg Osuri's Team — Artur Troian (VP Core Eng, Akash)
- **Role:** VP of Core Engineering
- **Org:** Overclock Labs (Akash Network)
- **GitHub:** github.com/troian
- **Why:** Leads Akash's core engineering. Built the Akash node, provider, and deployment infrastructure. Knows the low-level execution path for workloads on Akash.
- **Interview Questions:**
  1. What are the hardest scalability problems in matching tenant workloads to provider capacity?
  2. How should an execution layer interact with Akash's marketplace for agent compute?

---

## 38. Leechael — Core Developer, Phala Cloud / dstack
- **Role:** Core Developer
- **Org:** Phala Network
- **GitHub:** github.com/Leechael
- **Why:** Top contributor to Phala Cloud and dstack. Built the Terraform provider, JS SDK, and developer templates.
- **Interview Questions:**
  1. What developer experience lessons have you learned from building Phala Cloud's SDKs?
  2. What's the most requested feature from developers using Phala for agent workloads?

---

## 39. Shelven Zhou — Core Developer, Phala Network
- **Role:** Core Developer
- **Org:** Phala Network
- **GitHub:** github.com/shelvenzhou
- **Why:** Recognized in Phala's dstack acknowledgements. Builds TEE infrastructure and developer tooling.
- **Interview Questions:**
  1. What do you see as the key difference between deploying traditional apps in TEEs vs. deploying AI agents?
  2. What's the biggest architectural challenge in scaling TEE attestation for high-frequency agent execution?

---

## 40. Scott Caruthers — Overclock Labs / Akash Network
- **Role:** Core Team Member
- **Org:** Overclock Labs (Akash Network)
- **X/Twitter:** @ScottCaruthers
- **Why:** Long-time Akash core contributor involved in product direction, community, and ecosystem strategy.
- **Interview Questions:**
  1. What patterns do you see in how the most successful projects on Akash use the network?
  2. What's the most important infrastructure upgrade for supporting AI agent workloads?

---

# MEDIUM PRIORITY (15 contacts)

---

## 41. Adam Bozanich — Co-Founder & CTO, Akash Network
- **Role:** Co-Founder & CTO
- **Org:** Overclock Labs
- **LinkedIn:** Adam Bozanich (Akash)
- **X/Twitter:** @boz
- **Why:** Co-created Akash's decentralized cloud architecture. Holds patent for network protocol fuzzing.
- **Interview Questions:**
  1. What's the most important architectural insight from building a decentralized cloud that applies to agent execution layers?
  2. How should an execution layer be designed to be both trust-minimized and performant?

---

## 42. Jon Roethke — Senior Developer Advocate (Base), Coinbase
- **Role:** Senior Developer Advocate
- **Org:** Coinbase (Base)
- **LinkedIn:** Jon Roethke (Base/Coinbase)
- **Why:** Leads developer relations for Base. Designs LLM-assisted tooling for developers. He's responsible for onboarding agents to Base.
- **Interview Questions:**
  1. What developer pain points do you hear most about from teams building agent applications on Base?
  2. What tooling would make it dramatically easier for AI agents to execute on Base?

---

## 43. Arpan Nanavati — CEO, Beep (Sui Agentic Wallet)
- **Role:** CEO
- **Org:** Beep (Sui Agentic Finance)
- **X/Twitter:** @arpan_nanavati
- **Why:** Building the "Stripe for the agentic economy" on Sui. His platform handles agentic payments, treasury management, and a402 protocol.
- **Interview Questions:**
  1. What's the hardest problem in making agentic payments work at scale?
  2. How do you differentiate between infrastructure you build vs. infrastructure you want to buy?

---

## 44. Abbas Abou Daya — Founder & CEO, Maestro Bots
- **Role:** Founder & CEO
- **Org:** Gearlay Technologies (Maestro Bots)
- **Why:** Built one of the most popular DeFi trading bots on Telegram (100K+ users, multi-chain). He understands high-frequency agent execution for trading.
- **Interview Questions:**
  1. What execution infrastructure challenges do you face supporting 10+ blockchains simultaneously?
  2. How would an execution layer change your bot architecture?

---

## 45. Ethan Carter — Founder & CEO, Deft Trade
- **Role:** Founder & CEO
- **Org:** Deft Trade
- **Why:** Building AI-powered DeFi trading automation. Exactly the kind of protocol that needs cross-chain execution infrastructure.
- **Interview Questions:**
  1. What's the biggest gap in your current trading automation stack?
  2. How do you think about trust in automated execution vs. manual trading?

---

## 46. Stephen Morris — CEO, Pact Swap Labs
- **Role:** CEO
- **Org:** Pact Swap
- **X/Twitter:** @PactSwap
- **Why:** Cross-chain DEX doing $22.8M+ volume. His protocol needs efficient cross-chain settlement infrastructure.
- **Interview Questions:**
  1. What's your biggest operational pain in managing cross-chain liquidity and settlement?
  2. How interested would you be in an execution layer that abstracts chain complexity?

---

## 47. Gehan — Founder, Precog Finance
- **Role:** Founder
- **Org:** Precog Finance
- **X/Twitter:** @PrecogFinance
- **Why:** Building AI-powered DeFi arbitrage automation. Their Sentient product is exactly the kind of agent system Kuzerna Labs would serve.
- **Interview Questions:**
  1. How do you handle the trust gap between your AI models' trading decisions and actual execution?
  2. What's the most limiting factor in your current cross-chain execution capability?

---

## 48. Maxwell Allman — PhD, Stanford / Reclaim Protocol
- **Role:** Researcher / Contributor
- **Org:** Stanford / Reclaim Protocol
- **X/Twitter:** @maxwell_allman
- **Why:** Authored educational content on zkTLS at Stanford. Bridges academic research and practical zkTLS implementation.
- **Interview Questions:**
  1. From a research perspective, what are the most important open problems in zkTLS for agent verification?
  2. How do you see the theoretical guarantees of zkTLS mapping to practical agent execution safety?

---

## 49. Sui Agent Kit (grxkun) — Creator
- **Role:** Developer, sui-agent-kit
- **GitHub:** github.com/grxkun
- **X/Twitter:** @grxkun
- **Why:** Built the open-source middleware framework for agentic economics on Sui (x402 equivalent, ERC-8004 equivalent, agent identity, reputation, task markets — all native to Sui). This is exactly the kind of builder who needs an execution layer.
- **Interview Questions:**
  1. Why did you build sui-agent-kit instead of using existing execution infrastructure?
  2. What are the hardest technical challenges you've faced in making agents first-class economic actors on Sui?

---

## 50. Mario Zechner (mariozechner) — Creator of Pi Agent Framework
- **Role:** Creator, Pi Agent Framework
- **GitHub:** github.com/mariozechner
- **X/Twitter:** @mariozechner
- **Why:** Built the Pi Agent Core library that OpenClaw uses for its runtime. His framework powers the "think and act" cycle for thousands of agents.
- **Interview Questions:**
  1. Your runtime handles the agent loop for OpenClaw — what execution primitives are you missing that you'd want from an infrastructure layer?
  2. How do you think about the separation between agent reasoning and agent execution?

---

## 51. Mintlabs / RaptorX — Claw 5.0 Builder
- **Role:** Builder
- **X/Twitter:** @raptorx
- **Why:** Premiered Claw 5.0 — an AI model built specifically for crypto. Active in the Solana agent ecosystem.
- **Interview Questions:**
  1. What specific execution infrastructure do crypto-native AI models need that general-purpose agents don't?
  2. How should agent execution layers handle model-specific requirements?

---

## 52. Honcho for Agents / Plastic Labs — Xeno Grant Team
- **Role:** Team
- **Org:** Plastic Labs
- **Email:** apply@xenogrant.org
- **X/Twitter:** @plasticslabs
- **Why:** Ran Xeno Grant with Solana Foundation + Betaworks — an accelerator for AI agents. They're actively building agent identity infrastructure and know the agent builder landscape intimately.
- **Interview Questions:**
  1. From evaluating 400+ agent applications for Xeno Grant, what patterns did you see in how agents handle execution?
  2. What was the most common reason agents failed to meet the self-custody/execution criteria?

---

## 53. moltmatch — Agent Dating Platform Builder
- **Role:** Builder
- **X/Twitter:** @moltmatch
- **Why:** Built a dating platform for AI agents — a novel agent-to-agent social coordination experiment. Pushing boundaries of what agents do autonomously.
- **Interview Questions:**
  1. What execution capabilities did your agents need that surprised you?
  2. How do you handle trust and verification in agent-to-agent interactions?

---

## 54. BankrBot — Autonomous Token Deployment Agent
- **Role:** Builder
- **X/Twitter:** @bankrbot
- **Why:** Built an agent that autonomously deploys tokens via Raydium triggered by social media tags. Live on Solana. Exactly the kind of autonomous agent Kuzerna Labs would serve.
- **Interview Questions:**
  1. What failure modes have you encountered with autonomous token deployment?
  2. How do you handle the risk of your agent being exploited via its social media triggers?

---

## 55. Checkr / x402 Micropayments Team
- **Role:** Team
- **Org:** Checkr
- **X/Twitter:** @checkr
- **Why:** Building x402 micropayment infrastructure that enables agents to pay for APIs and services autonomously. Directly relevant to Kuzerna Labs' execution layer.
- **Interview Questions:**
  1. What are the adoption barriers you've seen for agents using x402 payments?
  2. How should an execution layer integrate with x402 to make agent payments seamless?

---

# POTENTIAL PILOT CUSTOMERS (5-10)

*Small DeFi protocols / trading shops that would benefit from testing Kuzerna Labs*

---

## 1. Paragon Protocol
- **What:** DEX on BNB Chain with AI agent (Volts) for DCA, LP rebalancing, auto-compound
- **Why Pilot:** Already using ElizaOS-based AI agents. Has explicit policy-layer architecture. Would benefit from Kuzerna as execution backend.
- **Contact:** @ParagonChain / Discord

## 2. Pact Swap
- **What:** Cross-chain DEX, $22.8M volume, built on Coinweb
- **Why Pilot:** Needs efficient cross-chain settlement. Currently rolling their own. CEO Stephen Morris is vocal about infrastructure needs.
- **Contact:** @PactSwap / stephen@pactswap.io (inferred)

## 3. Quant Flow (web3spreads)
- **What:** AI-powered perpetual futures trading bot for Hyperliquid (LangChain/LangGraph)
- **Why Pilot:** Open-source, active development (5 contributors). Uses LLMs for trading decisions — needs trustworthy execution layer.
- **Contact:** github.com/web3spreads/quant-flow

## 4. Deft Trade
- **What:** AI-powered DeFi trading automation platform
- **Why Pilot:** Mission-built for automated DeFi trading. Would benefit from cross-chain execution infrastructure.
- **Contact:** @defttradeio

## 5. ArbiTrace
- **What:** AI arbitrage bot using Claude + x402 for atomic settlement
- **Why Pilot:** Already using x402. Needs reliable multi-hop execution. Built for Cronos but could expand.
- **Contact:** dorahacks.io/buidl/38436

## 6. Precog Finance (Sentient)
- **What:** AI-backed DeFi arbitrage automation protocol
- **Why Pilot:** Their Sentient product automates complex trading strategies. Needs cross-chain execution.
- **Contact:** @PrecogFinance

## 7. Clober
- **What:** DEX launching on Monad, integrated Avail Nexus for unified balances
- **Why Pilot:** Already thinking about cross-chain UX abstraction. Small team (1 frontend engineer did their integration).
- **Contact:** clober.io

## 8. Perpbot
- **What:** Telegram bot automating perpetual DEX trading on Aster, expanding to Hyperliquid
- **Why Pilot:** Needs reliable execution automation. Plans multi-venue support. Active development.
- **Contact:** @perpbot_io

## 9. Malda Protocol
- **What:** Unified Liquidity Lending using zkProofs + Across settlement
- **Why Pilot:** Already using intents-based settlement. Understands cross-chain execution deeply.
- **Contact:** Across Protocol ecosystem

## 10. StratiumSol
- **What:** Solana copy trading bot (825ms execution)
- **Why Pilot:** High-frequency agent execution. Already pushing the limits of on-chain execution speed.
- **Contact:** @StratiumSol / Telegram

---

## How to approach these contacts

### Priority sequence for outreach:
1. **Week 1-2:** Reach out to Shaw Walters, Jesse Pollak, Madhavan Malolan, Kevin Wang — these are the most likely to give candid, technical feedback
2. **Week 2-3:** Siddhartha Dutta, Mark Toda, Greg Osuri, Adeniyi Abiodun — ecosystem leaders who can open doors
3. **Week 3-4:** Peter Steinberger (via OpenAI/OpenClaw channels), Illia Polosukhin, George Zeng — high-level strategic conversations
4. **Week 4-6:** Top contributors (wtfsayo, cygaar, shakkernerd) — Implementation-level feedback
5. **Ongoing:** Pilot customer conversations with Pact Swap, Paragon, Quant Flow, Stratium

### Outreach tips:
- **For builders:** Lead with "I've been studying [their specific project]. I'd love to understand your execution infrastructure pain points — I'm not selling anything, just doing deep customer discovery."
- **For ecosystem leads:** Lead with "Kuzerna Labs is building an execution layer for AI agents. We want to optimize for your ecosystem — can we interview your builders?"
- **For researchers:** Lead with the technical problem, not the product. Discuss tradeoffs in TEE vs. ZK vs. intents.

---

*Research compiled by automated web search and analysis, May 2026. Verify specific contact details before outreach.*
