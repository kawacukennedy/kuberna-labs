# Contributing to Kuberna Labs

First off, thank you for considering contributing to Kuberna Labs! It's people like you that make Kuberna a powerful tool for building the Agentic Web3 Enterprise.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### 1. Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/kawacukennedy/kuberna-labs/issues) to see if someone else in the community has already created a ticket. If not, go ahead and make one!

### 2. Types of Contributions

We welcome many types of contributions:

- **Bug fixes**: Fix issues in smart contracts, backend services, or frontend
- **New features**: Add new functionality to any component
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize gas usage or backend performance
- **Security**: Identify and fix security vulnerabilities

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Installation

1. Fork the repository
2. Clone your fork:
```sh
git clone https://github.com/YOUR_USERNAME/kuberna-labs.git
cd kuberna-labs
```

3. Install dependencies:
```sh
npm install
```

4. Set up environment variables:
```sh
cp .env.example .env
# Edit .env with your configuration
```

5. Compile smart contracts:
```sh
npx hardhat compile
```

6. Run tests to verify setup:
```sh
npm test
```

## How to Contribute

### 1. Fork & Create a Branch

Fork Kuberna Labs and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-solana-adapter
```

Branch naming conventions:
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `test/description` - Test additions/changes
- `refactor/description` - Code refactoring
- `perf/description` - Performance improvements

### 2. Implement Your Changes

At this point, you're ready to make your changes. Feel free to ask for help; everyone is a beginner at first!

#### Smart Contract Changes

- Follow Solidity best practices
- Add comprehensive tests
- Optimize for gas efficiency
- Include NatSpec comments
- Run `npx hardhat test` before committing

#### Backend Changes

- Follow TypeScript best practices
- Add unit tests
- Update API documentation if needed
- Run `npm test` in the backend directory

#### Frontend Changes

- Follow React best practices
- Ensure responsive design
- Add component tests
- Run `npm test` in the frontend directory

### 3. Write Tests

All new features and bug fixes must include tests:

- **Smart Contracts**: Write Hardhat tests in `test/`
- **Backend**: Write Jest tests in `backend/src/**/__tests__/`
- **Frontend**: Write React Testing Library tests

### 4. Update Documentation

If your changes affect how users interact with Kuberna:

- Update README.md if needed
- Update API.md for API changes
- Update ARCHITECTURE.md for architectural changes
- Add inline code comments
- Update JSDoc/NatSpec comments

## Coding Standards

### General

- Use meaningful variable and function names
- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer `const` over `let`
- Use async/await over promises
- Handle errors appropriately

### Solidity

- Follow Solidity style guide
- Use OpenZeppelin contracts when possible
- Optimize for gas efficiency
- Include comprehensive NatSpec comments
- Use events for state changes
- Implement access control
- Add reentrancy protection where needed

### Git Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

Example:
```
feat(contracts): add Pausable functionality to Escrow contract

- Add emergency pause mechanism
- Implement whenNotPaused modifier
- Add tests for pause functionality

Closes #123
```

## Testing Guidelines

### Running Tests

```sh
# All tests
npm test

# Smart contract tests
npx hardhat test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Coverage
npm run coverage
```

### Writing Tests

- Write descriptive test names
- Test happy paths and edge cases
- Test error conditions
- Mock external dependencies
- Aim for >80% code coverage

## Pull Request Process

### 1. Update Your Branch

Make sure your branch is up to date with the main branch:

```sh
git remote add upstream https://github.com/kawacukennedy/kuberna-labs.git
git checkout main
git pull upstream main
git checkout your-branch-name
git rebase main
```

### 2. Push Your Changes

```sh
git push origin your-branch-name
```

### 3. Create Pull Request

1. Go to GitHub and create a Pull Request
2. Fill out the PR template completely
3. Link related issues
4. Request review from maintainers

### 4. Code Review

- Address all review comments
- Keep discussions focused and professional
- Update your PR based on feedback
- Re-request review after making changes

### 5. Merge

Once approved, a maintainer will merge your PR. Congratulations! 🎉

## Community

### Getting Help

- **Discord**: Join our [Discord server](https://discord.gg/kuberna)
- **GitHub Discussions**: Ask questions in [Discussions](https://github.com/kawacukennedy/kuberna-labs/discussions)
- **Twitter**: Follow [@Arnaud_Kennedy](https://twitter.com/Arnaud_Kennedy)

### Recognition

Contributors will be:
- Listed in our README
- Mentioned in release notes
- Eligible for contributor NFTs (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
