import { ethers } from 'ethers';
import type { Provider, Signer } from 'ethers';

const VERIFIER_ROUTER_ABI = [
  'function verify(bytes32 attestationType, bytes calldata proof, bytes32 intentId) view returns (bool verified)',
  'function getVerifier(bytes32 attestationType) view returns (address verifierAddress, bool isActive)',
  'function registerVerifier(bytes32 attestationType, address verifier) external',
  'function pauseVerifier(bytes32 attestationType) external',
  'event VerifierRegistered(bytes32 indexed attestationType, address verifier)',
  'event VerifierPaused(bytes32 indexed attestationType)',
  'event ProofVerified(bytes32 indexed intentId, bytes32 indexed attestationType, bool success)',
];

export class VerifierRouterClient {
  private contract: ethers.Contract;

  constructor(address: string, providerOrSigner: Provider | Signer) {
    this.contract = new ethers.Contract(address, VERIFIER_ROUTER_ABI, providerOrSigner);
  }

  async verify(
    attestationType: string,
    proof: string,
    intentId: string
  ): Promise<boolean> {
    const attestationHash = ethers.keccak256(ethers.toUtf8Bytes(attestationType));
    const proofBytes = toBytes(proof);
    // verify() is a read: call it statically so a read-only Provider works and
    // the resolved value is the boolean result rather than a transaction.
    return (await this.contract.verify.staticCall(attestationHash, proofBytes, intentId)) as boolean;
  }

  async getVerifier(attestationType: string): Promise<{ address: string; isActive: boolean }> {
    const attestationHash = ethers.keccak256(ethers.toUtf8Bytes(attestationType));
    const result = await this.contract.getVerifier(attestationHash);
    return { address: result.verifierAddress, isActive: result.isActive };
  }

  async registerVerifier(
    attestationType: string,
    verifierAddress: string,
    signer: Signer
  ): Promise<string> {
    const contractWithSigner = this.contract.connect(signer) as ethers.Contract;
    const attestationHash = ethers.keccak256(ethers.toUtf8Bytes(attestationType));
    const tx = await contractWithSigner.registerVerifier(attestationHash, verifierAddress);
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('registerVerifier transaction was not mined');
    }
    return receipt.hash;
  }

  async pauseVerifier(
    attestationType: string,
    signer: Signer
  ): Promise<string> {
    const contractWithSigner = this.contract.connect(signer) as ethers.Contract;
    const attestationHash = ethers.keccak256(ethers.toUtf8Bytes(attestationType));
    const tx = await contractWithSigner.pauseVerifier(attestationHash);
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('pauseVerifier transaction was not mined');
    }
    return receipt.hash;
  }

  static attestationTypeHash(attestationType: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(attestationType));
  }
}

/**
 * Converts a proof to bytes for a `bytes` argument.
 *
 * A hex proof (the usual case) must be decoded with getBytes; passing it to
 * toUtf8Bytes would encode the literal characters "0x1a2b..." instead.
 */
function toBytes(value: string | Uint8Array): Uint8Array {
  if (typeof value !== 'string') {
    return value;
  }
  return value.startsWith('0x') ? ethers.getBytes(value) : ethers.toUtf8Bytes(value);
}
