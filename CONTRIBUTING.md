# Contributing to Kuberna Labs

Thank you for considering contributing. This document outlines the development workflow, code standards, and PR process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Run the Project](#run-the-project)
- [Troubleshooting](#troubleshooting)
- [Reference Documentation](#reference-documentation)
- [Branch Naming](#branch-naming)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Code Review](#code-review)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold its terms.

## How to Contribute

### 🐛 Report Bugs

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Docker with Docker Compose (recommended for PostgreSQL, Redis, and NATS)
- PostgreSQL 14+ if you do not use Docker
- WalletConnect Project ID (free at https://cloud.walletconnect.com)

### 💡 Suggest Features

1. Search [existing discussions](https://github.com/kawacukennedy/kuberna-labs/discussions) for similar ideas
2. Use the [feature request template](https://github.com/kawacukennedy/kuberna-labs/issues/new?labels=enhancement&template=feature_request.md)
3. Explain the problem you're solving and how the feature would work

### 🛠️ Submit Code Changes

#### 1. Find or Create an Issue

- Start with [`good first issue`](https://github.com/kawacukennedy/kuberna-labs/labels/good%20first%20issue) or [`help wanted`](https://github.com/kawacukennedy/kuberna-labs/labels/help%20wanted) labels
- Comment on the issue to let others know you're working on it
- For new work, open an issue first to discuss before writing code

#### 2. Set Up Your Environment

```bash
# Clone the repo
git clone https://github.com/kawacukennedy/kuberna-labs.git
cd kuberna-labs

# 2. Install root and workspace dependencies from the lockfile
npm ci

# 3. Start local infrastructure
docker compose up -d postgres redis nats
docker compose ps

# 4. Configure backend and frontend environments
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 5. Generate the Prisma client
npm --prefix backend run db:generate

# 6. Create the local database schema
npm --prefix backend run db:push

# 7. Verify all four test suites
npm test
```

The root `npm ci` command installs the `backend`, `frontend`, and `sdk` workspaces. You do
not need to run a separate install in each directory.

### Environment Configuration

For the Docker services above, set these values in `backend/.env`:

```dotenv
DATABASE_URL=postgresql://kuberna:kuberna_dev_password@localhost:5432/kuberna
DIRECT_URL=postgresql://kuberna:kuberna_dev_password@localhost:5432/kuberna
REDIS_URL=redis://localhost:6379
NATS_URL=nats://localhost:4222
JWT_SECRET=replace-with-a-local-secret-at-least-16-characters
```

Generate a local JWT secret with `openssl rand -hex 32`. Do not commit either environment
file. External API, wallet, and RPC credentials are optional unless the feature you are
working on requires them.

The frontend defaults to the backend at `http://localhost:3000`. Add a real
`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to `frontend/.env.local` only when testing wallet
connections.

### Database Changes

Use `db:push` to create a disposable local database from the current Prisma schema. If your
contribution changes `backend/prisma/schema.prisma`, create and review a migration instead:

```bash
npm --prefix backend run db:migrate -- --name short_description
npm --prefix backend run db:generate
```

Commit the generated migration together with the schema change. See
[`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for a managed PostgreSQL setup.

### Local Smart Contract Deployment

Start the local Hardhat network in one terminal:

```bash
npm run node
```

Deploy the contracts from a second terminal:

```bash
npm run deploy:local
```

The deployment writes local addresses under `deployments/`. Hardhat's displayed accounts
are public development accounts; never fund or reuse them on a live network.

## Run the Project

With the Docker services running and the environment files configured, start the backend:

```bash
npm --prefix backend run dev
```

Start the frontend in another terminal:

```bash
npm run dev
```

Run the full repository verification from the root:

```bash
npm test
npm run lint
npm run format:check
```

The root test command runs backend Jest, SDK Jest, Hardhat contract, and frontend Jest suites.
Use `npm run test:backend`, `npm run test:sdk`, `npm run test:contracts`, or
`npm run test:frontend` while iterating on one workspace.

Stop the local infrastructure when you finish:

```bash
docker compose down
```

## Troubleshooting

### Prisma reports that `DIRECT_URL` is missing

Both `DATABASE_URL` and `DIRECT_URL` are required by `backend/prisma/schema.prisma`. For local
PostgreSQL they can use the same connection string. Hosted poolers usually require a separate
direct connection; see [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

### A local port is already in use

The default services use PostgreSQL `5432`, Redis `6379`, NATS `4222`, the backend `3000`,
and Hardhat `8545`. Stop the conflicting process or change the corresponding local port before
starting the stack.

### A Docker service is not healthy

```bash
docker compose ps
docker compose logs postgres redis nats
```

Wait for PostgreSQL, Redis, and NATS to report healthy before starting the backend.

### Dependencies or generated Prisma types are stale

```bash
npm ci
npm --prefix backend run db:generate
```

### A test needs an external service

Unit tests should mock external RPC, payment, email, and AI services. Only configure real
credentials for an explicitly scoped integration test, and never commit them.

## Reference Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Backend API](docs/API.md)
- [Backend guide](backend/README.md)
- [Frontend guide](frontend/README.md)
- [SDK guide](sdk/README.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security policy](SECURITY.md)

## Branch Naming

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
git checkout -b feat/my-feature
# or
git checkout -b fix/my-bugfix
```

Branch naming:

- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation only
- `test/` — test additions or fixes
- `refactor/` — code restructuring
- `chore/` — tooling, CI, dependencies

#### 4. Make Your Changes

- Follow the existing code style (Prettier and ESLint are configured)
- Add tests for new functionality
- Update documentation as needed
- Keep pull requests focused — one feature/fix per PR

#### 5. Run Checks

```bash
# Lint
npm run lint

# Format check
npm run format:check

# Run tests
npm test

# Smart contract tests
npx hardhat test

# Build
npm run build
```

#### 6. Commit

We use conventional commits:

```
feat: add cross-chain swap intent parser
fix: handle null balance in wallet query
docs: update README with new API endpoints
test: add unit tests for VirtualsManager
```

#### 7. Open a Pull Request

- Use the [pull request template](https://github.com/kawacukennedy/kuberna-labs/blob/main/.github/pull_request_template.md)
- Link the issue your PR addresses (`Closes #123`)
- Keep the description clear and focused
- Ensure all CI checks pass

### Areas to Contribute

| Area                | Description                                        | Location                                |
| ------------------- | -------------------------------------------------- | --------------------------------------- |
| **SDK**             | TypeScript client library                          | `sdk/`                                  |
| **Smart Contracts** | Solidity contracts (Escrow, Dispute, Router, etc.) | `contracts/`                            |
| **Backend**         | Node.js API server                                 | `backend/`                              |
| **Frontend**        | Next.js dashboard                                  | (root `pages/`, `components/`)          |
| **Documentation**   | README, guides, JSDoc, NatSpec                     | `.md` files, inline docs                |
| **DevOps**          | CI/CD, Docker, Render config                       | `.github/`, `render.yaml`, `Dockerfile` |

## Getting Help

- **Discord:** [Join the server](https://discord.gg/MZvNuhpXu)
- **Discussions:** [GitHub Discussions](https://github.com/kawacukennedy/kuberna-labs/discussions)
- **Issues:** Open a question issue or tag `@kawacukennedy`

## Recognition

Contributors are listed in our Discord and may be invited as project collaborators. First-time contributors get a special role in our community.
