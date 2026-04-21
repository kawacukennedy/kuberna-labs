# Web3 Infrastructure Setup Guide

## Overview

This document provides setup instructions for the Kuberna Labs Web3 Infrastructure project, including smart contracts, backend services, and development tools.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0
- Redis >= 7.0
- Git

## Project Structure

```
kuberna-labs/
├── contracts/          # Solidity smart contracts
├── test/              # Smart contract tests
├── scripts/           # Deployment scripts
├── backend/           # Backend API services
│   ├── src/          # TypeScript source code
│   ├── prisma/       # Database schema and migrations
│   └── __tests__/    # Backend tests
├── sdk/              # TypeScript SDK for agents
├── frontend/         # Web UI (if applicable)
└── examples/         # Example implementations
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kuberna-labs/web3-infrastructure.git
cd web3-infrastructure
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

- **PRIVATE_KEY**: Your wallet private key for deployments (NEVER commit this!)
- **RPC URLs**: Infura, Alchemy, or other RPC endpoints
- **API Keys**: CoinMarketCap, Stripe, TEE providers, etc.
- **Database**: PostgreSQL connection string
- **Redis**: Redis connection details
- **NATS**: NATS messaging server URL

### 5. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### 6. Start Local Services

#### Start Redis (in separate terminal)
```bash
redis-server
```

#### Start NATS (in separate terminal)
```bash
# Install NATS server: https://docs.nats.io/running-a-nats-service/introduction/installation
nats-server
```

#### Start PostgreSQL
Ensure PostgreSQL is running and accessible at the DATABASE_URL specified in `.env`

## Development Workflow

### Compile Smart Contracts

```bash
npm run compile
```

This compiles all Solidity contracts in the `contracts/` directory and generates TypeScript types in `typechain-types/`.

### Run Smart Contract Tests

```bash
npm test
```

### Start Local Hardhat Node

```bash
npm run node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 test accounts.

### Deploy Contracts Locally

In a separate terminal (with local node running):

```bash
npm run deploy:local
```

### Run Backend Development Server

```bash
cd backend
npm run dev
```

The API server will start at `http://localhost:3000`.

### Run Backend Tests

```bash
cd backend
npm test
```

## Testing Frameworks

### Smart Contracts
- **Hardhat**: Ethereum development environment
- **Chai**: Assertion library
- **fast-check**: Property-based testing

### Backend
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library
- **fast-check**: Property-based testing

## Code Quality Tools

### Linting

```bash
# Lint smart contracts
npm run lint

# Lint backend code
cd backend
npm run lint
```

### Formatting

```bash
# Format all code
npm run format

# Format backend code
cd backend
npm run format
```

### Solidity Linting

```bash
npx solhint 'contracts/**/*.sol'
```

## Deployment

### Deploy to Testnet (Sepolia)

1. Ensure `.env` has `SEPOLIA_RPC_URL` and `PRIVATE_KEY` configured
2. Fund your wallet with Sepolia ETH from a faucet
3. Run deployment:

```bash
npm run deploy:sepolia
```

### Deploy to Mainnet

⚠️ **WARNING**: Deploying to mainnet requires real ETH and is irreversible!

1. Ensure `.env` has `MAINNET_RPC_URL` and `PRIVATE_KEY` configured
2. Verify all contracts are audited and tested
3. Run deployment:

```bash
npm run deploy:mainnet
```

### Deploy to Polygon

```bash
npm run deploy:polygon
```

### Deploy to Arbitrum

```bash
npm run deploy:arbitrum
```

## Multi-Chain Support

The infrastructure supports the following chains:

- **Ethereum** (Mainnet, Sepolia)
- **Polygon** (Mainnet, Mumbai)
- **Arbitrum** (One, Sepolia)
- **NEAR Protocol**
- **Solana**

Each chain requires its own RPC endpoint and configuration in `.env`.

## TEE Integration

### Phala Network

1. Sign up at https://phala.network
2. Get API credentials
3. Add to `.env`:
   ```
   PHALA_ENDPOINT=https://api.phala.network
   PHALA_API_KEY=your_key
   ```

### Marlin Oyster

1. Sign up at https://www.marlin.org/oyster
2. Get API credentials
3. Add to `.env`:
   ```
   MARLIN_ENDPOINT=https://api.marlin.org
   MARLIN_API_KEY=your_key
   ```

## zkTLS Integration

### Reclaim Protocol

1. Sign up at https://reclaimprotocol.org
2. Get API key
3. Add to `.env`:
   ```
   RECLAIM_API_KEY=your_key
   ```

### zkPass

1. Sign up at https://zkpass.org
2. Get API key
3. Add to `.env`:
   ```
   ZKPASS_API_KEY=your_key
   ```

## Monitoring and Logging

The backend uses Winston for logging. Log levels can be configured in `.env`:

```
LOG_LEVEL=info  # Options: error, warn, info, debug
```

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use hardware wallets** for mainnet deployments
3. **Audit contracts** before mainnet deployment
4. **Enable rate limiting** in production
5. **Use HTTPS** for all API endpoints
6. **Rotate API keys** regularly
7. **Monitor contract events** for suspicious activity

## Troubleshooting

### Contract Compilation Errors

```bash
npm run clean
npm run compile
```

### Database Connection Issues

Verify PostgreSQL is running and DATABASE_URL is correct:

```bash
psql $DATABASE_URL
```

### Redis Connection Issues

Verify Redis is running:

```bash
redis-cli ping
# Should return: PONG
```

### Gas Estimation Errors

Ensure you have sufficient balance and the RPC endpoint is responsive.

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com)

## Support

For issues and questions:
- GitHub Issues: https://github.com/kuberna-labs/web3-infrastructure/issues
- Discord: https://discord.gg/kuberna-labs
- Email: support@kuberna.africa

## License

MIT License - see LICENSE file for details
