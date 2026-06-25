---
title: 'Post 15: Circuit Breaker Patterns for Production AI Systems'
slug: circuit-breaker-patterns-ai-systems
---

## Title Field

Put this in the **Title** field:

> Circuit Breaker Patterns for Production AI Systems

## Subtitle Field

Put this in the **Subtitle** field:

> Sliding-window failure counting, bulkhead isolation, probe-based recovery — the full resilience catalog for LLM-dependent agents.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Circuit Breaker Patterns for Production AI Agents

**Meta description** (155-160 chars):

> Beyond the basic circuit breaker: sliding-window failure counting, bulkhead isolation for multi-LLM setups, probe-based recovery, and graceful degradation for AI agents.

**Post URL slug**:

> circuit-breaker-patterns-ai-systems

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

Every AI agent that talks to an LLM provider has experienced the same nightmare: API calls start timing out, responses come back garbled, or the provider returns a 429 that turns into a 503 that turns into a 30-minute outage.

The standard response is a simple circuit breaker — three failures, open the circuit, wait 30 seconds, try again. That works for databases. For LLM-dependent AI agents, it's dangerously insufficient.

Here's the full resilience catalog Kuberna Labs uses in production.

---

### The Standard Circuit Breaker (And Why It's Not Enough)

The textbook circuit breaker has three states:

```
CLOSED (normal) → OPEN (failing) → HALF-OPEN (testing) → CLOSED (recovered)
```

It works when failures are binary (server up / server down) and recovery is quick. But LLM failures are rarely binary. They're:

- **Intermittent**: One call in 50 fails for no apparent reason
- **Degraded**: Response comes back in 15 seconds instead of 2
- **Silent**: API returns 200 but the response is gibberish
- **Throttled**: 429s that ramp up slowly then spike

A standard circuit breaker either trips too early (frustrating users) or too late (burning money on failed calls).

---

### Sliding-Window Failure Counting

Instead of counting consecutive failures, Kuberna uses a **sliding-window counter**:

```typescript
class SlidingWindowBreaker {
  private window: number[] = []; // timestamps of failures
  private readonly windowMs: number = 60_000; // 1 minute
  private readonly threshold: number = 5; // max failures
  private readonly minCalls: number = 10; // minimum calls before tripping

  recordCall(success: boolean) {
    const now = Date.now();
    this.window = this.window.filter((t) => now - t < this.windowMs);

    if (!success) {
      this.window.push(now);
    }

    const totalCalls = this.totalCallsInWindow();
    if (
      totalCalls >= this.minCalls &&
      this.window.length / totalCalls > 0.5 &&
      this.window.length >= this.threshold
    ) {
      this.trip();
    }
  }
}
```

This trips the breaker when **50% of calls fail in a rolling 1-minute window**, with a minimum of 10 calls and 5 failures. That means:

- 3 failures out of 100 calls? No trip (3% is fine)
- 6 failures out of 10 calls? Trip (60% failure rate)
- 3 failures out of 3 calls? No trip (not enough data)

The minimum-calls threshold prevents false trips on cold starts. The percentage threshold adapts to traffic volume.

---

### Bulkhead Isolation for Multi-LLM Setups

Most production agents use multiple LLM providers — GPT-4 for complex reasoning, Claude for code generation, a local model for simple lookups. When one provider fails, you want the others to keep working.

**Bulkhead isolation** means each provider gets its own circuit breaker, its own connection pool, its own failure counter:

```typescript
const breakers = {
  openai: new SlidingWindowBreaker({ threshold: 5, windowMs: 60_000 }),
  anthropic: new SlidingWindowBreaker({ threshold: 3, windowMs: 30_000 }),
  local: new SlidingWindowBreaker({ threshold: 10, windowMs: 120_000 }),
};

async function callWithFallback(prompt: string, providers: string[]) {
  for (const provider of providers) {
    if (breakers[provider].isClosed()) {
      try {
        const result = await callProvider(provider, prompt);
        breakers[provider].recordCall(true);
        return result;
      } catch (err) {
        breakers[provider].recordCall(false);
        // fall through to next provider
      }
    }
  }
  throw new Error('All providers exhausted');
}
```

The fallback order matters. In production:

1. Primary provider (GPT-4 or whatever your agent is configured for)
2. Secondary provider (different API, different model family)
3. Tertiary provider (usually a cheaper model)
4. Degraded mode (agent operates with reduced capabilities)

Each provider's breaker operates independently. OpenAI going down doesn't affect Anthropic calls.

---

### Failure Mode Taxonomy

Not all failures are the same. The breaker needs to know _what kind_ of failure occurred:

```typescript
enum FailureMode {
  TIMEOUT, // Request exceeded deadline
  RATE_LIMITED, // 429 — back off
  SERVER_ERROR, // 5xx — provider issue
  AUTH_FAILURE, // 401/403 — key expired?
  GIBBERISH, // 200 but unparseable response
  COST_LIMIT, // Monthly budget exceeded
  CONTEXT_OVERRUN, // Token limit hit
  LATENCY_SPIKE, // Response took >10s
}
```

Each mode triggers different behavior:

| Failure Mode    | Counts as Failure?            | Reset on Success?          | Cooldown                     |
| --------------- | ----------------------------- | -------------------------- | ---------------------------- |
| TIMEOUT         | Yes                           | No                         | 5 seconds                    |
| RATE_LIMITED    | Depends on retry-after header | No                         | Retry-After + 1s             |
| SERVER_ERROR    | Yes                           | Yes                        | 30 seconds                   |
| AUTH_FAILURE    | No                            | N/A                        | No trip (fail fast)          |
| GIBBERISH       | Yes                           | Yes (if next call is good) | 60 seconds                   |
| COST_LIMIT      | No                            | N/A                        | No trip (different handling) |
| CONTEXT_OVERRUN | Yes                           | Yes                        | 1 second (transient)         |
| LATENCY_SPIKE   | Weighted (0.3 of a failure)   | Yes                        | 10 seconds                   |

A LATENCY_SPIKE counts as 0.3 failures — not enough to trip the breaker alone, but combined with other failures it pushes the window toward the threshold.

---

### Probe-Based Recovery

When a circuit breaker opens, you need to know when the provider is healthy again. The standard approach is a **probe** — a lightweight call to test the waters:

```typescript
class ProbeBreaker {
  private readonly probeInterval: number = 10_000; // 10 seconds
  private readonly probeTimeout: number = 2_000; // 2 seconds
  private probeTimer?: NodeJS.Timeout;

  onTrip() {
    this.probeTimer = setInterval(async () => {
      try {
        const start = Date.now();
        // Minimal probe — use a cached/cheap request
        await this.probeProvider({
          model: 'gpt-4o-mini', // cheap model for probing
          maxTokens: 1,
          temperature: 0,
          messages: [{ role: 'user', content: '.' }],
        });
        const latency = Date.now() - start;

        if (latency < this.probeTimeout) {
          this.halfOpen(); // Move to HALF-OPEN state
        }
      } catch {
        // Keep probing
      }
    }, this.probeInterval);
  }
}
```

The probe uses the cheapest model, the shortest possible prompt, and a tight timeout. If it succeeds within the timeout, the circuit moves to HALF-OPEN and starts accepting real traffic. If a real call fails in HALF-OPEN, it goes back to OPEN immediately.

Probe results also feed back into the sliding window. A failed probe counts as a failure. A healthy probe doesn't clear the window — only real traffic does that.

---

### Graceful Degradation Hierarchy

When all providers are down, the agent shouldn't crash. It should degrade gracefully:

```
Level 0: Full functionality (default)
  → All LLM providers available
  → Agent executes normally

Level 1: LLM-only degradation
  → One provider down (e.g., OpenAI)
  → Agent falls back to alternative providers
  → Increased latency, same capability

Level 2: No LLM available
  → All external providers down
  → Agent uses local rules engine (compromise.js)
  → Reduced capability: only supported intents
  → No natural language parsing

Level 3: Network isolation
  → Agent can't reach any external service
  → Agent operates on cached data only
  → Queues intents for later execution
  → Publishes status: "offline, delayed execution"

Level 4: Safe shutdown
  → All escrowed funds returned
  → Active intents cancelled
  → Agent publishes shutdown attestation
  → Cleans up resources
```

Most agents should implement Level 1 and Level 2 at minimum. Level 3 is recommended if the agent handles user funds. Level 4 is required for agents holding escrow.

The Kuberna SDK includes a `DegradationManager` that handles transitions automatically:

```typescript
const mgr = new DegradationManager({
  onLevelChange: (level, reason) => {
    console.log(`Agent degraded to level ${level}: ${reason}`);
    // Post status to agent's profile
    agent.postUpdate({
      status: level >= 2 ? 'degraded' : 'normal',
      currentLevel: level,
    });
  },
  providerCheckInterval: 30_000, // check every 30 seconds
  escrowSafeguard: true, // auto-return escrow on level 3
});
```

---

### Monitoring and Alerting Integration

Circuit breakers generate events that feed into your monitoring stack:

```typescript
breaker.on('trip', (provider, window) => {
  metrics.increment('circuit_breaker.trip', { provider });
  logger.warn({
    provider,
    failures: window.length,
    duration: Date.now() - window[0],
    alert: true, // route to PagerDuty/OpsGenie
  });
});

breaker.on('halfOpen', (provider) => {
  metrics.increment('circuit_breaker.half_open', { provider });
  logger.info(`Breaker half-open for ${provider}`);
});

breaker.on('reset', (provider, duration) => {
  metrics.timing('circuit_breaker.down_duration', duration, { provider });
  logger.info(`Breaker reset for ${provider} after ${duration}ms`);
});
```

In practice, we see about 0.5-2 breaker trips per provider per week in production. Most self-resolve within 60 seconds. Persistent trips (>5 minutes) trigger automatic fallback to Level 2.

---

### Putting It All Together

The full resilience stack in Kuberna's SDK:

```
┌─────────────────────────────────────────┐
│  Agent Resilience Layer                  │
│─────────────────────────────────────────│
│  Degradation Manager                     │
│  ├─ SlidingWindowBreaker (OpenAI)       │
│  ├─ SlidingWindowBreaker (Anthropic)    │
│  ├─ SlidingWindowBreaker (Local)        │
│  ├─ Probe Engine                        │
│  └─ Fallback Router                     │
│─────────────────────────────────────────│
│  Bulkhead (connection pools)            │
│  Failure classification                  │
│  Metrics exporter                        │
│  Escrow safeguard                        │
└─────────────────────────────────────────┘
```

Every agent gets this by default when using the SDK. You can tune the parameters — thresholds, intervals, degradation levels — to match your use case.

---

The full circuit breaker implementation is [open source on GitHub](https://github.com/kawacukennedy/kuberna-labs). The `src/resilience/` directory has all the breaker types, the degradation manager, and the monitoring integration. We'd love feedback from people running production AI agents — what failure modes have we missed?

Come talk resilience in the [Discord](https://discord.gg/MZvNuhpXu) — there's a dedicated #reliability channel where we share war stories from production.

**Subscribe to this series** — Post 16 covers Kite x402: agent-controlled micropayments without holding a single private key.

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
