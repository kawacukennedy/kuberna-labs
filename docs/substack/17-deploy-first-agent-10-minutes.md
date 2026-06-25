---
title: 'Post 17: Deploy Your First Cross-Chain AI Agent in 10 Minutes'
slug: deploy-first-agent-10-minutes
---

## Title Field

Put this in the **Title** field:

> Deploy Your First Cross-Chain AI Agent in 10 Minutes

## Subtitle Field

Put this in the **Subtitle** field:

> From `npm install @kuberna/sdk` to a live intent executing on Base Sepolia — no prior blockchain experience needed.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Deploy Cross-Chain AI Agent in 10 Minutes

**Meta description** (155-160 chars):

> Step-by-step tutorial: install the Kuberna SDK, create an agent, post a cross-chain intent on Base Sepolia, and verify attestation — all in 10 minutes.

**Post URL slug**:

> deploy-first-agent-10-minutes

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

Let's deploy an AI agent that can execute a cross-chain intent. You'll have it running in 10 minutes. No blockchain experience required. No Ethereum node. No Solana validator. Just Node.js, npm, and a terminal.

---

### Prerequisites

You need exactly two things:

1. **Node.js 18+** (if you don't have it: `brew install node` or download from nodejs.org)
2. **npm or pnpm** (comes with Node.js)

That's it. No wallet. No API key. No blockchain account.

---

### Step 1: Install the SDK

```bash
mkdir my-first-agent && cd my-first-agent
npm init -y
npm install @kuberna/sdk
```

If you're on a Mac with Apple Silicon (M1/M2/M3), you might see some native module compilation. That's normal — the TEE attestation libraries need native bindings. It takes about 30 seconds.

---

### Step 2: Get an API Key

Kuberna Labs has a free tier for testing. Grab a key:

```bash
# Visit https://github.com/kawacukennedy/kuberna-labs
# Click "Get API Key" in the header
# Or use the CLI:
npx @kuberna/sdk auth login
```

This opens a browser window. Sign in with GitHub or Google. Your API key gets saved to `~/.kuberna/config.json` automatically.

The free tier gives you:

- 100 intents per day
- Testnet only (Base Sepolia, Ethereum Holesky, Solana devnet)
- 1 agent identity
- TEE attestation enabled (Phala testnet)

---

### Step 3: Create Your Agent

Create a file called `agent.mjs`:

```javascript
import { KubernaAgent } from '@kuberna/sdk';

const agent = new KubernaAgent({
  name: 'my-first-agent',
  apiKey: process.env.KUBERNA_API_KEY,
  chains: ['base-sepolia'], // start with one chain
});

await agent.init();
console.log('Agent DID:', agent.did);
console.log('Agent address:', agent.address);
```

Run it:

```bash
export KUBERNA_API_KEY=$(cat ~/.kuberna/config.json | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
node agent.mjs
```

You should see:

```
Agent DID: did:kuberna:0x8f3F...c4d2
Agent address: 0x8f3F...c4d2
```

That address is your agent's on-chain identity. It's a deterministic derivation from your API key — no private key to manage. The SDK handles key generation and storage.

---

### Step 4: Post Your First Intent

Let's make the agent do something useful. We'll post an intent that swaps ETH for USDC, but since we're on testnet, we'll use a simple "echo intent" that any solver can handle:

```javascript
const intent = await agent.createIntent({
  type: 'echo',
  data: { message: 'Hello from Kuberna!' },
  constraints: {
    deadline: new Date(Date.now() + 3600000), // 1 hour
    budget: '0.0001 ETH', // test eth, not real
    teeRequired: false, // skip TEE for test
  },
});

console.log('Intent created:', intent.id);
console.log('Status:', intent.status);
```

Run the file again (add this to your `agent.mjs`). The output:

```
Intent created: 0x9e2a...b3f1
Status: pending
```

Your intent is now on the Base Sepolia testnet. Solver nodes are picking it up and competing to execute it.

---

### Step 5: Poll for Completion

Intents don't execute instantly. Solver nodes need time to compete, execute, and submit attestation. Poll every 5 seconds:

```javascript
const waitForCompletion = async (intentId, maxWait = 120_000) => {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const status = await agent.getIntentStatus(intentId);
    console.log(`[${Date.now() - start}ms] Status: ${status.state}`);

    if (status.state === 'settled') {
      console.log('Result:', status.result);
      console.log('Executed by:', status.solver);
      console.log('TEE attestation:', status.attestation ? '✅' : '❌');
      return status;
    }

    if (status.state === 'failed') {
      console.log('Failed:', status.error);
      throw new Error(status.error);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('Timed out waiting for execution');
};

const result = await waitForCompletion(intent.id);
```

Full script now:

```javascript
import { KubernaAgent } from '@kuberna/sdk';

const agent = new KubernaAgent({
  name: 'my-first-agent',
  apiKey: process.env.KUBERNA_API_KEY,
  chains: ['base-sepolia'],
});

await agent.init();

const intent = await agent.createIntent({
  type: 'echo',
  data: { message: 'Hello from Kuberna!' },
  constraints: {
    deadline: new Date(Date.now() + 3600000),
    budget: '0.0001 ETH',
    teeRequired: false,
  },
});

console.log('Intent:', intent.id);

const start = Date.now();
while (Date.now() - start < 120_000) {
  const status = await agent.getIntentStatus(intent.id);
  console.log(`[${Date.now() - start}ms] ${status.state}`);
  if (status.state === 'settled') {
    console.log('✅ Intent executed!');
    console.log('Result:', JSON.stringify(status.result, null, 2));
    break;
  }
  if (status.state === 'failed') {
    console.log('❌ Failed:', status.error);
    break;
  }
  await new Promise((r) => setTimeout(r, 5000));
}
```

---

### Step 6: Verify the Attestation

If you set `teeRequired: true`, the execution result includes an SGX attestation quote. The SDK verifies it automatically:

```javascript
if (status.attestation) {
  const verified = await agent.verifyTeeQuote({
    quote: status.attestation.quote,
    expectedMrenclave: status.attestation.solverMrenclave,
    intentId: intent.id,
  });
  console.log('Attestation valid:', verified.valid);
  console.log('Attestation details:', verified.details);
}
```

For testnet, solvers may or may not use TEE. The attestation will be present if they do, absent if they don't. Production deployments should require it.

---

### What Just Happened?

Let's recap the architecture:

```
Your terminal
    │
    ▼
Kuberna SDK
    │
    ├── Agent identity (DID derived from API key)
    ├── Intent creation (posted to Base Sepolia)
    │
    ▼
Intent Pool (on-chain)
    │
    ▼
Solver Network (off-chain, watching for intents)
    │
    ├── Solver A: "I'll execute for 0.00005 ETH"
    ├── Solver B: "I'll execute for 0.00003 ETH"
    └── Solver C: "I'll execute for free (testnet)"
    │
    ▼
Winner selected → Executes → Submits attestation
    │
    ▼
Escrow settled → Intent marked as 'settled'
    │
    ▼
Your terminal receives the result
```

All of this — identity creation, intent posting, solver competition, execution, settlement — happened without you writing a single line of blockchain interaction code.

---

### What's Next

From here you can:

- **Deploy to mainnet**: Change `base-sepolia` to `base` in the agent config. Add ETH/USDC to fund escrow.
- **Add more chains**: Pass `['base', 'polygon', 'arbitrum', 'solana-devnet']` to the agent constructor.
- **Use real intents**: Change `type: 'echo'` to `type: 'swap'` or `type: 'transfer'`.
- **Enable TEE**: Set `teeRequired: true` and deploy to Phala (tutorial in Post 20).
- **Set constraints**: Add budget limits, deadline, target chains, preferred solvers.

Full documentation and examples are [on GitHub](https://github.com/kawacukennedy/kuberna-labs). The `examples/` directory has sample agents for trading, monitoring, data pipelines, and more.

Ran into an issue? [Join the Discord](https://discord.gg/MZvNuhpXu) — the #getting-started channel has people who've been exactly where you are.

**Subscribe to this series** — Post 18 shows how to run the entire intent parser offline with zero API dependencies. No LLM cost, no internet, just pattern matching.

---

```bash
# Quick reference of all commands in this tutorial:
mkdir my-first-agent && cd my-first-agent
npm init -y
npm install @kuberna/sdk
npx @kuberna/sdk auth login
# Create agent.mjs with the code above
export KUBERNA_API_KEY=<your-key>
node agent.mjs
```

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
