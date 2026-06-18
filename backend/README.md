# Kuberna Labs Backend

Express REST API server powering the Kuberna Labs platform. Handles agent orchestration, intent parsing, authentication, payments, and blockchain interaction.

## Tech Stack

| Component | Library |
|-----------|---------|
| Framework | Express 4.x |
| Language | TypeScript (strict mode) |
| ORM | Prisma 5.x |
| Validation | Zod 3.x |
| Auth | Passport (JWT + local strategies) |
| Blockchain | ethers.js 6.x + viem 2.x |
| AI/NLP | compromise (local parser), OpenAI (optional) |
| Queue | Bull (Redis) |
| Messaging | NATS |
| Payments | Stripe |
| Monitoring | Sentry + Winston |
| Testing | Jest + supertest |

## API Documentation

API routes are defined in `src/routes/` with 19 route modules:

| Route | File | Description |
|-------|------|-------------|
| `/api/auth` | `routes/auth.ts` | Register, login, refresh, logout |
| `/api/users` | `routes/users.ts` | User profile management |
| `/api/agents` | `routes/agents.ts` | Agent CRUD and lifecycle |
| `/api/agent/decide` | `routes/agentDecision.ts` | Agent decision engine |
| `/api/agent/run` | `routes/agentOrchestrator.ts` | Full agent orchestration |
| `/api/intents` | `routes/intents.ts` | Cross-chain intent CRUD |
| `/api/intents/parse` | `routes/intentParser.ts` | NL intent parsing |
| `/api/payments` | `routes/payments.ts` | Escrow payments |
| `/api/kite` | `routes/kite.ts` | Kite x402 integration |
| `/api/courses` | `routes/courses.ts` | Course management |
| `/api/workshops` | `routes/workshops.ts` | Workshop management |
| `/api/disputes` | `routes/disputes.ts` | Dispute resolution |
| `/api/compliance` | `routes/compliance.ts` | KYC/AML compliance |
| `/api/analytics` | `routes/analytics.ts` | Platform analytics |
| `/api/notifications` | `routes/notifications.ts` | Email/push notifications |
| `/api/forum` | `routes/forum.ts` | Community forum |
| `/api/api-keys` | `routes/apiKeys.ts` | API key management |
| `/api/feature-flags` | `routes/featureFlags.ts` | Feature flag management |
| `/api/identity` | `routes/identity.ts` | Cross-chain identity |

Full API reference: [docs/API.md](./docs/API.md)

### Validation

All request bodies are validated with Zod schemas in `src/validations/`. Validation errors return consistent `422` responses with field-level error details.

## Database Setup

The Prisma schema lives at `../prisma/schema.prisma` (shared across the monorepo).

### Local Development

```bash
# Generate Prisma client
cd backend && npx prisma generate

# Run migrations
cd backend && npx prisma migrate dev

# Push schema directly (without migration)
cd backend && npx prisma db push

# Seed database
cd backend && npx prisma db seed

# Open Prisma Studio
cd backend && npx prisma studio
```

### Supabase

For production, use Supabase PostgreSQL. Two connection strings are required:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Runtime queries (via PgBouncer pooler) | `postgresql://postgres.p-ref:pass@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Prisma Migrate only (bypasses pooler) | `postgresql://postgres.p-ref:pass@db.p-ref.supabase.co:5432/postgres` |

## Environment Variables

Required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (with PgBouncer) |
| `DIRECT_URL` | Direct PostgreSQL connection for migrations |
| `JWT_SECRET` | JWT signing key (`openssl rand -hex 32`) |
| `RPC_URL` | Blockchain RPC endpoint |
| `PRIVATE_KEY` | Backend wallet private key (hex, 0x-prefixed) |

Contract addresses (Base Sepolia):

| Variable | Address |
|----------|---------|
| `ESCROW_CONTRACT_ADDRESS` | `0x360ec009ba6967F5f7C53a88FAD0452C6140493d` |
| `INTENT_CONTRACT_ADDRESS` | `0xB819ab0Bac2f22e8895C66fE3aDF23aa0a65145a` |
| `AGENT_REGISTRY_CONTRACT_ADDRESS` | `0x817fB0D00f033bb2982fF44855Fb6F8AE2D41324` |
| `CERTIFICATE_NFT_CONTRACT_ADDRESS` | `0x5e42c329Ef517B495261f57054d5844EAabD3dbf` |
| `REPUTATION_NFT_CONTRACT_ADDRESS` | `0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35` |
| `CROSSCHAIN_ROUTER_CONTRACT_ADDRESS` | `0xE2924838E5914cE099e5969aD63b0C4A4eeB8BAD` |

Full list in `backend/.env.example` (18 contracts total).

Optional: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `REDIS_URL`, `SMTP_*`, `SENTRY_DSN`, `NATS_URL`.

See [Architecture Overview](../ARCHITECTURE.md) for AI parser and agent decision engine configuration.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with ts-node |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm test` | Run Jest tests |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database |
| `npm run dev:listener` | Start blockchain event listener |

## Middleware

| Middleware | File | Description |
|-----------|------|-------------|
| Auth | `middleware/auth.ts` | JWT + API key authentication |
| Validation | `middleware/validation.ts` | Zod schema validation |
| Rate Limiter | `middleware/rateLimiter.ts` | Redis-backed rate limiting |
| Error Handler | `middleware/errorHandler.ts` | Global error handler |
| Correlation ID | `middleware/correlationId.ts` | Request tracing |
| Timeout | `middleware/timeout.ts` | Request timeout handling |
| Env Validation | `middleware/envValidation.ts` | Startup env check |

## Services Architecture

Key services in `src/services/`:

| Service | File | Description |
|---------|------|-------------|
| Agent Orchestrator | `agentOrchestrator.ts` | Full agent task pipeline |
| Agent Decision | `agentDecision.ts` | Strategy evaluation engine |
| Intent Parser | `intentParser.ts` | NL-to-structured intent (local NLP) |
| AI | `ai.ts` | OpenAI GPT-4 integration |
| Local Memory / RAG | `localMemory.ts`, `ragService.ts`, `embeddingService.ts` | TF-IDF + cosine similarity memory |
| Blockchain | `blockchain.ts`, `blockchainListener.ts` | RPC interaction + event listening |
| Payments | `payment.ts`, `fiat.ts` | Escrow + Stripe payments |
| Kite | `kiteService.ts`, `kitePaymentService.ts` | Kite x402 protocol |
| TEE | `tee.ts` | Intel SGX enclave management |
| Price Feed | `priceFeed.ts` | Chainlink price oracle |
| Queue | `queue.ts` | Bull job queue |

## Testing

```bash
# Run all tests
npm test

# With coverage
npm test -- --coverage

# Specific test file
npm test -- src/services/__tests__/agentDecision.test.ts
```

Tests use Jest + supertest for HTTP integration tests. Mock external services (blockchain RPC, email, Stripe) using Jest mocks.

## Related

- [Frontend README](../frontend/README.md)
- [SDK README](../sdk/README.md)
- [Contracts README](../contracts/README.md)
- [Prisma Schema](../prisma/schema.prisma)
