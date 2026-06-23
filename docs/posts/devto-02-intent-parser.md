---
title: Why We Don't Let GPT-4 Parse Financial Intents (And What We Use Instead)
published: false
tags: ai, typescript, tutorial, beginners
cover_image: https://raw.githubusercontent.com/kawacukennedy/kuberna-labs/main/docs/assets/devto-02-cover.png
description: GPT-4 confused "Arbitrum" with "ARB" when parsing a cross-chain intent. Here's the 4-layer fallback system that eliminated hallucinated chains.
series: Building an Open-Source Agent Execution Layer
---

I asked GPT-4 to parse "bridge my ETH to Arbitrum" and it returned:

```json
{ "sourceChain": "Ethereum", "destChain": "Arbitrum", "token": "ARB" }
```

It confused the destination **chain** with the **ARB token**. If an agent executed this, it would swap ETH for ARB instead of bridging. That's a $10,000 hallucination.

This isn't a prompt engineering problem. It's a fundamental issue with using probabilistic models for deterministic financial parsing. Here's the system we built to eliminate it entirely.

{% github kawacukennedy/kuberna-labs %}

---

## The problem with LLMs for structured extraction

LLMs are probabilistic by design. They don't _know_ anything — they predict the most likely token sequence given their training data. For financial intents, this means:

- **Chain names overlap with token symbols** — "Arbitrum" vs "ARB", "Solana" vs "SOL"
- **Amounts can be ambiguous** — "1 ETH" is clear, "send some" is not
- **Missing chain names** — "swap 1 ETH for USDC" doesn't specify the destination chain
- **Novel phrasing** — "bridge my bags over to polygon" needs to resolve to Polygon (MATIC)

Each of these is a recoverable error for a deterministic parser. Each is a potential loss-of-funds event for a probabilistic one.

The cost of hallucination in financial execution is not a bad chatbot response. It's real money moving to the wrong chain.

## Our 4-layer approach

We never call GPT-4 first. The LLM is the last resort, not the primary parser.

```
Layer 1: compromise.js   (zero-dep NLP, offline)    ← 80% of intents
Layer 2: 12 regex patterns (deterministic matching)  ← 5% of intents
Layer 3: GPT-4 fallback   (only when conf < 0.6)     ← 15% of intents
Layer 4: RAG memory        (learns from past parses)  ← ongoing
```

### Layer 1: compromise.js

[compromise.js](https://github.com/spencermountain/compromise) is a zero-dependency NLP library that runs in the browser, Node.js, and Deno. It handles:

- Subject-verb-object extraction ("swap ETH for USDC")
- Named entity recognition ("Ethereum", "Solana", "Arbitrum")
- Number and unit parsing ("1.5 ETH", "500 USDC")

It weighs ~200KB and requires no API key. For well-formed intents, it's sufficient 80% of the time.

```typescript
import nlp from 'compromise';

function parseWithCompromise(input: string): Intent | null {
  const doc = nlp(input);
  const tokens = doc.match('#Noun+');
  const amounts = doc.numbers().get();
  // ... extract structured intent
}
```

### Layer 2: Regex patterns

For the 5% of intents where compromise.js yields low confidence, we fall through to 12 regex patterns covering common structures:

```typescript
const PATTERNS = [
  // "swap X for Y on Z"
  /swap\s+(?<amount>\d+\.?\d*)\s+(?<source>\w+)\s+for\s+(?<dest>\w+)\s+on\s+(?<chain>\w+)/i,
  // "bridge X to Y"
  /bridge\s+(?<amount>\d+\.?\d*)\s+(?<token>\w+)\s+to\s+(?<chain>\w+)/i,
  // "send X to Y on Z"
  /send\s+(?<amount>\d+\.?\d*)\s+(?<token>\w+)\s+to\s+(?<chain>\w+)/i,
  // ... 9 more patterns
];
```

Each pattern maps matched groups to a validated `Intent` structure. If the mapping contains an unrecognized chain or token, the parse fails safely — no hallucination possible.

### Layer 3: GPT-4 fallback

Only when both layers 1 and 2 return confidence < 0.6 do we call GPT-4. The prompt is structured to minimize hallucination:

```typescript
const prompt = `
Parse the following cross-chain intent into JSON.
Only use chain names from this list: ${VALID_CHAINS.join(', ')}
Only use token symbols from this list: ${VALID_TOKENS.join(', ')}
If any value cannot be determined, set it to null. Do not infer.

Input: "${input}"
Output:`;
```

The LLM is constrained to a known vocabulary. If it returns a chain name not in `VALID_CHAINS`, the system rejects the parse. This caught the "Arbitrum" → "ARB" hallucination described above.

### Layer 4: RAG memory

Every successful parse (regardless of which layer handled it) is stored in a vector database. Common patterns are promoted to new regex patterns over time.

After 6 months of operation, layer 4 has:

- Generated 4 new patterns now handled by layer 2
- Increased layer 1 hit rate from 72% to 80%
- Reduced LLM fallback from 22% to 15%

## Confidence scoring

Each layer assigns a confidence score. We stop at the first layer with score > 0.6.

```typescript
const { intent, confidence } = await parseIntent('swap 1 ETH for USDC on Solana');

console.log(intent);
// {
//   sourceChain: "solana",
//   sourceToken: "ETH",
//   destToken: "USDC",
//   sourceAmount: "1",
//   confidence: 0.85
// }
```

Confidence is based on:

- How many fields were successfully extracted (4/4 is better than 3/4)
- Whether all chain/token names are in the known vocabulary
- Pattern match strength (regex exact match > compromise fuzzy match > LLM generation)

If confidence is below 0.6 after all 4 layers, the intent is rejected and the agent is asked to rephrase.

## How we tested this

175 tests covering:

- Well-formed intents ("swap 1 ETH for USDC on Solana")
- Missing chain names ("swap 1 ETH for USDC")
- Novel phrasing ("move my bags to polygon")
- Deliberately adversarial inputs ("ETH for BTC on Ethereum ethereum ethereum")
- Chain/token confusion ("bridge to ARB on Arbitrum")
- Mixed case, typos, extra whitespace

Property-based tests using `fast-check` verify invariants: the parser never returns a chain name not in `VALID_CHAINS`, never returns a token symbol not in `VALID_TOKENS`, and never fabricates an amount.

Zero hallucinated chains in production.

## When you SHOULD use an LLM

The 4-layer system isn't anti-LLM. It's pro-determinism.

Use an LLM when the input is genuinely novel, the phrasing is ambiguous, or the intent contains information your deterministic layers can't handle. But don't use an LLM as your **primary** parser for financial inputs.

The LLM is a safety net, not the primary system. Build deterministic layers first. Let the LLM handle edge cases. And always validate the output against a known vocabulary before accepting it.

---

The parser is MIT licensed and works without any API key: [`backend/src/services/intentParser.ts`](https://github.com/kawacukennedy/kuberna-labs/blob/main/backend/src/services/intentParser.ts)

If you've hit similar hallucination problems with LLM-based extraction, I'd love to hear how you solved it in the comments.

---

_Previously in this series: [We Built an Open-Source SDK for Cross-Chain AI Agents — Here's What Broke](/prev-post-link)_
_Next in this series: [How We Built a Circuit Breaker for AI Agents That Touch Real Money](/next-post-link)_
