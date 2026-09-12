/**
 * CryptoPulse Receiver Smoke Test
 *
 * Signs a whale_move payload the way CryptoPulse does (HMAC-SHA256 over
 * `<timestamp>.<body>`, hex digest, sent as `v1=<hex>` with the timestamp in
 * `X-CryptoPulse-Timestamp`) and POSTs it to our receiver. Used to validate
 * the signature path BEFORE real events fire — including that tampered and
 * replayed payloads are rejected.
 *
 * Env:
 *   CRYPTOPULSE_WEBHOOK_SECRET   the shared signing secret (must match
 *                                backend/.env CRYPTOPULSE_WEBHOOK_SECRET)
 *   CRYPTOPULSE_RECEIVER_URL     default http://localhost:3000/hooks/cryptopulse
 *
 * Usage:
 *   npx tsx scripts/cryptopulse-smoke-test.ts              # valid -> expect 200
 *   npx tsx scripts/cryptopulse-smoke-test.ts --tamper     # expect 401
 *   npx tsx scripts/cryptopulse-smoke-test.ts --replay     # stale ts -> expect 401
 *   npx tsx scripts/cryptopulse-smoke-test.ts --nosign     # no signature -> expect 400
 */
import 'dotenv/config';
import crypto from 'crypto';

const SECRET = process.env.CRYPTOPULSE_WEBHOOK_SECRET ?? '';
const TARGET = process.env.CRYPTOPULSE_RECEIVER_URL ?? 'http://localhost:3000/hooks/cryptopulse';

const args = process.argv.slice(2);
const tamper = args.includes('--tamper');
const replay = args.includes('--replay');
const nosign = args.includes('--nosign');

const payload = {
  event: 'whale_move',
  eventId: 'smoke-test-' + Date.now(),
  timestamp: String(Math.floor(Date.now() / 1000)),
  txHash: '0x' + 'ab'.repeat(32),
  block: 22000000,
  chain: 'base',
  direction: 'in',
  from: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  fromLabel: 'uniswap-router',
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  toLabel: 'vitalik.eth',
  token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  amountRaw: '1500000000000000000000',
  amountUsd: 1450.25,
};

async function run(): Promise<void> {
  if (!SECRET) {
    console.error('CRYPTOPULSE_WEBHOOK_SECRET not set.');
    process.exit(2);
  }

  const timestamp = replay
    ? String(Math.floor(Date.now() / 1000) - 6 * 60)
    : String(Math.floor(Date.now() / 1000));
  const signedRaw = JSON.stringify(payload);
  const sentRaw = tamper ? JSON.stringify({ ...payload, amountUsd: 999999 }) : signedRaw;
  const digest = crypto
    .createHmac('sha256', SECRET)
    .update(`${timestamp}.${signedRaw}`)
    .digest('hex');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CryptoPulse-Timestamp': timestamp,
  };
  if (!nosign) headers['X-CryptoPulse-Signature'] = `v1=${digest}`;

  const expectStatus = tamper || replay ? 401 : nosign ? 400 : 200;
  const label = tamper ? 'TAMPER' : replay ? 'REPLAY(6min old)' : nosign ? 'NO-SIGNATURE' : 'VALID';

  console.log(`[${label}] -> ${TARGET}`);
  const res = await fetch(TARGET, { method: 'POST', headers, body: sentRaw });
  const text = await res.text();
  console.log(`  status ${res.status} (expected ${expectStatus})`);
  if (text) console.log(`  body: ${text.slice(0, 300)}`);

  const pass = res.status === expectStatus;
  console.log(pass ? '  ✅ PASS' : '  ❌ FAIL');
  process.exit(pass ? 0 : 1);
}

run().catch((err) => {
  console.error('Fatal:', err.message ?? err);
  process.exit(1);
});
