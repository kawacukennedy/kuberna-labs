import { KubernaSDK } from './index.js';

export interface CreatePaymentIntentParams {
  amount: string;
  currency: string;
  token: string;
  chain: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntent {
  intentId: string;
  escrowId: string;
  status: string;
  requiredApproval: {
    token: string;
    spender: string;
    amount: string;
  };
}

export interface PaymentStatus {
  intentId: string;
  escrowId: string;
  status: string;
  amount: string;
  token: string;
  chain: string;
  requester: string;
  executor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  minAmount: string;
  maxAmount: string;
}

export class PaymentManager {
  constructor(private sdk: KubernaSDK) {}

  async createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/intents',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as PaymentIntent;
  }

  async getStatus(intentId: string): Promise<PaymentStatus> {
    const response = await this.sdk.request({ method: 'GET', path: `/payments/intents/${intentId}` });
    return response.data as PaymentStatus;
  }

  async getSupportedTokens(chain: string): Promise<TokenInfo[]> {
    const response = await this.sdk.request({ method: 'GET', path: '/payments/tokens', data: { chain } });
    return (response.data as { tokens: TokenInfo[] }).tokens;
  }

  async release(escrowId: string, chain: string): Promise<string> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/release',
      data: { escrowId, chain },
    });
    return (response.data as { txHash: string }).txHash;
  }

  async refund(escrowId: string, reason: string, chain: string): Promise<string> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/refund',
      data: { escrowId, reason, chain },
    });
    return (response.data as { txHash: string }).txHash;
  }
}
