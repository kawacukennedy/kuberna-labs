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

const MODELS = {
  'opus-4-8': {
    name: 'anthropic-claude-opus-4-8',
    concurrency: 10,
    timeout: 300000,
  },
  'opus-4-8-fast': {
    name: 'anthropic-claude-opus-4-8-fast',
    concurrency: 30,
    timeout: 180000,
  },
};

const SYSTEM_PROMPTS = [
  { system: 'You are a Solidity expert. Write a complete, production-ready Solidity contract. Every function fully implemented. No placeholders. At least 300 lines.', makeUser: t => `Write a complete Solidity contract for a ${t}. Full implementation.` },
  { system: 'You are a DeFi architect. Design a complete protocol with system architecture, mathematical models, risk parameters, fee structures, and security considerations. At least 2000 words.', makeUser: t => `Design a ${t} protocol. Complete architecture, math, and risk analysis.` },
  { system: 'Quantitative DeFi analyst. Provide deep analysis with specific numbers and formulas.', makeUser: t => `Deep analysis of ${t}: historical performance, current metrics, future outlook.` },
];

const TOPICS = ['lending pool', 'AMM', 'cross-chain bridge', 'RWA token', 'DAO governance', 'flash loan', 'CLMM', 'multi-sig', 'options', 'vault', 'perp DEX', 'options AMM', 'restaking', 'RWA bridge', 'treasury', 'volatility bond', 'cross-chain identity', 'lending market', 'intent settlement', 'TEE compute'];

function makePrompts(n) {
  const prompts = [];
  for (let i = 0; i < n; i++) {
    const sp = SYSTEM_PROMPTS[i % SYSTEM_PROMPTS.length];
    prompts.push({ system: sp.system, user: sp.makeUser(TOPICS[i % TOPICS.length]), maxTokens: 4000 });
  }
  return prompts;
}

async function callWithRetry(model, p, maxRetries = 3) {
  const errs = [];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), model.timeout);
      const resp = await fetch(`${BASE}/chat/completions`, {
        method: 'POST', signal: c.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: model.name, messages: [{ role: 'system', content: p.system }, { role: 'user', content: p.user }], temperature: 0.7, max_tokens: p.maxTokens }),
      });
      clearTimeout(t);
      if (resp.ok) {
        const data = await resp.json();
        return { ok: true, cost: data?.cost?.usd || 0 };
      }
      const text = (await resp.text()).slice(0, 200);
      errs.push(`HTTP ${resp.status}`);
      if (resp.status === 429 && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 30000)));
        continue;
      }
      return { ok: false, error: `HTTP ${resp.status}: ${text}` };
    } catch (e) {
      if (e.name === 'AbortError') {
        errs.push('timeout');
        if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 2000)); continue; }
        return { ok: false, error: `Timeout after ${model.timeout/1000}s (${maxRetries} retries)` };
      }
      errs.push(e.message?.slice(0,50));
      if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 1000)); continue; }
      return { ok: false, error: e.message?.slice(0, 200) };
    }
  }
  return { ok: false, error: errs.join(', ') };
}

async function burn(modelKey, numPrompts) {
  const model = MODELS[modelKey];
  const prompts = makePrompts(numPrompts);
  let totalCost = 0, totalCalls = 0, errored = 0;
  let running = true;
  const errorLog = {};
  const start = Date.now();

  console.log(`\nFIXED BURN: ${model.name}`);
  console.log(`Concurrency: ${model.concurrency}, Timeout: ${model.timeout/1000}s\n`);

  for (let i = 0; i < prompts.length && running; i += model.concurrency) {
    if (totalCost >= 40) break;
    const batch = prompts.slice(i, i + model.concurrency);
    const results = await Promise.all(batch.map(p => callWithRetry(model, p)));
    for (const r of results) {
      if (r.ok) { totalCost += r.cost; totalCalls++; if (totalCost >= 40) running = false; }
      else { errored++; const k = r.error.split(':')[0]; errorLog[k] = (errorLog[k] || 0) + 1; }
    }
    const avg = totalCalls > 0 ? (totalCost / totalCalls).toFixed(5) : '0';
    process.stdout.write(`\r  ${Math.min(i+model.concurrency, prompts.length)}/${prompts.length} | $${totalCost.toFixed(2)} | ${totalCalls} ok, ${errored} err | avg $${avg} | ${((Date.now()-start)/1000).toFixed(0)}s`);
  }

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n\n--- RESULTS ---`);
  console.log(`  Total: $${totalCost.toFixed(2)}`);
  console.log(`  OK: ${totalCalls}, Errors: ${errored}`);
  console.log(`  Avg: $${totalCalls > 0 ? (totalCost / totalCalls).toFixed(5) : 0}`);
  console.log(`  Time: ${elapsed} min`);
  if (Object.keys(errorLog).length > 0) {
    console.log(`  Errors: ${JSON.stringify(errorLog)}`);
  }
  return { totalCost, totalCalls, errored };
}

const args = process.argv.slice(2);
const mode = args[0] || '--fast';
if (mode === '--regular') burn('opus-4-8', 300);
else if (mode === '--fast') burn('opus-4-8-fast', 600);
else if (mode === '--both') { await burn('opus-4-8', 300); await burn('opus-4-8-fast', 600); }
else console.log('Usage: node scripts/burn-fixed.mjs [--regular|--fast|--both]');
