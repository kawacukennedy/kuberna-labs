import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  Address, 
  Hash,
  getAddress,
} from 'viem';
import { mainnet, sepolia, polygon, arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { BaseChainAdapter, TokenInfo, CallResult } from './base';
import { ERC20_ABI } from '../contracts';
import { CHAIN_IDS } from '../chains';

const CHAIN_CONFIG = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    chain: mainnet,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
  },
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    chain: sepolia,
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
  },
  [CHAIN_IDS.POLYGON]: {
    chain: polygon,
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
  },
  [CHAIN_IDS.ARBITRUM]: {
    chain: arbitrum,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
} as const;

export class EthereumAdapter extends BaseChainAdapter {
  readonly chainId: number;
  readonly chainName: string;
  readonly nativeToken: TokenInfo;
  
  constructor(chainId: number, privateKey?: `0x${string}`) {
    const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    
    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });
    
    super(publicClient);
    
    this.chainId = chainId;
    this.chainName = config.chain.name;
    this.nativeToken = {
      address: null as unknown as Address,
      symbol: config.chain.nativeCurrency.symbol,
      name: config.chain.nativeCurrency.name,
      decimals: config.chain.nativeCurrency.decimals,
      isNative: true,
    };
    
    if (privateKey) {
      const account = privateKeyToAccount(privateKey);
      const walletClient = createWalletClient({
        chain: config.chain,
        transport: http(config.rpcUrl),
        account,
      });
      this.setWalletClient(walletClient);
    }
  }
  
  static getSupportedChains(): number[] {
    return Object.keys(CHAIN_CONFIG).map(Number);
  }
  
  async getTokenBalance(token: Address, owner: Address): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [owner],
      });
      return balance as bigint;
    } catch {
      return 0n;
    }
  }
  
  async getTokenInfo(token: Address): Promise<TokenInfo> {
    const [symbol, decimals, name] = await Promise.all([
      this.publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'symbol',
        args: [],
      }),
      this.publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'decimals',
        args: [],
      }),
      this.publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'name',
        args: [],
      }),
    ]);
    
    return {
      address: token,
      symbol: symbol as string,
      name: name as string,
      decimals: decimals as number,
      isNative: false,
    };
  }
  
  async approveToken(
    token: Address,
    spender: Address,
    amount: bigint,
    account: Address
  ): Promise<CallResult<Hash>> {
    return this.writeContract(
      token,
      ERC20_ABI,
      'approve',
      [spender, amount],
      account
    );
  }
  
  async getAllowance(
    token: Address,
    owner: Address,
    spender: Address
  ): Promise<bigint> {
    const result = await this.readContract<bigint>(
      token,
      ERC20_ABI,
      'allowance',
      [owner, spender]
    );
    return result.data || 0n;
  }
  
  async transferToken(
    token: Address,
    to: Address,
    amount: bigint,
    account: Address
  ): Promise<CallResult<Hash>> {
    return this.writeContract(
      token,
      ERC20_ABI,
      'transfer',
      [to, amount],
      account
    );
  }
  
  async signMessage(message: string): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    if (!this.walletClient?.account) {
      throw new Error('Wallet account not found');
    }
    
    const signature = await this.walletClient.signMessage({
      message,
      account: this.walletClient.account,
    });
    
    return signature;
  }
  
  async signTypedData(typedData: object): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    const signature = await this.walletClient.signTypedData(typedData as never);
    
    return signature;
  }
  
  async sendTransaction(
    to: Address,
    value?: bigint,
    data?: `0x${string}`
  ): Promise<CallResult<Hash>> {
    if (!this.walletClient) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    try {
      if (!this.walletClient?.account) {
        return { success: false, error: 'Wallet account not found' };
      }
      
      const hash = await this.walletClient.sendTransaction({
        to: getAddress(to),
        value: value || 0n,
        data: data || '0x',
        account: this.walletClient.account,
        chain: (this.walletClient as any).chain,
      } as any);
      
      return { success: true, data: hash };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }
  
  async getTransactionReceipt(hash: Hash) {
    return this.publicClient.getTransactionReceipt({ hash });
  }
  
  async getBlockNumber(): Promise<bigint> {
    return this.publicClient.getBlockNumber();
  }
  
  async getGasPrice(): Promise<bigint> {
    return this.publicClient.getGasPrice();
  }
  
  async estimateGas(request: {
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  }): Promise<bigint> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    if (!this.walletClient?.account) {
      throw new Error('Wallet account not found');
    }
    
    return this.publicClient.estimateGas({
      account: this.walletClient.account,
      to: request.to,
      value: request.value,
      data: request.data,
    });
  }
}

export type { Address, Hash };
