import { ethers } from 'ethers';
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

export interface KitePassportConfig {
  baseUrl: string;
  rpcUrl: string;
  chainId: number;
  paymentTokenAddress: string;
  testnetTokenAddress: string;
  facilitatorUrl: string;
  facilitatorAddress: string;
  serviceWallet: string;
}

export interface KiteSessionParams {
  taskSummary: string;
  maxAmountPerTx: number;
  maxTotalAmount: number;
  ttl: string;
  assets: string[];
  paymentApproach: string;
}

export interface KiteAgentRegistration {
  agentId: string;
  kiteDid: string;
  kiteWalletAddress: string;
  sessionId?: string;
}

export class KitePassportService {
  private config: KitePassportConfig;
  private provider: ethers.JsonRpcProvider;

  constructor(config: KitePassportConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getConfig(): KitePassportConfig {
    return this.config;
  }

  async registerKiteAgent(
    userId: string,
    agentName: string,
    type: string = 'coding-assistant'
  ): Promise<KiteAgentRegistration> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { kiteWalletAddress: true, web3Address: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const resp = await fetch(
        `${this.config.baseUrl}/v1/agents/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: agentName,
            type,
            ownerWallet: user.kiteWalletAddress || user.web3Address,
          }),
        }
      );

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`Kite agent registration failed: ${errBody}`);
      }

      const data = await resp.json() as Record<string, string>;

      return {
        agentId: data.agentId || data.id,
        kiteDid: data.did || data.agentDid,
        kiteWalletAddress: data.walletAddress || data.kiteWallet,
      };
    } catch (error) {
      logger.error('Failed to register Kite agent', { error: String(error), userId, agentName });
      throw error;
    }
  }

  async createSpendingSession(
    userId: string,
    agentKiteDid: string,
    params: KiteSessionParams
  ): Promise<{ sessionId: string; approvalUrl: string }> {
    try {
      const resp = await fetch(
        `${this.config.baseUrl}/v1/sessions/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentDid: agentKiteDid,
            taskSummary: params.taskSummary,
            maxAmountPerTx: params.maxAmountPerTx.toString(),
            maxTotalAmount: params.maxTotalAmount.toString(),
            ttl: params.ttl,
            assets: params.assets,
            paymentApproach: params.paymentApproach,
          }),
        }
      );

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`Kite session creation failed: ${errBody}`);
      }

      const data = await resp.json() as Record<string, string>;

      return {
        sessionId: data.sessionId || data.id,
        approvalUrl: data.approvalUrl || data.url,
      };
    } catch (error) {
      logger.error('Failed to create Kite spending session', {
        error: String(error),
        userId,
        agentKiteDid,
      });
      throw error;
    }
  }

  async getSessionStatus(sessionId: string): Promise<{
    status: string;
    totalSpent: string;
    remainingBudget: string;
    expiresAt: string;
  }> {
    try {
      const resp = await fetch(
        `${this.config.baseUrl}/v1/sessions/${sessionId}/status`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`Kite session status failed: ${errBody}`);
      }

      const data = await resp.json() as Record<string, string>;

      return {
        status: data.status,
        totalSpent: data.totalSpent || '0',
        remainingBudget: data.remainingBudget || '0',
        expiresAt: data.expiresAt,
      };
    } catch (error) {
      logger.error('Failed to get Kite session status', { error: String(error), sessionId });
      throw error;
    }
  }

  async getWalletBalance(kiteWalletAddress: string): Promise<{
    address: string;
    balances: Array<{ asset: string; amount: string; usdValue: string }>;
  }> {
    try {
      const resp = await fetch(
        `${this.config.baseUrl}/v1/wallets/${kiteWalletAddress}/balance`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`Kite wallet balance failed: ${errBody}`);
      }

      const data = await resp.json() as {
        address: string;
        balances: Array<{ asset: string; amount: string; usdValue: string }>;
      };
      return data;
    } catch (error) {
      logger.error('Failed to get Kite wallet balance', { error: String(error), kiteWalletAddress });
      throw error;
    }
  }

  async setUserKiteWallet(userId: string, kiteWalletAddress: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { kiteWalletAddress },
    });
    logger.info('User Kite wallet set', { userId, kiteWalletAddress });
  }

  async updateAgentKiteInfo(agentId: string, info: KiteAgentRegistration): Promise<void> {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        kiteWalletAddress: info.kiteWalletAddress,
        kiteAgentDid: info.kiteDid,
        kiteSessionId: info.sessionId,
      },
    });
    logger.info('Agent Kite info updated', { agentId, kiteDid: info.kiteDid });
  }
}

export const kitePassportService = new KitePassportService({
  baseUrl: process.env.KITE_PASSPORT_API || 'https://agentpassport.ai/api',
  rpcUrl: process.env.KITE_RPC_URL || 'https://rpc-testnet.gokite.ai',
  chainId: parseInt(process.env.KITE_CHAIN_ID || '2368', 10),
  paymentTokenAddress: process.env.KITE_PAYMENT_TOKEN_ADDRESS || '0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e',
  testnetTokenAddress: process.env.KITE_TESTNET_TOKEN || '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63',
  facilitatorUrl: process.env.KITE_FACILITATOR_URL || 'https://facilitator.pieverse.io',
  facilitatorAddress: process.env.KITE_FACILITATOR_ADDRESS || '0x12343e649e6b2b2b77649DFAb88f103c02F3C78b',
  serviceWallet: process.env.KITE_SERVICE_WALLET || '',
});
