import { KubernaSDK } from './index.js';

export interface KiteWalletInfo {
  connected: boolean;
  kiteWalletAddress: string | null;
  balances?: Array<{ asset: string; amount: string; usdValue: string }>;
}

export interface KiteSessionRequest {
  agentId: string;
  taskSummary: string;
  maxAmountPerTx: number;
  maxTotalAmount: number;
  ttl?: string;
}

export interface KiteSession {
  sessionId: string;
  approvalUrl: string;
  status?: string;
  totalSpent?: string;
  remainingBudget?: string;
  expiresAt?: string;
}

export interface KiteAgentInfo {
  id: string;
  kiteWalletAddress: string | null;
  kiteAgentDid: string | null;
  kiteSessionId: string | null;
}

export interface X402PaymentRequest {
  maxAmountRequired: string;
  asset: string;
  network: string;
  payTo: string;
  resource: string;
  description: string;
  maxTimeoutSeconds: number;
  scheme: string;
}

export interface X402PaymentCreate {
  paymentId: string;
  kitePaymentId: string;
  status: string;
}

export interface X402SettleResult {
  txHash: string;
  status: string;
}

export interface X402VerifyResult {
  verified: boolean;
  toAddress: string;
  amount: string;
  blockNumber: number;
}

export class KiteManager {
  constructor(private sdk: KubernaSDK) {}

  async getWalletInfo(): Promise<KiteWalletInfo> {
    const response = await this.sdk.request({
      method: 'GET',
      path: '/kite/wallet',
    });
    return response.data as KiteWalletInfo;
  }

  async connectWallet(kiteWalletAddress: string): Promise<{ kiteWalletAddress: string }> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/kite/wallet/connect',
      data: { kiteWalletAddress },
    });
    return response.data as { kiteWalletAddress: string };
  }

  async registerAgent(agentId: string): Promise<{
    agentId: string;
    kiteDid: string;
    kiteWalletAddress: string;
  }> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/kite/agents/register',
      data: { agentId },
    });
    return response.data as {
      agentId: string;
      kiteDid: string;
      kiteWalletAddress: string;
    };
  }

  async createSession(params: KiteSessionRequest): Promise<KiteSession> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/kite/sessions/create',
      data: { ...params, ttl: params.ttl || '24h' },
    });
    return response.data as KiteSession;
  }

  async getSessionStatus(sessionId: string): Promise<KiteSession> {
    const response = await this.sdk.request({
      method: 'GET',
      path: `/kite/sessions/${sessionId}`,
    });
    return response.data as KiteSession;
  }

  async getAgentKiteInfo(agentId: string): Promise<KiteAgentInfo> {
    const response = await this.sdk.request({
      method: 'GET',
      path: `/kite/agents/${agentId}/info`,
    });
    return response.data as KiteAgentInfo;
  }

  async parseX402Payment(body: Record<string, unknown>): Promise<X402PaymentRequest> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/x402/parse',
      data: body,
    });
    return response.data as X402PaymentRequest;
  }

  async createX402Payment(params: {
    sessionId?: string;
    agentKiteDid?: string;
    kiteWalletAddr?: string;
    amount: string;
    asset?: string;
    network?: string;
    intentId?: string;
  }): Promise<X402PaymentCreate> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/x402/create',
      data: params,
    });
    return response.data as X402PaymentCreate;
  }

  async settleX402Payment(params: {
    kitePaymentId: string;
    authorization: Record<string, unknown>;
    signature: string;
    network?: string;
  }): Promise<X402SettleResult> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/x402/settle',
      data: params,
    });
    return response.data as X402SettleResult;
  }

  async verifyX402Transaction(txHash: string): Promise<X402VerifyResult> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/x402/verify',
      data: { txHash },
    });
    return response.data as X402VerifyResult;
  }

  async getSessionPayments(sessionId: string) {
    const response = await this.sdk.request({
      method: 'GET',
      path: `/payments/x402/sessions/${sessionId}/payments`,
    });
    return response.data;
  }
}
