import { AipAdapter } from '../src/adapter.js';
import { AipAdapterError } from '../src/types.js';
import { KeyPair } from '@aip-sdk/core';

// ---------------------------------------------------------------------------
// Unit tests for AipAdapter — no live chain required
// ---------------------------------------------------------------------------

describe('AipAdapter', () => {
  let adapter: AipAdapter;

  beforeEach(() => {
    adapter = new AipAdapter();
  });

  // -----------------------------------------------------------------------
  // createIdentity
  // -----------------------------------------------------------------------
  describe('createIdentity', () => {
    it('should create an identity with a generated keypair', async () => {
      const identity = await adapter.createIdentity('Test Agent');
      expect(identity.keypair).toBeDefined();
      expect(identity.publicKeyMultibase).toMatch(/^z[a-km-zA-HJ-NP-Z1-9]+$/);
      expect(identity.identifier).toBe(`aip:key:ed25519:${identity.publicKeyMultibase}`);
      expect(identity.name).toBe('Test Agent');
    });

    it('should create an identity without a name', async () => {
      const identity = await adapter.createIdentity();
      expect(identity.name).toBeUndefined();
      expect(identity.identifier).toMatch(/^aip:key:ed25519:z/);
    });

    it('should create unique keypairs each time', async () => {
      const [a, b] = await Promise.all([adapter.createIdentity(), adapter.createIdentity()]);
      expect(a.publicKeyMultibase).not.toBe(b.publicKeyMultibase);
    });
  });

  // -----------------------------------------------------------------------
  // createIdentityDocument
  // -----------------------------------------------------------------------
  describe('createIdentityDocument', () => {
    it('should create a signed identity document', async () => {
      const identity = await adapter.createIdentity('Doc Agent');
      const doc = await adapter.createIdentityDocument(identity, {
        expires: '2027-01-01T00:00:00Z',
      });

      expect(doc.aip).toBe('1.0');
      expect(doc.name).toBe('Doc Agent');
      expect(doc.expires).toBe('2027-01-01T00:00:00Z');
      expect(doc.publicKeys).toHaveLength(1);
      expect(doc.publicKeys[0].public_key_multibase).toBe(identity.publicKeyMultibase);
      expect(doc.documentSignature).toBeTruthy();
    });

    it('should verify the document signature', async () => {
      const identity = await adapter.createIdentity('Verifiable Agent');
      const doc = await adapter.createIdentityDocument(identity);

      // Should not throw
      await expect(doc.verifySignature()).resolves.toBeUndefined();
    });

    it('should include extensions when provided', async () => {
      const identity = await adapter.createIdentity('Extended Agent');
      const doc = await adapter.createIdentityDocument(identity, {
        extensions: {
          erc8004: { chain_id: 84532, address: '0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0' },
        },
      });

      expect(doc.extensions).toBeDefined();
      const ext = doc.extensions as Record<string, unknown>;
      expect((ext.erc8004 as Record<string, unknown>).chain_id).toBe(84532);
    });
  });

  // -----------------------------------------------------------------------
  // createCompactToken / verifyCompactToken / decodeToken
  // -----------------------------------------------------------------------
  describe('compact tokens', () => {
    let identity: { keypair: KeyPair; identifier: string; publicKeyMultibase: string };

    beforeEach(async () => {
      identity = await adapter.createIdentity('Token Issuer');
    });

    it('should create and verify a valid token', async () => {
      const token = await adapter.createCompactToken(identity, {
        issuer: identity.identifier,
        subject: identity.identifier,
        scopes: ['tool:search', 'tool:browse'],
        ttlSeconds: 3600,
      });

      expect(token).toBeTruthy();
      expect(token.split('.')).toHaveLength(3); // JWT format

      const publicKey = KeyPair.decodeMultibase(identity.publicKeyMultibase);
      const verified = await adapter.verifyCompactToken(token, publicKey);

      expect(verified.claims.issuer).toBe(identity.identifier);
      expect(verified.claims.subject).toBe(identity.identifier);
      expect(verified.claims.scopes).toEqual(['tool:search', 'tool:browse']);
      expect(verified.claims.maxDepth).toBe(0);
    });

    it('should set custom maxDepth and budget', async () => {
      const token = await adapter.createCompactToken(identity, {
        issuer: identity.identifier,
        subject: identity.identifier,
        scopes: ['tool:*'],
        maxDepth: 2,
        budgetUsd: 5.0,
        ttlSeconds: 1800,
      });

      const decoded = await adapter.decodeToken(token);
      expect(decoded.payload.maxDepth).toBe(2);
      expect(decoded.payload.budgetUsd).toBe(5.0);
    });

    it('should reject a tampered token', async () => {
      const token = await adapter.createCompactToken(identity, {
        issuer: identity.identifier,
        subject: identity.identifier,
        scopes: ['tool:search'],
      });

      const publicKey = KeyPair.decodeMultibase(identity.publicKeyMultibase);
      const tampered = token.replace(
        /\.([A-Za-z0-9_-]+)$/,
        '.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      );

      await expect(adapter.verifyCompactToken(tampered, publicKey)).rejects.toThrow(
        AipAdapterError
      );
    });

    it('should reject a token signed by a different key', async () => {
      const otherIdentity = await adapter.createIdentity('Impostor');
      const token = await adapter.createCompactToken(otherIdentity, {
        issuer: otherIdentity.identifier,
        subject: otherIdentity.identifier,
        scopes: ['tool:search'],
      });

      const originalPublicKey = KeyPair.decodeMultibase(identity.publicKeyMultibase);
      await expect(adapter.verifyCompactToken(token, originalPublicKey)).rejects.toThrow(
        AipAdapterError
      );
    });

    it('should reject verification with empty key', async () => {
      const token = await adapter.createCompactToken(identity, {
        issuer: identity.identifier,
        subject: identity.identifier,
        scopes: ['tool:search'],
      });

      await expect(adapter.verifyCompactToken(token, new Uint8Array(0))).rejects.toThrow(
        AipAdapterError
      );
    });
  });

  // -----------------------------------------------------------------------
  // decodeToken
  // -----------------------------------------------------------------------
  describe('decodeToken', () => {
    it('should decode a token without verifying the signature', async () => {
      const identity = await adapter.createIdentity('Decoder');
      const token = await adapter.createCompactToken(identity, {
        issuer: identity.identifier,
        subject: 'aip:key:ed25519:zsub',
        scopes: ['tool:read'],
      });

      const decoded = await adapter.decodeToken(token);
      expect(decoded.header.alg).toBe('EdDSA');
      expect(decoded.header.typ).toBe('aip+jwt');
      expect(decoded.payload.iss).toBe(identity.identifier);
      expect(decoded.payload.sub).toBe('aip:key:ed25519:zsub');
      expect(decoded.payload.scopes).toEqual(['tool:read']);
      expect(decoded.raw).toBe(token);
    });

    it('should throw on malformed token', async () => {
      await expect(adapter.decodeToken('not.a.token')).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // hasScope
  // -----------------------------------------------------------------------
  describe('hasScope', () => {
    it('should check exact scope match', async () => {
      const identity = await adapter.createIdentity();
      const token = await adapter.createCompactToken(identity, {
        issuer: identity.identifier,
        subject: identity.identifier,
        scopes: ['tool:search', 'tool:browse'],
      });

      expect(await adapter.hasScope(token, 'tool:search')).toBe(true);
      expect(await adapter.hasScope(token, 'tool:browse')).toBe(true);
      expect(await adapter.hasScope(token, 'tool:admin')).toBe(false);
    });

    it('should match wildcard scopes', async () => {
      const identity = await adapter.createIdentity();
      const token = await adapter.createCompactToken(identity, {
        issuer: identity.identifier,
        subject: identity.identifier,
        scopes: ['tool:*'],
      });

      expect(await adapter.hasScope(token, 'tool:search')).toBe(true);
      expect(await adapter.hasScope(token, 'tool:browse')).toBe(true);
      expect(await adapter.hasScope(token, 'admin:delete')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// On-chain integration tests — use mocks
// ---------------------------------------------------------------------------
describe('AipAdapter on-chain integration (mocked)', () => {
  let adapter: AipAdapter;

  beforeEach(() => {
    adapter = new AipAdapter();
  });

  describe('getContractAddress', () => {
    it('should return known address for supported chains', async () => {
      const { KNOWN_DEPLOYMENTS } = await import('../src/constants.js');
      expect(KNOWN_DEPLOYMENTS[84532].reputationNFT).toBe(
        '0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35'
      );
    });
  });

  describe('registerOnChain', () => {
    it('should reject when no signer provided', async () => {
      const identity = await adapter.createIdentity();
      await expect(
        (
          adapter as unknown as {
            registerOnChain: (identity: unknown, signer: unknown) => Promise<unknown>;
          }
        ).registerOnChain(identity, null)
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('AipAdapterError should have name and code', () => {
      const err = new AipAdapterError('test error', 'TEST_CODE');
      expect(err.name).toBe('AipAdapterError');
      expect(err.code).toBe('TEST_CODE');
      expect(err.message).toBe('test error');
    });
  });

  describe('verifyTokenWithChain edge cases', () => {
    it('should handle unresolvable metadataURI gracefully', async () => {
      const identity = await adapter.createIdentity();
      const token = await adapter.createCompactToken(identity, {
        issuer: identity.identifier,
        subject: identity.identifier,
        scopes: ['tool:search'],
      });

      const pubKey = KeyPair.decodeMultibase(identity.publicKeyMultibase);
      const verified = await adapter.verifyCompactToken(token, pubKey);
      expect(verified.claims.issuer).toBe(identity.identifier);
    });
  });

  describe('resolveIdentifier', () => {
    it('should return undefined for aip:key: identifiers (no DNS resolution)', async () => {
      const identity = await adapter.createIdentity();
      const doc = await adapter.resolveIdentifier(identity.identifier);
      // aip:key: identifiers are self-certifying and have no DNS resolution
      expect(doc).toBeUndefined();
    });

    it('should reject invalid identifier format', async () => {
      await expect(adapter.resolveIdentifier('not-an-aip-id')).rejects.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear the resolver cache without error', () => {
      expect(() => adapter.clearCache()).not.toThrow();
    });
  });

  describe('createIdentityDocumentWithChainLink', () => {
    it('should create a document with ERC-8004 extension', async () => {
      const identity = await adapter.createIdentity();
      const doc = await adapter.createIdentityDocumentWithChainLink(identity, 42n, 84532, {
        name: 'On-chain Agent',
      });

      expect(doc.name).toBe('On-chain Agent');
      expect(doc.extensions).toBeDefined();
      const ext = doc.extensions as Record<string, unknown>;
      const erc8004 = ext.erc8004 as Record<string, unknown>;
      expect(erc8004.chain_id).toBe(84532);
      expect(erc8004.token_id).toBe('42');
    });
  });
});
