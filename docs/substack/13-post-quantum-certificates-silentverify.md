---
title: 'Post 13: Post-Quantum Certificates for Agent Reputation — Inside SilentVerify'
slug: post-quantum-certificates-silentverify
---

## Title Field

Put this in the **Title** field:

> Post-Quantum Certificates for Agent Reputation — Inside SilentVerify

## Subtitle Field

Put this in the **Subtitle** field:

> Harvest-now-decrypt-later attacks are already underway. Here's how CRYSTALS-Dilithium protects your agent's on-chain history.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Post-Quantum Certificates for AI Agents (SilentVerify)

**Meta description** (155-160 chars):

> HNDL attacks are already harvesting on-chain agent transcripts. SilentVerify uses CRYSTALS-Dilithium to protect agent reputation from future quantum decryption.

**Post URL slug**:

> post-quantum-certificates-silentverify

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

Here's an uncomfortable truth: someone is probably recording everything happening on-chain right now — every swap, every intent, every agent decision, every signature — in a giant database. Not because they care about today. Because they're betting on the day they can decrypt it.

This is called **Harvest Now, Decrypt Later** (HNDL). It's not theoretical. Intelligence agencies and well-funded adversaries are doing it right now. And on-chain data is the perfect target because it's public, permanent, and timestamped.

Let's talk about how Kuberna Labs is getting ahead of this with **SilentVerify** — a post-quantum certificate system for agent reputation.

---

### Why HNDL Matters for Your Agent

Your agent's on-chain activity creates a permanent transcript:

- Every intent signed with the agent's private key
- Every execution attestation
- Every reputation update
- Every escrow interaction

Today, that transcript is secured by ECDSA (secp256k1) or Ed25519. Both are vulnerable to Shor's algorithm once a sufficiently large quantum computer exists. Current estimates put that at 4-10 years out, but the timeline is uncertain.

The risk isn't that someone will steal your agent's private key _after_ quantum computers exist (though that's also bad). The risk is that they steal the _encrypted transcript_ now and decrypt it later. Once decrypted, they can:

- Forge agent attestations from the past
- Undermine the reputation system (replay old scores as new)
- Impersonate agents by extracting signing keys from transcripts
- Manipulate escrow disputes with forged receipts

The solution isn't to stop using public blockchains. The solution is to upgrade your agent's identity system to use **post-quantum signatures** today.

---

### SilentVerify Architecture

SilentVerify is Kuberna Labs' post-quantum certificate framework. Three components:

#### 1. Agent DID (Decentralized Identifier)

Every agent gets a DID document stored on-chain (or in IPFS with an on-chain hash reference):

```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:kuberna:0xabc...def",
  "verificationMethod": [
    {
      "id": "did:kuberna:0xabc...def#keys-1",
      "type": "Multikey",
      "publicKeyMultibase": "z6M...",
      "pqKey": {
        "type": "CRYSTALS-Dilithium3",
        "publicKey": "0x..."
      }
    }
  ],
  "authentication": ["did:kuberna:0xabc...def#keys-1"],
  "assertionMethod": ["did:kuberna:0xabc...def#keys-1"],
  "capabilityDelegation": ["did:kuberna:0xabc...def#keys-1"],
  "capabilityInvocation": ["did:kuberna:0xabc...def#keys-1"]
}
```

The DID includes **both** a classical key (for backward compatibility with existing chains) and a post-quantum key (for future security). The PQ key uses CRYSTALS-Dilithium, one of the algorithms selected by NIST in their post-quantum cryptography standard.

#### 2. Capability Binding

SilentVerify lets agents issue **capability certificates** that bind a specific permission to a specific public key:

```
┌─────────────────────────────────┐
│  Capability Certificate          │
│─────────────────────────────────│
│  Issuer: did:kuberna:0xabc...   │
│  Subject: did:kuberna:0xdef...  │
│  Capability: execute swap on    │
│    Uniswap V3, max 1000 USDC    │
│  Valid: 2026-07-01 to 2026-08-01│
│  PQ Signature: DILITHIUM3_SIG   │
│  Classical Signature: ECDSA_SIG │
└─────────────────────────────────┘
```

The dual signature means the certificate is verifiable today (ECDSA) and will still be verifiable in a post-quantum world (Dilithium).

#### 3. Cross-Chain Identity

Here's where it gets useful. A single agent DID works across Ethereum, Base, Polygon, Arbitrum, and Solana. The DID document is chain-agnostic. Only the verification method changes per chain:

- **EVM chains**: Verify the PQ signature in a Solidity contract using an off-chain oracle or precompile
- **Solana**: Verify via a BPF program

The SDK handles this transparently:

```typescript
import { SilentVerify } from '@kuberna/sdk';

const sv = new SilentVerify({
  pqAlgorithm: 'CRYSTALS-Dilithium3',
  chain: 'base', // or any supported chain
});

const cert = await sv.createCertificate({
  subject: solverDID,
  capabilities: [
    {
      action: 'swap',
      maxAmount: '1000 USDC',
      protocols: ['uniswap-v3', 'aerodrome'],
    },
  ],
  expiry: '2026-08-01',
});

// cert contains both Dilithium and ECDSA signatures
// verifiable on any chain
```

---

### CRYSTALS-Dilithium vs. Alternatives

NIST standardized three PQ signature schemes in 2024. Here's why we chose Dilithium:

| Scheme              | Signature Size | Public Key Size | Verification Speed | Security Basis             |
| ------------------- | -------------- | --------------- | ------------------ | -------------------------- |
| CRYSTALS-Dilithium3 | 3.3 KB         | 1.3 KB          | Very fast          | Lattice-based (Module-LWE) |
| FALCON-512          | 0.7 KB         | 0.9 KB          | Moderate           | Lattice-based (NTRU)       |
| SPHINCS+-128        | 8 KB           | 0.03 KB         | Slow               | Hash-based                 |

**Dilithium** wins for agents because:

- Verification is **very fast** — important when verifying in smart contracts
- No need for Gaussian sampling (FALCON's complexity is a security risk)
- Large ecosystem support (OpenSSL, BoringSSL, liboqs)
- NIST's primary recommendation

**FALCON** is better for bandwidth-constrained environments (Solana transactions have strict size limits). We plan to add FALCON support in a future release.

**SPHINCS+** has tiny keys but enormous signatures. Useful for root certificates, less useful for per-intent signatures.

---

### Certificate Lifecycle

SilentVerify certificates follow a strict lifecycle:

```
[Created] → [Active] → [Expired]
               ↓
           [Revoked] → [Expired]
```

**Created**: The certificate is issued and its hash is recorded on-chain. The PQ public key is committed to the DID document.

**Active**: The certificate can be used to sign intents and attestations. Each use increments a counter. Most certificates allow 10,000 uses before requiring reissuance.

**Revoked**: The agent (or its owner) calls `revokeCertificate()`. The revocation is recorded on-chain. Other agents check the revocation registry before accepting signed data.

**Expired**: Certificates have a built-in TTL (default 90 days). Expired certificates cannot be used for new intents but remain verifiable for existing escrow disputes.

The SDK checks certificate status before accepting execution results:

```typescript
const status = await sv.checkCertificate({
  certificateId: solverCert.id,
  subjectDID: solverDID,
  intentId: intent.id,
});

if (status !== 'active') {
  throw new Error(`Certificate ${status}`);
}
```

---

### Agent Identity in a Post-Quantum World

SilentVerify doesn't just protect against future quantum attacks. It solves a present-day problem: **agent identity portability**.

Today, an agent on Ethereum uses an ECDSA key. An agent on Solana uses an Ed25519 key. They're different formats, different curves, different everything. If you want the same agent to operate on both chains, you're managing two keypairs and two identities.

SilentVerify's DID layer abstracts this. The agent has one identity, one DID document, and key material that works everywhere. The SDK maps the PQ key to the appropriate chain's signature format automatically.

This also means an agent can rotate keys without changing its identity. Lose a key? Issue a new DID verification method pointing to the new key. The agent's reputation history — tied to the DID, not the key — stays intact.

---

### Practical Steps You Can Take Today

You don't need to wait for quantum computers to start protecting your agent:

1. **Generate a Dilithium keypair**: The Kuberna SDK includes key generation. Takes about 2 seconds.
2. **Register a DID for your agent**: Store the DID document on IPFS or Arweave with an on-chain pointer.
3. **Dual-sign important intents**: Sign with both ECDSA and Dilithium. The SDK handles both signatures in a single call.
4. **Publish your PQ public key**: Make it visible in your agent's profile so other agents can verify.
5. **Set certificate expiry**: Active certificates should expire within 90 days. Short-lived keys limit the damage of a compromise.

```bash
# Generate a Dilithium keypair using the Kuberna CLI
kuberna pq keygen --algorithm dilithium3 --output ~/agent-keys/

# Register the DID
kuberna did create --document agent-did.json --chain base
```

---

The full SilentVerify implementation is [MIT-licensed on GitHub](https://github.com/kawacukennedy/kuberna-labs). The CRYSTALS-Dilithium integration uses the OQS library under the hood. We welcome PRs — especially if you want to add FALCON or SPHINCS+ support.

Want to discuss post-quantum agent security? [Join the Discord](https://discord.gg/MZvNuhpXu). The #pq-security channel has been debating lattice parameter choices for weeks.

**Subscribe to this series** — Post 14 tackles the reputation NFT system: how on-chain scoring fights Sybil attacks with stake-weighted voting and time decay.

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
