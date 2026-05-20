import { KitePaymentService } from '../kitePaymentService';

jest.mock('../../utils/prisma', () => ({
  prisma: {
    kitePayment: {
      create: jest.fn().mockResolvedValue({ id: 'kite-payment-1' }),
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({ id: 'kite-payment-1', status: 'COMPLETED' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    payment: {
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

const originalFetch = global.fetch;

const mock402Response = {
  error: 'X-PAYMENT header is required',
  accepts: [
    {
      scheme: 'gokite-aa',
      network: 'kite-testnet',
      maxAmountRequired: '1000000000000000000',
      resource: 'https://test.api/weather',
      description: 'Weather API',
      mimeType: 'application/json',
      payTo: '0x4A50DCA63d541372ad36E5A36F1D542d51164F19',
      maxTimeoutSeconds: 300,
      asset: '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63',
      extra: null,
      merchantName: 'Weather Service',
    },
  ],
  x402Version: 1,
};

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('KitePaymentService', () => {
  let service: KitePaymentService;

  beforeEach(() => {
    service = new KitePaymentService();
  });

  describe('parseX402Response', () => {
    it('parses a valid x402 response', async () => {
      const result = await service.parseX402Response(mock402Response);

      expect(result).not.toBeNull();
      expect(result!.scheme).toBe('gokite-aa');
      expect(result!.network).toBe('kite-testnet');
      expect(result!.maxAmountRequired).toBe('1000000000000000000');
      expect(result!.payTo).toBe('0x4A50DCA63d541372ad36E5A36F1D542d51164F19');
      expect(result!.asset).toBe('0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63');
      expect(result!.resource).toBe('https://test.api/weather');
    });

    it('returns null for empty response', async () => {
      const result = await service.parseX402Response({});
      expect(result).toBeNull();
    });

    it('returns null when accepts array is empty', async () => {
      const result = await service.parseX402Response({ accepts: [] });
      expect(result).toBeNull();
    });
  });

  describe('settleViaFacilitator', () => {
    it('settles successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ txHash: '0xsettlement123' }),
      });

      const result = await service.settleViaFacilitator(
        { amount: '1000000000000000000' },
        '0xsignature',
        'kite-testnet'
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xsettlement123');
    });

    it('handles facilitator failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Facilitator error',
      });

      const result = await service.settleViaFacilitator(
        {},
        '0xsignature',
        'kite-testnet'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyPaymentOnChain', () => {
    it('returns null when transaction not found', async () => {
      const result = await service.verifyPaymentOnChain('0xnonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createKitePaymentRecord', () => {
    it('creates a payment record', async () => {
      const { prisma } = require('../../utils/prisma');
      await service.createKitePaymentRecord({
        paymentId: 'payment-1',
        sessionId: 'session-1',
        agentKiteDid: 'did:kite:0xabc',
        amount: '10',
        asset: 'USDC',
      });
      expect(prisma.kitePayment.create).toHaveBeenCalled();
    });
  });

  describe('getKitePayment', () => {
    it('returns payment by id', async () => {
      const { prisma } = require('../../utils/prisma');
      await service.getKitePayment('kite-payment-1');
      expect(prisma.kitePayment.findUnique).toHaveBeenCalledWith({
        where: { id: 'kite-payment-1' },
        include: { payment: true },
      });
    });
  });
});
