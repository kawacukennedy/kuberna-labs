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

let totalCost = 34.26;
let totalCalls = 0;
let errored = 0;
let done = false;

const SYSTEMS = [
  'You are a Web3 engineer. Write production Solidity/TypeScript code. Return only the code, no explanations.',
  'You are a DeFi architect. Design protocols with detailed specifications and mathematical models.',
  'You are a Solidity expert. Complete contracts with all functions, modifiers, events, and error handling.',
  'You are a quantitative analyst. Provide detailed DeFi analysis with specific numbers and comparisons.',
];

const USERS = [];
for (let i = 0; i < 100; i++) {
  const topics = ['lending pool', 'AMM', 'cross-chain bridge', 'RWA token', 'DAO governance', 'flash loan aggregator', 'concentrated liquidity pool', 'multi-sig wallet', 'options exchange', 'yield vault'];
  const designs = ['volatility bond', 'cross-chain identity', 'TEE compute', 'isolated lending', 'intent settlement', 'perp DEX', 'options AMM', 'restaking', 'RWA bridge', 'treasury management'];
  USERS.push({ system: SYSTEMS[0], user: `Write a complete Solidity contract for a ${topics[i % 10]}. 200+ lines with full implementations.`, maxTokens: 2000 });
  USERS.push({ system: SYSTEMS[1], user: `Design a ${designs[i % 10]} protocol with architecture, math models, risk parameters, and security.`, maxTokens: 2000 });
  USERS.push({ system: SYSTEMS[2], user: `Complete this Solidity contract with all functions:\n${['contract LendingPool { IPriceOracle oracle; mapping(address => ReserveData) reserves; }', 'contract AMM { uint160 sqrtPriceX96; int24 tick; }', 'contract Bridge { mapping(bytes32 => bool) usedHashes; }', 'contract Vault { IERC20 asset; }', 'contract Options { IPriceOracle oracle; struct Option { address writer; uint256 strike; uint256 expiry; } }'][i % 5]}`, maxTokens: 2000 });
}

// FIXED: Timeout 120s→300s, added retry logic with exponential backoff
const CONCURRENCY = 10;
const TIMEOUT = 300000;

async function callAPI(p) {
  if (done || totalCost >= 40) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);
      const resp = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'system', content: p.system }, { role: 'user', content: p.user }],
          temperature: 0.7,
          max_tokens: p.maxTokens,
        }),
      });
      clearTimeout(timer);
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
  console.log(`Burn V4 - Top-off to $40\nModel: ${MODEL}, Target: $40 (start: $34.26)\n`);
  const start = Date.now();
  for (let i = 0; i < USERS.length && totalCost < 40; i += CONCURRENCY) {
    const batch = USERS.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(p => callAPI(p)));
    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, USERS.length)}/${USERS.length} | $${totalCost.toFixed(2)} | ${totalCalls} calls (${errored} err) | ${elapsed}s`);
  }
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n\n=========================`);
  console.log(`  TOTAL: $${totalCost.toFixed(2)}`);
  console.log(`  CALLS: ${totalCalls}`);
  console.log(`  ERRORS: ${errored}`);
  console.log(`  TIME: ${elapsed} min`);
  console.log(`  TARGET $40: ${totalCost >= 40 ? 'REACHED' : `short by $${(40 - totalCost).toFixed(2)}`}`);
  console.log(`=========================`);
}

main().catch(console.error);
