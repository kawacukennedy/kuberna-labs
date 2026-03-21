import { Address, Hash, PublicClient, WalletClient, Abi } from 'viem';

export interface ChainAdapter {
  readonly chainId: number;
  readonly chainName: string;
  readonly nativeToken: TokenInfo;
  
  getPublicClient(): PublicClient;
  getWalletClient(): WalletClient | null;
  
  getBalance(address: Address): Promise<bigint>;
  getTokenBalance(token: Address, owner: Address): Promise<bigint>;
  
  signMessage(message: string): Promise<Hash>;
  signTypedData(typedData: object): Promise<Hash>;
  
  waitForTransaction(txHash: Hash, timeout?: number): Promise<boolean>;
}

export interface TokenInfo {
  address: Address | null;
  symbol: string;
  name: string;
  decimals: number;
  isNative: boolean;
}

export interface TransactionRequest {
  to: Address;
  value?: bigint;
  data?: `0x${string}`;
  gasLimit?: bigint;
  gasPrice?: bigint;
}

export interface TransactionReceipt {
  hash: Hash;
  status: 'success' | 'reverted';
  blockNumber: bigint;
  gasUsed: bigint;
  logs: Log[];
}

export interface Log {
  address: Address;
  topics: string[];
  data: string;
  transactionHash: Hash;
  logIndex: number;
}

export interface CallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export abstract class BaseChainAdapter implements ChainAdapter {
  abstract readonly chainId: number;
  abstract readonly chainName: string;
  abstract readonly nativeToken: TokenInfo;
  
  protected publicClient: PublicClient;
  protected walletClient: WalletClient | null = null;
  
  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.publicClient = publicClient;
    this.walletClient = walletClient || null;
  }
  
  getPublicClient(): PublicClient {
    return this.publicClient;
  }
  
  getWalletClient(): WalletClient | null {
    return this.walletClient;
  }
  
  setWalletClient(walletClient: WalletClient): void {
    this.walletClient = walletClient;
  }
  
  async getBalance(address: Address): Promise<bigint> {
    return this.publicClient.getBalance({ address });
  }
  
  abstract getTokenBalance(token: Address, owner: Address): Promise<bigint>;
  abstract signMessage(message: string): Promise<Hash>;
  abstract signTypedData(typedData: object): Promise<Hash>;
  
  async waitForTransaction(
    txHash: Hash,
    timeout: number = 120000
  ): Promise<boolean> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout,
      });
      return receipt.status === 'success';
    } catch {
      return false;
    }
  }
  
  protected async readContract<T>(
    address: Address,
    abi: Abi,
    functionName: string,
    args?: unknown[]
  ): Promise<CallResult<T>> {
    try {
      const data = await this.publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      });
      return { success: true, data: data as T };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  protected async writeContract(
    address: Address,
    abi: Abi,
    functionName: string,
    args?: unknown[],
    account?: Address
  ): Promise<CallResult<Hash>> {
    if (!this.walletClient) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    try {
      const hash = await this.walletClient.writeContract({
        address,
        abi,
        functionName,
        args: args as any,
        chain: (this.walletClient as any).chain,
        account: account || (this.walletClient.account as any),
      } as any);
      return { success: true, data: hash };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
