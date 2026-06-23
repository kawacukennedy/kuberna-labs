# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Interactive Plotly circuit visualization (PR #1284)
- `@kuberna/aip-adapter` npm package for AIP protocol integration
- Cross-chain identity management system (SDK module + backend routes)
- Agent certificate auto-issuance via SilentVerify on task completion
- Identity API routes (register, resolve, certs, passport, verify)
- AgentService for SilentVerify cert issuance and passport composition
- `AgentCertificate` and `CrossChainIdentity` database models
- CI workflow with lint, test, security audit, and build stages
- Render blueprint deployment configuration (`render.yaml`)
- Docker Compose setup for local development

### Changed

- CI: Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` env var across all workflows for Node.js 24 migration
- CI: Moved `getPastVotes` visibility from external to public to fix compilation
- CI: Updated `expireAndRefund` test expectations after CRIT-1 status check change
- Contracts: Moved custom errors inside contracts to fix Solidity docstring parser
- Contracts: Audit fixes for CRIT-1 through CRIT-5 and ENV-1, ENV-2
- Backend: Fixed `web3Address` lookup in identity route
- Backend: Resolved Prisma runtime error in Render deployment

### Fixed

- Smart contract Solidity docstring parser compatibility
- Prisma migration ordering for new AgentCertificate and CrossChainIdentity models
- CI lint and build failures across multiple workflows

## [0.1.0] - 2026-05-01

### Added

- Initial monorepo setup with backend, frontend, SDK, and contracts
- Solidity smart contracts: Escrow, Intent, AgentRegistry, CertificateNFT, ReputationNFT, CrossChainRouter, Payment, Subscription, Treasury
- Express + Prisma backend with REST API (19 route modules)
- Next.js 14 frontend dashboard with WalletConnect integration
- `@kuberna/sdk` TypeScript SDK for programmatic access
- Natural language intent parsing with local AI (zero-dependency mode)
- Agent decision engine for arbitrage, yield optimization, and stop-loss
- On-chain escrow with dispute resolution
- Post-quantum SilentVerify certification
- Intel SGX TEE support
- Hardhat deployment scripts for Ethereum, Base, Polygon, Arbitrum
- Kite x402 micro-payment support
- Comprehensive test suite (smart contracts, backend, frontend, SDK)
- ESLint + Prettier + Solhint code quality pipeline
- Security audit workflows (npm audit, Slither)
