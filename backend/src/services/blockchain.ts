import { ethers, Contract, JsonRpcProvider, Wallet, Interface } from 'ethers';
import { prisma } from '../utils/prisma.js';
import {
  ESCROW_ABI,
  INTENT_ABI,
  AGENT_REGISTRY_ABI,
  CERTIFICATE_ABI,
  REPUTATION_ABI,
} from '../utils/abis.js';
import logger from '../utils/logger.js';

export interface ChainConfig {
  rpcUrl: string;
  privateKey: string;
  escrowAddress: string;
  intentAddress: string;
  agentRegistryAddress: string;
  certificateAddress: string;
  reputationAddress: string;
}

export interface BlockchainConfig {
  chains: Record<string, ChainConfig>;
  defaultChain: string;
}

export interface EscrowData {
  requester: string;
  executor: string;
  token: string;
  deadline: bigint;
  amount: bigint;
  fee: bigint;
  status: number;
  intentId: string;
}

export interface IntentData {
  requester: string;
  description: string;
  structuredData: string;
  sourceToken: string;
  sourceAmount: bigint;
  destToken: string;
  minDestAmount: bigint;
  budget: bigint;
  status: number;
  selectedSolver: string;
  intentId: string;
}

export interface BidData {
  solver: string;
  price: bigint;
  estimatedTime: bigint;
  routeDetails: string;
  status: number;
}

export class BlockchainService {
  private providers: Map<string, JsonRpcProvider>;
  private wallets: Map<string, Wallet>;
  private config: BlockchainConfig;
  private defaultChain: string;

  constructor(config: BlockchainConfig) {
    this.config = config;
    this.defaultChain = config.defaultChain || 'ethereum';
    this.providers = new Map();
    this.wallets = new Map();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    for (const [chain, chainConfig] of Object.entries(this.config.chains)) {
      const provider = new JsonRpcProvider(chainConfig.rpcUrl);
      this.providers.set(chain, provider);

      const wallet = new Wallet(chainConfig.privateKey, provider);
      this.wallets.set(chain, wallet);

      logger.info(`Initialized blockchain provider for ${chain}`);
    }
  }

  getProvider(chain?: string): JsonRpcProvider {
    const targetChain = chain || this.defaultChain;
    const provider = this.providers.get(targetChain);
    if (!provider) {
      throw new Error(`Provider not configured for chain: ${targetChain}`);
    }
    return provider;
  }

  getWallet(chain?: string): Wallet {
    const targetChain = chain || this.defaultChain;
    const wallet = this.wallets.get(targetChain);
    if (!wallet) {
      throw new Error(`Wallet not configured for chain: ${targetChain}`);
    }
    return wallet;
  }

  getChainConfig(chain?: string): ChainConfig {
    const targetChain = chain || this.defaultChain;
    const config = this.config.chains[targetChain];
    if (!config) {
      throw new Error(`Chain config not found for: ${targetChain}`);
    }
    return config;
  }

  private getContract<T extends Contract>(address: string, abi: any[], chain?: string): T {
    const wallet = this.getWallet(chain);
    return new Contract(address, abi, wallet) as T;
  }

  getEscrowContract(chain?: string): Contract {
    const config = this.getChainConfig(chain);
    return this.getContract(config.escrowAddress, ESCROW_ABI, chain);
  }

  getIntentContract(chain?: string): Contract {
    const config = this.getChainConfig(chain);
    return this.getContract(config.intentAddress, INTENT_ABI, chain);
  }

  getAgentRegistryContract(chain?: string): Contract {
    const config = this.getChainConfig(chain);
    return this.getContract(config.agentRegistryAddress, AGENT_REGISTRY_ABI, chain);
  }

  getCertificateContract(chain?: string): Contract {
    const config = this.getChainConfig(chain);
    return this.getContract(config.certificateAddress, CERTIFICATE_ABI, chain);
  }

  getReputationContract(chain?: string): Contract {
    const config = this.getChainConfig(chain);
    return this.getContract(config.reputationAddress, REPUTATION_ABI, chain);
  }

  async waitForTransaction(
    tx: ethers.TransactionResponse,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    logger.info(`Waiting for transaction: ${tx.hash}`);
    const receipt = await tx.wait(confirmations);
    if (!receipt) {
      throw new Error(`Transaction ${tx.hash} failed`);
    }
    logger.info(`Transaction confirmed: ${tx.hash} at block ${receipt.blockNumber}`);
    return receipt;
  }

  async getBalance(address: string, chain?: string): Promise<bigint> {
    const provider = this.getProvider(chain);
    return provider.getBalance(address);
  }

  async getGasPrice(chain?: string): Promise<bigint> {
    const provider = this.getProvider(chain);
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  async estimateGas(fn: () => Promise<any>, chain?: string): Promise<bigint> {
    const wallet = this.getWallet(chain);
    try {
      return await fn();
    } catch (originalError: any) {
      const error = originalError as { error?: { code?: number; data?: { gas?: bigint } } };
      if (error.error?.code === -32000 && error.error?.data?.gas) {
        return error.error.data.gas;
      }
      throw originalError;
    }
  }

  parseLog(contract: Contract, log: any): any {
    try {
      const iface = contract.interface;
      return iface.parseLog({
        topics: log.topics,
        data: log.data,
      });
    } catch {
      return null;
    }
  }

  encodeFunctionData(contract: Contract, functionName: string, args: any[]): string {
    const iface = new Interface(contract.interface.fragments);
    return iface.encodeFunctionData(functionName, args);
  }

  decodeFunctionResult(contract: Contract, functionName: string, result: string): any {
    const iface = new Interface(contract.interface.fragments);
    return iface.decodeFunctionResult(functionName, result);
  }
}

let blockchainServiceInstance: BlockchainService | null = null;

export function initializeBlockchainService(config?: BlockchainConfig): BlockchainService {
  if (config) {
    blockchainServiceInstance = new BlockchainService(config);
    return blockchainServiceInstance;
  }

  if (blockchainServiceInstance) {
    return blockchainServiceInstance;
  }

  const defaultConfig: BlockchainConfig = {
    defaultChain: process.env.DEFAULT_CHAIN || 'ethereum',
    chains: {
      ethereum: {
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
        privateKey:
          process.env.PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        escrowAddress: process.env.ESCROW_ADDRESS || '',
        intentAddress: process.env.INTENT_ADDRESS || '',
        agentRegistryAddress: process.env.AGENT_REGISTRY_ADDRESS || '',
        certificateAddress: process.env.CERTIFICATE_ADDRESS || '',
        reputationAddress: process.env.REPUTATION_ADDRESS || '',
      },
    },
  };

  blockchainServiceInstance = new BlockchainService(defaultConfig);
  return blockchainServiceInstance;
}

export const blockchainService = initializeBlockchainService();
