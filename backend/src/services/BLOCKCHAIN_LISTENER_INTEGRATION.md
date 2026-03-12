# Blockchain Listener Integration Guide

## Quick Start

### 1. Install Dependencies

The required dependencies are already in package.json:
- `ethers`: ^6.10.0
- `nats`: ^2.29.3

### 2. Set Environment Variables

Copy the blockchain listener variables from `.env.example` to your `.env` file:

```bash
# Ethereum
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_WS_RPC_URL=ws://localhost:8545
ETHEREUM_ESCROW_CONTRACT=0x...
ETHEREUM_INTENT_CONTRACT=0x...
ETHEREUM_CERTIFICATE_CONTRACT=0x...
ETHEREUM_ATTESTATION_CONTRACT=0x...

# Polygon
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_WS_RPC_URL=wss://polygon-rpc.com
POLYGON_ESCROW_CONTRACT=0x...
POLYGON_INTENT_CONTRACT=0x...
POLYGON_CERTIFICATE_CONTRACT=0x...
POLYGON_ATTESTATION_CONTRACT=0x...

# Arbitrum
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_WS_RPC_URL=wss://arb1.arbitrum.io/ws
ARBITRUM_ESCROW_CONTRACT=0x...
ARBITRUM_INTENT_CONTRACT=0x...
ARBITRUM_CERTIFICATE_CONTRACT=0x...
ARBITRUM_ATTESTATION_CONTRACT=0x...

# Settings
POLL_INTERVAL=60000
REQUIRED_CONFIRMATIONS=3
NATS_URL=nats://localhost:4222
```

### 3. Start NATS Server

```bash
# Using Docker
docker run -p 4222:4222 nats:latest

# Or install locally
# macOS
brew install nats-server
nats-server

# Linux
wget https://github.com/nats-io/nats-server/releases/download/v2.10.0/nats-server-v2.10.0-linux-amd64.tar.gz
tar -xzf nats-server-v2.10.0-linux-amd64.tar.gz
./nats-server-v2.10.0-linux-amd64/nats-server
```

### 4. Run the Listener

```bash
# Development mode
npm run dev:listener

# Production mode
npm run build
npm run start:listener
```

## Integration with Main Application

### Option 1: Standalone Service (Recommended)

Run the blockchain listener as a separate process:

```bash
# Terminal 1: Main API server
npm run dev

# Terminal 2: Blockchain listener
npm run dev:listener
```

### Option 2: Integrated in Main Server

Add to your `src/index.ts`:

```typescript
import { createBlockchainListener } from "./services/blockchainListener.js";
import { blockchainListenerConfig } from "./config/blockchainListener.config.js";

// ... existing code ...

// Start blockchain listener
const listener = createBlockchainListener(blockchainListenerConfig);
await listener.start();

// Graceful shutdown
process.on("SIGINT", async () => {
  await listener.stop();
  process.exit(0);
});
```

## Subscribing to Events

### Backend Services

Subscribe to NATS events in your services:

```typescript
import { connect, StringCodec } from "nats";

const nc = await connect({ servers: "nats://localhost:4222" });
const sc = StringCodec();

// Subscribe to escrow funded events
const sub = nc.subscribe("intents.funded");
for await (const msg of sub) {
  const data = JSON.parse(sc.decode(msg.data));
  console.log("Escrow funded:", data);
  
  // Update your application state
  await updateIntentStatus(data.intentId, "bidding");
}

// Subscribe to bid events
const bidSub = nc.subscribe("bids.submitted");
for await (const msg of bidSub) {
  const data = JSON.parse(sc.decode(msg.data));
  console.log("Bid submitted:", data);
  
  // Notify requester
  await notifyRequester(data.intentId, data.solver, data.price);
}
```

## Event Subjects

The listener publishes to these NATS subjects:

- `intents.funded`: When an escrow is funded
- `bids.submitted`: When a solver submits a bid
- `bids.accepted`: When a requester accepts a bid

## Database Integration

### Create Event Tracking Table

Add to your Prisma schema:

```prisma
model BlockchainEvent {
  id              String   @id @default(uuid())
  chain           String
  contractAddress String
  eventName       String
  transactionHash String
  blockNumber     Int
  processed       Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  @@unique([transactionHash, eventName])
  @@index([chain, blockNumber])
}

model ChainState {
  id              String   @id @default(uuid())
  chain           String   @unique
  lastProcessedBlock Int   @default(0)
  updatedAt       DateTime @updatedAt
}
```

Run migration:

```bash
npx prisma migrate dev --name add_blockchain_events
```

### Update Event Handlers

Modify the listener to use the database:

```typescript
private async isEventProcessed(
  txHash: string,
  eventName: string,
): Promise<boolean> {
  const event = await prisma.blockchainEvent.findUnique({
    where: {
      transactionHash_eventName: {
        transactionHash: txHash,
        eventName: eventName,
      },
    },
  });
  return event?.processed || false;
}

private async markEventProcessed(
  txHash: string,
  eventName: string,
  chain: string,
  contractAddress: string,
  blockNumber: number,
): Promise<void> {
  await prisma.blockchainEvent.upsert({
    where: {
      transactionHash_eventName: {
        transactionHash: txHash,
        eventName: eventName,
      },
    },
    create: {
      chain,
      contractAddress,
      eventName,
      transactionHash: txHash,
      blockNumber,
      processed: true,
    },
    update: {
      processed: true,
    },
  });
}
```

## Monitoring

### Health Check Endpoint

Add to your API:

```typescript
app.get("/health/blockchain-listener", async (req, res) => {
  const status = {
    ethereum: await checkChainConnection("ethereum"),
    polygon: await checkChainConnection("polygon"),
    arbitrum: await checkChainConnection("arbitrum"),
    nats: await checkNATSConnection(),
  };
  
  const healthy = Object.values(status).every(s => s === "connected");
  
  res.status(healthy ? 200 : 503).json(status);
});
```

### Logging

The listener logs important events:

```
[INFO] Starting Blockchain Listener...
[INFO] Connected to NATS
[INFO] Initialized chain: ethereum
[INFO] Subscribed to Escrow events on ethereum
[INFO] Subscribed to Intent events on ethereum
[INFO] Started fallback polling with interval: 60000ms
[INFO] Blockchain Listener started successfully
[INFO] EscrowFunded event on ethereum: 0x123...
[INFO] Published to NATS subject: intents.funded
```

## Production Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  nats:
    image: nats:latest
    ports:
      - "4222:4222"
    
  blockchain-listener:
    build: .
    command: npm run start:listener
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL}
      - ETHEREUM_WS_RPC_URL=${ETHEREUM_WS_RPC_URL}
      - NATS_URL=nats://nats:4222
    depends_on:
      - nats
      - postgres
    restart: unless-stopped
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blockchain-listener
spec:
  replicas: 1
  selector:
    matchLabels:
      app: blockchain-listener
  template:
    metadata:
      labels:
        app: blockchain-listener
    spec:
      containers:
      - name: listener
        image: kuberna/blockchain-listener:latest
        env:
        - name: NATS_URL
          value: "nats://nats-service:4222"
        - name: ETHEREUM_WS_RPC_URL
          valueFrom:
            secretKeyRef:
              name: blockchain-secrets
              key: ethereum-ws-url
```

## Troubleshooting

### Connection Issues

If WebSocket connections fail:

1. Check RPC endpoint accessibility
2. Verify WebSocket URL format
3. Check firewall rules
4. Try HTTP RPC as fallback

### Events Not Processing

1. Verify contract addresses
2. Check ABI definitions
3. Review confirmation settings
4. Check NATS connection

### High Memory Usage

1. Reduce polling interval
2. Limit event history range
3. Implement event pruning
4. Monitor connection count

## Testing

### Manual Testing

```bash
# Deploy contracts to local network
npx hardhat node

# In another terminal
npx hardhat run scripts/deploy.ts --network localhost

# Update .env with contract addresses

# Start listener
npm run dev:listener

# Trigger events
npx hardhat run scripts/test-events.ts --network localhost
```

### Unit Tests

```bash
npm test -- blockchainListener.test.ts
```

## Next Steps

1. Implement database event tracking
2. Add monitoring and alerting
3. Set up production RPC endpoints
4. Configure backup RPC providers
5. Implement event replay functionality
