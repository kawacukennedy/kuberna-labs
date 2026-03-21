import { ethers } from 'ethers';
import { z } from 'zod';
import axios, { AxiosRequestConfig } from 'axios';
import { AgentManager } from './agent.js';
import { IntentManager } from './intent.js';
import { BlockchainManager } from './blockchain.js';

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
  private config: KubernaConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;

  constructor(config: KubernaConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.kuberna.africa/api',
      rpcUrl: config.rpcUrl || 'https://rpc.ankr.com/eth',
      timeout: config.timeout || 30000,
      ...config,
    };

    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    if (this.config.privateKey) {
      this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    }

    this.agent = new AgentManager(this);
    this.intent = new IntentManager(this);
    this.blockchain = new BlockchainManager(this);
  }

  async initialize(params: { wallet?: string } = {}): Promise<this> {
    if (params.wallet) {
      this.wallet = new ethers.Wallet(params.wallet, this.provider);
    }
    return this;
  }

  getWallet(): ethers.Wallet | undefined {
    return this.wallet;
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
      return {
        success: true,
        data: response.data as T,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            message: error.response?.data?.message || error.message,
            code: error.response?.data?.code || 'REQUEST_ERROR',
          },
        };
      }
      throw error;
    }
  }
}
