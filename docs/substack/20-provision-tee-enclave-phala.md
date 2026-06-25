---
title: 'Post 20: Provision a TEE Enclave for Your Agent on Phala Network'
slug: provision-tee-enclave-phala
---

## Title Field

Put this in the **Title** field:

> Provision a TEE Enclave for Your Agent on Phala Network

## Subtitle Field

Put this in the **Subtitle** field:

> Step-by-step: package agent code, deploy to enclave, poll for attestation, submit receipt on-chain.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Provision a Phala TEE Enclave for Your AI Agent

**Meta description** (155-160 chars):

> Step-by-step tutorial: package agent code as Docker image, deploy to Phala Network, verify MRENCLAVE attestation, submit receipt on-chain, and monitor health.

**Post URL slug**:

> provision-tee-enclave-phala

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

We've talked about TEE attestation in theory (Post 12). Now let's do it for real.

In this tutorial, we'll package an agent as a Docker image, deploy it to a Phala Network TEE enclave, wait for the attestation to prove it's running the correct code, submit the attestation receipt on-chain, and set up health monitoring.

By the end, you'll have a provably-uncensorable agent running in a remote SGX enclave.

---

### What You'll Need

- **Docker** (installed and running)
- **Kuberna SDK** (`npm install -g @kuberna/sdk`)
- **Phala CLI** (`npm install -g @phala/cli`)
- A Kuberna API key (free tier works)
- A wallet with ~0.01 ETH on Base Sepolia for gas

---

### Step 1: Package Your Agent as a Docker Image

Phala deploys containers. Your agent needs to be packaged as a Docker image that listens for gRPC requests from the Phala worker node.

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install Kuberna SDK
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy agent code
COPY src/ ./src/
COPY agent.json ./

# The agent must expose a gRPC health endpoint
# Phala uses this for attestation verification
EXPOSE 50051

CMD ["node", "src/agent.js"]
```

Your `agent.json` config file:

```json
{
  "name": "phala-agent",
  "version": "1.0.0",
  "sdk": {
    "version": "0.4.0",
    "features": ["intents", "tee", "attestation"]
  },
  "phala": {
    "healthPort": 50051,
    "attestationType": "sgx-dcap",
    "mrenclave": null
  }
}
```

The `mrenclave` field is populated after deployment when we know the measured hash.

Build the image:

```bash
docker build -t kuberna/phala-agent:latest .
```

---

### Step 2: The Agent Code (Minimal TEE-Aware)

The agent needs to handle Phala's gRPC health checks and emit attestation events. Here's a minimal agent that does both:

```javascript
import { KubernaAgent } from '@kuberna/sdk';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const PROTO_PATH = './node_modules/@phala/sdk/proto/worker.proto';

class PhalaAgent {
  constructor() {
    this.agent = new KubernaAgent({
      name: 'phala-agent',
      apiKey: process.env.KUBERNA_API_KEY,
      chains: ['base-sepolia'],
      tee: {
        provider: 'phala',
        attestationInterval: 300_000, // re-attest every 5 min
      },
    });
  }

  async start() {
    await this.agent.init();
    console.log('Agent DID:', this.agent.did);

    // Start gRPC health server (required by Phala)
    await this.startHealthServer();

    // Start processing intents
    await this.agent.start({
      onIntent: async (intent) => {
        console.log('Received intent:', intent.id);

        // Execute inside the enclave
        const result = await this.executeIntent(intent);

        // Generate TEE attestation
        const attestation = await this.agent.generateAttestation({
          intentId: intent.id,
          input: intent.input,
          output: result,
        });

        // Submit result + attestation on-chain
        await this.agent.submitExecution({
          intentId: intent.id,
          result,
          attestation,
        });

        return result;
      },
    });
  }

  async startHealthServer() {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDefinition).phala;

    const server = new grpc.Server();
    server.addService(proto.Worker.service, {
      checkHealth: (call, callback) => {
        callback(null, { status: 'SERVING' });
      },
      getAttestation: (call, callback) => {
        const quote = this.agent.getCurrentQuote();
        callback(null, {
          quote: quote.quote,
          mrenclave: quote.mrenclave,
          timestamp: quote.timestamp,
        });
      },
    });

    const credentials = grpc.ServerCredentials.createInsecure();
    await new Promise((resolve) => {
      server.bindAsync('0.0.0.0:50051', credentials, resolve);
    });
    console.log('Health server listening on :50051');
  }

  async executeIntent(intent) {
    // Your agent logic here
    return { status: 'completed', data: intent.data };
  }
}

const agent = new PhalaAgent();
agent.start().catch(console.error);
```

---

### Step 3: Push the Image to a Registry

Phala pulls images from a container registry. Push to Docker Hub or any OCI-compatible registry:

```bash
docker tag kuberna/phala-agent:latest \
  docker.io/yourusername/phala-agent:latest

docker push docker.io/yourusername/phala-agent:latest
```

Make sure the image is public so Phala workers can pull it.

---

### Step 4: Deploy to Phala

Use the Phala CLI to deploy:

```bash
phala deploy \
  --image docker.io/yourusername/phala-agent:latest \
  --chain base-sepolia \
  --attestation sgx-dcap \
  --name my-first-enclave \
  --output deploy.json
```

The CLI interacts with the Phala blockchain, which schedules the deployment on available worker nodes. Output:

```json
{
  "deploymentId": "0x7a2b...c8f3",
  "workerId": "0xworker...abc1",
  "status": "provisioning",
  "estimatedWait": 120,
  "endpoint": ""
}
```

The deployment goes through stages:

```
Queued → Provisioning → Running → Attested → Ready
```

- **Queued**: Your deployment is in line. Workers bid on it.
- **Provisioning**: A worker is pulling your Docker image and setting up the enclave.
- **Running**: The enclave is running but not yet attested.
- **Attested**: The worker has generated an SGX attestation for your enclave.
- **Ready**: Attestation submitted to Phala chain. Your agent is fully operational.

---

### Step 5: Poll for Attestation

Phala takes 1-5 minutes to provision and attest. Poll every 15 seconds:

```bash
# Using the Phala CLI
phala status --deployment 0x7a2b...c8f3 --watch
```

Or programmatically with the SDK:

```javascript
import { PhalaProvider } from '@kuberna/sdk/providers/phala';

const phala = new PhalaProvider({
  chain: 'base-sepolia',
});

const deployment = await phala.waitForAttestation({
  deploymentId: '0x7a2b...c8f3',
  timeout: 300_000, // 5 minutes
  pollInterval: 15_000,
});

console.log('Attestation received:');
console.log('MRENCLAVE:', deployment.mrenclave);
console.log('Quote:', deployment.quote.slice(0, 64) + '...');
console.log('Worker:', deployment.workerId);
console.log('Endpoint:', deployment.endpoint);

// Expected output:
// MRENCLAVE: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
// It should NOT match your Docker image hash — it's the measured SGX enclave hash
```

---

### Step 6: Verify the MRENCLAVE Hash

This is the critical security step. The MRENCLAVE is a cryptographic measurement of everything loaded into the enclave — your code, the runtime, the Node.js binary, all dependencies. You need to verify it matches what you expect:

```javascript
const expectedHash = await phala.computeMrenclave({
  image: 'docker.io/yourusername/phala-agent:latest',
});

if (deployment.mrenclave === expectedHash) {
  console.log('✅ MRENCLAVE matches expected hash');
  console.log('Agent code is running unmodified');
} else {
  console.error('❌ MRENCLAVE MISMATCH');
  console.error('Expected:', expectedHash);
  console.error('Got:', deployment.mrenclave);
  console.error('Do NOT trust this enclave');
  process.exit(1);
}
```

The SDK computes the expected hash by simulating the SGX measurement process on your Docker image. This is deterministic — the same image always produces the same MRENCLAVE.

---

### Step 7: Submit Attestation On-Chain

Once verified, submit the attestation receipt to the Kuberna on-chain registry. This makes it publicly verifiable:

```javascript
const receipt = await phala.submitAttestation({
  deploymentId: deployment.deploymentId,
  mrenclave: deployment.mrenclave,
  quote: deployment.quote,
  agentDID: agent.did,
  expiry: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
});

console.log('Attestation on-chain at tx:', receipt.transactionHash);
console.log('View on explorer: https://sepolia.basescan.org/tx/' + receipt.transactionHash);
```

The on-chain receipt includes:

- Agent DID (who owns this enclave)
- MRENCLAVE hash (what code is running)
- Quote (the raw SGX attestation, signed by Intel)
- Worker ID (which physical machine)
- Timestamp (when attested)
- Expiry (attestations expire; agents must re-attest)

---

### Step 8: Health Monitoring

Once deployed, the agent runs 24/7 inside the enclave. Monitor it:

```bash
# Check enclave status
phala health --deployment 0x7a2b...c8f3

# Check attestation freshness
phala attestation check --deployment 0x7a2b...c8f3

# View logs
phala logs --deployment 0x7a2b...c8f3 --tail 100
```

Programmatic monitoring:

```javascript
class EnclaveMonitor {
  constructor(phala, agent) {
    this.phala = phala;
    this.agent = agent;
    this.healthInterval = 60_000; // check every 60s
    this.attestationInterval = 86400_000; // re-attest daily
  }

  async start() {
    setInterval(async () => {
      await this.checkHealth();
    }, this.healthInterval);

    setInterval(async () => {
      await this.refreshAttestation();
    }, this.attestationInterval);
  }

  async checkHealth() {
    const status = await this.phala.getDeploymentStatus(deploymentId);

    if (status.health === 'unhealthy') {
      console.error('Enclave unhealthy:', status.reason);
      await this.agent.postUpdate({
        status: 'unhealthy',
        message: `Enclave ${deploymentId} is unhealthy: ${status.reason}`,
      });
    }

    if (status.attestationExpiry < Date.now() / 1000 + 3600) {
      console.log('Attestation expiring soon, refreshing...');
      await this.refreshAttestation();
    }
  }

  async refreshAttestation() {
    const newQuote = await this.phala.requestNewAttestation(deploymentId);
    const verified = await this.agent.verifyTeeQuote(newQuote);

    if (verified.valid) {
      await this.phala.submitAttestation({
        deploymentId,
        mrenclave: newQuote.mrenclave,
        quote: newQuote.quote,
        agentDID: this.agent.did,
        expiry: Math.floor(Date.now() / 1000) + 86400 * 30,
      });
      console.log('Attestation refreshed');
    }
  }

  async destroy() {
    console.log('Destroying enclave...');
    await this.phala.destroyDeployment(deploymentId);
    await this.agent.postUpdate({
      status: 'destroyed',
      message: 'Enclave destroyed on user request',
    });
    process.exit(0);
  }
}
```

---

### Step 9: Full Deployment Script

```javascript
import { KubernaAgent } from '@kuberna/sdk';
import { PhalaProvider } from '@kuberna/sdk/providers/phala';

async function deployToPhala() {
  // 1. Set up
  const agent = new KubernaAgent({
    name: 'phala-deploy-demo',
    apiKey: process.env.KUBERNA_API_KEY,
  });
  await agent.init();

  const phala = new PhalaProvider({ chain: 'base-sepolia' });

  // 2. Deploy
  console.log('Deploying to Phala...');
  const deployment = await phala.deploy({
    image: 'docker.io/yourusername/phala-agent:latest',
    name: 'my-first-enclave',
    agentDID: agent.did,
  });
  console.log('Deployment ID:', deployment.id);

  // 3. Wait for attestation
  console.log('Waiting for attestation...');
  const attested = await phala.waitForAttestation({
    deploymentId: deployment.id,
    timeout: 300_000,
  });

  // 4. Verify MRENCLAVE
  const expected = await phala.computeMrenclave({
    image: 'docker.io/yourusername/phala-agent:latest',
  });
  if (attested.mrenclave !== expected) {
    throw new Error('MRENCLAVE mismatch — aborting');
  }
  console.log('✅ MRENCLAVE verified');

  // 5. Submit on-chain
  const tx = await phala.submitAttestation({
    deploymentId: deployment.id,
    mrenclave: attested.mrenclave,
    quote: attested.quote,
    agentDID: agent.did,
    expiry: Math.floor(Date.now() / 1000) + 86400 * 30,
  });
  console.log('✅ Attestation on-chain:', tx.transactionHash);

  // 6. Start monitoring
  const monitor = new EnclaveMonitor(phala, agent);
  await monitor.start();

  console.log('🚀 Agent running in Phala TEE');
  console.log('Endpoint:', attested.endpoint);
  console.log('Agent DID:', agent.did);
}

deployToPhala().catch(console.error);
```

---

### Destroy Lifecycle

When you're done, destroy the enclave properly:

```bash
# CLI
phala destroy --deployment 0x7a2b...c8f3 --confirm

# SDK
await phala.destroyDeployment('0x7a2b...c8f3');
```

The destroy process:

1. Agent stops accepting new intents
2. Active intents are drained (configurable timeout)
3. Escrow funds are returned to the owner
4. Attestation is revoked on-chain
5. Worker node reclaims resources

---

### Security Considerations

- **MRENCLAVE verification is not optional**: If you skip it, you're trusting the Phala worker to tell the truth about what code is running. Verification is the entire point.
- **Docker image reproducibility**: Use specific version tags (`v1.0.0` not `latest`). `latest` changes and your MRENCLAVE changes with it.
- **Attestation expiry**: Re-attest before the on-chain receipt expires. The SDK can automate this.
- **Worker compromise**: Even with TEE, the worker can censor (not execute) or delay your agent. For censorship resistance, deploy to multiple workers on different providers.
- **Side-channel attacks**: SGX has known side-channel vulnerabilities (Plundervolt, ZombieLoad). Keep your SVN (Security Version Number) updated.

---

The full deployment code and examples are [on GitHub](https://github.com/kawacukennedy/kuberna-labs) in `examples/phala-deployment/`. It includes production hardening, multi-worker deployment, and integration with Marlin Oyster for redundancy.

Questions about TEE deployment? The [Discord](https://discord.gg/MZvNuhpXu) has a #phala channel with people who've deployed production agents. Come share your experience.

**Subscribe to this series** — That's 20 posts covering the full Kuberna Labs platform. From architecture deep-dives to practical tutorials, you now have everything you need to build, deploy, and verify cross-chain AI agents. If you've read this far, go actually build something. The [GitHub repo](https://github.com/kawacukennedy/kuberna-labs) has issues tagged "good first issue" if you want to contribute. See you on Discord.

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
