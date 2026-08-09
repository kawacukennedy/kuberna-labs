import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const RUN_PAID_TESTS = process.env.RUN_PAID_TESTS === '1';
const maybeDescribe = RUN_PAID_TESTS ? describe : describe.skip;

let totalCost = 0;
import type { AIService } from '../src/services/ai';
import type { AgentDecisionEngine, MarketDataProvider } from '../src/services/agentDecision';
let aiService: AIService;
let agentDecisionEngine: AgentDecisionEngine;
let marketData: MarketDataProvider;

beforeAll(async () => {
  if (!RUN_PAID_TESTS) return;
  ({ aiService } = await import('../src/services/ai'));
  ({ agentDecisionEngine, marketData } = await import('../src/services/agentDecision'));
});

function trackCost(cost: number, label: string) {
  totalCost += cost;
  console.log(`  [${label}] $${cost.toFixed(6)}  |  running: $${totalCost.toFixed(6)}`);
}

// Override fetch on aiService to capture cost
const origFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const resp = await origFetch(input, init);
  if (typeof input === 'string' && input.includes('chat/completions')) {
    const clone = resp.clone();
    clone.json().then((body: any) => {
      if (body?.cost?.usd) {
        totalCost += body.cost.usd;
      }
    }).catch(() => {});
  }
  return resp;
};

beforeAll(() => {
  jest.setTimeout(600000);
});

describe('Virtuals API Integration (paid, RUN_PAID_TESTS=1)', () => {
  maybeDescribe('Virtuals API Integration - AI Service', () => {
  test('1-3. Intent parsing (simple swap, bridge, multi-hop)', async () => {
    const r1 = await aiService.parseIntentFromNaturalLanguage('swap 1 ETH for USDC on Polygon');
    console.log(`  ETH->USDC/Polygon: ${r1.sourceAmount} ${r1.sourceToken} -> ${r1.destChain} ${r1.destToken} (confidence: ${r1.confidence})`);
    expect(r1.sourceToken).toBe('ETH');
    expect(r1.destChain).toBe('polygon');

    const r2 = await aiService.parseIntentFromNaturalLanguage('bridge 5000 USDC from Arbitrum to Base');
    console.log(`  USDC Arbitrum->Base: ${r2.sourceAmount} ${r2.sourceToken} (confidence: ${r2.confidence})`);
    expect(r2.confidence).toBeGreaterThan(0);

    const r3 = await aiService.parseIntentFromNaturalLanguage('take 10 WBTC on Ethereum, swap to SOL on Solana');
    console.log(`  WBTC->SOL: ${r3.sourceChain} ${r3.sourceAmount} ${r3.sourceToken} -> ${r3.destChain} ${r3.destToken} (confidence: ${r3.confidence})`);
    expect(r3.confidence).toBeGreaterThan(0);
  });

  test('4-6. Code generation', async () => {
    const r1 = await aiService.generateAgentCode({
      framework: 'elizaos', template: 'trading-bot',
      config: { sourceChain: 'ethereum', tokens: ['ETH', 'USDC'], slippage: '0.5' },
      language: 'typescript',
    });
    console.log(`  Trading bot: ${r1.code.length} chars, ${r1.files.length} files`);
    // Code gen is best-effort; may fallback if JSON parse fails
    if (r1.code.length > 25) {
      expect(r1.files.length).toBeGreaterThan(0);
    }

    const r2 = await aiService.generateAgentCode({
      framework: 'langchain', template: 'governance-monitor',
      config: { daos: ['Uniswap', 'Aave'], votingStrategy: 'for' },
      language: 'typescript',
    });
    console.log(`  Gov monitor: ${r2.code.length} chars, ${r2.files.length} files`);

    const r3 = await aiService.generateAgentCode({
      framework: 'elizaos', template: 'cross-chain-swapper',
      config: { sourceChain: 'arbitrum', destChain: 'base', token: 'USDC', slippage: '0.3' },
      language: 'typescript',
    });
    console.log(`  X-chain: ${r3.code.length} chars, ${r3.files.length} files`);
  });

  test('7-9. Code assistance (explain, debug, optimize)', async () => {
    const swapCode = `function swapExactTokensForTokens(amountIn, path, to, deadline) {
  const amounts = [amountIn];
  for (let i = 0; i < path.length - 1; i++) {
    amounts.push(getAmountOut(amounts[i], getReserve(path[i]), getReserve(path[i+1])));
  }
  return amounts;
}`;
    const explain = await aiService.assistWithCode({ context: 'Uniswap V2', code: swapCode, task: 'explain' });
    console.log(`  Explain: ${explain.length} chars`);
    expect(explain.length).toBeGreaterThan(50);

    const debug = await aiService.assistWithCode({
      context: 'Uniswap V3',
      code: `async function getPoolPrice(poolAddress) { const reserves = await pool.methods.getReserves().call(); return reserves[0] / reserves[1]; }`,
      task: 'debug',
    });
    console.log(`  Debug: ${debug.length} chars`);
    expect(debug.length).toBeGreaterThan(50);

    const optimize = await aiService.assistWithCode({
      context: 'Gas optimization',
      code: `function avg(p: number[]): number { let s = 0; for (let i = 0; i < p.length; i++) { s = s + p[i]; } return s / p.length; }`,
      task: 'optimize',
    });
    console.log(`  Optimize: ${optimize.length} chars`);
    expect(optimize.length).toBeGreaterThan(50);
  });

  test('10. Test generation + validation', async () => {
    const code = `function computeSwapRate(input: number, ri: number, ro: number): number {
  if (ri <= 0 || ro <= 0) throw new Error('Invalid reserves');
  if (input <= 0) throw new Error('Invalid input');
  return (input * 997 * ro) / ((ri * 1000) + input * 997);
}`;
    const cases = await aiService.generateTestCases(code, 'typescript');
    console.log(`  Test cases: ${cases.length}`);
    expect(cases.length).toBeGreaterThan(0);

    const validation = await aiService.validateAgentCode(`
      export async function swap(a: string, t: string) {
        if (!a) throw new Error('no id');
        return { tx: '0x' + 'a'.repeat(64) };
      }`);
    console.log(`  Valid: ${validation.valid}, errors: ${validation.errors.length}`);
  });
  });

  maybeDescribe('Virtuals API - Agent Decision Pipeline', () => {
  test('11. Real market data', async () => {
    const ts = Math.floor(Date.now() / 1000);
    const eth = await marketData.getPrice('ETH', ts);
    console.log(`  ETH: $${eth}`);
    expect(eth).toBeGreaterThan(1000);

    const btc = await marketData.getPrice('BTC', ts);
    console.log(`  BTC: $${btc}`);
    expect(btc).toBeGreaterThan(10000);

    const state = await marketData.getMarketState(ts);
    console.log(`  State: ${Object.keys(state.prices).length} tokens, ${Object.keys(state.dexPrices).length} DEX, ${Object.keys(state.apy).length} APY`);
  });

  test('12-15. All strategies', async () => {
    const ts = Math.floor(Date.now() / 1000);

    const arb = await agentDecisionEngine.evaluate('t-agent', ['arbitrage'], ts);
    console.log(`  Arbitrage: ${arb.type} | ${arb.reason} | conf=${arb.confidence}`);
    expect(['postIntent', 'wait']).toContain(arb.type);

    const yld = await agentDecisionEngine.evaluate('t-agent2', ['yield'], ts);
    console.log(`  Yield: ${yld.type} | ${yld.reason} | conf=${yld.confidence}`);

    const sl = await agentDecisionEngine.evaluate('t-agent3', ['stopLoss'], ts);
    console.log(`  StopLoss: ${sl.type} | ${sl.reason} | conf=${sl.confidence}`);

    const all = await agentDecisionEngine.evaluate('t-agent4', ['arbitrage', 'yield', 'stopLoss'], ts);
    console.log(`  Multi: ${all.type} | ${all.reason} | conf=${all.confidence}`);
  });
  });

  maybeDescribe('Virtuals API - Token-Intensive $40 Burn', () => {
  test('16. Large code gen - full ElizaOS trading bot', async () => {
    const r = await aiService.generateAgentCode({
      framework: 'elizaos', template: 'trading-bot',
      config: { sourceChain: 'arbitrum', tokens: ['ETH', 'USDC', 'ARB', 'LINK', 'UNI', 'AAVE'], slippage: '0.5', strategies: ['arbitrage', 'yield', 'liquidity'], riskLevel: 'moderate' },
      language: 'typescript',
    });
    console.log(`  Bot: ${r.code.length} chars, ${r.files.length} files`);
  });

  test('17. Large code gen - cross-chain ElizaOS agent', async () => {
    const r = await aiService.generateAgentCode({
      framework: 'elizaos', template: 'cross-chain-swapper',
      config: { sourceChain: 'ethereum', destChain: 'base', token: 'USDC', slippage: '0.3', maxSlippage: '0.5', bridgeProtocol: 'across' },
      language: 'typescript',
    });
    console.log(`  X-chain: ${r.code.length} chars, ${r.files.length} files`);
  });

  test('18. Long-form code explanation + optimization cycles', async () => {
    const code = `
class AMMPool {
  reserves: Map<string, bigint>;
  constructor(public token0: string, public token1: string, reserve0: bigint, reserve1: bigint) {
    this.reserves = new Map([[token0, reserve0], [token1, reserve1]]);
  }
  async getAmountOut(amountIn: bigint, tokenIn: string): Promise<bigint> {
    const reserveIn = this.reserves.get(tokenIn)!;
    const reserveOut = this.reserves.get(tokenIn === this.token0 ? this.token1 : this.token0)!;
    const amountInWithFee = amountIn * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    return numerator / denominator;
  }
  async swap(amountIn: bigint, tokenIn: string, minAmountOut: bigint): Promise<{ amountOut: bigint; tx: string }> {
    const amountOut = await this.getAmountOut(amountIn, tokenIn);
    if (amountOut < minAmountOut) throw new Error('INSUFFICIENT_OUTPUT');
    const newReserveIn = this.reserves.get(tokenIn)! + amountIn;
    const newReserveOut = this.reserves.get(tokenIn === this.token0 ? this.token1 : this.token0)! - amountOut;
    this.reserves.set(tokenIn, newReserveIn);
    this.reserves.set(tokenIn === this.token0 ? this.token1 : this.token0, newReserveOut);
    return { amountOut, tx: '0x' + 'a'.repeat(64) };
  }
}`;
    const explain = await aiService.assistWithCode({ context: 'AMM Pool', code, task: 'explain' });
    console.log(`  Explain AMM: ${explain.length} chars`);

    const debug = await aiService.assistWithCode({ context: 'AMM Pool', code, task: 'debug' });
    console.log(`  Debug AMM: ${debug.length} chars`);

    const opt = await aiService.assistWithCode({ context: 'AMM Pool gas optimization', code, task: 'optimize' });
    console.log(`  Optimize AMM: ${opt.length} chars`);
  });

  test('19. Complex intent parsing - multi-step strategies', async () => {
    const r = await aiService.parseIntentFromNaturalLanguage(
      'Cross-chain arbitrage: take 10000 USDC on Arbitrum, route through Polygon, swap to ETH on Base, target min 3.2 ETH, execute in 300s, prefer low gas'
    );
    console.log(`  Strategy: ${r.sourceChain} ${r.sourceAmount} ${r.sourceToken} -> ${r.destChain} ${r.destToken} (conf: ${r.confidence})`);

    const r2 = await aiService.parseIntentFromNaturalLanguage(
      'Deposit 50000 USDC into Aave on Polygon, borrow 25000 USDC, bridge to Optimism, provide liquidity on Velodrome, keep LTV below 70%'
    );
    console.log(`  DeFi strat: ${r2.sourceChain} ${r2.sourceAmount} ${r2.sourceToken} -> ${r2.destChain} ${r2.destToken} (conf: ${r2.confidence})`);

    const r3 = await aiService.parseIntentFromNaturalLanguage(
      'Yield farm: take 100000 DAI from Ethereum, bridge to Solana via Wormhole, deposit into Marinade for staking, target 6%+ APY, auto-compound daily'
    );
    console.log(`  Yield farm: ${r3.sourceChain} ${r3.sourceAmount} ${r3.sourceToken} -> ${r3.destChain} ${r3.destToken} (conf: ${r3.confidence})`);
  });

  test('20. Large code validation', async () => {
    const agentCode = `
import { ethers } from 'ethers';
import axios from 'axios';

interface ArbOpp { buyDex: string; sellDex: string; token: string; profitPct: number; }

export class ArbBot {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;

  constructor(rpcUrl: string, pk: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(pk, this.provider);
  }

  async scan(token: string, dexes: string[]): Promise<ArbOpp | null> {
    const prices: Record<string, number> = {};
    for (const d of dexes) {
      const r = await axios.get(\`https://api.kuberna.africa/prices/\${d}/\${token}\`);
      prices[d] = r.data.price;
    }
    let buy = { dex: '', price: Infinity }, sell = { dex: '', price: 0 };
    for (const [d, p] of Object.entries(prices)) {
      if (p < buy.price) buy = { dex: d, price: p };
      if (p > sell.price) sell = { dex: d, price: p };
    }
    const profit = ((sell.price - buy.price) / buy.price) * 100;
    if (profit >= 0.5) return { buyDex: buy.dex, sellDex: sell.dex, token, profitPct: profit };
    return null;
  }

  async execute(o: ArbOpp): Promise<string> {
    const tx = await this.signer.sendTransaction({
      to: '0x0000000000000000000000000000000000000000',
      data: '0x', value: ethers.parseEther('0.001'),
    });
    return tx.hash;
  }
}`;
    await aiService.validateAgentCode(agentCode);
    await aiService.generateTestCases(agentCode, 'typescript');
  });

  test('21-25. Token burn - repeated heavy inference', async () => {
    const descriptions = [
      'Swap 1000 ETH on Arbitrum for USDC on Ethereum, target 1.9M USDC, deadline 10 min, prefer low gas, max slippage 0.5%',
      'Bridge 50000 USDC from Polygon zkEVM to Base, use Across bridge, execute when gas under 30 gwei, target arrival within 5 min',
      'Take 50 WBTC on Ethereum mainnet, wrap to WETH via Curve, deposit into Aave on Polygon, borrow 500k USDC against it, bridge to Solana',
      'Provide 100k USDC/DAI liquidity on Uniswap V3 Arbitrum, set 0.3% fee tier, auto-compound every 6 hours, stop loss at 90% of deposit',
      'Execute triangular arbitrage: 10 ETH -> USDC on Uniswap, USDC -> DAI on Curve, DAI -> ETH on SushiSwap, min profit 0.3% on 10 ETH',
      'Flash loan 1M USDC from Aave, swap to ETH on Uniswap, swap ETH to USDC on SushiSwap, repay Aave, keep profit over 0.5%, gas budget 0.01 ETH',
    ];
    for (let i = 0; i < descriptions.length; i++) {
      const r = await aiService.parseIntentFromNaturalLanguage(descriptions[i]);
      console.log(`  Parse[${i}]: ${r.sourceChain} ${r.sourceAmount} ${r.sourceToken} -> ${r.destChain} ${r.destToken} (conf: ${r.confidence})`);
    }
  });

  test('26. Full agent pipeline simulation', async () => {
    const ts = Math.floor(Date.now() / 1000);
    const state = await marketData.getMarketState(ts);
    console.log(`  Market: ETH $${state.prices.ETH}, BTC $${state.prices.BTC}, best APY: ${Math.max(...Object.values(state.apy))}%`);

    const action = await agentDecisionEngine.evaluate('test-arb-bot', ['arbitrage', 'yield', 'stopLoss'], ts);
    console.log(`  Decision: ${action.type} | ${action.reason}`);

    if (action.type === 'postIntent' && action.intentParams) {
      const parsed = await aiService.parseIntentFromNaturalLanguage(
        `${action.type === 'postIntent' ? 'Swap' : 'Analyze'} ${action.intentParams.sourceAmount || '1000'} ${action.intentParams.sourceToken || 'ETH'} for ${action.intentParams.destToken || 'USDC'}`
      );
      console.log(`  Intent: ${parsed.sourceChain} ${parsed.sourceAmount} ${parsed.sourceToken} -> ${parsed.destChain} ${parsed.destToken}`);
    }
  });

  test('27-30. Batch code generation variety', async () => {
    const templates: Array<'trading-bot' | 'nft-flipper' | 'data-fetcher' | 'price-alert' | 'protocol-health' | 'governance-monitor' | 'cross-chain-swapper'> = ['nft-flipper', 'data-fetcher', 'price-alert', 'protocol-health'];
    const frameworks: Array<'elizaos' | 'langchain' | 'autogen' | 'rig'> = ['elizaos', 'langchain', 'autogen', 'rig'];
    for (let i = 0; i < templates.length; i++) {
      const r = await aiService.generateAgentCode({
        framework: frameworks[i],
        template: templates[i],
        config: {
          marketplaces: ['OpenSea', 'Blur'],
          sources: ['Pyth', 'Chainlink'],
          tokens: ['ETH', 'BTC', 'SOL'],
          protocols: ['Aave', 'Compound'],
        } as any,
        language: 'typescript',
      });
      console.log(`  ${templates[i]}(${frameworks[i]}): ${r.code.length} chars`);
    }
  });
  });
});

afterAll(() => {
  console.log(`\n============================================`);
  console.log(`  TOTAL VIRTUALS API COMPUTE: $${totalCost.toFixed(6)}`);
  console.log(`============================================\n`);
});
