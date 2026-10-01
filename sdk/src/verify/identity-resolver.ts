import { ethers } from 'ethers';
import type { Provider } from 'ethers';
import { jcsHash } from './jcs.js';
import type { AgentIdentityRecord, Executor } from './omworld-types.js';
import type { KubernaNormalizedIntent } from '../intent-types.js';

const REPUTATION_NFT_ABI = [
  'function agentIdentities(uint256 tokenId) view returns (address agentAddress, string name, string framework, uint256 registeredAt, uint256 lastActiveAt, uint256 totalEarnings, string metadataURI)',
  'function agentReputations(uint256 tokenId) view returns (uint256 totalTasks, uint256 successfulTasks)',
  'function calculateScore(uint256 tokenId) view returns (uint256)',
  'function getSuccessRate(uint256 tokenId) view returns (uint256)',
  'function getStarRating(uint256 tokenId) view returns (uint256)',
  'function getBadges(uint256 tokenId) view returns (tuple(string name, string description, uint256 earnedAt)[])',
  'function registerAgent(address agentAddress, string name, string framework, string metadataURI) returns (uint256)',
];

const KNOWN_DEPLOYMENTS: Record<number, string> = {
  84532: process.env.REPUTATION_NFT_BASE_SEPOLIA || '',
  11155111: process.env.REPUTATION_NFT_SEPOLIA || '',
};

export class IdentityResolver {
  private cache: Map<string, AgentIdentityRecord>;
  private expirations: Map<string, number>;
  private cacheTtl: number;

  constructor(cacheTtlMs: number = 300_000) {
    this.cache = new Map();
    this.expirations = new Map();
    this.cacheTtl = cacheTtlMs;
  }

  private contractAddress(chainId: number): string {
    const addr = KNOWN_DEPLOYMENTS[chainId];
    if (!addr) throw new Error(`No known ERC-8004 deployment for chain ID ${chainId}`);
    return addr;
  }

  private contract(provider: Provider, chainId: number): ethers.Contract {
    return new ethers.Contract(this.contractAddress(chainId), REPUTATION_NFT_ABI, provider);
  }

  private readCache(key: string): AgentIdentityRecord | undefined {
    const record = this.cache.get(key);
    if (!record) return undefined;

    const expiresAt = this.expirations.get(key);
    if (expiresAt === undefined || expiresAt <= Date.now()) {
      this.cache.delete(key);
      this.expirations.delete(key);
      return undefined;
    }

    return record;
  }

  async resolveAgent(
    tokenId: bigint,
    provider: Provider,
    chainId: number = 84532
  ): Promise<AgentIdentityRecord> {
    const cacheKey = `${chainId}:${tokenId.toString()}`;
    // Expiry is checked on read rather than via a setTimeout: a timer would
    // evict a re-fetched entry (deleting a fresher record) and would also keep
    // the event loop alive for the lifetime of every lookup.
    const cached = this.readCache(cacheKey);
    if (cached) return cached;

    const c = this.contract(provider, chainId);

    const [identityData, reputationData, score, successRate, starRating, badgeData] =
      await Promise.all([
        c.agentIdentities(tokenId),
        c.agentReputations(tokenId),
        c.calculateScore(tokenId),
        c.getSuccessRate(tokenId),
        c.getStarRating(tokenId),
        c.getBadges(tokenId),
      ]);

    const record: AgentIdentityRecord = {
      tokenId: tokenId.toString(),
      agentAddress: identityData.agentAddress,
      name: identityData.name,
      framework: identityData.framework,
      reputationScore: Number(score),
      successRate: Number(successRate),
      starRating: Number(starRating),
      badges: (badgeData ?? []).map((b: { name: string }) => b.name),
      totalTasks: Number(reputationData.totalTasks),
      successfulTasks: Number(reputationData.successfulTasks),
      metadataURI: identityData.metadataURI,
      chainId,
    };

    this.cache.set(cacheKey, record);
    this.expirations.set(cacheKey, Date.now() + this.cacheTtl);

    return record;
  }

  async produceExecutorCommitment(
    agentId: string,
    intentId: string,
    signer: ethers.Signer
  ): Promise<string> {
    const payload = JSON.stringify({ intent_id: intentId, agent_id: agentId });
    const hash = await jcsHash(JSON.parse(payload));
    // Sign the 32 raw digest bytes. signMessage() would otherwise take the hex
    // string, UTF-8 encode its characters and sign that instead, producing a
    // commitment no verifier could reproduce from the digest.
    const signature = await signer.signMessage(ethers.getBytes(hash));
    return signature;
  }

  buildExecutor(agentId: string, commitment?: string): Executor {
    return {
      agent_id: agentId,
      id_scheme: 'erc-8004',
      commitment,
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.expirations.clear();
  }
}

export function createIntentId(intent: Record<string, unknown>): Promise<string> {
  const rest = { ...intent };
  delete rest.id;
  delete rest.signature;
  return jcsHash(rest);
}

export function createNormalizedIntentId(intent: KubernaNormalizedIntent): Promise<string> {
  const obj = JSON.parse(JSON.stringify(intent, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
  return jcsHash(obj);
}
