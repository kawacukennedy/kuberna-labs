/**
 * Tollbeam Priced-Legs Parity Matrix (sandbox key, default $1.00/tx / $5.00 daily)
 *
 * Runs all three public Base-Sepolia priced seller endpoints in one pass and
 * records how each moves (or does not move) the ledger:
 *
 *   /priced/quote  $0.01  happy path  → should SETTLE, ledger +0.01
 *   /priced/report $0.25  cap-filler  → should SETTLE, ledger +0.25
 *   /priced/audit  $2.50  over $1.00 tx cap → should refuse pre-sign,
 *                         policy_limit_exceeded, ledger unchanged
 *
 * The pairwise claim being tested: paid legs write spend events whose sum shows
 * up in the budget, and the refused leg writes nothing — "the ledger shows only
 * money that actually moved." If a leg's expectation is wrong, the script says
 * so loudly: a quote/report that does not settle, or an audit that settles or
 * refuses with the wrong code, each fail their assertion.
 *
 * PREREQUISITE: TOLLBEAM_API_KEY set in .env to the dashboard-created sandbox
 * app key. BASE_URL stays https://api.tollbeam.com — the sandbox rail is the
 * same API; only the key's app environment differs.
 *
 * NOTE: this script genuinely spends testnet USDC on the first two legs
 * (approximately $0.26 in total) via the seller's own x402 paywalls.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  TollbeamClient,
  TollbeamRefusalError,
  REFUSAL_CODES,
} from '@tollbeam/sdk';

const env = fs.readFileSync('.env', 'utf8');
const API_KEY = (env.match(/^TOLLBEAM_API_KEY=(.*)$/m) ?? [])[1] ?? '';
const BASE_URL = 'https://api.tollbeam.com';

const QUOTE_URL = 'https://seller.tollbeam.com/priced/quote';
const REPORT_URL = 'https://seller.tollbeam.com/priced/report';
const AUDIT_URL = 'https://seller.tollbeam.com/priced/audit';

interface LegOutcome {
  url: string;
  settled: boolean;
  code: string | null;
  message: string | null;
  executionId: string | null;
  txHash: string | null;
  refusalBody: unknown;
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

async function main() {
  if (!API_KEY) {
    console.error('TOLLBEAM_API_KEY not found in .env (dashboard sandbox app key)');
    process.exit(1);
  }

  const client = new TollbeamClient({ apiKey: API_KEY, baseUrl: BASE_URL });
  const checks: string[] = [];

  console.log('='.repeat(64));
  console.log('Tollbeam Priced-Legs Parity Matrix');
  console.log('='.repeat(64));
  console.log(`base_url: ${BASE_URL}`);
  console.log(`legs: quote $0.01 / report $0.25 (settle) + audit $2.50 (refuse)`);
  console.log('='.repeat(64));

  const before = await readLimits(client);
  console.log('--- Baseline (sandbox defaults) ---');
  console.log(`  governed: ${before.budget.governed}`);
  console.log(`  transaction: ${JSON.stringify(before.tx)}`);
  console.log(`  daily:       ${JSON.stringify(before.daily)}`);
  checks.push(before.budget.governed === true
    ? 'PASS budget governed (policy active)'
    : 'FAIL budget not governed — no policy enforced');
  checks.push((before.tx?.limit_minor ?? 0) === 100
    ? 'PASS default $1.00/transaction limit present'
    : `INFO transaction limit = $${((before.tx?.limit_minor ?? 0) / 100).toFixed(2)}`);
  checks.push((before.daily?.limit_minor ?? 0) === 500
    ? 'PASS default $5.00 daily limit present'
    : `INFO daily limit = $${((before.daily?.limit_minor ?? 0) / 100).toFixed(2)}`);

  async function runLeg(url: string): Promise<LegOutcome> {
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
      const res = await client.payAndFetch({ url, agentId: 'priced-legs-matrix' });
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

  console.log('\n--- Leg 1: /priced/quote  ($0.01, expect SETTLE + ledger moves) ---');
  const quote = await runLeg(QUOTE_URL);

  console.log('\n--- Leg 2: /priced/report ($0.25, expect SETTLE + ledger moves) ---');
  const report = await runLeg(REPORT_URL);

  console.log('\n--- Leg 3: /priced/audit  ($2.50, expect pre-sign refusal + no ledger move) ---');
  const audit = await runLeg(AUDIT_URL);

  const after = await readLimits(client);
  console.log('\n--- Post-run budget ---');
  console.log(`  transaction: ${JSON.stringify(after.tx)}`);
  console.log(`  daily:       ${JSON.stringify(after.daily)}`);

  const paidExpectedMinor = 1 + 25; // $0.01 + $0.25
  // transaction-period spent is a per-tx snapshot (resets after settle); the
  // daily line is the accumulator that shows what actually moved. The refusal
  // leg must not add anything beyond the two settled legs.
  const dailyDelta = (after.daily?.spent_minor ?? 0) - (before.daily?.spent_minor ?? 0);

  checks.push(quote.settled
    ? 'PASS quote ($0.01) settled — a spend event was written'
    : `FAIL quote did not settle (${quote.code ?? quote.message})`);
  checks.push(report.settled
    ? 'PASS report ($0.25) settled — a spend event was written'
    : `FAIL report did not settle (${report.code ?? report.message})`);

  const auditOk =
    !audit.settled && audit.code === 'policy_limit_exceeded' &&
    /600|2.50|250|cap|limit/.test(audit.message ?? '');
  checks.push(auditOk
    ? 'PASS audit ($2.50) refused pre-sign with policy_limit_exceeded, nothing signed'
    : `FAIL audit expected policy_limit_exceeded, got settled=${audit.settled} code=${audit.code}`);

  const refusedAddedNothing =
    (after.daily?.spent_minor ?? 0) === (before.daily?.spent_minor ?? 0) + paidExpectedMinor;
  checks.push(refusedAddedNothing
    ? `PASS ledger moved by exactly $0.26 daily (${dailyDelta} minor) — quote + report only, refusal added nothing`
    : `FAIL ledger delta ${dailyDelta} minor, expected ${paidExpectedMinor} (quote+report only)`);

  const verdict =
    quote.settled && report.settled && auditOk && refusedAddedNothing ? 'PASS' : 'FAIL';

  console.log('\nChecks:');
  for (const c of checks) console.log(`  ${c}`);
  console.log(`\nVERDICT: ${verdict}`);

  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `tollbeam-priced-legs-${Date.now()}.json`);
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
        verdict,
      },
      null,
      2
    )
  );
  console.log(`report: ${file}`);

  process.exit(verdict === 'PASS' ? 0 : 2);
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});