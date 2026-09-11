/**
 * CryptoPulse Webhook Subscription Manager
 *
 * Registers our orchestration receiver as a whale_move webhook consumer on
 * CryptoPulse, lists existing subscriptions, or deletes one.
 *
 * Env:
 *   CRYPTOPULSE_API_KEY         API key from the CryptoPulse dashboard
 *                               (available once the 30-day Trader trial is active)
 *   CRYPTOPULSE_RECEIVER_URL    our deployed receiver, e.g.
 *                               https://<backend>/hooks/cryptopulse
 *
 * Usage:
 *   npx tsx scripts/cryptopulse-register-webhook.ts [--list]
 *   npx tsx scripts/cryptopulse-register-webhook.ts [--delete <subscriptionId>]
 *
 * After registering, the webhook signing secret may appear in the response
 * (or be fixed per account — see docs). Copy it into backend/.env as
 * CRYPTOPULSE_WEBHOOK_SECRET AND into this repo's .env so the smoke tester
 * can sign with it.
 */
import 'dotenv/config';

const BASE = process.env.CRYPTOPULSE_BASE_URL ?? 'https://cryptopulse.uno';
const API_KEY = process.env.CRYPTOPULSE_API_KEY ?? '';
const RECEIVER_URL = process.env.CRYPTOPULSE_RECEIVER_URL ?? '';

const args = process.argv.slice(2);
const list = args.includes('--list');
const delIdx = args.indexOf('--delete');
const deleteId = delIdx !== -1 ? args[delIdx + 1] : undefined;

async function api<T>(method: string, pathname: string, body?: unknown): Promise<T> {
  if (!API_KEY) throw new Error('CRYPTOPULSE_API_KEY not set (dashboard key, post-trial)');
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`non-JSON response (HTTP ${res.status}): ${raw.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${method} ${pathname}: ${JSON.stringify(data).slice(0, 400)}`);
  return data as T;
}

async function main(): Promise<void> {
  if (list) {
    const subs = await api<any>('GET', '/api/webhooks/subscriptions');
    console.log('subscriptions:', JSON.stringify(subs, null, 2));
    return;
  }

  if (deleteId) {
    const res = await api<any>('DELETE', `/api/webhooks/subscriptions/${deleteId}`);
    console.log('deleted:', JSON.stringify(res));
    return;
  }

  if (!RECEIVER_URL) {
    throw new Error('CRYPTOPULSE_RECEIVER_URL not set (e.g. https://<backend>/hooks/cryptopulse)');
  }

  console.log(`registering whale_move webhook -> ${RECEIVER_URL}`);
  const created = await api<any>('POST', '/api/webhooks/subscriptions', {
    url: RECEIVER_URL,
    events: ['whale_move'],
  });
  console.log('response:', JSON.stringify(created, null, 2));
  const maybeSecret =
    created?.secret ?? created?.signing_secret ?? created?.webhook_secret ?? created?.data?.secret;
  if (maybeSecret) {
    console.log('\nSigning secret found in response — set it in backend/.env as');
    console.log('CRYPTOPULSE_WEBHOOK_SECRET=<secret> and in this repo\u2019s .env for the smoke tester.');
  } else {
    console.log('\nNo signing secret in the registration response — see docs for where it lives.');
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message ?? err);
  process.exit(1);
});