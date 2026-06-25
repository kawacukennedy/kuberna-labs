# Security Policy

## Reporting a Vulnerability

We take the security of Kuberna Labs seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **security@kubernalabs.com** (if available) or by opening a [draft security advisory](https://github.com/kawacukennedy/kuberna-labs/security/advisories/new) on GitHub.

You should receive a response within 48 hours. If you don't, please follow up to ensure we received your message.

### What to Include

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgement:** We'll acknowledge receipt within 48 hours
- **Initial Assessment:** We'll assess the severity and impact
- **Fix Timeline:** Critical issues are prioritized and typically fixed within 7 days
- **Disclosure:** We'll coordinate disclosure with you

## Smart Contract Security

For vulnerabilities in deployed smart contracts, please include:

- Contract address and network
- Transaction hash if applicable
- Whether the vulnerability has been exploited
- Estimated at-risk funds

## Responsible Disclosure

We kindly ask that you:

- Give us a reasonable time to fix the issue before any public disclosure
- Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our services
- Do not exploit the vulnerability beyond what is necessary to demonstrate the issue

## Scope

This security policy covers:

- Smart contracts in `contracts/`
- Backend API in `backend/`
- Frontend application in `frontend/`
- SDK packages in `sdk/` and `packages/`
- Infrastructure configurations

## Bug Bounty

There is currently no formal bug bounty program. Critical vulnerabilities may be eligible for discretionary rewards on a case-by-case basis.

## Security-Related Configuration

### Production Deployments

- **Environment variables:** Never commit secrets to the repository. Use `.env` files locally and secrets management in production.
- **Wallet private keys:** Backend wallets should have minimal funds and be rotated regularly.
- **Database:** Use connection pooling (e.g., Supabase pooler) and enable SSL/TLS.
- **Smart contracts:** All contracts are audited before mainnet deployment. Use verified Etherscan contracts.

## Known Security Considerations

- Smart contracts use OpenZeppelin's audited base implementations
- Rate limiting is enforced on all API endpoints
- JWT tokens have configurable expiry
- CORS is restricted in production
- Prisma is configured with parameterized queries to prevent SQL injection

## Version Support

| Version               | Supported  |
| --------------------- | ---------- |
| >= 1.0.0              | ✅         |
| < 1.0.0 (pre-release) | ⚠️ Limited |

## Contact

- **Email:** security@kubernalabs.com
- **GitHub Security Advisories:** https://github.com/kawacukennedy/kuberna-labs/security/advisories
