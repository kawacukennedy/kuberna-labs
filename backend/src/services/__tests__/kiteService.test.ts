import { KitePassportService } from '../kiteService';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        kiteWalletAddress: '0xKiteWallet',
        web3Address: '0xWeb3Wallet',
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    agent: {
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

const mockConfig = {
  baseUrl: 'https://agentpassport.ai/api',
  rpcUrl: 'https://rpc-testnet.gokite.ai',
  chainId: 2368,
  paymentTokenAddress: '0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e',
  testnetTokenAddress: '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63',
  facilitatorUrl: 'https://facilitator.pieverse.io',
  facilitatorAddress: '0x12343e649e6b2b2b77649DFAb88f103c02F3C78b',
  serviceWallet: '0xServiceWalletAddress',
};

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('KitePassportService', () => {
  let service: KitePassportService;

  beforeEach(() => {
    service = new KitePassportService(mockConfig);
  });

  describe('getConfig', () => {
    it('returns the config', () => {
      expect(service.getConfig()).toEqual(mockConfig);
    });
  });

  describe('getProvider', () => {
    it('returns a provider', () => {
      const provider = service.getProvider();
      expect(provider).toBeDefined();
    });
  });

  describe('registerKiteAgent', () => {
    it('registers an agent successfully', async () => {
      const mockResponse = {
        agentId: 'kite-agent-123',
        did: 'did:kite:0xabc',
        walletAddress: '0xKiteWallet',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.registerKiteAgent(
        'user-123',
        'test-agent',
        'coding-assistant'
      );

      expect(result).toEqual({
        agentId: 'kite-agent-123',
        kiteDid: 'did:kite:0xabc',
        kiteWalletAddress: '0xKiteWallet',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://agentpassport.ai/api/v1/agents/register',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test-agent'),
        })
      );
    });

    it('throws on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'API Error',
      });

      await expect(
        service.registerKiteAgent('user-123', 'test-agent')
      ).rejects.toThrow('Kite agent registration failed');
    });
  });

  describe('createSpendingSession', () => {
    it('creates a session successfully', async () => {
      const mockResponse = {
        sessionId: 'session-456',
        approvalUrl: 'https://agentpassport.ai/approve/session-456',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.createSpendingSession('user-123', 'did:kite:0xabc', {
        taskSummary: 'Test task',
        maxAmountPerTx: 10,
        maxTotalAmount: 50,
        ttl: '24h',
        assets: ['USDC'],
        paymentApproach: 'x402_http',
      });

      expect(result).toEqual({
        sessionId: 'session-456',
        approvalUrl: 'https://agentpassport.ai/approve/session-456',
      });
    });

    it('throws on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Session error',
      });

      await expect(
        service.createSpendingSession('user-123', 'did:kite:0xabc', {
          taskSummary: 'Test',
          maxAmountPerTx: 1,
          maxTotalAmount: 5,
          ttl: '1h',
          assets: ['USDC'],
          paymentApproach: 'x402_http',
        })
      ).rejects.toThrow('Kite session creation failed');
    });
  });

  describe('getSessionStatus', () => {
    it('returns session status', async () => {
      const mockResponse = {
        status: 'active',
        totalSpent: '5',
        remainingBudget: '45',
        expiresAt: '2026-06-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getSessionStatus('session-456');

      expect(result).toEqual({
        status: 'active',
        totalSpent: '5',
        remainingBudget: '45',
        expiresAt: '2026-06-01T00:00:00Z',
      });
    });
  });

  describe('getWalletBalance', () => {
    it('returns wallet balance', async () => {
      const mockResponse = {
        address: '0xKiteWallet',
        balances: [
          { asset: 'USDC', amount: '100', usdValue: '100' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getWalletBalance('0xKiteWallet');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('setUserKiteWallet', () => {
    it('updates user kit wallet', async () => {
      const { prisma } = require('../../utils/prisma');
      await service.setUserKiteWallet('user-123', '0xNewWallet');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { kiteWalletAddress: '0xNewWallet' },
      });
    });
  });

  describe('updateAgentKiteInfo', () => {
    it('updates agent kite info', async () => {
      const { prisma } = require('../../utils/prisma');
      await service.updateAgentKiteInfo('agent-123', {
        agentId: 'kite-1',
        kiteDid: 'did:kite:0xabc',
        kiteWalletAddress: '0xKiteWallet',
        sessionId: 'session-1',
      });
      expect(prisma.agent.update).toHaveBeenCalled();
    });
  });
});
