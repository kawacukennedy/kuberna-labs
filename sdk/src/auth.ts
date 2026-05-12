import { KubernaSDK } from './index.js';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  web3Address?: string;
  role: string;
  createdAt: string;
}

export class AuthManager {
  constructor(private sdk: KubernaSDK) {}

  async login(params: LoginParams): Promise<AuthTokens> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/auth/login',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as AuthTokens;
  }

  async register(params: RegisterParams): Promise<AuthTokens> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/auth/register',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as AuthTokens;
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/auth/refresh',
      data: { refreshToken },
    });
    return response.data as AuthTokens;
  }

  async logout(): Promise<void> {
    await this.sdk.request({ method: 'POST', path: '/auth/logout', data: {} });
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.sdk.request({ method: 'GET', path: '/auth/profile' });
    return response.data as UserProfile;
  }
}
