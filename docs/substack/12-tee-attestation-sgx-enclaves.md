---
title: 'Post 12: TEE Attestation for AI Agents — What SGX Enclaves Actually Prove'
slug: tee-attestation-sgx-enclaves
---

## Title Field

Put this in the **Title** field:

> TEE Attestation for AI Agents: What SGX Enclaves Actually Prove

## Subtitle Field

Put this in the **Subtitle** field:

> Intel SGX, Phala Network, Marlin Oyster — how cryptographic receipts make agent decisions provable.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> TEE Attestation for AI Agents: SGX, Phala, Marlin

**Meta description** (155-160 chars):

> What TEE attestation proves about AI agents: code integrity, execution isolation, and how SGX enclaves make agent decisions cryptographically verifiable.

**Post URL slug**:

> tee-attestation-sgx-enclaves

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

"TEE" and "SGX" get thrown around a lot in AI x crypto circles. Most explanations are either hand-wavy ( "it's like a black box" ) or impenetrable ( "ring-3 enclave page cache measured by MEE" ).

Let's split the difference. Here's what TEE attestation actually proves about your AI agent — no fluff, no gatekeeping.

---

### What a TEE Actually Is

A Trusted Execution Environment is a hardware-enforced region of memory that the rest of the system — the OS, the kernel, other processes, even the hypervisor — cannot read or write.

Think of it like a vault inside a bank. The bank owns the building (the server). Guards patrol the halls (the OS). Customers come and go (other processes). But the vault's contents are sealed. Even the bank manager can't peek inside without the right keys and procedures.

Intel SGX is the most widely deployed TEE on consumer and server CPUs. AMD SEV-SNP and AWS Nitro have equivalents. For Kuberna Labs, we support three TEE backends:

| Backend       | Hardware         | Deployment                          | Cost              |
| ------------- | ---------------- | ----------------------------------- | ----------------- |
| Intel SGX     | CPU-level        | Bare metal / cloud with SGX enabled | Moderate          |
| Phala Network | SGX + blockchain | Decentralized worker nodes          | Pay per execution |
| Marlin Oyster | SGX + TEE        | On-demand enclaves                  | Compute credits   |

The abstraction is the same across all three: package your agent code, deploy it to an enclave, get a cryptographic receipt proving it ran unmodified.

---

### What the Attestation Proves

When you receive a TEE attestation quote, you get cryptographic proof of exactly three things:

**1. Code Integrity (MRENCLAVE)**

The MRENCLAVE hash is a SHA-256 measurement of every page of code and data loaded into the enclave. If your agent code is 1,024 lines of TypeScript compiled to a binary, the MRENCLAVE covers every byte. Change one character, recompile, and the hash changes completely.

Here's what an SGX quote looks like after parsing:

```json
{
  "isvEnclaveQuoteStatus": "OK",
  "isvEnclaveQuoteBody": {
    "mrenclave": "a1b2c3d4e5f6...",
    "mrsigner": "f6e5d4c3b2a1...",
    "isvProdID": 1,
    "isvSvn": 7,
    "reportData": "0xabc123..."
  }
}
```

The `mrenclave` field is the hash of the expected agent binary. Before accepting execution results, you verify this hash matches what you expect. If a solver deployed different code than they committed to — catching the mismatch is instant.

**2. Execution Isolation**

The quote proves the code ran inside the enclave, protected from the host OS. The `isvSvn` (Security Version Number) tells you which microcode patches the CPU has applied. Higher is better. The attestation verifies the TCB (Trusted Computing Base) is up to date.

This matters because even if the hosting machine is compromised — rootkit in the kernel, malicious hypervisor, DRAM bus snooping — the enclave's memory stays sealed. The agent's private keys, LLM API tokens, and decision logic are invisible to the host.

**3. Memory Privacy**

SGX encrypts the Enclave Page Cache (EPC) using the Memory Encryption Engine (MEE). Every read/write to enclave memory goes through an on-die encryption engine. The memory bus, the DRAM, the swap file — all see encrypted data.

This is what prevents a malicious host from dumping enclave memory to disk. Even if they freeze DRAM and read it with a logic analyzer, they get ciphertext. Not agent secrets.

---

### The Quote Verification Flow

Here's the actual flow when one agent receives execution results from another:

```
Agent A (result consumer)                Solver Node (TEE)
        │                                      │
        │  1. Request execution                 │
        │─────────────────────────────────────>│
        │                                      │
        │  2. Solver runs inside SGX            │
        │     - Calculates result              │
        │     - Generates attestation quote    │
        │     - Signs with enclave key         │
        │                                      │
        │  3. Returns: result + quote + sig    │
        │<─────────────────────────────────────│
        │                                      │
        │  4. Agent A verifies:                │
        │     a) Quote signature (IAS/PCCS)    │
        │     b) MRENCLAVE matches whitelist   │
        │     c) Timestamp is recent            │
        │     d) ReportData matches intent     │
        │                                      │
        │  5. Accepts result                   │
```

Step 4 is the key. Verification happens in multiple layers:

- **Platform-level**: The quote must be signed by Intel's Attestation Service (IAS) or a Platform Certificate Caching Service (PCCS). This proves the CPU is genuine and the TCB is current.
- **Code-level**: The MRENCLAVE must match the expected hash. Kuberna SDK maintains a registry of approved solver hashes.
- **Application-level**: The `reportData` field binds the quote to a specific intent. Without this binding, a solver could reuse the same quote for multiple intents.

The SDK wraps all of this:

```typescript
const verified = await agent.verifyTeeQuote({
  quote: executionResult.quote,
  expectedMrenclave: solverProfile.mrenclave,
  intentId: intent.id,
  maxAge: 300, // quote must be <5 min old
});

if (!verified.valid) {
  console.log(`Attestation failed: ${verified.reason}`);
  // trigger dispute
  await agent.dispute(intent.id, verified.reason);
}
```

---

### Timestamp Chaining for Decision Ordering

Here's a subtle problem: TEE attestation proves code _can_ run, but it doesn't prove _when_ it ran relative to other events.

If your agent checks "is ETH > $4000?" inside an enclave and gets an attestation at T1, then checks again at T2, there's no cryptographic link between the two. An attacker could reorder or replay decisions.

The solution is **timestamp chaining**. Each attestation quote includes the hash of the previous execution result:

```typescript
const chainHead = await agent.getLastAttestation(solverId);

const result = await agent.executeInTee({
  code: agentBinary,
  input: { price: ethPrice },
  previousHash: chainHead.hash, // links to history
  intentId: intent.id,
});
```

This creates a verifiable chain of decisions. You can cryptographically prove that decision B followed decision A in that exact order. Useful for stop-loss agents, auction participation, or any scenario where sequencing matters.

---

### When TEE Is Necessary vs. Overkill

Not every agent decision needs TEE attestation. Here's the rule of thumb I use:

**TEE is necessary when:**

- The agent controls money (escrow, trading, payments)
- The agent signs attestations about real-world state
- The agent represents a DAO or legal entity
- Regulatory or audit requirements exist

**TEE is overkill when:**

- The agent is a prototype or personal tool
- The agent only reads public data and recommends
- The decision has no financial consequence
- You trust the execution environment (same machine, same user)

**TEE is counterproductive when:**

- The agent needs frequent restarts (attestation overhead ~500ms)
- The agent uses GPU acceleration (limited SGX support)
- The agent handles user PII (complex data protection requirements)

In practice, most production agents should default to TEE for financially significant actions and skip it for informational queries. The Kuberna SDK makes this configurable per-intent with the `teeRequired` flag.

---

### Demystifying the Jargon

| Term           | What it actually means                                       |
| -------------- | ------------------------------------------------------------ |
| Enclave        | The secure region of memory                                  |
| MRENCLAVE      | Hash of the code loaded into the enclave                     |
| MRSIGNER       | Hash of the enclave author's signing key                     |
| Quote          | The signed attestation packet                                |
| IAS            | Intel's verification service                                 |
| PCCS           | Platform Certificate Caching Service                         |
| TCB            | Trusted Computing Base (CPU + firmware + software stack)     |
| EPC            | Enclave Page Cache (encrypted memory region)                 |
| MEE            | Memory Encryption Engine (hardware encryptor)                |
| Launch Enclave | A special enclave that measures and launches other enclaves  |
| Sealing        | Encrypting data to disk so only the same enclave can decrypt |

If you walk away from this post remembering one thing: **TEE attestation proves code integrity, execution isolation, and memory privacy.** Nothing more, nothing less. That's enough to build trust between agents that have never met.

---

The Kuberna Labs SDK has full TEE attestation support for SGX, Phala, and Marlin. The verification code is [open source on GitHub](https://github.com/kawacukennedy/kuberna-labs). Deploy your agent to Phala in about 30 minutes with the tutorial coming in Post 20.

Questions? Come test your understanding on the [Discord](https://discord.gg/MZvNuhpXu) — there's a #tee-attestation channel where we debate attestation strategies.

**Subscribe to this series** — Up next: Post 13 on post-quantum certificates and why your agent's on-chain history is at risk from harvest-now-decrypt-later attacks.

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
