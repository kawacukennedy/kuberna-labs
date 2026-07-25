import { AiManager } from '../src/ai.js';

describe('AiManager', () => {
  let mockSDK: any;
  let aiManager: AiManager;

  beforeEach(() => {
    mockSDK = {
      request: jest.fn(),
    };

    aiManager = new AiManager(mockSDK);
  });

  describe('parseIntent', () => {
    it('parses intent from description', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          sourceChain: 'ethereum',
          sourceToken: 'USDC',
          sourceAmount: '100',
          destChain: 'polygon',
          destToken: 'USDC',
          minDestAmount: '99',
          timeoutSeconds: 3600,
          budget: 10,
          currency: 'USDC',
          confidence: 0.95,
          rawDescription: 'Transfer 100 USDC from Ethereum to Polygon',
        },
      });

      const result = await aiManager.parseIntent('Transfer 100 USDC from Ethereum to Polygon');

      expect(result.sourceChain).toBe('ethereum');
      expect(result.destChain).toBe('polygon');
      expect(result.sourceToken).toBe('USDC');
      expect(result.confidence).toBe(0.95);
    });
  });

  describe('getDecision', () => {
    it('returns agent decision', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          action: 'swap',
          reason: 'Best rate found',
          confidence: 0.9,
          parameters: { protocol: 'uniswap' },
          timestamp: '2024-01-01T00:00:00Z',
        },
      });

      const result = await aiManager.getDecision('agent-1', { market: 'bullish' });

      expect(result.action).toBe('swap');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('analyze', () => {
    it('analyzes text and returns result', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          intent: 'market_analysis',
          entities: { token: 'ETH', price: '3000' },
          sentiment: 'positive',
          confidence: 0.85,
        },
      });

      const result = await aiManager.analyze({
        text: 'ETH price is going up',
      });

      expect(result.intent).toBe('market_analysis');
      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBe(0.85);
    });
  });
});
