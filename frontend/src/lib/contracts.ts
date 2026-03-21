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

// Environment-driven contract address configuration
// In production, set VITE_ESCROW_ADDRESS, VITE_CERTIFICATE_ADDRESS, etc.
const envAddresses = {
  escrow:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ESCROW_ADDRESS) ||
    '0x0000000000000000000000000000000000000000',
  certificate:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CERTIFICATE_ADDRESS) ||
    '0x0000000000000000000000000000000000000000',
  governanceToken:
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_GOVERNANCE_TOKEN_ADDRESS) ||
    '0x0000000000000000000000000000000000000000',
  attestation:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ATTESTATION_ADDRESS) ||
    '0x0000000000000000000000000000000000000000',
  priceOracle:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PRICE_ORACLE_ADDRESS) ||
    '0x0000000000000000000000000000000000000000',
  crossChainRouter:
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_CROSS_CHAIN_ROUTER_ADDRESS) ||
    '0x0000000000000000000000000000000000000000',
};

export const CONTRACT_ADDRESSES: Record<number, Record<ContractName, string>> = {
  11155111: { ...envAddresses },
  1: { ...envAddresses },
  137: { ...envAddresses },
  42161: { ...envAddresses },
};

export type ContractName =
  | 'escrow'
  | 'certificate'
  | 'governanceToken'
  | 'attestation'
  | 'priceOracle'
  | 'crossChainRouter';

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
