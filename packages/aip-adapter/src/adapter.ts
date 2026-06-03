import { KeyPair, AipId, IdentityDocument, IdentityResolver } from '@aip-sdk/core';
import { CompactToken, TokenError } from '@aip-sdk/token';
import { ethers } from 'ethers';
import type { Provider, Signer } from 'ethers';

import { DEFAULT_CHAIN_ID, KNOWN_DEPLOYMENTS, REPUTATION_NFT_ABI } from './constants.js';
import type {
  AipAdapterConfig,
  AipIdentity,
  ChainVerification,
  DecodedToken,
  DocOptions,
  OnChainIdentity,
  OnChainRegistration,
  RegisterOptions,
  ReputationInfo,
  TokenClaimsOptions,
  VerifiedToken,
} from './types.js';
import { AipAdapterError } from './types.js';

function aipIdToPublicKeyBytes(identifier: string): Uint8Array | null {
  try {
    const parsed = AipId.parse(identifier);
    if (parsed.publicKeyMultibase) {
      return KeyPair.decodeMultibase(parsed.publicKeyMultibase);
    }
    return null;
  } catch {
    return null;
  }
}

export class AipAdapter {
  private readonly resolver: IdentityResolver;
  private readonly defaultChainId: number;
  private readonly contractAddress?: string;

  constructor(config?: AipAdapterConfig) {
    this.resolver = new IdentityResolver({ cacheTtlMs: 300_000 });
    this.defaultChainId = config?.defaultChainId ?? DEFAULT_CHAIN_ID;
    this.contractAddress = config?.contractAddress;
  }

  private getContractAddress(chainId: number): string {
    if (this.contractAddress) return this.contractAddress;
    const deployment = KNOWN_DEPLOYMENTS[chainId];
    if (!deployment) {
      throw new AipAdapterError(
        `No known ERC-8004 deployment for chain ID ${chainId}; ` +
          'pass a custom contractAddress in AipAdapterConfig',
        'UNSUPPORTED_CHAIN'
      );
    }
    return deployment.reputationNFT;
  }

  private getContract(providerOrSigner: Provider | Signer, chainId?: number): ethers.Contract {
    const cid = chainId ?? this.defaultChainId;
    const address = this.getContractAddress(cid);
    return new ethers.Contract(address, REPUTATION_NFT_ABI, providerOrSigner);
  }

  async createIdentity(name?: string): Promise<AipIdentity> {
    const keypair = await KeyPair.generate();
    const publicKeyMultibase = keypair.publicKeyMultibase();
    return {
      keypair,
      identifier: `aip:key:ed25519:${publicKeyMultibase}`,
      publicKeyMultibase,
      name,
    };
  }

  async createIdentityDocument(
    identity: AipIdentity,
    options?: DocOptions
  ): Promise<IdentityDocument> {
    const extensions: Record<string, unknown> = {};
    if (options?.extensions) {
      Object.assign(extensions, options.extensions);
    }

    const doc = await IdentityDocument.create(identity.keypair, {
      name: options?.name ?? identity.name,
      expires: options?.expires,
      extensions,
    });

    return doc;
  }

  async registerOnChain(
    identity: AipIdentity,
    signer: Signer,
    options?: RegisterOptions & { chainId?: number }
  ): Promise<OnChainRegistration> {
    const chainId = options?.chainId ?? this.defaultChainId;
    const contract = this.getContract(signer, chainId);

    const agentAddress = await signer.getAddress();
    const name = identity.name || 'AIP Agent';
    const framework = options?.framework ?? 'aip';

    const doc = await IdentityDocument.create(identity.keypair, { name });
    const docJson = JSON.stringify(doc.toJSON());
    const metadataURI = options?.metadataURI ?? `data:application/json,${encodeURIComponent(docJson)}`;

    const tx = await contract.registerAgent(agentAddress, name, framework, metadataURI);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new AipAdapterError('Transaction submission returned no receipt', 'TX_FAILED');
    }

    const parsedLog = parseRegistrationLog(receipt, contract);
    return {
      tokenId: parsedLog.tokenId,
      agentAddress,
      transactionHash: receipt.hash,
    };
  }

  async updateMetadataURI(
    tokenId: bigint,
    metadataURI: string,
    signer: Signer,
    chainId?: number
  ): Promise<string> {
    const contract = this.getContract(signer, chainId);
    const tx = await contract.setAgentMetadataURI(tokenId, metadataURI);
    const receipt = await tx.wait();
    if (!receipt) {
      throw new AipAdapterError('Transaction submission returned no receipt', 'TX_FAILED');
    }
    return receipt.hash;
  }

  async resolveOnChain(
    tokenId: bigint,
    provider: Provider,
    chainId?: number
  ): Promise<OnChainIdentity> {
    const contract = this.getContract(provider, chainId);
    const identityData = await contract.agentIdentities(tokenId);

    const [agentAddress, name, framework, registeredAt, lastActiveAt, totalEarnings, metadataURI] =
      identityData;

    return {
      tokenId,
      agentAddress,
      name,
      framework,
      metadataURI,
      registeredAt: new Date(Number(registeredAt) * 1000),
      lastActiveAt: new Date(Number(lastActiveAt) * 1000),
      totalEarnings,
    };
  }

  async createCompactToken(
    identity: AipIdentity,
    claims: TokenClaimsOptions
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const ttl = claims.ttlSeconds ?? 3600;

    const aipClaims = {
      iss: claims.issuer,
      sub: claims.subject,
      scope: claims.scopes,
      budget_usd: claims.budgetUsd,
      max_depth: claims.maxDepth ?? 0,
      iat: now,
      exp: now + ttl,
    };

    return CompactToken.create(aipClaims, identity.keypair);
  }

  async decodeToken(token: string): Promise<DecodedToken> {
    try {
      const header = CompactToken.decodeHeader(token);
      const payload = token.split('.')[1];
      if (!payload) {
        throw new AipAdapterError('Malformed JWT: no payload', 'TOKEN_MALFORMED');
      }
      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf-8')
      );
      return {
        header,
        payload: {
          iss: decoded.iss,
          sub: decoded.sub,
          scopes: decoded.scope ?? [],
          maxDepth: decoded.max_depth ?? 0,
          issuedAt: new Date((decoded.iat ?? 0) * 1000),
          expiresAt: new Date((decoded.exp ?? 0) * 1000),
          budgetUsd: decoded.budget_usd,
        },
        raw: token,
      };
    } catch (err) {
      if (err instanceof AipAdapterError) throw err;
      throw new AipAdapterError(
        err instanceof Error ? err.message : 'Failed to decode token',
        'DECODE_FAILED'
      );
    }
  }

  async verifyCompactToken(
    token: string,
    publicKeyBytes: Uint8Array
  ): Promise<VerifiedToken> {
    if (publicKeyBytes.length === 0) {
      throw new AipAdapterError(
        'publicKeyBytes is required for signature verification',
        'KEY_REQUIRED'
      );
    }
    try {
      const compactToken = await CompactToken.verify(token, publicKeyBytes);
      return {
        claims: {
          issuer: compactToken.claims.iss,
          subject: compactToken.claims.sub,
          scopes: [...compactToken.claims.scope],
          maxDepth: compactToken.claims.max_depth,
          issuedAt: new Date(compactToken.claims.iat * 1000),
          expiresAt: new Date(compactToken.claims.exp * 1000),
          budgetUsd: compactToken.claims.budget_usd,
        },
        raw: token,
      };
    } catch (err) {
      if (err instanceof TokenError) {
        throw new AipAdapterError(err.message, err.code);
      }
      throw new AipAdapterError(
        err instanceof Error ? err.message : 'Token verification failed',
        'VERIFY_FAILED'
      );
    }
  }

  async hasScope(token: string, scope: string): Promise<boolean> {
    const decoded = await this.decodeToken(token);
    return decoded.payload.scopes.some(
      (s) => s === scope || (s.endsWith('*') && scope.startsWith(s.slice(0, -1)))
    );
  }

  async verifyTokenWithChain(
    token: string,
    tokenId: bigint,
    provider: Provider,
    chainId?: number
  ): Promise<ChainVerification> {
    const contract = this.getContract(provider, chainId);

    const [reputation, identityResult, score, successRate, starRating, badgeData] =
      await Promise.all([
        contract.agentReputations(tokenId),
        contract.agentIdentities(tokenId),
        contract.calculateScore(tokenId),
        contract.getSuccessRate(tokenId),
        contract.getStarRating(tokenId),
        contract.getBadges(tokenId),
      ]);

    const totalTasks: bigint = reputation.totalTasks ?? reputation[0];
    const successfulTasks: bigint = reputation.successfulTasks ?? reputation[1];
    const badges: string[] = (badgeData ?? []).map((b: { name: string }) => b.name);
    const metadataURI: string = typeof identityResult[6] === 'string' ? identityResult[6] : '';

    const reputationInfo: ReputationInfo = {
      tokenId,
      score,
      successRate,
      starRating,
      badges,
      totalTasks,
      successfulTasks,
    };

    let publicKeyBytes: Uint8Array | null = null;
    if (metadataURI?.startsWith('aip:key:')) {
      publicKeyBytes = aipIdToPublicKeyBytes(metadataURI);
    }
    if (!publicKeyBytes && metadataURI?.startsWith('data:application/json,')) {
      try {
        const jsonStr = decodeURIComponent(metadataURI.slice('data:application/json,'.length));
        const parsed = JSON.parse(jsonStr);
        const keyEntry = parsed.public_keys?.[0];
        if (keyEntry?.public_key_multibase) {
          publicKeyBytes = aipIdToPublicKeyBytes(
            `aip:key:ed25519:${keyEntry.public_key_multibase}`
          );
        }
      } catch {
        // metadataURI not parseable, skip public key extraction
      }
    }

    try {
      if (!publicKeyBytes) {
        return {
          verified: false,
          token: null as unknown as VerifiedToken,
          reputation: reputationInfo,
          error: 'No public key found in on-chain metadataURI',
        };
      }
      const verifiedToken = await this.verifyCompactToken(token, publicKeyBytes);
      return {
        verified: true,
        token: verifiedToken,
        reputation: reputationInfo,
      };
    } catch (err) {
      return {
        verified: false,
        token: null as unknown as VerifiedToken,
        reputation: reputationInfo,
        error: err instanceof Error ? err.message : 'Token verification failed',
      };
    }
  }

  async getReputation(
    tokenId: bigint,
    provider: Provider,
    chainId?: number
  ): Promise<ReputationInfo> {
    const contract = this.getContract(provider, chainId);

    const [score, successRate, starRating, badgeData, reputation] = await Promise.all([
      contract.calculateScore(tokenId),
      contract.getSuccessRate(tokenId),
      contract.getStarRating(tokenId),
      contract.getBadges(tokenId),
      contract.agentReputations(tokenId),
    ]);

    const badges: string[] = (badgeData ?? []).map((b: { name: string }) => b.name);
    const [totalTasks, successfulTasks] = [reputation.totalTasks, reputation.successfulTasks];

    return {
      tokenId,
      score,
      successRate,
      starRating,
      badges,
      totalTasks,
      successfulTasks,
    };
  }

  async resolveIdentifier(identifier: string): Promise<IdentityDocument | undefined> {
    const aipId = AipId.parse(identifier);
    return this.resolver.resolve(aipId);
  }

  async createIdentityDocumentWithChainLink(
    identity: AipIdentity,
    tokenId: bigint,
    chainId: number,
    options?: Omit<DocOptions, 'extensions'>
  ): Promise<IdentityDocument> {
    const extensions: Record<string, unknown> = {
      erc8004: {
        chain_id: chainId,
        token_id: tokenId.toString(),
      },
    };

    return this.createIdentityDocument(identity, {
      ...options,
      extensions,
    });
  }

  clearCache(): void {
    this.resolver.clearCache();
  }
}

function parseRegistrationLog(
  receipt: ethers.ContractTransactionReceipt,
  contract: ethers.Contract
): { tokenId: bigint } {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (parsed?.name === 'AgentRegistered') {
        const tokenId: bigint =
          parsed.args.tokenId ?? parsed.args[0];
        return { tokenId };
      }
    } catch {
      continue;
    }
  }
  throw new AipAdapterError(
    'AgentRegistered event not found in transaction receipt',
    'EVENT_NOT_FOUND'
  );
}
