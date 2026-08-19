import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  createPublicClient,
  encodeFunctionData,
  hashMessage,
  http,
  parseAbi,
  parseEventLogs,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { getUserOperationHash, type UserOperation } from 'viem/account-abstraction';

const ENTRYPOINT_V06: Address = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
const SIMPLE_ACCOUNT: Address = (process.env.SIMPLE_ACCOUNT_ADDRESS ??
  '0x7a3175bC23f4be167e49132A22d8e68B3a128aB1') as Address;
const SIMPLE_ACCOUNT_OWNER: Address = (process.env.SIMPLE_ACCOUNT_OWNER_ADDRESS ??
  '0x90b37Cf2A756D0DcD2F69A2De78e5CA443eD7d60') as Address;

const TOLLBEAM_BASE = process.env.TOLLBEAM_BASE_URL ?? 'https://api.tollbeam.com';
const TOLLBEAM_KEY = process.env.TOLLBEAM_SANDBOX_API_KEY ?? '';
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL ?? 'https://sepolia.base.org';

const ROUTES = ['base-sepolia', 'optimism-sepolia', 'arbitrum-sepolia'] as const;
type Route = (typeof ROUTES)[number];

const SUPPORTED_CHAINS: Record<Route, { chainId: number; explorer: string }> = {
  'base-sepolia': { chainId: 84532, explorer: 'https://sepolia.basescan.org' },
  'optimism-sepolia': { chainId: 11155420, explorer: 'https://sepolia-optimistic.etherscan.io' },
  'arbitrum-sepolia': { chainId: 421614, explorer: 'https://sepolia.arbiscan.io' },
};

interface SponsorResult {
  paymasterAndData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  quoteId: string;
  raw: string;
}

interface RunResult {
  route: Route;
  index: number;
  submittedAt: number;
  sponsoredAt: number;
  signedAt: number;
  sentAt: number;
  sentAtEnd: number;
  userOpHash?: Hex;
  includedAt?: number;
  provider?: string;
  status: 'included' | 'submitted' | 'rejected' | 'error';
  error?: string;
  rawError?: string;
  sponsorRaw?: string;
}

interface Report {
  generatedAt: string;
  owner: Address;
  account: Address;
  entryPoint: Address;
  route: Route;
  mode: 'steady' | 'burst';
  pollReceipts: boolean;
  runs: RunResult[];
  metrics: {
    submissionLatencyMs: number[];
    sponsorLatencyMs: number[];
    sendLatencyMs: number[];
    inclusionLatencyMs: number[];
    percentiles: Record<string, number>;
    providerSplit: Record<string, number>;
    failures: number;
    bothProvidersError: string[];
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function summaryLatencies(values: number[]): string {
  if (values.length === 0) return 'n/a';
  const sorted = [...values].sort((a, b) => a - b);
  return `p50=${percentile(sorted, 50)}ms p95=${percentile(sorted, 95)}ms p99=${percentile(sorted, 99)}ms (n=${values.length})`;
}

async function tollbeamRpc(
  route: Route,
  method: string,
  params: unknown[]
): Promise<{ result?: unknown; error?: { code: number; message: string; data?: unknown } }> {
  const url = `${TOLLBEAM_BASE}/v1/${route}/rpc`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOLLBEAM_KEY}` },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const raw = await res.text();
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(`non-JSON response (HTTP ${res.status}): ${raw.slice(0, 300)}`);
  }
  return body as { result?: unknown; error?: { code: number; message: string; data?: unknown } };
}

async function getEntryPointNonce(
  client: PublicClient,
  account: Address,
  key = 0n
): Promise<bigint> {
  const abi = [
    {
      name: 'getNonce',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'sender', type: 'address' },
        { name: 'key', type: 'uint192' },
      ],
      outputs: [{ name: 'nonce', type: 'uint256' }],
    },
  ] as const;
  const result = await client.readContract({
    address: ENTRYPOINT_V06,
    abi,
    functionName: 'getNonce',
    args: [account, key],
  });
  return result as bigint;
}

const BURN_ADDRESS: Address = '0x000000000000000000000000000000000000dEaD';
const DUMMY_SIGNATURE: Hex = `0x${'11'.repeat(65)}`;

const GAS_FLOOR_MAX_FEE = 8_050_000n;
const GAS_FLOOR_MAX_PRIORITY_FEE = 1_000_000n;

async function fetchGasPrices(
  client: PublicClient
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  const gasPrice = await client.getGasPrice();
  const priorityRaw = await client.request({
    method: 'eth_maxPriorityFeePerGas',
    params: [],
  });
  const priority = BigInt(priorityRaw as string);
  const base = gasPrice > priority ? gasPrice - priority : gasPrice;
  const maxFee = base + priority;
  return {
    maxFeePerGas: maxFee < GAS_FLOOR_MAX_FEE ? GAS_FLOOR_MAX_FEE : maxFee,
    maxPriorityFeePerGas:
      priority < GAS_FLOOR_MAX_PRIORITY_FEE ? GAS_FLOOR_MAX_PRIORITY_FEE : priority,
  };
}

function buildExecuteCall(value: bigint = 0n): Hex {
  const iface = {
    name: 'execute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'dest', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'func', type: 'bytes' },
    ],
    outputs: [],
  } as const;
  return encodeFunctionData({
    abi: [iface],
    functionName: 'execute',
    args: [BURN_ADDRESS, value, '0x'],
  });
}

async function sponsor(
  route: Route,
  userOp: Partial<UserOperation>,
  rawErrorOut: string[]
): Promise<SponsorResult | null> {
  const res = await tollbeamRpc(route, 'pm_sponsorUserOperation', [userOp, ENTRYPOINT_V06, {}]);
  if (res.error) {
    rawErrorOut.push(JSON.stringify(res.error));
    return null;
  }
  const r = res.result as any;
  return {
    paymasterAndData: r.paymasterAndData as Hex,
    callGasLimit: BigInt(r.callGasLimit),
    verificationGasLimit: BigInt(r.verificationGasLimit),
    preVerificationGas: BigInt(r.preVerificationGas),
    maxFeePerGas: BigInt(r.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(r.maxPriorityFeePerGas),
    quoteId: r.quoteId ?? '',
    raw: JSON.stringify(res),
  };
}

async function pollForInclusion(
  client: PublicClient,
  userOpHash: Hex,
  timeoutMs: number
): Promise<{ included: boolean; timestamp?: number }> {
  const eventAbi = parseAbi([
    'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)',
  ]);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const fromBlock = BigInt(await client.getBlockNumber()) - 50n;
    const logs = await client.getLogs({
      address: ENTRYPOINT_V06,
      event: eventAbi[0],
      args: { userOpHash },
      fromBlock: fromBlock < 0n ? 0n : fromBlock,
      toBlock: 'latest',
    });
    const parsed = parseEventLogs({ logs, abi: eventAbi });
    if (parsed.length > 0) {
      const ev = parsed[0].args;
      return { included: ev.success, timestamp: Date.now() };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { included: false };
}

async function runBatch(args: {
  route: Route;
  count: number;
  mode: 'steady' | 'burst';
  poll: boolean;
  timeoutMs: number;
}): Promise<Report> {
  const { route, count, mode, poll, timeoutMs } = args;
  const ownerKey = process.env.SIMPLE_ACCOUNT_OWNER_KEY ?? '';
  if (!ownerKey) {
    throw new Error(
      'SIMPLE_ACCOUNT_OWNER_KEY not set in .env — the SimpleAccount owner private key is required to sign UserOps.'
    );
  }
  const owner = privateKeyToAccount(ownerKey as Hex);
  if (owner.address.toLowerCase() !== SIMPLE_ACCOUNT_OWNER.toLowerCase()) {
    throw new Error(`Owner key mismatch: expected ${SIMPLE_ACCOUNT_OWNER}, got ${owner.address}`);
  }

  const client = createPublicClient({ transport: http(RPC_URL), chain: baseSepolia });
  const report: Report = {
    generatedAt: new Date().toISOString(),
    owner: owner.address,
    account: SIMPLE_ACCOUNT,
    entryPoint: ENTRYPOINT_V06,
    route,
    mode,
    pollReceipts: poll,
    runs: [],
    metrics: {
      submissionLatencyMs: [],
      sponsorLatencyMs: [],
      sendLatencyMs: [],
      inclusionLatencyMs: [],
      percentiles: {},
      providerSplit: {},
      failures: 0,
      bothProvidersError: [],
    },
  };

  let sharedGas: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | null = null;
  if (mode === 'burst') {
    sharedGas = await fetchGasPrices(client);
  }

  const run = async (index: number) => {
    const submittedAt = Date.now();
    const rawErrors: string[] = [];

    const gas = sharedGas ?? await fetchGasPrices(client);
    const nonceKey = mode === 'burst' ? BigInt(index + 1) : 0n;
    const nonce = await getEntryPointNonce(client, SIMPLE_ACCOUNT, nonceKey);
    const userOp: Partial<UserOperation> = {
      sender: SIMPLE_ACCOUNT,
      nonce: `0x${nonce.toString(16)}`,
      initCode: '0x',
      callData: buildExecuteCall(),
      callGasLimit: '0x0',
      verificationGasLimit: '0x0',
      preVerificationGas: '0x0',
      maxFeePerGas: `0x${gas.maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${gas.maxPriorityFeePerGas.toString(16)}`,
      paymasterAndData: '0x',
      signature: DUMMY_SIGNATURE,
    };

    const sign = () => {
      const hash = getUserOperationHash({
        userOperation: userOp as UserOperation,
        entryPointAddress: ENTRYPOINT_V06,
        entryPointVersion: '0.6',
        chainId: BigInt(SUPPORTED_CHAINS[route].chainId),
      });
      const personalHash = hashMessage({ raw: hash });
      return owner.sign({ hash: personalHash });
    };

    (userOp as UserOperation).signature = await sign();

    const sponsoredAt = Date.now();
    const sponsorRes = await sponsor(route, userOp, rawErrors);
    if (!sponsorRes) {
      report.runs.push({
        route,
        index,
        submittedAt,
        sponsoredAt,
        signedAt: sponsoredAt,
        sentAt: Date.now(),
        sentAtEnd: Date.now(),
        status: 'rejected',
        error: rawErrors[0] ?? 'sponsorship failed',
        rawError: sponsorResRaw(rawErrors),
      });
      report.metrics.failures += 1;
      report.metrics.bothProvidersError.push(...rawErrors);
      return;
    }

    const maxFee = sponsorRes.maxFeePerGas === 0n ? gas.maxFeePerGas : sponsorRes.maxFeePerGas;
    const maxPriorityFee =
      sponsorRes.maxPriorityFeePerGas === 0n
        ? gas.maxPriorityFeePerGas
        : sponsorRes.maxPriorityFeePerGas;

    Object.assign(userOp, {
      callGasLimit: `0x${sponsorRes.callGasLimit.toString(16)}`,
      verificationGasLimit: `0x${sponsorRes.verificationGasLimit.toString(16)}`,
      preVerificationGas: `0x${sponsorRes.preVerificationGas.toString(16)}`,
      maxFeePerGas: `0x${maxFee.toString(16)}`,
      maxPriorityFeePerGas: `0x${maxPriorityFee.toString(16)}`,
      paymasterAndData: sponsorRes.paymasterAndData,
    });

    const signedAt = Date.now();
    const signature = await sign();
    (userOp as UserOperation).signature = signature;

    const sentAt = Date.now();
    const sendRes = await tollbeamRpc(route, 'eth_sendUserOperation', [
      userOp,
      ENTRYPOINT_V06,
      { quoteId: sponsorRes.quoteId },
    ]);
    const sentAtEnd = Date.now();

    if (sendRes.error) {
      report.runs.push({
        route,
        index,
        submittedAt,
        sponsoredAt,
        signedAt,
        sentAt,
        status: 'error',
        error: sendRes.error.message,
        rawError: JSON.stringify(sendRes.error),
        sponsorRaw: sponsorRes.raw,
        sentAtEnd,
      });
      report.metrics.failures += 1;
      return;
    }

    const userOpHash = (sendRes.result as any).userOpHash as Hex;
    const provider = (sendRes.result as any).provider as string | undefined;
    report.metrics.submissionLatencyMs.push(sentAtEnd - submittedAt);
    report.metrics.sponsorLatencyMs.push(sponsoredAt - submittedAt);
    report.metrics.sendLatencyMs.push(sentAtEnd - sentAt);
    report.metrics.providerSplit[provider ?? 'unknown'] =
      (report.metrics.providerSplit[provider ?? 'unknown'] ?? 0) + 1;

    let inclusion: { included: boolean; timestamp?: number } | undefined;
    if (poll) {
      inclusion = await pollForInclusion(client, userOpHash, timeoutMs);
      if (inclusion.timestamp && inclusion.included) {
        report.metrics.inclusionLatencyMs.push(inclusion.timestamp - sentAtEnd);
      }
    }

    report.runs.push({
      route,
      index,
      submittedAt,
      sponsoredAt,
      signedAt,
      sentAt,
      sentAtEnd,
      userOpHash,
      includedAt: inclusion?.timestamp,
      provider,
      status: inclusion ? (inclusion.included ? 'included' : 'rejected') : 'submitted',
      sponsorRaw: sponsorRes.raw,
    });
  };

  if (mode === 'burst') {
    await Promise.all(Array.from({ length: count }, (_, i) => run(i)));
  } else {
    for (let i = 0; i < count; i++) {
      await run(i);
    }
  }

  const sub = report.metrics.submissionLatencyMs.slice().sort((a, b) => a - b);
  const spon = report.metrics.sponsorLatencyMs.slice().sort((a, b) => a - b);
  const send = report.metrics.sendLatencyMs.slice().sort((a, b) => a - b);
  const inc = report.metrics.inclusionLatencyMs.slice().sort((a, b) => a - b);
  report.metrics.percentiles = {
    submissionP50: percentile(sub, 50),
    submissionP95: percentile(sub, 95),
    submissionP99: percentile(sub, 99),
    sponsorP50: percentile(spon, 50),
    sponsorP95: percentile(spon, 95),
    sponsorP99: percentile(spon, 99),
    sendP50: percentile(send, 50),
    sendP95: percentile(send, 95),
    sendP99: percentile(send, 99),
    inclusionP50: percentile(inc, 50),
    inclusionP95: percentile(inc, 95),
    inclusionP99: percentile(inc, 99),
  };
  return report;
}

function sponsorResRaw(errors: string[]): string | undefined {
  const joined = errors.join('\n');
  return joined === '' ? undefined : joined;
}

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find((a) => a.startsWith('--mode='))?.split('=')[1];
  const countArg = args.find((a) => a.startsWith('--count='))?.split('=')[1];
  const routeArg = args.find((a) => a.startsWith('--route='))?.split('=')[1];
  const pollArg = args.find((a) => a.startsWith('--poll='))?.split('=')[1];
  const timeoutArg = args.find((a) => a.startsWith('--timeout='))?.split('=')[1];

  const mode = modeArg === 'burst' ? 'burst' : 'steady';
  const count = Math.min(parseInt(countArg ?? '5', 10) || 5, 200);
  const route = (ROUTES as readonly string[]).includes(routeArg ?? '')
    ? (routeArg as Route)
    : ('base-sepolia' as Route);
  const poll = pollArg !== 'false';
  const timeoutMs = parseInt(timeoutArg ?? '120000', 10) || 120000;

  console.log('='.repeat(60));
  console.log('Tollbeam UserOp Harness');
  console.log('='.repeat(60));
  console.log(`route:    ${TOLLBEAM_BASE}/v1/${route}/rpc`);
  console.log(`account:  ${SIMPLE_ACCOUNT}`);
  console.log(`mode:     ${mode} (count=${count})`);
  console.log(`poll:     ${poll} (timeout=${timeoutMs}ms)`);
  console.log('='.repeat(60));

  const report = await runBatch({ route, count, mode, poll, timeoutMs });

  console.log('\nRESULTS');
  console.log('='.repeat(60));
  for (const r of report.runs) {
    const lat = r.sentAtEnd - r.submittedAt;
    console.log(
      `#${r.index} ${r.status.padEnd(10)} provider=${r.provider ?? '—'} submit=${lat}ms` +
        (r.includedAt ? ` include=${r.includedAt - r.sentAtEnd}ms` : '') +
        (r.userOpHash ? ` ${r.userOpHash.slice(0, 18)}…` : '')
    );
  }
  if (report.metrics.failures > 0) {
    console.log(`\nFAILURES: ${report.metrics.failures}`);
    for (const err of report.metrics.bothProvidersError.slice(0, 5)) {
      console.log('  raw:', err.slice(0, 300));
    }
  }
  console.log('\nMETRICS');
  console.log(`submission:  ${summaryLatencies(report.metrics.submissionLatencyMs)}`);
  console.log(`sponsor:     ${summaryLatencies(report.metrics.sponsorLatencyMs)}`);
  console.log(`send:        ${summaryLatencies(report.metrics.sendLatencyMs)}`);
  console.log(`inclusion:   ${summaryLatencies(report.metrics.inclusionLatencyMs)}`);
  console.log(`providers:   ${JSON.stringify(report.metrics.providerSplit)}`);

  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `tollbeam-${route}-${mode}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(`\nreport: ${file}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
