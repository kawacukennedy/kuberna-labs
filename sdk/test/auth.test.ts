jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { KubernaSDK } from '../src/index.js';
import axios from 'axios';

const mockedAxios = axios as unknown as jest.Mock;

describe('AuthManager', () => {
  const sdk = new KubernaSDK({ apiKey: 'test-key', baseUrl: 'https://api.test.com/api' });

  beforeEach(() => {
    mockedAxios.mockClear();
  });

  it('should login and return tokens', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { success: true, data: { accessToken: 'abc', refreshToken: 'def', expiresIn: 3600 } },
    });

    const result = await sdk.auth.login({ email: 'test@test.com', password: 'pass123' });
    expect(result.accessToken).toBe('abc');
    expect(mockedAxios.mock.calls[0][0].url).toBe('https://api.test.com/api/auth/login');
  });

  it('should register and return tokens', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { success: true, data: { accessToken: 'abc', refreshToken: 'def', expiresIn: 3600 } },
    });

    const result = await sdk.auth.register({ email: 'test@test.com', password: 'pass123', name: 'Test' });
    expect(result.accessToken).toBe('abc');
  });

  it('should get user profile', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { success: true, data: { id: '1', email: 'test@test.com', name: 'Test', role: 'user', createdAt: '2024-01-01' } },
    });

    const result = await sdk.auth.getProfile();
    expect(result.email).toBe('test@test.com');
  });
});
