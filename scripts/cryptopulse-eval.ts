/**
 * CryptoPulse MCP Eval — closes the two open tier questions from the Kane thread
 *
 * The two eval questions (both were "needs a plan tier to answer"):
 *   Q1  get_whale_movements on Base — does the tier we can see return Base
 *       coverage at all, or is Base data paid-tier? (Anonymous returned 0 for
 *       Base on 2026-08-25; a Pro-tier 7-day key may differ.)
 *   Q2  get_wallet_intel with multichain=true — does the multichain flag work
 *       and return per-chain rows for one address, or does it need a tier?
 *
 * Honest by design: the report says which tier the call ran as (anonymous vs
 * CRYPTOPULSE_API_KEY) and marks a run without the key as `tier: anonymous —
 * result may be capped`. Same rule as the tollbeam harness: we record what
 * actually came back, we don't assume.
 *
 * Usage:
 *   npx tsx scripts/cryptopulse-eval.ts \
 *     [--address base:0x... --address monad:0x...]    # monitored addresses
 *   CRYPTOPULSE_API_KEY=... npx tsx scripts/cryptopulse-eval.ts
 *
 * Env:
 *   CRYPTOPULSE_API_KEY            optional; when set, calls run authenticated
 *   CRYPTOPULSE_MONITOR_ADDRESSES  optional alternative: "base:0x...,monad:0x..."
 *   CRYPTOPULSE_MCP_URL            default https://cryptopulse.uno/api/mcp
 *
 * Output: printed per-tool results + reports/cryptopulse-eval-<ts>.json
 */
import * as fs from 'fs';
import * as path from 'path';

const env = fs.readFileSync('.env', 'utf8');
const API_KEY =
  process.env.CRYPTOPULSE_API_KEY ?? (env.match(/^CRYPTOPULSE_API_KEY=(.*)$/m) ?? [])[1] ?? '';
const MCP_URL = process.env.CRYPTOPULSE_MCP_URL ?? 'https://cryptopulse.uno/api/mcp';

type AnyRecord = Record<string, unknown>;

/** Minimal MCP streamable-HTTP client: initialize -> (session) -> tools/call. */
async function mcpClient() {
  let sessionId: string | null = null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;

  const FETCH_TIMEOUT_MS = 30_000;

  const post = async (payload: AnyRecord) => {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const sid = res.headers.get('mcp-session-id');
    if (sid) sessionId = sid;
    const contentType = res.headers.get('content-type') ?? '';
    const text = await res.text();
    let body: unknown;
    if (contentType.includes('text/event-stream')) {
      // Streamable HTTP may answer as SSE: collect `data:` frames, take the
      // first parseable JSON payload.
      const payloads = text
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter(Boolean);
      const parsed = payloads
        .map((p) => {
          try {
            return JSON.parse(p);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      body = parsed.length ? parsed[0] : text;
    } else {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    return { httpStatus: res.status, headers: { 'mcp-session-id': sid }, body };
  };

  // initialize — required before tools/call on streamable HTTP.
  const init = await post({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'kuberna-cryptopulse-eval', version: '1.0.0' },
    },
  });
  const resultBody = (init.body as AnyRecord)?.result as AnyRecord | undefined;
  const proto = resultBody?.protocolVersion ?? 'unknown';

  const call = async (name: string, arguments_: AnyRecord, id: number) => {
    const req: AnyRecord = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name, arguments: arguments_ },
      id,
    };
    if (sessionId) headers['mcp-session-id'] = sessionId;
    // Some streamable-HTTP servers want a notifications/initialized frame
    // before tools/call. Send it once, fire-and-forget — its response may be
    // an open SSE stream and must never block the actual tool call.
    if (id === 2) {
      fetch(MCP_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => undefined);
    }
    return post(req);
  };

  return { protocolVersion: proto, call, sessionId: () => sessionId };
}

interface ToolCallOutcome {
  tool: string;
  arguments: AnyRecord;
  httpStatus: number;
  isError: boolean;
  content: unknown;
  raw: unknown;
  note?: string;
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return JSON.stringify(content);
  return content
    .map((c) => {
      const cc = c as AnyRecord;
      if (typeof cc?.text === 'string') return cc.text;
      if (cc?.type === 'text') return JSON.stringify(cc);
      return JSON.stringify(c);
    })
    .join('\n');
}

/** Best-effort JSON parse of a text block; null when it is not JSON. */
function parseJsonLoose(text: string): AnyRecord | null {
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? (v as AnyRecord) : null;
  } catch {
    return null;
  }
}

async function callTool(
  client: Awaited<ReturnType<typeof mcpClient>>,
  tool: string,
  arguments_: AnyRecord,
  id: number
): Promise<ToolCallOutcome> {
  const res = await client.call(tool, arguments_, id);
  const body = res.body as AnyRecord;
  const result = body?.result as AnyRecord | undefined;
  return {
    tool,
    arguments: arguments_,
    httpStatus: res.httpStatus,
    isError: result?.isError === true || res.httpStatus >= 400,
    content: result?.content,
    raw: body,
    ...(res.headers['mcp-session-id'] ? { note: `session=${res.headers['mcp-session-id']}` } : {}),
  };
}

function parseAddressArg(arg: string): { chain: string; address: string } {
  const [chain, address] = arg.split(':');
  if (!chain || !address) throw new Error(`--address must be chain:addr, got '${arg}'`);
  return { chain, address };
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const addressFlags = args
    .filter((a) => a.startsWith('--address='))
    .map((a) => a.split('=')[1] ?? '');
  const envList = (process.env.CRYPTOPULSE_MONITOR_ADDRESSES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const addresses = [...addressFlags, ...envList].map(parseAddressArg);

  console.log('='.repeat(64));
  console.log('CryptoPulse MCP Eval — tier questions from the Kane thread');
  console.log('='.repeat(64));
  const tier = API_KEY ? 'authenticated (CRYPTOPULSE_API_KEY)' : 'ANONYMOUS — result may be capped';
  console.log(`tier:  ${tier}`);
  console.log(`mcp:   ${MCP_URL}`);
  console.log(
    `addrs: ${addresses.length ? addresses.map((a) => `${a.chain}:${a.address.slice(0, 10)}…`).join(', ') : '(none — Q1 only for whale movements)'}`
  );
  console.log('='.repeat(64));

  const client = await mcpClient();
  console.log(`protocol: ${client.protocolVersion}\n`);

  const outcomes: ToolCallOutcome[] = [];

  // Q1: whale movements on Base (the tier-cap question). Ethereum as control —
  // anonymous returned data for ethereum before, Base returned 0.
  console.log('--- Q1: get_whale_movements (base) — control: ethereum ---');
  const baseW = await callTool(client, 'get_whale_movements', { chain: 'base' }, 2);
  outcomes.push(baseW);
  console.log(`  base:      HTTP ${baseW.httpStatus} isError=${baseW.isError}`);
  console.log(`    ${extractText(baseW.content).slice(0, 400)}`);
  const ethW = await callTool(client, 'get_whale_movements', { chain: 'ethereum' }, 3);
  outcomes.push(ethW);
  console.log(`  ethereum:  HTTP ${ethW.httpStatus} isError=${ethW.isError}`);
  console.log(`    ${extractText(ethW.content).slice(0, 400)}`);
  const baseText = extractText(baseW.content);
  const baseJson = parseJsonLoose(baseText);
  const ethJson = parseJsonLoose(extractText(ethW.content));
  const baseMeta = baseJson
    ? `count=${baseJson.count} plan=${baseJson.plan} maxDays=${baseJson.maxDays} txs=${Array.isArray(baseJson.transactions) ? baseJson.transactions.length : '?'}`
    : 'count fields not in payload';
  const ethMeta = ethJson
    ? `count=${ethJson.count} plan=${ethJson.plan} maxDays=${ethJson.maxDays} txs=${Array.isArray(ethJson.transactions) ? ethJson.transactions.length : '?'}`
    : 'count fields not in payload';
  console.log(`  base meta:      ${baseMeta}`);
  console.log(`  ethereum meta:  ${ethMeta}`);
  console.log(
    `  tier signal: base count ${baseJson ? baseJson.count : '?'} ${baseJson && baseJson.count === 0 ? '(none observed at this tier — re-run with CRYPTOPULSE_API_KEY to disambiguate archive vs tier cap)' : ''}`
  );

  // Q2: wallet intel with multichain=true — one shot per monitored address.
  console.log('\n--- Q2: get_wallet_intel (multichain=true) ---');
  if (addresses.length === 0) {
    console.log('  no monitored addresses given — Q2 skipped (pass --address chain:addr)');
    console.log('  (a tier decision on Q2 needs an address the agent actually monitors)');
  }
  for (const [i, addr] of addresses.entries()) {
    const out = await callTool(
      client,
      'get_wallet_intel',
      { address: addr.address, multichain: true, chain: addr.chain },
      4 + i
    );
    outcomes.push(out);
    const text = extractText(out.content);
    const chains = (text.match(/"(chain|chainName)":\s*"[^"]+"/g) ?? []).map((m) =>
      m.replace(/^"(?:chain|chainName)":\s*"/, '').replace(/"$/, '')
    );
    console.log(
      `  ${addr.chain}:${addr.address.slice(0, 10)}…  HTTP ${out.httpStatus} isError=${out.isError}`
    );
    console.log(
      `    chains returned: ${chains.length ? [...new Set(chains)].join(', ') : 'none in payload'}`
    );
    console.log(`    ${text.slice(0, 400)}`);
  }

  // Verdict — process claims are made about what the tier we ran as returned.
  const verdict = 'INFO';
  console.log(
    '\nVERDICT: INFO (read-only survey — no pass/fail claim; tier decision = run again with CRYPTOPULSE_API_KEY)'
  );
  console.log(
    '  if Q1 base returns rows with the key but 0 anonymously: Base coverage is paid-tier — confirmed.'
  );
  console.log(
    '  if Q1 base stays 0 either way: Base simply has no qualifying movements in the window (not a tier signal).'
  );
  console.log('  if Q2 multichain returns per-chain rows: the flag works at this tier.');

  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `cryptopulse-eval-${Date.now()}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        tier: API_KEY ? 'authenticated' : 'anonymous',
        mcpUrl: MCP_URL,
        protocolVersion: client.protocolVersion,
        addresses: addresses.map((a) => ({ chain: a.chain, address: a.address })),
        outcomes,
        verdict,
      },
      null,
      2
    )
  );
  console.log(`report: ${file}`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Fatal:', err?.message ?? err);
    process.exit(1);
  });
