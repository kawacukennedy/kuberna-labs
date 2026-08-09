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
// Opus 4.8 Fast at 2x pricing ($12/$60 per 1M) = ~$0.10/call
const MODEL = 'anthropic-claude-opus-4-8-fast';

let totalCost = 0;
let totalCalls = 0;
let errored = 0;

const SYS = [
  'You are a Web3 engineer. Write production code with full implementations. Be very detailed, at least 250 lines of code.',
  'You are a DeFi architect. Design protocols with complete specs, mathematical models, and security analysis.',
  'You are a Solidity expert. Complete contracts with ALL functions, modifiers, events, error handling, and NatSpec.',
  'You are a quant analyst. Provide deep DeFi analysis with specific numbers, formulas, and comparisons.',
];

const USERS = [];
for (let phase = 0; phase < 10; phase++) {
  for (let i = 0; i < 100; i++) {
    const si = (phase * 100 + i) % 4;
    USERS.push({
      system: SYS[si],
      user: si === 0 ? `Write complete Solidity: ${['lending pool', 'AMM', 'bridge', 'RWA token', 'DAO', 'flash loan', 'CLMM', 'multi-sig', 'options', 'vault'][i % 10]}. 250+ lines.` :
             si === 1 ? `Design: ${['volatility bond', 'cross-chain identity', 'TEE compute', 'isolated lending', 'intent settlement', 'perp DEX', 'options AMM', 'restaking', 'RWA bridge', 'treasury'][i % 10]} protocol. Full specs.` :
             si === 2 ? `Complete:\n${['contract Pool { IPriceOracle oracle; mapping(address => ReserveData) r; }', 'contract AMM { uint160 sqrtPriceX96; int24 tick; }', 'contract Bridge { mapping(bytes32 => bool) used; uint256 fee; }', 'contract Vault { IERC20 asset; }', 'contract Options { IPriceOracle oracle; struct Option { address writer; uint256 strike; uint256 expiry; } }'][i % 5]}` :
             `Analyze: ${['Aave vs Compound', 'Uniswap V4 vs V3', 'LayerZero vs Wormhole', 'EigenLayer yields', 'stETH depeg risk', 'Arbitrum vs Optimism', 'MEV 2026', 'Morpho vs Aave', 'Perp DEX volumes', 'bridge liquidity'][i % 10]}. Deep analysis.`,
      maxTokens: 3000,
    });
  }
}

// FIXED: Concurrency reduced from 50→30, timeout 180s→300s, added retry+error logging
const CONCURRENCY = 30;
const TIMEOUT = 300000;

async function call(p) {
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
        const text = (await resp.text()).slice(0, 100);
        errored++;
        totalCalls++;
        if (resp.status === 429 && attempt < 2) { await new Promise(r => setTimeout(r, 5000 * 2 ** attempt)); continue; }
        return;
      }
      const data = await resp.json();
      if (data?.cost?.usd) totalCost += data.cost.usd;
      totalCalls++;
      return;
    } catch (e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000)); continue; }
      errored++;
      totalCalls++;
    }
  }
}

async function main() {
  console.log(`Burn V2: ${MODEL}, concurrency=${CONCURRENCY}, prompts=${USERS.length}\n`);
  const start = Date.now();
  for (let i = 0; i < USERS.length && totalCost < 40; i += CONCURRENCY) {
    const batch = USERS.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(call));
    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const rate = (totalCost / (totalCalls || 1)).toFixed(5);
    process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, USERS.length)}/${USERS.length} | $${totalCost.toFixed(2)} | ${totalCalls} calls | avg $${rate} | ${elapsed}s`);
  }
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n\n========================`);
  console.log(`  TOTAL: $${totalCost.toFixed(2)}`);
  console.log(`  CALLS: ${totalCalls}`);
  console.log(`  ERRORS: ${errored}`);
  console.log(`  AVG: $${(totalCost / (totalCalls || 1)).toFixed(5)}`);
  console.log(`  TIME: ${elapsed} min`);
  console.log(`========================`);
}

main().catch(console.error);
