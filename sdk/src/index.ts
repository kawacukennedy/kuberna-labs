import { ethers } from 'ethers';
import axios, { AxiosRequestConfig } from 'axios';
import { AgentManager } from './agent.js';
import { IntentManager } from './intent.js';
import { BlockchainManager } from './blockchain.js';
import { AuthManager } from './auth.js';
import { PaymentManager } from './payment.js';
import { TeeManager } from './tee.js';
import { CertificateManager } from './certificate.js';
import { WalletManager } from './wallet.js';
import { AiManager } from './ai.js';
import { SilentVerifyManager } from './silentverify.js';
import { KiteManager } from './kite.js';

export interface KubernaConfig {
  apiKey?: string;
  privateKey?: string;
  rpcUrl?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestParams {
  method: HttpMethod;
  path: string;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export class KubernaSDK {
  public agent: AgentManager;
  public intent: IntentManager;
  public blockchain: BlockchainManager;
  public auth: AuthManager;
  public payment: PaymentManager;
  public tee: TeeManager;
  public certificate: CertificateManager;
  public wallet: WalletManager;
  public ai: AiManager;
  public verify: SilentVerifyManager;
  public kite: KiteManager;
  private config: KubernaConfig;
  private provider: ethers.JsonRpcProvider;
  private walletInstance?: ethers.Wallet;

  constructor(config: KubernaConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.kuberna.africa/api',
      rpcUrl: config.rpcUrl || 'https://rpc.ankr.com/eth',
      timeout: config.timeout || 30000,
      ...config,
    };

    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    if (this.config.privateKey) {
      if (!/^0x[0-9a-fA-F]{64}$/.test(this.config.privateKey)) {
        throw new Error('Invalid private key format: must be 0x-prefixed 64-char hex string');
      }
      this.walletInstance = new ethers.Wallet(this.config.privateKey, this.provider);
    }

    this.agent = new AgentManager(this);
    this.intent = new IntentManager(this);
    this.blockchain = new BlockchainManager(this);
    this.auth = new AuthManager(this);
    this.payment = new PaymentManager(this);
    this.tee = new TeeManager(this);
    this.certificate = new CertificateManager(this);
    this.wallet = new WalletManager(this);
    this.ai = new AiManager(this);
    this.verify = new SilentVerifyManager(this);
    this.kite = new KiteManager(this);
  }

  async initialize(params: { wallet?: string } = {}): Promise<this> {
    if (params.wallet) {
      if (!/^0x[0-9a-fA-F]{64}$/.test(params.wallet)) {
        throw new Error('Invalid private key format: must be 0x-prefixed 64-char hex string');
      }
      this.walletInstance = new ethers.Wallet(params.wallet, this.provider);
    }
    return this;
  }

  getWallet(): ethers.Wallet | undefined {
    return this.walletInstance;
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getBaseUrl(): string {
    return this.config.baseUrl!;
  }

  getApiKey(): string | undefined {
    return this.config.apiKey;
  }

  async request<T = unknown>(params: RequestParams): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...params.headers,
    };

    if (this.config.apiKey) {
      headers['X-API-KEY'] = this.config.apiKey;
    }

    const requestConfig: AxiosRequestConfig = {
      method: params.method,
      url: `${this.config.baseUrl}${params.path}`,
      data: params.data,
      headers,
      timeout: this.config.timeout,
    };

    try {
      const response = await axios(requestConfig);
      return response.data as ApiResponse<T>;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; code?: string } }; isAxiosError?: boolean; message?: string };
      if (axiosError?.isAxiosError || axiosError?.response) {
        return {
          success: false,
          error: {
            message: axiosError.response?.data?.message || axiosError.message || 'Request failed',
            code: axiosError.response?.data?.code || 'REQUEST_ERROR',
          },
        };
      }
      throw error;
    }
  }
}

export type { CreateAgentParams, Agent } from './agent.js';
export type { CreateIntentParams, StructuredIntent, Intent } from './intent.js';
export type { LoginParams, RegisterParams, AuthTokens, UserProfile } from './auth.js';
export type { CreatePaymentIntentParams, PaymentIntent, PaymentStatus, TokenInfo } from './payment.js';
export type { CreateEnclaveParams, Enclave, AttestationReport } from './tee.js';
export type { MintCertificateParams, Certificate, CertificateVerification } from './certificate.js';
export type { WalletInfo, TransactionResult } from './wallet.js';
export type { ParseIntentResult, AgentDecision, AnalyzeParams, AnalysisResult } from './ai.js';
export type {
  SilentVerifyConfig,
  AgentCertIssueRequest,
  StateCertIssueRequest,
  CertIssueResponse,
  CertVerifyResponse,
  StateCertWire,
  ChainBindingResponse,
  ChainVerifyResult,
  ChainHealth,
  ChainCatalogResponse,
  ChainCatalogEntry,
  EvmChainRequest,
  SolanaChainRequest,
  CosmosChainRequest,
  XrpChainRequest,
} from './silentverify.js';
export { SilentVerifyManager } from './silentverify.js';
export { KiteManager } from './kite.js';
export type {
  KiteWalletInfo,
  KiteSessionRequest,
  KiteSession,
  KiteAgentInfo,
  X402PaymentRequest,
  X402PaymentCreate,
  X402SettleResult,
  X402VerifyResult,
} from './kite.js';
