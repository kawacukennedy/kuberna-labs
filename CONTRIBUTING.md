# Contributing to Kuberna Labs

First off, thank you for considering contributing to Kuberna Labs. It's people like you that make Kuberna Labs a vibrant mechanism for the agentic Web3 enterprise.

## Where do I go from here?

If you've noticed a bug or have a question, see if it is already addressed by [searching our issues](https://github.com/kawacukennedy/kuberna-labs/issues). If not, [submit a bug report or feature request](#how-to-submit-an-issue).

## How to Submit an Issue

When submitting an issue, please try to include as much detail as possible to help us reproduce or understand the problem:

- The version of the project you are using.
- A clear, concise description of the bug or feature request.
- Step-by-step instructions (if a bug) to reproduce the problem.
- Any relevant logs or screenshots.

## How to Submit a Pull Request

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally.
3. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b your-feature-name
   ```
4. **Implement your changes**. Be sure to continuously write and run tests to make sure your modifications are safe.
5. **Commit your changes**. Use descriptive, semantic commit messages (e.g., `feat: integrate zkTLS` or `fix: correct dispute timeout`).
6. **Push the branch** to your fork:
   ```bash
   git push origin your-feature-name
   ```
7. **Submit a Pull Request** to the `main` branch of the upstream repository.

## Developer Guidelines
- **Smart Contracts:** Ensure you run `npx hardhat test` before committing. Contracts heavily rely on EIP-712 paradigms; verify typings and signatures.
- **Backend:** Verify your routes in the `backend/src/routes`. Utilize our standard `express` response interceptors for standardized output formatting.
- **Code Style:** We use ESLint and Prettier. Don't forget to run `npm run lint` and `npm run format`.

## Code of Conduct
Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
