# CryptoPulse (Kane) — Relationship & Integration Cadence

**Status:** ACTIVE · **Owner:** Kennedy · **Created:** 2026-09-24 (post payload-shape + webhook build)

**The rule:** same as Brent — one short, useful touchpoint per week;
each carries a datum (a count, a latency number, a verification result).
No bare "ping?" ever. Skipping is a valid touchpoint.

**Trial policy (locked 2026-09-24):** Kane said he'll follow up about the 30-day
no-card Trader trial himself. We do NOT chase it. At most one nudge after ~5
quiet days, and only attached to something new (e.g., our 7-day-key eval
results) — never a bare nudge.

---

## Intel locked in (2026-09-20 -> 2026-09-24)

- Webhooks exist on **Trader/API plans only** — Free/Pro cannot register them.
  Sept 30 founding-seat deadline is a discount anchor on Pro, NOT a webhook
  path; decide the plan the data says, not the deadline.
- Headers: `X-CryptoPulse-Signature: sha256=<hex>` (HMAC_SHA256(secret,
  "<timestamp>.<raw body>")), `-Timestamp`, `-Event`, `-Delivery`.
- Latency spec 5–15 min; ~6 min observed is not a spec. Replay window is OURS
  (we enforce 5 min).
- Whale movement is not predictive (4 studies, ~zero edge) → treat as data
  feed, not signal.
- MCP live at `cryptopulse.uno/api/mcp`: 7 read-only tools, no write path.
  Server instructions: free-tier trial key covers everything except gated
  tools (need Trader or Api plan).
- Payload shape (confirmed, differs from our first draft): no `direction`,
  `amount` decimal-adjusted, `walletLabel` on the watch side only.

## Build state (PR [#108](https://github.com/kawacukennedy/kuberna-labs/pull/108))

- `scripts/cryptopulse-webhook-verify.ts` — HMAC verify on raw bytes before
  parsing, timing-safe compare, typed envelope, 9-check self-test (PASS).
- `scripts/cryptopulse-eval.ts` — MCP survey for the two tier questions;
  reports which tier each call ran as.

## Eval baseline (anonymous tier, 2026-09-24)

- `get_whale_movements` base: `count=0` · ethereum control: `count=12`.
- Tier signal: re-run with the 7-day key to disambiguate archive (none in
  window) vs tier cap.

---

## Cadence (weekly; placeholder dates — move if nothing happened)

| Week | Date (2026) | Expected trigger | Touchpoint |
| ---- | ----------- | ---------------- | ---------- |
| 1    | Sep 29      | Trial follow-up due from Kane (~5 quiet days after Sep 24) | Only if we owe: attach 7-day-key eval results; else wait |
| 2    | Oct 6       | 7-day key minted + eval run | Send `base count` comparison (anonymous 0 vs key) + latency note |
| 3    | Oct 13      | Trial decision + Trader signup if the data says so | Register webhook, verify one live body against typed model |
| 4    | Oct 20      | First real webhook events | Send our observed latency + counts; confirm delivery headers |

Deadline notes: Sept 30 founding-seat pricing — ignore for the plan decision.
Webhooks need Trader, not discounted Pro; pick what the trial data says.

---

## Anti-patterns (never)

- Bare "ping?" / "any update?" — ever.
- Treating anonymous-tier 0s as Base having no data (it's capped until proven
  otherwise with a key).
- Claiming whale movement predicts price (studies say ~zero edge).
- Claiming the integration is done until ONE live webhook body verifies against
  the typed model in production (Sep 20 vs Sep 24 shapes differ — specs settle
  only in production).

## Supporting material

- Adapter: [`scripts/cryptopulse-webhook-verify.ts`](../../scripts/cryptopulse-webhook-verify.ts)
- Eval: [`scripts/cryptopulse-eval.ts`](../../scripts/cryptopulse-eval.ts)
- Run reports (gitignored): `reports/cryptopulse-*.json`