# Contributing to Kuberna Labs

Thank you for considering contributing. This document outlines the development workflow, code standards, and PR process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Code Review](#code-review)

## Code of Conduct

This project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL 14+ (or Supabase account for managed DB)
- Git
- WalletConnect Project ID (free at https://cloud.walletconnect.com)

### Setup Steps

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/kuberna-labs.git
cd kuberna-labs

# 2. Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd sdk && npm install && cd ..

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env: set DATABASE_URL, DIRECT_URL, JWT_SECRET

# 4. Set up database
cd backend && npx prisma migrate dev && cd ..

# 5. Compile contracts (optional, for contract work)
npm run compile

# 6. Verify setup
cd backend && npm test && cd ..
```

### Branch Naming

```
feat/description     # New features
fix/description      # Bug fixes
docs/description     # Documentation
test/description     # Test additions/changes
refactor/description # Code refactoring
perf/description     # Performance improvements
chore/description    # Build/tooling changes
```

## Code Style

### TypeScript

- Strict mode enabled in all `tsconfig.json` files
- All files must pass TypeScript compilation (`tsc --noEmit`)
- Prefer `const` over `let`
- Use `async/await` over raw promises
- Use explicit return types on public function signatures
- Use Zod schemas for runtime validation (backend)
- No `any` — use `unknown` and type narrowing instead

### Formatting

- **Prettier** is enforced via `.prettierrc.json` and CI
- Run before committing: `npm run format`
- 100 character print width, single quotes, trailing commas
- Solidity files formatted with `prettier-plugin-solidity`

### Linting

- ESLint with `@typescript-eslint` rules
- `solhint` for Solidity files
- Run: `npm run lint`

### Solidity

- Solidity ^0.8.20 with optimizer enabled (200 runs)
- Use OpenZeppelin contracts for standards (ERC20, ERC721, Ownable, Pausable, ReentrancyGuard)
- Include NatSpec comments (`@title`, `@dev`, `@param`, `@return`)
- Use custom errors instead of `require` with string messages
- Add reentrancy protection where needed
- Emit events for all state-changing operations

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

### Types

| Type       | Usage                                   |
| ---------- | --------------------------------------- |
| `feat`     | New feature                             |
| `fix`      | Bug fix                                 |
| `docs`     | Documentation only                      |
| `style`    | Code style (formatting, semicolons)     |
| `refactor` | Code change that neither fixes nor adds |
| `perf`     | Performance improvement                 |
| `test`     | Adding or fixing tests                  |
| `chore`    | Build process, dependencies, tooling    |

### Scopes

`backend`, `frontend`, `sdk`, `contracts`, `prisma`, `ci`, `deps`, `docs`

### Examples

```
feat(contracts): add Pausable to Escrow with emergency pause

- Add whenNotPaused modifier to all state-changing functions
- Implement pause/unpause with onlyOwner access
- Add tests for pause functionality during active escrows

Closes #123
```

```
fix(backend): handle null agent config in orchestrator

Agent orchestrator crashes when config is null after deployment.
Add null check before accessing config properties.

Fixes #456
```

## Pull Request Process

1. **Keep your branch up to date**:

   ```bash
   git remote add upstream https://github.com/kawacukennedy/kuberna-labs.git
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks locally** before pushing:

   ```bash
   npm run format:check
   npm run lint
   npm test              # Contract tests
   cd backend && npm test && cd ..
   cd frontend && npm test && cd ..
   cd sdk && npm test && cd ..
   ```

3. **Push and create a PR** with a descriptive title and body that links related issues.

4. **PR checklist**:
   - Changes include tests (unit + integration where applicable)
   - All existing tests pass
   - Code is formatted (`npm run format`)
   - No TypeScript errors (`tsc --noEmit` in each package)
   - API changes are documented (routes, request/response schemas)
   - Contract changes include gas reports

## Testing

### Requirements

- All new features must include tests
- Bug fixes must include a regression test
- Aim for >80% code coverage on changed code

### Running Tests

```bash
# Hardhat contract tests
npx hardhat test
npx hardhat coverage    # Solidity coverage

# Backend (Jest + supertest)
cd backend && npm test
cd backend && npm test -- --coverage

# Frontend (Jest + React Testing Library)
cd frontend && npm test

# SDK (Jest)
cd sdk && npm test
```

### Test Conventions

- Contract tests: `test/*.ts` using Hardhat + chai matchers
- Backend unit tests: `backend/src/__tests__/` or `backend/src/**/__tests__/`
- Frontend tests: `frontend/src/__tests__/`
- Test files mirror source file names with `.test.ts` suffix
- Mock external services (blockchain RPC, email, Stripe) in backend tests
- Use `fast-check` for property-based testing where appropriate

## Code Review

### Reviewer Responsibilities

- Verify the change solves the described problem
- Check for security concerns (input validation, access control, reentrancy)
- Ensure adequate test coverage
- Confirm documentation is updated
- Flag performance issues
- Verify TypeScript strictness is maintained

### Author Responsibilities

- Respond to all review comments
- Keep PR scope focused (one feature/fix per PR)
- Re-request review after addressing feedback
- Squash commits before merge (the project uses squash merges)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
