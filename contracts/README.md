# Kuberna Labs Smart Contracts

Solidity smart contracts powering the Kuberna Labs platform — escrow, intent marketplace, agent registry, NFTs, cross-chain routing, and platform governance.

## Overview

Contracts are written in Solidity ^0.8.20, compiled with Hardhat, and deployed across multiple EVM chains. The suite provides the on-chain execution layer for autonomous AI agents: secure escrow settlement, intent-based task markets, agent identity with reputation, and verifiable credentials.

## Contract Architecture

```
KubernaEscrow ─────── KubernaIntent
      │                     │
      ├── FeeManager        ├── AgentRegistry
      ├── Dispute           ├── ReputationNFT
      │                     ├── CertificateNFT
      │                     ├── CourseNFT
      │                     └── Workshop
      │
      ├── CrossChainRouter ─── Attestation
      ├── Payment
      ├── Treasury
      ├── GovernanceToken
      ├── PriceOracle
      ├── Subscription
      ├── Multisig
      ├── Vesting
      └── (near_contracts/, solana_contracts/)
```

### Core Marketplace

| Contract | File | Description |
|----------|------|-------------|
| **Escrow** | `Escrow.sol` | ERC-20/ETH escrow with create, fund, assign, complete, dispute, release, auto-release, expire-and-refund lifecycle. Role-based access (requester, executor, owner). Pausable. |
| **Intent** | `Intent.sol` | Cross-chain intent marketplace. Create intents with budget/deadline, submit/accept/reject/retract bids, assign solver, complete lifecycle. |
| **Payment** | `Payment.sol` | Payment processing and settlement contract. |
| **Dispute** | `Dispute.sol` | On-chain dispute resolution for escrow and intent conflicts. |
| **FeeManager** | `FeeManager.sol` | Platform fee configuration and distribution. |

### Agent & Identity

| Contract | File | Description |
|----------|------|-------------|
| **AgentRegistry** | `AgentRegistry.sol` | ERC-721 agent identity registry. Register, update, manage agent lifecycle (active, paused, deprecated). Owner-based access. |
| **ReputationNFT** | `ReputationNFT.sol` | ERC-8004-aligned agent reputation. On-chain scoring (success rate, response time, ratings), badge system, reputation decay, star rating (1-5), percentile rank. |
| **Attestation** | `Attestation.sol` | On-chain attestation verification. |

### NFTs & Education

| Contract | File | Description |
|----------|------|-------------|
| **CertificateNFT** | `CertificateNFT.sol` | ERC-721 course completion certificates with metadata, verification hash, and validity tracking. |
| **CourseNFT** | `CourseNFT.sol` | ERC-721 for course ownership/completion. |
| **Workshop** | `Workshop.sol` | Workshop registration and management. |

### Cross-Chain & Infrastructure

| Contract | File | Description |
|----------|------|-------------|
| **CrossChainRouter** | `CrossChainRouter.sol` | Cross-chain token bridging and message passing with multi-hop routing, slippage protection, and emergency halt. |
| **Treasury** | `Treasury.sol` | Platform treasury management. |
| **GovernanceToken** | `GovernanceToken.sol` | Platform governance token. |
| **PriceOracle** | `PriceOracle.sol` | Chainlink-based price feed integration. |
| **Subscription** | `Subscription.sol` | Subscription-based access management. |
| **Multisig** | `Multisig.sol` | Multi-signature wallet for admin operations. |
| **Vesting** | `Vesting.sol` | Token vesting schedules. |

### Cross-Chain Adapters

| Directory | Description |
|-----------|-------------|
| `near_contracts/` | NEAR Protocol smart contracts |
| `solana_contracts/` | Solana program implementations |

### Libraries

| File | Description |
|------|-------------|
| `libraries/TransferHelper.sol` | Safe ERC-20 and ETH transfer helper |

## Deployed Addresses

### Base Sepolia (Chain ID: 84532)

| Contract | Address |
|----------|---------|
| Escrow | `0x360ec009ba6967F5f7C53a88FAD0452C6140493d` |
| Intent | `0xB819ab0Bac2f22e8895C66fE3aDF23aa0a65145a` |
| CertificateNFT | `0x5e42c329Ef517B495261f57054d5844EAabD3dbf` |
| Payment | `0xFFe8A88E9E99938174B8a3C9EcA1c1462315395A` |
| Subscription | `0x9be7afE1793ad14F9026d7579cf7c2313184a7E0` |
| ReputationNFT | `0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35` |
| AgentRegistry | `0x817fB0D00f033bb2982fF44855Fb6F8AE2D41324` |
| CourseNFT | `0x9b0D1d05A6EBafE6364648d9e7109E2C37e331BF` |
| Workshop | `0x1Fa14FfB410EfA65b3aADBB9B65e2426A1fB0F66` |
| Dispute | `0x8bcc424C07afCf231046F58B15d3677b8E842023` |
| Treasury | `0x5DA30BDE4A774dcccE6099717d6b41A6329fDe34` |
| FeeManager | `0xD27b4Dcec846bdfF2DB9D70B163bfb61A3090E2e` |
| Attestation | `0xFB105A77806d365EdeCf45F677481043ec1D46F4` |
| CrossChainRouter | `0xE2924838E5914cE099e5969aD63b0C4A4eeB8BAD` |

Additional deployments on Sepolia, Polygon, Arbitrum, 0G Testnet — see `deployments/` for latest JSON files.

## Compile & Test

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
# Install dependencies (from repo root)
npm install

# Compile contracts
npx hardhat compile

# Run contract tests
npx hardhat test

# Run with gas report
REPORT_GAS=true npx hardhat test

# Run Solidity coverage
npx hardhat coverage

# View contract sizes
npx hardhat size-contracts
```

### Testing

Tests are in `test/` using Hardhat, chai matchers, and ethers v6:

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/Escrow.ts

# Run with verbose output
npx hardhat test --verbose
```

Test files: `Escrow.ts`, `Intent.ts`, `AgentRegistry.ts`, `CertificateNFT.ts`, `ReputationNFT.ts`, `Dispute.ts`, `PriceOracle.ts`, `contracts.ts`.

### Gas Reporting

Gas reports are written to `gas-report.txt` when `REPORT_GAS=true` is set.

## Deployment

### Configure

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer wallet private key |
| `SEPOLIA_RPC_URL` | RPC URL for Sepolia |
| `BASE_SEPOLIA_RPC_URL` | `https://sepolia.base.org` |

### Deploy

```bash
# Deploy to local hardhat node
npm run deploy:local

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia

# Deploy to Sepolia
npm run deploy:sepolia

# Deploy all networks
npx ts-node scripts/deploy-all.ts

# Verify contracts on Etherscan
npx hardhat run scripts/verify.ts --network baseSepolia
```

Deployment artifacts are written to `deployments/{network}-latest.json`.

### Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| Hardhat (local) | 31337 | `http://127.0.0.1:8545` |
| Sepolia | 11155111 | `https://rpc.sepolia.org` |
| Base Sepolia | 84532 | `https://sepolia.base.org` |
| Ethereum Mainnet | 1 | Infura/Alchemy |
| Polygon | 137 | `https://polygon-rpc.com` |
| Arbitrum | 42161 | `https://arb1.arbitrum.io/rpc` |
| Arbitrum Sepolia | 421614 | Alchemy |
| 0G Testnet | 16602 | `https://evmrpc-testnet.0g.ai` |
| Mantle | 5000 | `https://rpc.mantle.xyz` |
| Mantle Sepolia | 5003 | `https://rpc.sepolia.mantle.xyz` |

## Development

```bash
# Start local hardhat node
npx hardhat node

# Setup local deployment
npm run setup:local
```

## Security Considerations

### Access Control

- All contracts use OpenZeppelin's `Ownable` for admin functions
- Escrow enforces role-based access: `onlyAssignedExecutor`, requester-only release
- AgentRegistry checks `onlyOwnerOrAgentOwner` for mutations
- Pausable pattern lets owner halt critical functions during emergencies

### Reentrancy Protection

- Escrow, Intent, CrossChainRouter, and Payment use `ReentrancyGuard`
- All external state-changing functions are `nonReentrant`
- TransferHelper uses checks-effects-interactions pattern

### Escrow Safety

- Funds are held in the contract until explicit release or dispute resolution
- 24-hour auto-release delay after completion (requires executor action)
- Deadline enforcement — escrows can be expired and refunded after deadline
- Dispute mechanism allows both parties to raise issues
- Owner can resolve disputes (refund to requester or release to executor)

### Input Validation

- Zero-address checks on critical parameters
- Amount > 0 validation
- Deadline range enforcement (MIN_DEADLINE, MAX_DEADLINE)
- Status transition validation — each function validates current state

### Circuit Breakers

- `pause()` / `unpause()` on Escrow, Intent, CrossChainRouter
- Owner-only emergency stop for maintenance or security incidents

### Additional Considerations

- Contracts use Solidity 0.8.x built-in overflow protection
- Custom errors for gas-efficient reverts
- Events emitted for all state changes (indexed where appropriate)
- Deployer key stored in environment variables only — never committed
- Upgradeability: contracts are currently non-upgradeable (consider proxy pattern for future)

## Related

- [Backend README](../backend/README.md)
- [SDK README](../sdk/README.md)
- [Frontend README](../frontend/README.md)
- [Hardhat Config](../hardhat.config.ts)
- [Deployments](../deployments/)
- [Scripts](../scripts/)
