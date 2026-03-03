<div align="center">
  <img src="/images/kuberna-logo.svg" alt="Kuberna Labs Logo" width="200"/>
  <h1>Kuberna Labs</h1>
  <p><strong>Architecting the Agentic Web3 Enterprise</strong></p>
</div>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
  </a>
</p>

## 🚀 About Kuberna Labs

Kuberna Labs is a hybrid educational and technological platform designed to empower developers and enterprises to build, deploy, and manage autonomous AI agents operating across decentralized networks. 

Our mission is to equip the next generation of founders and enterprises with the tools, knowledge, and secure infrastructure required to build revenue-generating autonomous agents that operate at machine speed across any blockchain.

## ✨ Features

- **🎓 Educational Platform**: Access comprehensive courses, live workshops, and coding labs with ephemeral TEE-based environments.
- **🤖 Agent Builder IDE**: A built-in browser IDE for writing, testing, and debugging ElizaOS agents with automated sandbox environments.
- **💼 Intent Marketplace**: Discover, bid on, and execute cross-chain tasks and workflows via decentralized NLP-parsed intents.
- **🛡️ Secure Execution & TEE**: Deploy agents directly into Trusted Execution Environments (Intel TDX, Phala, AMD SEV) for cryptographic privacy and remote attestation.
- **🔗 Multi-chain Adapters**: Native integration with Ethereum, Solana, NEAR, Arbitrum, and Polygon.
- **🌍 zkTLS Integration**: Zero-knowledge verification of Web2 data using Reclaim Protocol and zkPass.

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity, Hardhat, Ethers.js, ERC-7683 Intents.
- **Backend API**: Node.js, Express, TypeScript, Prisma, PostgreSQL.
- **Workflows**: NATS stream, BullMQ, Redis.
- **Containerization**: Docker, Phala Enclaves.

## 📦 Installation & Setup

### Prerequisites
- Node.js (>= v20.0.0)
- PostgreSQL
- Redis
- Hardhat

### 1. Smart Contracts
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### 2. Backend Services
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Build and test the project
npm run build
npm run test
```

## 📜 Smart Contracts Overview

Our core contracts include:
- `Escrow.sol`: Manages funds specifically securely locked until agents submit a verified proof of completion.
- `IntentProtocol.sol`: Routes natural language tasks into verifiable cross-chain intents and handles solver bidding.
- `AgentRegistry.sol`: Registers and manages agents operating on the network.
- `Reputation.sol`: Dynamic reputation calculation tracking solver success rates and speeds.

## 🤝 Contributing

We welcome contributions from the community! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## 🛡️ Security

If you discover any security related issues, please review our [SECURITY.md](./SECURITY.md) guidelines and email security@kubernalabs.com instead of using the issue tracker.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

*Architected by the Kuberna Labs Team - Kigali, Rwanda.*