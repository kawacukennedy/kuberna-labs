/**
 * Tollbeam SDK Refusal Test
 *
 * Tests that TollbeamRefusalError fires with the engine's code when the
 * per-transaction cap ($0.00) blocks a payment.
 *
 * PREREQUISITE: Set per-transaction cap to $0.00 in Tollbeam dashboard:
 *   Dashboard → Spending Controls → Edit Policy → Per-payment amount → 0.00 → Save
 *
 * After test: set cap back to $1.00.
 */
import { TollbeamClient, TollbeamRefusalError, isRefusal } from '@tollbeam/sdk';

const API_KEY = process.env.TOLLBEAM_PROD_API_KEY ?? '';
const BASE_URL = 'https://api.tollbeam.com';

// chainray.online publishes an x402 manifest priced at $0.01 (1 minor) — the
// same resource the 5 settled mainnet payments used. CoinGecko is treated as a
// FREE resource on this rail (paid:false, nothing spent), so it cannot trigger
// a per-transaction refusal.
const RESOURCE_URL = 'https://chainray.online/oracle/price-feed/ETH';

async function checkBudget(client: TollbeamClient) {
  console.log('=== Budget Check ===');
  const budget = await client.getBudget();
  console.log(`  governed: ${budget.governed}`);
  console.log(`  policy: ${budget.policy?.name} (${budget.policy?.id})`);
  for (const limit of budget.limits) {
    console.log(
      `  ${limit.scope_type}/${limit.period}: spent=${limit.spent_minor} limit=${limit.limit_minor} remaining=${limit.remaining_minor}`
    );
  }
  const txLimit = budget.limits.find(
    (l: any) => l.scope_type === 'global' && l.period === 'transaction'
  );
  if (txLimit) {
    console.log(`\n  Per-transaction cap: $${(txLimit.limit_minor / 100).toFixed(2)}`);
    if (txLimit.limit_minor > 0) {
      console.log('  ⚠️  Cap is NOT $0.00 — refusal test will not trigger.');
      console.log('  Set per-transaction cap to $0.00 in dashboard first.');
    }
  }
  return budget;
}

async function testRefusal(client: TollbeamClient) {
  console.log('\n=== Refusal Test ===');
  console.log(`Resource: ${RESOURCE_URL}`);
  console.log(`Price: $0.01 (chainray.online x402 manifest)\n`);

  const start = Date.now();
  try {
    const result = await client.payAndFetch({ url: RESOURCE_URL });
    const elapsed = Date.now() - start;
    console.log(`Result (${elapsed}ms):`);
    console.log(`  paid: ${result.paid}`);
    console.log(`  resource.status: ${result.resource?.status}`);
    console.log(`  resource.body: ${JSON.stringify(result.resource?.body).slice(0, 100)}`);

    if (result.paid === false && result.resource) {
      console.log('\n  ℹ️  Resource returned without payment — either free or cap still active.');
    }
    if (result.paid === true) {
      console.log('\n  ✅ Payment settled — cap was NOT $0.00.');
    }
  } catch (err: any) {
    const elapsed = Date.now() - start;
    if (isRefusal(err)) {
      const refusal = err as TollbeamRefusalError;
      console.log(`TollbeamRefusalError (${elapsed}ms):`);
      console.log(`  code: ${refusal.code}`);
      console.log(`  message: ${refusal.message}`);
      console.log(`  status: ${refusal.status}`);
      console.log(`  executionId: ${refusal.executionId}`);
      console.log(`  breach: ${JSON.stringify(refusal.breach)}`);
      console.log(`  body: ${JSON.stringify(refusal.body).slice(0, 300)}`);

      if (refusal.code === 'policy_limit_exceeded') {
        console.log('\n  ✅ REFUSAL TEST PASSED — engine correctly blocked payment.');
        console.log('  The per-transaction limit was enforced before signing.');
      } else {
        console.log(`\n  ⚠️  Refusal code is "${refusal.code}", expected "policy_limit_exceeded".`);
      }
    } else {
      console.log(`Non-refusal error (${elapsed}ms):`);
      console.log(`  name: ${err.name}`);
      console.log(`  message: ${err.message}`);
    }
  }
}

async function testBudgetAfterRefusal(client: TollbeamClient) {
  console.log('\n=== Budget After Refusal ===');
  const budget = await client.getBudget();
  const txLimit = budget.limits.find(
    (l: any) => l.scope_type === 'global' && l.period === 'transaction'
  );
  if (txLimit) {
    console.log(`  spent_minor: ${txLimit.spent_minor} (should be 0 — refusal doesn't count)`);
    console.log(`  remaining_minor: ${txLimit.remaining_minor}`);
  }
}

async function main() {
  if (!API_KEY) {
    console.error('TOLLBEAM_PROD_API_KEY not set in environment');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Tollbeam SDK Refusal Test');
  console.log('='.repeat(60));

  const client = new TollbeamClient({ apiKey: API_KEY, baseUrl: BASE_URL });

  await checkBudget(client);
  await testRefusal(client);
  await testBudgetAfterRefusal(client);

  console.log('\n' + '='.repeat(60));
  console.log('Done. Set per-transaction cap back to $1.00 in dashboard.');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal:', e.message ?? e);
    process.exit(1);
  });
