# Smart Contract Tests

This directory contains comprehensive test suites for all Kuberna Labs smart contracts.

## Test Coverage

| Contract | Tests | Description |
|----------|-------|-------------|
| Escrow | 40 | Fund management, disputes, auto-release |
| Intent | 44 | Task posting, bidding, completion |
| AgentRegistry | 25 | Agent registration, tools, status |
| ReputationNFT | 26 | Scoring, badges, decay |
| Dispute | 26 | Jury voting, appeals, resolution |
| CertificateNFT | 21 | Course completion, verification |

## Running Tests

```bash
# Run all tests
npx hardhat test

# Run specific contract tests
npx hardhat test test/Escrow.ts
npx hardhat test test/Intent.ts
npx hardhat test test/AgentRegistry.ts
```

## Test Structure

- Each contract has its own test file
- Tests use Hardhat's testing framework with Ethers v6
- Tests are organized by contract functionality
- Event emissions are verified for key state changes

## Coverage

Total: **193 passing tests** across all contracts.
