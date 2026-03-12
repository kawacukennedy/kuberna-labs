# Quick Start Guide

## Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd kuberna-labs

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install SDK dependencies
cd sdk
npm install
cd ..
```

## Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# At minimum, set:
# - PRIVATE_KEY (for deployments)
# - RPC URLs (for your preferred networks)
```

## Development Workflow

### 1. Compile Smart Contracts

```bash
npm run compile
```

This generates TypeScript types in `typechain-types/`.

### 2. Run Tests

```bash
# Run all smart contract tests
npm test

# Run specific test file
npx hardhat test test/Escrow.test.ts

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npx hardhat coverage
```

### 3. Local Development

#### Terminal 1: Start Local Blockchain

```bash
npm run node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 test accounts.

#### Terminal 2: Deploy Contracts

```bash
npm run deploy:local
```

Or set up a complete local environment:

```bash
npx hardhat run scripts/setup-local.ts --network localhost
```

#### Terminal 3: Start Backend Server

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3000`.

### 4. Code Quality

```bash
# Lint TypeScript files
npm run lint

# Format all code
npm run format

# Lint Solidity files
npx solhint 'contracts/**/*.sol'
```

## Testing

### Smart Contract Tests

```bash
# Run all tests
npm test

# Run specific test
npx hardhat test test/Escrow.test.ts

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npx hardhat coverage
```

### Backend Tests

```bash
cd backend
npm test
```

### SDK Tests

```bash
cd sdk
npm test
```

## Deployment

### Deploy to Testnet (Sepolia)

1. Get Sepolia ETH from a faucet
2. Configure `.env`:
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   PRIVATE_KEY=0x...
   ```
3. Deploy:
   ```bash
   npm run deploy:sepolia
   ```

### Deploy to Mainnet

⚠️ **WARNING**: Deploying to mainnet requires real ETH!

```bash
npm run deploy:mainnet
```

### Verify Contracts

After deployment, verify on block explorer:

```bash
npx hardhat run scripts/verify.ts --network sepolia
```

## Project Structure

```
kuberna-labs/
├── contracts/          # Solidity smart contracts
├── test/              # Smart contract tests
│   └── helpers/       # Test utilities
├── scripts/           # Deployment scripts
├── backend/           # Backend API
│   ├── src/          # TypeScript source
│   └── prisma/       # Database schema
├── sdk/              # TypeScript SDK
│   └── src/          # SDK source
├── frontend/         # Web UI
└── examples/         # Example implementations
```

## Common Commands

```bash
# Smart Contracts
npm run compile          # Compile contracts
npm test                 # Run tests
npm run clean            # Clean artifacts
npm run node             # Start local node
npm run deploy:local     # Deploy to local node

# Code Quality
npm run lint             # Lint TypeScript
npm run format           # Format code

# Backend
cd backend
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run tests

# SDK
cd sdk
npm run build            # Build SDK
npm test                 # Run tests
```

## Useful Hardhat Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local node
npx hardhat node

# Deploy to network
npx hardhat run scripts/deploy.ts --network <network>

# Verify contract
npx hardhat verify --network <network> <address> <constructor-args>

# Get accounts
npx hardhat accounts

# Clean artifacts
npx hardhat clean

# Check contract size
npx hardhat size-contracts
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# Deployment
PRIVATE_KEY=0x...

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# API Keys
COINMARKETCAP_API_KEY=your_key
INFURA_API_KEY=your_key
ALCHEMY_API_KEY=your_key

# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/kuberna
JWT_SECRET=your_secret
REDIS_HOST=localhost
NATS_URL=nats://localhost:4222

# External Services
STRIPE_SECRET_KEY=sk_test_...
PHALA_API_KEY=your_key
MARLIN_API_KEY=your_key
```

## Troubleshooting

### Contract Compilation Errors

```bash
npm run clean
npm run compile
```

### Node Version Issues

Hardhat works best with Node.js LTS versions (18.x or 20.x). If you see warnings, consider using nvm:

```bash
nvm install 20
nvm use 20
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql $DATABASE_URL

# Run migrations
cd backend
npx prisma migrate dev
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com)

## Support

- GitHub Issues: <repository-url>/issues
- Documentation: See `SETUP.md` for detailed setup instructions
- Project Status: See `PROJECT_STATUS.md` for current progress

## Next Steps

1. ✅ Environment is set up
2. 📝 Read `SETUP.md` for detailed configuration
3. 🔨 Start implementing smart contracts (Task 2+)
4. 🧪 Write comprehensive tests
5. 🚀 Deploy to testnet
6. 🎯 Build backend services
7. 📦 Develop SDK
8. 🌐 Create frontend

Happy coding! 🚀
