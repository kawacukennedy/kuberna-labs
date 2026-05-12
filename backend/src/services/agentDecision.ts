import logger from '../utils/logger.js';
import { localMemory } from './localMemory.js';
import type { StructuredIntent } from './intentParser.js';

export interface MarketState {
  prices: Record<string, number>;
  dexPrices: Record<string, Record<string, number>>;
  apy: Record<string, number>;
  timestamp: number;
  blockTimestamp: number;
}

export interface Action {
  type: 'postIntent' | 'wait';
  intentParams?: Partial<StructuredIntent>;
  reason: string;
  confidence: number;
}

export type DecisionStrategy = 'arbitrage' | 'yield' | 'stopLoss';

interface DecisionConfig {
  arbitrageThreshold: number;
  maxSlippage: number;
  stopLossPercent: number;
  minYieldDiff: number;
}

const defaultConfig: DecisionConfig = {
  arbitrageThreshold: parseFloat(process.env.AGENT_ARBITRAGE_THRESHOLD || '0.5'),
  maxSlippage: parseFloat(process.env.AGENT_MAX_SLIPPAGE || '1.0'),
  stopLossPercent: parseFloat(process.env.AGENT_STOP_LOSS_PERCENT || '5.0'),
  minYieldDiff: parseFloat(process.env.AGENT_MIN_YIELD_DIFF || '1.0'),
};

class MockMarketDataProvider {
  private basePrices: Record<string, number> = {
    ETH: 3200,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    SOL: 140,
    NEAR: 4.5,
    MATIC: 0.7,
    BTC: 65000,
    LINK: 15,
    UNI: 8,
    AAVE: 120,
    ARB: 1.2,
  };

  private dexes = ['Uniswap', 'SushiSwap', 'Curve', 'Raydium', 'Orca'];

  getPrice(token: string, blockTimestamp: number): number {
    const base = this.basePrices[token.toUpperCase()] || 1;
    const seed = Math.sin(blockTimestamp * 0.001 + this.hashToken(token)) * 0.1;
    const fluctuation = 1 + seed;
    return base * fluctuation;
  }

  getDexPrice(token: string, dex: string, blockTimestamp: number): number {
    const base = this.getPrice(token, blockTimestamp);
    const seed = Math.sin(blockTimestamp * 0.0007 + this.hashToken(token) + this.hashToken(dex)) * 0.03;
    const dexSpread = 1 + seed;
    return base * dexSpread;
  }

  getAPY(protocol: string, blockTimestamp: number): number {
    const baseRates: Record<string, number> = {
      Aave: 3.5,
      Compound: 2.8,
      Curve: 5.2,
      Lido: 3.2,
      RocketPool: 3.0,
      Marinade: 6.5,
    };
    const base = baseRates[protocol] || 3.0;
    const seed = Math.sin(blockTimestamp * 0.0005 + this.hashToken(protocol)) * 1.5;
    return base + seed;
  }

  getPriceHistory(token: string, blockTimestamp: number, hours = 1): number[] {
    const history: number[] = [];
    const intervals = hours * 60;
    for (let i = intervals; i >= 0; i--) {
      const ts = blockTimestamp - i * 60;
      history.push(this.getPrice(token, ts));
    }
    return history;
  }

  getMarketState(blockTimestamp: number): MarketState {
    const prices: Record<string, number> = {};
    const dexPrices: Record<string, Record<string, number>> = {};
    const apy: Record<string, number> = {};

    for (const token of Object.keys(this.basePrices)) {
      prices[token] = this.getPrice(token, blockTimestamp);
      dexPrices[token] = {};
      for (const dex of this.dexes) {
        dexPrices[token][dex] = this.getDexPrice(token, dex, blockTimestamp);
      }
    }

    for (const protocol of ['Aave', 'Compound', 'Curve', 'Lido', 'RocketPool', 'Marinade']) {
      apy[protocol] = this.getAPY(protocol, blockTimestamp);
    }

    return { prices, dexPrices, apy, timestamp: Date.now(), blockTimestamp };
  }

  private hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

export const marketData = new MockMarketDataProvider();

export class AgentDecisionEngine {
  private config: DecisionConfig;

  constructor(config: Partial<DecisionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async evaluate(
    agentId: string,
    strategies: DecisionStrategy[],
    blockTimestamp: number,
  ): Promise<Action> {
    const state = marketData.getMarketState(blockTimestamp);

    for (const strategy of strategies) {
      switch (strategy) {
        case 'arbitrage': {
          const action = this.evaluateArbitrage(state);
          if (action.type === 'postIntent') {
            await this.recordMemory(agentId, 'arbitrage', state, action, true);
            return action;
          }
          break;
        }
        case 'yield': {
          const action = this.evaluateYield(state);
          if (action.type === 'postIntent') {
            await this.recordMemory(agentId, 'yield', state, action, true);
            return action;
          }
          break;
        }
        case 'stopLoss': {
          const action = this.evaluateStopLoss(state, blockTimestamp);
          if (action.type === 'postIntent') {
            await this.recordMemory(agentId, 'stopLoss', state, action, true);
            return action;
          }
          break;
        }
      }
    }

    return {
      type: 'wait',
      reason: 'No actionable opportunity detected across any strategy',
      confidence: 0,
    };
  }

  private evaluateArbitrage(state: MarketState): Action {
    const tokens = ['ETH', 'USDC', 'SOL', 'BTC'];
    const threshold = this.config.arbitrageThreshold;

    for (const token of tokens) {
      if (!state.dexPrices[token]) continue;
      const dexes = Object.entries(state.dexPrices[token]);
      for (let i = 0; i < dexes.length; i++) {
        for (let j = i + 1; j < dexes.length; j++) {
          const [dexA, priceA] = dexes[i];
          const [dexB, priceB] = dexes[j];
          const diff = Math.abs(priceA - priceB);
          const pctDiff = (diff / Math.min(priceA, priceB)) * 100;

          if (pctDiff >= threshold) {
            const buyDex = priceA < priceB ? dexA : dexB;
            const sellDex = priceA < priceB ? dexB : dexA;

            return {
              type: 'postIntent',
              intentParams: {
                sourceToken: token,
                destToken: 'USDC',
                sourceAmount: '1000',
                minDestAmount: '0',
                timeoutSeconds: 300,
                budget: 10,
                currency: 'USDC',
              },
              reason: `Arbitrage opportunity: ${token} ${pctDiff.toFixed(2)}% difference between ${buyDex} and ${sellDex}`,
              confidence: Math.min(pctDiff / 10, 0.95),
            };
          }
        }
      }
    }

    return { type: 'wait', reason: 'No arbitrage opportunity above threshold', confidence: 0 };
  }

  private evaluateYield(state: MarketState): Action {
    const protocols = Object.entries(state.apy);
    let bestProtocol = '';
    let bestApy = 0;

    for (const [protocol, apy] of protocols) {
      if (apy > bestApy) {
        bestApy = apy;
        bestProtocol = protocol;
      }
    }

    for (const [protocol, apy] of protocols) {
      if (protocol !== bestProtocol && (bestApy - apy) >= this.config.minYieldDiff) {
        return {
          type: 'postIntent',
          intentParams: {
            sourceToken: 'USDC',
            destToken: 'USDC',
            sourceAmount: '5000',
            minDestAmount: '0',
            timeoutSeconds: 600,
            budget: 5,
            currency: 'USDC',
          },
          reason: `Yield optimization: Move funds from ${protocol} (${apy.toFixed(2)}% APY) to ${bestProtocol} (${bestApy.toFixed(2)}% APY)`,
          confidence: Math.min((bestApy - apy) / 5, 0.95),
        };
      }
    }

    return { type: 'wait', reason: 'No yield optimization opportunity', confidence: 0 };
  }

  private evaluateStopLoss(state: MarketState, blockTimestamp: number): Action {
    const tokens = ['ETH', 'SOL', 'BTC'];
    const threshold = this.config.stopLossPercent;

    for (const token of tokens) {
      const priceHistory = marketData.getPriceHistory(token, blockTimestamp, 1);
      if (priceHistory.length < 2) continue;

      const currentPrice = priceHistory[priceHistory.length - 1];
      const oldPrice = priceHistory[0];
      const drop = ((oldPrice - currentPrice) / oldPrice) * 100;

      if (drop >= threshold) {
        return {
          type: 'postIntent',
          intentParams: {
            sourceToken: token,
            destToken: 'USDC',
            sourceAmount: '100',
            minDestAmount: '0',
            timeoutSeconds: 120,
            budget: 3,
            currency: 'USDC',
          },
          reason: `Stop-loss triggered: ${token} dropped ${drop.toFixed(2)}% in the last hour (threshold: ${threshold}%)`,
          confidence: Math.min(drop / 10, 0.95),
        };
      }
    }

    return { type: 'wait', reason: 'No stop-loss conditions triggered', confidence: 0 };
  }

  private async recordMemory(
    agentId: string,
    strategy: string,
    state: MarketState,
    action: Action,
    success: boolean,
  ): Promise<void> {
    try {
      await localMemory.storeAgentMemory(
        agentId,
        strategy,
        { prices: state.prices, dexPrices: state.dexPrices, apy: state.apy },
        { type: action.type, params: action.intentParams, reason: action.reason },
        success,
      );
    } catch {
      logger.warn('Failed to record agent decision memory', { agentId, strategy });
    }
  }
}

export const agentDecisionEngine = new AgentDecisionEngine();
