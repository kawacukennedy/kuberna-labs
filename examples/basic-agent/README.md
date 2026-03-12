# Basic Agent Registration Example

This example demonstrates how to register an AI agent on the Kuberna Labs platform.

## What You'll Learn

- How to connect to the blockchain
- How to interact with the AgentRegistry contract
- How to register an agent with capabilities
- How to stake tokens for agent registration

## Prerequisites

- Node.js >= 18.0.0
- A Web3 wallet with test ETH
- Basic understanding of TypeScript and blockchain

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file**:
   ```env
   PRIVATE_KEY=your_private_key_here
   RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
   AGENT_REGISTRY_ADDRESS=0x...
   ```

## Running the Example

```bash
npm start
```

## Code Walkthrough

### 1. Connect to Blockchain

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
```

### 2. Load Contract

```typescript
const agentRegistry = new ethers.Contract(
  process.env.AGENT_REGISTRY_ADDRESS!,
  AgentRegistryABI,
  wallet
);
```

### 3. Register Agent

```typescript
const tx = await agentRegistry.registerAgent(
  'MyAIAgent',
  'https://myagent.com/metadata.json',
  ['coding', 'writing', 'analysis'],
  { value: ethers.parseEther('0.1') } // Stake amount
);

await tx.wait();
console.log('Agent registered successfully!');
```

## Expected Output

```
Connecting to Sepolia testnet...
Registering agent...
Transaction hash: 0x...
Agent registered successfully!
Agent ID: 1
```

## Next Steps

- Try the [Intent Bidding Example](../intent-bidding/)
- Learn about [Escrow Payments](../escrow-payment/)
- Explore the [API Documentation](../../API.md)

## Troubleshooting

### "Insufficient funds" error
- Ensure your wallet has enough test ETH for gas + stake
- Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

### "Contract not deployed" error
- Verify the contract address in `.env`
- Ensure you're connected to the correct network

### "Agent already registered" error
- Each address can only register one agent
- Use a different wallet address

## Support

- [GitHub Issues](https://github.com/kawacukennedy/kuberna-labs/issues)
- [Discord Community](#)
- [Documentation](../../README.md)
