import { KubernaSDK } from './index.js';

/**
 * Parameters for creating a Web3 escrow payment intent.
 */
export interface CreatePaymentIntentParams {
  /** Transfer amount denominated in base token units. */
  amount: string;
  /** Currency code or symbol. */
  currency: string;
  /** Token contract address or native symbol. */
  token: string;
  /** Target blockchain network identifier. */
  chain: string;
  /** Purpose or description of the payment. */
  description?: string;
  /** Arbitrary metadata attached to the intent. */
  metadata?: Record<string, unknown>;
}

/**
 * Result of creating a payment intent, including approval instructions.
 */
export interface PaymentIntent {
  /** Unique payment intent identifier. */
  intentId: string;
  /** Associated on-chain escrow identifier. */
  escrowId: string;
  /** Current state of the intent (e.g., PENDING, FUNDED). */
  status: string;
  /** Required token approval parameters for the user's wallet. */
  requiredApproval: {
    token: string;
    spender: string;
    amount: string;
  };
}

/**
 * Status and details of an escrowed payment intent.
 */
export interface PaymentStatus {
  /** Unique payment intent identifier. */
  intentId: string;
  /** Associated on-chain escrow identifier. */
  escrowId: string;
  /** Current lifecycle status. */
  status: string;
  /** Escrowed payment amount. */
  amount: string;
  /** Token address or symbol. */
  token: string;
  /** Blockchain network name. */
  chain: string;
  /** Address of the requesting account. */
  requester: string;
  /** Address of the executing agent or recipient. */
  executor?: string;
  /** Creation timestamp. */
  createdAt: string;
  /** Last update timestamp. */
  updatedAt: string;
}

/**
 * Information regarding a supported payment token.
 */
export interface TokenInfo {
  /** Token contract address on the target chain. */
  address: string;
  /** Token ticker symbol (e.g., USDC). */
  symbol: string;
  /** Full token name. */
  name: string;
  /** Number of decimal places. */
  decimals: number;
  /** Minimum allowable transfer amount. */
  minAmount: string;
  /** Maximum allowable transfer amount. */
  maxAmount: string;
}

/**
 * Manager class for handling token payments, escrow intents, and settlements.
 */
export class PaymentManager {
  /**
   * Initializes the PaymentManager with a KubernaSDK client instance.
   * @param sdk - The root KubernaSDK instance.
   */
  constructor(private sdk: KubernaSDK) {}

  /**
   * Creates a new payment intent with required token approval parameters.
   * @param params - Configuration parameters for the payment intent.
   * @returns The generated payment intent and escrow configuration.
   */
  async createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/intents',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as PaymentIntent;
  }

  /**
   * Retrieves the current settlement and escrow status of a payment intent.
   * @param intentId - Unique payment intent identifier.
   * @returns Real-time status and escrow details.
   */
  async getStatus(intentId: string): Promise<PaymentStatus> {
    const response = await this.sdk.request({ method: 'GET', path: `/payments/intents/${intentId}` });
    return response.data as PaymentStatus;
  }

  /**
   * Lists all tokens supported for payments on the specified blockchain network.
   * @param chain - Blockchain identifier (e.g., ethereum, polygon).
   * @returns Array of supported token definitions.
   */
  async getSupportedTokens(chain: string): Promise<TokenInfo[]> {
    const response = await this.sdk.request({ method: 'GET', path: '/payments/tokens', data: { chain } });
    return (response.data as { tokens: TokenInfo[] }).tokens;
  }

  /**
   * Releases escrowed funds to the recipient after verified task completion.
   * @param escrowId - Unique escrow identifier.
   * @param chain - Blockchain network identifier.
   * @returns On-chain transaction hash confirming settlement.
   */
  async release(escrowId: string, chain: string): Promise<string> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/release',
      data: { escrowId, chain },
    });
    return (response.data as { txHash: string }).txHash;
  }

  /**
   * Refunds escrowed funds back to the requester.
   * @param escrowId - Unique escrow identifier.
   * @param reason - Reason for issuing the refund.
   * @param chain - Blockchain network identifier.
   * @returns On-chain transaction hash confirming refund.
   */
  async refund(escrowId: string, reason: string, chain: string): Promise<string> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/payments/refund',
      data: { escrowId, reason, chain },
    });
    return (response.data as { txHash: string }).txHash;
  }
}
