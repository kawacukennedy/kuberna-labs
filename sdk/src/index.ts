import { ethers } from "ethers";
import { z } from "zod";
import axios from "axios";
import { AgentManager } from "./agent.js";
import { IntentManager } from "./intent.js";
import { BlockchainManager } from "./blockchain.js";

export interface KubernaConfig {
  apiKey?: string;
  privateKey?: string;
  rpcUrl?: string;
  baseUrl?: string;
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
      baseUrl: config.baseUrl || "https://api.kuberna.africa/api",
      rpcUrl: config.rpcUrl || "https://rpc.ankr.com/eth",
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

  async request(method: string, path: string, data?: any) {
    const headers: Record<string, string> = {};
    if (this.config.apiKey) {
      headers["X-API-KEY"] = this.config.apiKey;
    }

    const response = await axios({
      method,
      url: `${this.config.baseUrl}${path}`,
      data,
      headers,
    });

    return response.data;
  }
}
