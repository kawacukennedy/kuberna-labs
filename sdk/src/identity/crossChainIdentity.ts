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
  passportUri?: string;
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

  async issueCertificates(agentId: string, escrowId: string, chain: string, txHash: string): Promise<CertIssueResult> {
    return this.request<CertIssueResult>(`/identity/${agentId}/issue-certificates`, {
      method: 'POST',
      body: { escrowId, chain, txHash },
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
