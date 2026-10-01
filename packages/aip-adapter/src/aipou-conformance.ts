import { createHash } from 'node:crypto';

const BYTES32 = /^0x[0-9a-f]{64}$/;
const AIPOU_ISSUER_ASSERTED_FIELDS = new Set([
  'collectorFingerprint',
  'collectorPublicKey',
  'collectorSignature',
  'collectorKeyId',
  'outputHash',
  'trustTier',
  'workReceiptId',
]);

type JsonObject = Record<string, unknown>;

export interface AipouConformanceVerdict {
  valid: boolean;
  code:
    | 'AIPOU_CONFORMANCE_VALID'
    | 'AIPOU_AUTHORITY_SHAPE_INVALID'
    | 'AIPOU_AUTHORITY_ISSUER_FIELD'
    | 'AIPOU_WORK_SHAPE_INVALID'
    | 'AIPOU_FACT_LINK_INVALID';
}

function isRecord(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new Error('Canonical JSON does not permit non-finite numbers');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (!isRecord(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error('Canonical JSON requires plain JSON objects');
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(',')}}`;
}

/**
 * Derives the closed-world delegation-scope fact ID used by the AIPOU
 * interoperability fixture. The envelope-only version field is excluded.
 */
export function deriveAipouAuthorityFactId(scope: JsonObject): string {
  const { version: _version, ...preimage } = scope;
  return `0x${createHash('sha256').update(canonicalJson(preimage)).digest('hex')}`;
}

/**
 * Verifies the structural boundary between a chain-derived authority and an
 * issuer-asserted AIPOU work reference. It does not verify signatures, a
 * registry, an external effect, a claim, or a token settlement.
 */
export function verifyAipouAuthorityWorkCase(value: unknown): AipouConformanceVerdict {
  if (!isRecord(value) || !isRecord(value.authority)) {
    return { valid: false, code: 'AIPOU_AUTHORITY_SHAPE_INVALID' };
  }
  const authority = value.authority;
  if (
    authority.receipt_type !== 'chain_derivable' ||
    authority.scope_version !== 'delegation-scope-v1' ||
    !BYTES32.test(String(authority.fact_id ?? ''))
  ) {
    return { valid: false, code: 'AIPOU_AUTHORITY_SHAPE_INVALID' };
  }
  for (const field of AIPOU_ISSUER_ASSERTED_FIELDS) {
    if (field in authority) return { valid: false, code: 'AIPOU_AUTHORITY_ISSUER_FIELD' };
  }

  if (
    !isRecord(value.work) ||
    value.work.receipt_type !== 'issuer_asserted' ||
    value.work.scheme !== 'aipou-receipt-v1' ||
    !BYTES32.test(String(value.work.preActionFactId ?? ''))
  ) {
    return { valid: false, code: 'AIPOU_WORK_SHAPE_INVALID' };
  }
  if (value.work.preActionFactId !== authority.fact_id) {
    return { valid: false, code: 'AIPOU_FACT_LINK_INVALID' };
  }
  return { valid: true, code: 'AIPOU_CONFORMANCE_VALID' };
}
