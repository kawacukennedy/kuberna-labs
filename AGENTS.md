# Session Summary

## Goal

Complete Kuberna Labs deployment across target chains, submit to BNB hackathons, and actively contribute to OM World Protocol as a Genesis Co-author to deepen the partnership.

## Constraints & Preferences

- Use Foundry for Solidity, Hardhat for verification
- TypeScript/Node SDK
- Prefer deterministic deployment (CREATE2 via Safe Singleton Factory)
- Track everything in the existing gist/branch

## Progress

### Done

- Three Foundry deploy scripts for MLRWA tokens, Governance, Registry
- Deterministic address computation with CREATE2 (Safe Singleton Factory) — all deployments
- Codebase analysis: project structure, configs, and dependency mapping complete
- Hackathon research complete: 4 targets identified
- OM World Protocol partnership
- ERC-8004 Adapter built — 8 files in `sdk/src/verify/`
- Funding report saved to `FUNDING-REPORT.md`
- Sponsors: Virtuals ($200/wk compute), Dubstrata ($100), Diploi, Tollbeam
- SimpleAccount deployed on Base Sepolia
- Cross-chain analysis pipeline

### Tollbeam Benchmark Harness (NEW — Aug 9)

- **UserOp harness built**: `scripts/tollbeam-harness.ts` — full sponsor→sign→send→poll pipeline with p50/p95/p99 metrics
- **Fresh SimpleAccount deployed** on Base Sepolia: `0x750Da1AADDEe15CaFd5B0caf1D86E9Ce4aD801A1` (owner = `.env` PRIVATE_KEY, factory `0x9406...5454`, deploy script `scripts/deploy-simple-account.ts`)
- **Endpoint discovered**: `https://api.tollbeam.com/v1/{chain}/rpc` — methods `pm_sponsorUserOperation` + `eth_sendUserOperation` (NOT `pm_sendUserOperation`); send returns `status:"included"` synchronously
- **Key findings (verify with Brent)**:
  - Testnet sandbox sponsor returns `maxFeePerGas/maxPriorityFeePerGas = 0x0` (the zero-gas bug Brent said was fixed) — workaround: supply gas floors upfront (8,050,000 / 1,000,000)
  - Must sign with **EIP-191 personal message hash** (`hashMessage(userOpHash)`), not raw hash — SimpleAccount uses `toEthSignedMessageHash()`
  - Sponsor fields must be applied **verbatim** — re-sign after applying sponsor gas fields
  - viem 2.50 `getUserOperationHash` param is `userOperation:` (not `request:`)
  - Burst mode needs per-run nonce keys (EntryPoint uint192 key = index+1) to avoid AA25 nonce collisions
- **Live results (Base Sepolia, sandbox key, all via Pimlico)**:
  - Steady (8 ops): submission p50=5893ms p95=7279ms; sponsor ~1.6s; send ~2.7s; inclusion p50=1217ms
  - Burst (8 ops concurrent): submission p50=9890ms p95=11067ms; 8/8 on-chain included, success=true
  - Reports in `reports/tollbeam-*.json`
- **Original SimpleAccount owner key still missing** (`0xac00...0100` for `0x90b3...7d60`) — current harness uses the new account

### AI Agent Pipeline (NEW — Jul 15-16)

- **5 production agents created and running** (Dubstrata Trader, yield-trader, defi-trader, arbitrage-trader, Trading Bot template)
- **Agent pipeline 6/6 steps working**: resolve → LLM intent parse → market analysis → agent decision → intent creation → trace logging
- **Real market data**: Pyth oracle ETH $1,914, BTC $64,673, DEX spreads, APY rates (Marinade 6.5%, Curve 5.2%)
- **Arbitrage detected**: ETH 1.07% between Uniswap and SushiSwap with 10.7% confidence
- **12 decision traces recorded** in agent memory
- **FK constraint bugs fixed** in orchestrator, intents route, blockchain listener
- **Dubstrata integration built**: `DubstrataIntelligenceService` enriches market state with financial intelligence
- **SDK v1.0.5 published**: `VIRTUALS_API_KEY` env var support added
- **Virtuals $40 burn test completed**: 505 successful API calls across 3 models over ~81 min, $40.01 spent, $170 remaining

### Sponsorship Status

- **Virtuals ($200/wk)**: Free inference credits active (Tier 1: Spark, week 2/4). API key confirmed working (HTTP 201, Jul 16). Console enabled with Hermes runtime + Druckenmiller Trader template. Auto-billing authorized on chain 8453 (Base) — $210 balance confirmed ($200 free + $10 top-up). $40 burn test completed — 505 successful calls, $40.01 spent, $170 remaining.
- **Dubstrata ($100)**: API working, $99.79 remaining. Integration built (`DubstrataIntelligenceService`) but testing stopped per instruction. Intelligence report endpoint still returning 404.

### GitHub Growth

- Release v1.0.4 created, Discussions + Projects enabled
- 7 good-first-issue tickets (#30-#36), 1 help-wanted (#37)
- CONTRIBUTORS.md, SECURITY.md, FUNDING.yml updated
- lovewave02 PRs merged: #29 (CONTRIBUTING.md), #38 (CI lint fix)
- ElizaOS #9810: Authority fixture corrected per @0xddneto review

### Blocked

- Sepolia: faucet empty
- Polygon Amoy: RPC issues, no ETH
- Arbitrum Sepolia: no ETH
- ~~Supabase project paused — needs manual unpause~~ **RESOLVED** — verified live and writable (Aug 9)
- ~~**Virtuals compute**: Key authenticates but "Insufficient credits" — needs free inference credits claimed via GitHub linking on Credits page (auto-billing now authorized on 8453/Base, $210 balance)~~ **RESOLVED** — API confirmed working Jul 16, $40 burn test completed
- **Virtuals API bug**: High concurrency (>15 for Opus 4.8, >30 for Fast) causes timeouts. Fixed in `scripts/burn-fixed.mjs` with 300s timeout, 10/30 concurrency, retry logic.
- Tollbeam staging key returning `unauthorized`
- **Tollbeam testnet zero-gas**: sandbox sponsor still returns `0x0` gas prices (Brent said fixed) — workaround supplies gas floors upfront; confirmed with Brent before shipping report
- Dubstrata $100 provisioned but some endpoints returning 404 (`/intelligence-report`)

## Key Decisions

- OM World: execute unfulfilled commitments first
- Tool Registry: tool-defined defaults with per-deployment overrides
- Execution Proof: Kuberna Router as reference implementation

## Repos & Accounts

- User: `kawacukennedy` (GitHub)
- OM World org: `omworldprotocol`
- Kuberna SDK: this repo

## Deployer Wallet

- Address: `0x90b3...7d60`
- PK: `0xac00...0100`
- Safe Singleton Factory: `0x4e59b44847b379578588920cA78FbF26c0B4956C`

## SimpleAccount (Base Sepolia)

### Primary (harness — owner = `.env` PRIVATE_KEY)

- Account: `0x750Da1AADDEe15CaFd5B0caf1D86E9Ce4aD801A1`
- Owner: `0x4D3627d433A96eE737aa12d730C2fcEf3e01687c`
- Factory: `0x9406Cc6185a346906296840746125a0E44976454` (salt 0)

### Original (owner key missing)

- Account: `0x7a3175bC23f4be167e49132A22d8e68B3a128aB1`
- Owner: `0x90b37Cf2A756D0DcD2F69A2De78e5CA443eD7d60`
- Block: 43938074

## Deployed Addresses

Source of truth: `deployments/<network>-latest.json` (Hardhat). 14-contract Kuberna suite deployed on **Base Sepolia (84532)** and **Mantle Sepolia (5003)**. Production Render env (`srv-d80v019kh4rs73e6072g`) is wired to the **Base Sepolia** deployment.

| Contract         | Base Sepolia                                 | Mantle Sepolia                               |
| ---------------- | -------------------------------------------- | -------------------------------------------- |
| escrow           | `0xab28501BC5736f56D1Fd909ffD8EB98407EB049E` | `0x22dF9cBdf45F7874602d3Bf950A2B7EB51314ad1` |
| intent           | `0xF9c36107F943C9eECAa88B20C05Bd090322fC56f` | `0xb663f2A79Fcc64eD1CB6c6adD7625b443aB1D19C` |
| certificateNFT   | `0x6CBeE1F98DBd05d5B05A18062B5029c5618D340F` | `0x8f21D43d50266580e21dbCB0BcEa7E073FefA7c0` |
| payment          | `0xc0679cdB6E30291De974635cBaFa572e083e6564` | `0x360ec009ba6967F5f7C53a88FAD0452C6140493d` |
| crossChainRouter | `0xf13Efb8885F11B6E81dE47DF74CC1849a5855edb` | `0x5DA30BDE4A774dcccE6099717d6b41A6329fDe34` |
| attestation      | `0x68d0a647E4a1F68CbDA62Ce31273D1d0298C1a02` | `0x8bcc424C07afCf231046F58B15d3677b8E842023` |
| reputationNFT    | `0x10aC2c7cAA2d7C5fC8a561F8654d289eeb2E29F4` | `0x5e42c329Ef517B495261f57054d5844EAabD3dbf` |
| subscription     | `0x32b0298eF0e0e438A45965Ed26d9EfA2A7Cf9061` | `0xB819ab0Bac2f22e8895C66fE3aDF23aa0a65145a` |
| agentRegistry    | `0x563193BeD72b2b1F284EE0e80b29dADc4D9bEC91` | `0xFFe8A88E9E99938174B8a3C9EcA1c1462315395A` |
| courseNFT        | `0x2b80B538cCC8846AFb3c6cb901A819178c2E805f` | `0x9be7afE1793ad14F9026d7579cf7c2313184a7E0` |
| workshop         | `0xe48844e98A6760cd561f025aeD575f44DF5aABa3` | `0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35` |
| dispute          | `0x9d5A959CA6C6c6D1304beBF293387c4208163071` | `0x817fB0D00f033bb2982fF44855Fb6F8AE2D41324` |
| treasury         | `0xA5BDFFfA521C2234F74Dd03B1529797068C8A717` | `0x9b0D1d05A6EBafE6364648d9e7109E2C37e331BF` |
| feeManager       | `0x039C4456CB9C195C2dFD1F370a4891b0857F4aa0` | `0x1Fa14FfB410EfA65b3aADBB9B65e2426A1fB0F66` |

## Production Agents (Base Sepolia)

| Name             | ID            | Status  |
| ---------------- | ------------- | ------- |
| Dubstrata Trader | `4da8e520...` | RUNNING |
| yield-trader     | `4e4aacfd...` | RUNNING |
| defi-trader      | `8163641d...` | RUNNING |
| arbitrage-trader | `18309ace...` | RUNNING |

## Common Commands

```bash
# Deploy contracts
forge script script/DeployMLRWAToken.s.sol --rpc-url $RPC_URL --broadcast --verify -vvvv

# Test agent pipeline
TOKEN="<jwt>" AGENT_ID="<id>" && \
curl -s https://kuberna-labs.onrender.com/api/agents/$AGENT_ID/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task":"Find arbitrage opportunities"}'

# Dubstrata query
curl -s https://api.dubstrata.com/api/v1/query \
  -H "Authorization: Bearer $DUBSTRATA_API_KEY" \
  -d '{"query":"Analyze ETH price and volatility"}'

# Virtuals chat (if credits authorized)
curl -s https://compute.virtuals.io/v1/chat/completions \
  -H "Authorization: Bearer $VIRTUAL_API_KEY" \
  -d '{"model":"anthropic-claude-opus-4-7","messages":[{"role":"user","content":"hi"}]}'

# Tollbeam harness (steady or burst)
npx tsc --outDir .harness-dist --esModuleInterop --skipLibCheck --module commonjs --target es2020 --moduleResolution node scripts/tollbeam-harness.ts && \
node .harness-dist/tollbeam-harness.js --count=8 --mode=steady --poll=true
```

## Next Steps

1. **Rotate Supabase DB password** (SECURITY): the password is exposed in plaintext via the Render env-vars API and is weak. Manual step — needs Supabase access token (`supabase login` or `SUPABASE_ACCESS_TOKEN`). Steps: reset password in Supabase dashboard (project `rjlnyyqanqhvikhjfmvk`) → update `DATABASE_URL` + `DIRECT_URL` on Render (`srv-d80v019kh4rs73e6072g`) → redeploy.
2. Publish ERC-8004 adapter as npm release
3. Monitor v0.2 freeze from @flyoung588
4. Resume Sepolia/Polygon/Arb deployments when faucets recover
5. SVP Chain FutureStack submission before Jul 30 ($250K AI Agent track)
6. Grant applications: Solana Superteam, Microsoft Founders Hub, Google Cloud
7. BRD Hanga Venture Ignite+ — $110K Rwanda grant
