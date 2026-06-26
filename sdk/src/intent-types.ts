import type { StructuredIntent } from './intent.js';

// ── ERC-7683: Cross-Chain Intent Standard Types ──────────────

export type EscrowType = 'create' | 'fulfill' | 'cancel';

export type OrderStatus = 'open' | 'filled' | 'cancelled' | 'expired';

export interface CrossChainOrder {
  nonce: string;
  deadline: bigint;
  swapper: string;
  swapperDest: string;
  originChainId: bigint;
  initiator: string;
  sender: string;
  originSettler: string;
  originToken: string;
  originAmount: bigint;
  destinationChainId: bigint;
  fillDeadline: bigint;
  destinationSettler: string;
  destinationToken: string;
  destinationAmount: bigint;
  destinationRecipient: string;
  message: string;
}

export interface Output {
  token: string;
  amount: bigint;
  recipient: string;
  chainId: bigint;
}

export interface OutputReceipt {
  output: Output;
  filledAmount: bigint;
}

export interface ResolvedCrossChainOrder {
  nonce: string;
  deadline: bigint;
  swapper: string;
  swapperDest: string;
  originChainId: bigint;
  openDeadline: bigint;
  initiator: string;
  sender: string;
  originSettler: string;
  outputs: Output[];
  outputReceipts: OutputReceipt[];
  fillInstructions: FillInstruction[];
}

export interface FillInstruction {
  destinationSettler: string;
  originData: string;
  fillData: string;
}

export interface SignedCrossChainOrder {
  order: CrossChainOrder;
  signature: string;
  signer: string;
}

export interface FillRequest {
  order: SignedCrossChainOrder;
  fillData: string;
  filler: string;
}

export interface FillResponse {
  fillHash: string;
  status: OrderStatus;
}

// ── NEAR Intents Types ───────────────────────────────────────

export type NearIntentAction =
  | 'token_diff'
  | 'nft_diff'
  | 'ft_transfer'
  | 'native_transfer'
  | 'function_call'
  | 'batch';

export interface TokenDiff {
  token: string;
  amount: string;
  receiver_id: string;
}

export interface NearIntentData {
  diff: TokenDiff[];
  deadline: string;
  signer_id: string;
  nonce: string;
}

export interface NearIntent {
  intent: NearIntentAction;
  signer_id: string;
  deadline: string;
  nonce: string;
  data: NearIntentData;
}

export interface SignedNearIntent {
  intent: NearIntent;
  signature: string;
  public_key: string;
}

export interface NearIntentProof {
  signed_data: SignedNearIntent;
  outcome: string;
}

// ── Kuberna Normalized Intent ────────────────────────────────

export type IntentStandard = 'erc-7683' | 'near-intents' | 'kuberna';

export interface KubernaNormalizedIntent {
  standard: IntentStandard;
  originalFormat: 'erc-7683' | 'near-intents' | 'kuberna';
  nonce: string;
  deadline: bigint;
  swapper: string;
  originChainId: bigint;
  destinationChainId: bigint;
  originToken: string;
  originAmount: bigint;
  destinationToken: string;
  destinationAmount: bigint;
  destinationRecipient: string;
  signer: string;
  signature?: string;
  fillDeadline: bigint;
  message: string;
  attestationRequired: boolean;
}

export interface IntentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ── Normalization Functions ──────────────────────────────────

export function normalizeErc7683(order: CrossChainOrder, signature?: string, signer?: string): KubernaNormalizedIntent {
  return {
    standard: 'erc-7683',
    originalFormat: 'erc-7683',
    nonce: order.nonce,
    deadline: order.deadline,
    swapper: order.swapper,
    originChainId: order.originChainId,
    destinationChainId: order.destinationChainId,
    originToken: order.originToken,
    originAmount: order.originAmount,
    destinationToken: order.destinationToken,
    destinationAmount: order.destinationAmount,
    destinationRecipient: order.destinationRecipient,
    signer: signer ?? order.swapper,
    signature,
    fillDeadline: order.fillDeadline,
    message: order.message,
    attestationRequired: false,
  };
}

export function normalizeNearIntent(intent: NearIntent, signature?: string, publicKey?: string): KubernaNormalizedIntent {
  const diff = intent.data.diff[0];
  const isTokenDiff = intent.intent === 'token_diff';

  return {
    standard: 'near-intents',
    originalFormat: 'near-intents',
    nonce: intent.nonce,
    deadline: BigInt(intent.deadline),
    swapper: intent.signer_id,
    originChainId: BigInt(0),
    destinationChainId: BigInt(0),
    originToken: isTokenDiff ? diff.token : '',
    originAmount: isTokenDiff ? BigInt(diff.amount) : BigInt(0),
    destinationToken: isTokenDiff ? diff.token : '',
    destinationAmount: isTokenDiff ? BigInt(diff.amount) : BigInt(0),
    destinationRecipient: isTokenDiff ? diff.receiver_id : '',
    signer: publicKey ?? intent.signer_id,
    signature,
    fillDeadline: BigInt(intent.deadline),
    message: JSON.stringify(intent),
    attestationRequired: false,
  };
}

export function normalizeKubernaIntent(intent: StructuredIntent): KubernaNormalizedIntent {
  return {
    standard: 'kuberna',
    originalFormat: 'kuberna',
    nonce: '',
    deadline: BigInt(intent.timeoutSeconds),
    swapper: '',
    originChainId: BigInt(parseChainId(intent.sourceChain)),
    destinationChainId: BigInt(parseChainId(intent.destChain)),
    originToken: intent.sourceToken,
    originAmount: parseAmount(intent.sourceAmount),
    destinationToken: intent.destToken,
    destinationAmount: parseAmount(intent.minDestAmount),
    destinationRecipient: '',
    signer: '',
    fillDeadline: BigInt(intent.timeoutSeconds),
    message: intent.rawDescription,
    attestationRequired: false,
  };
}

function parseChainId(chain: string): number {
  const known: Record<string, number> = {
    ethereum: 1,
    'ethereum-mainnet': 1,
    sepolia: 11155111,
    base: 8453,
    'base-sepolia': 84532,
    optimism: 10,
    arbitrum: 42161,
    polygon: 137,
    avalanche: 43114,
    bsc: 56,
    gnosis: 100,
    near: 0,
    solana: 0,
  };
  return known[chain.toLowerCase()] ?? 0;
}

function parseAmount(amount: string): bigint {
  try {
    return BigInt(amount);
  } catch {
    const [whole, fraction = ''] = amount.split('.');
    const padded = fraction.padEnd(18, '0').slice(0, 18);
    return BigInt(whole + padded);
  }
}

export function validateIntent(intent: KubernaNormalizedIntent): IntentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (intent.originAmount <= BigInt(0)) {
    errors.push('originAmount must be positive');
  }
  if (intent.deadline <= BigInt(0)) {
    errors.push('deadline must be positive');
  }
  if (!intent.originToken) {
    errors.push('originToken is required');
  }
  if (!intent.destinationToken) {
    errors.push('destinationToken is required');
  }
  if (!intent.destinationRecipient) {
    warnings.push('destinationRecipient is empty');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Confirmation Gate ────────────────────────────────────────

export interface ConfirmationPolicy {
  requireAttestation: boolean;
  requiredConfirmations: number;
  timeoutMs: number;
  allowedChains: bigint[];
  allowedTokens: string[];
  maxAmount: bigint;
}

export interface ConfirmationCheck {
  intent: KubernaNormalizedIntent;
  policy: ConfirmationPolicy;
  attestationVerified: boolean;
  timestamp: number;
}

export function checkConfirmationPolicy(check: ConfirmationCheck): IntentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (check.policy.requireAttestation && !check.attestationVerified) {
    errors.push('attestation required but not verified');
  }
  if (check.policy.allowedChains.length > 0) {
    if (!check.policy.allowedChains.includes(check.intent.originChainId)) {
      errors.push('origin chain not in allowed list');
    }
    if (!check.policy.allowedChains.includes(check.intent.destinationChainId)) {
      errors.push('destination chain not in allowed list');
    }
  }
  if (check.policy.allowedTokens.length > 0) {
    if (!check.policy.allowedTokens.includes(check.intent.originToken)) {
      errors.push('origin token not in allowed list');
    }
  }
  if (check.policy.maxAmount > BigInt(0) && check.intent.originAmount > check.policy.maxAmount) {
    errors.push('origin amount exceeds max allowed');
  }

  return { valid: errors.length === 0, errors, warnings };
}
