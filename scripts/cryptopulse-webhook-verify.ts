/**
 * CryptoPulse Webhook Adapter — signature verification + typed payload
 *
 * Implements the webhook contract Kane confirmed field-by-field on 2026-09-20
 * (and re-confirmed, deliberately un-trimmed, on 2026-09-24):
 *
 *   X-CryptoPulse-Signature: sha256=<hex>      HMAC_SHA256(secret, "<timestamp>.<raw body>")
 *   X-CryptoPulse-Timestamp: <unix seconds>   verifier's own replay window
 *   X-CryptoPulse-Event:     whale_move | wallet_watch
 *   X-CryptoPulse-Delivery:  <uuid, unique per attempt>
 *
 * The hex is HMAC over the TIMESTAMP HEADER VALUE, a literal dot, then the RAW
 * BODY BYTES before any JSON parsing. Verify on raw bytes, then parse. The
 * replay window is OURS to choose and enforce — CryptoPulse sends the
 * timestamp and does not reject on age.
 *
 * Confirmed payload shape (differences from our first draft, encoded here):
 *   - no `direction` field — wallet / counterparty only
 *   - `amount` is decimal-adjusted (a float, not base units); `usdValue` is the
 *     USD figure
 *   - `walletLabel` is the watched wallet's label only; the counterparty is
 *     unlabelled in the payload
 *
 * Usage:
 *   import { verifyCryptoPulseWebhook } from '../scripts/cryptopulse-webhook-verify';
 *
 *   npx tsx scripts/cryptopulse-webhook-verify.ts --self-test   # deterministic matrix
 *   CRYPTOPULSE_WEBHOOK_SECRET=... npx tsx scripts/cryptopulse-webhook-verify.ts \
 *     --body-file body.json --timestamp 1758326400 --signature "sha256=<hex>" \
 *     [--event whale_move] [--delivery <uuid>]                  # verify one real event
 *
 * Exit codes: 0 = all passed/verified, 2 = verification failed, 1 = usage error.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Confirmed envelope types (Kane, 2026-09-20 / 2026-09-24)
// ---------------------------------------------------------------------------

export const CRYPTOPULSE_EVENTS = ['whale_move', 'wallet_watch'] as const;
export type CryptoPulseEvent = (typeof CRYPTOPULSE_EVENTS)[number];

export interface WhaleMoveData {
  alertId: string;
  alertType: string;
  chain: string;
  chainName: string;
  token: string;
  tokenSymbol: string;
  amount: number; // decimal-adjusted, NOT base units
  usdValue: number;
  wallet: string;
  walletLabel: string; // watched wallet's label; counterparty is unlabelled
  counterparty: string;
  hash: string;
  explorerUrl: string;
}

export type CryptoPulseData = WhaleMoveData; // wallet_watch carries a distinct shape when confirmed

export interface CryptoPulseEnvelope {
  event: CryptoPulseEvent;
  timestamp: number;
  data: CryptoPulseData;
}

export interface CryptoPulseHeaders {
  signature: string; // X-CryptoPulse-Signature: sha256=<hex>
  timestamp: string; // X-CryptoPulse-Timestamp: <unix seconds>
  event?: string; // X-CryptoPulse-Event
  delivery?: string; // X-CryptoPulse-Delivery: <uuid>
}

export type VerifyResult =
  | { ok: true; envelope: CryptoPulseEnvelope; delivery?: string }
  | { ok: false; reason: VerifyFailureReason; detail: string };

export type VerifyFailureReason =
  | 'missing_signature_header'
  | 'malformed_signature'
  | 'missing_timestamp_header'
  | 'malformed_timestamp'
  | 'replay_rejected'
  | 'signature_mismatch'
  | 'invalid_json'
  | 'unknown_event'
  | 'malformed_envelope';

export interface VerifyOptions {
  secret: string;
  rawBody: string;
  signature: string;
  timestamp: string;
  event?: string;
  delivery?: string;
  /** Replay window in seconds. OURS to choose — default 300 (5 minutes). */
  maxAgeSeconds?: number;
  /** Overridable clock for tests; defaults to Date.now()/1000. */
  nowSeconds?: number;
}

const DEFAULT_MAX_AGE_SECONDS = 300;

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

/**
 * Computes the signature value a real delivery would carry:
 * HMAC_SHA256(secret, "<timestamp>.<raw body>") over the raw body bytes,
 * rendered as `sha256=<lowercase hex>`.
 */
export function computeCryptoPulseSignature(
  secret: string,
  timestamp: string,
  rawBody: string
): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(`${timestamp}.`);
  hmac.update(Buffer.from(rawBody, 'utf8'));
  return `sha256=${hmac.digest('hex')}`;
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a.toLowerCase(), 'utf8');
  const bb = Buffer.from(b.toLowerCase(), 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function parseSignatureHeader(value: string): string | null {
  // Accept "sha256=<hex>" with optional surrounding whitespace.
  const m = /^\s*sha256=(hex:[0-9a-f]+|[0-9a-f]+)\s*$/i.exec(value);
  if (!m) return null;
  return m[1].replace(/^hex:/i, '');
}

// ---------------------------------------------------------------------------
// Envelope validation
// ---------------------------------------------------------------------------

function isWhaleMoveData(v: unknown): v is WhaleMoveData {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Record<string, unknown>;
  const str = (k: string) => typeof d[k] === 'string' && d[k] !== '';
  const num = (k: string) => typeof d[k] === 'number' && Number.isFinite(d[k]);
  return (
    str('alertId') &&
    str('alertType') &&
    str('chain') &&
    str('chainName') &&
    str('token') &&
    str('tokenSymbol') &&
    num('amount') &&
    num('usdValue') &&
    str('wallet') &&
    str('walletLabel') &&
    str('counterparty') &&
    str('hash') &&
    str('explorerUrl')
  );
}

function parseEnvelope(json: unknown): CryptoPulseEnvelope | null {
  if (typeof json !== 'object' || json === null) return null;
  const e = json as Record<string, unknown>;
  if (typeof e.event !== 'string' || typeof e.timestamp !== 'number') return null;
  if (!(CRYPTOPULSE_EVENTS as readonly string[]).includes(e.event)) return null;
  if (!isWhaleMoveData(e.data)) return null;
  return { event: e.event as CryptoPulseEvent, timestamp: e.timestamp, data: e.data };
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------

/**
 * Verifies a CryptoPulse webhook delivery:
 *   1. headers present and well-formed
 *   2. timestamp within our replay window (ours to enforce, default 5 min)
 *   3. computed HMAC matches the signed payload, timing-safe, over raw bytes
 *   4. body parses to the confirmed envelope (typed, strict)
 *
 * Returns a discriminated result — never throws for a bad delivery.
 */
export function verifyCryptoPulseWebhook(opts: VerifyOptions): VerifyResult {
  const maxAge = opts.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;

  if (!opts.signature)
    return {
      ok: false,
      reason: 'missing_signature_header',
      detail: 'X-CryptoPulse-Signature empty or absent',
    };
  const sigHex = parseSignatureHeader(opts.signature);
  if (!sigHex)
    return {
      ok: false,
      reason: 'malformed_signature',
      detail: `expected 'sha256=<hex>', got '${opts.signature.slice(0, 80)}'`,
    };

  if (!opts.timestamp)
    return {
      ok: false,
      reason: 'missing_timestamp_header',
      detail: 'X-CryptoPulse-Timestamp empty or absent',
    };
  const ts = Number(opts.timestamp);
  if (!Number.isFinite(ts) || ts <= 0)
    return {
      ok: false,
      reason: 'malformed_timestamp',
      detail: `'${opts.timestamp}' is not a unix seconds value`,
    };

  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const age = now - ts;
  if (age > maxAge) {
    return {
      ok: false,
      reason: 'replay_rejected',
      detail: `delivery ${age}s old exceeds our ${maxAge}s replay window (CryptoPulse does not enforce one — this is ours)`,
    };
  }

  const computed = computeCryptoPulseSignature(opts.secret, opts.timestamp, opts.rawBody);
  if (!timingSafeHexEqual(sigHex, computed.slice('sha256='.length))) {
    return {
      ok: false,
      reason: 'signature_mismatch',
      detail: 'HMAC over "<timestamp>.<raw body>" does not match',
    };
  }

  // Signature is good — only now do we parse the body.
  let parsed: unknown;
  try {
    parsed = JSON.parse(opts.rawBody);
  } catch (err) {
    return { ok: false, reason: 'invalid_json', detail: `body is not valid JSON: ${String(err)}` };
  }

  const envelope = parseEnvelope(parsed);
  if (!envelope)
    return {
      ok: false,
      reason: 'malformed_envelope',
      detail: 'body does not match the confirmed CryptoPulse envelope (event/timestamp/data.*)',
    };

  if (opts.event && opts.event !== envelope.event) {
    return {
      ok: false,
      reason: 'unknown_event',
      detail: `header says ${opts.event}, body says ${envelope.event}`,
    };
  }

  return { ok: true, envelope, delivery: opts.delivery };
}

// ---------------------------------------------------------------------------
// Self-test — Kane's confirmed example, signed and re-verified
// ---------------------------------------------------------------------------

const SELFTEST_SECRET = 'kuberna-self-test-secret-2026';
// The exact structure Kane confirmed on 2026-09-20, with concrete values in
// place of his "…" ellipses: event/timestamp/data.{alertId, alertType, chain,
// chainName, token, tokenSymbol, amount, usdValue, wallet, walletLabel,
// counterparty, hash, explorerUrl}. amount is decimal-adjusted; only the
// watched wallet carries a label; there is deliberately no direction field.
const SELFTEST_BODY = JSON.stringify({
  event: 'whale_move',
  timestamp: 1758326400,
  data: {
    alertId: 'cp-alert-0f3a91',
    alertType: 'whale_move',
    chain: 'ethereum',
    chainName: 'Ethereum',
    token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenSymbol: 'USDC',
    amount: 1234.5,
    usdValue: 4200000,
    wallet: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    walletLabel: 'Wintermute',
    counterparty: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    hash: '0x2f3b1a4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7f0',
    explorerUrl:
      'https://etherscan.io/tx/0x2f3b1a4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7f0',
  },
});

interface SelfTestCheck {
  name: string;
  pass: boolean;
  detail: string;
}

function runSelfTest(): { checks: SelfTestCheck[]; passed: boolean } {
  const checks: SelfTestCheck[] = [];
  const now = 1758326550; // fixture timestamp + 150s (2.5 min) — inside our 5-min window
  const push = (name: string, pass: boolean, detail: string) =>
    checks.push({ name, pass, detail: pass ? detail : `FAIL: ${detail}` });

  // 1. A correctly signed fresh delivery verifies and types out.
  const sig = computeCryptoPulseSignature(SELFTEST_SECRET, '1758326400', SELFTEST_BODY);
  const ok = verifyCryptoPulseWebhook({
    secret: SELFTEST_SECRET,
    rawBody: SELFTEST_BODY,
    signature: sig,
    timestamp: '1758326400',
    event: 'whale_move',
    delivery: 'd0e1f2a3-b4c5-4d6e-8f90-1234567890ab',
    nowSeconds: now,
  });
  push(
    'valid signature verifies',
    ok.ok === true && ok.envelope.event === 'whale_move' && ok.envelope.data.tokenSymbol === 'USDC',
    ok.ok
      ? `envelope parsed: ${ok.envelope.event} ${ok.envelope.data.tokenSymbol} $${ok.envelope.data.usdValue}`
      : `${ok.reason}: ${ok.detail}`
  );

  // 2. The three confirmed corrections are encoded: no direction, decimal
  //    amount, label on the watch side only.
  const d = ok.ok ? ok.envelope.data : null;
  push(
    'no direction field in confirmed shape',
    d !== null && !('direction' in d),
    d !== null ? `payload fields: ${Object.keys(d).join(', ')}` : 'envelope did not parse'
  );
  push(
    'amount is decimal-adjusted float; usdValue separate',
    d !== null &&
      typeof d.amount === 'number' &&
      d.amount === 1234.5 &&
      typeof d.usdValue === 'number',
    d !== null ? `amount=${d.amount} usdValue=${d.usdValue}` : 'envelope did not parse'
  );
  push(
    'label on watched wallet only',
    d !== null && typeof d.walletLabel === 'string' && d.walletLabel === 'Wintermute',
    d !== null ? `walletLabel=${d.walletLabel}` : 'envelope did not parse'
  );

  // 3. Tamper: flip one byte in the body -> signature mismatch.
  const tampered = SELFTEST_BODY.replace('1234.5', '1235.5');
  const tamperedRes = verifyCryptoPulseWebhook({
    secret: SELFTEST_SECRET,
    rawBody: tampered,
    signature: sig,
    timestamp: '1758326400',
    nowSeconds: now,
  });
  push(
    'tampered body rejected',
    !tamperedRes.ok && tamperedRes.reason === 'signature_mismatch',
    tamperedRes.ok ? 'tampered body verified (BAD)' : `${tamperedRes.reason}: ${tamperedRes.detail}`
  );

  // 4. Wrong secret rejected.
  const wrongSecretRes = verifyCryptoPulseWebhook({
    secret: 'not-the-secret',
    rawBody: SELFTEST_BODY,
    signature: sig,
    timestamp: '1758326400',
    nowSeconds: now,
  });
  push(
    'wrong secret rejected',
    !wrongSecretRes.ok && wrongSecretRes.reason === 'signature_mismatch',
    wrongSecretRes.ok ? 'wrong secret verified (BAD)' : `${wrongSecretRes.reason}`
  );

  // 5. Replay window is ours: an old delivery (past maxAge) is rejected.
  const oldNow = 1758326400 + 900; // 15 minutes later — past our 5-min window
  const replayRes = verifyCryptoPulseWebhook({
    secret: SELFTEST_SECRET,
    rawBody: SELFTEST_BODY,
    signature: sig,
    timestamp: '1758326400',
    nowSeconds: oldNow,
  });
  push(
    'replay older than our window rejected',
    !replayRes.ok && replayRes.reason === 'replay_rejected',
    replayRes.ok
      ? '15-min-old delivery accepted (BAD — window is ours)'
      : `${replayRes.reason}: ${replayRes.detail}`
  );

  // 6. Replay inside our window accepted (CryptoPulse sends no envelope: age policy is ours).
  const insideRes = verifyCryptoPulseWebhook({
    secret: SELFTEST_SECRET,
    rawBody: SELFTEST_BODY,
    signature: sig,
    timestamp: '1758326400',
    nowSeconds: 1758326700, // 5 minutes exactly
  });
  push(
    'delivery at window edge accepted',
    insideRes.ok === true,
    insideRes.ok
      ? '5-minute-old delivery accepted (window is ours to choose)'
      : `${insideRes.reason}: ${insideRes.detail}`
  );

  // 7. Malformed event in body rejected.
  const badEvent = SELFTEST_BODY.replace('"event":"whale_move"', '"event":"trade_signal"');
  const sigBad = computeCryptoPulseSignature(SELFTEST_SECRET, '1758326400', badEvent);
  const badEventRes = verifyCryptoPulseWebhook({
    secret: SELFTEST_SECRET,
    rawBody: badEvent,
    signature: sigBad,
    timestamp: '1758326400',
    nowSeconds: now,
  });
  push(
    'unrecognized event rejected at parse',
    !badEventRes.ok && badEventRes.reason === 'malformed_envelope',
    badEventRes.ok ? 'unknown event accepted (BAD)' : `${badEventRes.reason}`
  );

  return { checks, passed: checks.every((c) => c.pass) };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = `CryptoPulse webhook adapter

  --self-test                         run the deterministic verification matrix
  --secret <secret>                   webhook secret (or CRYPTOPULSE_WEBHOOK_SECRET)
  --body-file <path>                  raw request body to verify
  --signature <sha256=<hex>>          X-CryptoPulse-Signature header value
  --timestamp <unix seconds>          X-CryptoPulse-Timestamp header value
  --event <whale_move|wallet_watch>   X-CryptoPulse-Event header value (optional)
  --delivery <uuid>                   X-CryptoPulse-Delivery header value (optional)
  --max-age <seconds>                 replay window, default ${DEFAULT_MAX_AGE_SECONDS}
  --now <unix seconds>                override clock (tests)`;

function isFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function flagValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (isFlag(args, '--self-test')) {
    const { checks, passed } = runSelfTest();
    console.log('='.repeat(64));
    console.log('CryptoPulse Webhook Adapter — self-test');
    console.log('='.repeat(64));
    for (const c of checks) console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name} — ${c.detail}`);
    console.log(`\nVERDICT: ${passed ? 'PASS' : 'FAIL'}`);

    const outDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `cryptopulse-webhook-selftest-${Date.now()}.json`);
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          fixture: SELFTEST_BODY,
          checks,
          verdict: passed ? 'PASS' : 'FAIL',
        },
        null,
        2
      )
    );
    console.log(`report: ${file}`);
    return passed ? 0 : 2;
  }

  const secret = flagValue(args, '--secret') ?? process.env.CRYPTOPULSE_WEBHOOK_SECRET ?? '';
  const bodyFile = flagValue(args, '--body-file');
  const signature = flagValue(args, '--signature') ?? '';
  const timestamp = flagValue(args, '--timestamp') ?? '';
  const event = flagValue(args, '--event');
  const delivery = flagValue(args, '--delivery');
  const maxAge = Number(flagValue(args, '--max-age') ?? '') || DEFAULT_MAX_AGE_SECONDS;
  const nowSeconds = Number(flagValue(args, '--now') ?? '') || undefined;

  if (!secret || !bodyFile || !signature || !timestamp) {
    console.error(USAGE);
    return 1;
  }
  if (!fs.existsSync(bodyFile)) {
    console.error(`body file not found: ${bodyFile}`);
    return 1;
  }
  const rawBody = fs.readFileSync(bodyFile, 'utf8');
  const result = verifyCryptoPulseWebhook({
    secret,
    rawBody,
    signature,
    timestamp,
    event,
    delivery,
    maxAgeSeconds: maxAge,
    nowSeconds,
  });

  if (!result.ok) {
    console.error(`VERIFICATION FAILED — ${result.reason}: ${result.detail}`);
    return 2;
  }
  const env = result.envelope;
  console.log(
    `VERIFIED ${env.event}: ${env.data.walletLabel && env.data.walletLabel !== '' ? env.data.walletLabel : env.data.wallet.slice(0, 10) + '…'} ` +
      `${env.data.tokenSymbol} ${env.data.amount} ($${env.data.usdValue}) on ${env.data.chainName}`
  );
  console.log(`  tx:    ${env.data.explorerUrl}`);
  console.log(
    `  event: ${env.event}${env.data.alertType ? ` (${env.data.alertType})` : ''}${result.delivery ? ` delivery=${result.delivery}` : ''}`
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err?.message ?? err);
    process.exit(1);
  });
