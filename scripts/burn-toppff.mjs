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

const bigSolidity = `You are a Solidity expert. Write a complete, production-ready Solidity contract. Every function fully implemented. No placeholders. At least 300 lines. Include all state variables, external/public/internal functions, events, modifiers, custom errors, NatSpec, security checks, and gas optimizations.`;

const topics = ['lending pool', 'AMM', 'cross-chain bridge', 'RWA token', 'DAO governance', 'flash loan', 'CLMM', 'multi-sig', 'options', 'vault', 'perp DEX', 'restaking', 'bridge', 'treasury', 'staking', 'oracle', 'factory', 'marketplace', 'vesting', 'escrow'];

async function call(model, sys, user) {
  const c = new AbortController();
  setTimeout(() => c.abort(), 180000);
  const resp = await fetch(`${BASE}/chat/completions`, {
    method: 'POST', signal: c.signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], temperature: 0.7, max_tokens: 4000 }),
  });
  if (!resp.ok) { const t = await resp.text(); console.log(`ERR: ${resp.status} ${t.slice(0,100)}`); return 0; }
  const data = await resp.json();
  return data?.cost?.usd || 0;
}

let total = 39.03;
let calls = 0;
console.log(`Topping off from $${total} to $40...\n`);

while (total < 40) {
  const cost = await call(MODEL, bigSolidity, `Write a complete Solidity contract for a ${topics[calls % topics.length]}. Full implementation.`);
  if (cost > 0) {
    total += cost;
    calls++;
    console.log(`  Call #${calls}: +$${cost.toFixed(5)} = $${total.toFixed(2)}`);
  } else {
    console.log(`  Call #${calls + 1}: failed (retry)`);
  }
  if (calls > 50) break;
}

console.log(`\nTotal: $${total.toFixed(2)} (${calls} calls)`);
console.log(`Target $40: ${total >= 40 ? '✅ REACHED' : '❌ MISSED'}`);
