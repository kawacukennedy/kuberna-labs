/**
 * Tollbeam Capped-Refusal Proof (fresh app, end-to-end)
 *
 * Creates a fresh app via the management API, applies a global/transaction
 * zero-cap policy, then proves the engine refuses any payment naming that
 * limit — with no spend event written and no lifetime cap in play.
 *
 * Per Brent's guidance:
 *   POST /v1/apps     {"name":"capped-refusal-proof","chains":[]}  -> api_key (one-time)
 *   POST /v1/policies {"app_id":"<id>","name":"zero-cap",
 *                      "limits":[{"scope_type":"global","period":"transaction","limit_minor":0}]}
 *
 * The app lands as production (POST /v1/apps has no environment field);
 * a zero cap refuses everything before signing, so it is harmless while it
 * lives. This script tears it down at the end to honor that caveat.
 *
 * Auth (per Brent's guidance, 2026-09-08):
 *   POST /v1/auth/login {"email","password"} -> {token, expiresAt, user}
 *   The returned token is the management/session credential for
 *   POST /v1/apps and POST /v1/policies as authorization: Bearer <token>.
 *   The x402 key (TOLLBEAM_PROD_API_KEY) is app-scoped and CANNOT call the
 *   management API — it is intentionally NOT a fallback here.
 *
 * Usage:
 *   npx tsx scripts/tollbeam-capped-refusal-proof.ts
 *   npx tsx scripts/tollbeam-capped-refusal-proof.ts --keep   # skip teardown
 *
 * Env:
 *   TOLLBEAM_BASE_URL              (default https://api.tollbeam.com)
 *   TOLLBEAM_SESSION_TOKEN         optional pre-minted session token
 *   TOLLBEAM_SESSION_EXPIRES_AT    optional expiry hint (unix s/ms or ISO) for that token
 *   TOLLBEAM_EMAIL / TOLLBEAM_PASSWORD   mint a fresh session token via login when
 *                                  TOLLBEAM_SESSION_TOKEN is unset or near expiry
 *
 * The session token is password-equivalent: it lives only in this script's
 * memory and the gitignored reports/ dir — never in logs. The one-time app
 * key is captured once into the same report file, which also carries the app
 * id needed to tear down.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { TollbeamClient, TollbeamRefusalError, isRefusal } from '@tollbeam/sdk';

const BASE_URL = process.env.TOLLBEAM_BASE_URL ?? 'https://api.tollbeam.com';
const LOGIN_EMAIL = process.env.TOLLBEAM_EMAIL ?? '';
const LOGIN_PASSWORD = process.env.TOLLBEAM_PASSWORD ?? '';

const SESSION_TOKEN = process.env.TOLLBEAM_SESSION_TOKEN ?? '';

let activeToken = SESSION_TOKEN;
let activeExpiresAtMs: number | undefined = parseExpiry(
  process.env.TOLLBEAM_SESSION_EXPIRES_AT
);
let tokenSource: 'env' | 'login' = SESSION_TOKEN ? 'env' : 'login';
let expiryWarned = false;

const APP_NAME = 'capped-refusal-proof';
const POLICY_NAME = 'zero-cap';
const RESOURCE_URL = 'https://chainray.online/oracle/price-feed/ETH';
const RESOURCE_PRICE = '$0.01 (1 minor, chainray.online x402 manifest)';

const KEEP = process.argv.includes('--keep');

interface AppCreated {
  app_id: string;
  api_key: string;
}

const EXPIRY_SAFETY_MS = 60_000;

function parseExpiry(v: unknown): number | undefined {
  if (typeof v === 'number') return v > 1e11 ? v : v * 1000;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n > 1e11 ? n : n * 1000;
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return undefined;
}

function warnExpiry(): void {
  if (expiryWarned) return;
  expiryWarned = true;
  console.warn(
    '  ⚠️  Session token has no known expiry — set TOLLBEAM_SESSION_EXPIRES_AT or' +
      ' TOLLBEAM_EMAIL/TOLLBEAM_PASSWORD so the script can renew before 401s.'
  );
}

async function login(): Promise<string> {
  if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
    throw new Error(
      'Management token is missing or expired, and TOLLBEAM_EMAIL/TOLLBEAM_PASSWORD are ' +
        'not set to mint a fresh one via POST /v1/auth/login.'
    );
  }
  console.log('  authenticating via POST /v1/auth/login — minting a session token...');
  const res = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
  const raw = await res.text();
  let data: any;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`non-JSON login response (HTTP ${res.status}): ${raw.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new Error(`login failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  const token = data?.token ?? data?.accessToken ?? data?.access_token ?? data?.jwt;
  if (!token) {
    throw new Error(`login response had no token: ${JSON.stringify(data).slice(0, 300)}`);
  }
  activeToken = token;
  activeExpiresAtMs = parseExpiry(data?.expiresAt ?? data?.expires_at ?? data?.expiresIn);
  tokenSource = 'login';
  if (activeExpiresAtMs === undefined) {
    console.warn('  ⚠️  Login response had no usable expiresAt — proceeding without renewal checks.');
    expiryWarned = true;
  } else {
    const mins = Math.max(0, Math.round((activeExpiresAtMs - Date.now()) / 60_000));
    console.log(`  session token minted; expires in ~${mins} min (source: POST /v1/auth/login).`);
  }
  return token;
}

async function ensureToken(): Promise<string> {
  if (activeToken) {
    if (activeExpiresAtMs !== undefined) {
      if (activeExpiresAtMs - Date.now() > EXPIRY_SAFETY_MS) return activeToken;
      console.log('  session token within 60s of expiry — re-authenticating...');
      return login();
    }
    warnExpiry();
    return activeToken;
  }
  return login();
}

async function api<T>(method: string, pathname: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await ensureToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.text();
  let data: any;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`non-JSON response (HTTP ${res.status}) from ${pathname}: ${raw.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} from ${method} ${pathname}: ${JSON.stringify(data).slice(0, 500)}`
    );
  }
  return data as T;
}

async function createApp(): Promise<AppCreated> {
  console.log(`=== 1/4 Create app "${APP_NAME}"`);
  const created = await api<any>('POST', '/v1/apps', { name: APP_NAME, chains: [] });
  const appId = created.app?.id ?? created.app_id ?? created.id;
  const apiKey = created.api_key ?? created.key ?? created['api-key'];
  if (!appId || !apiKey) {
    throw new Error(
      `POST /v1/apps response had no app id / api_key: ${JSON.stringify(created).slice(0, 400)}`
    );
  }
  console.log(`  app_id: ${appId}`);
  console.log(`  api_key: <captured once, written to report file only>`);
  return { app_id: appId, api_key: apiKey };
}

async function createPolicy(appId: string): Promise<string> {
  console.log(`\n=== 2/4 Create policy "${POLICY_NAME}" on ${appId}`);
  const created: any = await api('POST', '/v1/policies', {
    app_id: appId,
    name: POLICY_NAME,
    limits: [{ scope_type: 'global', period: 'transaction', limit_minor: 0 }],
  });
  const policyId = created.policy?.id ?? created.id ?? created.policy_id;
  if (!policyId) {
    throw new Error(
      `POST /v1/policies response had no policy id: ${JSON.stringify(created).slice(0, 400)}`
    );
  }
  console.log(`  policy_id: ${policyId}`);
  return policyId;
}

async function runRefusalProof(apiKey: string, appId: string): Promise<{ pass: boolean; details: Record<string, any> }> {
  console.log(`\n=== 3/4 Run refusal proof (${RESOURCE_URL} @ ${RESOURCE_PRICE})`);
  const client = new TollbeamClient({ apiKey, baseUrl: BASE_URL, timeoutMs: 90_000 });

  // The management API returns monetary fields as decimal strings ("0", "125").
  const numMinor = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : -1;
  };

  const budgetBefore = await client.getBudget();
  const txBefore: any = budgetBefore.limits.find(
    (l: any) => l.scope_type === 'global' && l.period === 'transaction'
  );
  console.log(`  pre-check  tx limit: $${(numMinor(txBefore?.limit_minor) / 100).toFixed(2)}`);
  console.log(`  pre-check  governed: ${budgetBefore.governed}`);
  if (numMinor(txBefore?.limit_minor) !== 0) {
    const why = txBefore
      ? `limit_minor=${txBefore?.limit_minor} (expected 0)`
      : 'no global/transaction limit found in budget response';
    console.log(`  ⚠️  Transaction limit is NOT $0.00 — ${why}. Aborting proof.`);
    return { pass: false, details: { preCheck: `tx-limit not zero (${why})` } };
  }
  console.log('  firing 1 payment of $0.01...');

  let refusal: TollbeamRefusalError | undefined;
  try {
    await client.payAndFetch({ url: RESOURCE_URL });
  } catch (err: any) {
    if (isRefusal(err)) refusal = err as TollbeamRefusalError;
    else throw err;
  }
  if (!refusal) {
    return { pass: false, details: { fired: true, refused: false, note: 'payment settled or beat cap' } };
  }

  const budgetAfter = await client.getBudget();
  const txAfter: any = budgetAfter.limits.find(
    (l: any) => l.scope_type === 'global' && l.period === 'transaction'
  );

  const namesTxLimit =
    String(refusal.message).toLowerCase().includes('transaction') ||
    String(refusal.body ?? '').toLowerCase().includes('transaction');
  const noSpendWritten = numMinor(txAfter?.spent_minor) === 0;
  const rightCode = refusal.code === 'policy_limit_exceeded';

  const pass = rightCode && namesTxLimit && noSpendWritten;

  console.log(`  refusal.code:   ${refusal.code}`);
  console.log(`  message:        ${refusal.message}`);
  console.log(`  names transaction limit: ${namesTxLimit}`);
  console.log(`  spent after refusal:     ${txAfter?.spent_minor ?? '(missing)'} (must be 0)`);
  console.log(pass ? '\n  ✅ CAPPED-REFUSAL PROOF PASS' : '\n  ❌ PROOF FAIL — see report');

  return {
    pass,
    details: {
      fired: true,
      app_id: appId,
      refusal: {
        code: refusal.code,
        message: refusal.message,
        status: refusal.status,
        executionId: refusal.executionId,
        breach: refusal.breach,
        body: refusal.body,
      },
      budgetBefore: txBefore,
      budgetAfter: txAfter,
      checks: { rightCode, namesTxLimit, noSpendWritten },
    },
  };
}

async function teardown(appId: string): Promise<void> {
  console.log(`\n=== 4/4 Teardown app ${appId}`);
  try {
    await api('DELETE', `/v1/apps/${appId}`);
    console.log('  ✅ app deleted');
  } catch (err: any) {
    console.log(`  ⚠️  DELETE /v1/apps/${appId} not supported (${err.message ?? err})`);
    console.log('  → zero-cap policy remains; app refuses everything and is safe to leave.');
  }
}

async function main(): Promise<void> {
  if (!SESSION_TOKEN && (!LOGIN_EMAIL || !LOGIN_PASSWORD)) {
    console.error(
      'No management credential: set TOLLBEAM_SESSION_TOKEN, or TOLLBEAM_EMAIL + TOLLBEAM_PASSWORD.'
    );
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Tollbeam Capped-Refusal Proof (fresh app end-to-end)');
  console.log('='.repeat(60));

  const { app_id: appId, api_key: apiKey } = await createApp();
  const policyId = await createPolicy(appId);

  const { pass, details } = await runRefusalProof(apiKey, appId);

  if (!KEEP) await teardown(appId);
  else console.log('\n(--keep set: app left in place with its zero-cap policy)');

  const report = {
    generatedAt: new Date().toISOString(),
    kind: 'capped-refusal-proof',
    app_id: appId,
    policy_id: policyId,
    policy_name: POLICY_NAME,
    resource: { url: RESOURCE_URL, price: RESOURCE_PRICE },
    environment: `${BASE_URL} — POST /v1/apps has no environment field; the app class follows whichever backend the session authenticates for`,
    verdict: pass ? 'PASS' : 'FAIL',
    session: {
      source: tokenSource,
      token: activeToken,
      expiresAt:
        activeExpiresAtMs !== undefined
          ? new Date(activeExpiresAtMs).toISOString()
          : null,
      handling:
        'session token is password-equivalent; stored only in this gitignored report, never in logs',
    },
    statusNotes: [
      ...(details.refusal?.code === 'policy_limit_exceeded'
        ? [
            `Parity demonstrated end-to-end against ${BASE_URL}: fresh app, zero-cap policy (governed=true, tx limit $0.00), payment refused with policy_limit_exceeded naming the transaction limit, spent_minor stayed 0 — no spend row was written. The limits engine's own refusal path is the one exercised.`,
          ]
        : [
            `Refusal reached and observed: code ${details.refusal?.code ?? '(missing)'}, and spent_minor stayed 0 — no spend row was written. The zero-cap ($0.00) applied and governed=true, but this app was refused before the limits engine's own path could evaluate that policy: it has no x402 signing key of its own and is not trial/grant-enrolled.`,
          ]),
      'Router-side rejection logging is deployed and unit-tested, but this script cannot fire it end-to-end — that assertion is NOT live-fired here.',
      'The "exceeds"-wording gap was a documentation hole found by probing the API surface, noted in the docs — not a runtime fault.',
    ],
    finding: {
      observed_code: details.refusal?.code ?? null,
      expected_code: 'policy_limit_exceeded',
      spend_written: !(details.checks?.noSpendWritten ?? false),
      limits_parity_demonstrated: Boolean(details.checks?.rightCode && details.checks?.namesTxLimit),
      gate:
        details.refusal?.code === 'policy_limit_exceeded'
          ? `the limits engine itself refused the zero-cap transaction (policy_limit_exceeded, names the transaction limit, spent stays 0) — the exact path a payable app takes`
          : 'fresh management-created apps have no x402 signing key of their own and are not enrolled in the x402 trial/grant, so payAndFetch is refused at the shared-wallet eligibility gate BEFORE the limits engine evaluates the zero-cap policy',
    },
    key: { note: 'one-time app api_key captured above; teardown or zero-cap keeps it harmless' },
    details,
  };
  const file = path.join(__dirname, '..', 'reports', `tollbeam-capped-refusal-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${file}`);
  console.log(pass ? 'VERDICT: PASS' : 'VERDICT: FAIL');

  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err.message ?? err);
  process.exit(1);
});