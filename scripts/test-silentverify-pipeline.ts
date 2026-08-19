import 'dotenv/config';

const SV_BASE = process.env.SILENTVERIFY_BASE_URL || 'https://silentverify.up.railway.app';
const SV_KEY = process.env.SILENTVERIFY_API_KEY || 'sv_dev_test_key';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': SV_KEY,
};

interface TestResult {
  name: string;
  ok: boolean;
  detail: string;
  durationMs: number;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const start = Date.now();
  const resp = await fetch(`${SV_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const elapsed = Date.now() - start;
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`POST ${path} → ${resp.status} (${elapsed}ms): ${err}`);
  }
  const data = (await resp.json()) as T;
  console.log(`  ✓ ${path} (${elapsed}ms)`);
  return data;
}

async function run(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const agentDid = `did:erc8004:0x${Date.now().toString(16).padStart(40, '0')}`;
  console.log(`\nAgent DID: ${agentDid}\n`);

  // 1. Health check
  {
    const start = Date.now();
    try {
      const resp = await fetch(`${SV_BASE}/api/v1/health`, { signal: AbortSignal.timeout(10000) });
      const ok = resp.ok;
      results.push({
        name: 'health',
        ok,
        detail: `${resp.status}`,
        durationMs: Date.now() - start,
      });
      console.log(`  ✓ health → ${resp.status} (${Date.now() - start}ms)`);
    } catch (e: any) {
      results.push({
        name: 'health',
        ok: false,
        detail: e.message,
        durationMs: Date.now() - start,
      });
      console.log(`  ✗ health: ${e.message}`);
      return results;
    }
  }

  // 2. Issue agent cert (UOV)
  let agentCert: any;
  {
    const start = Date.now();
    try {
      agentCert = await post<any>('/api/v1/certs/agent/issue', {
        agent_did: agentDid,
        capabilities: { 'task-execution': true, 'cross-chain': true },
        reputation_hash: null,
        previous_cert_digest: null,
        task_context: { task_type: 'test', chain: 'evm:84532' },
        expires_in_days: 30,
        metadata: { pipeline_test: true },
      });
      results.push({
        name: 'issue-agent-cert',
        ok: true,
        detail: `fp=${agentCert.pubkeyFp}`,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: 'issue-agent-cert',
        ok: false,
        detail: e.message,
        durationMs: Date.now() - start,
      });
      console.log(`  ✗ issue-agent-cert: ${e.message}`);
      return results;
    }
  }

  // 3. Issue EVM state anchor
  let evmAnchor: any;
  {
    const start = Date.now();
    try {
      evmAnchor = await post<any>('/api/v1/chains/evm/issue', {
        rpc_url: 'https://sepolia.base.org',
        block: 'latest',
        caip2_chain_id: null,
        metadata: { agent_did: agentDid, pipeline_test: true },
        timeout: 30,
      });
      results.push({
        name: 'issue-evm-anchor',
        ok: true,
        detail: `fp=${evmAnchor.pubkeyFp}`,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: 'issue-evm-anchor',
        ok: false,
        detail: e.message,
        durationMs: Date.now() - start,
      });
      console.log(`  ✗ issue-evm-anchor: ${e.message}`);
    }
  }

  // 4. Issue cross-chain endorsement (Phase 3)
  let endorsementCert: any;
  {
    const start = Date.now();
    try {
      endorsementCert = await post<any>('/api/v1/certs/endorsement/issue', {
        subject: { did: agentDid },
        bound_keys: [
          {
            chain: 'solana',
            chain_id: 'solana:mainnet-genesis',
            address: 'So11111111111111111111111111111111111111112',
          },
          {
            chain: 'evm',
            chain_id: 'eip155:84532',
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
          },
        ],
        previous_cert_digest: null,
        expires_in_days: 90,
        metadata: { pipeline_test: true },
      });
      results.push({
        name: 'issue-endorsement',
        ok: true,
        detail: `fp=${endorsementCert.pubkeyFp}`,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: 'issue-endorsement',
        ok: false,
        detail: e.message,
        durationMs: Date.now() - start,
      });
      console.log(`  ✗ issue-endorsement: ${e.message}`);
    }
  }

  // 5. Compose passport (with cross_chain_bindings)
  let passport: any;
  {
    const start = Date.now();
    try {
      const body: Record<string, unknown> = {
        agent_cert: agentCert.cert,
        state_cert: evmAnchor?.cert ?? null,
        name: `Agent ${agentDid} Passport`,
        description: 'Kuberna Labs agent passport with cross-chain bindings',
        image: null,
      };
      if (endorsementCert) {
        body.cross_chain_bindings = [
          {
            chain: 'solana',
            chain_id: 'solana:mainnet-genesis',
            address: 'So11111111111111111111111111111111111111112',
          },
          {
            chain: 'evm',
            chain_id: 'eip155:84532',
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
          },
        ];
        body.endorsement_cert = endorsementCert.cert;
      }
      passport = await post<any>('/api/v1/certs/compose/passport', body);
      results.push({
        name: 'compose-passport',
        ok: true,
        detail: `uri=${passport.uri?.slice(0, 60)}...`,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: 'compose-passport',
        ok: false,
        detail: e.message,
        durationMs: Date.now() - start,
      });
      console.log(`  ✗ compose-passport: ${e.message}`);
    }
  }

  // 6. Verify agent cert
  {
    const start = Date.now();
    try {
      const v = await post<any>('/api/v1/certs/verify', { cert: agentCert.cert });
      results.push({
        name: 'verify-agent-cert',
        ok: v.valid,
        detail: `valid=${v.valid} fp=${v.pubkeyFp}`,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: 'verify-agent-cert',
        ok: false,
        detail: e.message,
        durationMs: Date.now() - start,
      });
      console.log(`  ✗ verify-agent-cert: ${e.message}`);
    }
  }

  // 7. Verify endorsement cert
  if (endorsementCert) {
    const start = Date.now();
    try {
      const v = await post<any>('/api/v1/certs/verify', { cert: endorsementCert.cert });
      results.push({
        name: 'verify-endorsement',
        ok: v.valid,
        detail: `valid=${v.valid} fp=${v.pubkeyFp}`,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: 'verify-endorsement',
        ok: false,
        detail: e.message,
        durationMs: Date.now() - start,
      });
      console.log(`  ✗ verify-endorsement: ${e.message}`);
    }
  }

  return results;
}

async function main() {
  console.log('=== SilentVerify Pipeline E2E Test ===');
  console.log(`Base URL: ${SV_BASE}`);
  console.log('');

  const results = await run();

  console.log('\n=== Results ===\n');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`  ${icon} ${r.name} (${r.durationMs}ms) — ${r.detail}`);
  }

  console.log(`\n  ${passed}/${results.length} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
