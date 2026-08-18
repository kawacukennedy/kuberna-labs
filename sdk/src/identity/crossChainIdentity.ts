import { KubernaSDK } from '../index.js';
import { KubernaError } from '../errors.js';

export interface CrossChainIdentityConfig {
  baseUrl?: string;
}

export interface SolanaWalletMapping {
  solanaAddress: string;
  evmAddress?: string;
  agentName?: string;
  framework?: string;
}

export interface CrossChainIdentityRecord {
  id: string;
  agentId: string;
  solanaAddress: string | null;
  evmAddress: string | null;
  erc8004TokenId: string | null;
  erc8004ChainId: number | null;
  metadataUri: string | null;
  certificateId: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCertificateRecord {
  id: string;
  agentId: string;
  agentDid: string;
  certType: string;
  pubkeyFp: string;
  digest: string | null;
  previousDigest: string | null;
  ipfsHash: string | null;
  passportUri: string | null;
  chain: string | null;
  txHash: string | null;
  issuedAt: string;
  expiresAt: string | null;
}

export interface RegisterIdentityParams {
  solanaAddress: string;
  evmAddress?: string;
  agentName?: string;
  framework?: string;
}

export interface CertIssueResult {
  agentCert: Record<string, unknown>;
  evmAnchor: Record<string, unknown>;
  endorsementCert?: Record<string, unknown>;
  passportUri?: string;
}

export interface CrossChainBinding {
  chain: string;
  chain_id: string;
  address: string;
  fingerprint?: string;
}

export interface EndorsementResult {
  status: string;
  cert: Record<string, unknown>;
  pubkeyFp: string;
}

export interface PushMetadataResult {
  txHash: string;
  chainId: number;
  tokenId: string;
}

export class CrossChainIdentityManager {
  private baseURL: string;

  constructor(_sdk: KubernaSDK, config?: CrossChainIdentityConfig) {
    this.baseURL = config?.baseUrl || process.env.KUBERNA_API_URL || 'https://api.kuberna.africa/api';
  }

  private async request<T>(path: string, options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<T> {
    const resp = await fetch(`${this.baseURL}${path}`, {
      method: options?.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => resp.statusText);
      throw new KubernaError(`Cross-chain identity API error: ${detail}`, 'CROSS_CHAIN_IDENTITY_ERROR', resp.status);
    }
    return resp.json() as Promise<T>;
  }

  async registerIdentity(params: RegisterIdentityParams): Promise<CrossChainIdentityRecord> {
    return this.request<CrossChainIdentityRecord>('/identity/register', {
      method: 'POST',
      body: params,
    });
  }

  async getIdentity(agentId: string): Promise<CrossChainIdentityRecord> {
    return this.request<CrossChainIdentityRecord>(`/identity/${agentId}`);
  }

  async resolveBySolana(solanaAddress: string): Promise<CrossChainIdentityRecord> {
    return this.request<CrossChainIdentityRecord>(`/identity/solana/${solanaAddress}`);
  }

  async getCertificates(agentId: string): Promise<AgentCertificateRecord[]> {
    return this.request<AgentCertificateRecord[]>(`/identity/${agentId}/certificates`);
  }

  async issueCertificates(agentId: string, escrowId: string, chain: string, txHash: string, crossChainBindings?: CrossChainBinding[]): Promise<CertIssueResult> {
    return this.request<CertIssueResult>(`/identity/${agentId}/issue-certificates`, {
      method: 'POST',
      body: { escrowId, chain, txHash, crossChainBindings },
    });
  }

  async endorseCrossChain(agentId: string, boundKeys: CrossChainBinding[]): Promise<EndorsementResult> {
    return this.request<EndorsementResult>(`/identity/${agentId}/endorse-cross-chain`, {
      method: 'POST',
      body: { boundKeys },
    });
  }

  async pushMetadataUri(agentId: string, rpcUrl?: string): Promise<PushMetadataResult> {
    return this.request<PushMetadataResult>(`/identity/${agentId}/push-metadata-uri`, {
      method: 'POST',
      body: { rpcUrl },
    });
  }

  async verifyCert(certJson: Record<string, unknown>): Promise<{ valid: boolean; pubkeyFp?: string }> {
    return this.request<{ valid: boolean; pubkeyFp?: string }>('/identity/verify-cert', {
      method: 'POST',
      body: { cert: certJson },
    });
  }

  async getPassportUri(agentId: string): Promise<{ uri: string }> {
    return this.request<{ uri: string }>(`/identity/${agentId}/passport`);
  }
}
