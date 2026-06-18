import logger from '../utils/logger.js';

interface CacheEntry {
  price: number;
  timestamp: number;
}

const PRICE_FEED_IDS: Record<string, string> = {
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  USDC: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
};

const FALLBACK_PRICES: Record<string, number> = {
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

const CACHE_TTL_MS = 60_000;

export class PriceFeedService {
  private cache = new Map<string, CacheEntry>();

  async getPrice(tokenSymbol: string): Promise<number> {
    const symbol = tokenSymbol.toUpperCase();
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.price;
    }

    const priceFeedId = PRICE_FEED_IDS[symbol];
    if (!priceFeedId) {
      return FALLBACK_PRICES[symbol] ?? 0;
    }

    try {
      const response = await fetch(
        `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${priceFeedId}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const body: unknown = await response.json();
      const data = body as {
        parsed?: Array<{
          price: { price: string; conf: string; expo: number; publish_time: number };
        }>;
      };

      const parsed = data.parsed?.[0]?.price;
      if (!parsed) {
        throw new Error('no parsed price data in response');
      }

      const price = Number(parsed.price) * Math.pow(10, parsed.expo);
      this.cache.set(symbol, { price, timestamp: Date.now() });
      return price;
    } catch (err) {
      logger.error('PriceFeedService.getPrice failed', {
        token: symbol,
        error: err instanceof Error ? err.message : String(err),
      });
      return FALLBACK_PRICES[symbol] ?? 0;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const priceFeed = new PriceFeedService();
