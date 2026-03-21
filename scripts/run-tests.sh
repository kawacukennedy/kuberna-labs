#!/bin/bash
# Run all smart contract tests

echo "Running Kuberna Labs Smart Contract Tests..."
echo "=========================================="

# Run all tests
npx hardhat test

echo ""
echo "Test run complete!"
