#!/usr/bin/env python3
"""Protocol-1..6 compliant Kuberna conformance v2 bundle.

Produce three artifacts from one generation step so they cannot drift:
  - labelled fixture    (carries expected + ids + assertions)  -> mapping branch (held until open)
  - blind bundle        (opaque salted ids, authority+work only)-> blind branch (published first)
  - delayed mapping     (opaque -> source id, expected, ...)    -> mapping branch (released after tables)

Protocol (Colin Easton, adopted by AIPOU @4adf7a2 and Kuberna):
  fresh payloads, non-self-announcing values, one-edit mutations,
  same-property-only differences, no sentinel hex/words,
  separate blind/mapping publication, prior hash commitments,
  varied case count + pass/fail marginal, recoverable-count published.
"""
import hashlib, json, io, sys, random, os

BAD_SUBSTRINGS = {
    "deadbeef", "0badc0de", "badc0de", "cafebabe", "feedface", "baaaaaad",
    "deadc0de", "badf00d", "defac", "c0ffee", "b00b5", "deadbad", "deadd00d",
}

def fresh_hex(hexlen: int, rng: random.Random) -> str:
    for _ in range(512):
        v = "".join(rng.choice("0123456789abcdef") for _ in range(hexlen))
        if not any(word in v for word in BAD_SUBSTRINGS):
            return "0x" + v
    raise RuntimeError("could not mint a sentinel-free hex literal")

def opaque_id(salt: str, source_id: str) -> str:
    return "case-" + hashlib.sha256((salt + source_id).encode()).hexdigest()[:16]

def canon(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

SEED = "kuberna-conformance-v2-seed-2026-09-01"
rng = random.Random(SEED)
salt = "".join(rng.choice("0123456789abcdef") for _ in range(32))

fact_a = fresh_hex(64, rng)         # chain_derivable fact id (shared constant across chain cases)
fact_b = fresh_hex(64, rng)         # attested_point_in_time fact id (cardinality-2 breaks the v1 trap)
agent   = fresh_hex(40, rng)
agent2  = fresh_hex(40, rng)
pre_action = fact_a                  # positives carry the matching preActionFactId
drift_pre  = fresh_hex(64, rng)      # wrong-but-well-formed 32-byte value, same length
assert drift_pre != fact_a
sigs_valid  = [fresh_hex(128, rng) for _ in range(3)]  # per-link signatures that verify
sigs_bad    = [fresh_hex(128, rng) for _ in range(3)]  # well-formed signatures over the WRONG preimage
assert sigs_valid != sigs_bad
collector_sig = fresh_hex(128, rng)

core_authority = {
    "receipt_type": "chain_derivable",
    "scope_version": "delegation-scope-v2",
    "fact_id": fact_a,
    "subject": {"erc8004_token_id": "1337", "agent_address": agent},
    "derivation": "jcs-sha256 over authority-preimage-v2.json (version field excluded per AIPOU envelope convention)",
}
core_authority_integrity = {
    "receipt_type": "chain_derivable",
    "scope_version": "delegation-scope-v2",
    "fact_id": fact_a,
    "subject": {"erc8004_token_id": "1337", "agent_address": agent},
    "chain_integrity": "verified",
}
core_work = {
    "receipt_type": "issuer_asserted",
    "scheme": "aipou-receipt-v1",
    "preActionFactId": pre_action,
}

def work(coverage):
    w = dict(core_work); w["coverage"] = coverage; return w

cov_enumerated = {"scope": "agent-intent-executions", "observed_n": 12, "as_of": "2026-09-01T00:00:00Z", "complete": "enumerated"}
cov_unknown    = {"scope": "agent-intent-executions", "observed_n": 0,  "as_of": "2026-09-01T00:00:00Z", "complete": "unknown"}
cov_sampled    = {"scope": "agent-intent-executions", "observed_n": 37, "as_of": "2026-09-01T00:00:00Z", "complete": "sampled"}

def case(id_, expected, authority, w, assertion=None, mutation_of=None, mutated_field=None):
    c = {"id": id_, "expected": expected, "authority": authority}
    if w is not None:
        c["work"] = w
    if assertion:
        c["assertion"] = assertion
    if mutation_of:
        c["mutation_of"] = mutation_of
        c["mutated_field"] = mutated_field
    return c

cases = [
    case("positive-authority-work-link", "pass",
         core_authority, work(cov_enumerated),
         "control: chain_derivable authority links to issuer_asserted work whose preActionFactId equals authority.fact_id; registered scheme; enumerated coverage declared."),
    case("positive-degraded-coverage", "pass",
         core_authority, work(cov_unknown),
         "coverage.complete 'unknown' with observed_n 0 is reachable and not the default; a consumer sees scope declared but no observation count. Pass: the claim does not falsely assert completed observation. Control for negative-enumerated-zero."),
    case("positive-chain-integrity", "pass",
         dict(core_authority_integrity, link_signatures=sigs_valid), None,
         "control: chain_integrity verified and every per-link signature verifies. Control for negative-resealed-chain."),
    case("positive-foreign-authority", "pass",
         {"receipt_type": "attested_point_in_time", "scope_version": "delegation-scope-v2", "fact_id": fact_b,
          "subject": {"erc8004_token_id": "1337", "agent_address": agent2}},
         work(cov_enumerated),
         "registry for this bundle includes 'aipou-receipt-v1'; a different authority threat-model (attested_point_in_time) with a registered scheme and matching fact link passes. Authority.fact_id is not a bundle-wide constant."),
    case("positive-sampled-coverage", "pass",
         core_authority, work(cov_sampled),
         "coverage.complete 'sampled' is a third reachable enum member with a positive observed_n; all three completes (enumerated/unknown/sampled) are emitted across this bundle."),
    case("negative-factlink-drift", "fail",
         core_authority,
         {"receipt_type": "issuer_asserted", "scheme": "aipou-receipt-v1", "preActionFactId": drift_pre,
          "coverage": cov_enumerated},
         "one-edit mutation of positive-authority-work-link: work.preActionFactId only (same 32-byte length, well-formed value, simply the wrong one). Equality-invariant rejection with no length confound and no sentinel value.",
         mutation_of="positive-authority-work-link", mutated_field="work.preActionFactId"),
    case("negative-chain-derivable-with-issuer-fields", "fail",
         dict(core_authority, link_signatures=sigs_valid, collectorSignature=collector_sig, collectorKeyId="aipou-collector-002"),
         None,
         "chain_derivable authority carrying issuer_asserted fields (collectorSignature, collectorKeyId) fails closed - trust-model downgrade detection; the values are well-formed, only their placement on a chain_derivable body is the violation."),
    case("negative-unknown-scheme", "fail",
         core_authority,
         {"receipt_type": "issuer_asserted", "scheme": "aipou-receipt-v2", "preActionFactId": pre_action,
          "coverage": cov_enumerated},
         "one-edit mutation of positive-authority-work-link: work.scheme only. 'aipou-receipt-v2' is a plausible in-domain value that is simply not registered; allow-list accept path is KNOWN.has(tag), everything else rejects. No sentinel in the value.",
         mutation_of="positive-authority-work-link", mutated_field="work.scheme"),
    case("negative-resealed-chain", "fail",
         dict(core_authority_integrity, link_signatures=sigs_bad), None,
         "one-edit mutation of positive-chain-integrity: authority.link_signatures only. Hashes were recomputed after content adjustment, so chain_integrity reads verified, but signatures are well-formed and of correct length while failing per-link verification - resealed chain rejected.",
         mutation_of="positive-chain-integrity", mutated_field="authority.link_signatures"),
    case("negative-enumerated-zero", "fail",
         core_authority,
         {"receipt_type": "issuer_asserted", "scheme": "aipou-receipt-v1", "preActionFactId": pre_action,
          "coverage": {"scope": "agent-intent-executions", "observed_n": 0, "as_of": "2026-09-01T00:00:00Z", "complete": "enumerated"}},
         "one-edit mutation of positive-degraded-coverage: coverage.complete only ('unknown' -> 'enumerated') with observed_n still 0. 'Enumerated' with zero observations is an audited-nothing contradiction; fail. The tell is the pair, not a sentinel value.",
         mutation_of="positive-degraded-coverage", mutated_field="work.coverage.complete"),
]

# ---- protocol invariant checks on the labelled fixture ----------------------
mutation_pairs = {}
for c in cases:
    if "mutation_of" in c:
        mutation_pairs[c["id"]] = c["mutation_of"]
    assert len(c["authority"]["fact_id"]) == 66, (c["id"], "authority fact_id not 32-byte")
    if "work" in c and "preActionFactId" in c["work"]:
        assert len(c["work"]["preActionFactId"]) == 66, (c["id"], "preActionFactId not 32-byte")

def body_minus_meta(c):
    return {k: v for k, v in c.items() if k not in ("id", "expected", "assertion", "mutation_of", "mutated_field")}

def leaf_diffs(a, b, path=""):
    """Return the set of leaf paths whose values differ between a and b."""
    if isinstance(a, dict) and isinstance(b, dict):
        out = set()
        for k in set(a) | set(b):
            out |= leaf_diffs(a.get(k), b.get(k), f"{path}.{k}" if path else k)
        return out
    if isinstance(a, list) or isinstance(b, list):
        return set() if a == b else {path or "<list>"}
    return set() if a == b else {path or "<root>"}

for c in cases:
    if "mutation_of" not in c:
        continue
    ctrl = next(x for x in cases if x["id"] == c["mutation_of"])
    field = c["mutated_field"]
    base = body_minus_meta(ctrl)
    mut  = body_minus_meta(c)
    changed = leaf_diffs(base, mut)
    assert changed == {field}, (c["id"], f"one-edit violated: changed {sorted(changed)}, expected {{{field}}}")
    # sibling control must pass
    assert ctrl["expected"] == "pass", (c["id"], "_of target not a pass control")

expected = [c["expected"] for c in cases]
assert expected.count("pass") == 5 and expected.count("fail") == 5, "marginal must be 5/5 this round"
assert len(cases) == 10, "case count must vary from v1 (7)"

# ---- artifacts ---------------------------------------------------------------
def blind_entry(c):
    e = {"id": opaque_id(salt, c["id"]), "authority": c["authority"]}
    if c.get("work") is not None:
        e["work"] = c["work"]
    return e

blind_cases = sorted((blind_entry(c) for c in cases), key=lambda e: e["id"])

blind = {
    "bundle_version": "kuberna-elizaos-conformance-v2-blind-v1",
    "description": (
        "Blinded companion to the Kuberna elizaOS conformance v2 bundle (elizaOS/eliza discussion #9810, "
        "protocol Colin Easton / AIPOU 4adf7a2). Case ids are salted hashes of source ids; assertions, "
        "expected verdicts, and mutation provenance are withheld in a separately published mapping. "
        "The mapping digest is pre-registered before any predicted table may be posted; it opens only "
        "after both sealed tables are on record. Synthetic interoperability evidence only."
    ),
    "cases": blind_cases,
}

mapping_cases = {}
for c in cases:
    oid = opaque_id(salt, c["id"])
    m = {"source_id": c["id"], "expected": c["expected"], "assertion": c.get("assertion", "")}
    if "mutation_of" in c:
        m["mutation_of"] = c["mutation_of"]; m["mutated_field"] = c["mutated_field"]
    mapping_cases[oid] = m

mapping = {
    "bundle_version": "kuberna-elizaos-conformance-v2-blind-v1",
    "description": (
        "Delayed mapping for the v2 blinded companion bundle. Released only after both sealed predicted "
        "tables (and their digests) are on record. Contains the salt, source ids, expected verdicts, "
        "assertions, and mutation pairs."
    ),
    "salt": salt,
    "cases": mapping_cases,
}

labelled = {
    "bundle_version": "kuberna-elizaos-conformance-v2",
    "description": (
        "Kuberna-side executable conformance vectors for the elizaOS agent certification discussion "
        "(#9810), protocol-1..6 compliant. Freshly generated payloads; non-self-announcing negatives; "
        "one-edit mutations. Synthetic schema/conformance vectors only - not certification of execution "
        "quality, not an adoption claim."
    ),
    "cases": cases,
}

def write(path, obj):
    s = io.StringIO(); json.dump(obj, s, indent=2); s.write("\n")
    open(path, "w").write(s.getvalue())

_BASEDIR = os.path.dirname(os.path.abspath(__file__))
out = _BASEDIR + "/"
write(out + "elizaos-conformance-v2-fixtures.json", labelled)
write(out + "elizaos-conformance-v2-blind.json", blind)
write(out + "elizaos-conformance-v2-mapping.json", mapping)

def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()

print("generated OK")
print("salt:", salt)
print("fact_a len:", len(fact_a) - 2, "bytes | fact_b:", len(fact_b) - 2, "bytes | drift_pre==fact_a?", drift_pre == fact_a)
print("cases:", len(cases), "| pass/fail:", expected.count("pass"), "/", expected.count("fail"))
print("authority.fact_id cardinality:", len({c["authority"]["fact_id"] for c in cases}))
print()
print("sha256 labelled:", sha(out + "elizaos-conformance-v2-fixtures.json"))
print("sha256 blind:   ", sha(out + "elizaos-conformance-v2-blind.json"))
print("sha256 mapping: ", sha(out + "elizaos-conformance-v2-mapping.json"))
open(out + ".shas", "w").write(
    "labelled " + sha(out + "elizaos-conformance-v2-fixtures.json") + "\n"
    "blind    " + sha(out + "elizaos-conformance-v2-blind.json") + "\n"
    "mapping  " + sha(out + "elizaos-conformance-v2-mapping.json") + "\n"
)
# The mapping salt is the join key; it is withheld until the mapping opens,
# kept only in the gitignored .salt.local so it can be revealed later.
open(out + ".salt.local", "w").write(salt + "\n")