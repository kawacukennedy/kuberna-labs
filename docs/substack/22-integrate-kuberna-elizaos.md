---
title: 'Post 22: Integrate Kuberna Execution Rails Into Your ElizaOS Agent in 5 Minutes'
slug: integrate-kuberna-elizaos
---

## Title Field

Put this in the **Title** field:

> Integrate Kuberna Execution Rails Into Your ElizaOS Agent in 5 Minutes

## Subtitle Field

Put this in the **Subtitle** field:

> One KubernaTool class, registered as a LangChain tool or ElizaOS action — agent gets full execution rails through one call.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Integrate Kuberna execution rails into ElizaOS agents in 5 minutes

**Meta description** (155-160 chars):

> Add TEE-attested cross-chain execution to any ElizaOS or LangChain agent. One tool class, one import, unlimited blockchains.

**Post URL slug**:

> integrate-kuberna-elizaos

## Body

Put this in the main body editor:

You've built an agent. It can write tweets, analyze sentiment, maybe even generate images. But ask it to swap tokens on Arbitrum and it stares at you blankly.

The agent frameworks are great at tool-calling — they route LLM output to registered functions. But they don't handle **execution**: transaction building, gas estimation, cross-chain messaging, TEE attestation, escrow. That's where Kuberna comes in.

Let's wire it up in five minutes.

---

### Step 1: One Class to Rule Them All

The `KubernaTool` wraps the entire execution pipeline into a single LangChain-compatible tool:

```typescript
import { Tool } from 'langchain/tools';
import { KubernaExecutor } from '@kuberna/execution';
import { z } from 'zod';

const KUbernaInputSchema = z.object({
  intent: z
    .string()
    .describe(
      'Natural language description of what you want to do. ' +
        'Example: "swap 1 ETH for USDC on arbitrum using uniswap"'
    ),
});

export class KubernaTool extends Tool {
  name = 'kuberna_execute';
  description =
    `Execute on-chain actions across any supported blockchain. ` +
    `Input is a plain-English description of what you want to do. ` +
    `Returns a transaction receipt with attestation proof.`;

  private executor: KubernaExecutor;

  constructor(config: { privateKey: string; rpcUrl: string }) {
    super();
    this.executor = new KubernaExecutor({
      agentId: 'my-agent',
      teeMode: 'sgx',
      escrowRpc: config.rpcUrl,
    });
  }

  protected async _call(input: string): Promise<string> {
    const parsed = KUbernaInputSchema.parse({ intent: input });

    // Step 1: Parse intent with compromise.js + GPT-4 fallback
    const parsedIntent = await this.executor.parseIntent(parsed.intent);

    // Step 2: Fund escrow if needed
    const escrowId = await this.executor.createEscrow(parsedIntent);

    // Step 3: Execute with TEE attestation
    const receipt = await this.executor.execute(parsedIntent, {
      escrowId,
      attestation: true,
    });

    return JSON.stringify(
      {
        status: 'executed',
        txHash: receipt.txHash,
        chain: receipt.chain,
        attestationProof: receipt.attestationProof,
        escrowId,
      },
      null,
      2
    );
  }
}
```

The LLM doesn't need to know about RPC URLs, gas limits, or slippage. It just says "swap 1 ETH for USDC on Arbitrum" and the tool handles the rest.

---

### Step 2: Register in LangChain

```typescript
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';

const tools = [
  new KubernaTool({
    privateKey: process.env.AGENT_KEY!,
    rpcUrl: process.env.RPC_URL!,
  }),
  // ... your other tools
];

const executor = await initializeAgentExecutorWithOptions(
  tools,
  new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  }),
  {
    agentType: 'openai-functions',
    verbose: true,
  }
);

const result = await executor.run(
  'Check if ETH is below $3000 on Ethereum. ' +
    'If so, swap 0.5 ETH for USDC on Arbitrum and deposit into Aave.'
);
```

That's it. The LLM decides when to call the tool, the tool handles execution, and your agent gets cross-chain DeFi capabilities in one import.

---

### Step 3: Register in ElizaOS

ElizaOS uses a slightly different pattern — Actions instead of LangChain Tools:

```typescript
import { Action, Handler } from '@elizaos/core';
import { KubernaExecutor } from '@kuberna/execution';

const kubernaAction: Action = {
  name: 'KUBERNA_EXECUTE',
  description:
    'Execute on-chain actions via Kuberna execution rails. ' +
    'Input is a natural language description of the desired action.',

  validate: async (runtime, message) => {
    const text = message.content.text?.toLowerCase() || '';
    const keywords = ['swap', 'bridge', 'deposit', 'withdraw', 'trade', 'send'];
    return keywords.some((k) => text.includes(k));
  },

  handler: new Handler({
    executor: new KubernaExecutor({
      agentId: runtime.agentId,
      teeMode: 'sgx',
    }),

    async execute(input: string, ctx: any) {
      const intent = await this.executor.parseIntent(input);
      const escrowId = await this.executor.createEscrow(intent);
      const receipt = await this.executor.execute(intent, { escrowId });

      return {
        success: true,
        message: `Executed on ${receipt.chain}. TX: ${receipt.txHash}`,
        data: receipt,
      };
    },
  }),
};

export default kubernaAction;
```

Register it in your agent's character config:

```json
{
  "name": "TraderBot",
  "actions": ["kuberna_execute"],
  "clients": ["discord", "telegram"]
}
```

Now your ElizaOS agent can execute on-chain actions from Discord or Telegram prompts.

---

### Step 4: A Complete Working Example

Here's a full agent that monitors ETH price and executes when conditions are met:

```typescript
import 'dotenv/config';
import { KubernaTool } from './kuberna-tool';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { DynamicStructuredTool } from 'langchain/tools';

async function main() {
  const kuberna = new KubernaTool({
    privateKey: process.env.AGENT_KEY!,
    rpcUrl: process.env.RPC_URL!,
  });

  const priceCheck = new DynamicStructuredTool({
    name: 'check_eth_price',
    description: 'Get the current ETH/USDC price from CoinGecko',
    schema: z.object({}),
    func: async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await res.json();
      return data.ethereum.usd.toString();
    },
  });

  const executor = await initializeAgentExecutorWithOptions(
    [kuberna, priceCheck],
    new ChatOpenAI({ modelName: 'gpt-4', temperature: 0 }),
    { agentType: 'openai-functions', verbose: true }
  );

  const prompt = `You are a DeFi trading agent. Your goal: if ETH price is below $2800, buy $500 worth of ETH on Arbitrum using USDC. If it's above $3200, sell 0.5 ETH for USDC. Start by checking the price.`;

  const result = await executor.run(prompt);
  console.log(result);
}

main().catch(console.error);
```

Run it:

```bash
AGENT_KEY=your_private_key RPC_URL=https://arb1.arbitrum.io/rpc node agent.ts
```

---

### How It Works Under the Hood

When the LLM calls `kuberna_execute`, the tool:

1. Runs the intent string through **compromise.js** for lightweight NLP parsing. If confidence is below 80%, falls back to a **GPT-4 call** to extract structured intent.

2. Submits the intent to the **on-chain escrow** contract. The required funds are locked. A dispute window starts.

3. The intent is executed inside a **TEE** (SGX on EVM chains, Phala or Marlin as fallback). The execution is attested and the proof is emitted on-chain.

4. The escrow is released to the executor. If the execution fails or the agent disputes, a human arbitrator resolves it.

From the agent's perspective, it's one function call. From the protocol's perspective, it's a provably secure execution with full audit trail.

---

### Why This Matters

Most agent frameworks stop at tool-calling. They give your LLM a `swap()` function and call it a crypto agent. But they don't handle:

- **Gas abstraction** — what chain is the agent on? What token does it use for gas?
- **Slippage protection** — the LLM doesn't know current pool reserves.
- **MEV resistance** — transactions are visible in the mempool before execution.
- **Attestation** — can you prove the agent's decision wasn't tampered with?

Kuberna handles all of this. The tool is a single integration point. The complexity lives in the execution layer, not in your agent.

---

### Next Steps

Fork the repo at [github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs) and try the ElizaOS starter template in `/examples/elizaos-integration`. It includes the tool class, a character config, and a Docker Compose setup for running your agent with TEE support.

Join the Discord at [discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu) — there's a growing community of agent builders integrating Kuberna rails, and the `#eliza-integrations` channel is where the patterns are evolving fastest.

_Subscribe below if you want more posts like this. Next up: post-quantum certificates for agent identity — real code, real attestation, real free-tier API._
