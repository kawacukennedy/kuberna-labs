import type { KeyPair } from '@aip-sdk/core';

export interface AipIdentity {
  keypair: KeyPair;
  identifier: string;
  publicKeyMultibase: string;
  name?: string;
}

export interface DocOptions {
  name?: string;
  expires?: string;
  extensions?: Record<string, unknown>;
}

export interface TokenClaimsOptions {
  issuer: string;
  subject: string;
  scopes: string[];
  maxDepth?: number;
  budgetUsd?: number;
  ttlSeconds?: number;
}

export interface OnChainRegistration {
  tokenId: bigint;
  agentAddress: string;
  transactionHash: string;
}

export interface OnChainIdentity {
  tokenId: bigint;
  agentAddress: string;
  name: string;
  framework: string;
  metadataURI: string;
  registeredAt: Date;
  lastActiveAt: Date;
  totalEarnings: bigint;
}

export interface ReputationInfo {
  tokenId: bigint;
  score: bigint;
  successRate: bigint;
  starRating: bigint;
  badges: string[];
  totalTasks: bigint;
  successfulTasks: bigint;
}

export interface VerifiedToken {
  claims: {
    issuer: string;
    subject: string;
    scopes: string[];
    maxDepth: number;
    issuedAt: Date;
    expiresAt: Date;
    budgetUsd?: number;
  };
  raw: string;
}

export interface DecodedToken {
  header: { alg: string; typ?: string; [key: string]: unknown };
  payload: {
    iss: string;
    sub: string;
    scopes: string[];
    maxDepth: number;
    issuedAt: Date;
    expiresAt: Date;
    budgetUsd?: number;
  };
  raw: string;
}

export interface ChainVerification {
  verified: boolean;
  token: VerifiedToken;
  reputation: ReputationInfo | null;
  error?: string;
}

export interface RegisterOptions {
  framework?: string;
  metadataURI?: string;
}

export interface AipAdapterConfig {
  defaultChainId?: number;
  contractAddress?: string;
}

export class AipAdapterError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AipAdapterError';
  }
}
