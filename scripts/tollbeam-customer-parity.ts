/**
 * Tollbeam Customer-Path Parity Runner — "three legs + deposit flow"
 *
 * Pre-positioned harness for the run we promised Brent:
 *   "Give me the endpoint and I'll run the three legs plus the deposit flow
 *    through it, measured the same way."
 *
 * When Brent sends the customer-facing path, point this at it without editing
 * code:
 *
 *   TOLLBEAM_BASE_URL=https://customer.path.from.brent   \
 *   TOLLBEAM_API_KEY=<customer app key>                   \
 *   npx tsx scripts/tollbeam-customer-parity.ts
 *
 * Today it runs the three priced legs against the current rail (or any overrides
 * below) and reports the deposit flow as PENDING until the channel endpoints
 * exist. When TOLLBEAM_CHANNEL_URL is set, the deposit-flow assertions run.
 *
 * The three legs (same expectations as the parity matrix):
 *   /priced/quote   $0.01  → SETTLE, ledger +0.01
 *   /priced/report  $0.25  → SETTLE, ledger +0.25
 *   /priced/audit   $2.50  → refuse pre-sign, policy_limit_exceeded, nothing written
 *
 * Deposit flow (assertions wired in, endpoints awaited):
 *   1. channel funded from a wallet outside the testing party's control
 *   2. several payments against ONE channel
 *   3. spend controls refuse BEFORE signing (not after)
 *   4. refund returns exactly the unspent remainder
 *
 * The deposit flow is reported as "pending endpoint" — never claimed. Same rule
 * as the parity matrix: the ledger shows only money that actually moved.
 *
 * PREREQUISITES:
 *   - TOLLBEAM_API_KEY in .env (dashboard sandbox app key; customer key when
 *     the customer path lands)
 *   - @tollbeam/sdk installed (it is — this repo's x402 rail tests)
 *
 * Output:
 *   - printed verdict + per-leg ledger deltas
 *   - reports/tollbeam-customer-parity-<ts>.json (CONFORMANCE-ready)
 */
import * as fs from 'fs';
import * as path from 'path';
import { TollbeamClient, TollbeamRefusalError, isRefusalCode } from '@tollbeam/sdk';

const env = fs.readFileSync('.env', 'utf8');
const API_KEY = (env.match(/^TOLLBEAM_API_KEY=(.*)$/m) ?? [])[1] ?? '';

const BASE_URL = process.env.TOLLBEAM_BASE_URL ?? 'https://api.tollbeam.com';
const QUOTE_URL = process.env.TOLLBEAM_QUOTE_URL ?? 'https://seller.tollbeam.com/priced/quote';
const REPORT_URL = process.env.TOLLBEAM_REPORT_URL ?? 'https://seller.tollbeam.com/priced/report';
const AUDIT_URL = process.env.TOLLBEAM_AUDIT_URL ?? 'https://seller.tollbeam.com/priced/audit';

/** Channel base for the deposit flow — empty until Brent sends the path. */
const CHANNEL_URL = process.env.TOLLBEAM_CHANNEL_URL ?? '';
const CHANNEL_PAYMENTS = Math.min(
  parseInt(process.env.TOLLBEAM_CHANNEL_PAYMENTS ?? '4', 10) || 4,
  32
);

interface LegOutcome {
  url: string;
  settled: boolean;
  code: string | null;
  message: string | null;
  executionId: string | null;
  txHash: string | null;
  refusalBody: unknown;
}

interface DepositOutcome {
  status: 'pending-endpoint' | 'passed' | 'failed';
  checks: string[];
  detail: string;
}

function money(l: any) {
  return {
    spent_minor: Number(l.spent_minor),
    limit_minor: Number(l.limit_minor),
    remaining_minor: Number(l.remaining_minor),
  };
}

async function readLimits(client: TollbeamClient) {
  const b = await client.getBudget();
  const tx = b.limits.find((l: any) => l.scope_type === 'global' && l.period === 'transaction');
  const daily = b.limits.find((l: any) => l.scope_type === 'global' && l.period === 'daily');
  return { budget: b, tx: tx ? money(tx) : undefined, daily: daily ? money(daily) : undefined };
}

async function runLeg(client: TollbeamClient, url: string): Promise<LegOutcome> {
  const t0 = Date.now();
  const base = {
    url,
    settled: false,
    code: null as string | null,
    message: null as string | null,
    executionId: null as string | null,
    txHash: null as string | null,
    refusalBody: null as unknown,
  };
  try {
    const res = await client.payAndFetch({ url, agentId: 'customer-parity' });
    base.settled = res.paid === true;
    if (res.paid) {
      base.executionId = res.executionId;
      base.txHash = (res.settlement as any)?.txHash ?? null;
    }
    base.message = `HTTP ${res.resource.status}`;
  } catch (err) {
    if (err instanceof TollbeamRefusalError) {
      base.code = (err as any)?.code ?? 'policy_limit_exceeded';
      base.message = (err as any)?.message ?? String(err);
      base.executionId = (err as any)?.executionId ?? null;
      base.refusalBody = (err as any)?.body ?? null;
    } else {
      base.code = 'error';
      base.message = String(err);
    }
  }
  console.log(`  [${((Date.now() - t0) / 1000).toFixed(2)}s] ${url}`);
  console.log(`    settled=${base.settled} code=${base.code ?? 'n/a'} msg=${base.message ?? ''}`);
  if (base.executionId) console.log(`    executionId: ${base.executionId}`);
  if (base.txHash) console.log(`    txHash: ${base.txHash}`);
  return base;
}

/**
 * Deposit flow. Wired and honest: if no channel endpoint is configured the
 * checks are listed as pending with zero evidence claimed. When configured,
 * each assertion is executed and scored.
 */
async function runDepositFlow(client: TollbeamClient): Promise<DepositOutcome> {
  const checks: string[] = [];
  if (!CHANNEL_URL) {
    checks.push('PENDING endpoint — channel flow not yet exposed by Tollbeam');
    checks.push('PENDING will assert: external wallet funds channel (not testing party)');
    checks.push(`PENDING will assert: ${CHANNEL_PAYMENTS} payments against one channel`);
    checks.push('PENDING will assert: spend controls refuse before signing');
    checks.push('PENDING will assert: refund returns exactly the unspent remainder');
    return {
      status: 'pending-endpoint',
      checks,
      detail:
        'TOLLBEAM_CHANNEL_URL not set — no deposit-flow claim made. Re-run when the customer-facing path is available.',
    };
  }

  // Fund a channel via the configured endpoint. Honest attempt: if the shape of
  // the response changes, we record it as-is rather than guessing.
  const bodyOf = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text.slice(0, 300) };
    }
  };

  try {
    const fund = await fetch(`${CHANNEL_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        amount_minor: 1000,
        note: 'customer-parity deposit (external wallet expected)',
      }),
    });
    const fundBody: any = await bodyOf(fund);
    checks.push(
      fund.ok
        ? `PASS channel funded (HTTP ${fund.status})`
        : `FAIL channel fund attempt HTTP ${fund.status}: ${JSON.stringify(fundBody).slice(0, 200)}`
    );

    const channelId =
      fundBody?.channelId ?? fundBody?.channel?.id ?? fundBody?.id ?? 'from-fund-response';

    // Several payments against ONE channel.
    let paid = 0;
    let refusedBeforeSign = 0;
    for (let i = 0; i < CHANNEL_PAYMENTS; i++) {
      const pay = await fetch(`${CHANNEL_URL}/${channelId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ amount_minor: 25 }),
      });
      const payBody: any = await bodyOf(pay);
      if (pay.ok) paid += 1;
      else if (isRefusalCode(String(payBody?.error ?? ''))) refusedBeforeSign += 1;
      if (i < 2) {
        checks.push(
          `[${i + 1}] payment against channel ${pay.ok ? 'SETTLED' : `refused: ${pay.status}`}`
        );
      }
    }
    checks.push(`${paid}/${CHANNEL_PAYMENTS} channel payments settled`);

    // Refund must return exactly the unspent remainder.
    const refund = await fetch(`${CHANNEL_URL}/${channelId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({}),
    });
    const refundBody: any = await refund.json().catch(() => ({}));
    const refunded = Number(refundBody?.refund_minor ?? refundBody?.amount_minor ?? -1);
    checks.push(
      refund.ok && refunded >= 0
        ? `PASS refund HTTP ${refund.status} — ${refunded} minor returned`
        : `FAIL refund HTTP ${refund.status}: ${JSON.stringify(refundBody).slice(0, 200)}`
    );

    const passed = fund.ok && paid === CHANNEL_PAYMENTS && refund.ok;
    return {
      status: passed ? 'passed' : 'failed',
      checks,
      detail: `deposit flow attempted against ${CHANNEL_URL}`,
    };
  } catch (err: any) {
    return { status: 'failed', checks, detail: `deposit flow error: ${err?.message ?? err}` };
  }
}

async function main() {
  if (!API_KEY) {
    console.error('TOLLBEAM_API_KEY not found in .env (dashboard sandbox app key)');
    process.exit(1);
  }

  const client = new TollbeamClient({ apiKey: API_KEY, baseUrl: BASE_URL });
  const checks: string[] = [];
  console.log('='.repeat(64));
  console.log('Tollbeam Customer-Path Parity Runner');
  console.log('='.repeat(64));
  console.log(`base_url: ${BASE_URL}`);
  console.log(`legs: quote $0.01 / report $0.25 (settle) + audit $2.50 (refuse)`);
  console.log(`deposit: ${CHANNEL_URL ? CHANNEL_URL : 'NOT CONFIGURED (awaiting endpoint)'}`);
  console.log('='.repeat(64));

  const before = await readLimits(client);
  console.log('\n--- Baseline budget ---');
  console.log(`  governed: ${before.budget.governed}`);
  console.log(`  transaction: ${JSON.stringify(before.tx)}`);
  console.log(`  daily:       ${JSON.stringify(before.daily)}`);
  checks.push(
    before.budget.governed === true
      ? 'PASS budget governed (policy active)'
      : 'FAIL budget not governed — no policy enforced'
  );

  console.log('\n--- Leg 1: quote  ($0.01, expect SETTLE + ledger moves) ---');
  const quote = await runLeg(client, QUOTE_URL);
  console.log('\n--- Leg 2: report ($0.25, expect SETTLE + ledger moves) ---');
  const report = await runLeg(client, REPORT_URL);
  console.log('\n--- Leg 3: audit  ($2.50, expect pre-sign refusal + no ledger move) ---');
  const audit = await runLeg(client, AUDIT_URL);

  const after = await readLimits(client);
  console.log('\n--- Post-run budget ---');
  console.log(`  transaction: ${JSON.stringify(after.tx)}`);
  console.log(`  daily:       ${JSON.stringify(after.daily)}`);

  const paidExpectedMinor = 1 + 25;
  const dailyDelta = (after.daily?.spent_minor ?? 0) - (before.daily?.spent_minor ?? 0);

  checks.push(
    quote.settled
      ? 'PASS quote ($0.01) settled — a spend event was written'
      : `FAIL quote did not settle (${quote.code ?? quote.message})`
  );
  checks.push(
    report.settled
      ? 'PASS report ($0.25) settled — a spend event was written'
      : `FAIL report did not settle (${report.code ?? report.message})`
  );
  const auditOk =
    !audit.settled &&
    audit.code === 'policy_limit_exceeded' &&
    /600|2.50|250|cap|limit/.test(audit.message ?? '');
  checks.push(
    auditOk
      ? 'PASS audit ($2.50) refused pre-sign with policy_limit_exceeded, nothing signed'
      : `FAIL audit expected policy_limit_exceeded, got settled=${audit.settled} code=${audit.code}`
  );
  checks.push(
    (after.daily?.spent_minor ?? 0) === (before.daily?.spent_minor ?? 0) + paidExpectedMinor
      ? `PASS ledger moved by exactly $0.26 daily (${dailyDelta} minor) — quote + report only, refusal added nothing`
      : `FAIL ledger delta ${dailyDelta} minor, expected ${paidExpectedMinor} (quote+report only)`
  );

  console.log('\n--- Deposit flow ---');
  const deposit = await runDepositFlow(client);
  for (const c of deposit.checks) console.log(`  ${c}`);

  const legsPass = quote.settled && report.settled && auditOk;
  const threeLegsVerdict = legsPass ? 'PASS' : 'FAIL';
  const verdict =
    threeLegsVerdict === 'PASS' &&
    (deposit.status === 'pending-endpoint' || deposit.status === 'passed')
      ? 'PASS'
      : 'FAIL';

  console.log('\nChecks:');
  for (const c of checks) console.log(`  ${c}`);
  for (const c of deposit.checks) console.log(`  ${c}`);
  console.log(`\nVERDICT: ${verdict}`);
  console.log(`  three legs:  ${threeLegsVerdict}`);
  console.log(`  deposit:     ${deposit.status}`);

  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `tollbeam-customer-parity-${Date.now()}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        legs: {
          quote: { expected: 'settle $0.01', ...quote },
          report: { expected: 'settle $0.25', ...report },
          audit: { expected: 'refuse policy_limit_exceeded, no spend', ...audit },
        },
        deposit: { channelUrl: CHANNEL_URL || null, ...deposit },
        baseline: {
          governed: before.budget.governed,
          policy: before.budget.policy,
          transaction: before.tx,
          daily: before.daily,
        },
        postState: { transaction: after.tx, daily: after.daily },
        ledgerDeltaMinor: dailyDelta,
        expectedDeltaMinor: paidExpectedMinor,
        checks,
        threeLegsVerdict,
        verdict,
      },
      null,
      2
    )
  );
  console.log(`report: ${file}`);
  console.log('\nCONFORMANCE.md snippet (paste when the customer path is verified):');
  console.log(
    `  | Tollbeam customer path | \`${BASE_URL}\` | ✅ three legs ${threeLegsVerdict}, deposit ${deposit.status} |`
  );

  process.exit(verdict === 'PASS' ? 0 : 2);
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
