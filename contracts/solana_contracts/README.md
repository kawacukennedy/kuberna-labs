================================================================================
KUBERNA LABS - SOLANA SMART CONTRACTS
================================================================================

CONTRACTS CONVERTED TO SOLANA ANCHOR FRAMEWORK

================================================================================
FILE STRUCTURE
================================================================================

solana_contracts/
├── Anchor.toml # Anchor configuration
├── Cargo.toml # Rust dependencies
├── programs/
│ └── src/
│ ├── lib.rs # Main library entry point
│ ├── escrow.rs # Escrow smart contract
│ ├── intent.rs # Intent/task marketplace
│ ├── certificate.rs # NFT certificates & payments
│ └── agent.rs # Agent registry & subscriptions
└── tests/ # Test files (to be added)

================================================================================
CONTRACTS
================================================================================

1. ESCROW (escrow.rs)
   - Secure payment holding for tasks
   - Functions: create_escrow, assign_executor, complete_task, release_funds, raise_dispute
   - PDA-based vault for tokens

2. INTENT (intent.rs)
   - Task posting and marketplace
   - Functions: create_intent, submit_bid, accept_bid, execute_intent
   - Bid management system

3. CERTIFICATE (certificate.rs)
   - NFT certificates for course completion
   - Functions: mint_certificate, verify_certificate
   - Part of payment module

4. AGENT (agent.rs)
   - Agent registry and management
   - Functions: register_agent, update_agent_status, record_task_result
   - Subscription management included

================================================================================
BUILD & DEPLOY COMMANDS
================================================================================

Prerequisites:

1. Install Solana CLI: sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
2. Install Anchor: cargo install anchor-lang@0.29.0 --force
3. Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

## Build:

cd /Volumes/RCA/kubernalabs/contracts/solana_contracts
anchor build

## Test:

anchor test

## Deploy to Devnet:

anchor deploy --provider.cluster https://api.devnet.solana.com

## Deploy to Mainnet:

anchor deploy --provider.cluster https://api.mainnet-beta.solana.com

================================================================================
NETWORK CONFIGURATION
================================================================================

Networks:

- Localhost: http://127.0.0.1:8899
- Devnet: https://api.devnet.solana.com (CHAIN ID: 245022926)
- Testnet: https://api.testnet.solana.com
- Mainnet: https://api.mainnet-beta.solana.com

Token: SOL (native)
Explorer: https://explorer.solana.com

================================================================================
USAGE EXAMPLE (JavaScript)
================================================================================

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@anchor-lang/client';

// Connect to program
const programId = new PublicKey('Kuberna1111111111111111111111111111');
const connection = new Connection('https://api.devnet.solana.com');

// Call create_escrow
await program.methods.createIntent(
intentId,
amount,
durationSeconds
).accounts({
intent: intentPda,
requester: payer.publicKey,
systemProgram: SystemProgram.programId,
}).signers([payer]).rpc();

================================================================================
CONVERSION NOTES
================================================================================

Key Differences (Solidity → Anchor):

1. State Storage:
   - Solidity: contract storage
   - Anchor: #[account] structs with PDA seeds

2. Function Visibility:
   - Solidity: public/private/external
   - Anchor: Context-based with accounts

3. Access Control:
   - Solidity: require() statements
   - Anchor: require!() macros

4. Tokens:
   - Solidity: ERC-20
   - Anchor: SPL Token with associated tokens

5. Native Transfers:
   - Solidity: address(this).call{value: x}()
   - Anchor: program.send()

6. Events:
   - Solidity: emit Event(...)
   - Anchor: #[event] pub struct

7. Errors:
   - Solidity: require(...,"message")
   - Anchor: #[error_code] enum

8. Contract Creation:
   - Solidity: constructor()
   - Anchor: #[derive(Accounts)] + init constraint

================================================================================
IMPORTANT NOTES
================================================================================

1. This is Anchor Framework (Rust-based Solana smart contracts)
2. Uses PDAs (Program Derived Addresses) for account management
3. SPL Token standard for tokens (not ERC-20)
4. Requires SOL for rent and fees
5. All contracts are upgradeable by default

================================================================================
END OF README
================================================================================

Generated: April 13, 2026
Kuberna Labs - Architecting the Agentic Web3 Enterprise
================================================================================
