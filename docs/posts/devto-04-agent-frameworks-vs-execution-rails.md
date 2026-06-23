---
title: Agent Frameworks vs Execution Rails — Why Your Agent Can't Settle a Trade
published: false
tags: ai, blockchain, opensource, discuss
cover_image: https://raw.githubusercontent.com/kawacukennedy/kuberna-labs/main/docs/assets/devto-04-cover.png
description: Every AI agent framework solves decision-making. None solve settlement. Here's why execution rails are the missing layer in the agent stack.
series: Building an Open-Source Agent Execution Layer
---

Every week, a new "AI agent framework" launches. They all do the same thing: give the agent tools to call APIs.

That solves nothing.

An agent that can call an API cannot hold value. Cannot settle a trade. Cannot prove what it did. Cannot be held accountable at 3 AM when it bridges to the wrong chain.

Frameworks solve "how does the agent decide?" Execution rails solve "how does the decision become reality?"

They are not the same thing.

{% github kawacukennedy/kuberna-labs %}

---

## What frameworks give you

Let's be fair to frameworks. They solve real problems:

- **Tool-calling ability** — the agent can invoke external APIs and services
- **Memory** — the agent can recall past conversations and decisions
- **Prompt management** — system prompts, few-shot examples, chained prompts
- **Multi-agent orchestration** — agents that delegate to other agents

These are valuable capabilities. Every production agent needs them.

But none of them answer the fundamental question: **how does the agent transact value?**

An agent with a LangChain tool list can call 100 APIs. It cannot settle a single trade. It cannot escrow funds. It cannot produce a cryptographic receipt that its decision was made correctly. It cannot resolve a dispute when something goes wrong.

Frameworks give you a brain. They don't give you a nervous system.

## What execution rails add

Execution rails sit underneath the framework. They provide the settlement infrastructure that the agent needs to transact:

- **On-chain escrow with dispute windows** — funds are held by a smart contract, not the agent. The agent posts intents; executors compete to fulfill them. If either party disputes, there's a resolution mechanism.

- **TEE-attested decision traces** — every agent decision is made inside a trusted execution environment. The output includes a cryptographic receipt. Anyone can verify that the agent made the decision at a specific time.

- **Cross-chain intent marketplace** — intents are posted to an open marketplace. Executors compete on price. The agent gets the best execution without integrating with every DEX and bridge individually.

- **Reputation system for executors** — executors build reputation over time. The agent can prefer executors with proven track records. Bad actors are penalized economically.

These are not features you add to a framework. They're infrastructure you build underneath it.

## Where each category falls short

| Category              | Examples                    | What's missing                                                                  |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| Agent frameworks      | LangChain, ElizaOS, AutoGen | No settlement layer. Great at making decisions, can't execute value.            |
| Trading bots          | Hummingbot, Freqtrade       | Single use case. Optimized for one strategy; not general agent execution.       |
| TEE platforms         | Phala, Marlin               | Compute only. No on-chain escrow, no intent marketplace, no dispute resolution. |
| Wallet infrastructure | WAIaaS, others              | No agent decision engine. Holds keys but doesn't help the agent decide.         |

Each category solves one piece. None solve the whole pipeline.

## Why you need both

The framework is the brain. The rails are the nervous system. Neither works without the other.

A framework without rails can decide but can't transact. It's a thinker that can't act.

Rails without a framework can transact but can't decide. It's a nervous system without a brain.

The agent needs both: a framework to form intentions, and execution rails to settle them.

## How we integrate with existing frameworks

Kuberna doesn't replace ElizaOS or LangChain. It sits underneath them.

```typescript
import { KubernaSDK } from '@kuberna/sdk';

// Works with any framework:
class KubernaTool {
  constructor() {
    this.sdk = new KubernaSDK({ apiKey: process.env.KUBERNA_API_KEY });
  }

  async execute(intent: string): Promise<ExecutionResult> {
    // The framework calls this tool like any other
    // Under the hood: intent parsing → executor selection → escrow → attestation
    return this.sdk.intents.execute(intent);
  }
}

// Register as a LangChain tool:
const tool = new DynamicStructuredTool({
  name: 'kuberna_execute',
  description: 'Execute a cross-chain financial intent',
  schema: intentSchema,
  func: (input) => new KubernaTool().execute(input),
});
```

Same pattern works with ElizaOS, AutoGen, or any tool-calling framework. One integration, all capabilities.

## The open question

Every execution rail project reinvents escrow, attestation, and reputation. There's no shared standard.

We need common primitives:

- A standard **intent format** that any agent can produce and any executor can consume
- A standard **escrow interface** that works across chains
- A standard **attestation format** that any verifier can check
- A standard **reputation schema** that tracks executor quality across platforms

Without standards, every project rebuilds the same infrastructure in incompatible ways. The network effects that make agents valuable — interoperability, competition, composability — never materialize.

We're open-sourcing everything at [Kuberna Labs](https://github.com/kawacukennedy/kuberna-labs) to accelerate this. MIT license. All contracts, all SDK code, all infrastructure.

---

I'm biased (I built one of these), but I genuinely believe execution rails are the most underbuilt layer in the AI × Web3 stack.

If you disagree — I'd love to hear why in the comments.

If you agree — come build with us.

---

_Previously in this series: [How We Built a Circuit Breaker for AI Agents That Touch Real Money](/prev-post-link)_
