---
title: 'Post 23: Issue a Post-Quantum Certificate for Your Agent via SilentVerify'
slug: post-quantum-certificate-silentverify
---

## Title Field

Put this in the **Title** field:

> Issue a Post-Quantum Certificate for Your Agent via SilentVerify

## Subtitle Field

Put this in the **Subtitle** field:

> Agent DID creation, capability binding, certificate issuance — all through a free API key.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Issue post-quantum certificates for AI agents with SilentVerify free API

**Meta description** (155-160 chars):

> Create agent DID, bind capabilities, request PQ certificate, verify on-chain. Free API key. Full code for EVM + Solana identity binding.

**Post URL slug**:

> post-quantum-certificate-silentverify

## Body

Put this in the main body editor:

Your agent needs an identity. Not a wallet address — a **provable identity** with attested capabilities that holds up against future quantum attacks.

Harvest-now-decrypt-later is already happening. Every on-chain transaction your agent makes today is being recorded. When quantum computers mature, those signatures break. Your agent's history becomes forgeable.

SilentVerify solves this with **post-quantum certificates** — Dilithium-signed attestations that bind an agent's DID to its capabilities and its on-chain addresses. Let me show you the full flow.

---

### Step 1: Get Your Free API Key

```bash
curl -X POST https://api.silentverify.io/v1/register \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

Check your inbox. You'll get a key with 1,000 free certificates/month — enough for development and production testing.

Set it as an environment variable:

```bash
export SILENTVERIFY_API_KEY=sv_live_xxxxxxxxxxxx
```

---

### Step 2: Create an Agent DID

A DID (Decentralized Identifier) is the root of your agent's identity. It's not tied to any specific blockchain — it's a universal identifier that you can later bind to EVM, Solana, or any other chain.

```typescript
import { SilentVerifyClient } from '@kuberna/silentverify';

const sv = new SilentVerifyClient({
  apiKey: process.env.SILENTVERIFY_API_KEY!,
});

const did = await sv.createDid({
  method: 'kuberna',
  agentName: 'YieldBot-v2',
  publicKey: agentPublicKey, // your agent's Dilithium public key
  metadata: {
    description: 'Cross-chain yield optimizer for Aave and Compound',
    version: '2.1.0',
    owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  },
});

console.log(did.id);
// did:kuberna:z2dm9f3Yq8QKx9JpX7yL5vR1hW4nM6cB
```

The DID document is stored on IPFS and anchored to Ethereum via a lightweight registry contract. No heavy on-chain storage, just a hash reference.

---

### Step 3: Define Capabilities

Capabilities are the operations your agent is authorized to perform. Think of them as a permission manifest:

```typescript
await sv.setCapabilities(did.id, {
  capabilities: [
    {
      action: 'swap',
      chains: ['ethereum', 'arbitrum', 'polygon'],
      tokens: ['ETH', 'USDC', 'DAI'],
      maxAmount: '100000', // in USD equivalent
    },
    {
      action: 'deposit_liquidity',
      chains: ['ethereum', 'polygon'],
      protocols: ['aave', 'compound'],
    },
    {
      action: 'withdraw_liquidity',
      chains: ['ethereum'],
      protocols: ['aave'],
    },
    {
      action: 'bridge',
      chains: ['ethereum', 'arbitrum'],
      maxAmount: '50000',
    },
  ],
  constraints: {
    maxSlippageBps: 100, // 1%
    requireEscrow: true,
    requireAttestation: true,
  },
  expiry: '2027-06-01T00:00:00Z',
});
```

These capabilities are **cryptographically bound** to the DID. When someone verifies your agent's certificate, they also verify that the agent's actions stay within these bounds.

---

### Step 4: Issue the Certificate

```typescript
const cert = await sv.issueCertificate(did.id, {
  algorithm: 'dilithium5', // NIST-selected PQ algorithm
  validityDays: 365,
  includeChainProof: true,
});

console.log(cert.serialize());
```

The response includes:

- The **Dilithium5 signature** over the DID document + capabilities
- A **Merkle proof** linking the certificate to SilentVerify's root of trust
- The **on-chain anchor** — a transaction hash on Ethereum where the certificate root is stored

You can inspect it with:

```bash
curl https://api.silentverify.io/v1/certificates/${cert.id} \
  -H "Authorization: Bearer ${SILENTVERIFY_API_KEY}" | jq .
```

---

### Step 5: Verify On-Chain

Verification happens in a smart contract, so other agents and protocols can check your agent's identity without off-chain dependencies:

```solidity
import '@kuberna/silentverify/contracts/IVerifier.sol';

contract AgentGateway {
  IVerifier public verifier;

  constructor(address verifierAddress) {
    verifier = IVerifier(verifierAddress);
  }

  function executeFromAgent(
    bytes calldata certificate,
    bytes calldata signature,
    Intent calldata intent
  ) external {
    // Verify the agent's PQ certificate
    (bool valid, string memory agentDid) = verifier.verifyCertificate(
      certificate,
      signature,
      abi.encode(intent)
    );

    require(valid, 'Invalid agent certificate or signature');

    // Check capabilities
    require(
      verifier.hasCapability(agentDid, 'swap', intent.chain),
      'Agent not authorized for this action on this chain'
    );

    // Execute...
  }
}
```

This means any protocol can let agents interact autonomously — with cryptographic proof that the agent is who it claims to be and is authorized for that specific action.

---

### Step 6: Cross-Chain Identity Binding

Your agent probably operates on multiple chains. You need a way to prove that the same agent controls addresses on Ethereum AND Solana:

```typescript
await sv.bindAddress(did.id, {
  chain: 'ethereum',
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  signature: evmSignature, // signed with the EVM wallet
});

await sv.bindAddress(did.id, {
  chain: 'solana',
  address: '7R2s5F8vK9pL3mN6bV4cX1zQ8wE5tY2u',
  signature: solSignature, // signed with the Solana wallet
});

// Verify the binding
const boundAddresses = await sv.getBoundAddresses(did.id);
console.log(boundAddresses);
// [
//   { chain: 'ethereum', address: '0x742d...bD18' },
//   { chain: 'solana',   address: '7R2s5...Y2u' },
// ]
```

Now any verifier can check: "This intent claims to come from agent did:kuberna:z2dm9... and is signed by 0x742d... on Ethereum. Is that address bound to that DID?" Yes, via the PQ certificate.

---

### Production Notes

**Key rotation.** Certificates expire. Set up a cron to re-issue before expiry. SilentVerify sends webhook alerts at 30, 14, and 7 days before expiry.

**Revocation.** If your agent's key is compromised, call `sv.revokeCertificate(cert.id)`. The revocation is on-chain within one Ethereum block.

**Free tier limits.** 1,000 certificates/month. That's enough for 3 agents with daily re-issuance. If you need more, the paid tier starts at $49/month for 50,000 certs.

---

### The Full Script

Here's a complete script that does everything from API key to on-chain verification in one shot:

```typescript
import { SilentVerifyClient } from '@kuberna/silentverify';
import { ethers } from 'ethers';

async function main() {
  const sv = new SilentVerifyClient({
    apiKey: process.env.SILENTVERIFY_API_KEY!,
  });

  // 1. Create DID
  const did = await sv.createDid({
    method: 'kuberna',
    agentName: 'MyFirstAgent',
    publicKey: process.env.AGENT_PUBLIC_KEY!,
  });

  // 2. Set capabilities
  await sv.setCapabilities(did.id, {
    capabilities: [
      {
        action: 'swap',
        chains: ['ethereum'],
        tokens: ['ETH', 'USDC'],
        maxAmount: '10000',
      },
    ],
  });

  // 3. Issue certificate
  const cert = await sv.issueCertificate(did.id, {
    algorithm: 'dilithium5',
    validityDays: 365,
  });

  console.log(`DID: ${did.id}`);
  console.log(`Certificate ID: ${cert.id}`);
  console.log(`On-chain anchor: ${cert.anchorTx}`);

  // 4. Bind EVM address
  const wallet = new ethers.Wallet(process.env.AGENT_KEY!);
  const signature = await wallet.signMessage(`Bind ${wallet.address} to ${did.id}`);

  await sv.bindAddress(did.id, {
    chain: 'ethereum',
    address: wallet.address,
    signature,
  });

  console.log('Done! Agent identity is live.');
}

main().catch(console.error);
```

---

### Why PQ Matters Now

NIST standardized Dilithium in 2024. ETSI released its first PQ standards in 2025. By 2028, most security frameworks will require PQ for any system making autonomous financial decisions.

Your agent will live longer than its first certificate. If you're building agent infrastructure today and ignoring PQ, you're building technical debt that will be expensive to fix.

Start with a free key. Get your agent a PQ certificate. It takes fifteen minutes.

The SDK is at [github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs) — the SilentVerify package is in `/packages/silentverify`. Docs, examples, and a Docker Compose for the verifier contract are all in the repo.

Questions? The Discord at [discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu) has a `#silentverify` channel where the team hangs out.

_Subscribe below. Next post: building a complete intent marketplace frontend with React + Wagmi — real components, real hooks, real contracts._
