import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = Object.fromEntries(
  envContent.split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=').map(s => s.trim()))
);

const API_KEY = envVars.AI_API_KEY || envVars.VIRTUALS_API_KEY;
const BASE = 'https://compute.virtuals.io/v1';
const MODEL = 'anthropic-claude-opus-4-8';

let totalCost = 0;
let totalCalls = 0;
let errored = 0;

const BIG_SOLIDITY = `You are a Solidity expert. Write a complete, production-ready Solidity contract. Every function fully implemented. Include:
- All state variables with detailed comments
- All external/public functions with full logic
- All internal/private helpers
- Events, modifiers, custom errors
- NatSpec on every function
- Security checks (reentrancy, overflow, access control)
- The contract must compile and be gas-optimized

Write at least 300 lines of code. No placeholders, no TODOs, no "...". Every function body must be complete.`;

const BIG_DEFI = `You are a DeFi architect. Design a complete protocol. Include:
- System architecture and component interactions
- Mathematical models and formulas
- Risk parameters and liquidation logic
- Fee structures and incentive alignment
- Security considerations and threat modeling
- Integration points with existing DeFi protocols

Write at least 2000 words. Be extremely detailed with specific numbers.`;

const SYSTEM_PROMPTS = [
  { system: BIG_SOLIDITY, userPrefix: 'Write a Solidity contract for a ', userSuffix: '. Full implementation with all functions.' },
  { system: BIG_DEFI, userPrefix: 'Design a ', userSuffix: ' protocol. Complete architecture, math, and risk analysis.' },
];

const TOPICS = [
  'lending pool', 'automated market maker', 'cross-chain bridge', 'RWA tokenization', 'DAO governance',
  'flash loan aggregator', 'concentrated liquidity pool', 'multi-sig wallet', 'options exchange', 'yield vault',
  'perpetual DEX', 'options AMM', 'restaking protocol', 'RWA bridge', 'treasury management',
  'volatility bond', 'cross-chain identity', 'isolated lending market', 'intent settlement', 'TEE compute protocol',
];

const USERS = [];
for (let i = 0; i < 300; i++) {
  const sp = SYSTEM_PROMPTS[i % 2];
  USERS.push({ system: sp.system, user: `${sp.userPrefix}${TOPICS[i % TOPICS.length]}${sp.userSuffix}`, maxTokens: 4000 });
}
for (let i = 0; i < 300; i++) {
  USERS.push({
    system: `Write the most detailed ${TOPICS[i % TOPICS.length]} implementation possible. Each function must be complete. No stubs. Include all edge cases. Aim for 400+ lines.`,
    user: `Complete ${['contract LendingPool { IPriceOracle oracle; mapping(address => ReserveData) reserves; }', 'contract AMM { uint160 sqrtPriceX96; int24 tick; }', 'contract Bridge { mapping(bytes32 => bool) used; }', 'contract Vault { IERC20 asset; }', 'contract Options { IPriceOracle oracle; struct Option { address writer; uint256 strike; uint256 expiry; } }', 'contract Factory { mapping(address => bool) whitelisted; }', 'contract Staking { IERC20 stakingToken; }', 'contract NFTMarket { address feeTo; }', 'contract Oracle { uint256 price; }', 'contract Pool { uint256 totalLiquidity; }'][i % 10]}`,
    maxTokens: 4000,
  });
}
for (let i = 0; i < 400; i++) {
  USERS.push({
    system: `You are a quantitative DeFi analyst. Provide extremely detailed analysis with specific numbers, formulas, and data. At least 1500 words.`,
    user: `Deep analysis: ${TOPICS[i % TOPICS.length]}. Historical performance, current metrics, future outlook. Specific numbers required.`,
    maxTokens: 4000,
  });
}

const CONCURRENCY = 30;

async function call(p) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 180000);
    const resp = await fetch(`${BASE}/chat/completions`, {
      method: 'POST', signal: c.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: p.system }, { role: 'user', content: p.user }], temperature: 0.7, max_tokens: p.maxTokens }),
    });
    clearTimeout(t);
    if (!resp.ok) { errored++; totalCalls++; return; }
    const data = await resp.json();
    if (data?.cost?.usd) totalCost += data.cost.usd;
    totalCalls++;
    if (data?.usage?.completion_tokens > 1000) return; // skip logging big responses
  } catch { errored++; totalCalls++; }
}

async function main() {
  console.log(`Burn V3: ${MODEL}, ${USERS.length} prompts, ${CONCURRENCY} concurrency\nTarget: $40\n`);
  const start = Date.now();
  for (let i = 0; i < USERS.length && totalCost < 40; i += CONCURRENCY) {
    const batch = USERS.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(call));
    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const suc = totalCalls - errored;
    process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, USERS.length)}/${USERS.length} | $${totalCost.toFixed(2)} | ${totalCalls} calls (${errored} err) | avg $${totalCalls > 0 ? (totalCost / totalCalls).toFixed(5) : 0} | ${elapsed}s`);
  }
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  const suc = totalCalls - errored;
  console.log(`\n\n=========================`);
  console.log(`  TOTAL: $${totalCost.toFixed(2)}`);
  console.log(`  CALLS: ${totalCalls}`);
  console.log(`  SUCCESS: ${suc}`);
  console.log(`  ERRORS: ${errored}`);
  console.log(`  AVG: $${totalCalls > 0 ? (totalCost / totalCalls).toFixed(5) : 0}`);
  console.log(`  TIME: ${elapsed} min`);
  console.log(`=========================`);
}

main().catch(console.error);
