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

async function diag(model, label) {
  console.log(`\n=== ${label} ===`);
  let ok = 0, errs = {};

  for (let i = 0; i < 10; i++) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 60000);
      const resp = await fetch(`${BASE}/chat/completions`, {
        method: 'POST', signal: c.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Say hi' }], max_tokens: 10 }),
      });
      clearTimeout(t);
      if (resp.ok) {
        ok++;
      } else {
        const text = (await resp.text()).slice(0, 100);
        const code = resp.status;
        errs[code] = (errs[code] || 0) + 1;
        console.log(`  HTTP ${code}: ${text}`);
      }
    } catch (e) {
      const msg = e.message?.slice(0, 80) || String(e).slice(0, 80);
      errs[msg] = (errs[msg] || 0) + 1;
      console.log(`  ERROR: ${msg}`);
    }
  }
  console.log(`  Result: ${ok}/10 ok, ${JSON.stringify(errs)}`);
}

async function concurrencyTest(model, label, concurrency) {
  console.log(`\n=== ${label} concurrency=${concurrency} ===`);
  const results = { ok: 0, byStatus: {}, errors: 0 };
  const start = Date.now();

  async function tryOne() {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 120000);
      const resp = await fetch(`${BASE}/chat/completions`, {
        method: 'POST', signal: c.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Write 2 paragraphs about Solidity' }], max_tokens: 500 }),
      });
      clearTimeout(t);
      if (resp.ok) {
        results.ok++;
        return;
      }
      results.byStatus[resp.status] = (results.byStatus[resp.status] || 0) + 1;
    } catch {
      results.errors++;
    }
  }

  const promises = Array.from({ length: concurrency }, () => tryOne());
  await Promise.all(promises);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  ${concurrency} parallel: ${results.ok} ok, errs=${results.errors}, byStatus=${JSON.stringify(results.byStatus)}, ${elapsed}s`);
}

// Test 1: Individual call diagnosis
await diag('anthropic-claude-opus-4-8', 'Opus 4.8 individual x10');
await diag('anthropic-claude-opus-4-8-fast', 'Opus 4.8 Fast individual x10');

// Test 2: Concurrency ramp
await concurrencyTest('anthropic-claude-opus-4-8', 'Opus 4.8', 5);
await concurrencyTest('anthropic-claude-opus-4-8', 'Opus 4.8', 15);
await concurrencyTest('anthropic-claude-opus-4-8', 'Opus 4.8', 30);
await concurrencyTest('anthropic-claude-opus-4-8', 'Opus 4.8', 50);

// Test 3: Fast model concurrency
await concurrencyTest('anthropic-claude-opus-4-8-fast', 'Opus 4.8 Fast', 5);
await concurrencyTest('anthropic-claude-opus-4-8-fast', 'Opus 4.8 Fast', 15);
await concurrencyTest('anthropic-claude-opus-4-8-fast', 'Opus 4.8 Fast', 30);
await concurrencyTest('anthropic-claude-opus-4-8-fast', 'Opus 4.8 Fast', 50);

console.log('\n=== DIAGNOSTIC COMPLETE ===');
