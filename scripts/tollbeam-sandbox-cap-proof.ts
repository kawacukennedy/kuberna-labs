/**
 * Tollbeam Sandbox Cap Proof (dashboard sandbox app → default $1.00/transaction)
 *
 * Reproduces the parity check Brent ran internally:
 *   /priced/audit at $2.50 against the default $1.00 transaction limit
 *   → 403 policy_limit_exceeded, the body names the limit and attempted amount,
 *     and no spend event is written (ledger shows only money that actually moved).
 *
 * The "priced/audit" step is reached by posting an explicit amount to
 * /v1/pay/fetch; the engine prices-and-audits the attempt before any signature,
 * so a refusal is pre-sign and costs nothing. If the engine instead settles at
 * the manifest's price, this script records the settled execution honestly and
 * the refusal assertions must FAIL.
 *
 * PREREQUISITE: TOLLBEAM_API_KEY set in .env to the dashboard-created sandbox
 * app key (default $1.00/tx limit from the Sandbox environment). BASE_URL stays
 * https://api.tollbeam.com — the sandbox rail is the same API.
 *
 * RESOURCE_URL defaults to Brent's public Base Sepolia test seller
 * /priced/audit ($2.50) endpoint. Override with TOLLBEAM_RESOURCE_URL to
 * re-run the boundary case (e.g. a base mainnet rail resource) or the other
 * priced legs (/priced/quote $0.01, /priced/report $0.25).
 */
import * as fs from 'fs';
import * as path from 'path';
import { TollbeamClient, isRefusalCode, REFUSAL_CODES } from '@tollbeam/sdk';

const env = fs.readFileSync('.env', 'utf8');
const API_KEY = (env.match(/^TOLLBEAM_API_KEY=(.*)$/m) ?? [])[1] ?? '';
const BASE_URL = 'https://api.tollbeam.com';
const RESOURCE_URL =
  process.env.TOLLBEAM_RESOURCE_URL ?? 'https://seller.tollbeam.com/priced/audit';
const ATTEMPT_MINOR = 250; // $2.50 — above the default $1.00 transaction cap

interface AttemptInfo {
  status: number | null;
  refused: boolean;
  code: string | null;
  message: string | null;
  executionId: string | null;
  settlement: Record<string, unknown> | null;
  body: unknown;
  elapsedMs: number;
}

async function apiReq(path: string, method: string, body?: Record<string, unknown>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);
  try {
    const res = await fetch(BASE_URL + path, {
      method,
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json: any = { message: text.slice(0, 300) };
    try {
      json = JSON.parse(text);
    } catch {
      /* keep text fallback */
    }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

async function readTxLimit(client: TollbeamClient) {
  const b = await client.getBudget();
  const txRaw = b.limits.find((l: any) => l.scope_type === 'global' && l.period === 'transaction');
  const tx = txRaw
    ? {
        scope_type: txRaw.scope_type,
        period: txRaw.period,
        spent_minor: Number(txRaw.spent_minor),
        limit_minor: Number(txRaw.limit_minor),
        remaining_minor: Number(txRaw.remaining_minor),
      }
    : undefined;
  return { budget: b, tx };
}

async function attemptOverride(): Promise<AttemptInfo> {
  const t0 = Date.now();
  try {
    const { status, json } = await apiReq('/v1/pay/fetch', 'POST', {
      url: RESOURCE_URL,
      amount_minor: ATTEMPT_MINOR,
      agentId: 'sandbox-cap-proof',
    });
    const elapsedMs = Date.now() - t0;
    const code = typeof json?.error === 'string' ? json.error : null;
    const refused = isRefusalCode(code ?? undefined);
    return {
      status,
      refused,
      code,
      message: typeof json?.message === 'string' ? json.message : null,
      executionId: typeof json?.executionId === 'string' ? json.executionId : null,
      settlement:
        json?.paid === true
          ? typeof json?.settlement === 'object'
            ? json?.settlement
            : null
          : null,
      body: json,
      elapsedMs,
    };
  } catch (err: any) {
    return {
      status: null,
      refused: false,
      code: err?.name ?? 'unknown',
      message: err?.message ?? String(err),
      executionId: null,
      settlement: null,
      body: null,
      elapsedMs: Date.now() - t0,
    };
  }
}

async function main() {
  if (!API_KEY) {
    console.error('TOLLBEAM_API_KEY not found in .env (dashboard sandbox app key)');
    process.exit(1);
  }

  const client = new TollbeamClient({ apiKey: API_KEY, baseUrl: BASE_URL });

  console.log('='.repeat(64));
  console.log('Tollbeam Sandbox Cap Proof');
  console.log('='.repeat(64));
  console.log(`base_url:   ${BASE_URL}`);
  console.log(`resource:   ${RESOURCE_URL}`);
  console.log(`attempt:    $${(ATTEMPT_MINOR / 100).toFixed(2)} (above default limit)`);
  console.log('='.repeat(64));

  const { budget, tx } = await readTxLimit(client);
  console.log('--- Baseline budget ---');
  console.log(`  governed:  ${budget.governed}`);
  console.log(`  policy:    ${budget.policy?.name ?? 'null'} (${budget.policy?.id ?? 'n/a'})`);
  for (const l of budget.limits as any[]) {
    console.log(
      `  ${l.scope_type}/${l.period}: spent=${l.spent_minor} limit=${l.limit_minor} remaining=${l.remaining_minor}`
    );
  }

  const checks: string[] = [];
  if (budget.governed === true) {
    checks.push('PASS budget is governed (policy active, not withdrawal-path)');
  } else {
    checks.push(`FAIL governed=${budget.governed} — no policy enforced`);
  }
  if (!tx) {
    checks.push('FAIL no global/transaction limit on this policy');
  } else if (tx.limit_minor > 0) {
    checks.push(`PASS transaction limit present at $${(tx.limit_minor / 100).toFixed(2)}`);
  } else {
    checks.push('FAIL transaction limit is $0.00 — try after reset to default $1.00');
  }

  console.log('\n--- Triggering refusal attempt ($2.50 vs default limit) ---');
  const attempt = await attemptOverride();

  console.log(`HTTP ${attempt.status ?? 'ERR'} in ${attempt.elapsedMs}ms`);
  console.log(`  refused:  ${attempt.refused}  code: ${attempt.code}`);
  if (attempt.message) console.log(`  message:  ${attempt.message}`);
  if (attempt.executionId) console.log(`  executionId: ${attempt.executionId}`);
  if (attempt.settlement) {
    console.log(`  ⚠️  SETTLED — execution recorded, so the engine honored a real spend:`);
    console.log(`      ${JSON.stringify(attempt.settlement).slice(0, 300)}`);
  } else {
    console.log('  (no settlement object — nothing signed, nothing moved)');
  }

  if (attempt.refused && attempt.code === 'policy_limit_exceeded') {
    checks.push('PASS refused with policy_limit_exceeded (pre-sign, code from the engine)');
  } else if (attempt.refused) {
    checks.push(`FAIL refused with ${attempt.code}, expected policy_limit_exceeded`);
  } else if (attempt.settlement) {
    checks.push('FAIL attempt SETTLED — expected a refusal against the $1.00 limit');
  } else {
    checks.push(
      `FAIL unexpected result: ${attempt.code ?? 'no code'} (${attempt.message ?? 'no message'})`
    );
  }

  const refusedMsg = (attempt.message ?? '').toLowerCase();
  const breach = (attempt.body as any)?.breach as Record<string, unknown> | undefined;
  const namesLimit =
    /transaction|limit|refused|exceeded|cap/.test(refusedMsg) ||
    (!!breach && Object.keys(breach).length > 0);
  const namesAttempt =
    /2\.50|250|\$2\.50/.test(refusedMsg) || Number(breach?.attempted_minor) === ATTEMPT_MINOR;
  if (attempt.refused && attempt.code === 'policy_limit_exceeded' && namesLimit) {
    checks.push(`PASS refusal names the limit${breach ? ` (${JSON.stringify(breach)})` : ''}`);
  } else {
    checks.push(`INFO refusal body: ${JSON.stringify(attempt.body as any).slice(0, 300)}`);
  }

  console.log('\n--- Post-attempt verification (no spend event written) ---');
  const after = await readTxLimit(client);
  const txAfter = after.tx;
  console.log(`  transaction spent_minor after: ${txAfter?.spent_minor ?? 'n/a'} (expect 0)`);

  const executions = await client.listPayments({ limit: 10 });
  const settled = executions.filter((e: any) => e.status === 'settled' || e.paid === true);
  const filedAfter = (executions ?? []).filter((e: any) =>
    (e.started_at ?? '').startsWith(new Date().toISOString().slice(0, 10))
  );
  console.log(`  executions today: ${filedAfter.length}; settled: ${settled.length}`);
  const spendWritten = attemptsWriteSpend(settled, txAfter?.spent_minor);
  if (spendWritten) {
    checks.push('FAIL a spend event was written (settled execution / spent>0)');
  } else {
    checks.push('PASS no spend event written — ledger shows only money that actually moved');
  }

  const refusalWinner =
    attempt.refused && attempt.code === 'policy_limit_exceeded' && namesLimit && namesAttempt;
  const verdict = refusalWinner && !spendWritten ? 'PASS' : 'FAIL';

  console.log('\nChecks:');
  for (const c of checks) console.log(`  ${c}`);
  console.log(`\nVERDICT: ${verdict}`);

  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `tollbeam-sandbox-cap-${Date.now()}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        resource: RESOURCE_URL,
        attemptMinor: ATTEMPT_MINOR,
        baseline: {
          governed: budget.governed,
          policy: budget.policy,
          txLimit: tx
            ? {
                spent_minor: tx.spent_minor,
                limit_minor: tx.limit_minor,
                remaining_minor: tx.remaining_minor,
              }
            : null,
        },
        attempt,
        postState: {
          tx: txAfter
            ? {
                spent_minor: txAfter.spent_minor,
                limit_minor: txAfter.limit_minor,
                remaining_minor: txAfter.remaining_minor,
              }
            : null,
          executionsToday: filedAfter.length,
        },
        checks,
        verdict,
      },
      null,
      2
    )
  );
  console.log(`report: ${file}`);

  process.exit(verdict === 'PASS' ? 0 : 2);
}

function attemptsWriteSpend(settled: any[], spentAfter: number | undefined): boolean {
  if (Array.isArray(settled) && settled.length > 0) return true;
  return typeof spentAfter === 'number' && spentAfter > 0;
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
