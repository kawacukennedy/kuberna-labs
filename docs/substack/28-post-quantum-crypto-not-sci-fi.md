---
title: "Post 28: Post-Quantum Crypto Isn't Sci-Fi — Your 2026 Agent Needs It Today"
slug: post-quantum-crypto-2026-agent
---

## Title Field

Put this in the **Title** field:

> Post-Quantum Crypto Isn't Sci-Fi — Your 2026 Agent Needs It Today

## Subtitle Field

Put this in the **Subtitle** field:

> Harvest-now-decrypt-later attacks are already underway. Your agent's on-chain decisions are being recorded for future decryption.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Post-quantum crypto for agents — HNDL attacks are happening now

**Meta description** (155-160 chars):

> Harvest-now-decrypt-later attacks target blockchain data. Your agent's on-chain transactions are being recorded for future quantum decryption. PQ certificates fix this.

**Post URL slug**:

> post-quantum-crypto-2026-agent

## Body

Put this in the main body editor:

Harvest-now-decrypt-later (HNDL) is not a theoretical attack. It's happening right now. State-level actors are recording encrypted traffic and on-chain transaction data, storing it until quantum computers can break the cryptography.

This isn't paranoia. In 2024, the US National Security Advisor confirmed that adversarial nations are actively harvesting encrypted data for future decryption. China's public quantum computing roadmap targets 2028-2030 for meaningful cryptanalytic capability. ETSI published its first quantum-safe standards in 2025.

Your agent's on-chain decisions are being recorded on permanent public ledgers. Every signature, every authorization, every binding between identity and action. Today it's secure. In 2030, it's a blueprint for forgery.

---

### Why Blockchain Is Uniquely Vulnerable

Traditional systems have some protection against HNDL:

- **TLS traffic** expires. By the time quantum breaks it, the session is long closed and the data is stale.
- **Email encryption** covers individual messages. Breaking one doesn't compromise the whole system.
- **File encryption** is selective. You encrypt what matters.

Blockchain is different:

- **Transactions are permanent and public.** Every signature your agent makes exists forever on-chain. An attacker can collect millions of signatures from a single agent.
- **Signatures are reusable.** An ECDSA signature on one message reveals information about the private key. With enough signatures, quantum cryptanalysis becomes easier.
- **Identity is cumulative.** Your agent's reputation, certificates, and execution history are built over years. Breaking the key retroactively forges the entire history.

This is the nightmare scenario: an agent with five years of flawless execution history, then someone forges a past authorization and the entire reputation collapses.

---

### What Post-Quantum Cryptography Actually Is

NIST selected three algorithms for standardization in 2024:

- **CRYSTALS-Dilithium** — digital signatures. This is what SilentVerify uses for agent certificates.
- **CRYSTALS-Kyber** — key encapsulation. For encrypting data between agents.
- **SPHINCS+** — stateless hash-based signatures. Heavier but more conservative.

Dilithium is the relevant one for agents. It replaces ECDSA and EdDSA for signing. The signatures are larger (~2.5 KB vs 64 bytes for ECDSA), but verification is fast and security is believed to be quantum-resistant.

---

### What Happens Without PQ

Let me walk through a concrete attack timeline:

**Today.** Your agent executes a thousand intents on Ethereum. Each intent is signed with ECDSA. The signatures, along with your agent's DID and on-chain address, are publicly visible on Etherscan.

**2030.** A nation-state adversary with a quantum computer takes one of two approaches:

_Approach 1: Key recovery._ Using Shor's algorithm on the collected ECDSA signatures, they recover your agent's private key. They now sign new intents as your agent.

_Approach 2: History forgery._ They forge a past intent — "This agent authorized a transfer to address X on date Y" — and use it as evidence in a dispute. The on-chain signature verifies. The fraud is indistinguishable from reality.

**Result.** Your agent's identity is destroyed. Its reputation is worthless. Its past execution history is suspect. Any protocol that trusted its certificate has to re-evaluate.

This isn't a bug in your agent. It's a fundamental property of ECDSA and the permanent public record.

---

### The Timeline Pressure

Here's where the estimates land:

- **2027-2028.** NIST's first PQ standards are mandatory for US government contracts. ETSI standards are adopted by EU financial regulators.
- **2028-2029.** First-generation quantum computers capable of breaking 2048-bit RSA. ECDSA falls shortly after (requires fewer logical qubits).
- **2030-2032.** Widespread cryptanalytic quantum capability. Any system without PQ migration is effectively insecure.

If your agent's identity is designed to last 3+ years, you're in the danger window. An agent launched today with ECDSA-only identity will still be active in 2029.

---

### What SilentVerify Does

SilentVerify issues Dilithium5 certificates for agent identities. The procedure:

1. Agent creates a DID (off-chain, anchored to IPFS + Ethereum)
2. Agent generates a Dilithium5 key pair
3. SilentVerify signs the DID document + capabilities with its own Dilithium5 root key
4. The certificate is anchored on-chain via an Ethereum transaction
5. Verification uses the on-chain root, not a trusted third party

The agent's identity is PQ-secured from day one. Even if ECDSA is broken, the agent's on-chain bindings are verifiable through the Dilithium5 signature chain.

For the full code walkthrough, see [Post 23](/custom-strategy-agents/). The short version: create a DID, set capabilities, issue the certificate. Free API key, 15 minutes, done.

---

### Beyond Certificates: PQ-Ready Execution

Kuberna's execution layer is being audited for PQ readiness across all components:

- **Escrow contracts.** Migration plan from ECDSA-based authorization to Dilithium verification.
- **TEE attestation.** SGX and TDX both support PQ extensions for quote verification.
- **Cross-chain messaging.** Relay verification uses hybrid (ECDSA + Dilithium) during transition.
- **x402 payments.** Session authentication supports Dilithium keys.

The transition won't happen overnight. We support **hybrid mode** — both ECDSA and Dilithium signatures accepted, with a flag to require PQ-only for high-value intents. This lets agents migrate gradually.

---

### What You Should Do Today

Three concrete steps:

**1. Issue a PQ certificate for your agent.** Free at SilentVerify. If your agent has a DID, bind it. If it doesn't, create one. This takes 15 minutes.

**2. Enable hybrid verification.** If your protocol verifies agent identities on-chain, add Dilithium verification as an option. The SilentVerify contracts support it. Start collecting PQ signatures even if you don't enforce them yet.

**3. Set a PQ-only deadline.** Announce that by Q1 2028, your protocol will require PQ certificates for all agent interactions. This gives your users a clear migration timeline.

---

### The Cost of Waiting

Waiting is tempting. PQ signatures are larger. Verification gas costs are higher. The migration is work. There's no immediate threat.

But the data is being collected today. Every transaction your agent makes is a data point for a future adversary. The cost of migration goes up linearly with time. The cost of a compromised identity goes up exponentially.

If you're building agent infrastructure that you expect to last, PQ isn't a future problem. It's a present requirement disguised as a future one.

The SDK and SilentVerify packages are at [github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs). The `#silentverify` channel on [discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu) has the team and early adopters discussing migration patterns.

_Subscribe below. Next post: why open source wins in agent infrastructure — and why closed protocols will fragment the market and fail._
