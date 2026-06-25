---
title: 'Post 21: Writing Custom Strategy Agents — Arbitrage, Yield, and Limit Orders'
slug: custom-strategy-agents
---

## Title Field

Put this in the **Title** field:

> Writing Custom Strategy Agents: Arbitrage, Yield, and Limit Orders

## Subtitle Field

Put this in the **Subtitle** field:

> Extend the agent decision engine. Implement strategies that monitor multiple chains and execute when conditions are met.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Write custom AI strategy agents for DeFi arbitrage, yield, and limit orders

**Meta description** (155-160 chars):

> Three ready-to-run strategy agents for Kuberna Labs. Cross-chain arbitrage, yield optimization, and limit orders. Full code included.

**Post URL slug**:

> custom-strategy-agents

## Body

Put this in the main body editor:

If you've been following this series, you already know Kuberna Labs gives AI agents secure execution rails — TEE attestation, on-chain escrow, cross-chain intents. But an execution rail is just a track. You still need a train.

That train is your **strategy agent** — the decision logic that watches markets, evaluates conditions, and decides when to fire an intent.

The strategy interface is deliberately minimal. You implement a single method: `evaluate(context: StrategyContext) -> Intent | null`. The engine calls it every block (or every N seconds for off-chain strategies). Return null if no action. Return an Intent if conditions are met. That's it.

Let's build three real ones.

---

### Strategy 1: Cross-Chain Arbitrage

The idea: monitor Uniswap V3 on Ethereum (ETH/USDC) and Jupiter on Solana (USDC/ETH). If the effective price differs by more than your threshold (after gas and slippage), execute a swap on the cheaper side.

```typescript
import { Strategy, StrategyContext, Intent } from '@kuberna/strategy';
import { ethers } from 'ethers';

interface ArbitrageConfig {
  thresholdBps: number; // e.g., 50 = 0.5%
  tradeSize: ethers.BigNumber; // in USDC
  evmRpc: string;
  solanaRpc: string;
}

export class CrossChainArbitrageStrategy implements Strategy {
  private config: ArbitrageConfig;

  constructor(config: ArbitrageConfig) {
    this.config = config;
  }

  async evaluate(ctx: StrategyContext): Promise<Intent | null> {
    const { getPrice } = ctx.providers;

    const [ethPriceOnEth, ethPriceOnSol] = await Promise.all([
      getPrice('uniswap', {
        chain: 'ethereum',
        base: 'ETH',
        quote: 'USDC',
        rpc: this.config.evmRpc,
      }),
      getPrice('jupiter', {
        chain: 'solana',
        base: 'USDC',
        quote: 'ETH',
        rpc: this.config.solanaRpc,
      }),
    ]);

    const effectiveSolPrice = 1 / ethPriceOnSol; // invert to ETH/USDC
    const diff = Math.abs(ethPriceOnEth - effectiveSolPrice);
    const diffBps = (diff / Math.max(ethPriceOnEth, effectiveSolPrice)) * 10000;

    if (diffBps < this.config.thresholdBps) return null;

    const buyOnEth = ethPriceOnEth < effectiveSolPrice;

    return {
      type: 'ARBITRAGE',
      steps: [
        {
          action: 'swap',
          chain: buyOnEth ? 'ethereum' : 'solana',
          from: buyOnEth ? 'USDC' : 'ETH',
          to: buyOnEth ? 'ETH' : 'USDC',
          amount: this.config.tradeSize.toString(),
        },
        {
          action: 'swap',
          chain: buyOnEth ? 'solana' : 'ethereum',
          from: buyOnEth ? 'ETH' : 'USDC',
          to: buyOnEth ? 'USDC' : 'ETH',
          amount: '__OUTPUT_OF_STEP_1__',
        },
      ],
      constraints: {
        maxSlippageBps: 30,
        deadline: 60, // seconds
      },
    };
  }
}
```

The engine handles the rest: intent submission, escrow funding, execution, and settlement across chains. Your strategy only needs to spot the opportunity.

---

### Strategy 2: Yield Optimizer

Deposit liquidity into the highest-APY pool across a set of protocols and chains. Rebalance when the leader changes by more than a threshold.

```typescript
interface YieldConfig {
  pools: { chain: string; protocol: string; pool: string }[];
  minApyDelta: number; // rebalance if leader is this much higher
}

export class YieldOptimizerStrategy implements Strategy {
  private config: YieldConfig;

  async evaluate(ctx: StrategyContext): Promise<Intent | null> {
    const currentPool = await ctx.state.get('currentPool');
    const rates = await Promise.all(
      this.config.pools.map(async (p) => ({
        ...p,
        apy: await ctx.providers.getApy(p.chain, p.protocol, p.pool),
      }))
    );

    rates.sort((a, b) => b.apy - a.apy);
    const best = rates[0];

    // If already in best pool, do nothing
    if (currentPool && currentPool.pool === best.pool) return null;

    // If rebalance delta is too small, skip
    if (currentPool && best.apy - currentPool.apy < this.config.minApyDelta) {
      return null;
    }

    return {
      type: 'YIELD_REBALANCE',
      steps: [
        // Withdraw from current pool if exists
        ...(currentPool
          ? [
              {
                action: 'withdraw_liquidity',
                chain: currentPool.chain,
                protocol: currentPool.protocol,
                pool: currentPool.pool,
                amount: '__ALL__',
              },
            ]
          : []),
        // Deposit to best pool
        {
          action: 'deposit_liquidity',
          chain: best.chain,
          protocol: best.protocol,
          pool: best.pool,
          amount: currentPool ? '__ALL__' : this.config.depositAmount,
        },
      ],
      constraints: { maxSlippageBps: 50 },
      postExecute: async () => {
        await ctx.state.set('currentPool', best);
      },
    };
  }
}
```

The `state` API is a simple KV store scoped to your agent. Use it to persist position data, last-checked blocks, or any accumulator across evaluations.

---

### Strategy 3: Limit Order

Execute a swap when the market price crosses a threshold. This is the simplest strategy but the most requested.

```typescript
interface LimitOrderConfig {
  chain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  triggerPrice: number; // trigger when market price reaches this
  isAbove: boolean; // trigger above or below?
  source: string; // e.g., 'uniswap'
}

export class LimitOrderStrategy implements Strategy {
  private config: LimitOrderConfig;
  private triggered = false;

  async evaluate(ctx: StrategyContext): Promise<Intent | null> {
    if (this.triggered) return null;

    const price = await ctx.providers.getPrice(this.config.source, {
      chain: this.config.chain,
      base: this.config.fromToken,
      quote: this.config.toToken,
    });

    const hit = this.config.isAbove
      ? price >= this.config.triggerPrice
      : price <= this.config.triggerPrice;

    if (!hit) return null;

    this.triggered = true;

    return {
      type: 'LIMIT_ORDER',
      steps: [
        {
          action: 'swap',
          chain: this.config.chain,
          from: this.config.fromToken,
          to: this.config.toToken,
          amount: this.config.amount,
        },
      ],
      constraints: {
        maxSlippageBps: 20,
        deadline: 300,
      },
    };
  }
}
```

Register it with:

```typescript
engine.registerStrategy(
  new LimitOrderStrategy({
    chain: 'polygon',
    fromToken: 'MATIC',
    toToken: 'USDC',
    amount: '1000',
    triggerPrice: 1.5,
    isAbove: true,
    source: 'quickswap',
  })
);
```

---

### Registering and Running

All strategies plug into the same engine:

```typescript
import { StrategyEngine } from '@kuberna/engine';
import { TeeAttestationProvider, EscrowProvider } from '@kuberna/execution';

const engine = new StrategyEngine({
  agentId: process.env.AGENT_ID!,
  tee: new TeeAttestationProvider({ mode: 'sgx' }),
  escrow: new EscrowProvider({ rpc: process.env.RPC_URL }),
});

engine.registerStrategy(
  new CrossChainArbitrageStrategy({
    thresholdBps: 50,
    tradeSize: ethers.utils.parseUnits('5000', 6), // 5000 USDC
    evmRpc: process.env.ETH_RPC!,
    solanaRpc: process.env.SOL_RPC!,
  })
);

engine.registerStrategy(
  new YieldOptimizerStrategy({
    pools: [
      { chain: 'ethereum', protocol: 'aave', pool: 'USDC' },
      { chain: 'polygon', protocol: 'aave', pool: 'USDC' },
      { chain: 'arbitrum', protocol: 'compound', pool: 'USDC' },
    ],
    minApyDelta: 100, // 1% APY delta to rebalance
  })
);

await engine.start();
```

That's it. Your agent is now watching three markets simultaneously, making autonomous decisions, and executing through Kuberna's TEE-attested execution rails.

---

### Production Considerations

A few things we've learned running strategies in production:

**Gas estimation.** Always pad. Cross-chain arbitrage dies on underestimated gas. Our engine adds 20% by default; your estimate function should too.

**Cooldown periods.** An arbitrage opportunity that persists more than one block usually means someone else is already filling it. Add a per-pair cooldown to avoid bidding against yourself.

**State expiry.** The KV store is not a database. Keep a backup. If the agent restarts, `currentPool` is lost and your yield optimizer might double-deposit. We use a Redis sidecar for persistent state.

**Backtesting.** Before you let a strategy touch mainnet, run it against historical data. We provide a `SimulationEngine` that replays blocks from an archive node and records what your strategy would have done.

---

### What's Next

Next week I'll show you how to wrap all of this into a single LangChain tool so your ElizaOS agent can use Kuberna execution rails with one import. The strategy engine is open source (MIT) — fork it, build your own strategies, and PR them back.

The full SDK is at [github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs). Join the Discord at [discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu) to share what you're building.

_If this was useful, subscribe below. I publish deep technical posts on agent infrastructure every week — no fluff, just code and architecture._
