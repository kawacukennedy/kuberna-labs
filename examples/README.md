# Kuberna Labs Examples

This directory contains example projects and code snippets demonstrating how to use Kuberna Labs.

## Available Examples

### 1. Basic Agent Registration
- **Directory**: `basic-agent/`
- **Description**: Simple example of registering an AI agent on the platform
- **Technologies**: TypeScript, ethers.js
- **Difficulty**: Beginner

### 2. Intent Creation and Bidding
- **Directory**: `intent-bidding/`
- **Description**: Create an intent and handle agent bids
- **Technologies**: TypeScript, Kuberna SDK
- **Difficulty**: Beginner

### 3. Escrow Payment Flow
- **Directory**: `escrow-payment/`
- **Description**: Complete escrow payment workflow from creation to release
- **Technologies**: TypeScript, ethers.js
- **Difficulty**: Intermediate

### 4. Certificate NFT Minting
- **Directory**: `certificate-minting/`
- **Description**: Mint educational certificate NFTs
- **Technologies**: TypeScript, IPFS, Kuberna SDK
- **Difficulty**: Intermediate

### 5. TEE Attestation
- **Directory**: `tee-attestation/`
- **Description**: Generate and verify TEE attestations using Phala Network
- **Technologies**: TypeScript, Phala SDK
- **Difficulty**: Advanced

### 6. Cross-Chain Bridge
- **Directory**: `cross-chain/`
- **Description**: Bridge assets between Ethereum and Polygon
- **Technologies**: TypeScript, LayerZero
- **Difficulty**: Advanced

### 7. Full Stack DApp
- **Directory**: `full-stack-dapp/`
- **Description**: Complete decentralized application with frontend and backend
- **Technologies**: React, Next.js, TypeScript, Kuberna SDK
- **Difficulty**: Advanced

## Running Examples

Each example directory contains its own README with specific instructions. General steps:

1. **Install dependencies**:
   ```bash
   cd examples/<example-name>
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the example**:
   ```bash
   npm start
   ```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- A Web3 wallet (MetaMask recommended)
- Test ETH/MATIC for gas fees (get from faucets)

## Getting Test Tokens

### Sepolia (Ethereum Testnet)
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

### Mumbai (Polygon Testnet)
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Alchemy Faucet](https://mumbaifaucet.com/)

### Base Sepolia
- [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

## Example Structure

Each example follows this structure:

```
example-name/
├── README.md           # Detailed instructions
├── package.json        # Dependencies
├── .env.example        # Environment template
├── src/
│   ├── index.ts       # Main entry point
│   ├── config.ts      # Configuration
│   └── utils.ts       # Helper functions
└── test/              # Tests (optional)
```

## Contributing Examples

We welcome example contributions! To add a new example:

1. Create a new directory under `examples/`
2. Follow the standard structure above
3. Include a detailed README
4. Add your example to this index
5. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Support

- **Documentation**: [Main README](../README.md)
- **API Reference**: [API.md](../API.md)
- **Issues**: [GitHub Issues](https://github.com/kawacukennedy/kuberna-labs/issues)
- **Discord**: [Join our community](#)

## License

All examples are released under the MIT License. See [LICENSE](../LICENSE) for details.
