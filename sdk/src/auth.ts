import { KubernaSDK } from './index.js';

/**
 * Credentials for user login authentication.
 */
export interface LoginParams {
  /** User's registered email address. */
  email: string;
  /** User's plaintext password. */
  password: string;
}

/**
 * Parameters for registering a new user account.
 */
export interface RegisterParams {
  /** User's email address. */
  email: string;
  /** Chosen account password. */
  password: string;
  /** Display name of the user. */
  name: string;
}

/**
 * Authentication tokens returned upon successful login or token refresh.
 */
export interface AuthTokens {
  /** Short-lived JWT bearer access token. */
  accessToken: string;
  /** Long-lived refresh token. */
  refreshToken: string;
  /** Validity duration in seconds. */
  expiresIn: number;
}

/**
 * Represents the authenticated user profile.
 */
export interface UserProfile {
  /** Unique user identifier. */
  id: string;
  /** Account email address. */
  email: string;
  /** User display name. */
  name: string;
  /** Connected Web3 wallet address if linked. */
  web3Address?: string;
  /** Authorization role (e.g., admin, developer). */
  role: string;
  /** Timestamp of account creation. */
  createdAt: string;
}

/**
 * Manager class responsible for authentication, session lifecycle, and profile management.
 */
export class AuthManager {
  /**
   * Initializes the AuthManager with a KubernaSDK client instance.
   * @param sdk - The root KubernaSDK instance.
   */
  constructor(private sdk: KubernaSDK) {}

  /**
   * Authenticates a user with email and password.
   * @param params - User login credentials.
   * @returns Generated access and refresh tokens.
   */
  async login(params: LoginParams): Promise<AuthTokens> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/auth/login',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as AuthTokens;
  }

  /**
   * Registers a new user account.
   * @param params - Registration details.
   * @returns Generated authentication tokens.
   */
  async register(params: RegisterParams): Promise<AuthTokens> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/auth/register',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as AuthTokens;
  }

  /**
   * Refreshes an expired access token using a valid refresh token.
   * @param refreshToken - Valid refresh token string.
   * @returns Fresh set of authentication tokens.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/auth/refresh',
      data: { refreshToken },
    });
    return response.data as AuthTokens;
  }

  /**
   * Terminates the current authenticated session.
   */
  async logout(): Promise<void> {
    await this.sdk.request({ method: 'POST', path: '/auth/logout', data: {} });
  }

  /**
   * Retrieves the profile of the currently authenticated user.
   * @returns User profile details.
   */
  async getProfile(): Promise<UserProfile> {
    const response = await this.sdk.request({ method: 'GET', path: '/auth/profile' });
    return response.data as UserProfile;
  }
}
