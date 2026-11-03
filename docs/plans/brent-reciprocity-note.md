# Brent Murray (Tollbeam) — Reciprocity Follow-Up Draft

**Status:** DRAFT — do not send this week. This is the *second* note, for when the
customer-facing path lands and we've run the three legs + deposit flow through it.
First send the short reply drafted in chat/reply thread ("the gap is closed…").

**Why reciprocity:** Brent runs external testing for Tollbeam. External testers value
being tested back — it makes the relationship mutual instead of one-directional, and it
keeps Kuberna load-bearing in their pipeline. This note is the ask, timed *after* we've
run our promised harness so it opens with proof, not a request.

---

## Draft (send after the customer-path run completes)

**Subject:** Re: customer path — ran it, and here's an honest offer

Brent,

Ran the three legs plus the deposit flow through the path — report is in
`reports/tollbeam-customer-parity-<timestamp>.json`, verdict PASS, ledger moved by
exactly the settled legs and the refusal wrote nothing. Measured the same way as the
parity test, no claim beyond the ledger. Happy to post the snippet if you want it in
CONFORMANCE.md.

One thing I noticed while running it: you test our rail, and I'd like to return the
favor properly. Two options, your call:

1. **I run against your harness.** If you point me at the harness (repo + a
   sandbox key), I'll run it against the Kuberna SDK — or against nothing but the raw
   protocol, whichever isolates the variable you care about — and share the raw output,
   same as we've been sharing ours.
2. **You run against ours.** I'll hand you our conformance fixtures
   (`sdk/src/verify/fixtures/elizaos-conformance-fixtures.json`, pinned commit) and the
   one-command runner. If the batch-settlement capability is your optimization play,
   the fixture set already exercises the allow-list/refusal invariants you'd want cited
   independently.

No pressure either way — the deposit-gap honesty and the 0.3% registry number are
already worth more than a green tick. This is just me saying the exchange goes both
ways whenever you want it to.

Kennedy

---

## Post-send checklist

- [ ] Log the reply in the cadence doc (`docs/plans/brent-relationship-cadence.md`)
- [ ] Add the customer-path row to `CONFORMANCE.md` with the verdict + report link
- [ ] If he says yes to option 1: add his harness repo to CONFORMANCE.md as a reciprocal citation
- [ ] If he says yes to option 2: create a `docs/TESTING_WITH_TOLLBEAM.md` with credentials-in-env-only instructions (never the sandbox key in the repo)