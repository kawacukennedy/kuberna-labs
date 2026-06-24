---
title: How We Built a Circuit Breaker for AI Agents That Touch Real Money
published: false
tags: ai, webdev, tutorial, opensource
cover_image: https://opengraph.githubassets.com/1/kawacukennedy/kuberna-labs
description: Our AI agent called a dead OpenAI endpoint 47 times before we noticed. Here's the sliding-window circuit breaker that prevents runaway API costs.
series: Building an Open-Source Agent Execution Layer
---

Our agent was calling a dead OpenAI endpoint. It kept calling. Each call cost money. Each call returned nothing.

The agent didn't know it was failing. It just thought the world was returning empty responses. So it tried again. And again. And again.

47 times before we noticed.

This is the problem every production agent faces: an agent with tool access will keep using those tools even when they break. It doesn't know the API is down. It doesn't know it's wasting money. It only knows the response it got doesn't match what it expected, so it retries with slightly different parameters.

Here's how we fixed it.

---

## The failure cascade

A single API failure in an agent system doesn't stay isolated. It cascades:

1. Dead API endpoint → failed prompt
2. Failed prompt → confused agent
3. Confused agent → wasted retries
4. Wasted retries → increased latency
5. Increased latency → missed execution opportunity
6. Missed execution opportunity → financial loss

Without a circuit breaker, each step amplifies the previous. The agent burns money, time, and credibility simultaneously.

## The circuit breaker state machine

We implemented a classic state machine with three states:

```text
                    ┌─────────────┐
                    │   CLOSED    │
                    │ (normal op) │
                    └──────┬──────┘
                           │
                   3 failures in 5min
                           │
                           ▼
                    ┌─────────────┐
                    │    OPEN     │
                    │  (blocked)  │
                    └──────┬──────┘
                           │
                     30s wait
                           │
                           ▼
                    ┌─────────────┐
                    │  HALF_OPEN  │
                    │   (probe)   │
                    └──────┬──────┘
                     ┌─────┴─────┐
                     │           │
                  success     failure
                     │           │
                     ▼           ▼
                 CLOSED        OPEN
```

### CLOSED

Normal operation. All calls pass through. Failures are tracked in a sliding window.

```typescript
type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitState {
  status: State;
  failures: Array<{ timestamp: number }>;
  windowStart: number;
}
```

### OPEN → triggered by 3 failures in 5 minutes

```typescript
function recordFailure(state: CircuitState): void {
  const now = Date.now();
  state.failures.push({ timestamp: now });
  pruneOldFailures(state, now);

  if (state.failures.length >= 3) {
    state.status = 'OPEN';
    setTimeout(() => {
      state.status = 'HALF_OPEN';
    }, 30_000);
  }
}

function pruneOldFailures(state: CircuitState, now: number): void {
  state.failures = state.failures.filter((f) => now - f.timestamp < 300_000);
}
```

### HALF_OPEN → probe

After 30 seconds, the circuit transitions to HALF_OPEN. The next call is allowed through as a probe:

```typescript
async function call<T>(fn: () => Promise<T>): Promise<T> {
  if (state.status === 'OPEN') {
    throw new CircuitBreakerError('Circuit is open. Using fallback.');
  }

  if (state.status === 'HALF_OPEN') {
    // Probe: only allow one call through
    const lockAcquired = tryAcquireProbeLock();
    if (!lockAcquired) {
      throw new CircuitBreakerError('Probe in progress. Using fallback.');
    }
  }

  try {
    const result = await fn();
    if (state.status === 'HALF_OPEN') {
      // Probe succeeded — reset to CLOSED
      reset();
    }
    return result;
  } catch (err) {
    recordFailure(state);
    if (state.status === 'HALF_OPEN') {
      // Probe failed — back to OPEN
      state.status = 'OPEN';
      setTimeout(() => {
        state.status = 'HALF_OPEN';
      }, 30_000);
    }
    throw err;
  }
}
```

## Graceful degradation

When the circuit is OPEN, the agent doesn't stop working. It degrades gracefully.

The fallback for intent parsing is the local `compromise.js` parser (covered in [the previous post](#)). No API call needed. The agent still processes intents — it just can't handle novel phrasing until the circuit closes.

```typescript
const circuit = new CircuitBreaker((input: string) => parseWithLLM(input), {
  threshold: 3,
  windowMs: 300_000,
  probeIntervalMs: 30_000,
});

async function parseIntent(input: string): Promise<Intent> {
  try {
    return await circuit.call(() => parseWithLLM(input));
  } catch (err) {
    if (err instanceof CircuitBreakerError) {
      logger.warn('LLM circuit open, falling back to compromise.js');
      return parseWithCompromise(input);
    }
    throw err;
  }
}
```

Graceful degradation means the agent at 80% capacity is better than the agent at 0% capacity. The user mostly doesn't notice.

## Wrapping all 6 OpenAI methods

We don't wrap individual functions. We wrap the entire LLM client interface with a single circuit breaker:

```typescript
class LLMClient {
  private circuit = new CircuitBreaker({
    threshold: 3,
    windowMs: 300_000,
    probeIntervalMs: 30_000,
  });

  async createChatCompletion(params: ChatParams): Promise<ChatResult> {
    return this.circuit.call(() => this._createChatCompletion(params));
  }

  async createEmbedding(params: EmbedParams): Promise<EmbedResult> {
    return this.circuit.call(() => this._createEmbedding(params));
  }

  // ... 4 more methods all routed through the same circuit breaker
}
```

One circuit breaker governs all LLM traffic. If the API is down for any reason, all LLM-dependent operations degrade uniformly.

## Testing the circuit breaker

Property-based tests using `fast-check` verify that state transitions are always valid:

```
✓ CLOSED → OPEN when failure rate exceeds threshold
✓ OPEN stays OPEN during cooldown period
✓ OPEN → HALF_OPEN after cooldown expires
✓ HALF_OPEN → CLOSED on successful probe
✓ HALF_OPEN → OPEN on failed probe
✓ CLOSED stays CLOSED when failures stay under threshold
```

15 tests covering every transition. No edge cases missed.

## Key lesson

Graceful degradation > perfect uptime.

An agent that makes simpler decisions reliably is more valuable than an agent that makes optimal decisions occasionally. Build the fallback first. Then build the primary. The fallback proves you understand what's essential.

---

Full implementation at [`backend/src/utils/circuitBreaker.ts`](https://github.com/kawacukennedy/kuberna-labs/blob/main/backend/src/utils/circuitBreaker.ts). ~80 lines of TypeScript, MIT licensed.

What other safety patterns do you use in production agent systems?

---

_Previously in this series: [Why We Don't Let GPT-4 Parse Financial Intents (And What We Use Instead)](/prev-post-link)_
_Next in this series: [Agent Frameworks vs Execution Rails — Why Your Agent Can't Settle a Trade](/next-post-link)_
