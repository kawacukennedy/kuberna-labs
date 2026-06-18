jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { KubernaSDK } from '../src/index.js';
import axios from 'axios';

const mockedAxios = axios as unknown as jest.Mock;

describe('KubernaSDK', () => {
  const config = {
    apiKey: 'test-api-key',
    baseUrl: 'https://test.api.com',
  };

  beforeEach(() => {
    mockedAxios.mockReset();
  });

  it('should initialize correctly', () => {
    const sdk = new KubernaSDK(config);
    expect(sdk.getBaseUrl()).toBe(config.baseUrl);
    expect(sdk.getApiKey()).toBe(config.apiKey);
  });

  it('should make successful requests', async () => {
    const sdk = new KubernaSDK(config);
    const apiResponse = { success: true, data: { foo: 'bar' } };
    mockedAxios.mockResolvedValueOnce({ data: apiResponse });

    const result = await sdk.request<{ foo: string }>({ method: 'GET', path: '/test' });
    expect(result).toEqual(apiResponse);
    expect(result.data?.foo).toBe('bar');
    expect(mockedAxios.mock.calls[0][0].url).toBe(`${config.baseUrl}/test`);
    expect(mockedAxios.mock.calls[0][0].method).toBe('GET');
  });

  it('should handle request errors gracefully', async () => {
    const sdk = new KubernaSDK(config);
    const errorResponse = { success: false, error: { message: 'Not found', code: 'NOT_FOUND' } };
    mockedAxios.mockResolvedValueOnce({ data: errorResponse });

    const result = await sdk.request({ method: 'GET', path: '/not-found' });
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Not found');
  });

  it('should handle network errors', async () => {
    const sdk = new KubernaSDK(config);
    mockedAxios.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Not found', code: 'NOT_FOUND' } },
    });

    const result = await sdk.request({ method: 'GET', path: '/error' });
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Not found');
  });

  it('should reject invalid private key', () => {
    expect(() => new KubernaSDK({ privateKey: 'invalid-key' })).toThrow('Invalid private key format');
  });
});
