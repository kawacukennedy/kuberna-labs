import { jcsCanonicalize } from '../src/verify/jcs.js';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
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
    expect(positive.authority.fact_id).toBe('0x82c33017978a70f0cf08ecc45df9ae81107410d466f0e5205b426981466baaad');
    expect(positive.work.preActionFactId).toBe(positive.authority.fact_id);
  });

  it('elizaOS conformance bundle has both fail-closed negatives', () => {
    const fixturesDir = resolve(process.cwd(), 'src/verify/fixtures');
    const bundlePath = resolve(fixturesDir, 'elizaos-conformance-fixtures.json');
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

    const negativeDrift = bundle.cases.find((c: any) => c.id === 'negative-factlink-drift');
    const negativeIssuer = bundle.cases.find((c: any) => c.id === 'negative-chain-derivable-with-issuer-fields');

    expect(negativeDrift.expected).toBe('fail');
    expect(negativeDrift.work.preActionFactId).not.toBe(negativeDrift.authority.fact_id);

    expect(negativeIssuer.expected).toBe('fail');
    expect(negativeIssuer.authority.collectorSignature).toBeDefined();
    expect(negativeIssuer.authority.receipt_type).toBe('chain_derivable');
  });
});
