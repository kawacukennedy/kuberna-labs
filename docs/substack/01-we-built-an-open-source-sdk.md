---
title: "Post 1: We Built an Open-Source SDK for Cross-Chain AI Agents — Here's What Broke"
slug: we-built-an-open-source-sdk-for-cross-chain-ai-agents
---

## Title Field

Put this in the **Title** field:

> We Built an Open-Source SDK for Cross-Chain AI Agents — Here's What Broke

## Subtitle Field

Put this in the **Subtitle** field:

> 47 retries to a dead API, hallucinated chain names, and why we rebuilt everything from scratch.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Cross-Chain AI Agent SDK: What Broke When We Built It

**Meta description** (155-160 chars):

> We built an MIT-licensed SDK for AI agents to execute cross-chain transactions. Here's what broke — hallucinated chains, dead API loops, and why agents shouldn't hold keys.

**Post URL slug**:

> we-built-an-open-source-sdk-for-cross-chain-ai-agents

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

It's 3:17 AM. I'm staring at a terminal that says "Bridging 2.5 ETH to: Unknown Chain — confirmed."

The agent had parsed "bridge to Arbitrum" and somehow resolved it to a chain ID that didn't exist. It wrote a transaction. The transaction failed. The gas was gone.

This is the moment you realize: giving an LLM control of money is terrifying.

---

### The Origin Story

Kuberna Labs started as a weekend project. The idea was simple: take an intent like "swap 1 ETH for USDC on Base" and let an AI agent figure out the rest. Parse the intent, find the best route, execute the transaction, verify it settled.

Simple, right?

Three months, 47 API retries to a dead OpenAI endpoint, one hallucinated chain name that almost cost us real ETH, and 175 tests later, we had something that didn't just work — it was safe.

Here's what broke along the way.

---

### 1. The Math.sin() Price Oracle

Early on, we needed a price feed for our escrow contract. We didn't want to depend on Chainlink in every test environment. Someone — I won't name names — wrote an oracle using `Math.sin(block.timestamp)`.

It produced prices. Technically.

The output was deterministic, smooth, and absolutely meaningless. The agent would check "did I get a fair price?" and `Math.sin()` would cheerfully confirm yes, every time. We caught it during a code review when someone asked "why does the ETH price oscillate between -1 and 1?"

We now use a proper price verification mechanism. But that line of code still lives in our git history as a warning.

---

### 2. GPT-4 Hallucinated a Blockchain

This is the one that scared us straight.

We gave GPT-4 a simple intent: "bridge 1 ETH to Arbitrum." The model returned:

```json
{
  "chain": "ARB",
  "action": "bridge",
  "amount": "1 ETH",
  "target": "0x..."
}
```

"ARB" is not a chain. ARB is a token — the Arbitrum governance token. If an agent had executed that parse, it would have tried to swap ETH for ARB instead of bridging to Arbitrum. Different contract, different outcome, potentially catastrophic.

This was the moment we realized: LLM output is not safe to pipe into a transaction. Ever.

We built the 4-layer intent parser because of this bug. `compromise.js` handles 80% of intents with deterministic NLP patterns. Twelve regex patterns catch another 5%. GPT-4 only activates as a fallback when confidence is below 0.6. And when it does, a RAG memory layer checks every chain name against a verified registry.

Zero hallucinated chains in production since.

---

### 3. 47 Retries to a Dead Endpoint

OpenAI API goes down. It happens. What shouldn't happen is an agent hitting the same dead endpoint 47 times, burning through credits and latency, before finally giving up.

But that's exactly what our first prototype did. The agent had no concept of "this API is down." It just kept retrying with exponential backoff — which, to be fair, is the polite thing to do. But after backoff expires, it should have stopped. It didn't.

We built the circuit breaker because of this. Sliding-window state machine: CLOSED → OPEN after 3 failures in 5 minutes → HALF_OPEN after a 30-second probe. Once open, the system falls back to local parsing via `compromise.js`. The agent keeps working. The user never knows the LLM was down.

---

### 4. The Wallet Was a Bad Idea

Our first architecture gave each agent its own private key. The agent would sign transactions directly. It felt elegant — full autonomy, no intermediaries.

Then we thought about it for more than five minutes.

An agent with a private key is a catastrophic design pattern. If the LLM hallucinates, the key signs a bad transaction. If the agent's environment is compromised, the key is stolen. If the agent goes rogue — okay, that's science fiction, but the first two are very real.

We scrapped the entire key management system. Now, agents don't hold keys. They post intents. Executors compete to fulfill them. Our escrow contract settles the deal. No keys, no signatures, no catastrophic single point of failure.

---

### What Didn't Break

After all the failures, some things worked on the first try:

- **TEE attestation via SGX**. Intel's architecture documentation is solid. The `MRENCLAVE` hash is unforgeable. If an agent executes inside a TEE, the cryptographic receipt proves exactly what code ran. The agent can't lie about its decision.

- **ERC-8004 alignment for reputation**. The standard for on-chain agent reputation gave us a clear path. Every successful execution updates a reputation score. Every failed execution, disputed or not, also updates it. The score is transparent. Anyone can verify.

- **Kite x402 micropayments**. For small transactions — paying for an API call, buying a data packet — the x402 protocol lets agents pay per-request without gas overhead. It's elegant and it works.

---

### The Stack Today

Here's what we shipped:

- `@kuberna/sdk` — the TypeScript SDK for building agent execution rails
- `Escrow.sol` — on-chain escrow with dispute resolution and 24h auto-release
- `tee-verifier` — SGX + Phala + Marlin attestation verification
- `circuit-breaker` — sliding-window state machine for LLM calls
- `intent-parser` — 4-layer parser with confidence scoring
- `reputation` — ERC-8004 aligned agent reputation scoring

All MIT licensed. All on GitHub.

We have 175 tests, all green. CI runs on every PR. We don't merge broken code.

---

### Why We're Building This in Public

Agent frameworks like LangChain, ElizaOS, and AutoGen are solving the decision-making layer. They're great at "what should the agent do?" But none of them solve "how does the agent actually execute without breaking things?"

That's the layer we're building. Execution rails. The plumbing between "I want to swap 1 ETH for USDC" and "the transaction settled on Base and the USDC is in the right wallet."

We're open-source because this shouldn't be proprietary infrastructure. Every agent should have safe execution rails. Every developer should be able to inspect the code that handles their money.

**Check us out at [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)**

**Join the Discord: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu)**

PRs welcome. Issues welcome. Horror stories about your own agent failures — especially welcome.

---

_Subscribe to this series. Post 2 is about the 4-layer intent parser and exactly how we stopped LLMs from hallucinating chain names._

---

Include a note at the bottom: "After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped."
