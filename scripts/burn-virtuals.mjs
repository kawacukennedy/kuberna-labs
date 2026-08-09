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
let done = false;

const SYSTEMS = [
  'You are a Web3 engineer. Write production Solidity/TypeScript code. Return only the code.',
  'You are a DeFi architect. Design protocols with detailed specs and mathematical models.',
  'You are a Solidity expert. Complete contracts with all functions, modifiers, events.',
  'You are a quantitative analyst. Provide detailed DeFi analysis with specific numbers.',
];

const CATS = [
  ['lending pool', 'AMM', 'cross-chain bridge', 'RWA token', 'DAO governance', 'flash loan aggregator', 'concentrated liquidity pool', 'multi-sig wallet', 'options exchange', 'yield vault'],
  ['volatility bond', 'cross-chain identity', 'TEE compute protocol', 'isolated lending market', 'intent settlement layer', 'perpetual DEX', 'options AMM', 'restaking protocol', 'RWA bridge', 'treasury management'],
  ['Aave vs Compound rates', 'Uniswap V4 vs V3 efficiency', 'LayerZero vs Wormhole security', 'EigenLayer yields', 'Lido stETH depeg risk', 'Arbitrum vs Optimism TVL', 'MEV trends 2026', 'Morpho vs Aave efficiency', 'Perp DEX volumes', 'Cross-chain bridge liquidity'],
];

const SNIPPETS = [
  'contract LendingPool { IPriceOracle oracle; mapping(address => ReserveData) reserves; }',
  'contract AMM { uint160 sqrtPriceX96; int24 tick; }',
  'contract Bridge { mapping(bytes32 => bool) usedHashes; }',
  'contract Vault { IERC20 asset; }',
  'contract Options { IPriceOracle oracle; struct Option { address writer; uint256 strike; uint256 expiry; } }',
];

const USERS = [];
for (let i = 0; i < 200; i++) {
  USERS.push({ system: SYSTEMS[0], user: `Write a Solidity contract: ${CATS[0][i % 10]}. Full implementation, 200+ lines.`, maxTokens: 2000 });
}
for (let i = 0; i < 200; i++) {
  USERS.push({ system: SYSTEMS[1], user: `Design: ${CATS[1][i % 10]} protocol. Architecture, math, risk, fees.`, maxTokens: 2000 });
}
for (let i = 0; i < 200; i++) {
  USERS.push({ system: SYSTEMS[2], user: `Complete:\n${SNIPPETS[i % 5]}`, maxTokens: 2000 });
}
for (let i = 0; i < 200; i++) {
  USERS.push({ system: SYSTEMS[3], user: `Analyze: ${CATS[2][i % 10]}. Include numbers and insights.`, maxTokens: 2000 });
}

// FIXED: Timeout 120s→300s, reduced concurrency 30→15, added retry+error logging
const CONCURRENCY = 15;
const TIMEOUT = 300000;

async function callAPI(p) {
  if (done) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), TIMEOUT);
      const resp = await fetch(`${BASE}/chat/completions`, {
        method: 'POST', signal: c.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: p.system }, { role: 'user', content: p.user }], temperature: 0.7, max_tokens: p.maxTokens }),
      });
      clearTimeout(t);
      if (!resp.ok) {
        errored++; totalCalls++;
        if (resp.status === 429 && attempt < 2) { await new Promise(r => setTimeout(r, 5000 * 2 ** attempt)); continue; }
        return;
      }
      const data = await resp.json();
      if (data?.cost?.usd) totalCost += data.cost.usd;
      totalCalls++;
      return;
    } catch (e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000)); continue; }
      errored++; totalCalls++;
    }
  }
}

async function main() {
  console.log(`Burn: ${MODEL}, concurrency=${CONCURRENCY}, prompts=${USERS.length}\n`);
  const start = Date.now();
  for (let i = 0; i < USERS.length && !done; i += CONCURRENCY) {
    const batch = USERS.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(callAPI));
    if (totalCost >= 40) { done = true; }
    process.stdout.write(`\r  ${i + batch.length}/${USERS.length} batches | $${totalCost.toFixed(2)} | ${((Date.now()-start)/1000).toFixed(0)}s`);
  }
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n\n============================`);
  console.log(`  TOTAL: $${totalCost.toFixed(2)}`);
  console.log(`  CALLS: ${totalCalls}`);
  console.log(`  ERRORS: ${errored}`);
  console.log(`  AVG: $${totalCalls > 0 ? (totalCost / totalCalls).toFixed(5) : 0}`);
  console.log(`  TIME: ${elapsed} min`);
  console.log(`============================`);
}

main().catch(console.error);
