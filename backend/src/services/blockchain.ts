import { ethers } from "ethers";
import { 
  ESCROW_ABI, 
  INTENT_ABI, 
  AGENT_REGISTRY_ABI, 
  CERTIFICATE_ABI, 
  REPUTATION_ABI 
} from "../utils/abis.js";

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
    const privateKey =
      process.env.PRIVATE_KEY ||
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  getSigner(): ethers.Signer {
    return this.wallet;
  }

  getEscrowContract(address: string): ethers.Contract {
    return new ethers.Contract(address, ESCROW_ABI, this.wallet);
  }

  getIntentContract(address: string): ethers.Contract {
    return new ethers.Contract(address, INTENT_ABI, this.wallet);
  }

  getAgentRegistryContract(address: string): ethers.Contract {
    return new ethers.Contract(address, AGENT_REGISTRY_ABI, this.wallet);
  }

  getCertificateContract(address: string): ethers.Contract {
    return new ethers.Contract(address, CERTIFICATE_ABI, this.wallet);
  }

  getReputationContract(address: string): ethers.Contract {
    return new ethers.Contract(address, REPUTATION_ABI, this.wallet);
  }

  async createEscrow(
    intentId: string,
    token: string,
    amount: bigint,
    durationSeconds: number,
    contractAddress: string,
  ): Promise<string> {
    const contract = this.getEscrowContract(contractAddress);
    try {
      const tx = await contract.createEscrow(
        intentId,
        token,
        amount,
        durationSeconds,
      );
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      console.error("Error creating escrow:", error);
      throw new Error(`Failed to create escrow: ${error.message}`);
    }
  }

  async fundEscrow(
    escrowId: string,
    amount: bigint,
    contractAddress: string,
    isNative: boolean = true,
  ): Promise<string> {
    const contract = this.getEscrowContract(contractAddress);
    const overrides = isNative ? { value: amount } : {};
    const tx = await contract.fundEscrow(escrowId, overrides);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async createIntent(
    intentId: string,
    description: string,
    structuredData: string,
    sourceToken: string,
    sourceAmount: bigint,
    destToken: string,
    minDestAmount: bigint,
    budget: bigint,
    durationSeconds: number,
    contractAddress: string,
  ): Promise<string> {
    const contract = this.getIntentContract(contractAddress);
    const tx = await contract.createIntent(
      intentId,
      description,
      structuredData,
      sourceToken,
      sourceAmount,
      destToken,
      minDestAmount,
      budget,
      durationSeconds,
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async submitBid(
    intentId: string,
    price: bigint,
    estimatedTime: number,
    routeDetails: string,
    contractAddress: string,
  ): Promise<string> {
    const contract = this.getIntentContract(contractAddress);
    const tx = await contract.submitBid(
      intentId,
      price,
      estimatedTime,
      routeDetails,
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async acceptBid(
    intentId: string,
    solverIndex: number,
    contractAddress: string,
  ): Promise<string> {
    const contract = this.getIntentContract(contractAddress);
    const tx = await contract.acceptBid(intentId, solverIndex);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async registerAgent(
    owner: string,
    name: string,
    description: string,
    framework: string,
    model: string,
    config: string,
    tools: string[],
    contractAddress: string,
  ): Promise<bigint> {
    const contract = this.getAgentRegistryContract(contractAddress);
    const tx = await contract.registerAgent(
      owner,
      name,
      description,
      framework,
      model,
      config,
      tools,
    );
    const receipt = await tx.wait();

    const agentId = await contract.getOwnerAgents(owner);
    return agentId[agentId.length - 1];
  }

  async mintCertificate(
    recipient: string,
    recipientName: string,
    courseTitle: string,
    courseId: string,
    instructorName: string,
    verificationHash: string,
    contractAddress: string,
  ): Promise<bigint> {
    const contract = this.getCertificateContract(contractAddress);
    const tx = await contract.mintCertificate(
      recipient,
      recipientName,
      courseTitle,
      courseId,
      instructorName,
      verificationHash,
    );
    const receipt = await tx.wait();

    const filter = contract.filters.CertificateMinted();
    const events = await contract.queryFilter(
      filter,
      receipt.blockNumber,
      receipt.blockNumber,
    );
    return (events[0] as ethers.EventLog).args[0];
  }

  async verifyCertificate(
    tokenId: bigint,
    contractAddress: string,
  ): Promise<boolean> {
    const contract = this.getCertificateContract(contractAddress);
    return contract.verifyCertificate(tokenId);
  }

  async updateReputation(
    tokenId: bigint,
    success: boolean,
    responseTimeSeconds: number,
    contractAddress: string,
  ): Promise<string> {
    const contract = this.getReputationContract(contractAddress);
    const tx = await contract.updateReputation(
      tokenId,
      success,
      responseTimeSeconds,
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  async getTransactionReceipt(
    txHash: string,
  ): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }

  async getGasPrice(): Promise<bigint> {
    return this.provider.getFeeData().then((fee) => fee.gasPrice || BigInt(0));
  }
}

export const blockchainService = new BlockchainService();
