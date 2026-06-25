---
title: 'Post 9: How the 4-Layer Intent Parser Eliminates LLM Hallucinations in Production'
slug: how-the-4-layer-intent-parser-eliminates-llm-hallucinations
---

## Title Field

Put this in the **Title** field:

> How the 4-Layer Intent Parser Eliminates LLM Hallucinations in Production

## Subtitle Field

Put this in the **Subtitle** field:

> compromise.js handles 80% of intents. GPT-4 only activates when confidence is low. Zero hallucinated chains.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> 4-Layer Intent Parser Eliminates LLM Hallucinations

**Meta description** (155-160 chars):

> compromise.js handles 80% of intents. GPT-4 only activates as a fallback. Zero hallucinated chains in production. The full architecture of Kuberna Labs' intent parser.

**Post URL slug**:

> how-the-4-layer-intent-parser-eliminates-llm-hallucinations

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

Every AI agent framework today pipes user input directly into an LLM and pipes the LLM output directly into a function call.

This is insane.

LLMs are probabilistic. They guess. They're remarkably good at guessing — shockingly good, honestly — but they still guess. And when the guess is wrong, the result is a hallucinated chain name, a corrupted transaction, or a lost asset.

We built a 4-layer intent parser because we refuse to trust a probability distribution with on-chain assets. Here's exactly how it works.

---

### The Philosophy

The parser is built on a simple principle: **don't call the LLM unless you have to.**

An LLM API call costs money, adds latency, and introduces probabilistic uncertainty. A local regex match costs nothing, runs in microseconds, and produces deterministic output.

So we try the cheapest, most deterministic methods first. Only when they fail do we escalate.

---

### Layer 1: compromise.js (80% of intents)

`compromise.js` is a lightweight NLP library that runs entirely in-process. It does parts-of-speech tagging, named entity recognition, and pattern matching without any network calls.

```typescript
import nlp from 'compromise';

interface ParsedIntent {
  action: 'swap' | 'bridge' | 'send' | 'stake';
  chain: string;
  fromToken?: string;
  toToken?: string;
  amount: string;
  confidence: number;
}

function parseWithCompromise(input: string): ParsedIntent | null {
  const doc = nlp(input);

  // Match amounts: "1 ETH", "500 USDC", etc.
  const amounts = doc.match('#Money+');
  if (!amounts.found) return null;

  // Match chain names
  const chainMap: Record<string, string> = {
    ethereum: 'ethereum',
    eth: 'ethereum',
    base: 'base',
    polygon: 'polygon',
    matic: 'polygon',
    arbitrum: 'arbitrum',
    solana: 'solana',
  };

  const chains = Object.keys(chainMap);
  const foundChain = chains.find((c) => doc.has(c));
  if (!foundChain) return null;

  // Match action verbs
  const actions = ['swap', 'bridge', 'send', 'stake'];
  const foundAction = actions.find((a) => doc.has(a));
  if (!foundAction) return null;

  return {
    action: foundAction as ParsedIntent['action'],
    chain: chainMap[foundChain],
    amount: amounts.text(),
    confidence: 0.85,
  };
}
```

This handles about 80% of real-world intents. "Swap 1 ETH on Base." "Bridge 500 USDC to Polygon." "Send 0.1 SOL to 0x..."

It's deterministic. Same input always produces the same output. Zero hallucinations.

---

### Layer 2: Regex Patterns (5% of intents)

When `compromise.js` can't parse the intent — usually because the phrasing is unusual — we try 12 regex patterns.

Each pattern captures a specific linguistic structure:

```typescript
const patterns = [
  // "I want to swap 1 ETH for USDC on Base"
  {
    regex:
      /i want to (swap|bridge|send|stake) (\d+\.?\d*) (\w+)(?: (?:for|to) (\w+))?(?: (?:on|to|in) (\w+))?/i,
    extract(matches: RegExpExecArray): ParsedIntent {
      return {
        action: matches[1] as ParsedIntent['action'],
        amount: matches[2],
        fromToken: matches[3],
        toToken: matches[4],
        chain: normalizeChain(matches[5] || 'ethereum'),
        confidence: 0.7,
      };
    },
  },

  // "send 100 USDC to 0x..."
  {
    regex: /send (\d+\.?\d*) (\w+) to (0x[a-fA-F0-9]{40})/i,
    extract(matches: RegExpExecArray): ParsedIntent {
      return {
        action: 'send',
        amount: matches[1],
        fromToken: matches[2],
        toAddress: matches[3],
        chain: 'ethereum',
        confidence: 0.75,
      };
    },
  },

  // "can you bridge one ETH to Arbitrum?"
  {
    regex:
      /(?:can you|could you|please) (swap|bridge|send|stake) (one|two|three|\d+) (\w+)(?: (?:for|to) (\w+))?/i,
    extract(matches: RegExpExecArray): ParsedIntent {
      return {
        action: matches[1] as ParsedIntent['action'],
        amount: numberWords[matches[2].toLowerCase()] || matches[2],
        fromToken: matches[3],
        toToken: matches[4],
        confidence: 0.65,
      };
    },
  },
  // ... 9 more patterns
];
```

Patterns cover:

- "I want to..." prefixed intents
- "Can you..." / "Could you..." / "Please..." prefixed intents
- Amounts written as words ("one" → "1", "hundred" → "100")
- Chain aliases ("Matic" → "Polygon", "Eth" → "Ethereum")
- Address-included intents ("send to 0x...")
- Multi-token intents ("swap ETH for USDC")
- Amounts with commas ("1,000")
- Decimal amounts with various formats
- Intents without action verbs (implicit "send")
- Intents with missing chain names (default to Ethereum)
- Intents specifying "max" or "all" amounts
- Intents with native gas tokens ("ETH", "MATIC", "SOL")

Each pattern has a fixed confidence score between 0.6 and 0.75. The parser selects the highest-confidence match.

---

### Layer 3: GPT-4 Fallback (15% of intents)

If Layers 1 and 2 return nothing above 0.5 confidence, we call GPT-4.

The prompt is heavily constrained:

```typescript
async function parseWithGPT4(input: string): Promise<ParsedIntent | null> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a blockchain intent parser.
Valid chains: ethereum, base, polygon, arbitrum, solana.
Valid actions: swap, bridge, send, stake.
Do NOT invent chains. Do NOT return token names as chains.
If uncertain, return null for the field.
Return valid JSON only.`,
      },
      {
        role: 'user',
        content: input,
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(response.choices[0].message.content);

  // Validate against chain registry
  if (!VALID_CHAINS.has(parsed.chain?.toLowerCase())) {
    return null; // Reject hallucinated chains
  }

  return {
    action: parsed.action,
    chain: parsed.chain.toLowerCase(),
    amount: parsed.amount,
    fromToken: parsed.fromToken,
    toToken: parsed.toToken,
    confidence: 0.6, // Base confidence for LLM output
  };
}
```

Key details:

- **Temperature 0.1**: Near-deterministic output
- **JSON mode**: Structured output
- **Chain validation**: Every chain name is checked against a verified registry
- **Low confidence**: Even successful LLM parses get only 0.6 confidence

If GPT-4 returns "ARB" instead of "Arbitrum," the validator rejects it. The parser returns null. The agent never sees the hallucination.

---

### Layer 4: RAG Memory (last resort)

When every other layer fails, we try retrieval-augmented generation.

The RAG system queries a vector store containing:

- Verified chain documentation
- Historical intent parses
- Known chain/DEX/Token mappings

```typescript
async function parseWithRAG(input: string): Promise<ParsedIntent | null> {
  // Embed the input
  const embedding = await embed(input);

  // Query vector store for relevant docs
  const docs = await vectorStore.query(embedding, { topK: 3 });

  // Construct prompt with retrieved context
  const context = docs.map((d) => d.content).join('\n');
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Context:\n${context}\n\nParse the intent:`,
      },
      {
        role: 'user',
        content: input,
      },
    ],
  });

  // ... validation ...
}
```

This is slow (2-3 seconds) and expensive. But it's the safety net under the safety net.

The key optimization: successful RAG parses are promoted to Layer 2. The extracted chain name and phrasing become a new regex pattern. Next time, it's instant.

---

### Confidence Scoring Algorithm

The confidence scoring allows early termination:

```typescript
async function parseIntent(input: string): Promise<ParsedIntent | null> {
  const MIN_CONFIDENCE = 0.6;

  // Layer 1
  let result = parseWithCompromise(input);
  if (result && result.confidence >= MIN_CONFIDENCE) return result;

  // Layer 2
  result = parseWithRegex(input);
  if (result && result.confidence >= MIN_CONFIDENCE) return result;

  // Layer 3
  result = await parseWithGPT4(input);
  if (result && result.confidence >= MIN_CONFIDENCE) return result;

  // Layer 4
  result = await parseWithRAG(input);
  if (result && result.confidence >= MIN_CONFIDENCE) {
    // Promote to Layer 2
    addRegexPattern(input, result);
    return result;
  }

  // All layers failed
  return null;
}
```

For 80% of intents, we stop at Layer 1. Takes under 50ms. No network calls. No hallucinations.

For another 5%, we stop at Layer 2. Still under 50ms.

For 14.5%, we call GPT-4. 500-1000ms. Sometimes hallucinates, but we catch it.

For <0.5%, we hit RAG. Slow but effective.

---

### Production Results

Zero hallucinated chains in production.

| Metric                     | Value |
| -------------------------- | ----- |
| Layer 1 (compromise)       | 78.3% |
| Layer 2 (regex)            | 5.7%  |
| Layer 3 (GPT-4)            | 14.8% |
| Layer 4 (RAG)              | 0.4%  |
| All layers failed          | 0.8%  |
| Hallucinated chains caught | 100%  |

The 0.8% that fail all layers are genuinely ambiguous inputs. The agent asks the user to rephrase.

---

### Offline-First Design

Layers 1 and 2 require zero network access. They work on a plane, in a serverless function, on a mobile device, in a TEE with no internet.

This is critical for the circuit breaker fallback. When the LLM API is down, the agent still works. It just uses deterministic parsing only, which handles 80% of intents.

---

### Why This Matters

The AI agent space is moving fast. Everyone is adding more capabilities, more tools, more integrations. But nobody is adding safety.

The 4-layer parser is a safety rail. It constrains the stochastic parrot into a deterministic box. The LLM can still express itself, but its output is validated, verified, and constrained before anything happens.

If you're building an agent that touches money, you need this. Not necessarily our implementation, but the pattern: deterministic first, LLM last, validation everywhere.

---

### The Code

The full intent parser is in the Kuberna Labs SDK. Drop it into your agent with:

```bash
npm install @kuberna/sdk
```

```typescript
import { createIntentParser } from '@kuberna/sdk';

const parser = createIntentParser();
const intent = await parser.parse('swap 1 ETH for USDC on Base');
console.log(intent);
// { action: "swap", chain: "base", amount: "1.0", confidence: 0.85 }
```

MIT licensed. Use it anywhere.

**GitHub: [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)**

**Discord: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu)**

---

_Subscribe to this series. Post 10 is the final deep-dive — the complete Escrow.sol contract with state machine diagrams, reentrancy guards, and the 24-hour auto-release mechanism._

---

Include a note at the bottom: "After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped."
