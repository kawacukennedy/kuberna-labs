import { KubernaSDK } from './index.js';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthTokens {
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
    avatarUrl?: string | null;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  avatarUrl?: string | null;
  web3Address?: string | null;
  mfaEnabled?: boolean;
  createdAt?: string;
  profile?: Record<string, unknown>;
  stats?: {
    agentsCount: number;
    coursesEnrolled: number;
    intentsPosted: number;
  };
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

  async logout(): Promise<void> {
    await this.sdk.request({ method: 'POST', path: '/auth/logout', data: {} });
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.sdk.request({ method: 'GET', path: '/auth/me' });
    return response.data as UserProfile;
  }
}
