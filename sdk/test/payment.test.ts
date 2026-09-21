jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { KubernaSDK } from '../src/index.js';
import axios from 'axios';

const mockedAxios = axios as unknown as jest.Mock;

describe('PaymentManager', () => {
  const sdk = new KubernaSDK({ apiKey: 'test-key', baseUrl: 'https://api.test.com/api' });

  beforeEach(() => {
    mockedAxios.mockClear();
  });

  it('should checkout a plan', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { success: true, data: { paymentId: 'p1', checkoutUrl: 'https://checkout.kuberna.africa/p1' } },
    });

    const result = await sdk.payment.checkout({ planId: 'sdk' });
    expect(result.paymentId).toBe('p1');
    expect(mockedAxios.mock.calls[0][0].url).toBe('https://api.test.com/api/payments/checkout');
  });

  it('should list plans', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: [{ id: 'sdk', name: 'SDK', price: 397, currency: 'USD', interval: null, features: [] }],
    });

    const result = await sdk.payment.getPlans();
    expect(result[0].id).toBe('sdk');
    expect(mockedAxios.mock.calls[0][0].url).toBe('https://api.test.com/api/payments/plans');
  });

  it('should get transactions with page params', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { payments: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
    });

    const result = await sdk.payment.getTransactions(1, 20);
    expect(result.pagination.page).toBe(1);
    expect(mockedAxios.mock.calls[0][0].url).toBe('https://api.test.com/api/payments/transactions?page=1&limit=20');
  });

  it('should withdraw', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { success: true, data: { withdrawalId: 'w1', status: 'processing' } },
    });

    const result = await sdk.payment.withdraw(100, '0x0000000000000000000000000000000000000000', 'ethereum');
    expect(result.status).toBe('processing');
  });
});