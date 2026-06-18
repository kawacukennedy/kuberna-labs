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

  it('should create payment intent', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: {
        success: true,
        data: { intentId: 'i1', escrowId: 'e1', status: 'created', requiredApproval: { token: '0x...', spender: '0x...', amount: '100' } },
      },
    });

    const result = await sdk.payment.createIntent({ amount: '100', currency: 'USD', token: '0x...', chain: 'ethereum' });
    expect(result.intentId).toBe('i1');
    expect(result.status).toBe('created');
  });

  it('should get payment status', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { success: true, data: { intentId: 'i1', status: 'COMPLETED', amount: '100', token: 'ETH', chain: 'ethereum' } },
    });

    const result = await sdk.payment.getStatus('i1');
    expect(result.status).toBe('COMPLETED');
  });
});
