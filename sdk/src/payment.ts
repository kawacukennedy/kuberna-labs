import { KubernaSDK } from './index.js';

export interface CreatePaymentIntentParams {
  planId: 'sdk' | 'accelerator' | 'enterprise';
  paymentMethod?: string;
  courseId?: string;
}

export interface PaymentCheckout {
  paymentId: string;
  checkoutUrl: string;
}

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string | null;
  features: string[];
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
}

export class PaymentManager {
  constructor(private sdk: KubernaSDK) {}

  async getPlans(): Promise<PlanInfo[]> {
    const response = await this.sdk.request({ method: 'GET', path: '/payments/plans' });
    return response.data as PlanInfo[];
  }

  async checkout(params: CreatePaymentIntentParams): Promise<PaymentCheckout> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/checkout',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as PaymentCheckout;
  }

  async getTransactions(page = 1, limit = 20): Promise<{ payments: PaymentTransaction[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const response = await this.sdk.request({
      method: 'GET',
      path: `/payments/transactions?page=${page}&limit=${limit}`,
    });
    return response.data as { payments: PaymentTransaction[]; pagination: { page: number; limit: number; total: number; pages: number } };
  }

  async withdraw(amount: number, address: string, chain: string): Promise<{ withdrawalId: string; status: string }> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/withdraw',
      data: { amount, address, chain } as Record<string, unknown>,
    });
    return response.data as { withdrawalId: string; status: string };
  }
}
