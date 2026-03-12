# Deployment Guide

This guide covers deploying Kuberna Labs to testnet and mainnet environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)

## Prerequisites

### Required Tools

- Node.js 18.x or higher
- npm or yarn
- Hardhat
- Git
- Access to RPC providers (Alchemy, Infura, etc.)
- Deployer wallet with sufficient funds

### Required Accounts

- Ethereum wallet with ETH for gas
- Etherscan API key (for verification)
- Polygonscan API key
- Arbiscan API key
- Cloud provider account (AWS, GCP, or Azure)
- Domain name (for production)

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/kawacukennedy/kuberna-labs.git
cd kuberna-labs
```

### 2. Install Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../sdk && npm install
```

### 3. Configure Environment Variables

Create `.env` file in the root directory:

```bash
# Network RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY

# Testnet RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY

# Deployer Private Key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Block Explorer API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key

# Chainlink Price Feed Addresses
ETHEREUM_ETH_USD_FEED=0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
POLYGON_MATIC_USD_FEED=0xAB594600376Ec9fD91F8e885dADF0CE036862dE0

# Backend Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/kuberna
REDIS_URL=redis://localhost:6379
NATS_URL=nats://localhost:4222

# TEE Configuration
PHALA_ENDPOINT=https://api.phala.network
PHALA_API_KEY=your_phala_api_key
MARLIN_ENDPOINT=https://api.marlin.org
MARLIN_API_KEY=your_marlin_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# API Keys
API_KEY_SALT=your_api_key_salt
```

## Smart Contract Deployment

### Testnet Deployment

#### 1. Compile Contracts

```bash
npx hardhat compile
```

#### 2. Run Tests

```bash
npx hardhat test
```

#### 3. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

#### 4. Verify Contracts

```bash
npx hardhat run scripts/verify.ts --network sepolia
```

#### 5. Deploy to Other Testnets

```bash
# Polygon Mumbai
npx hardhat run scripts/deploy.ts --network mumbai

# Arbitrum Sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

### Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment requires careful preparation and auditing.

#### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Smart contracts audited by reputable firm
- [ ] Bug bounty program launched
- [ ] Testnet deployment successful
- [ ] Documentation complete
- [ ] Emergency procedures documented
- [ ] Multi-sig wallet configured
- [ ] Sufficient ETH for deployment

#### 1. Deploy to Ethereum Mainnet

```bash
npx hardhat run scripts/deploy.ts --network ethereum
```

#### 2. Verify on Etherscan

```bash
npx hardhat run scripts/verify.ts --network ethereum
```

#### 3. Deploy to Polygon Mainnet

```bash
npx hardhat run scripts/deploy.ts --network polygon
```

#### 4. Deploy to Arbitrum Mainnet

```bash
npx hardhat run scripts/deploy.ts --network arbitrum
```

### Post-Contract Deployment

1. **Save Contract Addresses**: Update `deployed-contracts.json`
2. **Transfer Ownership**: Transfer to multi-sig wallet
3. **Configure Contracts**: Set up initial parameters
4. **Test Integration**: Verify all contracts work together

## Backend Deployment

### Development Environment

```bash
cd backend
npm run dev
```

### Production Deployment

#### Using Docker

1. **Build Docker Image**

```bash
cd backend
docker build -t kuberna-backend:latest .
```

2. **Run Container**

```bash
docker run -d \
  --name kuberna-backend \
  -p 3000:3000 \
  --env-file .env \
  kuberna-backend:latest
```

#### Using PM2

1. **Install PM2**

```bash
npm install -g pm2
```

2. **Start Backend**

```bash
cd backend
pm2 start npm --name "kuberna-backend" -- start
```

3. **Configure Auto-Restart**

```bash
pm2 startup
pm2 save
```

#### Using Cloud Providers

##### AWS Elastic Beanstalk

```bash
eb init kuberna-backend
eb create kuberna-production
eb deploy
```

##### Google Cloud Run

```bash
gcloud run deploy kuberna-backend \
  --source . \
  --platform managed \
  --region us-central1
```

##### Azure App Service

```bash
az webapp up \
  --name kuberna-backend \
  --resource-group kuberna-rg \
  --runtime "NODE|18-lts"
```

### Database Setup

#### PostgreSQL

```bash
# Create database
createdb kuberna

# Run migrations
cd backend
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

#### Redis

```bash
# Start Redis
redis-server

# Or using Docker
docker run -d --name redis -p 6379:6379 redis:latest
```

#### NATS

```bash
# Using Docker
docker run -d --name nats -p 4222:4222 nats:latest
```

### Blockchain Listener

```bash
cd backend
npm run start:listener
```

Or with PM2:

```bash
pm2 start npm --name "blockchain-listener" -- run start:listener
```

## Frontend Deployment

### Build for Production

```bash
cd frontend
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Deploy to AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Post-Deployment

### 1. Verify Deployment

- [ ] Smart contracts deployed and verified
- [ ] Backend API responding
- [ ] Frontend accessible
- [ ] Database connected
- [ ] Blockchain listener running
- [ ] All services healthy

### 2. Configure DNS

Point your domain to the deployed services:

```
api.kuberna.io -> Backend API
app.kuberna.io -> Frontend
```

### 3. Set Up SSL/TLS

Use Let's Encrypt or your cloud provider's certificate manager.

### 4. Configure Monitoring

Set up monitoring for:
- API uptime
- Smart contract events
- Database performance
- Error rates
- Gas costs

### 5. Set Up Alerts

Configure alerts for:
- Service downtime
- High error rates
- Large withdrawals
- Failed transactions
- Database issues

## Monitoring

### Application Monitoring

#### Datadog

```bash
# Install Datadog agent
DD_API_KEY=your_api_key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_sh.sh)"
```

#### New Relic

```bash
npm install newrelic
# Add newrelic.js configuration
```

### Smart Contract Monitoring

Use services like:
- Tenderly
- Defender (OpenZeppelin)
- Blocknative

### Log Aggregation

#### ELK Stack

```bash
docker-compose up -d elasticsearch logstash kibana
```

#### CloudWatch (AWS)

Configure CloudWatch agent on EC2 instances.

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

## Rollback Procedures

### Backend Rollback

```bash
# Using PM2
pm2 list
pm2 restart kuberna-backend@previous

# Using Docker
docker run -d kuberna-backend:previous-tag
```

### Frontend Rollback

```bash
# Vercel
vercel rollback

# Netlify
netlify rollback
```

### Smart Contract Rollback

⚠️ Smart contracts cannot be rolled back. Use:
- Emergency pause functionality
- Upgrade proxy patterns (if implemented)
- Deploy new version and migrate

## Security Checklist

- [ ] Private keys secured (never in code)
- [ ] Environment variables encrypted
- [ ] API rate limiting enabled
- [ ] CORS configured properly
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented

## Troubleshooting

### Common Issues

**Contract deployment fails**
- Check gas price and limit
- Verify sufficient ETH in deployer wallet
- Check RPC endpoint is responding

**Backend won't start**
- Verify environment variables
- Check database connection
- Verify Redis and NATS are running

**Frontend build fails**
- Clear node_modules and reinstall
- Check for TypeScript errors
- Verify environment variables

## Support

For deployment support:
- Discord: https://discord.gg/kuberna
- Email: support@kuberna.io
- Documentation: https://docs.kuberna.io
