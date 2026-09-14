import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deriveAipouAuthorityFactId,
  verifyAipouAuthorityWorkCase,
} from '../src/aipou-conformance.js';

interface AuthorityReceiptFixture {
  fact_id: string;
  fact_id_derivation: { bytes32: string };
}

interface ConformanceCase {
  id: string;
  expected: 'pass' | 'fail';
  authority: Record<string, unknown>;
  work?: Record<string, unknown>;
}

interface ConformanceBundle {
  bundle_version: string;
  pinned: { commit: string };
  cases: ConformanceCase[];
}

const repositoryRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const fixturesDirectory = resolve(repositoryRoot, 'sdk/src/verify/fixtures');

function readFixture<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(fixturesDirectory, name), 'utf8')) as T;
}

describe('AIPOU interoperability fixtures', () => {
  it('derives the pinned authority fact ID from its public delegation scope', () => {
    const receipt = readFixture<AuthorityReceiptFixture>('authority-receipt.json');
    const scope = readFixture<Record<string, unknown>>('authority-preimage.json');

    const factId = deriveAipouAuthorityFactId(scope);
    expect(factId).toBe(receipt.fact_id);
    expect(factId).toBe(receipt.fact_id_derivation.bytes32);
  });

  it('accepts the pinned authority/work link and rejects both boundary violations', () => {
    const bundle = readFixture<ConformanceBundle>('elizaos-conformance-fixtures.json');
    expect(bundle.bundle_version).toBe('kuberna-elizaos-conformance-v1');
    expect(bundle.pinned.commit).toBe('fada367f122adf10dcd0b8c63dba98df7d06a2d6');

    const cases = new Map(bundle.cases.map((fixture) => [fixture.id, fixture]));
    const positive = cases.get('positive-authority-work-link');
    const drift = cases.get('negative-factlink-drift');
    const issuerField = cases.get('negative-chain-derivable-with-issuer-fields');

    expect(positive?.expected).toBe('pass');
    expect(verifyAipouAuthorityWorkCase(positive)).toEqual({
      valid: true,
      code: 'AIPOU_CONFORMANCE_VALID',
    });
    expect(drift?.expected).toBe('fail');
    expect(verifyAipouAuthorityWorkCase(drift)).toEqual({
      valid: false,
      code: 'AIPOU_WORK_SHAPE_INVALID',
    });
    const oneEditDrift = {
      ...positive,
      work: {
        ...positive?.work,
        preActionFactId: `0x${'93'.repeat(32)}`,
      },
    };
    expect(verifyAipouAuthorityWorkCase(oneEditDrift)).toEqual({
      valid: false,
      code: 'AIPOU_FACT_LINK_INVALID',
    });
    expect(issuerField?.expected).toBe('fail');
    expect(verifyAipouAuthorityWorkCase(issuerField)).toEqual({
      valid: false,
      code: 'AIPOU_AUTHORITY_ISSUER_FIELD',
    });
  });
});
