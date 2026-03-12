import { ethers } from "ethers";
import { prisma } from "../utils/prisma";
import { ESCROW_ABI, INTENT_ABI } from "../utils/abis";
import { connect } from "nats";

// Payment ABI
const PAYMENT_ABI = [
  "function processPayment(address token, uint256 amount) external payable",
  "function withdraw(address token, uint256 amount) external",
  "function getBalance(address user, address token) external view returns (uint256)",
  "function getSupportedTokens() external view returns (address[])",
  "function addToken(address token, uint256 minAmount, uint256 maxAmount) external",
];

// Chainlink Price Feed ABI
const PRICE_FEED_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() external view returns (uint8)",
];

export interface PaymentServiceConfig {
  rpcUrls: {
    ethereum: string;
    polygon: string;
    arbitrum: string;
    near: string;
    solana: string;
  };
  contractAddresses: {
    escrow: Record<string, string>;
    payment: Record<string, string>;
    intent: Record<string, string>;
  };
  priceFeedAddresses: {
    ethereum: Record<string, string>;
    polygon: Record<string, string>;
    arbitrum: Record<string, string>;
  };
  natsUrl: string;
  privateKey: string;
}

export interface CreatePaymentIntentRequest {
  userId: string;
  amount: string;
  currency: string;
  token: string;
  chain: string;
  metadata?: {
    description?: string;
    durationSeconds?: number;
    sourceChain?: string;
    destChain?: string;
    destToken?: string;
    minDestAmount?: string;
  };
}

export interface CreatePaymentIntentResponse {
  intentId: string;
  escrowId: string;
  status: string;
  requiredApproval: {
    token: string;
    spender: string;
    amount: string;
  };
}

export interface PaymentStatus {
  intentId: string;
  escrowId: string;
  status: string;
  amount: string;
  token: string;
  chain: string;
  requester: string;
  executor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
  totalCostUSD: string;
  warning?: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  minAmount: string;
  maxAmount: string;
}

export class PaymentService {
  private config: PaymentServiceConfig;
  private providers: Map<string, ethers.JsonRpcProvider>;
  private wallets: Map<string, ethers.Wallet>;
  private natsConnection: any;

  constructor(config: PaymentServiceConfig) {
    this.config = config;
    this.providers = new Map();
    this.wallets = new Map();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize providers for all chains
    for (const [chain, rpcUrl] of Object.entries(this.config.rpcUrls)) {
      if (rpcUrl && chain !== "near" && chain !== "solana") {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.providers.set(chain, provider);

        const wallet = new ethers.Wallet(this.config.privateKey, provider);
        this.wallets.set(chain, wallet);
      }
    }
  }

  private async connectNATS(): Promise<void> {
    if (!this.natsConnection) {
      this.natsConnection = await connect({ servers: this.config.natsUrl });
    }
  }

  private getProvider(chain: string): ethers.JsonRpcProvider {
    const provider = this.providers.get(chain);
    if (!provider) {
      throw new Error(`Provider not configured for chain: ${chain}`);
    }
    return provider;
  }

  private getWallet(chain: string): ethers.Wallet {
    const wallet = this.wallets.get(chain);
    if (!wallet) {
      throw new Error(`Wallet not configured for chain: ${chain}`);
    }
    return wallet;
  }

  private getEscrowContract(chain: string): ethers.Contract {
    const address = this.config.contractAddresses.escrow[chain];
    if (!address) {
      throw new Error(`Escrow contract not configured for chain: ${chain}`);
    }
    const wallet = this.getWallet(chain);
    return new ethers.Contract(address, ESCROW_ABI, wallet);
  }

  private getIntentContract(chain: string): ethers.Contract {
    const address = this.config.contractAddresses.intent[chain];
    if (!address) {
      throw new Error(`Intent contract not configured for chain: ${chain}`);
    }
    const wallet = this.getWallet(chain);
    return new ethers.Contract(address, INTENT_ABI, wallet);
  }

  private getPaymentContract(chain: string): ethers.Contract {
    const address = this.config.contractAddresses.payment[chain];
    if (!address) {
      throw new Error(`Payment contract not configured for chain: ${chain}`);
    }
    const wallet = this.getWallet(chain);
    return new ethers.Contract(address, PAYMENT_ABI, wallet);
  }

  /**
   * Task 11.2: Create payment intent
   * Requirements: 12.1-12.8
   */
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    // Validate request
    if (!request.amount || parseFloat(request.amount) <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const supportedTokens = await this.getSupportedTokens(request.chain);
    const tokenSupported = supportedTokens.some(
      (t) => t.address.toLowerCase() === request.token.toLowerCase()
    );
    if (!tokenSupported && request.token !== ethers.ZeroAddress) {
      throw new Error(`Token ${request.token} not supported on ${request.chain}`);
    }

    // Generate unique intent ID
    const intentId = ethers.id(
      `${request.userId}-${request.chain}-${Date.now()}-${Math.random()}`
    );

    // Prepare structured data
    const structuredData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "string", "string", "string"],
      [
        request.metadata?.sourceChain || request.chain,
        request.metadata?.destChain || request.chain,
        request.metadata?.destToken || request.token,
        request.metadata?.minDestAmount || request.amount,
        JSON.stringify(request.metadata || {}),
      ]
    );

    const durationSeconds = request.metadata?.durationSeconds || 86400; // 24 hours default

    // Create intent on-chain
    const intentContract = this.getIntentContract(request.chain);
    const intentTx = await intentContract.createIntent(
      intentId,
      request.metadata?.description || "Payment intent",
      structuredData,
      request.token,
      ethers.parseUnits(request.amount, 18),
      request.metadata?.destToken || request.token,
      ethers.parseUnits(request.metadata?.minDestAmount || request.amount, 18),
      ethers.parseUnits(request.amount, 18),
      durationSeconds
    );
    await intentTx.wait();

    // Create escrow on-chain
    const escrowContract = this.getEscrowContract(request.chain);
    const escrowTx = await escrowContract.createEscrow(
      intentId,
      request.token,
      ethers.parseUnits(request.amount, 18),
      durationSeconds
    );
    const escrowReceipt = await escrowTx.wait();

    // Extract escrow ID from event
    const escrowCreatedEvent = escrowReceipt.logs.find((log: any) => {
      try {
        const parsed = escrowContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        return parsed?.name === "EscrowCreated";
      } catch {
        return false;
      }
    });

    let escrowId: string;
    if (escrowCreatedEvent) {
      const parsed = escrowContract.interface.parseLog({
        topics: escrowCreatedEvent.topics as string[],
        data: escrowCreatedEvent.data,
      });
      escrowId = parsed?.args[0];
    } else {
      // Fallback: generate escrow ID
      escrowId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["string", "address", "uint256"],
          [intentId, await this.getWallet(request.chain).getAddress(), Date.now()]
        )
      );
    }

    // Store in database
    const expiresAt = new Date(Date.now() + durationSeconds * 1000);

    await prisma.intent.create({
      data: {
        id: intentId,
        requesterId: request.userId,
        description: request.metadata?.description || "Payment intent",
        structuredData: request.metadata || {},
        sourceChain: request.metadata?.sourceChain || request.chain,
        sourceToken: request.token,
        sourceAmount: request.amount,
        destChain: request.metadata?.destChain || request.chain,
        destToken: request.metadata?.destToken || request.token,
        minDestAmount: request.metadata?.minDestAmount || request.amount,
        deadline: expiresAt,
        budget: request.amount,
        status: "OPEN",
        expiresAt,
      },
    });

    // Note: Escrow records would typically be stored in a separate table
    // For now, we'll track it in the intent's metadata

    return {
      intentId,
      escrowId,
      status: "created",
      requiredApproval: {
        token: request.token,
        spender: this.config.contractAddresses.escrow[request.chain],
        amount: request.amount,
      },
    };
  }

  /**
   * Task 11.3: Fund escrow and track funding
   * Requirements: 13.1-13.6
   */
  async fundEscrow(escrowId: string, txHash: string, chain: string): Promise<void> {
    // Verify transaction has required confirmations
    const provider = this.getProvider(chain);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      throw new Error("Transaction not found");
    }

    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }

    // Wait for confirmations (at least 3)
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;

    if (confirmations < 3) {
      throw new Error(
        `Insufficient confirmations: ${confirmations}/3. Please wait for more confirmations.`
      );
    }

    // Verify the transaction funded this escrow
    const escrowContract = this.getEscrowContract(chain);
    const fundedEvent = receipt.logs.find((log) => {
      try {
        const parsed = escrowContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        return parsed?.name === "EscrowFunded" && parsed.args[0] === escrowId;
      } catch {
        return false;
      }
    });

    if (!fundedEvent) {
      throw new Error("No EscrowFunded event found for this escrow");
    }

    // Get escrow data to find associated intent
    const escrowData = await escrowContract.getEscrow(escrowId);
    const intentId = escrowData.intentId;

    // Update intent status to bidding
    await prisma.intent.update({
      where: { id: intentId },
      data: {
        status: "BIDDING",
        escrowId,
      },
    });

    // Publish notification to solver network via NATS
    await this.connectNATS();
    const js = this.natsConnection.jetstream();
    await js.publish(
      "intents.funded",
      JSON.stringify({
        intentId,
        escrowId,
        chain,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Task 11.4: Release payment and refund
   * Requirements: 14.1-14.5
   */
  async releasePayment(escrowId: string, chain: string): Promise<string> {
    // Verify escrow status
    const escrowContract = this.getEscrowContract(chain);
    const escrowData = await escrowContract.getEscrow(escrowId);

    if (escrowData.status !== 3) {
      // 3 = Completed
      throw new Error("Escrow is not in completed status");
    }

    // Call releaseFunds
    const releaseTx = await escrowContract.releaseFunds(escrowId);
    const releaseReceipt = await releaseTx.wait();

    // Update database
    const intentId = escrowData.intentId;
    await prisma.intent.update({
      where: { id: intentId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return releaseReceipt.hash;
  }

  async refundPayment(escrowId: string, reason: string, chain: string): Promise<string> {
    const escrowContract = this.getEscrowContract(chain);

    // Raise dispute for refund
    const refundTx = await escrowContract.raiseDispute(escrowId, reason);
    const refundReceipt = await refundTx.wait();

    // Update database
    const escrowData = await escrowContract.getEscrow(escrowId);
    const intentId = escrowData.intentId;

    await prisma.intent.update({
      where: { id: intentId },
      data: {
        status: "DISPUTED",
      },
    });

    return refundReceipt.hash;
  }

  /**
   * Task 11.5: Process withdrawal
   * Requirements: 15.1-15.4
   */
  async processWithdrawal(
    userId: string,
    token: string,
    amount: string,
    chain: string
  ): Promise<string> {
    const paymentContract = this.getPaymentContract(chain);

    // Verify user has sufficient balance
    const userAddress = await this.getUserAddress(userId);
    const balance = await paymentContract.getBalance(userAddress, token);

    const amountWei = ethers.parseUnits(amount, 18);
    if (balance < amountWei) {
      throw new Error(
        `Insufficient balance. Available: ${ethers.formatUnits(balance, 18)}, Requested: ${amount}`
      );
    }

    // Call withdraw function
    const withdrawTx = await paymentContract.withdraw(token, amountWei);
    const withdrawReceipt = await withdrawTx.wait();

    return withdrawReceipt.hash;
  }

  private async getUserAddress(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { web3Address: true },
    });

    if (!user?.web3Address) {
      throw new Error("User does not have a web3 address");
    }

    return user.web3Address;
  }

  /**
   * Task 11.6: Gas estimation and token support
   * Requirements: 26.1-26.4
   */
  async estimateGas(
    chain: string,
    operation: string,
    params: any
  ): Promise<GasEstimate> {
    const provider = this.getProvider(chain);
    const wallet = this.getWallet(chain);

    let gasLimit: bigint;
    let tx: any;

    // Estimate gas based on operation
    switch (operation) {
      case "createEscrow":
        const escrowContract = this.getEscrowContract(chain);
        gasLimit = await escrowContract.createEscrow.estimateGas(
          params.intentId,
          params.token,
          ethers.parseUnits(params.amount, 18),
          params.durationSeconds
        );
        break;

      case "fundEscrow":
        const escrowContractFund = this.getEscrowContract(chain);
        const isNative = params.token === ethers.ZeroAddress;
        gasLimit = await escrowContractFund.fundEscrow.estimateGas(
          params.escrowId,
          isNative ? { value: ethers.parseUnits(params.amount, 18) } : {}
        );
        break;

      case "releaseFunds":
        const escrowContractRelease = this.getEscrowContract(chain);
        gasLimit = await escrowContractRelease.releaseFunds.estimateGas(params.escrowId);
        break;

      case "withdraw":
        const paymentContract = this.getPaymentContract(chain);
        gasLimit = await paymentContract.withdraw.estimateGas(
          params.token,
          ethers.parseUnits(params.amount, 18)
        );
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);

    // Calculate total cost
    const totalCost = gasLimit * gasPrice;
    const totalCostEth = ethers.formatEther(totalCost);

    // Get USD price
    const totalCostUSD = await this.convertToUSD(chain, totalCostEth);

    // Check for gas price spikes
    const avgGasPrice = await this.getAverageGasPrice(chain);
    let warning: string | undefined;

    if (gasPrice > avgGasPrice * BigInt(2)) {
      warning = `Gas price is currently ${((Number(gasPrice) / Number(avgGasPrice) - 1) * 100).toFixed(0)}% higher than average. Consider waiting for lower gas prices.`;
    }

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      totalCost: totalCost.toString(),
      totalCostUSD,
      warning,
    };
  }

  private async getAverageGasPrice(chain: string): Promise<bigint> {
    // In production, this would query historical gas prices
    // For now, return current gas price as baseline
    const provider = this.getProvider(chain);
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  private async convertToUSD(chain: string, ethAmount: string): Promise<string> {
    try {
      // Get price feed address for the chain
      const chainFeeds = this.config.priceFeedAddresses[chain as keyof typeof this.config.priceFeedAddresses];
      const priceFeedAddress = chainFeeds?.["ETH/USD"];
      if (!priceFeedAddress) {
        return "0.00";
      }

      const provider = this.getProvider(chain);
      const priceFeed = new ethers.Contract(priceFeedAddress, PRICE_FEED_ABI, provider);

      const roundData = await priceFeed.latestRoundData();
      const decimals = await priceFeed.decimals();

      // Price is in USD with decimals (usually 8)
      const priceUSD = Number(roundData.answer) / Math.pow(10, Number(decimals));
      const ethValue = parseFloat(ethAmount);
      const usdValue = ethValue * priceUSD;

      return usdValue.toFixed(2);
    } catch (error) {
      console.error("Error converting to USD:", error);
      return "0.00";
    }
  }

  async getSupportedTokens(chain: string): Promise<TokenInfo[]> {
    try {
      const paymentContract = this.getPaymentContract(chain);
      const tokenAddresses = await paymentContract.getSupportedTokens();

      const tokens: TokenInfo[] = [];

      for (const address of tokenAddresses) {
        if (address === ethers.ZeroAddress) {
          // Native token
          tokens.push({
            address: ethers.ZeroAddress,
            symbol: this.getNativeTokenSymbol(chain),
            name: this.getNativeTokenName(chain),
            decimals: 18,
            minAmount: "0",
            maxAmount: ethers.MaxUint256.toString(),
          });
        } else {
          // ERC20 token
          const tokenContract = new ethers.Contract(
            address,
            [
              "function symbol() view returns (string)",
              "function name() view returns (string)",
              "function decimals() view returns (uint8)",
            ],
            this.getProvider(chain)
          );

          const [symbol, name, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.name(),
            tokenContract.decimals(),
          ]);

          tokens.push({
            address,
            symbol,
            name,
            decimals,
            minAmount: "0",
            maxAmount: ethers.MaxUint256.toString(),
          });
        }
      }

      return tokens;
    } catch (error) {
      console.error("Error getting supported tokens:", error);
      return [];
    }
  }

  private getNativeTokenSymbol(chain: string): string {
    const symbols: Record<string, string> = {
      ethereum: "ETH",
      polygon: "MATIC",
      arbitrum: "ETH",
    };
    return symbols[chain] || "ETH";
  }

  private getNativeTokenName(chain: string): string {
    const names: Record<string, string> = {
      ethereum: "Ethereum",
      polygon: "Polygon",
      arbitrum: "Arbitrum",
    };
    return names[chain] || "Ethereum";
  }

  async getPaymentStatus(intentId: string): Promise<PaymentStatus> {
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        requester: {
          select: {
            web3Address: true,
          },
        },
      },
    });

    if (!intent) {
      throw new Error("Intent not found");
    }

    return {
      intentId: intent.id,
      escrowId: intent.escrowId || "",
      status: intent.status.toLowerCase(),
      amount: intent.sourceAmount,
      token: intent.sourceToken,
      chain: intent.sourceChain,
      requester: intent.requester.web3Address || "",
      executor: intent.selectedSolverId || undefined,
      createdAt: intent.createdAt,
      updatedAt: intent.expiresAt,
    };
  }
}

// Export singleton instance
export const createPaymentService = (config: PaymentServiceConfig): PaymentService => {
  return new PaymentService(config);
};
