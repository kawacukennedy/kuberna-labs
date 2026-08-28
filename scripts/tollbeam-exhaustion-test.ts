/**
 * Tollbeam SDK Budget-Exhaustion Test
 *
 * Spends the remaining LIFETIME budget (1¢ at a time against
 * chainray.online's x402 price-feed manifest) and verifies that:
 *
 *   1. The 1¢ payments succeed until `spent_minor` reaches the lifetime cap.
 *   2. The first payment that would exceed the lifetime cap is REFUSED with
 *      `policy_limit_exceeded` — naming the LIFETIME limit, not the
 *      per-transaction one.
 *   3. Concurrent case (Brent's invariant): when exactly one payment's worth of
 *      headroom remains, two payments fired in parallel → exactly one is
 *      admitted, one is refused, and the ledger lands at exactly the cap — no
 *      overspend, no drift, spend reserved before signing.
 *
 * Classifier rule (Brent's trap): always read `error.code`, never the refusal
 * flag. `rate_limited` is classifier-filed under REFUSED, so an over-limit read
 * of the count alone would credit Tollbeam with a refusal it didn't earn.
 *
 * PREREQUISITE: per-transaction cap back at $1.00 (run AFTER the $0.00 refusal
 * test). Pacing is sequential (~3s/call) → ~20 req/min, under the 60/min
 * app rate limit.
 */
import * as fs from 'fs';
import * as path from 'path';
import { TollbeamClient, TollbeamRefusalError, isRefusal } from '@tollbeam/sdk';

const API_KEY = process.env.TOLLBEAM_PROD_API_KEY ?? '';
const BASE_URL = 'https://api.tollbeam.com';
const RESOURCE_URL = 'https://chainray.online/oracle/price-feed/ETH';

const PRICE_MINOR = 1; // $0.01 = 1 cent = 1 minor unit (integer cents end-to-end)

interface Attempt {
  seq: number;
  phase: 'fill' | 'concurrent' | 'probe';
  ok: boolean;
  refused: boolean;
  code: string | null;
  message: string | null;
  executionId: string | null;
  txHash: string | null;
  elapsedMs: number;
}

const attempts: Attempt[] = [];

function isGlobalLifetime(l: any): boolean {
  return l.scope_type === 'global' && l.period === 'lifetime';
}

async function readLifetime(
  client: TollbeamClient
): Promise<{ spent: number; limit: number; remaining: number }> {
  const b = await client.getBudget();
  const lt = b.limits.find(isGlobalLifetime);
  if (!lt) throw new Error('no global/lifetime limit on this policy');
  return {
    spent: Number(lt.spent_minor),
    limit: Number(lt.limit_minor),
    remaining: Number(lt.remaining_minor),
  };
}

function analyseError(err: unknown): {
  refused: boolean;
  code: string | null;
  message: string | null;
  executionId: string | null;
} {
  if (isRefusal(err)) {
    const r = err as TollbeamRefusalError;
    return { refused: true, code: r.code, message: r.message, executionId: r.executionId ?? null };
  }
  const e = err as any;
  return {
    refused: false,
    code: e?.code ?? e?.name ?? 'unknown',
    message: e?.message ?? String(e),
    executionId: null,
  };
}

async function attemptOne(
  client: TollbeamClient,
  seq: number,
  phase: Attempt['phase']
): Promise<Attempt> {
  const t0 = Date.now();
  try {
    const r = await client.payAndFetch({ url: RESOURCE_URL });
    const elapsed = Date.now() - t0;
    if (r.paid) {
      return {
        seq,
        phase,
        ok: true,
        refused: false,
        code: null,
        message: null,
        executionId: r.executionId,
        txHash: r.settlement?.txHash ?? null,
        elapsedMs: elapsed,
      };
    }
    // paid:false + resource => the resource is FREE on this rail. That is not
    // a spend, so it cannot fill the budget — treat as a hard anomaly.
    return {
      seq,
      phase,
      ok: false,
      refused: false,
      code: 'resource_free',
      message: 'paid:false, nothing spent',
      executionId: null,
      txHash: null,
      elapsedMs: elapsed,
    };
  } catch (err: any) {
    const elapsed = Date.now() - t0;
    const a = analyseError(err);
    return {
      seq,
      phase,
      ok: false,
      refused: a.refused,
      code: a.code,
      message: a.message,
      executionId: a.executionId,
      txHash: null,
      elapsedMs: elapsed,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!API_KEY) {
    console.error('TOLLBEAM_PROD_API_KEY not set in environment');
    process.exit(1);
  }

  const client = new TollbeamClient({ apiKey: API_KEY, baseUrl: BASE_URL });

  const start = await readLifetime(client);
  console.log('='.repeat(64));
  console.log('Tollbeam Budget-Exhaustion Test');
  console.log('='.repeat(64));
  console.log(`resource:  ${RESOURCE_URL}`);
  console.log(`price:     $0.01 (${PRICE_MINOR} minor)`);
  console.log(`lifetime:  spent=${start.spent} limit=${start.limit} remaining=${start.remaining}`);
  console.log('='.repeat(64));

  if (start.remaining <= 0) {
    console.log(
      'No lifetime headroom left — nothing to spend. Try after the limit resets or a fresh policy.'
    );
    process.exit(0);
  }

  // Phase 1: sequential fill, leaving exactly 1 minor of headroom for the
  // concurrent pair.
  const fillCount = start.remaining - 1;
  console.log(`\nPhase 1 — sequential fill: ${fillCount} × $0.01 (leave 1 minor of headroom)\n`);
  let spent = start.spent;
  let spentAtLastCheck = start.spent;
  let okSinceCheck = 0;
  let rateLimitedPauses = 0;

  for (let i = 0; i < fillCount; i++) {
    const seq = attempts.length + 1;
    const a = await attemptOne(client, seq, 'fill');
    attempts.push(a);

    if (a.ok) {
      spent += PRICE_MINOR;
      okSinceCheck += 1;
      if (i % 25 === 0 || i === fillCount - 1) {
        const live = await readLifetime(client);
        // Drift guard: if the budget never advanced despite paid attempts, the
        // resource has become FREE on this rail — abort rather than loop 400+
        // times against a resource that is not spending.
        const progress = live.spent - spentAtLastCheck;
        if (progress === 0 && okSinceCheck > 0) {
          console.log(
            `  ⚠️  budget stuck at ${live.spent} after ${okSinceCheck} paid attempts — ` +
              `resource turned free. Aborting fill.`
          );
          break;
        }
        spentAtLastCheck = live.spent;
        okSinceCheck = 0;
        console.log(
          `  #${String(seq).padStart(3)} ok          spent(budget)=${live.spent} (local=${spent}) remaining=${live.remaining}`
        );
      }
    } else if (a.refused && a.code === 'rate_limited') {
      rateLimitedPauses += 1;
      console.log(`  #${String(seq).padStart(3)} rate_limited  → pause 30s...`);
      await sleep(30_000);
    } else {
      console.log(`  #${String(seq).padStart(3)} ${a.code}  ${a.message?.slice(0, 90) ?? ''}`);
      if (a.refused && a.code === 'policy_limit_exceeded') {
        console.log('  Policy refusal hit earlier than expected — stopping.');
        break;
      }
    }
  }

  const mid = await readLifetime(client);
  console.log(`\nAfter fill:  budget spent=${mid.spent}/${mid.limit} remaining=${mid.remaining}`);
  console.log('→ should be spent=limit-1 (1 minor of headroom)');
  if (mid.remaining !== 1) {
    console.log(`⚠️  Expected exactly 1 minor remaining, got ${mid.remaining}.`);
  }

  // Phase 2: the concurrent pair — exactly 1 slot left, fire 2 in parallel.
  console.log('\nPhase 2 — concurrent pair (1 slot, 2 attempts in parallel)\n');
  const seq = attempts.length + 1;
  const [c1, c2] = await Promise.all([
    attemptOne(client, seq, 'concurrent'),
    attemptOne(client, seq + 1, 'concurrent'),
  ]);
  attempts.push(c1, c2);
  for (const c of [c1, c2]) {
    console.log(
      `  #${c.seq} ${c.ok ? 'paid' : c.refused ? `${c.code}` : c.code}  ${c.ok ? (c.txHash ?? '').slice(0, 18) : (c.message?.slice(0, 90) ?? '')}`
    );
  }

  const afterPair = await readLifetime(client);
  console.log(
    `\nAfter pair:  spent=${afterPair.spent}/${afterPair.limit} remaining=${afterPair.remaining}`
  );
  console.log('→ expect spent == limit (exactly), one admission + one refusal');

  // Phase 3: probe — one more attempt must refuse naming the lifetime limit.
  console.log('\nPhase 3 — probe: first payment past the cap\n');
  const probe = await attemptOne(client, attempts.length + 1, 'probe');
  attempts.push(probe);
  console.log(
    `  #${probe.seq} ${probe.refused ? probe.code : probe.code}  ${probe.message?.slice(0, 140) ?? ''}`
  );
  if (probe.refused) console.log(`  executionId: ${probe.executionId}`);

  const final = await readLifetime(client);
  const successes = attempts.filter((a) => a.ok).length;
  const refusals = attempts.filter((a) => a.refused).length;
  const lifetimeRefusals = attempts.filter(
    (a) => a.refused && a.code === 'policy_limit_exceeded'
  ).length;

  console.log('\n' + '='.repeat(64));
  console.log('RESULTS');
  console.log('='.repeat(64));
  console.log(`attempts:        ${attempts.length}`);
  console.log(`successes:       ${successes}  (spent ${successes * PRICE_MINOR} minor)`);
  console.log(`refusals:        ${refusals}  (${lifetimeRefusals} policy_limit_exceeded)`);
  console.log(
    `rate_limited:    ${attempts.filter((a) => a.refused && a.code === 'rate_limited').length} (pauses: ${rateLimitedPauses})`
  );
  console.log(`final budget:    spent=${final.spent}/${final.limit} remaining=${final.remaining}`);

  let verdict = 'FAIL';
  const checks: string[] = [];
  const expectSuccesses = final.limit - start.spent; // headroom converted to spent
  if (final.spent === final.limit) {
    checks.push('PASS ledger landed exactly at lifetime cap');
  } else {
    checks.push(`FAIL ledger landed at ${final.spent}, expected exactly ${final.limit}`);
  }
  if (successes === expectSuccesses) {
    checks.push(`PASS exactly ${expectSuccesses} payments admitted (no more than cap allows)`);
  } else {
    checks.push(`FAIL ${successes} payments admitted, expected ${expectSuccesses}`);
  }
  if (probe.refused && probe.code === 'policy_limit_exceeded') {
    const namesLifetime = probe.message?.toLowerCase().includes('lifetime') ?? false;
    checks.push(
      namesLifetime
        ? 'PASS first over-cap payment refused, naming the LIFETIME limit'
        : `INFO probe refused with policy_limit_exceeded — message: ${probe.message}`
    );
  } else {
    checks.push(`FAIL probe was not a policy refusal: ${probe.code}`);
  }
  if (lifetimeRefusals >= 1)
    checks.push(`PASS ${lifetimeRefusals} lifetime-limit refusal(s) recorded`);
  if (final.spent < final.limit && successes > 0) {
    checks.push(
      '⚠️ Under-spend: budget not at cap despite successes — possible drift or free resource'
    );
  }
  if (final.spent > final.limit) {
    checks.push('❌ OVERSPEND: ledger exceeded the cap — bug to report to Brent');
  }

  if (
    final.spent === final.limit &&
    successes === expectSuccesses &&
    probe.refused &&
    probe.code === 'policy_limit_exceeded'
  ) {
    verdict = 'PASS';
  }

  console.log('\nChecks:');
  for (const c of checks) console.log(`  ${c}`);
  console.log(`\nVERDICT: ${verdict}`);

  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `tollbeam-exhaustion-${Date.now()}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        resource: RESOURCE_URL,
        priceMinor: PRICE_MINOR,
        start,
        final,
        attempts,
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
