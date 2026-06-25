---
title: 'Post 31: TEE vs zkTLS: Both, Not Either — The Agent Verifiability Stack'
slug: tee-vs-zktls-both-not-either
---

## Title Field

Put this in the **Title** field:

> TEE vs zkTLS: Both, Not Either — The Agent Verifiability Stack

## Subtitle Field

Put this in the **Subtitle** field:

> TEE proves where code ran. zkTLS proves what data it received. Each covers what the other misses. The industry needs both.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> TEE vs zkTLS: The Agent Verifiability Stack

**Meta description** (155-160 chars):

> TEE proves execution integrity. zkTLS proves data provenance. Neither is complete alone. Here's why verifiable agents need both, and how Kuberna Labs stacks them.

**Post URL slug**:

> tee-vs-zktls-both-not-either

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

A few months ago, someone asked me: "If your agent runs in a TEE, why do you need zkTLS?"

It sounds like a fair question. Both technologies prove _something_ about an agent's behavior. If you already have hardware attestation, isn't a cryptographic proof of network traffic redundant?

No. They prove different things. And you need both.

---

### What TEE Actually Proves

A TEE (Trusted Execution Environment) — Intel SGX, Phala's TEE, Marlin Oyster — creates a secure enclave where code executes in isolation from the host OS. When the agent runs inside that enclave, the hardware produces a signed attestation: an `MRENCLAVE` hash that uniquely identifies the code that ran.

This proves **execution integrity**. It says: "This exact binary ran. It was not tampered with. The agent's internal logic ran as written."

**TEE strengths:**

- High throughput — near-native performance for compute-heavy agent decisions
- Mature threat model — Intel SGX has been studied for a decade
- Execution continuity — the agent runs inside a sealed environment with encrypted memory
- Remote attestation — a verifier can confirm the enclave is genuine without being on the same machine

**TEE weaknesses:**

- Hardware dependency — you need an SGX-capable CPU or a Phala worker
- Supply chain attacks — the attestation proves the code, but not that the chip wasn't compromised before your workload landed
- SGX vulnerabilities — SGAxe, Plundervolt, and other side-channel attacks have broken SGX confidentiality in academic settings
- It only proves internals — the TEE knows what the agent computed, but not what data entered or left the enclave

That last one is the killer. An agent running in a TEE can prove "I computed the correct output given my input" — but it cannot prove "the input I received is the real market price."

---

### What zkTLS Actually Proves

zkTLS (zero-knowledge Transport Layer Security) — protocols like Reclaim, TLSNotary, and DECO — generates a zero-knowledge proof of a TLS session. When an agent makes an HTTPS request to an API, zkTLS produces a cryptographic receipt showing exactly what data was sent and received, signed by the TLS handshake keys.

This proves **data provenance**. It says: "The agent received exactly this response from this API at this time. The data was not modified. The TLS connection was authentic."

**zkTLS strengths:**

- No trusted hardware — pure cryptography, runs anywhere
- Data origin verification — proves which server sent the data, not just that _some_ data arrived
- Selective disclosure — the proof can reveal only specific fields (e.g., "the ETH price was $3,200" without revealing the full API response)
- Cryptographic soundness — relies on TLS 1.3 handshake properties, not hardware assumptions

**zkTLS weaknesses:**

- Computational cost — generating a zk proof of a TLS session is expensive (seconds to minutes per proof)
- Latency — you can't do real-time high-frequency trading through zkTLS today
- Browser dependency — most implementations require a browser extension or proxy to capture the TLS handshake
- No execution proof — zkTLS proves what data arrived, but not what the agent did with it internally

That last one is symmetric to the TEE problem. zkTLS proves the data is real. It doesn't prove the agent processed it correctly.

---

### The Blind Men and the Agent

This is the classic blind men and the elephant problem. TEE advocates see the execution integrity problem and think TEEs solve everything. zkTLS advocates see the data provenance problem and think their protocol is the answer.

Both are wrong.

Consider an agent that monitors Uniswap V3 prices and executes trades when the spread crosses a threshold.

With a **TEE alone**, you can prove: "The agent ran the correct trading algorithm. It computed the spread correctly." But you cannot prove: "The price data it used actually came from the Uniswap subgraph, not a manipulated feed."

With **zkTLS alone**, you can prove: "The agent received price data from the Uniswap subgraph at 12:00:00 UTC." But you cannot prove: "The agent's trading algorithm processed that data correctly."

The agent could have received real prices, then ignored them and executed a bad trade. The TEE would catch that. Or the agent could have executed the correct algorithm against fake prices. zkTLS would catch that.

Neither is sufficient. Both together are.

---

### The Combined Stack: How Kuberna Does It

Here's the architecture we settled on at Kuberna Labs.

**Layer 1 — TEE for execution:**
Every agent instance runs inside an SGX enclave (or Phala TEE for cloud workers). The enclave produces an attestation report for every execution cycle. This report includes the `MRENCLAVE` hash (which code ran), the encrypted input/output hashes, and a timestamp.

The attestation is posted to the execution receipt on-chain. Anyone can verify that the agent's logical decision was computed correctly.

**Layer 2 — zkTLS for data ingress/egress:**
When the agent fetches data from an external API — a price feed, a weather oracle, a social graph — the connection goes through a zkTLS notary. The notary produces a zero-knowledge proof of the TLS session. This proof is bound to the TEE attestation via a hash commitment inside the enclave.

The agent cannot claim it received data it didn't. It cannot claim it didn't receive data it did.

**Layer 3 — On-chain binding:**
Both proofs — TEE attestation and zkTLS proof — are hashed together and stored in the execution receipt on our Escrow contract. The dispute resolution system checks both proofs before ruling on a contested execution.

If a dispute arises, the arbitrator doesn't ask "did the agent do the right thing?" in abstract. They check: did the TEE prove correct computation? Did zkTLS prove authentic data? Both must be present for a valid execution.

---

### Where Each Stack Fails (Real Examples)

We've stress-tested both approaches in our test suite. Here's where each breaks.

**TEE failures we've seen:**

- An SGX platform certificate expired mid-execution. The attestation was produced but the verifier rejected it because the certificate chain was stale. The agent's computation was correct, but the proof was invalid.
- A Phala worker node went offline between attestation generation and submission. The TEE proof existed on the worker but never made it to the blockchain. Lost.
- Microarchitectural side-channel attacks are theoretical in our threat model but real in high-security environments. We log `MRENCLAVE` but we don't claim to detect all side channels.

**zkTLS failures we've seen:**

- The notary server went down during a price fetch. The agent received the data, executed the trade, but couldn't produce a zk proof. The execution looked valid but lacked data provenance.
- TLS 1.3 session resumption broke the proof generation in one implementation. The handshake was valid, the connection was secure, but the notary couldn't capture the session key material because it was reused.
- Proof generation took 45 seconds for a complex API response. The agent needed to act in under 10 seconds. The trade window closed before the proof was ready.

These aren't dealbreakers. They're engineering problems. But they illustrate why a single verification mechanism is fragile.

---

### The Industry Needs Both

I'm going to make a strong claim: any verifiable agent framework that relies on only TEE or only zkTLS will have a security hole that gets exploited.

If you're only using TEEs, an attacker can feed your agent fake data through a compromised API connection. The agent will compute correctly against manipulated inputs. The TEE attestation will look perfect. The execution will be wrong.

If you're only using zkTLS, an attacker can compromise the agent's environment and replace the execution logic. The data provenance will check out. The execution logic won't.

The two technologies are complementary, not competitive.

At Kuberna Labs, we're building both into the SDK as composable modules. You can use one, the other, or both. But the default stack includes both, because we want agent execution to be verifiable end-to-end — from data source to on-chain settlement.

---

### What Comes Next

The next frontier: combining TEE and zkTLS proofs into a single zero-knowledge aggregate. Instead of verifying two separate proofs, a verifier would check one combined proof that says: "The agent received authentic data through a verified channel and computed the correct output inside a trusted enclave."

Several research groups are working on this. We're following their progress and contributing where we can.

In the meantime, the dual-stack approach works. It's not the most elegant architecture. But it's the most secure one we have, and we're shipping it.

---

### Try It Yourself

The full verification stack is in our SDK. You can spin up a TEE agent with zkTLS data ingress today.

**GitHub:** [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs) — check the `tee-verifier` and `zk-tls` modules.

**Discord:** [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu) — we have a channel dedicated to verifiability discussions.

Pull requests welcome. We have a "good first issue" tag specifically for proof-aggregation research if you want to help push this forward.

---

_Subscribe to keep up with the series. Post 32 is about why single-chain agents are already obsolete and what cross-chain execution looks like in practice._

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
