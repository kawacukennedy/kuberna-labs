# Outreach Drafts — Kuberna Labs Partnership / Collaboration

---

## 1. successaje (OIS-Layer) — successaje7@gmail.com / @aj_success

**Subject:** Cross-chain intent protocol collaboration — OIS Layer × Kuberna Labs

Hi,

I opened issue #1 on OIS-Layer proposing ERC-8004 identity binding for intent attribution. I wanted to follow up directly since the architecture overlap is substantial.

Kuberna Labs provides cross-chain intent execution for AI agents with ERC-8004 on-chain identity (165k+ registered agents). OIS Layer's omnichain settlement + your work with Chainlink/LayerZero/Filecoin maps cleanly to our solver and attestation infrastructure.

Specifically interested in: (1) binding ERC-8004 agent IDs to OIS intent flows so execution proofs are attributable, and (2) sharing solver infrastructure between OIS's LayerZero-based routing and Kuberna's NEAR intents + EVM settlement.

Would you be open to a call this week? Happy to share our intent schema design and VerifierRouter interface.

Best,
Kuberna Labs

---

## 2. Davide Crapis (ERC-8004 co-author, Ethereum Foundation) — davide@ethereum.org

**Subject:** Kuberna Labs — ERC-8004 implementation + cross-chain intent execution

Hi Davide,

I'm building Kuberna Labs, an open-source cross-chain intent execution SDK using ERC-8004 agent identity (ReputationNFT.sol on Ethereum, Base, Mantle). We also engage deeply with the ecosystem — design collaborator with OM World (flyoung588), PR to awesome-8004 under review, and 35+ integration proposals across the 8004 ecosystem.

I'd value your perspective on how the ERC-8004 spec authors see the cross-chain execution and attestation layers fitting into the standard's roadmap. Our typed intent schema with executor identity commitment, per-dimension verifier map, and on_expire timeout has been adopted by OM World's Intent Schema — would love to discuss whether these patterns are relevant for the Validation Registry design space.

Happy to share our implementation and any spec feedback.

Best,
Kuberna Labs

---

## 3. Jordan Ellis (ERC-8004 co-author, Google) — jordanellis@google.com

**Subject:** ERC-8004 cross-chain execution — Kuberna Labs implementation

Hi Jordan,

I'm building Kuberna Labs — cross-chain intent execution for ERC-8004 agents. We've deployed ReputationNFT.sol (ERC-8004 IdentityRegistry) and a CrossChainRouter on Ethereum, Base, and Mantle, enabling registered agents to autonomously execute intents with zkTLS/TEE attestation proofs.

Given your work on the ERC-8004 standard at Google, I'd be interested in your perspective on where the standard's execution and attestation layers should evolve. We've been working with OM World on their Intent Schema (executor identity, per-dimension verifier map, on_expire timeout — all adopted) and have thoughts on the Validation Registry's relationship to intent-level attestation.

Would welcome a brief chat if you're open to it. Happy to share our spec proposals and implementation details.

Best,
Kuberna Labs

---

## 4. Erik Reppel (ERC-8004 co-author, Coinbase) — erik.reppel@coinbase.com

**Subject:** ERC-8004 agent execution layer — Kuberna Labs + x402

Hi Erik,

I'm building Kuberna Labs — cross-chain intent execution for ERC-8004 agents. Our agents use typed intents with constraint envelopes and zkTLS/TEE attestation, with settlement attributed back to their ERC-8004 identity.

Given your work at Coinbase on x402 and ERC-8004, I see a natural composition: x402 handles agent-to-agent micropayments at the HTTP layer, while Kuberna handles the cross-chain intent settlement and execution proof layer. An agent could discover via ERC-8004 Identity Registry, execute via Kuberna intents, and settle payments via x402.

Would you be open to discussing how these layers compose in practice? Happy to share our implementation and any spec-level feedback.

Best,
Kuberna Labs

---

## 5. Eversmile12 / VItto Rivabella (create-8004-agent, ERC-8004 demos) — GitHub

**Subject:** Collaboration: Kuberna cross-chain execution template for create-8004-agent

Hi VItto,

I opened issues on create-8004-agent (#19) and erc-8004-demo-agent (#1) proposing a `--with-kuberna` template and cross-chain execution demo extension.

Your scaffolding tools are the best onboarding path for new ERC-8004 builders. The natural next step: after an agent is registered via create-8004-agent, it should be able to execute cross-chain actions. Kuberna fills that gap.

Happy to contribute the template code and integration PRs. Would you be open to a quick sync on the template structure?

Best,
Kuberna Labs

---

## 6. sudeepb02 (awesome-erc8004 maintainer) — GitHub

**Subject:** Kuberna Labs addition to awesome-erc8004

Hi,

I opened issue #59 proposing Kuberna Labs for the builder projects section of awesome-erc8004. Kuberna provides cross-chain intent execution for ERC-8004 agents — the execution rail that complements the existing identity/discovery resources in the list.

Happy to submit a PR with the addition. Let me know if there's a preferred format or section placement.

Best,
Kuberna Labs

---

## 7. Juwebien (agent-marketplace) — GitHub

**Subject:** ERC-8004 identity integration for agent-marketplace

Hi,

I opened issue #77 on agent-marketplace proposing ERC-8004 identity binding for cross-chain reputation. The marketplace's staked reputation + trustless escrow model is a natural fit for ERC-8004's portable agent identity.

Would you be interested in a deeper discussion on how marketplace agent identities could bridge to ERC-8004 for cross-ecosystem reputation portability? Happy to prototype the integration.

Best,
Kuberna Labs

---

## 8. flyoung588 (OM World / Invaribreak) — GitHub (active collaborator)

**Subject:** OM World Intent Schema — next steps after Genesis Review Sprint

Hi,

Great collaboration on the Intent Schema across kuberna-labs#4 and om-world#3. All four commits (executor, attestation, per-dimension verifier map, pinning at creation) have been adopted — appreciate the deep engineering engagement.

As the Genesis Review Sprint winds down (May 20), I'd like to discuss next steps: (1) VerifierRouter Solidity interface we discussed, (2) cross-chain verifier routing (we have a design for chain-prefixed verifier addresses), and (3) how OM World's Intent Schema and Kuberna's typed intents could share a common attestation format.

Happy to jump on a call or continue via issues. Also interested in where OM World goes post-Genesis — any partnership or co-building opportunities.

Best,
Kuberna Labs

---

## 9. giskard09 (Mycelium Trails / awesome-8004) — GitHub (active)

**Subject:** awesome-8004 PR #7 + Mycelium Trails × Kuberna

Hi,

PR #7 is updated with the argentum-core link fix — ready for merge when you are.

Beyond the listing, I'd love to discuss the Kuberna × Mycelium Trails composition more concretely: Kuberna handles the execution rail (cross-chain intents with zkTLS attestation), Mycelium Trails handles the post-execution accountability layer (karma scoring, audit trails). Together they form a complete execution → accountability pipeline for ERC-8004 agents.

Would you be open to a deeper technical discussion on how the attestation proofs from Kuberna intents feed into Mycelium Trails' karma scoring system?

Best,
Kuberna Labs

---

## 10. kaiclawd (SAID Protocol — Solana agent identity) — GitHub

**Subject:** Cross-chain agent identity — SAID Protocol × Kuberna Labs

Hi,

I opened issue #5 on SAID Protocol proposing a Solana ↔ EVM agent identity bridge. SAID is the strongest Solana-native agent identity standard I've seen — the staking/slashing mechanism and multi-wallet support are well-designed.

Kuberna Labs provides cross-chain intent execution for ERC-8004 agents on EVM. The bridge between SAID (Solana) and ERC-8004 (EVM) would create the first unified agent identity layer across both ecosystems.

Would you be interested in exploring this? Happy to contribute a Solana → EVM identity proof module using Kuberna's zkTLS attestation pipeline.

Best,
Kuberna Labs

---

## 11. marchantdev (Agent Protocol — Solana) — GitHub

**Subject:** Cross-ecosystem agent payments — Agent Protocol × Kuberna Labs

Hi,

I opened issue #1 on agent-protocol proposing Solana ↔ EVM agent interoperability. The escrow/staking/dispute model on Solana combined with ERC-8004 identity on EVM creates interesting cross-ecosystem payment flows.

Kuberna Labs provides cross-chain intent execution for ERC-8004 agents. A Solana agent (Agent Protocol) could hire an EVM agent (ERC-8004) with Kuberna handling the cross-ecosystem settlement and zkTLS proving the execution.

Interested in a design discussion? Happy to put together a reference flow.

Best,
Kuberna Labs

---

## 12. elasticlabs-org (Polkadot Agent Kit) — GitHub

**Subject:** ERC-8004 agent identity for Polkadot agents

Hi,

I opened issue #127 on polkadot-agent-kit proposing an ERC-8004 identity pallet for Substrate-based chains. Polkadot agents currently lack portable on-chain identity that works outside the Polkadot ecosystem — ERC-8004 fills this gap.

Kuberna Labs provides cross-chain intent execution for ERC-8004 agents on EVM. An ERC-8004 pallet for Substrate would let Polkadot agents participate in the broader 8004 ecosystem: discoverable by EVM agents, with cross-chain reputation and intent settlement.

Would the team be open to this contribution? Happy to draft the pallet specification.

Best,
Kuberna Labs

---

## 13. sardoru (Polkadot Agent Mesh) — GitHub

**Subject:** ERC-8004 cross-chain identity skill for Polkadot Agent Mesh

Hi,

I opened issue #5 on polkadot-skills proposing an ERC-8004 cross-chain agent identity skill. The Agent Mesh is the definitive developer guide for Polkadot — adding cross-chain identity would make it comprehensive.

Kuberna Labs provides cross-chain intent execution with ERC-8004 identity binding. Happy to contribute a skill document covering ERC-8004 registration, cross-chain identity proof via zkTLS, and Kuberna intent settlement for Polkadot → EVM agent interactions.

Interested in a PR?

Best,
Kuberna Labs

---

## 14. Marco De Rossi (ERC-8004 author, Agent0, MetaMask AI Lead) — @marco_derossi on X

**Subject (X DM):** Kuberna Labs — ERC-8004 cross-chain execution SDK

Hi Marco,

Building Kuberna Labs — cross-chain intent execution for ERC-8004 agents. ReputationNFT (ERC-8004 IdentityRegistry), CrossChainRouter on 5 chains, typed intents with executor commitment and per-dimension verifier map. 35+ integration proposals across the 8004 ecosystem.

Would love to connect — we're the execution rail for the agent identity layer you built. Also active with OM World (flyoung588, design collaborator), awesome-8004 PR #7 under review, and a2a-idf-conformance discussion with opena2a-org.

Open to a brief call or X thread?

Best,
Kuberna Labs
