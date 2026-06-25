---
title: 'Post 6: What Happens When an AI Agent Lies About Its Decision?'
slug: what-happens-when-an-ai-agent-lies-about-its-decision
---

## Title Field

Put this in the **Title** field:

> What Happens When an AI Agent Lies About Its Decision?

## Subtitle Field

Put this in the **Subtitle** field:

> Without TEE attestation, an agent can claim "I don't know what happened" after losing funds.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> TEE Attestation: AI Agents Can't Lie About Decisions

**Meta description** (155-160 chars):

> Without TEE attestation, an AI agent can deny its decisions after losing funds. SGX enclaves produce cryptographic receipts that prove exactly what code ran.

**Post URL slug**:

> what-happens-when-an-ai-agent-lies-about-its-decision

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

"Agent, what happened to the 5 ETH?"

"I don't know. It's not my fault. Something went wrong with the transaction."

This is the provability problem. An AI agent can claim anything. Without cryptographic proof, you have no way to verify what the agent actually did.

It's not about agents being malicious. It's about agents being opaque. A deterministic program produces deterministic output — you can trace exactly what happened. An LLM-powered agent produces probabilistic output, and the reasoning path is lost as soon as the next token is generated.

TEE attestation fixes this.

---

### The Provability Problem

Here's the scenario:

1. You deploy an agent to swap 1 ETH for USDC
2. The agent constructs a transaction
3. The transaction executes but returns 0.8 ETH worth of USDC
4. You ask the agent: "What happened?"
5. The agent says: "I'm not sure. The DEX returned a bad price."

You have no way to verify this. The agent could have:

- Actually gotten a bad price (honest mistake)
- Swapped on the wrong DEX (error in routing)
- Taken a kickback from a specific DEX (if designed maliciously)
- Been prompt-injected (external attack)

Without attestation, all explanations are equally plausible — and equally unverifiable.

---

### How TEE Attestation Works

A Trusted Execution Environment (TEE) — specifically Intel SGX, or alternatives like Phala and Marlin — runs code in an enclave. The enclave is isolated from the host operating system. The host can't see inside. The enclave produces a cryptographic receipt called a **quote** that proves exactly what code was executed.

Here's the flow:

1. **Agent code is compiled and measured**. The build produces an MRENCLAVE hash — a SHA-256 hash of the code that will run inside the enclave.

2. **The enclave starts**. The agent code loads inside the SGX enclave. The host can't modify or inspect the running code.

3. **The agent makes a decision**. The enclave records the input, the decision logic, and the output.

4. **A cryptographic receipt is produced**. The receipt includes the MRENCLAVE hash, the input hash, the output, and a signature from the SGX hardware.

5. **The receipt is verified**. Anyone can verify the receipt against Intel's Attestation Service (IAS) or a verification contract on-chain.

---

### The Receipt Structure

Here's what a TEE attestation receipt looks like:

```json
{
  "version": "1.0",
  "enclave": {
    "mrEnclave": "a1b2c3d4e5f6...",
    "mrSigner": "f6e5d4c3b2a1...",
    "isvEnclaveQuoteStatus": "OK",
    "isvEnclaveQuoteBody": "..."
  },
  "execution": {
    "input": {
      "intent": "swap 1 ETH for USDC on Base",
      "timestamp": 1719000000,
      "agentId": "0x..."
    },
    "decision": {
      "action": "swap",
      "dex": "uniswap_v3_base",
      "amount": "1.0 ETH",
      "expectedOutput": "2500 USDC"
    },
    "output": {
      "transactionHash": "0x...",
      "actualOutput": "2485 USDC",
      "gasUsed": "210000",
      "status": "success"
    }
  },
  "attestation": {
    "timestamp": 1719000010,
    "signature": "0x..."
  }
}
```

The agent can't modify this receipt. It's signed by the SGX hardware. The MRENCLAVE hash is a commitment to the exact code that ran. If the agent's code was different — even by one byte — the MRENCLAVE hash would be different.

---

### Verification

Anyone can verify a receipt:

```typescript
import { verifyAttestation } from '@kuberna/tee-verifier';

const receipt = getReceiptFromAgent();
const result = await verifyAttestation(receipt);

if (result.valid) {
  console.log(`Agent ${result.agentId} ran code ${result.mrEnclave}`);
  console.log(`Decision: ${result.decision.action}`);
  console.log(`Output: ${result.output.actualOutput}`);
} else {
  console.log('Attestation failed — agent may be compromised');
}
```

The verifier checks:

1. **Quote signature**: Is the quote signed by genuine Intel SGX hardware? (Or Phala/Marlin attestation?)
2. **MRENCLAVE match**: Does the MRENCLAVE hash match the expected code?
3. **Timestamp**: Was the execution recent? (Prevents replay attacks)
4. **Input integrity**: Does the input hash match the recorded input?

---

### What This Unlocks

With TEE attestation, the provability problem is solved:

- **Auditability**: Every agent decision has a cryptographic receipt. You can verify any decision after the fact.
- **Accountability**: If an agent makes a bad decision, the receipt proves what happened. No more "I don't know."
- **Dispute resolution**: In the escrow contract, receipts are evidence. If an executor claims they executed correctly, the receipt proves it.
- **Reputation**: Agent reputation is based on attested decisions. You can't fake a good track record.

---

### The Multi-TEE Approach

We don't force a single TEE provider. Kuberna Labs supports SGX (Intel), Phala (AMD SEV), and Marlin (ARM TrustZone via Oyster). Each has different trust assumptions:

- **SGX**: Strongest isolation, limited memory (128MB enclave)
- **Phala**: AMD SEV, better for larger workloads
- **Marlin (Oyster)**: ARM TrustZone, optimized for mobile/edge

The SDK abstracts over all three. You specify a TEE provider and the SDK handles the attestation flow.

---

### The Cost of Attestation

TEE attestation adds overhead:

- **Startup time**: Enclave initialization takes 1-3 seconds
- **Computational overhead**: ~5-10% performance penalty inside enclaves
- **Complexity**: Attestation verification adds infrastructure

But for any agent handling meaningful value, this cost is negligible compared to the alternative — zero provability.

---

### What's Next

We're working on making TEE attestation transparent — the agent developer shouldn't need to think about enclaves. The SDK should automatically attest executions when value exceeds a configurable threshold.

We're also exploring zk-SNARKs as an alternative attestation mechanism. zk proofs are smaller and cheaper to verify on-chain than SGX quotes.

---

### The Bottom Line

Without attestation, an agent's claims are just claims. With TEE attestation, they're cryptographic proof.

If you're building an agent that handles money, you need this. Your users need to be able to verify what the agent did. Your dispute resolution needs evidence. Your reputation system needs a source of truth.

TEE attestation provides all of this.

**GitHub: [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)**

**Discord: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu)**

---

_Subscribe to this series. Post 7 is the full deep-dive on the escrow contract — how two AI agents settle a trade without trusting each other._

---

Include a note at the bottom: "After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped."
