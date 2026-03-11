import { KubernaSDK } from '../src/index';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KubernaSDK', () => {
  const config = {
    apiKey: 'test-api-key',
    baseUrl: 'https://test.api.com',
  };

  it('should initialize correctly', () => {
    const sdk = new KubernaSDK(config);
    expect(sdk.getBaseUrl()).toBe(config.baseUrl);
    expect(sdk.getApiKey()).toBe(config.apiKey);
  });

  it('should make successful requests', async () => {
    const sdk = new KubernaSDK(config);
    const mockData = { success: true };
    mockedAxios.mockResolvedValueOnce({ data: mockData });

    const result = await sdk.request('GET', '/test');
    expect(result).toEqual(mockData);
    expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: `${config.baseUrl}/test`,
      headers: { 'X-API-KEY': config.apiKey },
    }));
  });
});
