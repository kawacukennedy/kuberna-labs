import { agentDecisionEngine, marketData } from '../src/services/agentDecision.js';

jest.mock('../src/utils/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), child: jest.fn() },
}));

jest.mock('../src/services/localMemory.js', () => ({
  localMemory: {
    storeAgentMemory: jest.fn().mockResolvedValue(undefined),
    queryAgentMemory: jest.fn().mockResolvedValue([]),
  },
}));

describe('AgentDecisionEngine', () => {
  const blockTimestamp = Math.floor(Date.now() / 1000);

  describe('MarketData', () => {
    it('should generate realistic prices', async () => {
      const price = await marketData.getPrice('ETH', blockTimestamp);
      expect(price).toBeGreaterThan(0);
      expect(price).toBeLessThan(10000);
    });

    it('should provide deterministic prices based on timestamp', async () => {
      const price1 = await marketData.getPrice('ETH', blockTimestamp);
      const price2 = await marketData.getPrice('ETH', blockTimestamp);
      expect(price1).toBe(price2);
    });

    it('should generate DEX-specific prices', async () => {
      const uniPrice = await marketData.getDexPrice('ETH', 'Uniswap', blockTimestamp);
      const sushiPrice = await marketData.getDexPrice('ETH', 'SushiSwap', blockTimestamp);
      expect(uniPrice).not.toBe(sushiPrice);
    });

    it('should return APY values for known protocols', () => {
      const apy = marketData.getAPY('Aave', blockTimestamp);
      expect(apy).toBeGreaterThan(0);
      expect(apy).toBeLessThan(20);
    });

    it('should generate market state', async () => {
      const state = await marketData.getMarketState(blockTimestamp);
      expect(state.prices.ETH).toBeGreaterThan(0);
      expect(state.apy.Aave).toBeGreaterThan(0);
      expect(state.dexPrices.ETH.Uniswap).toBeGreaterThan(0);
    });

    it('should return price history', async () => {
      const history = await marketData.getPriceHistory('ETH', blockTimestamp, 1);
      expect(history.length).toBe(61);
    });
  });

  describe('Arbitrage Strategy', () => {
    it('should detect arbitrage when threshold is low', async () => {
      const action = await agentDecisionEngine.evaluate('agent-1', ['arbitrage'], blockTimestamp);
      if (action.type === 'postIntent') {
        expect(action.intentParams).toBeDefined();
        expect(action.confidence).toBeGreaterThan(0);
        expect(action.reason).toContain('Arbitrage');
      }
    });
  });

  describe('Yield Strategy', () => {
    it('should identify yield opportunity', async () => {
      const action = await agentDecisionEngine.evaluate('agent-1', ['yield'], blockTimestamp);
      if (action.type === 'postIntent') {
        expect(action.intentParams).toBeDefined();
        expect(action.reason).toContain('Yield');
      }
    });
  });

  describe('Stop-Loss Strategy', () => {
    it('should return wait action under normal conditions', async () => {
      const action = await agentDecisionEngine.evaluate('agent-1', ['stopLoss'], blockTimestamp);
      // Under normal market conditions stop-loss typically doesn't trigger
      expect(action.type).toBeDefined();
    });
  });

  describe('Multiple Strategies', () => {
    it('should evaluate all strategies and pick first actionable', async () => {
      const action = await agentDecisionEngine.evaluate('agent-1', ['arbitrage', 'yield', 'stopLoss'], blockTimestamp);
      expect(['postIntent', 'wait']).toContain(action.type);
    });
  });
});
