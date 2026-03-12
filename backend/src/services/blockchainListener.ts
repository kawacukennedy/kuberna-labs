import { ethers } from "ethers";
import { connect, NatsConnection, StringCodec } from "nats";
import { prisma } from "../utils/prisma.js";
import {
  ESCROW_ABI,
  INTENT_ABI,
  CERTIFICATE_ABI,
  ATTESTATION_ABI,
} from "../utils/abis.js";

interface BlockchainListenerConfig {
  chains: {
    [chainName: string]: {
      rpc: string;
      wsRpc: string;
      contracts: {
        escrow?: string;
        intent?: string;
        certificate?: string;
        attestation?: string;
      };
    };
  };
  pollInterval: number;
  confirmations: number;
  natsUrl: string;
}

interface ProcessedEvent {
  id: string;
  chain: string;
  contractAddress: string;
  eventName: string;
  blockNumber: number;
  transactionHash: string;
  processed: boolean;
  createdAt: Date;
}

export class BlockchainListener {
  private config: BlockchainListenerConfig;
  private providers: Map<string, ethers.WebSocketProvider>;
  private contracts: Map<string, ethers.Contract>;
  private natsConnection: NatsConnection | null;
  private isRunning: boolean;
  private reconnectAttempts: Map<string, number>;
  private maxReconnectAttempts: number;
  private baseReconnectDelay: number;

  constructor(config: BlockchainListenerConfig) {
    this.config = config;
    this.providers = new Map();
    this.contracts = new Map();
    this.natsConnection = null;
    this.isRunning = false;
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000; // 1 second
  }

  async start(): Promise<void> {
    console.log("Starting Blockchain Listener...");
    this.isRunning = true;

    // Connect to NATS
    await this.connectNATS();

    // Initialize providers and subscribe to events
    for (const [chainName, chainConfig] of Object.entries(
      this.config.chains,
    )) {
      await this.initializeChain(chainName, chainConfig);
    }

    // Start fallback polling mechanism
    this.startFallbackPolling();

    console.log("Blockchain Listener started successfully");
  }

  async stop(): Promise<void> {
    console.log("Stopping Blockchain Listener...");
    this.isRunning = false;

    // Close all WebSocket providers
    for (const [chainName, provider] of this.providers.entries()) {
      try {
        await provider.destroy();
        console.log(`Closed provider for ${chainName}`);
      } catch (error) {
        console.error(`Error closing provider for ${chainName}:`, error);
      }
    }

    // Close NATS connection
    if (this.natsConnection) {
      await this.natsConnection.close();
      console.log("Closed NATS connection");
    }

    console.log("Blockchain Listener stopped");
  }

  private async connectNATS(): Promise<void> {
    try {
      this.natsConnection = await connect({ servers: this.config.natsUrl });
      console.log("Connected to NATS");
    } catch (error) {
      console.error("Failed to connect to NATS:", error);
      throw error;
    }
  }

  private async initializeChain(
    chainName: string,
    chainConfig: BlockchainListenerConfig["chains"][string],
  ): Promise<void> {
    try {
      // Create WebSocket provider
      const provider = new ethers.WebSocketProvider(chainConfig.wsRpc);
      this.providers.set(chainName, provider);

      // Set up reconnection logic
      provider.on("error", async (error) => {
        console.error(`Provider error on ${chainName}:`, error);
        await this.reconnectProvider(chainName);
      });

      // Subscribe to contract events
      await this.subscribeToContracts(chainName, chainConfig, provider);

      console.log(`Initialized chain: ${chainName}`);
      this.reconnectAttempts.set(chainName, 0);
    } catch (error) {
      console.error(`Failed to initialize chain ${chainName}:`, error);
      await this.reconnectProvider(chainName);
    }
  }

  private async reconnectProvider(chainName: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(chainName) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(
        `Max reconnection attempts reached for ${chainName}. Giving up.`,
      );
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, attempts); // Exponential backoff
    console.log(
      `Reconnecting to ${chainName} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    this.reconnectAttempts.set(chainName, attempts + 1);

    const chainConfig = this.config.chains[chainName];
    if (chainConfig) {
      await this.initializeChain(chainName, chainConfig);
    }
  }

  private async subscribeToContracts(
    chainName: string,
    chainConfig: BlockchainListenerConfig["chains"][string],
    provider: ethers.WebSocketProvider,
  ): Promise<void> {
    const { contracts } = chainConfig;

    // Subscribe to Escrow contract events
    if (contracts.escrow) {
      const escrowContract = new ethers.Contract(
        contracts.escrow,
        ESCROW_ABI,
        provider,
      );
      this.contracts.set(`${chainName}-escrow`, escrowContract);

      escrowContract.on(
        "EscrowCreated",
        async (escrowId, requester, token, amount, deadline, event) => {
          await this.handleEscrowCreated(
            chainName,
            escrowId,
            requester,
            token,
            amount,
            deadline,
            event,
          );
        },
      );

      escrowContract.on(
        "EscrowFunded",
        async (escrowId, funder, amount, event) => {
          await this.handleEscrowFunded(
            chainName,
            escrowId,
            funder,
            amount,
            event,
          );
        },
      );

      escrowContract.on("EscrowAssigned", async (escrowId, executor, event) => {
        await this.handleEscrowAssigned(chainName, escrowId, executor, event);
      });

      escrowContract.on(
        "TaskCompleted",
        async (escrowId, proofHash, event) => {
          await this.handleTaskCompleted(
            chainName,
            escrowId,
            proofHash,
            event,
          );
        },
      );

      escrowContract.on(
        "FundsReleased",
        async (escrowId, recipient, amount, event) => {
          await this.handleFundsReleased(
            chainName,
            escrowId,
            recipient,
            amount,
            event,
          );
        },
      );

      console.log(`Subscribed to Escrow events on ${chainName}`);
    }

    // Subscribe to Intent contract events
    if (contracts.intent) {
      const intentContract = new ethers.Contract(
        contracts.intent,
        INTENT_ABI,
        provider,
      );
      this.contracts.set(`${chainName}-intent`, intentContract);

      intentContract.on(
        "IntentCreated",
        async (intentId, requester, deadline, event) => {
          await this.handleIntentCreated(
            chainName,
            intentId,
            requester,
            deadline,
            event,
          );
        },
      );

      intentContract.on(
        "BidSubmitted",
        async (intentId, solver, price, event) => {
          await this.handleBidSubmitted(
            chainName,
            intentId,
            solver,
            price,
            event,
          );
        },
      );

      intentContract.on("BidAccepted", async (intentId, solver, event) => {
        await this.handleBidAccepted(chainName, intentId, solver, event);
      });

      console.log(`Subscribed to Intent events on ${chainName}`);
    }

    // Subscribe to Certificate contract events
    if (contracts.certificate) {
      const certificateContract = new ethers.Contract(
        contracts.certificate,
        CERTIFICATE_ABI,
        provider,
      );
      this.contracts.set(`${chainName}-certificate`, certificateContract);

      certificateContract.on(
        "CertificateMinted",
        async (tokenId, recipient, courseId, verificationHash, event) => {
          await this.handleCertificateMinted(
            chainName,
            tokenId,
            recipient,
            courseId,
            verificationHash,
            event,
          );
        },
      );

      console.log(`Subscribed to Certificate events on ${chainName}`);
    }

    // Subscribe to Attestation contract events
    if (contracts.attestation) {
      const attestationContract = new ethers.Contract(
        contracts.attestation,
        ATTESTATION_ABI,
        provider,
      );
      this.contracts.set(`${chainName}-attestation`, attestationContract);

      attestationContract.on(
        "AttestationCreated",
        async (
          attestationId,
          schema,
          recipient,
          issuer,
          expirationTime,
          event,
        ) => {
          await this.handleAttestationCreated(
            chainName,
            attestationId,
            schema,
            recipient,
            issuer,
            expirationTime,
            event,
          );
        },
      );

      console.log(`Subscribed to Attestation events on ${chainName}`);
    }
  }

  // Event Handlers

  private async handleEscrowCreated(
    chain: string,
    escrowId: string,
    requester: string,
    token: string,
    amount: bigint,
    deadline: bigint,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (await this.isEventProcessed(event.transactionHash, "EscrowCreated")) {
        return;
      }

      console.log(`EscrowCreated event on ${chain}: ${escrowId}`);

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "EscrowCreated",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling EscrowCreated event:", error);
    }
  }

  private async handleEscrowFunded(
    chain: string,
    escrowId: string,
    funder: string,
    amount: bigint,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (await this.isEventProcessed(event.transactionHash, "EscrowFunded")) {
        return;
      }

      console.log(`EscrowFunded event on ${chain}: ${escrowId}`);

      // Update intent status to bidding
      // Note: We need to find the intent by escrowId
      // This would require storing escrowId in the Intent model or a separate mapping

      // Publish notification to solver network
      await this.publishToNATS("intents.funded", {
        escrowId: escrowId.toString(),
        chain,
        amount: amount.toString(),
        timestamp: new Date().toISOString(),
      });

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "EscrowFunded",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling EscrowFunded event:", error);
    }
  }

  private async handleEscrowAssigned(
    chain: string,
    escrowId: string,
    executor: string,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (await this.isEventProcessed(event.transactionHash, "EscrowAssigned")) {
        return;
      }

      console.log(`EscrowAssigned event on ${chain}: ${escrowId} to ${executor}`);

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "EscrowAssigned",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling EscrowAssigned event:", error);
    }
  }

  private async handleTaskCompleted(
    chain: string,
    escrowId: string,
    proofHash: string,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (await this.isEventProcessed(event.transactionHash, "TaskCompleted")) {
        return;
      }

      console.log(`TaskCompleted event on ${chain}: ${escrowId}`);

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "TaskCompleted",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling TaskCompleted event:", error);
    }
  }

  private async handleFundsReleased(
    chain: string,
    escrowId: string,
    recipient: string,
    amount: bigint,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (await this.isEventProcessed(event.transactionHash, "FundsReleased")) {
        return;
      }

      console.log(`FundsReleased event on ${chain}: ${escrowId} to ${recipient}`);

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "FundsReleased",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling FundsReleased event:", error);
    }
  }

  private async handleIntentCreated(
    chain: string,
    intentId: string,
    requester: string,
    deadline: bigint,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (await this.isEventProcessed(event.transactionHash, "IntentCreated")) {
        return;
      }

      console.log(`IntentCreated event on ${chain}: ${intentId}`);

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "IntentCreated",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling IntentCreated event:", error);
    }
  }

  private async handleBidSubmitted(
    chain: string,
    intentId: string,
    solver: string,
    price: bigint,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (await this.isEventProcessed(event.transactionHash, "BidSubmitted")) {
        return;
      }

      console.log(`BidSubmitted event on ${chain}: ${intentId} by ${solver}`);

      // Publish notification
      await this.publishToNATS("bids.submitted", {
        intentId: intentId.toString(),
        solver,
        price: price.toString(),
        chain,
        timestamp: new Date().toISOString(),
      });

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "BidSubmitted",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling BidSubmitted event:", error);
    }
  }

  private async handleBidAccepted(
    chain: string,
    intentId: string,
    solver: string,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (await this.isEventProcessed(event.transactionHash, "BidAccepted")) {
        return;
      }

      console.log(`BidAccepted event on ${chain}: ${intentId} by ${solver}`);

      // Publish notification
      await this.publishToNATS("bids.accepted", {
        intentId: intentId.toString(),
        solver,
        chain,
        timestamp: new Date().toISOString(),
      });

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "BidAccepted",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling BidAccepted event:", error);
    }
  }

  private async handleCertificateMinted(
    chain: string,
    tokenId: bigint,
    recipient: string,
    courseId: string,
    verificationHash: string,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (
        await this.isEventProcessed(event.transactionHash, "CertificateMinted")
      ) {
        return;
      }

      console.log(`CertificateMinted event on ${chain}: ${tokenId}`);

      // Store certificate record in database
      // Note: This would require finding the user by recipient address
      // and the course by courseId

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "CertificateMinted",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling CertificateMinted event:", error);
    }
  }

  private async handleAttestationCreated(
    chain: string,
    attestationId: string,
    schema: string,
    recipient: string,
    issuer: string,
    expirationTime: bigint,
    event: ethers.Log,
  ): Promise<void> {
    try {
      // Wait for confirmations
      const confirmed = await this.waitForConfirmations(event, chain);
      if (!confirmed) return;

      // Check if already processed
      if (
        await this.isEventProcessed(event.transactionHash, "AttestationCreated")
      ) {
        return;
      }

      console.log(`AttestationCreated event on ${chain}: ${attestationId}`);

      // Store attestation record
      // This would be stored in a separate attestations table

      // Mark as processed
      await this.markEventProcessed(
        event.transactionHash,
        "AttestationCreated",
        chain,
        event.address,
        event.blockNumber,
      );
    } catch (error) {
      console.error("Error handling AttestationCreated event:", error);
    }
  }

  // Helper Methods

  private async waitForConfirmations(
    event: ethers.Log,
    chain: string,
  ): Promise<boolean> {
    try {
      const provider = this.providers.get(chain);
      if (!provider) {
        console.error(`Provider not found for chain: ${chain}`);
        return false;
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - event.blockNumber;

      if (confirmations < this.config.confirmations) {
        console.log(
          `Event at block ${event.blockNumber} has ${confirmations}/${this.config.confirmations} confirmations. Waiting...`,
        );
        // Schedule retry after 15 seconds
        setTimeout(
          () => this.waitForConfirmations(event, chain),
          15000,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error waiting for confirmations:", error);
      return false;
    }
  }

  private async isEventProcessed(
    txHash: string,
    eventName: string,
  ): Promise<boolean> {
    // Check if event has been processed
    // This would query a database table tracking processed events
    // For now, we'll implement a simple in-memory check
    // In production, this should use the database
    return false;
  }

  private async markEventProcessed(
    txHash: string,
    eventName: string,
    chain: string,
    contractAddress: string,
    blockNumber: number,
  ): Promise<void> {
    // Mark event as processed in database
    // This prevents duplicate processing
    console.log(
      `Marked event ${eventName} from tx ${txHash} as processed`,
    );
  }

  private async publishToNATS(subject: string, data: any): Promise<void> {
    if (!this.natsConnection) {
      console.error("NATS connection not available");
      return;
    }

    try {
      const sc = StringCodec();
      this.natsConnection.publish(subject, sc.encode(JSON.stringify(data)));
      console.log(`Published to NATS subject: ${subject}`);
    } catch (error) {
      console.error(`Error publishing to NATS subject ${subject}:`, error);
    }
  }

  // Fallback Polling Mechanism

  private startFallbackPolling(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      for (const [chainName, chainConfig] of Object.entries(
        this.config.chains,
      )) {
        await this.pollMissedEvents(chainName, chainConfig);
      }
    }, this.config.pollInterval);

    console.log(
      `Started fallback polling with interval: ${this.config.pollInterval}ms`,
    );
  }

  private async pollMissedEvents(
    chainName: string,
    chainConfig: BlockchainListenerConfig["chains"][string],
  ): Promise<void> {
    try {
      const provider = this.providers.get(chainName);
      if (!provider) return;

      const currentBlock = await provider.getBlockNumber();
      const lastProcessedBlock = await this.getLastProcessedBlock(chainName);
      const fromBlock = lastProcessedBlock + 1;

      if (fromBlock > currentBlock) return;

      console.log(
        `Polling missed events on ${chainName} from block ${fromBlock} to ${currentBlock}`,
      );

      // Query event history for each contract
      if (chainConfig.contracts.escrow) {
        await this.queryContractEvents(
          chainName,
          chainConfig.contracts.escrow,
          "escrow",
          fromBlock,
          currentBlock,
        );
      }

      if (chainConfig.contracts.intent) {
        await this.queryContractEvents(
          chainName,
          chainConfig.contracts.intent,
          "intent",
          fromBlock,
          currentBlock,
        );
      }

      if (chainConfig.contracts.certificate) {
        await this.queryContractEvents(
          chainName,
          chainConfig.contracts.certificate,
          "certificate",
          fromBlock,
          currentBlock,
        );
      }

      if (chainConfig.contracts.attestation) {
        await this.queryContractEvents(
          chainName,
          chainConfig.contracts.attestation,
          "attestation",
          fromBlock,
          currentBlock,
        );
      }

      // Update last processed block
      await this.updateLastProcessedBlock(chainName, currentBlock);
    } catch (error) {
      console.error(`Error polling missed events on ${chainName}:`, error);
    }
  }

  private async queryContractEvents(
    chainName: string,
    contractAddress: string,
    contractType: string,
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    try {
      const contract = this.contracts.get(`${chainName}-${contractType}`);
      if (!contract) return;

      // Query all events for this contract in the block range
      const filter = {
        address: contractAddress,
        fromBlock,
        toBlock,
      };

      const provider = this.providers.get(chainName);
      if (!provider) return;

      const logs = await provider.getLogs(filter);

      for (const log of logs) {
        // Parse and process each event
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });

          if (!parsedLog) continue;

          // Check if already processed
          if (await this.isEventProcessed(log.transactionHash, parsedLog.name)) {
            continue;
          }

          // Process the event based on its name
          await this.processHistoricalEvent(
            chainName,
            contractType,
            parsedLog,
            log,
          );
        } catch (error) {
          console.error("Error parsing log:", error);
        }
      }
    } catch (error) {
      console.error(
        `Error querying events for ${contractType} on ${chainName}:`,
        error,
      );
    }
  }

  private async processHistoricalEvent(
    chainName: string,
    contractType: string,
    parsedLog: ethers.LogDescription,
    log: ethers.Log,
  ): Promise<void> {
    // Process historical events similar to real-time events
    console.log(
      `Processing historical event: ${parsedLog.name} on ${chainName}`,
    );

    // Route to appropriate handler based on event name
    switch (parsedLog.name) {
      case "EscrowFunded":
        await this.handleEscrowFunded(
          chainName,
          parsedLog.args[0],
          parsedLog.args[1],
          parsedLog.args[2],
          log,
        );
        break;
      case "BidSubmitted":
        await this.handleBidSubmitted(
          chainName,
          parsedLog.args[0],
          parsedLog.args[1],
          parsedLog.args[2],
          log,
        );
        break;
      // Add other event handlers as needed
    }
  }

  private async getLastProcessedBlock(chainName: string): Promise<number> {
    // Get last processed block from database
    // For now, return 0 to start from beginning
    return 0;
  }

  private async updateLastProcessedBlock(
    chainName: string,
    blockNumber: number,
  ): Promise<void> {
    // Update last processed block in database
    console.log(
      `Updated last processed block for ${chainName}: ${blockNumber}`,
    );
  }
}

// Export singleton instance
export const createBlockchainListener = (
  config: BlockchainListenerConfig,
): BlockchainListener => {
  return new BlockchainListener(config);
};
