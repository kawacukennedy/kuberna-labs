# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Web3 Infrastructure implementation with multi-chain support
- Payment Service with Ethereum, Polygon, and Arbitrum integration
- TEE Service with Phala Network and Marlin Oyster support
- Blockchain Listener with WebSocket connections and fallback polling
- zkTLS proof generation with Reclaim Protocol and zkPass
- Comprehensive smart contracts (Escrow, Intent, Payment, Attestation, etc.)
- Multi-chain adapters for cross-chain operations
- Property-based testing framework
- Deployment scripts for testnet and mainnet
- Comprehensive documentation and setup guides

### Changed
- Enhanced Escrow contract with Pausable functionality
- Enhanced Intent contract with Pausable functionality
- Updated Hardhat configuration for multi-chain deployment

### Fixed
- Gas estimation accuracy improvements
- Event deduplication in Blockchain Listener

## [0.1.0] - 2024-01-15

### Added
- Initial project structure
- Basic smart contracts (AgentRegistry, CertificateNFT, CourseNFT)
- Frontend dashboard
- SDK foundation
- Documentation (README, CONTRIBUTING, CODE_OF_CONDUCT)

[Unreleased]: https://github.com/kuberna-labs/kubernalabs/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kuberna-labs/kubernalabs/releases/tag/v0.1.0
