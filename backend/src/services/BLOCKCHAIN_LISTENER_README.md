# Blockchain Listener Service

## Overview

The Blockchain Listener service monitors blockchain events in real-time across multiple chains (Ethereum, Polygon, Arbitrum) using WebSocket connections. It processes smart contract events, updates the database, and publishes notifications to the solver network via NATS.

## Features

- **Multi-Chain Support**: Monitors events on Ethereum, Polygon, and Arbitrum simultaneously
- **WebSocket Connections**: Real-time event monitoring with automatic reconnection
- **Exponential Backoff**: Intelligent reconnection strategy for failed connections
- **Confirmation Waiting**: Waits for required block confirmations before processing events
- **Fallback Polling**: Catches missed events through periodic polling
- **Event Deduplication**: Prevents double-processing of events
- **NATS Integration**: Publishes notifications to solver network

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Blockchain Listener                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Ethereum    │  │   Polygon    │  │  Arbitrum    │     │
│  │  WebSocket   │  │  WebSocket   │  │  WebSocket   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │ Event Handlers │                       │
│                    └───────┬────────┘                       │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐            │
│         │                  │                  │             │
│    ┌────▼─────┐    ┌──────▼──────┐    ┌─────▼──────┐     │
│    │ Database │    │    NATS     │    │ Fallback   │     │
│    │  Update  │    │  Publisher  │    │  Polling   │     │
│    └──────────┘    └─────────────┘    └────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Monitored Events

### Escrow Contract
- `EscrowCreated`: New escrow created
- `EscrowFunded`: Escrow funded by requester
- `EscrowAssigned`: Executor assigned to escrow
- `TaskCompleted`: Task completion submitted
- `FundsReleased`: Funds released to executor

### Intent Contract
- `IntentCreated`: New intent created
- `BidSubmitted`: Solver submitted a bid
- `BidAccepted`: Requester accepted a bid

### Certificate Contract
- `CertificateMinted`: New certificate NFT minted

### Attestation Contract
- `AttestationCreated`: New attestation created

## Configuration

Configure the listener in `backend/src/config/blockchainListener.config.ts`:

```typescript
export const blockchainListenerConfig = {
  chains: {
    ethereum: {
      rpc: process.env.ETHEREUM_RPC_URL,
      wsRpc: process.env.ETHEREUM_WS_RPC_URL,
      contracts: {
        escrow: process.env.ETHEREUM_ESCROW_CONTRACT,
        intent: process.env.ETHEREUM_INTENT_CONTRACT,
        certificate: process.env.ETHEREUM_CERTIFICATE_CONTRACT,
        attestation: process.env.ETHEREUM_ATTESTATION_CONTRACT,
      },
    },
    // ... other chains
  },
  pollInterval: 60000, // 1 minute
  confirmations: 3,
  natsUrl: "nats://localhost:4222",
};
```

## Environment Variables

Add these to your `.env` file:

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
# ... other contracts

# Settings
POLL_INTERVAL=60000
REQUIRED_CONFIRMATIONS=3
NATS_URL=nats://localhost:4222
```

## Usage

### Starting the Listener

```bash
# Development
npm run dev:listener

# Production
npm run start:listener
```

### Programmatic Usage

```typescript
import { createBlockchainListener } from "./services/blockchainListener";
import { blockchainListenerConfig } from "./config/blockchainListener.config";

const listener = createBlockchainListener(blockchainListenerConfig);

// Start listening
await listener.start();

// Stop listening
await listener.stop();
```

## Event Processing Flow

1. **Event Detection**: WebSocket receives event from blockchain
2. **Confirmation Wait**: Wait for required block confirmations (default: 3)
3. **Deduplication Check**: Verify event hasn't been processed
4. **Database Update**: Update relevant database records
5. **NATS Notification**: Publish notification to solver network
6. **Mark Processed**: Mark event as processed to prevent duplicates

## Reconnection Strategy

The listener implements exponential backoff for reconnections:

- **Initial delay**: 1 second
- **Max attempts**: 10
- **Backoff formula**: `delay = baseDelay * 2^attempts`

Example delays:
- Attempt 1: 1s
- Attempt 2: 2s
- Attempt 3: 4s
- Attempt 4: 8s
- Attempt 5: 16s

## Fallback Polling

If WebSocket connections fail or miss events, the fallback polling mechanism:

1. Queries event history from last processed block
2. Processes missed events
3. Deduplicates against already processed events
4. Updates last processed block

Polling interval: Configurable (default: 60 seconds)

## Testing

Run tests:

```bash
npm test -- blockchainListener.test.ts
```

## Error Handling

The listener handles various error scenarios:

- **Connection Loss**: Automatic reconnection with exponential backoff
- **RPC Errors**: Logged and retried
- **Event Processing Errors**: Logged without stopping the listener
- **NATS Errors**: Logged and retried

## Monitoring

Monitor the listener through logs:

```bash
# View logs
tail -f logs/blockchain-listener.log

# Key metrics to monitor:
# - Connection status per chain
# - Events processed per minute
# - Reconnection attempts
# - Missed events caught by polling
```

## Production Considerations

1. **Database**: Implement proper event tracking table
2. **Monitoring**: Set up alerts for connection failures
3. **Scaling**: Run multiple instances with event deduplication
4. **Rate Limiting**: Respect RPC provider rate limits
5. **Backup RPC**: Configure fallback RPC endpoints

## Troubleshooting

### WebSocket Connection Fails

- Check RPC endpoint is accessible
- Verify WebSocket URL format (ws:// or wss://)
- Check firewall rules

### Events Not Processing

- Verify contract addresses are correct
- Check required confirmations setting
- Review event ABI definitions

### High Memory Usage

- Reduce polling interval
- Limit event history query range
- Implement event pruning

## Future Enhancements

- [ ] Support for NEAR and Solana
- [ ] Event replay functionality
- [ ] Metrics dashboard
- [ ] Alert system for critical events
- [ ] Multi-region deployment support
