/**
 * @deprecated Import ABI definitions from `typechain-types/contracts` instead.
 * This file is kept for backward compatibility. New code should use TypeChain-generated types.
 */
export const ESCROW_ABI = [
  {
    inputs: [
      { name: 'intentId', type: 'string' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'durationSeconds', type: 'uint256' },
    ],
    name: 'createEscrow',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    name: 'fundEscrow',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'executor', type: 'address' },
    ],
    name: 'assignExecutor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'proofHash', type: 'bytes32' },
    ],
    name: 'submitCompletion',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    name: 'releaseFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'reason', type: 'string' },
    ],
    name: 'raiseDispute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'refundToRequester', type: 'bool' },
    ],
    name: 'resolveDispute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    name: 'getEscrow',
    outputs: [
      {
        components: [
          { name: 'requester', type: 'address' },
          { name: 'executor', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'fee', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'intentId', type: 'string' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    name: 'getEscrowStatus',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'escrowId', type: 'bytes32' },
      { indexed: true, name: 'requester', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'EscrowCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'escrowId', type: 'bytes32' },
      { indexed: true, name: 'executor', type: 'address' },
    ],
    name: 'FundsReleased',
    type: 'event',
  },
] as const;

export const CERTIFICATE_ABI = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'recipientName', type: 'string' },
      { name: 'courseTitle', type: 'string' },
      { name: 'courseId', type: 'string' },
      { name: 'instructorName', type: 'string' },
      { name: 'verificationHash', type: 'string' },
    ],
    name: 'mintCertificate',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'verifyCertificate',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getCertificateDetails',
    outputs: [
      {
        components: [
          { name: 'recipientName', type: 'string' },
          { name: 'courseTitle', type: 'string' },
          { name: 'courseId', type: 'string' },
          { name: 'completionDate', type: 'uint256' },
          { name: 'instructorName', type: 'string' },
          { name: 'verificationHash', type: 'string' },
          { name: 'isValid', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserCertificates',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'recipient', type: 'address' },
      { name: 'courseId', type: 'string' },
      { name: 'verificationHash', type: 'string' },
    ],
    name: 'CertificateMinted',
    type: 'event',
  },
] as const;

export const INTENT_ABI = [
  {
    name: 'createIntent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'intentId', type: 'bytes32' },
      { name: 'description', type: 'string' },
      { name: 'structuredData', type: 'bytes' },
      { name: 'sourceToken', type: 'address' },
      { name: 'sourceAmount', type: 'uint256' },
      { name: 'destToken', type: 'address' },
      { name: 'minDestAmount', type: 'uint256' },
      { name: 'budget', type: 'uint256' },
      { name: 'durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'submitBid',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'intentId', type: 'bytes32' },
      { name: 'price', type: 'uint256' },
      { name: 'estimatedTime', type: 'uint256' },
      { name: 'routeDetails', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'acceptBid',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'intentId', type: 'bytes32' },
      { name: 'solverIndex', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'rejectBid',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'intentId', type: 'bytes32' },
      { name: 'solverIndex', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'setEscrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'intentId', type: 'bytes32' },
      { name: 'escrowId', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'completeIntent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'intentId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'getIntent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'intentId', type: 'bytes32' }],
    outputs: [
      {
        components: [
          { name: 'requester', type: 'address' },
          { name: 'description', type: 'string' },
          { name: 'structuredData', type: 'bytes' },
          { name: 'sourceToken', type: 'address' },
          { name: 'sourceAmount', type: 'uint256' },
          { name: 'destToken', type: 'address' },
          { name: 'minDestAmount', type: 'uint256' },
          { name: 'budget', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'selectedSolver', type: 'address' },
          { name: 'escrowId', type: 'bytes32' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getBidCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'intentId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getBid',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'intentId', type: 'bytes32' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [
      {
        components: [
          { name: 'solver', type: 'address' },
          { name: 'price', type: 'uint256' },
          { name: 'estimatedTime', type: 'uint256' },
          { name: 'routeDetails', type: 'bytes' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Fallback addresses (Base Sepolia)
const FALLBACK_ADDRESSES = {
  escrow: '0x360ec009ba6967F5f7C53a88FAD0452C6140493d',
  intent: '0xB819ab0Bac2f22e8895C66fE3aDF23aa0a65145a',
  certificate: '0x5e42c329Ef517B495261f57054d5844EAabD3dbf',
  payment: '0xFFe8A88E9E99938174B8a3C9EcA1c1462315395A',
  subscription: '0x9be7afE1793ad14F9026d7579cf7c2313184a7E0',
  reputation: '0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35',
  agentRegistry: '0x817fB0D00f033bb2982fF44855Fb6F8AE2D41324',
  courseNft: '0x9b0D1d05A6EBafE6364648d9e7109E2C37e331BF',
  workshop: '0x1Fa14FfB410EfA65b3aADBB9B65e2426A1fB0F66',
  dispute: '0x8bcc424C07afCf231046F58B15d3677b8E842023',
  treasury: '0x5DA30BDE4A774dcccE6099717d6b41A6329fDe34',
  feeManager: '0xD27b4Dcec846bdfF2DB9D70B163bfb61A3090E2e',
  attestation: '0xFB105A77806d365EdeCf45F677481043ec1D46F4',
  crossChainRouter: '0xE2924838E5914cE099e5969aD63b0C4A4eeB8BAD',
  governanceToken: '0x0000000000000000000000000000000000000000',
  priceOracle: '0x0000000000000000000000000000000000000000',
  multisig: '0x0000000000000000000000000000000000000000',
  vesting: '0x0000000000000000000000000000000000000000',
};

const readEnv = (key: string): string | undefined => {
  return process.env[key];
};

const envAddresses = {
  escrow: readEnv('NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.escrow,
  intent: readEnv('NEXT_PUBLIC_INTENT_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.intent,
  certificate: readEnv('NEXT_PUBLIC_CERTIFICATE_NFT_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.certificate,
  payment: readEnv('NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.payment,
  subscription: readEnv('NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.subscription,
  reputation: readEnv('NEXT_PUBLIC_REPUTATION_NFT_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.reputation,
  agentRegistry: readEnv('NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.agentRegistry,
  courseNft: readEnv('NEXT_PUBLIC_COURSE_NFT_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.courseNft,
  workshop: readEnv('NEXT_PUBLIC_WORKSHOP_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.workshop,
  dispute: readEnv('NEXT_PUBLIC_DISPUTE_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.dispute,
  treasury: readEnv('NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.treasury,
  feeManager: readEnv('NEXT_PUBLIC_FEE_MANAGER_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.feeManager,
  attestation: readEnv('NEXT_PUBLIC_ATTESTATION_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.attestation,
  crossChainRouter: readEnv('NEXT_PUBLIC_CROSSCHAIN_ROUTER_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.crossChainRouter,
  governanceToken: readEnv('NEXT_PUBLIC_GOVERNANCE_TOKEN_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.governanceToken,
  priceOracle: readEnv('NEXT_PUBLIC_PRICE_ORACLE_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.priceOracle,
  multisig: readEnv('NEXT_PUBLIC_MULTISIG_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.multisig,
  vesting: readEnv('NEXT_PUBLIC_VESTING_CONTRACT_ADDRESS') || FALLBACK_ADDRESSES.vesting,
};

export const CONTRACT_ADDRESSES: Record<number, Record<ContractName, string>> = {
  84532: { ...envAddresses }, // Base Sepolia
  11155111: { ...envAddresses }, // Sepolia
  1: { ...envAddresses }, // Ethereum Mainnet
  137: { ...envAddresses }, // Polygon
  42161: { ...envAddresses }, // Arbitrum
  16602: { ...envAddresses }, // 0G Galileo Testnet
};

export type ContractName =
  | 'escrow'
  | 'intent'
  | 'certificate'
  | 'payment'
  | 'subscription'
  | 'reputation'
  | 'agentRegistry'
  | 'courseNft'
  | 'workshop'
  | 'dispute'
  | 'treasury'
  | 'feeManager'
  | 'attestation'
  | 'crossChainRouter'
  | 'governanceToken'
  | 'priceOracle'
  | 'multisig'
  | 'vesting';

export const getContractAddress = (chainId: number, contract: ContractName): string => {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  return addresses?.[contract] || '';
};

export const governanceTokenABI = [
  {
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'constructor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'delegatee', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getVotes',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'blockNumber', type: 'uint256' },
    ],
    name: 'getPastVotes',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const attestationABI = [
  {
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'constructor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { name: 'schema', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'expirationTime', type: 'uint64' },
      { name: 'data', type: 'bytes' },
    ],
    name: 'attest',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'schema', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'expirationTime', type: 'uint64' },
      { name: 'data', type: 'bytes' },
      { name: 'signature', type: 'bytes' },
    ],
    name: 'attestBySignature',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'attestationId', type: 'bytes32' }],
    name: 'revoke',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'attestationId', type: 'bytes32' }],
    name: 'verify',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'attestationId', type: 'bytes32' }],
    name: 'getAttestation',
    outputs: [
      {
        components: [
          { name: 'schema', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'issuer', type: 'address' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'issuedAt', type: 'uint64' },
          { name: 'data', type: 'bytes' },
          { name: 'revoked', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'issuer', type: 'address' }],
    name: 'getIssuerAttestations',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'recipient', type: 'address' }],
    name: 'getRecipientAttestations',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const priceOracleABI = [
  {
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'constructor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'price', type: 'uint256' },
    ],
    name: 'setPendingPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'confirmPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'fallbackPrice', type: 'uint256' },
    ],
    name: 'getPriceOrFallback',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getPriceData',
    outputs: [
      { name: 'price', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getPriceHistory',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const multisigABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    name: 'submitTransaction',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'confirmTransaction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'revokeConfirmation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'executeTransaction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'getTransaction',
    outputs: [
      {
        components: [
          { name: 'to', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'executed', type: 'bool' },
          { name: 'confirmationCount', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'isConfirmed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getOwners',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'threshold',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'isOwner',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: false, name: 'to', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'TransactionSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
    ],
    name: 'TransactionConfirmed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
    ],
    name: 'TransactionExecuted',
    type: 'event',
  },
] as const;

export const vestingABI = [
  {
    inputs: [
      { name: 'beneficiary', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
    ],
    name: 'createVesting',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'release',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'computeReleasable',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'computeVested',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'revoke',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'beneficiary', type: 'address' }],
    name: 'getBeneficiarySchedules',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'bytes32' },
      { indexed: false, name: 'beneficiary', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'VestingCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'bytes32' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'VestingReleased',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'id', type: 'bytes32' }],
    name: 'VestingRevoked',
    type: 'event',
  },
] as const;

export const crossChainRouterABI = [
  {
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'constructor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { name: 'destinationChainId', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'minReceived', type: 'uint256' },
    ],
    name: 'initiateTransfer',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'messageId', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'minReceived', type: 'uint256' },
    ],
    name: 'executeTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'chainId', type: 'uint256' },
      { name: 'supported', type: 'bool' },
    ],
    name: 'setChainSupport',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newFee', type: 'uint256' }],
    name: 'setBridgeFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tolerance', type: 'uint256' }],
    name: 'setSlippageTolerance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'getMinReceived',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'messageId', type: 'bytes32' }],
    name: 'getMessage',
    outputs: [
      {
        components: [
          { name: 'messageId', type: 'bytes32' },
          { name: 'sourceChainId', type: 'uint256' },
          { name: 'destinationChainId', type: 'uint256' },
          { name: 'sender', type: 'address' },
          { name: 'recipient', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'nonce', type: 'uint256' },
          { name: 'executed', type: 'bool' },
          { name: 'timestamp', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const PAYMENT_ABI = [
  {
    inputs: [{ name: 'token', type: 'address' }, { name: 'minAmount', type: 'uint256' }, { name: 'maxAmount', type: 'uint256' }],
    name: 'addToken', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'removeToken', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'processPayment', outputs: [], stateMutability: 'payable', type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'withdraw', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'token', type: 'address' }],
    name: 'getBalance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function',
  },
  {
    inputs: [], name: 'getSupportedTokens', outputs: [{ name: '', type: 'address[]' }], stateMutability: 'view', type: 'function',
  },
] as const;

export const SUBSCRIPTION_ABI = [
  {
    name: 'createPlan', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' }, { name: 'token', type: 'address' },
      { name: 'price', type: 'uint256' }, { name: 'planType', type: 'uint8' },
      { name: 'durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'subscribe', type: 'function', stateMutability: 'payable',
    inputs: [{ name: 'planId', type: 'uint256' }], outputs: [],
  },
  {
    name: 'cancelSubscription', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'planId', type: 'uint256' }], outputs: [],
  },
  {
    name: 'getSubscription', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }, { name: 'planId', type: 'uint256' }],
    outputs: [{
      components: [
        { name: 'subscriber', type: 'address' }, { name: 'planId', type: 'uint256' },
        { name: 'startTime', type: 'uint256' }, { name: 'nextPaymentTime', type: 'uint256' },
        { name: 'amountPaid', type: 'uint256' }, { name: 'status', type: 'uint8' },
      ],
      name: '', type: 'tuple',
    }],
  },
  {
    name: 'getPlan', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'planId', type: 'uint256' }],
    outputs: [{
      components: [
        { name: 'name', type: 'string' }, { name: 'token', type: 'address' },
        { name: 'price', type: 'uint256' }, { name: 'planType', type: 'uint8' },
        { name: 'durationSeconds', type: 'uint256' }, { name: 'active', type: 'bool' },
      ],
      name: '', type: 'tuple',
    }],
  },
  {
    name: 'isActive', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }, { name: 'planId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const REPUTATION_ABI = [
  {
    inputs: [{ name: 'agentAddress', type: 'address' }, { name: 'name', type: 'string' }, { name: 'framework', type: 'string' }, { name: 'metadataURI', type: 'string' }],
    name: 'registerAgent', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'success', type: 'bool' }, { name: 'responseTimeSeconds', type: 'uint256' }],
    name: 'updateReputation', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'calculateScore', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getSuccessRate', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getBadges', outputs: [{ name: '', type: 'tuple[]' }], stateMutability: 'view', type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getStarRating', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function',
  },
] as const;

export const AGENT_REGISTRY_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' }, { name: 'name', type: 'string' },
      { name: 'description', type: 'string' }, { name: 'framework', type: 'string' },
      { name: 'model', type: 'string' }, { name: 'config', type: 'string' },
      { name: 'tools', type: 'string[]' },
    ],
    name: 'registerAgent', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'description', type: 'string' }, { name: 'model', type: 'string' }, { name: 'config', type: 'string' }],
    name: 'updateAgent', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'status', type: 'uint8' }],
    name: 'setStatus', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getAgent', outputs: [{ name: '', type: 'tuple' }], stateMutability: 'view', type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getOwnerAgents', outputs: [{ name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function',
  },
] as const;

export const COURSE_NFT_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' }, { name: 'description', type: 'string' },
      { name: 'metadataURI', type: 'string' }, { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' }, { name: 'maxStudents', type: 'uint256' },
      { name: 'hasCertificate', type: 'bool' }, { name: 'duration', type: 'uint256' },
    ],
    name: 'createCourse', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'courseId', type: 'uint256' }, { name: 'student', type: 'address' }],
    name: 'enrollStudent', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'courseId', type: 'uint256' }, { name: 'student', type: 'address' }],
    name: 'isEnrolled', outputs: [{ name: '', type: 'bool' }], stateMutability: 'view', type: 'function',
  },
  {
    inputs: [{ name: 'courseId', type: 'uint256' }],
    name: 'getCourse', outputs: [{ name: '', type: 'tuple' }], stateMutability: 'view', type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserCourses', outputs: [{ name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function',
  },
] as const;

export const WORKSHOP_ABI = [
  {
    inputs: [
      { name: 'title', type: 'string' }, { name: 'description', type: 'string' },
      { name: 'instructor', type: 'string' }, { name: 'startTime', type: 'uint256' },
      { name: 'duration', type: 'uint256' }, { name: 'maxParticipants', type: 'uint256' },
      { name: 'streamingUrl', type: 'string' },
    ],
    name: 'createWorkshop', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'workshopId', type: 'uint256' }],
    name: 'register', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'workshopId', type: 'uint256' }],
    name: 'workshops', outputs: [{ name: '', type: 'tuple' }], stateMutability: 'view', type: 'function',
  },
] as const;

export const DISPUTE_ABI = [
  {
    inputs: [{ name: 'disputeId', type: 'bytes32' }, { name: 'vote', type: 'uint8' }],
    name: 'castVote', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'disputeId', type: 'bytes32' }],
    name: 'resolveDispute', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'disputeId', type: 'bytes32' }],
    name: 'disputes', outputs: [{ name: '', type: 'tuple' }], stateMutability: 'view', type: 'function',
  },
] as const;

export const TREASURY_ABI = [
  {
    inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'deposit', outputs: [], stateMutability: 'payable', type: 'function',
  },
  {
    inputs: [{ name: 'recipient', type: 'address' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'description', type: 'string' }],
    name: 'createProposal', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'support', type: 'bool' }],
    name: 'castVote', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'getProposal', outputs: [{ name: '', type: 'tuple' }], stateMutability: 'view', type: 'function',
  },
] as const;

export const FEE_MANAGER_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }, { name: 'share', type: 'uint256' }],
    name: 'addRecipient', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'distributeFees', outputs: [], stateMutability: 'nonpayable', type: 'function',
  },
  {
    inputs: [],
    name: 'getRecipients', outputs: [{ name: '', type: 'tuple[]' }], stateMutability: 'view', type: 'function',
  },
  {
    inputs: [],
    name: 'platformFee', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function',
  },
] as const;

export enum EscrowStatusType {
  None = 0,
  Funded = 1,
  Assigned = 2,
  Completed = 3,
  Disputed = 4,
  Released = 5,
  Refunded = 6,
  Expired = 7,
}

export type EscrowStatusString =
  | 'None'
  | 'Funded'
  | 'Assigned'
  | 'Completed'
  | 'Disputed'
  | 'Released'
  | 'Refunded'
  | 'Expired';

export const ESCROW_STATUS_MAP: Record<number, EscrowStatusString> = {
  [EscrowStatusType.None]: 'None',
  [EscrowStatusType.Funded]: 'Funded',
  [EscrowStatusType.Assigned]: 'Assigned',
  [EscrowStatusType.Completed]: 'Completed',
  [EscrowStatusType.Disputed]: 'Disputed',
  [EscrowStatusType.Released]: 'Released',
  [EscrowStatusType.Refunded]: 'Refunded',
  [EscrowStatusType.Expired]: 'Expired',
};

export function mapEscrowStatus(status: number): EscrowStatusString {
  return ESCROW_STATUS_MAP[status] || 'None';
}
