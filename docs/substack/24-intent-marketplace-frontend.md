---
title: 'Post 24: Build a Custom Intent Marketplace Frontend With React + Wagmi'
slug: intent-marketplace-frontend
---

## Title Field

Put this in the **Title** field:

> Build a Custom Intent Marketplace Frontend With React + Wagmi

## Subtitle Field

Put this in the **Subtitle** field:

> Browse open intents, bid with escrow funding, track execution status — a complete frontend for the agent marketplace.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Build an intent marketplace frontend with React and Wagmi — full code

**Meta description** (155-160 chars):

> Complete React + Wagmi frontend for an intent marketplace. Browse intents, fund escrow, track execution. Production-ready components.

**Post URL slug**:

> intent-marketplace-frontend

## Body

Put this in the main body editor:

Kuberna's intent marketplace lets agents publish what they want done and other agents compete to execute it. But a marketplace needs a frontend — humans need to browse, fund, and verify.

I built a complete React + Wagmi frontend. Here's every component, hook, and contract call you need.

---

### Setup

```bash
npm create vite@latest intent-marketplace -- --template react-ts
cd intent-marketplace
npm install wagmi viem @tanstack/react-query @kuberna/sdk
```

Configure Wagmi:

```typescript
// src/wagmi.ts
import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum],
  connectors: [injected(), walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID! })],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});
```

---

### Component 1: Intent List With Filtering

The main view. Fetches open intents from the marketplace contract and renders them with chain + status filters.

```typescript
// src/components/IntentList.tsx
import { useReadContract } from 'wagmi';
import { useState } from 'react';
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '../contracts';

interface Intent {
  id: bigint;
  agentDid: string;
  description: string;
  chain: string;
  reward: bigint;
  status: 'OPEN' | 'FUNDED' | 'EXECUTING' | 'COMPLETED' | 'DISPUTED';
  deadline: bigint;
}

export function IntentList() {
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');

  const { data: intents, isLoading } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getIntents',
    args: [0n, 50n], // offset, limit
  });

  const filtered = (intents as Intent[] || []).filter(i => {
    if (chainFilter !== 'all' && i.chain !== chainFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Filters
        chain={chainFilter}
        status={statusFilter}
        onChainChange={setChainFilter}
        onStatusChange={setStatusFilter}
      />
      {isLoading ? (
        <Skeleton />
      ) : (
        filtered.map(intent => <IntentCard key={intent.id} intent={intent} />)
      )}
    </div>
  );
}
```

The `IntentCard` shows the intent description, chain badge, reward amount, time remaining, and a "Fund Escrow" button.

---

### Component 2: Intent Detail + Bid Form

Click an intent to see full details and fund its escrow.

```typescript
// src/components/IntentDetail.tsx
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

export function IntentDetail({ intent }: { intent: Intent }) {
  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleFund = () => {
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'fundEscrow',
      args: [intent.id],
      value: intent.reward,
    });
  };

  return (
    <div className="p-6 border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <ChainBadge chain={intent.chain} />
        <StatusBadge status={intent.status} />
      </div>

      <h2 className="text-xl font-semibold mb-2">{intent.description}</h2>

      <div className="text-sm text-gray-500 mb-4">
        <p>Agent: {intent.agentDid.slice(0, 20)}...</p>
        <p>Reward: {formatEther(intent.reward)} ETH</p>
        <p>Deadline: {new Date(Number(intent.deadline) * 1000).toLocaleString()}</p>
      </div>

      {intent.status === 'OPEN' && (
        <button
          onClick={handleFund}
          disabled={isConfirming}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {isConfirming ? 'Confirming...' : 'Fund Escrow & Execute'}
        </button>
      )}

      {hash && (
        <p className="mt-2 text-sm text-gray-500">
          TX: {hash.slice(0, 10)}...{hash.slice(-8)}
        </p>
      )}
    </div>
  );
}
```

The escrow contract locks the reward and creates a dispute window. The executor agent can then claim it after successful execution — or the funder can dispute if the execution failed.

---

### Component 3: Execution Log Viewer

Once an intent is funded, anyone can watch its execution status in real time.

```typescript
// src/components/ExecutionLog.tsx
import { useWatchContractEvent } from 'wagmi';

export function ExecutionLog({ intentId }: { intentId: bigint }) {
  const [logs, setLogs] = useState<ExecutionEvent[]>([]);

  useWatchContractEvent({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    eventName: 'ExecutionStep',
    args: { intentId },
    onLogs: (newLogs) => {
      setLogs(prev => [...prev, ...newLogs.map(parseExecutionEvent)]);
    },
  });

  return (
    <div className="max-h-96 overflow-y-auto">
      {logs.length === 0 ? (
        <p className="text-gray-400">Waiting for execution...</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b">
            <StepNumber number={i + 1} />
            <div>
              <p className="font-medium">{log.action}</p>
              <p className="text-sm text-gray-500">
                {log.chain} · TX: {log.txHash.slice(0, 10)}...
              </p>
              {log.attestationProof && (
                <a
                  href={`https://verify.kuberna.xyz/proof/${log.attestationProof}`}
                  className="text-xs text-blue-500 underline"
                >
                  View TEE attestation
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

Each step emits an `ExecutionStep` event with the chain, transaction hash, and optional TEE attestation proof. The log viewer renders them as a scrollable timeline.

---

### Component 4: Certificate Display

When an agent publishes an intent, they attach their SilentVerify PQ certificate. Display it for trust verification.

```typescript
// src/components/CertificateBadge.tsx
import { useQuery } from '@tanstack/react-query';

export function CertificateBadge({ certId }: { certId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['certificate', certId],
    queryFn: () =>
      fetch(`https://api.silentverify.io/v1/certificates/${certId}`).then(r => r.json()),
  });

  if (isLoading) return <Badge variant="outline">Loading...</Badge>;

  if (!data?.valid) return <Badge variant="destructive">Invalid Certificate</Badge>;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="success">PQ Secured</Badge>
      <span className="text-gray-400">
        Dilithium5 · Expires {new Date(data.expiry).toLocaleDateString()}
      </span>
      <button
        onClick={() => window.open(`https://verify.kuberna.xyz/cert/${certId}`)}
        className="text-blue-500 underline text-xs"
      >
        Verify
      </button>
    </div>
  );
}
```

---

### The App Shell

Wire it all together:

```typescript
// src/App.tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import { IntentList } from './components/IntentList';

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b px-6 py-4">
            <h1 className="text-2xl font-bold">Kuberna Intent Marketplace</h1>
            <ConnectButton />
          </header>
          <main className="max-w-6xl mx-auto px-6 py-8">
            <IntentList />
          </main>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

### What Wagmi Hooks Map to Which Contract Calls

| Action            | Wagmi Hook              | Contract Function                |
| ----------------- | ----------------------- | -------------------------------- |
| List intents      | `useReadContract`       | `getIntents(offset, limit)`      |
| Get intent detail | `useReadContract`       | `getIntent(id)`                  |
| Fund escrow       | `useWriteContract`      | `fundEscrow(id)`                 |
| Watch execution   | `useWatchContractEvent` | `ExecutionStep` event            |
| Dispute           | `useWriteContract`      | `disputeExecution(id)`           |
| Resolve dispute   | `useWriteContract`      | `resolveDispute(id, resolution)` |
| Claim reward      | `useWriteContract`      | `claimReward(id, proof)`         |

---

### Production Checklist

Before deploying:

- **Add chain switching.** Use `useSwitchChain` to let users switch between supported chains. The marketplace contract is deployed on Ethereum, Polygon, Arbitrum, and Base.
- **Add pagination.** The `getIntents` function supports offset/limit. Add infinite scroll with `@tanstack/react-query`'s `useInfiniteQuery`.
- **Add event subscriptions.** Use WebSocket providers (Alchemy, Infura) for real-time execution log updates.
- **Add certificate verification.** Before allowing a user to fund an intent, verify the publisher agent's certificate is still valid and hasn't been revoked.

---

### Making It Yours

The full frontend — including dark mode, mobile responsive layout, and chain-specific explorers — is in the Kuberna repo under `/examples/intent-marketplace`:

[github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)

There's also a hosted demo at marketplace.kuberna.xyz if you want to see it running before you build.

The agent marketplace is where the network effects happen. Every intent published is an opportunity for an agent to earn. Every execution builds the reputation system. Every certificate verified raises the trust floor.

The Discord at [discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu) has a `#frontend` channel — people are sharing their custom marketplace UIs and I'm genuinely surprised by some of the designs. Come show yours.

_Subscribe below. Next post: agent-to-agent payments with Kite x402 — one agent pays another for data, no private keys needed._
