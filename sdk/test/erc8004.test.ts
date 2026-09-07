import { MandateBuilder, verifyMandateSignature } from '../src/verify/mandate.js';
import { kubernaToOmWorld, computeIntentId } from '../src/verify/intent-translator.js';
import { ExecutionProofBuilder, createStep } from '../src/verify/execution-proof.js';
import { IdentityResolver } from '../src/verify/identity-resolver.js';
import { Erc8004Adapter } from '../src/verify/erc8004-adapter.js';

describe('ERC-8004 SDK edge cases', () => {
  describe('Mandate signing and verification', () => {
    it('accepts a mandate with a non-empty signature', async () => {
      const builder = new MandateBuilder();

      const mandate = await builder.build({
        intentId: 'intent-1',
        agent: 'agent-1',
        plan: 'execute swap',
        deadline: new Date(Date.now() + 60_000).toISOString(),
        sign: async () => '0xsignature',
      });

      expect(mandate.signature).toBe('0xsignature');
      expect(verifyMandateSignature(mandate)).toBe(true);
    });

    it('rejects a mandate with an empty signature', () => {
      expect(
        verifyMandateSignature({
          spec_version: '0.2.0',
          intent_id: 'intent-1',
          agent: 'agent-1',
          agent_scheme: 'erc-8004',
          plan_hash: '0x00',
          bond: '0',
          fee_quote: '0',
          tools_declared: [],
          deadline: new Date(Date.now() + 60_000).toISOString(),
          issued_at: new Date().toISOString(),
          signature: '',
        })
      ).toBe(false);
    });
  });

  describe('Intent translation', () => {
    it('translates a valid Kuberna intent', () => {
      const intent = kubernaToOmWorld({
        standard: 'kuberna',
        originalFormat: 'kuberna',
        nonce: 'nonce-1',
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
        swapper: '0x123',
        originChainId: BigInt(1),
        destinationChainId: BigInt(8453),
        originToken: 'ETH',
        originAmount: BigInt(1),
        destinationToken: 'USDC',
        destinationAmount: BigInt(3000),
        destinationRecipient: '0x456',
        signer: '0x123',
        fillDeadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
        message: 'swap',
        attestationRequired: false,
      });

      expect(intent.principal).toBe('0x123');
      expect(intent.nonce).toBe('nonce-1');
      expect(intent.body).toContain('ETH');
      expect(intent.body).toContain('USDC');
    });

    it('fails gracefully for malformed deadline input', () => {
      expect(() =>
        kubernaToOmWorld({
          standard: 'kuberna',
          originalFormat: 'kuberna',
          nonce: 'nonce-1',
          deadline: 'not-a-number' as unknown as bigint,
          swapper: '0x123',
          originChainId: BigInt(1),
          destinationChainId: BigInt(8453),
          originToken: 'ETH',
          originAmount: BigInt(1),
          destinationToken: 'USDC',
          destinationAmount: BigInt(3000),
          destinationRecipient: '0x456',
          signer: '0x123',
          fillDeadline: BigInt(1),
          message: 'swap',
          attestationRequired: false,
        })
      ).toThrow();
    });

    it('produces a deterministic intent id', async () => {
      const intent = kubernaToOmWorld({
        standard: 'kuberna',
        originalFormat: 'kuberna',
        nonce: 'nonce-1',
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
        swapper: '0x123',
        originChainId: BigInt(1),
        destinationChainId: BigInt(8453),
        originToken: 'ETH',
        originAmount: BigInt(1),
        destinationToken: 'USDC',
        destinationAmount: BigInt(3000),
        destinationRecipient: '0x456',
        signer: '0x123',
        fillDeadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
        message: 'swap',
        attestationRequired: false,
      });

      const id1 = await computeIntentId(intent);
      const id2 = await computeIntentId(intent);

      expect(id1).toBe(id2);
      expect(id1).toMatch(/^0x[0-9a-f]{64}$/);
    });
  });

  describe('Execution proof integrity', () => {
    it('builds a valid proof with chained step hashes', async () => {



      const builder = new ExecutionProofBuilder();

      const proof = await builder.build({
        intentId: 'intent-1',
        mandateId: 'mandate-1',
        plan: 'execute swap',
        steps: [
          createStep({
            index: 0,
            tool: 'swap',
            input: { amount: 1 },
            output: { tx: '0xabc' },
          }),
        ],
      });

      expect(proof.steps).toHaveLength(1);
      expect(proof.steps[0].prev_hash).toBe('0x' + '0'.repeat(64));
      expect(proof.steps[0].input_hash).toBeTruthy();
      expect(proof.steps[0].output_hash).toBeTruthy();
    });

    it('detects a tampered step output', async () => {
      const builder = new ExecutionProofBuilder();

      const proof = await builder.build({
        intentId: 'intent-1',
        mandateId: 'mandate-1',
        plan: 'execute swap',
        steps: [
          createStep({
            index: 0,
            tool: 'swap',
            input: { amount: 1 },
            output: { tx: '0xabc' },
          }),
        ],
      });

      const originalHash = proof.steps[0].output_hash;

      proof.steps[0].output = { tx: '0xtampered' };

      const recomputedHash = await builder.computeStepHash(proof.steps[0]);

      expect(recomputedHash).not.toBe(originalHash);
    });
    it("delegates valid and tampered proofs to the verifier router", async () => {
      const adapter = new Erc8004Adapter();
      const verify = jest.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      Object.defineProperty(adapter, "verifierRouter", {
        value: { verify },
        writable: true,
      });

      await expect(
        adapter.verifyProof("tee", "valid-proof", "intent-1")
      ).resolves.toBe(true);

      await expect(
        adapter.verifyProof("tee", "tampered-proof", "intent-1")
      ).resolves.toBe(false);

      expect(verify).toHaveBeenNthCalledWith(
        1,
        "tee",
        "valid-proof",
        "intent-1"
      );
      expect(verify).toHaveBeenNthCalledWith(
        2,
        "tee",
        "tampered-proof",
        "intent-1"
      );
    });
  });

  describe('Identity resolver', () => {
    it('throws when no deployment exists for an unknown chain', async () => {
      const resolver = new IdentityResolver();

      await expect(
        resolver.resolveAgent(BigInt(1), {} as any, 999999)
      ).rejects.toThrow('No known ERC-8004 deployment');
    });

    it('clears cached identities', () => {
      const resolver = new IdentityResolver();

      expect(() => resolver.clearCache()).not.toThrow();
    });
  });

});
