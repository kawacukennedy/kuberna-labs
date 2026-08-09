# Virtuals Credit Burn Test — Result

## Summary
- **Target**: $40
- **Result**: **$40.01 REACHED** ✅
- **Credits remaining**: ~$170 (of $210 balance)

## Runs Breakdown

| Run | Model | Calls (Success) | Errors | Spent | Time |
|-----|-------|-----------------|--------|-------|------|
| V1 (killed) | opus-4-8 | 270 | 0 | $6.93 | 17m |
| V2 (completed) | opus-4-8-fast | 152 (of 1000) | 848 | $27.33 | 43m |
| V4 (completed) | opus-4-8 | 75 (of 300) | 225 | $4.77 | 19m |
| Top-off | opus-4-8 | 8 | 0 | $0.98 | ~2m |
| **Total** | | **505** | **1073** | **$40.01** | **~81m** |

## Key Findings
- **Opus 4.8 regular** (anthropic-claude-opus-4-8): $0.03-0.13/call, reliable for first 270 calls then ~75% error rate
- **Opus 4.8 Fast** (anthropic-claude-opus-4-8-fast): $0.03-0.19/call, but ~85% error rate overall
- API errors appear to be transient rate limiting / server load (retries succeed)
- Average cost per successful call: ~$0.08
- Max output tokens reached consistently (2000-4000 per call)

## Verification
- Virtuals API key `acp-1eb86f6fe48a0af6118d` working with HTTP 201
- Credits being consumed and tracked via `cost.usd` field in response
- Burn scripts work in background with nohup

## Scripts
- `scripts/burn-virtuals.mjs` — V1 style (reliable, moderate prompts)
- `scripts/burn-v2.mjs` — Fast model, aggressive (high error rate)
- `scripts/burn-v4.mjs` — Top-off from $34.26
- `scripts/burn-toppff.mjs` — Sequential calls to hit exact target
