import { ethers } from "ethers";

const ESCROW_ABI = [
  "function createEscrow(string calldata intentId, address token, uint256 amount, uint256 durationSeconds) external returns (bytes32)",
  "function fundEscrow(bytes32 escrowId) external payable",
  "function assignExecutor(bytes32 escrowId, address executor) external",
  "function submitCompletion(bytes32 escrowId, bytes32 proofHash) external",
  "function releaseFunds(bytes32 escrowId) external",
  "function raiseDispute(bytes32 escrowId, string calldata reason) external",
  "function getEscrow(bytes32 escrowId) external view returns (tuple)",
  "function escrows(bytes32) external view returns (address, address, address, uint256, uint256, uint256, uint8, string)",
];

const INTENT_ABI = [
  "function createIntent(bytes32 intentId, string calldata description, bytes calldata structuredData, address sourceToken, uint256 sourceAmount, address destToken, uint256 minDestAmount, uint256 budget, uint256 durationSeconds) external returns (bytes32)",
  "function submitBid(bytes32 intentId, uint256 price, uint256 estimatedTime, bytes calldata routeDetails) external",
  "function acceptBid(bytes32 intentId, uint256 solverIndex) external",
  "function completeIntent(bytes32 intentId) external",
  "function intents(bytes32) external view returns (address, string, bytes, address, uint256, address, uint256, uint256, uint8, address, bytes32)",
  "function bids(bytes32, uint256) external view returns (address, uint256, uint256, bytes, uint8, uint256)",
];

const AGENT_REGISTRY_ABI = [
  "function registerAgent(address owner, string calldata name, string calldata description, string calldata framework, string calldata model, string calldata config, string[] calldata tools) external returns (uint256)",
  "function updateAgent(uint256 tokenId, string calldata description, string calldata model, string calldata config) external",
  "function setStatus(uint256 tokenId, uint8 status) external",
  "function getAgent(uint256 tokenId) external view returns (tuple)",
  "function getOwnerAgents(address owner) external view returns (uint256[])",
];

const CERTIFICATE_ABI = [
  "function mintCertificate(address recipient, string calldata recipientName, string calldata courseTitle, string calldata courseId, string calldata instructorName, string calldata verificationHash) external returns (uint256)",
  "function verifyCertificate(uint256 tokenId) external view returns (bool)",
  "function certificateData(uint256) external view returns (string, string, string, uint256, string, string, bool)",
];

const REPUTATION_ABI = [
  "function registerAgent(address agentAddress) external returns (uint256)",
  "function updateReputation(uint256 tokenId, bool success, uint256 responseTimeSeconds) external",
  "function calculateScore(uint256 tokenId) external view returns (uint256)",
  "function getSuccessRate(uint256 tokenId) external view returns (uint256)",
  "function agentReputations(uint256) external view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
];

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
    const tx = await contract.createEscrow(
      intentId,
      token,
      amount,
      durationSeconds,
    );
    const receipt = await tx.wait();
    return receipt.hash;
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
    return events[0].args[0];
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
