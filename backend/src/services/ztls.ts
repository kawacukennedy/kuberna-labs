import crypto from 'crypto';
import logger from '../utils/logger.js';

export type zkTLSProvider = "reclaim" | "zkpass";

export interface ZKTLSSession {
  id: string;
  provider: zkTLSProvider;
  userId: string;
  website: string;
  status: "pending" | "authenticating" | "verified" | "failed" | "expired";
  proof?: string;
  claimedData?: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date;
  verifiedAt?: Date;
}

export interface ZKTLSCredential {
  id: string;
  userId: string;
  type:
    | "bank_balance"
    | "kyc_status"
    | "credit_score"
    | "twitter_verified"
    | "email_verified";
  provider: zkTLSProvider;
  proof: string;
  data: Record<string, unknown>;
  verified: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CreateSessionRequest {
  userId: string;
  website: string;
  type: ZKTLSCredential["type"];
  callbackUrl?: string;
}

export class ZKTLService {
  private reclaimAppId: string;
  private reclaimAppSecret: string;
  private zkpassApiKey: string;
  private sessions: Map<string, ZKTLSSession> = new Map();

  constructor() {
    this.reclaimAppId = process.env.RECLAIM_APP_ID || "";
    this.reclaimAppSecret = process.env.RECLAIM_APP_SECRET || "";
    this.zkpassApiKey = process.env.ZKPASS_API_KEY || "";
  }

  async createSession(request: CreateSessionRequest): Promise<ZKTLSSession> {
    if (request.website.includes("reclaim")) {
      return this.createReclaimSession(request);
    } else {
      return this.createZkpassSession(request);
    }
  }

  private async createReclaimSession(
    request: CreateSessionRequest,
  ): Promise<ZKTLSSession> {
    const sessionId = `reclaim-${crypto.randomUUID()}`;

    const session: ZKTLSSession = {
      id: sessionId,
      provider: "reclaim",
      userId: request.userId,
      website: request.website,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  private async createZkpassSession(
    request: CreateSessionRequest,
  ): Promise<ZKTLSSession> {
    const sessionId = `zkpass-${crypto.randomUUID()}`;

    const session: ZKTLSSession = {
      id: sessionId,
      provider: "zkpass",
      userId: request.userId,
      website: request.website,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<ZKTLSSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    if (session.expiresAt < new Date()) {
      session.status = "expired";
      return session;
    }
    return session;
  }

  async verifyProof(sessionId: string, proof: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    try {
      const response = await fetch("https://api.reclaimprotocol.org/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "App-Id": this.reclaimAppId,
          "App-Secret": this.reclaimAppSecret,
        },
        body: JSON.stringify({
          proof,
          sessionId,
        }),
      });

      if (!response.ok) {
        logger.error("Proof verification failed:", response.statusText);
        return false;
      }

      const data = await response.json() as Record<string, unknown>;
      return data.valid === true;
    } catch (error) {
      logger.error("Proof verification error:", error);
      return false;
    }
  }

  async completeSession(
    sessionId: string,
    proof: string,
    claimedData: Record<string, unknown>,
  ): Promise<ZKTLSSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const isValid = await this.verifyProof(sessionId, proof);

    const updated: ZKTLSSession = {
      ...session,
      status: isValid ? "verified" : "failed",
      proof,
      claimedData: isValid ? claimedData : undefined,
      verifiedAt: isValid ? new Date() : undefined,
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  async saveCredential(
    userId: string,
    session: ZKTLSSession,
  ): Promise<ZKTLSCredential> {
    const credentialType = this.getCredentialType(session.website);

    return {
      id: `cred-${crypto.randomUUID()}`,
      userId,
      type: credentialType,
      provider: session.provider,
      proof: session.proof || "",
      data: session.claimedData || {},
      verified: session.status === "verified",
      createdAt: new Date(),
    };
  }

  private getCredentialType(website: string): ZKTLSCredential["type"] {
    const websiteLower = website.toLowerCase();

    if (
      websiteLower.includes("bank") ||
      websiteLower.includes("chase") ||
      websiteLower.includes("bofa")
    ) {
      return "bank_balance";
    }
    if (
      websiteLower.includes("kyc") ||
      websiteLower.includes("id.me") ||
      websiteLower.includes("stripe")
    ) {
      return "kyc_status";
    }
    if (
      websiteLower.includes("credit") ||
      websiteLower.includes("equifax") ||
      websiteLower.includes("transunion")
    ) {
      return "credit_score";
    }
    if (websiteLower.includes("twitter") || websiteLower.includes("x.com")) {
      return "twitter_verified";
    }
    return "email_verified";
  }

  async getUserCredentials(userId: string): Promise<ZKTLSCredential[]> {
    const credentials: ZKTLSCredential[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.status === "verified") {
        credentials.push({
          id: `cred-${session.id}`,
          userId,
          type: this.getCredentialType(session.website),
          provider: session.provider,
          proof: session.proof || "",
          data: session.claimedData || {},
          verified: true,
          createdAt: session.createdAt,
        });
      }
    }
    if (credentials.length === 0) {
      return [];
    }
    return credentials;
  }

  async generateOnChainProof(credentialId: string): Promise<string> {
    return `0x${Buffer.from(JSON.stringify({ credentialId, timestamp: Date.now() })).toString("hex")}`;
  }

  async verifyOnChainProof(proof: string): Promise<boolean> {
    try {
      if (!proof.startsWith("0x")) return false;

      const decoded = JSON.parse(Buffer.from(proof.slice(2), "hex").toString());
      if (!decoded.credentialId || !decoded.timestamp) return false;

      const age = Date.now() - decoded.timestamp;
      if (age < 0 || age > 7 * 24 * 60 * 60 * 1000) return false;

      return true;
    } catch {
      return false;
    }
  }

  getSupportedWebsites(): Array<{
    name: string;
    url: string;
    type: ZKTLSCredential["type"];
  }> {
    return [
      {
        name: "Bank of America",
        url: "bankofamerica.com",
        type: "bank_balance",
      },
      { name: "Chase", url: "chase.com", type: "bank_balance" },
      { name: "Wells Fargo", url: "wellsfargo.com", type: "bank_balance" },
      { name: "Coinbase", url: "coinbase.com", type: "kyc_status" },
      { name: "Kraken", url: "kraken.com", type: "kyc_status" },
      { name: "Twitter/X", url: "twitter.com", type: "twitter_verified" },
      { name: "Gmail", url: "gmail.com", type: "email_verified" },
      { name: "ID.me", url: "id.me", type: "kyc_status" },
      { name: "Credit Karma", url: "creditkarma.com", type: "credit_score" },
    ];
  }
}

export const zkTLSService = new ZKTLService();
