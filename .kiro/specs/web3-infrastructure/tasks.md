# Implementation Plan: Web3 Infrastructure

## Overview

This implementation plan covers the complete Web3 Infrastructure for Kuberna Labs, including smart contracts on multiple chains (Ethereum, Polygon, Arbitrum, NEAR), backend services for payment processing and TEE orchestration, blockchain event listeners, and multi-chain adapters. The system implements the ERC-7683 intent protocol, integrates with Phala Network and Marlin Oyster for TEE deployments, and supports zkTLS through Reclaim Protocol and zkPass.

## Tasks

- [x] 1. Set up project structure and development environment
  - Initialize Hardhat project for smart contract development
  - Set up TypeScript backend project structure
  - Configure testing frameworks (Hardhat, Jest, fast-check)
  - Set up linting and formatting (ESLint, Prettier)
  - Configure environment variables and secrets management
  - Install dependencies (OpenZeppelin, ethers, Chainlink, etc.)
  - _Requirements: 49.1, 49.2, 49.3_

- [x] 2. Implement Escrow smart contract
  - [x] 2.1 Create KubernaEscrow contract with core data structures
    - Define EscrowStatus enum and EscrowData struct
    - Implement storage mappings for escrows
    - Add constants for fees, deadlines, and confirmations
    - Inherit from OpenZeppelin ReentrancyGuard, Ownable, and Pausable
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Implement escrow creation and funding functions
    - Write createEscrow() function with validation
    - Write fundEscrow() function for native and ERC20 tokens
    - Add assignExecutor() function for bid acceptance
    - Emit EscrowCreated and EscrowFunded events
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9, 1.10_

  - [x] 2.3 Implement task completion and fund release functions
    - Write submitCompletion() function with executor validation
    - Write releaseFunds() function with requester authorization
    - Write autoRelease() function for 24-hour timeout
    - Emit TaskCompleted and FundsReleased events
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 2.4 Implement dispute resolution functions
    - Write raiseDispute() function for requester and executor
    - Write resolveDispute() function for admin
    - Add dispute status handling and fund locking
    - Emit DisputeRaised and DisputeResolved events
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.5 Add expiration and refund functionality
    - Write expireAndRefund() function for deadline expiration
    - Add deadline validation and status checks
    - Emit EscrowExpired and FundsRefunded events
    - _Requirements: 1.8_

  - [ ]* 2.6 Write unit tests for Escrow contract
    - Test createEscrow with valid and invalid parameters
    - Test fundEscrow with native and ERC20 tokens
    - Test submitCompletion and releaseFunds workflows
    - Test dispute resolution and refund scenarios
    - Test access control and reentrancy protection
    - _Requirements: 49.1, 49.3_

- [x] 3. Implement Intent smart contract
  - [x] 3.1 Create KubernaIntent contract with core data structures
    - Define IntentStatus and BidStatus enums
    - Define IntentData and BidData structs
    - Implement storage mappings for intents and bids
    - Add hasBid mapping to prevent duplicate bids
    - _Requirements: 4.1, 4.2_

  - [x] 3.2 Implement intent creation and bidding functions
    - Write createIntent() function with validation
    - Write submitBid() function with duplicate prevention
    - Write retractBid() function for bid withdrawal
    - Emit IntentCreated and BidSubmitted events
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 4.10, 4.11, 4.12_

  - [x] 3.3 Implement bid acceptance and intent assignment
    - Write acceptBid() function with requester authorization
    - Write rejectBid() function for manual rejection
    - Update all pending bids to rejected when one is accepted
    - Emit BidAccepted, BidRejected, and IntentAssigned events
    - _Requirements: 4.6, 4.7, 4.13_

  - [x] 3.4 Implement intent completion and escrow linking
    - Write setEscrow() function to link intent with escrow
    - Write completeIntent() function for completion tracking
    - Write cancelIntent() function for pre-assignment cancellation
    - Emit IntentCompleted and IntentCancelled events
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.5 Write unit tests for Intent contract
    - Test createIntent with valid and invalid parameters
    - Test submitBid with duplicate prevention
    - Test acceptBid with multiple bids
    - Test intent completion and cancellation
    - Test access control and status transitions
    - _Requirements: 49.1, 49.3_

- [x] 4. Implement Certificate NFT smart contract
  - [x] 4.1 Create KubernaCertificateNFT contract
    - Inherit from ERC721, ERC721URIStorage, and Ownable
    - Define CertificateData struct
    - Implement storage mappings for certificates
    - Add minter role with access control
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 4.2 Implement certificate minting and verification
    - Write mintCertificate() function with duplicate prevention
    - Generate token URI with certificate metadata
    - Write verifyCertificate() function for validation
    - Write getUserCertificates() function for user queries
    - Emit CertificateMinted event
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10, 6.11_

  - [x] 4.3 Implement certificate revocation
    - Write revokeCertificate() function with admin authorization
    - Update isValid flag and emit CertificateRevoked event
    - Add revocation reason to event
    - _Requirements: 6.7_

  - [ ]* 4.4 Write unit tests for Certificate NFT
    - Test mintCertificate with valid and invalid parameters
    - Test duplicate prevention
    - Test certificate verification
    - Test revocation functionality
    - Test access control for minting and revocation
    - _Requirements: 49.1, 49.3_

- [x] 5. Implement Payment smart contract
  - [x] 5.1 Create KubernaPayment contract with token management
    - Define TokenConfig struct
    - Implement storage mappings for tokens and balances
    - Inherit from ReentrancyGuard, Ownable, and Pausable
    - _Requirements: 7.1_

  - [x] 5.2 Implement token configuration functions
    - Write addToken() function with admin authorization
    - Write removeToken() function with admin authorization
    - Write getSupportedTokens() function
    - Emit TokenAdded and TokenRemoved events
    - _Requirements: 7.1, 7.7, 27.1, 27.2, 27.3, 27.4_

  - [x] 5.3 Implement payment processing functions
    - Write processPayment() function for single payments
    - Write batchProcessPayment() function for batch payments
    - Add validation for token support and amount limits
    - Emit PaymentProcessed event
    - _Requirements: 7.2, 7.3, 7.4, 7.8, 7.9, 7.10_

  - [x] 5.4 Implement withdrawal functions
    - Write withdraw() function for user withdrawals
    - Write withdrawFees() function for admin fee collection
    - Write getBalance() function for balance queries
    - Emit Withdrawal event
    - _Requirements: 7.5, 7.6, 7.11_

  - [ ]* 5.5 Write unit tests for Payment contract
    - Test token configuration management
    - Test payment processing with various tokens
    - Test batch payment processing
    - Test withdrawal functionality
    - Test access control and reentrancy protection
    - _Requirements: 49.1, 49.3_

- [x] 6. Implement Cross-Chain Router smart contract
  - [x] 6.1 Create CrossChainRouter contract with message handling
    - Define ChainId enum and CrossChainMessage struct
    - Implement storage mappings for messages and chain support
    - Add bridge fee configuration
    - Inherit from ReentrancyGuard, Ownable, and Pausable
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.2 Implement cross-chain transfer initiation
    - Write initiateTransfer() function with validation
    - Generate unique messageId for each transfer
    - Lock source tokens in contract
    - Emit CrossChainTransferInitiated event
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8, 8.9_

  - [x] 6.3 Implement cross-chain transfer execution
    - Write executeTransfer() function for destination chain
    - Validate message exists and not already executed
    - Transfer tokens to recipient
    - Emit CrossChainTransferCompleted event
    - _Requirements: 8.5, 8.6, 8.10, 28.1, 28.2, 28.3, 28.4, 28.5_

  - [x] 6.4 Implement chain and token mapping management
    - Write setChainSupport() function for admin
    - Write setTokenMapping() function for token addresses
    - Add validation for supported chains
    - Emit ChainSupportUpdated and TokenMappingUpdated events
    - _Requirements: 29.1, 29.2, 29.3, 46.1, 46.2, 46.3, 46.4_

  - [ ]* 6.5 Write unit tests for Cross-Chain Router
    - Test transfer initiation with various parameters
    - Test transfer execution and duplicate prevention
    - Test chain and token mapping management
    - Test access control and reentrancy protection
    - _Requirements: 49.1, 49.3_

- [x] 7. Implement Attestation smart contract
  - [x] 7.1 Create Attestation contract with attestation management
    - Define AttestationData struct
    - Implement storage mappings for attestations
    - Add schema registry for attestation types
    - Inherit from Ownable
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 7.2 Implement attestation creation and verification
    - Write attest() function with validation
    - Write attestBySignature() function for delegated attestation
    - Write verify() function for attestation validation
    - Write getAttestation() function for queries
    - Emit AttestationCreated event
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8, 9.9_

  - [x] 7.3 Implement attestation revocation
    - Write revoke() function with issuer authorization
    - Update revoked flag
    - Emit AttestationRevoked event
    - _Requirements: 9.6, 9.10_

  - [ ]* 7.4 Write unit tests for Attestation contract
    - Test attestation creation with valid and invalid parameters
    - Test attestation verification logic
    - Test attestation revocation
    - Test expiration handling
    - Test access control
    - _Requirements: 49.1, 49.3_

- [x] 8. Implement Reputation NFT smart contract
  - [x] 8.1 Create ReputationNFT contract with reputation tracking
    - Inherit from ERC721 and Ownable
    - Define AgentReputation and Badge structs
    - Implement storage mappings for reputation data
    - _Requirements: 10.1, 10.2_

  - [x] 8.2 Implement agent registration and reputation updates
    - Write registerAgent() function to mint reputation NFT
    - Write updateReputation() function with admin authorization
    - Write submitRating() function for user ratings
    - Emit ReputationUpdated and RatingSubmitted events
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.10, 10.11_

  - [x] 8.3 Implement reputation calculation and queries
    - Write calculateScore() function for reputation score
    - Write getSuccessRate() function for success percentage
    - Write getStarRating() function for average rating
    - Write applyDecay() function for time-based decay
    - _Requirements: 10.6, 10.7, 10.8, 10.9_

  - [x] 8.4 Implement badge award system
    - Write awardBadge() function for achievement badges
    - Write getBadges() function for badge queries
    - Add badge thresholds (Century, Reliable, Veteran)
    - Emit BadgeAwarded event
    - _Requirements: 31.1, 31.2, 31.3, 31.4_

  - [ ]* 8.5 Write unit tests for Reputation NFT
    - Test agent registration and reputation updates
    - Test reputation score calculation
    - Test badge award logic
    - Test rating submission and validation
    - Test access control
    - _Requirements: 49.1, 49.3_

- [x] 9. Implement Subscription smart contract
  - [x] 9.1 Create KubernaSubscription contract with plan management
    - Define SubStatus and PlanType enums
    - Define Subscription and Plan structs
    - Implement storage mappings for subscriptions and plans
    - Inherit from ReentrancyGuard and Ownable
    - _Requirements: 11.1, 11.2_

  - [x] 9.2 Implement subscription plan management
    - Write createPlan() function with admin authorization
    - Write updatePlan() function for price and status updates
    - Write getPlan() function for plan queries
    - Emit PlanCreated and PlanUpdated events
    - _Requirements: 11.1, 30.1, 30.2, 30.3, 30.4_

  - [x] 9.3 Implement subscription lifecycle functions
    - Write subscribe() function with payment processing
    - Write renew() function for subscription renewal
    - Write cancelSubscription() function
    - Write pauseSubscription() and resumeSubscription() functions
    - Write isActive() function for status checks
    - Emit SubscriptionCreated, SubscriptionRenewed, SubscriptionCancelled events
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11_

  - [ ]* 9.4 Write unit tests for Subscription contract
    - Test plan creation and updates
    - Test subscription lifecycle (subscribe, renew, cancel, pause, resume)
    - Test payment processing for subscriptions
    - Test grace period and expiration logic
    - Test access control and reentrancy protection
    - _Requirements: 49.1, 49.3_

- [x] 10. Checkpoint - Smart contract compilation and deployment scripts
  - Compile all smart contracts and verify no errors
  - Write deployment scripts for all contracts
  - Configure deployment for multiple networks (Ethereum, Polygon, Arbitrum)
  - Test deployment on local Hardhat network
  - Ensure all tests pass, ask the user if questions arise

- [x] 11. Implement Payment Service backend
  - [x] 11.1 Create PaymentService class with configuration
    - Set up TypeScript project structure
    - Define PaymentServiceConfig interface
    - Initialize blockchain providers for all chains
    - Load contract ABIs and addresses
    - Set up database connection
    - _Requirements: 12.1, 12.2_

  - [x] 11.2 Implement payment intent creation
    - Write createPaymentIntent() method with validation
    - Generate unique intentId
    - Call Intent contract to create on-chain intent
    - Call Escrow contract to create on-chain escrow
    - Store intent and escrow records in database
    - Return intentId, escrowId, and approval requirements
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [x] 11.3 Implement escrow funding tracking
    - Write fundEscrow() method with transaction verification
    - Verify transaction has required confirmations
    - Update escrow status to funded in database
    - Update intent status to bidding in database
    - Publish notification to solver network via NATS
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 11.4 Implement fund release and refund
    - Write releasePayment() method with escrow verification
    - Call Escrow contract releaseFunds() function
    - Update escrow status to released in database
    - Write refundPayment() method for refunds
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 11.5 Implement withdrawal processing
    - Write processWithdrawal() method with balance verification
    - Call Payment contract withdraw() function
    - Return transaction hash
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 11.6 Implement gas estimation and token support
    - Write estimateGas() method for operation cost estimation
    - Write getSupportedTokens() method for token queries
    - Integrate with Chainlink price feeds for USD conversion
    - Add gas price spike warnings
    - _Requirements: 26.1, 26.2, 26.3, 26.4_

  - [ ]* 11.7 Write unit tests for Payment Service
    - Test payment intent creation workflow
    - Test escrow funding verification
    - Test fund release and refund
    - Test withdrawal processing
    - Test gas estimation
    - Mock blockchain interactions
    - _Requirements: 49.2, 49.3_

- [x] 12. Implement TEE Service backend
  - [x] 12.1 Create TEEService class with provider integration
    - Define TEEServiceConfig interface
    - Initialize Phala Network SDK
    - Initialize Marlin Oyster SDK
    - Set up attestation contract connection
    - _Requirements: 16.1, 16.2_

  - [x] 12.2 Implement agent deployment to TEE
    - Write deployAgent() method with validation
    - Package agent code with configuration
    - Call TEE provider API to deploy to enclave
    - Poll for valid attestation with retry logic
    - Submit attestation to on-chain Attestation contract
    - Store deployment record in database
    - Return deploymentId, enclaveId, endpoint, and attestation
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9_

  - [x] 12.3 Implement attestation verification
    - Write verifyAttestation() method
    - Check quote signature using TEE provider public key
    - Verify MRENCLAVE hash matches expected value
    - Check attestation timestamp validity
    - Return verification result
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [x] 12.4 Implement zkTLS proof generation
    - Write requestZKTLSProof() method
    - Initiate session with zkTLS provider (Reclaim or zkPass)
    - Request user authentication
    - Fetch data via TLS connection after authorization
    - Generate zero-knowledge proof of data claim
    - Submit proof to Attestation contract
    - Return proofId, claim, proof data, and attestationId
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.8_

  - [x] 12.5 Implement deployment management functions
    - Write getDeploymentStatus() method for status queries
    - Write stopDeployment() method to terminate enclave
    - Write getEnclaveHealth() method for health monitoring
    - Write verifyZKTLSProof() method for proof validation
    - _Requirements: 18.7_

  - [ ]* 12.6 Write unit tests for TEE Service
    - Test agent deployment workflow
    - Test attestation verification logic
    - Test zkTLS proof generation
    - Test deployment management functions
    - Mock TEE provider APIs
    - _Requirements: 49.2, 49.3_

- [x] 13. Implement Blockchain Listener service
  - [x] 13.1 Create BlockchainListener class with WebSocket connections
    - Define BlockchainListenerConfig interface
    - Initialize WebSocket providers for all chains
    - Set up reconnection logic with exponential backoff
    - Set up database connection
    - Set up NATS messaging connection
    - _Requirements: 19.1, 19.2, 19.11_

  - [x] 13.2 Implement event subscription and handlers
    - Subscribe to all configured contract events
    - Implement handleEscrowCreated event handler
    - Implement handleEscrowFunded event handler
    - Implement handleEscrowAssigned event handler
    - Implement handleTaskCompleted event handler
    - Implement handleFundsReleased event handler
    - Wait for required confirmations before processing
    - _Requirements: 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [x] 13.3 Implement intent and bid event handlers
    - Implement handleIntentCreated event handler
    - Implement handleBidSubmitted event handler
    - Implement handleBidAccepted event handler
    - Update database records for each event
    - Publish notifications to solver network
    - _Requirements: 19.8, 19.9_

  - [x] 13.4 Implement certificate and attestation event handlers
    - Implement handleCertificateMinted event handler
    - Implement handleAttestationCreated event handler
    - Store certificate and attestation records in database
    - Send notifications to users
    - _Requirements: 19.10_

  - [x] 13.5 Implement fallback polling mechanism
    - Set up interval-based polling for missed events
    - Query event history from last processed block
    - Deduplicate events to prevent double-processing
    - Mark events as processed in database
    - _Requirements: 19.12, 37.1, 37.2, 37.3, 37.4_

  - [ ]* 13.6 Write unit tests for Blockchain Listener
    - Test event subscription and handling
    - Test confirmation waiting logic
    - Test database updates for each event type
    - Test reconnection logic
    - Test fallback polling mechanism
    - Mock WebSocket providers
    - _Requirements: 49.2, 49.3_

- [x] 14. Checkpoint - Backend services integration
  - Test Payment Service with local blockchain
  - Test TEE Service with mock providers
  - Test Blockchain Listener with event simulation
  - Verify database schema and migrations
  - Ensure all tests pass, ask the user if questions arise

- [~] 15. Implement multi-chain adapters
  - [ ] 15.1 Create base ChainAdapter interface
    - Define ChainAdapter interface with common methods
    - Define TransactionReceipt interface
    - Add connect(), disconnect(), getBalance() methods
    - Add transfer(), approve(), call() methods
    - Add estimateGas(), waitForTransaction() methods
    - Add getChainId(), getCurrentBlock() methods
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9_

  - [ ] 15.2 Implement Ethereum adapter
    - Create EthereumAdapter class implementing ChainAdapter
    - Initialize ethers.js provider and signer
    - Implement all base ChainAdapter methods
    - Add Uniswap swap integration (swapOnUniswap)
    - Add Aave deposit integration (depositToAave)
    - Add Aave borrow integration (borrowFromAave)
    - _Requirements: 20.1-20.9, 21.1, 21.2, 21.3, 21.4_

  - [ ] 15.3 Implement Solana adapter
    - Create SolanaAdapter class implementing ChainAdapter
    - Initialize @solana/web3.js connection
    - Implement all base ChainAdapter methods
    - Add Raydium swap integration (swapOnRaydium)
    - Add Marinade staking integration (stakeWithMarinade)
    - _Requirements: 20.1-20.9, 22.1, 22.2, 22.3_

  - [ ] 15.4 Implement NEAR adapter
    - Create NEARAdapter class implementing ChainAdapter
    - Initialize near-api-js connection
    - Implement all base ChainAdapter methods
    - Add Ref Finance swap integration (swapOnRefFinance)
    - Add Burrow deposit integration (depositToBurrow)
    - _Requirements: 20.1-20.9, 23.1, 23.2, 23.3_

  - [ ] 15.5 Implement Polygon and Arbitrum adapters
    - Create PolygonAdapter extending EthereumAdapter
    - Create ArbitrumAdapter extending EthereumAdapter
    - Configure chain-specific RPC endpoints
    - Configure chain-specific contract addresses
    - _Requirements: 20.1-20.9_

  - [ ]* 15.6 Write unit tests for chain adapters
    - Test base ChainAdapter methods for each chain
    - Test DeFi protocol integrations
    - Test error handling and retries
    - Mock blockchain connections
    - _Requirements: 49.2, 49.3_

- [~] 16. Implement API Gateway and REST endpoints
  - [ ] 16.1 Set up Express.js API server
    - Initialize Express application
    - Configure middleware (CORS, body-parser, helmet)
    - Set up JWT authentication middleware
    - Set up rate limiting middleware
    - Configure error handling middleware
    - _Requirements: 38.1, 38.2, 38.3, 38.4, 39.1, 39.2, 39.3, 39.4, 39.5_

  - [ ] 16.2 Implement payment endpoints
    - POST /api/v1/payments/intents - Create payment intent
    - POST /api/v1/payments/escrows/:id/fund - Fund escrow
    - POST /api/v1/payments/escrows/:id/release - Release funds
    - POST /api/v1/payments/escrows/:id/refund - Refund payment
    - GET /api/v1/payments/intents/:id - Get payment status
    - POST /api/v1/payments/withdrawals - Process withdrawal
    - GET /api/v1/payments/tokens - Get supported tokens
    - POST /api/v1/payments/gas-estimate - Estimate gas cost
    - _Requirements: 12.1-12.8, 13.1-13.6, 14.1-14.5, 15.1-15.4, 26.1-26.4_

  - [ ] 16.3 Implement TEE endpoints
    - POST /api/v1/tee/deployments - Deploy agent to TEE
    - GET /api/v1/tee/deployments/:id - Get deployment status
    - DELETE /api/v1/tee/deployments/:id - Stop deployment
    - POST /api/v1/tee/attestations/verify - Verify attestation
    - POST /api/v1/tee/zktls/proofs - Request zkTLS proof
    - GET /api/v1/tee/zktls/proofs/:id/verify - Verify zkTLS proof
    - GET /api/v1/tee/enclaves/:id/health - Get enclave health
    - _Requirements: 16.1-16.9, 17.1-17.6, 18.1-18.8_

  - [ ] 16.4 Implement intent and bid endpoints
    - POST /api/v1/intents - Create intent
    - GET /api/v1/intents/:id - Get intent details
    - GET /api/v1/intents - List intents with pagination
    - POST /api/v1/intents/:id/bids - Submit bid
    - POST /api/v1/intents/:id/bids/:bidId/accept - Accept bid
    - DELETE /api/v1/intents/:id/bids/:bidId - Retract bid
    - POST /api/v1/intents/:id/cancel - Cancel intent
    - _Requirements: 4.1-4.13, 5.1-5.5_

  - [ ] 16.5 Implement certificate endpoints
    - POST /api/v1/certificates - Mint certificate
    - GET /api/v1/certificates/:id - Get certificate details
    - GET /api/v1/certificates/verify/:hash - Verify certificate
    - POST /api/v1/certificates/:id/revoke - Revoke certificate
    - GET /api/v1/users/:id/certificates - Get user certificates
    - _Requirements: 6.1-6.11, 25.1-25.5_

  - [ ] 16.6 Implement wallet integration endpoints
    - POST /api/v1/wallets/connect - Connect wallet
    - POST /api/v1/wallets/disconnect - Disconnect wallet
    - GET /api/v1/wallets/balance - Get wallet balance
    - POST /api/v1/wallets/sign - Sign message
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7_

  - [ ]* 16.7 Write integration tests for API endpoints
    - Test all payment endpoints
    - Test all TEE endpoints
    - Test all intent and bid endpoints
    - Test all certificate endpoints
    - Test authentication and authorization
    - Test rate limiting
    - _Requirements: 49.2, 49.4_

- [~] 17. Implement notification system
  - [ ] 17.1 Create NotificationService class
    - Set up email notification provider (SendGrid or AWS SES)
    - Set up push notification provider (Firebase)
    - Set up in-app notification storage
    - Define notification templates
    - _Requirements: 47.1-47.7_

  - [ ] 17.2 Implement notification triggers
    - Send notification on escrow funded
    - Send notification on bid submitted
    - Send notification on bid accepted
    - Send notification on task completed
    - Send notification on funds released
    - Send notification on certificate minted
    - Send notification on subscription payment failure
    - _Requirements: 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 47.7_

  - [ ]* 17.3 Write unit tests for notification service
    - Test notification sending for each event type
    - Test notification template rendering
    - Mock email and push notification providers
    - _Requirements: 49.2, 49.3_

- [~] 18. Implement SDK for agent development
  - [ ] 18.1 Create TypeScript SDK package
    - Initialize npm package structure
    - Define SDK configuration interface
    - Set up wallet connection utilities
    - Export all contract ABIs and interfaces
    - _Requirements: 48.1-48.7_

  - [ ] 18.2 Implement payment SDK methods
    - createPaymentIntent() - Create payment intent
    - fundEscrow() - Fund escrow
    - releasePayment() - Release payment
    - getPaymentStatus() - Query payment status
    - _Requirements: 48.1_

  - [ ] 18.3 Implement intent SDK methods
    - createIntent() - Create intent
    - submitBid() - Submit bid
    - acceptBid() - Accept bid
    - retractBid() - Retract bid
    - getIntentStatus() - Query intent status
    - _Requirements: 48.2_

  - [ ] 18.4 Implement task execution SDK methods
    - executeTask() - Execute task logic
    - submitCompletion() - Submit completion proof
    - generateProof() - Generate task completion proof
    - _Requirements: 48.3, 48.4_

  - [ ] 18.5 Implement wallet connection utilities
    - connectWallet() - Connect MetaMask, WalletConnect, Phantom, NEAR
    - disconnectWallet() - Disconnect wallet
    - signTransaction() - Sign transaction
    - signMessage() - Sign message
    - _Requirements: 48.6_

  - [ ] 18.6 Generate TypeScript type definitions
    - Export all contract interfaces
    - Export all service interfaces
    - Export all data model types
    - Generate documentation from JSDoc comments
    - _Requirements: 48.7_

  - [ ]* 18.7 Write SDK usage examples and tests
    - Create example projects for common use cases
    - Test SDK methods with mock providers
    - Generate API documentation
    - _Requirements: 49.2, 49.3, 50.3_

- [~] 19. Implement database schema and migrations
  - [ ] 19.1 Design database schema
    - Create escrows table with indexes
    - Create intents table with indexes
    - Create bids table with indexes
    - Create tee_deployments table with indexes
    - Create certificates table with indexes
    - Create attestations table with indexes
    - Create users table with indexes
    - Create audit_logs table with partitioning
    - _Requirements: 37.1, 37.2, 37.3, 37.4_

  - [ ] 19.2 Write database migration scripts
    - Create initial schema migration
    - Add indexes for frequently queried fields
    - Add foreign key constraints
    - Add check constraints for validation
    - _Requirements: 37.1_

  - [ ] 19.3 Implement database access layer
    - Create repository classes for each entity
    - Implement CRUD operations
    - Add transaction support
    - Add connection pooling
    - _Requirements: 37.1, 37.2_

  - [ ]* 19.4 Write database integration tests
    - Test CRUD operations for each entity
    - Test transaction rollback
    - Test constraint validation
    - _Requirements: 49.2, 49.4_

- [x] 20. Checkpoint - Integration testing
  - Test complete payment flow end-to-end
  - Test cross-chain transfer workflow
  - Test TEE deployment and attestation
  - Test certificate minting and verification
  - Ensure all tests pass, ask the user if questions arise

- [~] 21. Implement security features
  - [ ] 21.1 Add input validation and sanitization
    - Validate all API request parameters
    - Sanitize user inputs to prevent injection attacks
    - Add schema validation using Joi
    - _Requirements: 36.1, 36.2, 36.3, 36.4, 36.5, 36.6_

  - [ ] 21.2 Implement authentication and authorization
    - Set up JWT token generation and validation
    - Implement refresh token mechanism
    - Add role-based access control (RBAC)
    - Implement API key authentication for agents
    - _Requirements: 39.1, 39.2, 39.3, 39.4, 39.5_

  - [ ] 21.3 Add encryption and key management
    - Encrypt sensitive data at rest using AES-256
    - Configure TLS 1.3 for data in transit
    - Integrate with AWS KMS for key management
    - Implement key rotation schedule
    - _Requirements: 43.1, 43.2, 43.3, 43.4, 43.5_

  - [ ] 21.4 Implement emergency pause functionality
    - Add pause() and unpause() functions to all contracts
    - Add whenNotPaused modifier to state-changing functions
    - Create admin dashboard for emergency controls
    - _Requirements: 32.1, 32.2, 32.3, 32.4_

  - [ ] 21.5 Add reentrancy protection
    - Apply nonReentrant modifier to all fund transfer functions
    - Verify checks-effects-interactions pattern
    - Test reentrancy attack scenarios
    - _Requirements: 33.1, 33.2, 33.3, 33.4, 33.5_

  - [ ]* 21.6 Conduct security audit preparation
    - Document all security measures
    - Create threat model
    - Prepare audit checklist
    - _Requirements: 49.1_

- [~] 22. Implement monitoring and logging
  - [ ] 22.1 Set up logging infrastructure
    - Configure Winston logger with multiple transports
    - Add structured logging with JSON format
    - Implement log levels (error, warn, info, debug)
    - Add request ID tracking for distributed tracing
    - _Requirements: 44.1, 44.2, 44.3, 44.4, 44.5, 44.6_

  - [ ] 22.2 Implement audit logging
    - Log all API requests with user ID and timestamp
    - Log all blockchain transactions
    - Log all administrative actions
    - Log all authentication events
    - _Requirements: 44.1, 44.2, 44.3, 44.4_

  - [ ] 22.3 Set up monitoring and alerting
    - Integrate with Datadog for metrics collection
    - Set up alerts for error rates and latency
    - Monitor blockchain listener health
    - Monitor contract events in real-time
    - Alert on large withdrawals
    - _Requirements: 42.1, 42.2, 42.3, 42.4, 42.5, 42.6_

  - [ ] 22.4 Implement error tracking
    - Integrate with Sentry for error tracking
    - Add error context and breadcrumbs
    - Set up error grouping and deduplication
    - Configure alert rules for critical errors
    - _Requirements: 40.1, 40.2, 40.3, 40.4, 40.5, 40.6, 40.7, 40.8, 40.9, 40.10_

  - [ ]* 22.5 Create monitoring dashboard
    - Build dashboard showing key metrics
    - Display transaction volume and error rates
    - Show gas costs and blockchain listener status
    - Add real-time event monitoring
    - _Requirements: 42.6_

- [~] 23. Implement performance optimizations
  - [ ] 23.1 Optimize smart contracts for gas efficiency
    - Pack struct fields to minimize storage slots
    - Use unchecked blocks for safe arithmetic
    - Cache storage variables in memory
    - Use events instead of storage for historical data
    - _Requirements: 41.1, 41.2_

  - [ ] 23.2 Implement caching layer
    - Set up Redis for caching
    - Cache token prices with 5-minute TTL
    - Cache gas estimates with 1-minute TTL
    - Cache supported tokens list
    - Implement cache invalidation strategy
    - _Requirements: 41.4_

  - [ ] 23.3 Optimize database queries
    - Add composite indexes on frequently queried fields
    - Implement database connection pooling
    - Use read replicas for analytics queries
    - Optimize slow queries identified in profiling
    - _Requirements: 41.5_

  - [ ] 23.4 Implement batch operations
    - Use multicall pattern for batch blockchain queries
    - Batch database operations in transactions
    - Batch event processing in blockchain listener
    - _Requirements: 41.6_

  - [ ]* 23.5 Conduct performance testing
    - Load test API endpoints
    - Measure response times under load
    - Identify and fix performance bottlenecks
    - _Requirements: 41.1, 41.2, 41.3_

- [~] 24. Implement backup and recovery
  - [ ] 24.1 Set up automated database backups
    - Configure daily automated backups
    - Store backups in S3 with encryption
    - Implement backup retention policy (30 days)
    - Store backups in geographically separate location
    - _Requirements: 45.1, 45.2, 45.4, 45.5_

  - [ ] 24.2 Implement backup restoration procedures
    - Write backup restoration scripts
    - Test backup restoration monthly
    - Document restoration procedures
    - _Requirements: 45.3_

  - [ ]* 24.3 Test disaster recovery procedures
    - Simulate database failure and recovery
    - Test backup restoration process
    - Verify data integrity after restoration
    - _Requirements: 45.3_

- [~] 25. Write comprehensive documentation
  - [ ] 25.1 Create API documentation
    - Document all REST endpoints with parameters and examples
    - Generate OpenAPI/Swagger specification
    - Add authentication requirements for each endpoint
    - Include error response examples
    - _Requirements: 50.1_

  - [ ] 25.2 Create smart contract documentation
    - Document all contract functions with specifications
    - Document all events with parameters
    - Add usage examples for each contract
    - Document access control requirements
    - _Requirements: 50.2_

  - [ ] 25.3 Create SDK documentation
    - Write SDK usage guide with examples
    - Document all SDK methods with parameters
    - Add code examples for common use cases
    - Generate TypeDoc API reference
    - _Requirements: 50.3_

  - [ ] 25.4 Create architecture documentation
    - Create system architecture diagrams
    - Document component interactions
    - Document data flow diagrams
    - Add sequence diagrams for key workflows
    - _Requirements: 50.4_

  - [ ] 25.5 Create deployment documentation
    - Write deployment guide for testnet
    - Write deployment guide for mainnet
    - Document environment configuration
    - Add troubleshooting guide
    - _Requirements: 50.5_

  - [ ] 25.6 Keep documentation synchronized
    - Set up automated documentation generation
    - Add documentation review to PR process
    - Update documentation with code changes
    - _Requirements: 50.6_

- [~] 26. Deploy to testnet and conduct testing
  - [ ] 26.1 Deploy smart contracts to testnets
    - Deploy all contracts to Ethereum Sepolia
    - Deploy all contracts to Polygon Mumbai
    - Deploy all contracts to Arbitrum Sepolia
    - Deploy all contracts to NEAR Testnet
    - Verify contracts on block explorers
    - _Requirements: 49.1_

  - [ ] 26.2 Deploy backend services to staging
    - Deploy Payment Service to staging environment
    - Deploy TEE Service to staging environment
    - Deploy Blockchain Listener to staging environment
    - Deploy API Gateway to staging environment
    - Configure environment variables and secrets
    - _Requirements: 49.2_

  - [ ] 26.3 Conduct end-to-end testing on testnet
    - Test complete payment flow with real transactions
    - Test cross-chain transfers between testnets
    - Test TEE deployment with Phala testnet
    - Test certificate minting and verification
    - Test all API endpoints with testnet contracts
    - _Requirements: 49.4_

  - [ ] 26.4 Conduct security testing
    - Test access control on all contracts
    - Test reentrancy protection
    - Test input validation and edge cases
    - Conduct penetration testing on API
    - _Requirements: 49.1_

  - [ ]* 26.5 Conduct performance testing on testnet
    - Load test API endpoints
    - Measure transaction confirmation times
    - Test blockchain listener under high event volume
    - Identify and fix performance issues
    - _Requirements: 41.1, 41.2, 41.3_

- [x] 27. Checkpoint - Final testing and validation
  - Review all test results and fix any issues
  - Verify all requirements are met
  - Conduct code review for all components
  - Ensure all documentation is complete
  - Ensure all tests pass, ask the user if questions arise

- [~] 28. Prepare for mainnet deployment
  - [ ] 28.1 Conduct smart contract audit
    - Engage reputable audit firm (Trail of Bits, OpenZeppelin, Consensys)
    - Address all audit findings
    - Publish audit report
    - _Requirements: 49.1_

  - [ ] 28.2 Set up bug bounty program
    - Create bug bounty program on Immunefi or HackerOne
    - Define reward tiers for vulnerability severity
    - Publish responsible disclosure policy
    - _Requirements: 49.1_

  - [ ] 28.3 Configure mainnet deployment
    - Prepare mainnet deployment scripts
    - Configure mainnet RPC endpoints
    - Set up mainnet contract addresses
    - Configure production environment variables
    - Set up production monitoring and alerting
    - _Requirements: 50.5_

  - [ ] 28.4 Create incident response plan
    - Document emergency procedures
    - Set up on-call rotation
    - Create communication templates
    - Test emergency pause functionality
    - _Requirements: 40.1-40.10_

  - [ ] 28.5 Deploy to mainnet
    - Deploy contracts to Ethereum mainnet
    - Deploy contracts to Polygon mainnet
    - Deploy contracts to Arbitrum mainnet
    - Deploy contracts to NEAR mainnet
    - Verify all contracts on block explorers
    - Deploy backend services to production
    - Configure production database and Redis
    - _Requirements: 50.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Smart contracts use Solidity for EVM chains (Ethereum, Polygon, Arbitrum)
- Backend services use TypeScript with Node.js
- Testing includes unit tests, integration tests, and property-based tests
- Security is prioritized with reentrancy protection, access control, and input validation
- Performance optimizations include gas efficiency, caching, and database indexing
- Documentation covers API, contracts, SDK, architecture, and deployment
- Deployment follows testnet → audit → mainnet progression
