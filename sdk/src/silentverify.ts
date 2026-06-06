import { KubernaSDK } from './index.js';
import { KubernaError } from './errors.js';

export interface SilentVerifyConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface AgentCertIssueRequest {
  agentDid: string;
  capabilities?: Record<string, unknown>;
  reputationHash?: string | null;
  anchor?: Record<string, unknown> | null;
  expiresInDays?: number;
  previousCertDigest?: string | null;
  taskContext?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export interface StateCertIssueRequest {
  chainId?: string;
  blockHeight?: number;
  stateRootHex?: string;
  metadata?: Record<string, unknown>;
}

export interface CertIssueResponse {
  status: string;
  cert: StateCertWire;
  pubkeyFp: string;
}

export interface CertVerifyResponse {
  valid: boolean;
  pubkeyFp?: string | null;
  certType?: string | null;
  detail?: string | null;
}

export interface StateCertWire {
  schemaVersion?: string;
  q: number;
  o: number;
  v: number;
  digestY: number[];
  sigma: number[];
  publicKey: PublicKeyWire;
  pubkeyFp: string;
  metadata?: Record<string, unknown> | null;
  messageSha256Hex?: string | null;
}

export interface PublicKeyWire {
  q: number;
  o: number;
  v: number;
  centralMap: CentralMapWire;
  T: number[][];
}

export interface CentralMapWire {
  comps: CentralMapCompWire[];
}

export interface CentralMapCompWire {
  A: number[][];
  B: number[][];
  c: number[];
  d: number[];
  e: number;
}

export interface ChainAnchorWire {
  kind: string;
  chainId?: string | null;
  blockHeight?: number | null;
  stateRootHex?: string | null;
}

export interface ChainBindingResponse extends CertIssueResponse {
  anchor?: ChainAnchorWire;
}

export interface ChainVerifyBinding {
  ok: boolean;
  digestBindsToAnchor: boolean;
  certificateCryptoOk: boolean;
  certificateFullOk: boolean;
  computedDigestY: number[];
}

export interface ChainVerifyResult {
  result: ChainVerifyBinding;
}

export interface EvmChainRequest {
  rpcUrl?: string;
  block?: number | string;
  caip2ChainId?: string | null;
  rpcHeaders?: Record<string, string> | null;
  policy?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  timeout?: number;
}

export interface SolanaChainRequest {
  rpcUrl?: string;
  clusterId?: string;
  slot?: number | null;
  commitment?: string;
  metadata?: Record<string, unknown>;
  timeout?: number;
}

export interface CosmosChainRequest {
  restBase?: string;
  chainId?: string;
  height?: number | null;
  metadata?: Record<string, unknown>;
  timeout?: number;
}

export interface XrpChainRequest {
  rpcUrl?: string;
  networkId?: string;
  ledgerIndex?: number | string;
  metadata?: Record<string, unknown>;
  timeout?: number;
}

export interface ChainHealth {
  ok: boolean;
  service: string;
  version: string;
}

export interface ChainCatalogEntry {
  id: string;
  label: string;
  issue: string;
  verify: string;
  hints?: string;
  docs?: string;
}

export interface ChainCatalogResponse {
  chains: ChainCatalogEntry[];
  hint: string;
}

export class SilentVerifyManager {
  private apiKey: string;
  private baseURL: string;

  constructor(_sdk: KubernaSDK, config?: SilentVerifyConfig) {
    this.apiKey = config?.apiKey || process.env.SILENTVERIFY_API_KEY || 'sv_dev_test_key';
    this.baseURL = config?.baseUrl || process.env.SILENTVERIFY_BASE_URL || 'https://silentverify.up.railway.app';
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
    };
  }

  private async post<T>(path: string, data?: unknown): Promise<T> {
    const url = `${this.baseURL}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.headers(),
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(30000),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new KubernaError(`SilentVerify request failed: ${msg}`, 'SILENTVERIFY_NETWORK_ERROR', 503);
    }

    if (!response.ok) {
      let detail: string;
      try {
        const body = await response.json() as { detail?: unknown };
        detail = JSON.stringify(body.detail ?? body);
      } catch {
        detail = response.statusText;
      }
      throw new KubernaError(`SilentVerify API error: ${detail}`, 'SILENTVERIFY_ERROR', response.status);
    }

    if (path.includes('/print')) {
      return (await response.text()) as unknown as T;
    }

    return (await response.json()) as T;
  }

  private async get<T>(path: string): Promise<T> {
    const url = `${this.baseURL}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.headers(),
        signal: AbortSignal.timeout(30000),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new KubernaError(`SilentVerify request failed: ${msg}`, 'SILENTVERIFY_NETWORK_ERROR', 503);
    }

    if (!response.ok) {
      let detail: string;
      try {
        const body = await response.json() as { detail?: unknown };
        detail = JSON.stringify(body.detail ?? body);
      } catch {
        detail = response.statusText;
      }
      throw new KubernaError(`SilentVerify API error: ${detail}`, 'SILENTVERIFY_ERROR', response.status);
    }

    return (await response.json()) as T;
  }

  async health(): Promise<ChainHealth> {
    return this.get<ChainHealth>('/api/v1/health');
  }

  async chains(): Promise<ChainCatalogResponse> {
    return this.get<ChainCatalogResponse>('/api/v1/chains');
  }

  async issueAgentCert(params: AgentCertIssueRequest): Promise<CertIssueResponse> {
    return this.post<CertIssueResponse>('/api/v1/certs/agent/issue', {
      agent_did: params.agentDid,
      capabilities: params.capabilities,
      reputation_hash: params.reputationHash ?? null,
      previous_cert_digest: params.previousCertDigest ?? null,
      task_context: params.taskContext ?? null,
      anchor: params.anchor ?? null,
      expires_in_days: params.expiresInDays ?? 30,
      metadata: params.metadata,
    });
  }

  async verifyAgentCert(cert: Record<string, unknown>): Promise<CertVerifyResponse> {
    return this.post<CertVerifyResponse>('/api/v1/certs/agent/verify', { cert });
  }

  async issueStateCert(params: StateCertIssueRequest): Promise<CertIssueResponse> {
    return this.post<CertIssueResponse>('/api/v1/certs/state/issue', {
      chain_id: params.chainId ?? 'eip155:1',
      block_height: params.blockHeight ?? 19000000,
      state_root_hex:
        params.stateRootHex ??
        '0x5c6b7a8f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8',
      metadata: params.metadata,
    });
  }

  async verifyCert(cert: Record<string, unknown>): Promise<CertVerifyResponse> {
    return this.post<CertVerifyResponse>('/api/v1/certs/verify', { cert });
  }

  async verifyStateCert(cert: Record<string, unknown>): Promise<CertVerifyResponse> {
    return this.post<CertVerifyResponse>('/api/v1/certs/state/verify', { cert });
  }

  async issueEvmAnchor(params: EvmChainRequest): Promise<ChainBindingResponse> {
    return this.post<ChainBindingResponse>('/api/v1/chains/evm/issue', {
      rpc_url: params.rpcUrl ?? 'https://eth.drpc.org',
      block: params.block ?? 'latest',
      caip2_chain_id: params.caip2ChainId ?? null,
      rpc_headers: params.rpcHeaders ?? null,
      policy: params.policy ?? null,
      metadata: params.metadata,
      timeout: params.timeout ?? 30,
    });
  }

  async verifyEvmAnchor(
    cert: Record<string, unknown>,
    params: EvmChainRequest,
  ): Promise<ChainVerifyResult> {
    return this.post<ChainVerifyResult>('/api/v1/chains/evm/verify', {
      rpc_url: params.rpcUrl ?? 'https://eth.drpc.org',
      block: params.block ?? 'latest',
      caip2_chain_id: params.caip2ChainId ?? null,
      rpc_headers: params.rpcHeaders ?? null,
      policy: params.policy ?? null,
      metadata: params.metadata,
      timeout: params.timeout ?? 30,
      cert,
    });
  }

  async issueSolanaAnchor(params: SolanaChainRequest): Promise<ChainBindingResponse> {
    return this.post<ChainBindingResponse>('/api/v1/chains/solana/issue', {
      rpc_url: params.rpcUrl ?? 'https://api.mainnet-beta.solana.com',
      cluster_id: params.clusterId ?? 'mainnet-beta',
      slot: params.slot ?? null,
      commitment: params.commitment ?? 'finalized',
      metadata: params.metadata,
      timeout: params.timeout ?? 30,
    });
  }

  async verifySolanaAnchor(
    cert: Record<string, unknown>,
    params: SolanaChainRequest,
  ): Promise<ChainVerifyResult> {
    return this.post<ChainVerifyResult>('/api/v1/chains/solana/verify', {
      rpc_url: params.rpcUrl ?? 'https://api.mainnet-beta.solana.com',
      cluster_id: params.clusterId ?? 'mainnet-beta',
      slot: params.slot ?? null,
      commitment: params.commitment ?? 'finalized',
      metadata: params.metadata,
      timeout: params.timeout ?? 30,
      cert,
    });
  }

  async issueCosmosAnchor(params: CosmosChainRequest): Promise<ChainBindingResponse> {
    return this.post<ChainBindingResponse>('/api/v1/chains/cosmos/issue', {
      rest_base: params.restBase ?? 'https://cosmos-rest.publicnode.com',
      chain_id: params.chainId ?? 'cosmoshub-4',
      height: params.height ?? null,
      metadata: params.metadata,
      timeout: params.timeout ?? 30,
    });
  }

  async verifyCosmosAnchor(
    cert: Record<string, unknown>,
    params: CosmosChainRequest,
  ): Promise<ChainVerifyResult> {
    return this.post<ChainVerifyResult>('/api/v1/chains/cosmos/verify', {
      rest_base: params.restBase ?? 'https://cosmos-rest.publicnode.com',
      chain_id: params.chainId ?? 'cosmoshub-4',
      height: params.height ?? null,
      metadata: params.metadata,
      timeout: params.timeout ?? 30,
      cert,
    });
  }

  async issueXrpAnchor(params: XrpChainRequest): Promise<ChainBindingResponse> {
    return this.post<ChainBindingResponse>('/api/v1/chains/xrp/issue', {
      rpc_url: params.rpcUrl ?? 'https://xrplcluster.com',
      network_id: params.networkId ?? 'mainnet',
      ledger_index: params.ledgerIndex ?? 'validated',
      metadata: params.metadata,
      timeout: params.timeout ?? 30,
    });
  }

  async verifyXrpAnchor(
    cert: Record<string, unknown>,
    params: XrpChainRequest,
  ): Promise<ChainVerifyResult> {
    return this.post<ChainVerifyResult>('/api/v1/chains/xrp/verify', {
      rpc_url: params.rpcUrl ?? 'https://xrplcluster.com',
      network_id: params.networkId ?? 'mainnet',
      ledger_index: params.ledgerIndex ?? 'validated',
      metadata: params.metadata,
      timeout: params.timeout ?? 30,
      cert,
    });
  }

  async issueEvmCrossAnchor(
    src: Record<string, unknown>,
    dst: Record<string, unknown>,
    policy?: Record<string, unknown> | null,
    metadata?: Record<string, unknown>,
    timeout?: number,
  ): Promise<ChainBindingResponse> {
    return this.post<ChainBindingResponse>('/api/v1/chains/evm-cross/issue', {
      src,
      dst,
      policy: policy ?? null,
      metadata,
      timeout: timeout ?? 30,
    });
  }

  async verifyEvmCrossAnchor(
    cert: Record<string, unknown>,
    src: Record<string, unknown>,
    dst: Record<string, unknown>,
    policy?: Record<string, unknown> | null,
    metadata?: Record<string, unknown>,
    timeout?: number,
  ): Promise<ChainVerifyResult> {
    return this.post<ChainVerifyResult>('/api/v1/chains/evm-cross/verify', {
      src,
      dst,
      policy: policy ?? null,
      metadata,
      timeout: timeout ?? 30,
      cert,
    });
  }

  async issueCrossL1Anchor(
    src: Record<string, unknown>,
    dst: Record<string, unknown>,
    policy?: Record<string, unknown> | null,
    metadata?: Record<string, unknown>,
    timeout?: number,
  ): Promise<ChainBindingResponse> {
    return this.post<ChainBindingResponse>('/api/v1/chains/cross-l1/issue', {
      src,
      dst,
      policy: policy ?? null,
      metadata,
      timeout: timeout ?? 30,
    });
  }

  async verifyCrossL1Anchor(
    cert: Record<string, unknown>,
    src: Record<string, unknown>,
    dst: Record<string, unknown>,
    policy?: Record<string, unknown> | null,
    metadata?: Record<string, unknown>,
    timeout?: number,
  ): Promise<ChainVerifyResult> {
    return this.post<ChainVerifyResult>('/api/v1/chains/cross-l1/verify', {
      src,
      dst,
      policy: policy ?? null,
      metadata,
      timeout: timeout ?? 30,
      cert,
    });
  }

  async printCert(cert: Record<string, unknown>, autoprint?: boolean): Promise<string> {
    const params = new URLSearchParams();
    if (autoprint ?? true) params.set('autoprint', 'true');
    return this.post<string>(`/api/v1/certs/print?${params.toString()}`, { cert });
  }

  async printCertPublic(cert: Record<string, unknown>, autoprint?: boolean): Promise<string> {
    const params = new URLSearchParams();
    if (autoprint ?? true) params.set('autoprint', 'true');
    return this.post<string>(`/api/v1/certs/print/public?${params.toString()}`, { cert });
  }

  async getFreeKey(): Promise<Record<string, unknown>> {
    const url = `${this.baseURL}/api/v1/billing/free-key`;
    const response = await fetch(url, { method: 'POST', headers: this.headers() });
    return (await response.json()) as Record<string, unknown>;
  }

  async getUsage(): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>('/api/v1/billing/usage');
  }

  async evmHints(): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>('/api/v1/chains/evm/hints');
  }

  async billingStatus(): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>('/api/v1/billing/status');
  }
}
