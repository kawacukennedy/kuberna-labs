# Brent Murray (Tollbeam) — Relationship Cadence

**Status:** ACTIVE · **Owner:** Kennedy · **Created:** 2026-09-22 (Brent's adhesion note)

**The rule:** one short, useful touchpoint per week. Every touchpoint must carry a
datum — a number, a hash, a refusal code, a finding. No filler, no chasing. If a week
has nothing real to say, say that ("no new claim, no new gap") and only that.

> Brent is now invested in *proving* the channel to us. That is the strongest position
> to be in: he initiates, we verify. Never nudge; always respond within one working day.

---

## Cadence (weekly, Tue 09:00 local)

| Week | Date (2026) | Expected trigger | Touchpoint (template below) |
| ---- | ----------- | ---------------- | --------------------------- |
| 1    | Sep 29      | (this reply already sent Sep 23 — no note this week) | — |
| 2    | Oct 6       | Customer-path endpoint likely | Run `scripts/tollbeam-customer-parity.ts` + send reciprocity note draft |
| 3    | Oct 13      | Their harness / our fixtures exchange | Reciprocal run — post snippet to CONFORMANCE.md |
| 4    | Oct 20      | Registry numbers refresh (0.3% stat aging) | Ask for a fresh registry cut OR cite ours with date |
| 5    | Oct 27      | — (buffer) | Only if something real happened |
| 6    | Nov 3       | — | Check whether batch-settlement has moved from optimization → requirement |

Dates are placeholders; move a week if nothing happened. **Skipping is a valid
touchpoint** — "no new claim, no new gap" is the whole point.

---

## Touchpoint template (one datum, ≤5 lines)

> Quick one: [DATUM] — [one-line context]. Nothing new to claim; that's the update.

Examples that fit the tone:
- "Ran the three legs again against the customer path — verdict PASS, ledger Δ exactly
  $0.26, refusal wrote nothing."
- "Pulled a fresh registry cut: batch-settlement still ≈0.3% of ~16k listings."
- "No new claim, no new gap — channel deposit flow still awaiting your endpoint."

## Anti-patterns (never)

- Asking "any update?" / "any timeline?" — he will send the endpoint when it exists.
- Pushback on the gas framing (facilitator pays is the design, not a loophole).
- Treating Base-Sepolia evidence as mainnet evidence — always restate him: testnet,
  configured seller, four payments.

---

## Supporting material

- Reciprocity note draft: [`docs/plans/brent-reciprocity-note.md`](./brent-reciprocity-note.md)
- Harness to run when the endpoint lands: [`scripts/tollbeam-customer-parity.ts`](../../scripts/tollbeam-customer-parity.ts)
- Conformance citations: [`CONFORMANCE.md`](../../CONFORMANCE.md)