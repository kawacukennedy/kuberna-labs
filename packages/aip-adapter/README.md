# @kuberna/aip-adapter

Bridge between [AIP (Agent Identity Protocol)](https://github.com/sunilp/aip) and ERC-8004 on-chain agent identity registry.

## Installation

```bash
npm install @kuberna/aip-adapter
```

## Usage

```typescript
import { AipAdapter } from '@kuberna/aip-adapter';
import { ethers } from 'ethers';

const adapter = new AipAdapter();

// Create an AIP identity
const identity = await adapter.createIdentity('My Agent');

// Register the identity on-chain via ERC-8004
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const signer = new ethers.Wallet('0x...', provider);
const registration = await adapter.registerOnChain(identity, signer);

// Create an AIP identity document linked to the on-chain record
const doc = await adapter.createIdentityDocumentWithChainLink(
  identity,
  registration.tokenId,
  84532,
);

// Create and verify AIP compact tokens
const token = await adapter.createCompactToken(identity, {
  issuer: identity.identifier,
  subject: identity.identifier,
  scopes: ['tool:search', 'tool:browse'],
});
const verified = await adapter.verifyCompactToken(token, publicKeyBytes);

// Verify an AIP token against on-chain reputation
const chainVerification = await adapter.verifyTokenWithChain(token, registration.tokenId, provider);
```

## AIPOU fixture interoperability

The adapter includes a small offline helper for the public AIPOU/Kuberna
conformance fixtures. It verifies the closed-world boundary between a
`chain_derivable + delegation-scope-v1` authority and an
`issuer_asserted + aipou-receipt-v1` work reference.

```typescript
import { deriveAipouAuthorityFactId, verifyAipouAuthorityWorkCase } from '@kuberna/aip-adapter';

const factId = deriveAipouAuthorityFactId(delegationScope);
const verdict = verifyAipouAuthorityWorkCase(conformanceCase);
```

`deriveAipouAuthorityFactId` derives the fixture's JCS/SHA-256 fact ID after
excluding its envelope-only `version` field. The verifier accepts the pinned
positive fixture and rejects a changed fact link or issuer-asserted collector
fields placed on a chain-derived authority.

This is structural conformance evidence only. It does not verify the fixture's
synthetic signature, resolve a registry, prove that an external action happened,
or create authority, payment, claim, reward, or token-settlement rights.

## API

### `AipAdapter`

| Method                                                                      | Description                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------- |
| `createIdentity(name?)`                                                     | Generate a new Ed25519 keypair and AIP identity   |
| `createIdentityDocument(identity, options?)`                                | Create a signed AIP identity document             |
| `createIdentityDocumentWithChainLink(identity, tokenId, chainId, options?)` | Create identity doc with ERC-8004 extension       |
| `registerOnChain(identity, signer, options?)`                               | Register agent on ERC-8004 contract               |
| `resolveOnChain(tokenId, provider)`                                         | Resolve on-chain registration to identity info    |
| `updateMetadataURI(tokenId, uri, signer)`                                   | Update on-chain metadata URI                      |
| `createCompactToken(identity, claims)`                                      | Create a signed AIP compact token (JWT)           |
| `verifyCompactToken(token, publicKey)`                                      | Verify an AIP token's Ed25519 signature           |
| `decodeToken(token)`                                                        | Decode token without verifying signature          |
| `hasScope(token, scope)`                                                    | Check if token grants a specific scope            |
| `verifyTokenWithChain(token, tokenId, provider)`                            | Verify token + check on-chain reputation          |
| `getReputation(tokenId, provider)`                                          | Query on-chain reputation (score, badges, rating) |
| `resolveIdentifier(identifier)`                                             | Resolve an AIP identifier to an identity document |
| `clearCache()`                                                              | Clear the identity resolver cache                 |
| `deriveAipouAuthorityFactId(scope)`                                         | Derive a fixture delegation-scope fact ID         |
| `verifyAipouAuthorityWorkCase(case)`                                        | Verify the AIPOU authority/work boundary          |

## License

MIT
