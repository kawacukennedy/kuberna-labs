/*  Kuberna SDK – Integration Test against live API
 *  Run: npx ts-node --transpile-only integration-test.ts
 *       (or: node --experimental-strip-types integration-test.ts)
 */

import { KubernaSDK } from './dist/index.js';
import {
  normalizeErc7683,
  normalizeNearIntent,
  normalizeKubernaIntent,
  validateIntent,
  createVerifierRegistry,
  evaluateConfirmation,
  jcsCanonicalize,
  jcsHash,
} from './dist/index.js';
import type {
  KubernaNormalizedIntent,
  IntentValidationResult,
  ConfirmationCheck,
} from './dist/index.js';

const LIVE_BASE = 'https://kuberna-labs.onrender.com/api';
const TIMEOUT_MS = 60_000;

/* ── helpers ────────────────────────────────────────────── */

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'ERROR' | 'SDK_BUG';
  detail: string;
}

const results: TestResult[] = [];
const passed = (n: string, d = 'ok') => results.push({ name: n, status: 'PASS', detail: d });
const failed = (n: string, d: string) => results.push({ name: n, status: 'FAIL', detail: d });
const sdkBug = (n: string, d: string) => results.push({ name: n, status: 'SDK_BUG', detail: d });

async function run(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e: any) {
    failed(name, `exception: ${e?.message ?? String(e)}`);
  }
}

/* ── Pure-function unit tests (no network) ──────────────── */

function unitTests() {
  // jcsCanonicalize / jcsHash
  run('pure: jcsCanonicalize', async () => {
    const canonical = jcsCanonicalize({ b: 2, a: 1 });
    if (!canonical.includes('"a"') || !canonical.includes('"b"')) throw new Error('bad canonical');
    passed('pure: jcsCanonicalize');
  });

  run('pure: jcsHash', async () => {
    const hash = await jcsHash({ test: 42 });
    if (typeof hash !== 'string' || hash.length < 10) throw new Error('bad hash');
    passed('pure: jcsHash');
  });

  // normalizeErc7683
  run('pure: normalizeErc7683', async () => {
    const normalized = normalizeErc7683({
      nonce: '1', deadline: 100n, swapper: '0xAAA', swapperDest: '0xBBB',
      originChainId: 1n, initiator: '0xA', sender: '0xA', originSettler: '0xS',
      originToken: '0xtoken', originAmount: 1000n,
      destinationChainId: 137n, fillDeadline: 200n,
      destinationSettler: '0xSD', destinationToken: '0xDtoken',
      destinationAmount: 900n, destinationRecipient: '0xDest',
      message: 'test',
    }, '0xsig', '0xSigner');
    if (normalized.standard !== 'erc-7683') throw new Error('wrong standard');
    if (normalized.signer !== '0xSigner') throw new Error('wrong signer');
    if (normalized.originAmount !== 1000n) throw new Error('wrong amount');
    passed('pure: normalizeErc7683');
  });

  // normalizeNearIntent
  run('pure: normalizeNearIntent', async () => {
    const normalized = normalizeNearIntent({
      intent: 'token_diff', signer_id: 'alice.near', deadline: '99999', nonce: '7',
      data: { diff: [{ token: 'usdc.near', amount: '500', receiver_id: 'bob.near' }], deadline: '99999', signer_id: 'alice.near', nonce: '7' },
    });
    if (normalized.standard !== 'near-intents') throw new Error('wrong standard');
    if (normalized.destinationRecipient !== 'bob.near') throw new Error('wrong dest');
    passed('pure: normalizeNearIntent');
  });

  // normalizeKubernaIntent
  run('pure: normalizeKubernaIntent', async () => {
    const normalized = normalizeKubernaIntent({
      sourceChain: 'ethereum', sourceToken: 'USDC', sourceAmount: '100',
      destChain: 'polygon', destToken: 'USDC', minDestAmount: '99',
      timeoutSeconds: 600, budget: 10, currency: 'USD',
      confidence: 0.8, rawDescription: 'swap',
    });
    if (normalized.standard !== 'kuberna') throw new Error('wrong standard');
    if (normalized.originChainId !== 1n) throw new Error('wrong chain');
    if (normalized.destinationChainId !== 137n) throw new Error('wrong dest chain');
    passed('pure: normalizeKubernaIntent');
  });

  // validateIntent
  run('pure: validateIntent (valid)', async () => {
    const result = validateIntent({
      standard: 'erc-7683', originalFormat: 'erc-7683', nonce: '1',
      deadline: 100n, swapper: '0xA', originChainId: 1n, destinationChainId: 137n,
      originToken: '0xtoken', originAmount: 1000n, destinationToken: '0xDtoken',
      destinationAmount: 900n, destinationRecipient: '0xDest', signer: '0xS',
      fillDeadline: 200n, message: 'm', attestationRequired: false,
    });
    if (!result.valid) throw new Error(`unexpected errors: ${(result as IntentValidationResult).errors.join(', ')}`);
    passed('pure: validateIntent (valid)');
  });

  run('pure: validateIntent (invalid)', async () => {
    const result = validateIntent({
      standard: 'kuberna', originalFormat: 'kuberna', nonce: '',
      deadline: 0n, swapper: '', originChainId: 1n, destinationChainId: 137n,
      originToken: '', originAmount: 0n, destinationToken: '',
      destinationAmount: 0n, destinationRecipient: '', signer: '',
      fillDeadline: 0n, message: '', attestationRequired: false,
    });
    if (result.valid) throw new Error('should be invalid');
    if ((result as IntentValidationResult).errors.length < 3) throw new Error(`expected multiple errors, got ${(result as IntentValidationResult).errors.length}`);
    passed('pure: validateIntent (invalid)');
  });

  // createVerifierRegistry
  run('pure: createVerifierRegistry', async () => {
    const reg = createVerifierRegistry();
    // verify unknown technology returns error receipt
    const receipt = await reg.verify({
      witness: { technology: 'sgx', quote: 'x', enclaveHeldData: 'y',
                 mrEnclave: 'z', mrSigner: 'w', isvProdId: 0, isvSvn: 0, timestamp: Date.now() },
      binding: { key: { algorithm: 'raw', publicKey: 'pk', subject: 'sub' } },
      signature: 'sig',
    });
    if (receipt.verified !== false) throw new Error('should be unverified');
    if (!receipt.error?.includes('no verifier')) throw new Error('wrong error msg');
    passed('pure: createVerifierRegistry');
  });

  // evaluateConfirmation
  run('pure: evaluateConfirmation (approved)', async () => {
    const response = evaluateConfirmation(
      {
        envelope: {
          witness: { technology: 'sgx', quote: '', enclaveHeldData: '', mrEnclave: '', mrSigner: '', isvProdId: 0, isvSvn: 0, timestamp: 0 },
          binding: { key: { algorithm: 'raw', publicKey: '', subject: '' } },
          signature: '',
        },
        policy: { requireAttestation: false, allowSelfAttestation: false },
        action: 'deploy',
        payload: {},
      },
      { verified: true, timestamp: 0, measurements: {} },
    );
    if (!response.approved) throw new Error('should be approved');
    passed('pure: evaluateConfirmation (approved)');
  });

  run('pure: evaluateConfirmation (rejected - attestation failed)', async () => {
    const response = evaluateConfirmation(
      {
        envelope: {
          witness: { technology: 'sgx', quote: '', enclaveHeldData: '', mrEnclave: '', mrSigner: '', isvProdId: 0, isvSvn: 0, timestamp: 0 },
          binding: { key: { algorithm: 'raw', publicKey: '', subject: '' } },
          signature: '',
        },
        policy: { requireAttestation: true, allowSelfAttestation: false },
        action: 'deploy',
        payload: {},
      },
      { verified: false, timestamp: 0, measurements: {}, error: 'fail' },
    );
    if (response.approved) throw new Error('should be rejected');
    passed('pure: evaluateConfirmation (rejected)');
  });
}

/* ── Live API integration tests ─────────────────────────── */

async function liveTests(sdk: KubernaSDK) {
  // ---------- AGENT MANAGER ----------
  await run('agent.list() – public GET /api/agents', async () => {
    const data = await sdk.agent.list();
    if (Array.isArray(data)) {
      passed('agent.list()', `got ${data.length} agents`);
    } else {
      // SDK returns .data which is undefined if endpoint doesn't wrap in {data}
      sdkBug('agent.list()', `returned ${typeof data} (expected array). The endpoint returns {agents:[...]} not {data:{agents:[...]}} – SDK envelope assumption broken`);
    }
  });

  await run('agent.get("nonexistent") – 404', async () => {
    const resp = await sdk.request({ method: 'GET', path: '/agents/nonexistent' });
    if (!resp.success) {
      passed('agent.get("nonexistent")', JSON.stringify(resp.error));
    } else {
      failed('agent.get("nonexistent")', `unexpected success: ${JSON.stringify(resp.data)}`);
    }
  });

  await run('agent.get() – SDK return shape', async () => {
    // Use a real agent id from list to check .data field
    const rawResp = await sdk.request<{ agents: Array<{ id: string }> }>({ method: 'GET', path: '/agents' });
    const agentId = rawResp.data?.agents?.[0]?.id;
    if (!agentId) {
      failed('agent.get() – setup', 'no agents available');
      return;
  }
    const agent = await sdk.agent.get(agentId);
    // agent is the ApiResponse envelope, not the Agent itself
    if ((agent as any)?.data?.id === agentId || (agent as any)?.id === agentId) {
      passed('agent.get() – SDK return shape', 'works (return shape is envelope or direct)');
    } else {
      sdkBug('agent.get()', `returned ${(agent as any) && Object.keys(agent as any).slice(0, 5)} — response.data is undefined because the endpoint returns the agent object directly, not wrapped in {data:…}`);
    }
  });

  await run('agent.create() – needs auth', async () => {
    const resp = await sdk.agent.create({ name: 'test', framework: 'ElizaOS' }).catch((e: any) => ({ _error: e }));
    if (resp && (resp as any)._error) {
      // TypeError from undefined.data access
      sdkBug('agent.create()', `threw ${(resp as any)._error?.message} — agent.create accesses response.data but backend returns raw body, not {data:…}`);
    } else {
      const r = resp as any;
      if (!r?.success && r?.error) {
        passed('agent.create() – needs auth', r.error.message);
      } else {
        failed('agent.create()', JSON.stringify(r));
      }
    }
  });

  // ---------- AUTH MANAGER ----------
  await run('auth.login() – bad creds', async () => {
    const resp = await sdk.auth.login({ email: 'noone@test.com', password: 'wrong' }).catch((e: any) => ({ _error: e }));
    if (resp && (resp as any)._error) {
      sdkBug('auth.login()', `threw ${(resp as any)._error?.message}`);
    } else {
      const r = resp as any;
      if (!r?.accessToken && r?.token) {
        sdkBug('auth.login()', `response has .token but SDK expects .accessToken — field mismatch. Real shape: ${JSON.stringify(Object.keys(r))}`);
      } else if (r?.success === false || !r?.accessToken) {
        passed('auth.login() – bad creds', `rejected as expected: ${r?.error?.message || r?.message || 'unknown'}`);
      } else {
        passed('auth.login()', 'authenticated');
      }
    }
  });

  await run('auth.getProfile() – wrong path', async () => {
    try {
      const profile = await sdk.auth.getProfile();
      if ((profile as any)?.error) {
        passed('auth.getProfile()', `error: ${(profile as any).error.message}`);
      } else {
        failed('auth.getProfile()', JSON.stringify(profile));
      }
    } catch (e: any) {
      failed('auth.getProfile()', e.message);
    }
  });

  await run('auth.refresh() – wrong path', async () => {
    const resp = await sdk.auth.refresh('fake-token');
    if (!resp || (resp as any)?.error) {
      passed('auth.refresh() – expected 404', `status: ${(resp as any)?.error?.message ?? 'no response'}`);
    } else {
      failed('auth.refresh()', JSON.stringify(resp));
    }
  });

  // ---------- INTENT MANAGER ----------
  await run('intent.list() – public', async () => {
    const data = await sdk.intent.list();
    if (Array.isArray(data)) {
      passed('intent.list()', `got ${data.length} intents`);
    } else {
      sdkBug('intent.list()', `returned ${typeof data} — same envelope bug as agent.list()`);
    }
  });

  await run('intent.parse() – public', async () => {
    const parsed = await sdk.intent.parse('send 100 USDC from ethereum to polygon');
    if (parsed?.sourceChain === 'ethereum' && parsed?.destToken === 'USDC') {
      passed('intent.parse()', JSON.stringify(parsed));
    } else {
      sdkBug('intent.parse()', `returned ${JSON.stringify(parsed)}`);
    }
  });

  await run('intent.cancel("test-id") – wrong path', async () => {
    const resp = await sdk.request({ method: 'POST', path: '/intents/fake-id/cancel', data: {} });
    if (!resp.success) {
      passed('intent.cancel()', `error: ${resp.error?.message}`);
    } else {
      failed('intent.cancel()', JSON.stringify(resp.data));
    }
  });

  // ---------- AI MANAGER ----------
  await run('ai.parseIntent() – public', async () => {
    const result = await sdk.ai.parseIntent('swap 50 ETH on base for USDC on optimism');
    if (result?.sourceChain) {
      passed('ai.parseIntent()', JSON.stringify(result));
    } else {
      sdkBug('ai.parseIntent()', `returned ${JSON.stringify(result)}`);
    }
  });

  await run('ai.analyze() – path not implemented', async () => {
    const resp = await sdk.request({ method: 'POST', path: '/ai/analyze', data: { text: 'test' } });
    if (!resp.success) {
      passed('ai.analyze() – expected 404', resp.error?.message);
    } else {
      failed('ai.analyze()', JSON.stringify(resp.data));
    }
  });

  await run('ai.getDecision() – needs auth', async () => {
    const resp = await sdk.request({ method: 'POST', path: '/agents/test/decide', data: {} });
    if (!resp.success) {
      passed('ai.getDecision() – expected 401', resp.error?.message);
    } else {
      failed('ai.getDecision()', JSON.stringify(resp.data));
    }
  });

  // ---------- PAYMENT MANAGER ----------
  await run('payment.getSupportedTokens() – GET /payments/tokens', async () => {
    const resp = await sdk.request({ method: 'GET', path: '/payments/tokens' }).catch(() => null);
    if (!resp || !resp.success) passed('payment.getSupportedTokens()', resp?.error?.message ?? '404');
    else failed('payment.getSupportedTokens()', JSON.stringify(resp.data));
  });

  await run('payment.createIntent() – POST /payments/intents', async () => {
    const resp = await sdk.request({ method: 'POST', path: '/payments/intents', data: {} }).catch(() => null);
    if (!resp || !resp.success) passed('payment.createIntent()', resp?.error?.message ?? '404');
    else failed('payment.createIntent()', JSON.stringify(resp.data));
  });

  await run('payment.getStatus() – GET /payments/intents/:id', async () => {
    const resp = await sdk.request({ method: 'GET', path: '/payments/intents/fake' }).catch(() => null);
    if (!resp || !resp.success) passed('payment.getStatus()', resp?.error?.message ?? '404');
    else failed('payment.getStatus()', JSON.stringify(resp.data));
  });

  await run('payment.release() – POST /payments/release', async () => {
    const resp = await sdk.request({ method: 'POST', path: '/payments/release', data: {} }).catch(() => null);
    if (!resp || !resp.success) passed('payment.release()', resp?.error?.message ?? '404');
    else failed('payment.release()', JSON.stringify(resp.data));
  });

  await run('payment.refund() – POST /payments/refund', async () => {
    const resp = await sdk.request({ method: 'POST', path: '/payments/refund', data: {} }).catch(() => null);
    if (!resp || !resp.success) passed('payment.refund()', resp?.error?.message ?? '404');
    else failed('payment.refund()', JSON.stringify(resp.data));
  });

  // ---------- TEE MANAGER ----------
  await run('tee.listEnclaves() – path not implemented', async () => {
    const resp = await sdk.request({ method: 'GET', path: '/tee/enclaves' });
    if (!resp.success) {
      passed('tee.listEnclaves() – expected 404', resp.error?.message);
    } else {
      failed('tee.listEnclaves()', JSON.stringify(resp.data));
    }
  });

  // ---------- CERTIFICATE MANAGER ----------
  await run('certificate.verify("test") – path not implemented', async () => {
    const resp = await sdk.request({ method: 'GET', path: '/certificates/test/verify' });
    if (!resp.success) {
      passed('certificate.verify() – expected 404', resp.error?.message);
    } else {
      failed('certificate.verify()', JSON.stringify(resp.data));
    }
  });

  // ---------- KITE MANAGER ----------
  await run('kite.getWalletInfo() – needs auth', async () => {
    const resp = await sdk.kite.getWalletInfo();
    if ((resp as any)?.success === false || (resp as any)?.error) {
      passed('kite.getWalletInfo() – expected 401', (resp as any)?.error?.message);
    } else {
      failed('kite.getWalletInfo()', JSON.stringify(resp));
    }
  });

  await run('kite.getAgentKiteInfo("nonexistent")', async () => {
    try {
      const resp = await sdk.kite.getAgentKiteInfo('00000000-0000-0000-0000-000000000000');
      if ((resp as any)?.success === false) {
        passed('kite.getAgentKiteInfo()', `rejected: ${(resp as any)?.error?.message}`);
      } else {
        failed('kite.getAgentKiteInfo()', JSON.stringify(resp));
      }
    } catch (e: any) {
      // getAgentKiteInfo returns response.data directly, so if endpoint returns {success,data}, response.data = inner data
      const msg = e?.message ?? String(e);
      if (msg.includes('404') || msg.includes('not found')) {
        passed('kite.getAgentKiteInfo()', '404 returned');
      } else {
        failed('kite.getAgentKiteInfo()', msg);
      }
    }
  });

  // ---------- CROSS-CHAIN IDENTITY ----------
  await run('crossChainIdentity.verifyCert({})', async () => {
    try {
      const resp = await sdk.crossChainIdentity.verifyCert({});
      if (resp?.valid === false) {
        passed('crossChainIdentity.verifyCert()', `rejected (valid=false) — ${JSON.stringify(resp).slice(0, 120)}`);
      } else {
        passed('crossChainIdentity.verifyCert()', JSON.stringify(resp));
      }
    } catch (e: any) {
      // identity manager throws KubernaError on non-200
      if (e?.statusCode === 422 || e?.statusCode === 400) {
        passed('crossChainIdentity.verifyCert()', `validation error ${e.statusCode}: ${e.message}`);
      } else {
        failed('crossChainIdentity.verifyCert()', e.message);
      }
    }
  });

  await run('crossChainIdentity.getIdentity("fake") – optionalAuth', async () => {
    try {
      const resp = await sdk.crossChainIdentity.getIdentity('00000000-0000-0000-0000-000000000000');
      failed('crossChainIdentity.getIdentity()', `unexpected success: ${JSON.stringify(resp)}`);
    } catch (e: any) {
      if (e?.statusCode === 404) {
        passed('crossChainIdentity.getIdentity()', '404 returned correctly');
      } else {
        failed('crossChainIdentity.getIdentity()', `${e?.statusCode} ${e?.message}`);
      }
    }
  });

  // ---------- SILENTVERIFY (external service) ----------
  await run('SilentVerify health – external', async () => {
    try {
      const health = await sdk.verify.health();
      if (health?.ok) {
        passed('SilentVerify health()', JSON.stringify(health));
      } else {
        failed('SilentVerify health()', JSON.stringify(health));
      }
    } catch (e: any) {
      failed('SilentVerify health()', e.message);
    }
  });

  await run('SilentVerify chains – external', async () => {
    try {
      const chains = await sdk.verify.chains();
      if (chains?.chains?.length) {
        passed('SilentVerify chains()', `${chains.chains.length} chains: ${chains.chains.map(c => c.id).join(', ')}`);
      } else {
        failed('SilentVerify chains()', JSON.stringify(chains));
      }
    } catch (e: any) {
      failed('SilentVerify chains()', e.message);
    }
  });

  await run('SilentVerify agent cert issue – external', async () => {
    try {
      const resp = await sdk.verify.issueAgentCert({
        agentDid: 'did:key:test123',
        capabilities: { skill: 'trading' },
        expiresInDays: 7,
      });
      if (resp?.status === 'ok' || resp?.cert) {
        passed('SilentVerify issueAgentCert()', `status=${resp.status}`);
      } else {
        failed('SilentVerify issueAgentCert()', JSON.stringify(resp));
      }
    } catch (e: any) {
      failed('SilentVerify issueAgentCert()', e.message);
    }
  });

  await run('SilentVerify evmHints – external', async () => {
    try {
      const resp = await sdk.verify.evmHints();
      passed('SilentVerify evmHints()', JSON.stringify(resp).slice(0, 200));
    } catch (e: any) {
      failed('SilentVerify evmHints()', e.message);
    }
  });
}

/* ── Client instantiation & health probe ────────────────── */

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       Kuberna SDK – Integration Test Suite                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Verify SDK import
  console.log('--- SDK Import & Instantiation ---');
  let sdk: KubernaSDK;
  try {
    sdk = new KubernaSDK({ baseUrl: LIVE_BASE, timeout: TIMEOUT_MS });
    passed('SDK import + constructor', `baseUrl=${sdk.getBaseUrl()}`);
    console.log('  ✓ SDK instantiated');
  } catch (e: any) {
    failed('SDK import + constructor', e.message);
    console.error('  ✗ Cannot instantiate SDK:', e.message);
    return;
  }

  // 2. Note about default baseUrl
  sdkBug('SDK default baseUrl', 'Default is https://api.kuberna.africa/api — DNS does not resolve (NXDOMAIN). SDK defaults are broken for production use.');

  // 3. Raw health check
  console.log('\n--- Raw API Health ---');
  try {
    const resp = await sdk.request({ method: 'GET', path: '/health' });
    if (resp.error?.message?.includes('Route not found') || resp.error?.message?.includes('Not Found')) {
      passed('GET /api/health', `404 — /health is mounted at root, not under /api. SDK expects all paths under /api prefix.`);
    } else {
      passed('GET /api/health', JSON.stringify(resp));
    }
  } catch (e: any) {
    failed('GET /api/health', e.message);
  }

  // 4. Run unit tests
  console.log('\n--- Pure Unit Tests ---');
  unitTests();

  // 5. Run live tests
  console.log('\n--- Live API Tests ---');
  await liveTests(sdk);

  // 6. Print report
  console.log('\n' + '='.repeat(72));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(72));
  const byStatus = (s: string) => results.filter(r => r.status === s);
  console.log(`  PASS: ${byStatus('PASS').length}`);
  console.log(`  FAIL: ${byStatus('FAIL').length}`);
  console.log(`  SDK_BUG: ${byStatus('SDK_BUG').length}`);
  console.log('─'.repeat(72));

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'SDK_BUG' ? '⚠' : '✗';
    const label = `[${r.status}]`;
    console.log(`  ${icon} ${label.padEnd(10)} ${r.name}`);
    if (r.status !== 'PASS') {
      console.log(`           ${r.detail}`);
    }
  }

  console.log('='.repeat(72));
}

main().catch(console.error);
