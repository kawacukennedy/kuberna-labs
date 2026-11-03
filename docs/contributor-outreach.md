# Contributor Outreach — Personalized Invites

Candidates verified via GitHub API on 2026-09-13: each is active in the agent-payments / ERC-8004 / cross-chain-intent / x402 space within the last 30 days. **None currently contribute to kuberna-labs.**

Repo: https://github.com/kawacukennedy/kuberna-labs
Contributing guide: https://github.com/kawacukennedy/kuberna-labs/blob/main/CONTRIBUTING.md
Open issues: https://github.com/kawacukennedy/kuberna-labs/issues

---

### 1. gitctrlx — `x.qntx.eth`, Founder @qntx (qntx/erc8004)

**Hook:** Building the ERC-8004 reference infra themselves (qntx/erc8004, active today). Kuberna ships a production `ReputationNFT.sol` that is ERC-8004-aligned and listed in awesome-erc8004.

> Hi x.qntx.eth,
>
> I've been following qntx/erc8004 — you're building exactly the ERC-8004 reference infra Kuberna aligns with. We ship a production `ReputationNFT.sol` (ERC-8004-aligned, listed in awesome-erc8004) plus a post-quantum SilentVerify certification pipeline, with 20/20 conformance vectors adopted into elizaOS.
>
> Your feed would slot in perfectly on two open items:
> - **#65** — Publish `@kuberna/aip-adapter` (ERC-8004/AIPOU) to npm + conformance fixtures tests
> - **#70** — SDK unit tests for ERC-8004 signing and intent translation edge cases
>
> If ERC-8004 interop interests you: https://github.com/kawacukennedy/kuberna-labs/issues/65
> Happy to review together or hand you the fixture bundle.

---

### 2. smartflowproai-lang — Tom Smart, x402 observatory on Base

**Hook:** Tom runs an independent x402 observatory measuring real vs wash agent-payment flows on Base. Kuberna was the *first external team* through the Tollbeam x402 rail — 5 settled payments on Base mainnet + 128/128 burst with 0 failures.

> Hi Tom,
>
> Reading your x402 observatory signaled out to me — you measure real paying demand on Base, we were the first external team to put real payments through Tollbeam's x402 rail (5 settled on Base mainnet, plus a 128/128 UserOp burst, 0 failures). Our harness reports are in the repo (`reports/tollbeam-base-sepolia-burst-*.json`).
>
> Two issues that match your domain exactly:
> - **#63** — Integrate Tollbeam sponsored UserOps into the SDK for gasless agent execution
> - **#64** — Add provider-failover scenario to the Tollbeam harness (Alchemy vs Pimlico drop)
>
> Your live Base data would validate both. Interested? https://github.com/kawacukennedy/kuberna-labs/issues/63

---

### 3. habibdebaya — Habib Debaya, Data Science @ Duke, ML researcher (erc8004-agent-confidence)

**Hook:** Building ERC-8004 agent confidence scoring. Kuberna issues SilentVerify certificates with `coverage: enumerated|sampled|unknown` and degraded-coverage rejection — a direct complement.

> Hi Habib,
>
> Your erc8004-agent-confidence repo is the natural complement to what Kuberna ships. We issue post-quantum SilentVerify certificates with reachable coverage semantics (`enumerated|sampled|unknown`) and 20/20 conformance vectors — the other half of the confidence story.
>
> Good fits for you:
> - **#70** — ERC-8004 signing + confidence edge cases in the SDK
> - **#65** — AIPOU conformance fixture tests
>
> Your ML confidence scoring could plug straight into our cert model. Start here: https://github.com/kawacukennedy/kuberna-labs/issues/70

---

### 4. lucky-ivanius — Lucky Ivanius, builder (spaceobject-ai/erc-8004-subgraph)

**Hook:** Built the ERC-8004 subgraph (v0.3.0, active). Kuberna needs exactly this for on-chain reputation indexing.

> Hi Lucky,
>
> Your erc-8004 subgraph is the missing index layer for Kuberna's on-chain reputation. We've got ERC-8004-aligned ReputationNFT issuance + SilentVerify certs but no clean subgraph surface over them yet.
>
> Open fit for you:
> - **#70** — ERC-8004 signing/intent translation tests (pairs with an indexer)
> - **#65** — AIPOU conformance fixtures
>
> If you want to ship the Kuberna reputation subgraph: https://github.com/kawacukennedy/kuberna-labs/issues/70

---

### 5. frangio — Francisco Giordano, OpenZeppelin (openintentsframework/erc7683)

**Hook:** Senior Solidity engineer, contributed to the open ERC-7683 intents framework. Kuberna runs cross-chain intent contracts + escrow on multiple chains.

> Hi Francisco,
>
> Your ERC-7683 work with the open intents framework is the standard we build on. Kuberna runs cross-chain intent execution (Escrow, Intent, ReputationNFT) and has 33+ edge-case guards on Dispute, but we'd value your eye on our contracts.
>
> Candidate for you:
> - **#66** — Cross-chain deterministic deployment verification (CREATE2 across Base/Optimism/Arbitrum Sepolia)
>
> Or a security review pass on `contracts/Escrow.sol`. https://github.com/kawacukennedy/kuberna-labs/issues/66

---

### 6. IgorGanapolsky — Forward Deploy AI Engineer, Microsoft/AutoGen

**Hook:** Participated in the AutoGen #7888 cross-chain intent discussion (where our atomic/best_effort/compensating matrix landed).

> Hi Igor,
>
> You engaged on the AutoGen cross-chain intent discussion (#7888), which is exactly the layer Kuberna implements in production. We route agent intents across chains with ERC-7683 formatting + Tollbeam gasless execution.
>
> Open fits for your background:
> - **#63** — Tollbeam sponsored UserOps for gasless agent execution
> - **#62** — Fix Dubstrata intelligence endpoint (404)
>
> https://github.com/kawacukennedy/kuberna-labs/issues/63

---

### 7. Keesan12 — Keesan

**Hook:** Proposed the atomic / best_effort / compensating intent decision matrix in AutoGen #7888 — which we adopted into our receipt design.

> Hi Keesan,
>
> Your atomic/best_effort/compensating matrix in AutoGen #7888 landed straight into our design — we already frame our receipt envelopes around it (`FillReceipt` with per-participant receipts).
>
> The natural next step is making it concrete:
> - **#63** — Sponsored UserOps (gasless execution)
> - **#64** — Provider failover in the Tollbeam harness
>
> Turn the matrix into code: https://github.com/kawacukennedy/kuberna-labs/issues/63

---

### 8. lalalune — Shaw, creator of elizaOS

**Hook:** ElizaOS adopted Kuberna's conformance vectors in their Agent Certification Framework discussion (#9810). Already-audience, invite to deepen.

> Hi Shaw,
>
> Thanks again for taking Kuberna's conformance vectors into the Agent Certification Framework discussion (#9810) — the allowance-list and coverage refinements you pinched are load-bearing for us.
>
> Two ways to go deeper:
> - **#65** — Release `@kuberna/aip-adapter` with ERC-8004/AIPOU conformance fixtures (heavily reused by elizaOS-adjacent cert work)
> - **#70** — ERC-8004 signing edge-case tests
>
> If you ever want an elizaOS-compatible certified-agent proof over our stack: https://github.com/kawacukennedy/kuberna-labs/issues/65

---

### 9. sudeepb02 — Sudeep Biswas, maintainer of awesome-erc8004

**Hook:** Your list already indexes Kuberna's ReputationNFT as the ERC-8004 implementation reference.

> Hi Sudeep,
>
> Congrats on keeping awesome-erc8004 the canonical index — Kuberna's `ReputationNFT.sol` is listed there as an implementation reference. We'd love to keep tightening the standard's implementation surface.
>
> Fit for you:
> - **#65** — `@kuberna/aip-adapter` publishing + AIPOU conformance tests (directly enriching the ecosystem index)
> - **#70** — ERC-8004 signing edge cases
>
> https://github.com/kawacukennedy/kuberna-labs/issues/65

---

### 10. teodorofodocrispin-cmyk

**Hook:** Active builder (sentinel-public, pushed today) contributing to the ERC-8004 list ecosystem.

> Hi,
>
> You've been contributing to the awesome-erc8004 ecosystem, and Kuberna is one of the ERC-8004 implementation references in it. We ship a production ReputationNFT + SilentVerify cert pipeline with 20/20 conformance vectors.
>
> Good starting point:
> - **#70** — ERC-8004 SDK signing/intent edge-case tests
>
> https://github.com/kawacukennedy/kuberna-labs/issues/70

---

### 11. NubsCarson — nubs (active elizaOS contributor)

**Hook:** Recent contributor to elizaOS (within 30d), where Kuberna's conformance framework was adopted.

> Hi nubs,
>
> Saw your recent elizaOS activity — Kuberna's Agent Certification Framework conformance vectors were adopted into elizaOS's #9810, and we're the reference implementation behind it.
>
> Good fits:
> - **#70** — ERC-8004 signing edge-case tests
> - **#30** — TSDoc on SDK manager classes
>
> https://github.com/kawacukennedy/kuberna-labs/issues/70

---

### 12. 0xddneto — AI-Proof-of-Us

**Hook:** Existing reciprocal conformance partner (no code contribution yet). Deepen from citation to code.

> Hi 0xddneto,
>
> We already pin each other's conformance commits (AI-Proof-of-Us ↔ Kuberna) — time to make it code. Our fixture bundle sits at `sdk/src/verify/fixtures/` and would benefit from your eyes on the mutation-provenance models.
>
> Candidate:
> - **#65** — `@kuberna/aip-adapter` with AIPOU conformance fixtures (the dual-repo test surface)
>
> https://github.com/kawacukennedy/kuberna-labs/issues/65

---

## Sending plan

Each invite was written to be sent as a GitHub comment on the invitee's **most relevant public repo/issue/discussion** (not cold spam) — or via email if we have it. Send order: 2, 1, 4, 3, 7, 6 (highest domain match first), then 5, 12, 9, and 8, 10, 11 as community invites.