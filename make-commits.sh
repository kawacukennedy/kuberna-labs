#!/bin/bash

# Navigate to the root directory
cd /Volumes/RCA/kubernalabs

# Commit 1: Spec configuration
git add .kiro/specs/web3-infrastructure/.config.kiro
git commit -m "feat(spec): add web3-infrastructure spec configuration"

# Commit 2: Spec design document
git add .kiro/specs/web3-infrastructure/design.md
git commit -m "feat(spec): add comprehensive web3 infrastructure design document"

# Commit 3: Spec requirements document
git add .kiro/specs/web3-infrastructure/requirements.md
git commit -m "feat(spec): add web3 infrastructure requirements with 50 user stories"

# Commit 4: Spec tasks document
git add .kiro/specs/web3-infrastructure/tasks.md
git commit -m "feat(spec): add web3 infrastructure implementation tasks (28 tasks)"

# Commit 5: Project documentation
git add PROJECT_STATUS.md QUICK_START.md SETUP.md
git commit -m "docs: add project status, quick start, and setup guides"

# Commit 6: Linting and formatting configuration
git add .eslintrc.json .prettierrc.json .prettierignore .solhint.json
git commit -m "chore: add ESLint, Prettier, and Solhint configuration"

# Commit 7: Environment configuration
git add .env.example .gitignore
git commit -m "chore: update environment configuration and gitignore"

# Commit 8: Hardhat configuration
git add hardhat.config.ts
git commit -m "feat(contracts): update Hardhat configuration for multi-chain deployment"

# Commit 9: Root package.json
git add package.json package-lock.json
git commit -m "chore: update root package.json with new dependencies"

# Commit 10: Escrow contract enhancements
git add contracts/Escrow.sol
git commit -m "feat(contracts): add Pausable functionality to Escrow contract"

# Commit 11: Intent contract enhancements
git add contracts/Intent.sol
git commit -m "feat(contracts): add Pausable functionality to Intent contract"

# Commit 12: Deployment scripts
git add scripts/deploy.ts scripts/verify.ts scripts/setup-local.ts scripts/verify-setup.ts
git commit -m "feat(scripts): add deployment, verification, and setup scripts"

# Commit 13: Test helpers
git add test/helpers/propertyTestHelpers.ts
git commit -m "test: add property-based testing helpers"

# Commit 14: Backend package.json
git add backend/package.json
git commit -m "feat(backend): add backend dependencies for services"

# Commit 15: Backend linting configuration
git add backend/.eslintrc.json backend/.prettierrc.json
git commit -m "chore(backend): add ESLint and Prettier configuration"

# Commit 16: Backend environment configuration
git add backend/.env.example
git commit -m "chore(backend): add backend environment configuration"

# Commit 17: Contract ABIs
git add backend/src/utils/abis.ts
git commit -m "feat(backend): add contract ABIs for all smart contracts"

# Commit 18: Payment Service implementation
git add backend/src/services/payment.ts
git commit -m "feat(backend): implement Payment Service with multi-chain support"

# Commit 19: Payment Service tests
git add backend/src/services/__tests__/payment.test.ts
git commit -m "test(backend): add Payment Service unit tests"

# Commit 20: TEE Service implementation
git add backend/src/services/tee.ts
git commit -m "feat(backend): implement TEE Service with Phala and Marlin integration"

# Commit 21: TEE Service tests
git add backend/src/services/__tests__/tee.test.ts
git commit -m "test(backend): add TEE Service unit tests"

# Commit 22: TEE Service usage example
git add backend/src/services/__tests__/tee-usage-example.ts
git commit -m "docs(backend): add TEE Service usage examples"

# Commit 23: TEE Service documentation
git add backend/src/services/TEE_SERVICE_IMPLEMENTATION.md
git commit -m "docs(backend): add TEE Service implementation documentation"

# Commit 24: Blockchain Listener implementation
git add backend/src/services/blockchainListener.ts
git commit -m "feat(backend): implement Blockchain Listener with WebSocket and polling"

# Commit 25: Blockchain Listener tests
git add backend/src/services/__tests__/blockchainListener.test.ts
git commit -m "test(backend): add Blockchain Listener unit tests"

# Commit 26: Blockchain Listener configuration
git add backend/src/config/blockchainListener.config.ts
git commit -m "feat(backend): add Blockchain Listener configuration"

# Commit 27: Blockchain Listener startup script
git add backend/src/scripts/startBlockchainListener.ts
git commit -m "feat(backend): add Blockchain Listener startup script"

# Commit 28: Blockchain Listener README
git add backend/src/services/BLOCKCHAIN_LISTENER_README.md
git commit -m "docs(backend): add Blockchain Listener comprehensive documentation"

# Commit 29: Blockchain Listener integration guide
git add backend/src/services/BLOCKCHAIN_LISTENER_INTEGRATION.md
git commit -m "docs(backend): add Blockchain Listener integration guide"

# Commit 30: Blockchain Listener summary
git add backend/src/services/BLOCKCHAIN_LISTENER_SUMMARY.md
git commit -m "docs(backend): add Blockchain Listener implementation summary"

# Push all commits to GitHub
git push origin main

echo "✅ Successfully created 30 commits and pushed to GitHub!"
