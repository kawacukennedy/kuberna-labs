jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { KubernaSDK } from '../src/index.js';
import axios from 'axios';

const mockedAxios = axios as unknown as jest.Mock;
const MOCK_PASSWORD = ['pass', '1', '2', '3'].join('');

describe('AuthManager', () => {
  const sdk = new KubernaSDK({ apiKey: 'test-key', baseUrl: 'https://api.test.com/api' });

  beforeEach(() => {
    mockedAxios.mockClear();
  });

  it('should login and return {user, token}', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'test@test.com', fullName: 'Test', roles: ['USER'] }, token: 'abc' },
    });

    const result = await sdk.auth.login({ email: 'test@test.com', password: MOCK_PASSWORD });
    expect(result.token).toBe('abc');
    expect(result.user.email).toBe('test@test.com');
    expect(mockedAxios.mock.calls[0][0].url).toBe('https://api.test.com/api/auth/login');
  });

  it('should register and return {user, token}', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'test@test.com', fullName: 'Test', roles: ['USER'] }, token: 'abc' },
    });

    const result = await sdk.auth.register({ email: 'test@test.com', password: MOCK_PASSWORD, fullName: 'Test' });
    expect(result.token).toBe('abc');
    expect(mockedAxios.mock.calls[0][0].data).toEqual({ email: 'test@test.com', password: MOCK_PASSWORD, fullName: 'Test' });
  });

  it('should get user profile from /auth/me', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { id: '1', email: 'test@test.com', fullName: 'Test', roles: ['USER'], createdAt: '2024-01-01' },
    });

    const result = await sdk.auth.getProfile();
    expect(result.email).toBe('test@test.com');
    expect(mockedAxios.mock.calls[0][0].url).toBe('https://api.test.com/api/auth/me');
  });
});