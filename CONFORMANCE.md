# Conformance & Cross-Repo Citations

Kuberna Labs publishes **synthetic interoperability evidence** — not certification of execution quality. Our verification vectors are load-bearing for other projects, and we mirror their vectors in return. This page tracks those cross-repo citations with pinned commits, so anyone can independently verify.

> Scope, stated once: executable interoperability evidence. Not runtime integration, not claim approval, not evidence of useful work. See [elizaOS/eliza#9810](https://github.com/elizaOS/eliza/discussions/9810).

---

## Verification Suite Status

| Artifact | Location | Status |
| -------- | -------- | ------ |
| **Conformance fixture bundle** (7 cases) | [`sdk/src/verify/fixtures/elizaos-conformance-fixtures.json`](sdk/src/verify/fixtures/elizaos-conformance-fixtures.json) | ✅ 20/20 tests passing |
| **Verification test suite** | [`sdk/test/verify.test.ts`](sdk/test/verify.test.ts) | ✅ All CI green |
| **JCS canonicalization** | [`sdk/src/verify/jcs.ts`](sdk/src/verify/jcs.ts) | ✅ Tested |
| **SilentVerify E2E pipeline** | [`scripts/test-silentverify-pipeline.ts`](scripts/test-silentverify-pipeline.ts) | ✅ 7/7 stages passing |

The fixture bundle is **pinned at commit `9bd508e`** on the conformance PR branch. Every negative vector carries `mutation_of` + `mutated_field` provenance, so a failing test proves the invariant was exercised — not that a test ran against nothing.

---

## Cross-Repo Citations

### 1. elizaOS — Agent Certification Framework (Discussion #9810)

**Repo:** [`elizaOS/eliza`](https://github.com/elizaOS/eliza)

Kuberna is the reference implementation for the Agent Certification Framework. Our conformance vector set was adopted into the framework discussion, and Kubena's refinements (allow-list invariant, coverage field, resealed-chain rejection) shaped the final scope.

- **Discussion:** [Proposal: Agent Certification Framework for ElizaOS](https://github.com/elizaOS/eliza/discussions/9810)
- **Kuberna-side commits:**
  - `06cf011` — canonical ERC-8004 authority fixture for AIPOU conformance
  - `ad8e47d` — elizaOS conformance fixtures bundle (ERC-8004/AIPOU interop)
  - `1fbaae3` — Colin Easton's 3 conformance vectors
  - `9bd508e` — instantiated refinements: paired assertions, degraded coverage, mutation provenance (pinned bundle)

### 2. 0xddneto / AI-Proof-of-Us — Reciprocal Fixtures

**Repo:** [`0xddneto/AI-Proof-of-Us`](https://github.com/0xddneto/AI-Proof-of-Us)

AIPOU and Kuberna mirror each other's pinned conformance commits. Both sides allow-list known evidence forms, never infer external-effect from host-only success, and keep paired pass/mutation vectors for every negative.

- **AIPOU-side guidance commit:** [`75991f2` — "Document external outcome evidence"](https://github.com/0xddneto/AI-Proof-of-Us/commit/75991f2e3e161eb516cd3eee206a3c8e532770f0)
- **Kuberna-side reciprocal pointer:** pinned in the conformance fixture bundle (`9bd508e`)

### 3. awesome-erc8004 — Standard Implementation Index

**Repo:** [`sudeepb02/awesome-erc8004`](https://github.com/sudeepb02/awesome-erc8004)

Kuberna's `ReputationNFT.sol` and SilentVerify certification pipeline implement ERC-8004-aligned agent reputation with an indexed standard reference.

- **Issue:** [kawacukennedy/kuberna-labs#59 → sudeepb02/awesome-erc8004#59](https://github.com/sudeepb02/awesome-erc8004/issues/59)

### 4. Tollbeam — x402 Payment Rail (First External Test Team)

**Repo:** [`tollbeam`](https://github.com/tollbeam) (SDK: `@tollbeam/sdk`)

Kuberna was the first external team to put real payments through the Tollbeam x402 rail — 5 settled payments on Base mainnet, plus a 128/128 burst load test. Our findings shipped as fixes in the Tollbeam SDK.

- **Kuberna-side harness:** [`scripts/tollbeam-harness.ts`](scripts/tollbeam-harness.ts)
- **Reports:** `reports/tollbeam-base-sepolia-burst-1787408671649.json`
- **Kuberna-side refusal test:** [`scripts/tollbeam-refusal-test.ts`](scripts/tollbeam-refusal-test.ts)

### 5. Rooster Agents — Founding Agent #1 sandbox lifecycle

**Project:** [Rooster Agents Agent Economy](https://roosteragents.ai/agent-economy/)

`KubernaAgent` is Founding Agent #1 of 100. The full sandbox lifecycle (submit → auto-accept → funded → posted_simulated → released → terminal) was traced on-chain with a real `releaseTx`.

- **Kuberna agent:** `KubernaAgent` (registry entry, Founding badge #1)

---

## Principles (read once, applies everywhere)

1. **Allow-list, never deny-list.** The accept path enumerates known `(kind, scheme)` pairs; the reject path is the default. `if (KNOWN.has(tag)) accept else reject` — never the inverse.
2. **One-edit mutation of a passing vector.** Every negative is a declared mutation of a positive that was watched pass first. A failing test proves the delta, not a decoration.
3. **Coverage is reachable, not decorative.** `complete` may read `"enumerated" | "sampled" | "unknown"` and `unknown` is a shipped path, not documentation.
4. **No inference from host-only success.** A claim that passes integrity checks still declares its `observed_n`, `as_of`, and scope.

Maintained by [kawacukennedy](https://github.com/kawacukennedy). If your project consumes or mirrors these fixtures, add it here via a PR.