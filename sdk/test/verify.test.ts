import { jcsCanonicalize } from '../src/verify/jcs.js';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('jcsCanonicalize', () => {
  it('serializes BigInt values as decimal integers', () => {
    expect(jcsCanonicalize(9007199254740993n)).toBe('9007199254740993');
  });

  it('encodes Unicode code points above U+FFFF as surrogate pairs', () => {
    expect(jcsCanonicalize('\u{1f600}')).toBe('"\\ud83d\\ude00"');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('canonicalizes %s as null', (_label, value) => {
    expect(jcsCanonicalize(value)).toBe('null');
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('rejects %s', (_label, value) => {
    expect(() => jcsCanonicalize(value)).toThrow('JCS does not support Infinity or NaN');
  });

  it('canonicalizes empty objects and arrays', () => {
    expect(jcsCanonicalize({})).toBe('{}');
    expect(jcsCanonicalize([])).toBe('[]');
  });

  it('escapes control characters', () => {
    expect(jcsCanonicalize('\b\t\n\f\r\u0000')).toBe('"\\b\\t\\n\\f\\r\\u0000"');
  });

  it('authority-receipt fact_id matches JCS+SHA-256 of authority-preimage', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const receiptPath = resolve(fixturesDir, 'authority-receipt.json');
    const preimagePath = resolve(fixturesDir, 'authority-preimage.json');

    const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
    const preimage = JSON.parse(readFileSync(preimagePath, 'utf8'));

    const canonicalized = jcsCanonicalize(preimage);
    const hash = createHash('sha256').update(canonicalized, 'utf8').digest('hex');
    const computedFactId = `0x${hash}`;

    expect(computedFactId).toBe(receipt.fact_id);
    expect(computedFactId).toBe(receipt.fact_id_derivation.bytes32);
  });

  it('elizaOS conformance bundle has pinned canonical fact_id', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const bundlePath = resolve(fixturesDir, 'elizaos-conformance-fixtures.json');
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

    expect(bundle.bundle_version).toBe('kuberna-elizaos-conformance-v1');
    expect(bundle.pinned.commit).toBe('fada367f122adf10dcd0b8c63dba98df7d06a2d6');

    const positive = bundle.cases.find((c: any) => c.id === 'positive-authority-work-link');
    expect(positive.expected).toBe('pass');
    expect(positive.authority.fact_id).toBe(
      '0x82c33017978a70f0cf08ecc45df9ae81107410d466f0e5205b426981466baaad'
    );
    expect(positive.work.preActionFactId).toBe(positive.authority.fact_id);
  });

  it('elizaOS conformance bundle has both fail-closed negatives', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const bundlePath = resolve(fixturesDir, 'elizaos-conformance-fixtures.json');
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

    const negativeDrift = bundle.cases.find((c: any) => c.id === 'negative-factlink-drift');
    const negativeIssuer = bundle.cases.find(
      (c: any) => c.id === 'negative-chain-derivable-with-issuer-fields'
    );

    expect(negativeDrift.expected).toBe('fail');
    expect(negativeDrift.work.preActionFactId).not.toBe(negativeDrift.authority.fact_id);

    expect(negativeIssuer.expected).toBe('fail');
    expect(negativeIssuer.authority.collectorSignature).toBeDefined();
    expect(negativeIssuer.authority.receipt_type).toBe('chain_derivable');
  });

  it('elizaOS conformance: unknown-scheme claim fails closed (allow-list invariant)', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const bundlePath = resolve(fixturesDir, 'elizaos-conformance-fixtures.json');
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

    const negativeUnknown = bundle.cases.find(
      (c: any) => c.id === 'negative-unknown-scheme'
    );

    expect(negativeUnknown).toBeDefined();
    expect(negativeUnknown.expected).toBe('fail');
    expect(negativeUnknown.work.scheme).not.toBe('aipou-receipt-v1');
    expect(negativeUnknown.work.preActionFactId).toBe(negativeUnknown.authority.fact_id);
    expect(negativeUnknown.assertion).toContain('allow-list invariant');
  });

  it('elizaOS conformance: positive claim declares coverage (scope + denominator)', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const bundlePath = resolve(fixturesDir, 'elizaos-conformance-fixtures.json');
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

    const positive = bundle.cases.find((c: any) => c.id === 'positive-authority-work-link');

    expect(positive.work.coverage).toBeDefined();
    expect(positive.work.coverage.scope).toBe('agent-intent-executions');
    expect(typeof positive.work.coverage.observed_n).toBe('number');
    expect(positive.work.coverage.observed_n).toBeGreaterThan(0);
    expect(positive.work.coverage.as_of).toBeDefined();
    expect(['enumerated', 'sampled', 'unknown']).toContain(positive.work.coverage.complete);
  });

  it('elizaOS conformance: resealed-chain claim fails closed (per-link signature required)', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const bundlePath = resolve(fixturesDir, 'elizaos-conformance-fixtures.json');
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

    const negativeResealed = bundle.cases.find(
      (c: any) => c.id === 'negative-resealed-chain'
    );

    expect(negativeResealed).toBeDefined();
    expect(negativeResealed.expected).toBe('fail');
    expect(negativeResealed.authority.chain_integrity).toBe('valid');
    expect(negativeResealed.authority.link_signatures).toBe('invalid');
    expect(negativeResealed.assertion).toContain('resealed chain rejected');
  });

  it('failure-histogram commitment digest includes decay window_end (hash(histogram, window_end))', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const commitmentPath = resolve(fixturesDir, 'failure-histogram.json');
    const preimagePath = resolve(fixturesDir, 'failure-histogram-preimage.json');

    const commitment = JSON.parse(readFileSync(commitmentPath, 'utf8'));
    const preimage = JSON.parse(readFileSync(preimagePath, 'utf8'));

    const canonicalized = jcsCanonicalize(preimage);
    const hash = createHash('sha256').update(canonicalized, 'utf8').digest('hex');
    const computedFactId = `0x${hash}`;

    expect(computedFactId).toBe(commitment.fact_id);
    expect(computedFactId).toBe(commitment.commitment_derivation.bytes32);
    expect(preimage.window_end).toBe(commitment.window_end);
  });

  it('straddling-window turn splits into per-window receipts instead of rejecting the whole turn', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const fixturePath = resolve(fixturesDir, 'straddling-window-receipt.json');
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

    expect(fixture.turn.straddles_boundary).toBe(true);
    expect(fixture.turn.steps_in_window_N).toBeGreaterThan(0);
    expect(fixture.turn.steps_in_window_N_plus_1).toBeGreaterThan(0);

    const n = fixture.receipts.find((r: any) => r.window === 'N');
    const nPlus1 = fixture.receipts.find((r: any) => r.window === 'N+1');

    expect(n).toBeDefined();
    expect(nPlus1).toBeDefined();

    expect(n!.turn_id).toBe(fixture.turn.turn_id);
    expect(nPlus1!.turn_id).toBe(fixture.turn.turn_id);

    expect(n!.window_end).toBe(fixture.turn.boundary);
    expect(n!.receipt_type).toBe('window_attribution');
    expect(nPlus1!.receipt_type).toBe('window_attribution');

    const nIndices = n!.step_indices;
    const nPlus1Indices = nPlus1!.step_indices;
    expect(Math.max(...nIndices)).toBeLessThan(Math.min(...nPlus1Indices));
    expect(nIndices.length).toBe(fixture.turn.steps_in_window_N);
    expect(nPlus1Indices.length).toBe(fixture.turn.steps_in_window_N_plus_1);

    expect(n!.window_start).toBe('2026-08-02T00:00:00Z');
    expect(nPlus1!.window_start).toBe(fixture.turn.boundary);
    expect(n!.outcome).toBe('completed');
    expect(nPlus1!.outcome).toBe('partial');
    expect(n!.effective).toBe('N');
    expect(nPlus1!.effective).toBe('N');
    expect(n!.is_straddling).toBe(true);
    expect(nPlus1!.is_straddling).toBe(true);
    expect(n!.straddle.overlap_exposure).toBe(true);
    expect(nPlus1!.straddle.overlap_exposure).toBe(true);

    expect(fixture.handling.correct_handling).toContain('split at the boundary');
    expect(fixture.handling.overlap_exposed).toContain('turn_id');
    expect(fixture.handling.effective_attribution).toContain('window the turn started in');
  });

  it('straddling-window fixture carries the cross-implementation marker (Kuberna × HeartFlow)', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const straddle = JSON.parse(
      readFileSync(resolve(fixturesDir, 'straddling-window-receipt.json'), 'utf8')
    );

    expect(straddle.cross_implementation).toBeDefined();
    expect(straddle.cross_implementation.marker).toBe('kuberna-x-heartflow-straddle-v1');
    expect(straddle.cross_implementation.validated_by).toContain('kuberna');
    expect(straddle.cross_implementation.validated_by).toContain(
      'heartflow-window-attribution-receipt-v0.1.0'
    );
    expect(straddle.cross_implementation.heartflow_commit).toBe('21e45b76');
  });

  it('straddling-window N receipt commits to the pinned failure-histogram digest', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const straddle = JSON.parse(
      readFileSync(resolve(fixturesDir, 'straddling-window-receipt.json'), 'utf8')
    );
    const commitment = JSON.parse(
      readFileSync(resolve(fixturesDir, 'failure-histogram.json'), 'utf8')
    );

    const windowN = straddle.receipts.find((r: any) => r.window === 'N');

    expect(straddle.commitment.window).toBe('N');
    expect(straddle.commitment.window_end).toBe(commitment.window_end);
    expect(windowN.commitment_fact_id).toBe(commitment.fact_id);
    expect(straddle.commitment.derivation).toContain('window_end');
  });
});
