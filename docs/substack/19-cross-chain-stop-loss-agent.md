---
title: 'Post 19: Build a Cross-Chain Stop-Loss Agent From Scratch'
slug: cross-chain-stop-loss-agent
---

## Title Field

Put this in the **Title** field:

> Build a Cross-Chain Stop-Loss Agent From Scratch

## Subtitle Field

Put this in the **Subtitle** field:

> Monitor ETH on Ethereum, USDC on Solana, trigger execution when price crosses a threshold — all autonomous.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Build a Cross-Chain Stop-Loss AI Agent From Scratch

**Meta description** (155-160 chars):

> Full tutorial: build an autonomous cross-chain stop-loss agent with Kuberna SDK — price monitoring on Ethereum, execution on Solana, escrow automation, TEE attestation.

**Post URL slug**:

> cross-chain-stop-loss-agent

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

A stop-loss is the simplest financial automation there is: _if price drops below X, sell_. But when your assets are spread across chains and you want the execution to be trustless, auditable, and unhackable — that's where Kuberna Labs comes in.

Let's build a cross-chain stop-loss agent. It monitors ETH price on Ethereum. When ETH drops below $3500, it swaps ETH for USDC on Solana. Autonomously. Cryptographically attested. With escrow protection.

---

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Your Stop-Loss Agent (runs 24/7, you can sleep)         │
│─────────────────────────────────────────────────────────│
│                                                          │
│  Price Monitor ──→ Decision Engine ──→ Executor          │
│  (reads Chainlink    (checks threshold,   (creates        │
│   oracle on ETH)      cooldown, escrow)    intent on      │
│                                              Solana)      │
│       │                    │                    │          │
│       ▼                    ▼                    ▼          │
│  Ethereum             Agent Memory          Solana        │
│  (price feed)         (last trigger,       (execution)    │
│                        error count)                       │
└─────────────────────────────────────────────────────────┘
```

Three components running in a single agent process, each with its own circuit breaker and failure handling.

---

### Prerequisites

```bash
npm init -y
npm install @kuberna/sdk @kuberna/oracle-feeds
```

You'll also need:

- A Kuberna API key (free tier works for testnet)
- 0.1 ETH on Base Sepolia (from a faucet) for escrow
- 10 test USDC on Solana devnet (from a faucet)

---

### Step 1: Price Monitor

The price monitor polls Chainlink oracles on Ethereum and normalizes the price:

```javascript
import { PriceFeed } from '@kuberna/oracle-feeds';

class PriceMonitor {
  constructor(agent) {
    this.agent = agent;
    this.feed = new PriceFeed({
      chain: 'ethereum',
      pair: 'ETH/USD',
      oracle: 'chainlink', // can also use 'pyth' or 'redstone'
      refreshInterval: 15_000, // 15 seconds
    });
    this.lastPrice = null;
    this.lastUpdate = null;
  }

  async start() {
    this.feed.on('price', async (price, timestamp) => {
      this.lastPrice = price;
      this.lastUpdate = timestamp;
      this.agent.emit('price_update', { price, timestamp });
    });

    this.feed.on('error', (err) => {
      this.agent.logger.error('Price feed error', err);
      // Circuit breaker handles retry
    });

    await this.feed.start();
  }

  getPrice() {
    return this.lastPrice;
  }

  stop() {
    this.feed.stop();
  }
}
```

The `PriceFeed` class handles connection pooling, reconnection backoff, and data freshness checks. If the oracle hasn't updated in 5 minutes, it emits a `stale_data` event.

---

### Step 2: Decision Engine

The decision engine checks the price against configurable thresholds. It also prevents re-triggering within a cooldown window:

```javascript
class StopLossEngine {
  constructor(config) {
    this.threshold = config.threshold; // 3500
    this.triggerAbove = config.triggerAbove; // false (trigger below)
    this.cooldownMs = config.cooldownMs; // 3600000 (1 hour)
    this.lastTriggeredAt = 0;
    this.isArmed = true;
  }

  evaluate(price) {
    if (!this.isArmed) {
      return { shouldTrigger: false, reason: 'disarmed' };
    }

    const now = Date.now();
    if (now - this.lastTriggeredAt < this.cooldownMs) {
      return {
        shouldTrigger: false,
        reason: `cooldown (${(this.cooldownMs - (now - this.lastTriggeredAt)) / 1000}s remaining)`,
      };
    }

    const triggered = this.triggerAbove ? price >= this.threshold : price <= this.threshold;

    if (triggered) {
      this.lastTriggeredAt = now;
      return { shouldTrigger: true, price, threshold: this.threshold };
    }

    return { shouldTrigger: false, reason: 'threshold not crossed' };
  }

  disarm() {
    this.isArmed = false;
  }

  rearm() {
    this.isArmed = true;
  }

  updateThreshold(newThreshold) {
    this.threshold = newThreshold;
    // Publish threshold change to agent's on-chain profile
    this.emit('threshold_changed', { old: this.threshold, new: newThreshold });
  }
}
```

The cooldown prevents the agent from triggering multiple times during volatile swings. If ETH crosses $3500, triggers, then bounces back and crosses again 10 minutes later — the agent waits. One hour cooldown is the default.

---

### Step 3: Escrow Creation Automation

Before the agent can execute, it needs escrow funding. The agent creates an escrow contract on setup:

```javascript
async function setupEscrow(agent, config) {
  const escrow = await agent.createEscrow({
    chain: 'base-sepolia',
    token: 'ETH',
    amount: '0.01', // escrow balance
    owner: agent.did, // agent controls the escrow
    beneficiaries: [], // populated when solver is selected
    disputeResolver: '0xarbitrator...', // optional third-party
    autoRefund: true, // refund if no execution in 7 days
  });

  console.log('Escrow created:', escrow.address);
  console.log('Escrow balance:', escrow.balance);

  // Escrow is now funding future intent executions
  return escrow;
}
```

---

### Step 4: Main Agent Loop

Tying it all together:

```javascript
import { KubernaAgent } from '@kuberna/sdk';

class StopLossAgent {
  constructor(config) {
    this.agent = new KubernaAgent({
      name: 'eth-stop-loss',
      apiKey: process.env.KUBERNA_API_KEY,
      chains: ['ethereum', 'solana-devnet'],
    });

    this.monitor = new PriceMonitor(this.agent);
    this.engine = new StopLossEngine(config);
    this.config = config;
  }

  async start() {
    await this.agent.init();
    console.log('Agent DID:', this.agent.did);

    // Register the agent on-chain for transparency
    await this.agent.register({
      type: 'stop-loss',
      description: `ETH/USDC stop-loss at $${this.config.threshold}`,
      chains: ['ethereum', 'solana-devnet'],
      publicKey: this.agent.publicKey,
    });

    // Create escrow for execution fees
    this.escrow = await setupEscrow(this.agent, this.config);
    console.log('Escrow ready:', this.escrow.address);

    // Subscribe to price updates
    this.agent.on('price_update', async ({ price, timestamp }) => {
      console.log(`ETH price: $${price} at ${new Date(timestamp).toISOString()}`);

      const decision = this.engine.evaluate(price);

      if (decision.shouldTrigger) {
        console.log('🔴 STOP-LOSS TRIGGERED');
        await this.executeStopLoss(price);
      }
    });

    // Start the price monitor
    await this.monitor.start();
    console.log('Stop-loss agent running. Monitoring ETH price...');
  }

  async executeStopLoss(currentPrice) {
    try {
      // Post a cross-chain intent: swap ETH on Base → USDC on Solana
      const intent = await this.agent.createIntent({
        type: 'swap',
        sourceChain: 'base-sepolia',
        targetChain: 'solana-devnet',
        input: { token: 'ETH', amount: this.config.swapAmount },
        output: { token: 'USDC' },
        constraints: {
          budget: this.config.maxSlippage,
          deadline: Date.now() + 3600000, // 1 hour
          teeRequired: true,
          attestationRequired: ['sgx'],
        },
        escrow: this.escrow.address,
      });

      console.log('Intent posted:', intent.id);

      // Wait for solver to execute and attest
      const result = await intent.waitForCompletion(300_000);

      if (result.state === 'settled') {
        console.log('✅ Stop-loss executed successfully');
        console.log(`Received ${result.output.amount} USDC on Solana`);
        console.log(`Solver: ${result.solver}`);
        console.log(`Attestation: ${result.attestation.quote.slice(0, 40)}...`);

        // Disarm the agent to prevent re-triggering
        this.engine.disarm();
        this.monitor.stop();
      } else {
        console.error('❌ Execution failed:', result.error);
        // Trigger failsafe — attempt manual refund
        await this.triggerFailsafe();
      }
    } catch (err) {
      console.error('Execution error:', err);
      await this.triggerFailsafe();
    }
  }

  async triggerFailsafe() {
    console.log('🛑 Failsafe triggered. Refunding escrow...');
    await this.escrow.refund();
    await this.agent.postUpdate({
      status: 'failsafe',
      message: 'Stop-loss execution failed, escrow refunded',
    });
  }
}
```

---

### Step 5: Run the Agent

```javascript
// config.js
export default {
  threshold: 3500, // trigger when ETH drops below $3500
  triggerAbove: false, // trigger below threshold
  cooldownMs: 3600000, // 1 hour between triggers
  swapAmount: '0.01', // 0.01 ETH per swap
  maxSlippage: '0.5%', // max acceptable slippage
  chains: {
    monitor: 'ethereum', // read price from Ethereum
    execute: 'solana-devnet', // execute on Solana
  },
};

// run.mjs
import { StopLossAgent } from './stop-loss.js';
import config from './config.js';

const agent = new StopLossAgent(config);
await agent.start();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await agent.monitor.stop();
  process.exit(0);
});
```

```bash
node run.mjs
```

Expected output:

```
Agent DID: did:kuberna:0x8f3F...c4d2
Escrow ready: 0xabc...def
ETH price: $3521.50 at 2026-07-15T10:00:00Z
ETH price: $3510.20 at 2026-07-15T10:00:15Z
ETH price: $3495.80 at 2026-07-15T10:00:30Z
🔴 STOP-LOSS TRIGGERED
Intent posted: 0x9e2a...b3f1
✅ Stop-loss executed successfully
Received 27.50 USDC on Solana
```

---

### Step 6: Verify Attestation

Because the intent requires TEE attestation, the execution comes with cryptographic proof:

```javascript
const verified = await agent.verifyExecution({
  intentId: intent.id,
  expectedOutput: {
    token: 'USDC',
    minAmount: adjustedAmount,
  },
});

if (!verified.valid) {
  console.error('Attestation verification failed:', verified.reason);
  await agent.dispute(intent.id, verified.reason);
} else {
  console.log('✅ Execution verified on-chain');
  console.log('Attestation timestamp:', verified.attestation.timestamp);
  console.log('MRENCLAVE:', verified.attestation.mrenclave);
}
```

---

### Testing the Agent

For testing, use a mock price feed that simulates the threshold crossing:

```javascript
// test.mjs
import { MockPriceFeed } from '@kuberna/oracle-feeds/mock';
import { StopLossAgent } from './stop-loss.js';

const agent = new StopLossAgent({
  threshold: 3500,
  cooldownMs: 1000, // short cooldown for testing
  swapAmount: '0.001',
  maxSlippage: '5%',
});

// Override with mock feed
agent.monitor.feed = new MockPriceFeed({
  prices: [
    { price: 3600, timestamp: Date.now() },
    { price: 3550, timestamp: Date.now() + 5000 },
    { price: 3400, timestamp: Date.now() + 10000 }, // triggers stop-loss
    { price: 3300, timestamp: Date.now() + 15000 },
  ],
});

// Run test
await agent.start();

// Expected:
// Triggers on third price update (3400 < 3500)
// Posts intent, waits for solver, verifies attestation
```

Run with:

```bash
node test.mjs --testnet
```

---

### Security Considerations

- **Private key**: Your agent's private key is derived from your API key. The SDK stores it encrypted at rest. Never hardcode it.
- **Escrow balance**: Only fund what you're willing to lose. Start with testnet amounts.
- **Price oracle manipulation**: Chainlink oracles are secure, but always use a freshness check. Don't accept prices older than 5 minutes.
- **Re-triggering**: The cooldown prevents rapid-fire execution. Adjust it based on your risk tolerance.
- **Failsafe**: Always implement a failsafe that returns escrow funds if the agent goes offline or execution fails.

---

The full stop-loss agent code is [on GitHub](https://github.com/kawacukennedy/kuberna-labs) in `examples/stop-loss-agent/`. It includes additional features like Telegram notifications, multiple price feed sources, and a dashboard UI.

Running into issues or want to add features? [Join the Discord](https://discord.gg/MZvNuhpXu) — the #agents channel has people building trading bots, liquidation monitors, and portfolio rebalancers.

**Subscribe to this series** — Post 20 wraps up with provisioning a TEE enclave on Phala Network: package agent code, deploy, get attestation, submit on-chain.

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
