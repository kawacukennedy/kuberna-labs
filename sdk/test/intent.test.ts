jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { KubernaSDK } from '../src/index.js';
import axios from 'axios';

const mockedAxios = axios as unknown as jest.Mock;

describe('IntentManager', () => {
  const sdk = new KubernaSDK({ apiKey: 'test-key', baseUrl: 'https://api.test.com/api' });

  beforeEach(() => {
    mockedAxios.mockClear();
  });

  describe('parse', () => {
    it('should call POST /intents/parse and return structured intent', async () => {
      const intentData = {
        sourceChain: 'solana',
        sourceToken: 'ETH',
        sourceAmount: '1',
        destChain: 'solana',
        destToken: 'USDC',
        minDestAmount: '0',
        timeoutSeconds: 600,
        budget: 10,
        currency: 'USD',
        confidence: 0.85,
        rawDescription: 'swap 1 ETH for USDC on Solana',
      };
      mockedAxios.mockResolvedValueOnce({
        data: { success: true, data: intentData },
      });

      const result = await sdk.intent.parse('swap 1 ETH for USDC on Solana');

      expect(mockedAxios.mock.calls[0][0].url).toBe('https://api.test.com/api/intents/parse');
      expect(mockedAxios.mock.calls[0][0].data).toEqual({ description: 'swap 1 ETH for USDC on Solana' });
      expect(result.sourceToken).toBe('ETH');
      expect(result.destToken).toBe('USDC');
      expect(result.sourceChain).toBe('solana');
    });

    it('should handle API error response', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { success: false, error: { message: 'Description is required', code: 'VALIDATION_ERROR' } },
      });

      const result = await sdk.intent.parse('');
      expect(result).toBeUndefined();
    });
  });
});
