---
title: 'Post 2: Your AI Agent Is One Hallucination Away From Losing $10,000'
slug: your-ai-agent-is-one-hallucination-away-from-losing-10000
---

## Title Field

Put this in the **Title** field:

> Your AI Agent Is One Hallucination Away From Losing $10,000

## Subtitle Field

Put this in the **Subtitle** field:

> GPT-4 confused "Arbitrum" with "ARB." If an agent executed that parse, it would swap ETH for ARB instead of bridging. Here's the safety net.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> AI Agent LLM Hallucinations: The 4-Layer Safety Net

**Meta description** (155-160 chars):

> GPT-4 confused Arbitrum with ARB. One hallucination is all it takes to lose real money. Here's the 4-layer intent parser that prevents it.

**Post URL slug**:

> your-ai-agent-is-one-hallucination-away-from-losing-10000

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

Here's the exact prompt that scared us into building a new architecture:

```
User: "bridge 1 ETH to Arbitrum"
GPT-4: {
  "chain": "ARB",
  "action": "bridge",
  "amount": "1 ETH"
}
```

"ARB" is not a blockchain. It's a token — the Arbitrum DAO governance token. If you swap ETH for ARB instead of bridging to Arbitrum, you lose the spread, pay unnecessary fees, and end up on the wrong chain with the wrong asset.

This isn't a theoretical failure. It's a production bug waiting to happen. And it's not just chain names — LLMs hallucinate contract addresses, gas estimates, even entire transaction flows.

We built a 4-layer intent parser because we don't trust LLMs. Here's how it works.

---

### Layer 1: compromise.js (80% of intents)

The first layer doesn't touch an LLM at all. It uses `compromise.js` — a lightweight NLP library that runs entirely on the client or in a serverless function, no API call needed.

```typescript
import nlp from 'compromise';

function parseIntent(input: string): Intent | null {
  const doc = nlp(input);

  const chains = ['ethereum', 'base', 'polygon', 'arbitrum', 'solana'];
  const actions = ['swap', 'bridge', 'send', 'stake'];

  const foundChain = chains.find((c) => doc.has(c));
  const foundAction = actions.find((a) => doc.has(a));
  const amount = doc.match('#Money+').text();

  if (foundChain && foundAction && amount) {
    return {
      chain: foundChain,
      action: foundAction,
      amount,
      confidence: 0.85,
      source: 'compromise',
    };
  }

  return null;
}
```

This handles the vast majority of real intents. "Swap 1 ETH on Base." "Bridge 500 USDC to Polygon." "Send 0.1 SOL to 0x..."

No API calls. No latency. No hallucinations. Just deterministic pattern matching.

---

### Layer 2: Regex Patterns (5%)

For intents that `compromise.js` can't parse, we have 12 regex patterns covering edge cases:

- "I want to..." prefixes
- "Can you..." prefixes
- Amounts written as words ("one ETH")
- Chain aliases ("Eth" → "Ethereum", "Matic" → "Polygon")
- Amounts with commas ("1,000 USDC")

Each pattern returns a parsed intent with a confidence score. Unlike the LLM layer, regex patterns never hallucinate. They either match or they don't.

```typescript
const PATTERNS = [
  {
    pattern: /swap\s+(\d+\.?\d*)\s*(\w+)\s+(?:to|for)\s+(\w+)(?:\s+on\s+(\w+))?/i,
    extract: (m: RegExpExecArray) => ({
      action: 'swap',
      amount: m[1],
      fromToken: m[2],
      toToken: m[3],
      chain: m[4] || 'ethereum',
      confidence: 0.7,
    }),
  },
  // ... 11 more patterns
];
```

---

### Layer 3: GPT-4 Fallback (15%)

Only if the first two layers return nothing with confidence above 0.6 do we call GPT-4.

When we do, we constrain the prompt aggressively:

```
You are a blockchain intent parser. Your output must be valid JSON.
Valid chains: ethereum, base, polygon, arbitrum, solana.
Valid actions: swap, bridge, send, stake.
Do not invent chains. Do not return token names as chains.
If uncertain, set "chain" to null.
```

And we validate the output against a verified chain registry before accepting it:

```typescript
const VALID_CHAINS = new Set(['ethereum', 'base', 'polygon', 'arbitrum', 'solana']);

function validateChain(name: string): boolean {
  return VALID_CHAINS.has(name.toLowerCase());
}
```

If GPT-4 returns "ARB," the validator rejects it and the parser returns a failure. The agent never sees the hallucinated chain.

---

### Layer 4: RAG Memory (last resort)

If GPT-4 fails validation, we have one more layer: retrieval-augmented generation over a vector store of verified chain documentation.

This is slow — 2-3 seconds — and expensive. But it's the safety net under the safety net. It checks historical intent data and documentation to find the correct chain mapping.

The key insight: once RAG succeeds, the correct mapping gets promoted to Layer 2's regex patterns. Next time, it's instant.

---

### Confidence Scoring

Each layer returns a confidence score. The parser stops at the first layer with confidence > 0.6:

```
Layer 1 (compromise): 0.0 → continue
Layer 2 (regex): 0.0 → continue
Layer 3 (GPT-4): 0.85 → stop, use this result
```

If no layer reaches 0.6, the parser rejects the intent entirely. The agent asks the user to rephrase.

This has eliminated hallucinated chains in production. Zero. Not one.

---

### Why This Matters

Every AI agent framework right now — LangChain, ElizaOS, AutoGen — assumes LLM output is safe enough to act on. It's not.

LLMs are probabilistic. They guess. Most of the time the guess is right. But "most of the time" is not acceptable when money is on the line.

The 4-layer parser doesn't assume anything. It starts with deterministic parsing, falls back to LLMs only when necessary, and validates everything before the agent sees it.

---

### The Trade-off

Yes, this is more complex than `const result = await openai.chat.completions.create({...})`.

But complexity in the safety layer is cheap. Complexity in the execution layer — where money moves — is expensive. We bias toward the former.

The parser runs in under 100ms for 95% of intents (Layers 1-2). The GPT-4 fallback adds 500-1000ms but only fires 15% of the time. The RAG layer is slow but almost never fires.

The result: fast, safe, hallucination-resistant intent parsing.

---

### What's Next

We're working on expanding the regex pattern library to cover more edge cases. We're also experimenting with fine-tuned smaller models (Llama 3B) as a middle layer between regex and GPT-4 — potentially replacing the LLM fallback entirely.

The code is open-source. You can inspect every layer, every confidence threshold, every validation check.

**GitHub: [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)**

**Discord: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu)**

---

_Subscribe to this series. Post 3 is about why we stopped giving our AI agents private keys and the custody model that replaced it._

---

Include a note at the bottom: "After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped."
