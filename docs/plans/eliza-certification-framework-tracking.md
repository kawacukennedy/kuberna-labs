# ElizaOS Certification Framework (#9810) — Tracking

Untracked by design. Tracking/plan docs for framework work stay out of git.

## Thread state (live)
- Discussion: https://github.com/elizaOS/eliza/discussions/9810
- Comments (live): 77 (last: 2026-10-16T10:17:51Z, by kawacukennedy, comment #77)
- Post URL: https://github.com/elizaOS/eliza/discussions/9810#discussioncomment-18970040

## Key events
- 2026-06-29: Proposed framework; taxonomy discussion started (MrTalecky) — separating trust tiers by verification model.
- 2026-06-30: Tagged union proposed: `chain_derivable` / `attested_point_in_time` / `issuer_asserted` (MrTalecky).
- 2026-07-04, 06: Non-downgrade rule and TypeScript sketch (kawacukennedy).
- 2026-07 onward: AIPOU cross-verification (0xddneto), ERC-8004 fixture collaboration, 3-case negative vectors → later expanded to protocol bundle; sealed blind interop with reciprocal artifacts.
- 2026-07-25: parweb field report — five failures; emphasizes: certify claims not executions; lease log not actor log; score verifiers; unknown ≠ zero. Accepted into framework design.
- 2026-08-22: Coverage field (scope, observed_n, as_of, complete enum with unknown reachable/default) + allow-list invariant + resealed-chain rejection added.
- 2026-10-11: houdaguang (ACTN-F) proposes accumulating chain-derivable settlement signal; offers to share acceptance-criteria schema.
- 2026-10-12: kawacukennedy — trust tiers/liveness (X.509 head vs tail); preference for tiers verifiable in bytes/time, issuer_asserted must justify revocation-liveness cost.
- 2026-10-13: 0xddneto — accumulating settlement ≠ general certification; model as chain-derivable settlement fact + scoped acceptance/outcome observations; aggregates need policy/disclosure, must not grant cross-context trust.
- 2026-10-16 (this action): kawacukennedy replied (comment #77) adjudicating houdaguang/0xddneto: on-chain substrate, not trust tier; escrow event → chain_derivable, acceptance/satisfaction → scoped observation with authority; non-downgrade at accumulating tier; minimum-viable: ≥1 accumulating chain-derivable signal; aggregate needs coverage (scope, observed_n, as_of, complete with unknown), reversal rules, omission statement, population/window/missing-data; nothing in accumulating tier grants trust in new context (that’s delegation scope, chain_derivable); accepted houdaguang’s schema offer with concrete test vectors (settlement re-derivable w/o trusting ACTN, each acceptance carries authority, reversal/dispute fails closed on absent, aggregate surfaces missing data); emphasized: synthetic interoperability evidence, not certification of execution quality, not adoption claim; payment is not quality.

## Next actions
- [ ] Wait for houdaguang’s acceptance-criteria schema + vectors; verify against requirements stated in #77.
- [ ] If schema clears tests, fold into criteria list as worked example; do not generalize to a blanket “reputation = trust” claim.
- [ ] Continue tracking verifier-scoring gap (parweb) — attested_point_in_time/execution logs miss semantic/field-parse errors; could become a new variant in trinary when a concrete consumer exists.
- [ ] Maintain non-downgrade invariant in registry insert hooks (chain_derivable facts cannot be registered as issuer_asserted).
- [ ] Preserve fail-closed behavior on absent records (unknown ≠ zero ≠ clean).

## Related
- kawacukennedy/kuberna-labs#79 (ERC-8004 fixtures bundle; pinned commits: fada367f, ae3d4be) — cross-verification with AIPOU (0xddneto/AI-Proof-of-Us)
- docs/specs.json, docs/COMPREHENSIVE_AUDIT_REPORT.md context for Kuberna’s chain-derivable x402 settlement (Base, public hashes)
- parweb ACTN: https://github.com/houdaguang/actn-agent-network
