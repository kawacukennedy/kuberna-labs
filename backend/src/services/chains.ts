import {
  ethers,
  Contract,
  BrowserProvider,
  formatUnits,
  parseUnits,
} from "ethers";

export type ChainName =
  | "ethereum"
  | "polygon"
  | "arbitrum"
  | "solana"
  | "near"
  | "avalanche"
  | "optimism";

export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
}

export interface Balance {
  token: string;
  amount: string;
  usdValue: string;
}

export interface SwapQuote {
  sourceToken: string;
  destToken: string;
  sourceAmount: string;
  destAmount: string;
  priceImpact: number;
  gasEstimate: string;
  route: string[];
  expiresAt: Date;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TransactionReceipt {
  txHash: string;
  status: boolean;
  blockNumber: number;
  gasUsed: string;
  logs: Array<{
    address: string;
    data: string;
    topics: string[];
  }>;
}

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
];

const CHAIN_CONFIG: Record<
  ChainName,
  {
    rpcUrl: string;
    chainId: number;
    nativeToken: TokenInfo;
    explorer: string;
    contracts: {
      uniswap?: string;
      sushiswap?: string;
      quoter?: string;
    };
  }
> = {
  ethereum: {
    rpcUrl:
      process.env.ETHEREUM_RPC || "https://eth-mainnet.g.alchemy.com/v2/demo",
    chainId: 1,
    nativeToken: {
      symbol: "ETH",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      name: "Ethereum",
    },
    explorer: "https://etherscan.io",
    contracts: {
      uniswap: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    },
  },
  polygon: {
    rpcUrl: process.env.POLYGON_RPC || "https://polygon-rpc.com",
    chainId: 137,
    nativeToken: {
      symbol: "MATIC",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      name: "Polygon",
    },
    explorer: "https://polygonscan.com",
    contracts: {
      uniswap: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
      quoter: "0xa6B71C5e084E265f74c812102Ca7114b6a896AB2",
    },
  },
  arbitrum: {
    rpcUrl: process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    nativeToken: {
      symbol: "ETH",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      name: "Ethereum",
    },
    explorer: "https://arbiscan.io",
    contracts: {
      uniswap: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    },
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com",
    chainId: 0x01,
    nativeToken: {
      symbol: "SOL",
      address: "So11111111111111111111111111111111111111111",
      decimals: 9,
      name: "Solana",
    },
    explorer: "https://solscan.io",
    contracts: {},
  },
  near: {
    rpcUrl: process.env.NEAR_RPC || "https://rpc.mainnet.near.org",
    chainId: 0,
    nativeToken: {
      symbol: "NEAR",
      address: "near",
      decimals: 24,
      name: "NEAR Protocol",
    },
    explorer: "https://explorer.near.org",
    contracts: {},
  },
  avalanche: {
    rpcUrl:
      process.env.AVALANCHE_RPC || "https://api.avax.network/ext/bc/C/rpc",
    chainId: 43114,
    nativeToken: {
      symbol: "AVAX",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      name: "Avalanche",
    },
    explorer: "https://snowtrace.io",
    contracts: {
      sushiswap: "0x1b02dA8Cb0d097eB8D571A81dEe3dFF5269C3d44",
    },
  },
  optimism: {
    rpcUrl: process.env.OPTIMISM_RPC || "https://mainnet.optimism.io",
    chainId: 10,
    nativeToken: {
      symbol: "ETH",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      name: "Ethereum",
    },
    explorer: "https://optimistic.etherscan.io",
    contracts: {
      uniswap: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    },
  },
};

export class ChainAdapter {
  protected provider: ethers.JsonRpcProvider;
  protected chain: ChainName;
  protected config: (typeof CHAIN_CONFIG)[ChainName];

  constructor(chain: ChainName) {
    this.chain = chain;
    this.config = CHAIN_CONFIG[chain];
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
  }

  async getBalance(address: string, tokenAddress?: string): Promise<Balance> {
    let amount: bigint;

    if (
      !tokenAddress ||
      tokenAddress === this.config.nativeToken.address ||
      tokenAddress === "0x0000000000000000000000000000000000000000"
    ) {
      amount = await this.provider.getBalance(address);
    } else {
      const contract = new Contract(tokenAddress, ERC20_ABI, this.provider);
      amount = await contract.balanceOf(address);
    }

    const formatted = formatUnits(
      amount,
      tokenAddress ? 18 : this.config.nativeToken.decimals,
    );
    return {
      token: tokenAddress || this.config.nativeToken.symbol,
      amount: formatted,
      usdValue: "0",
    };
  }

  async getTokenBalance(
    address: string,
    tokenAddress: string,
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await contract.balanceOf(address);
    return balance.toString();
  }

  async approveToken(
    tokenAddress: string,
    owner: string,
    spender: string,
    amount: string,
    privateKey: string,
  ): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const contract = new Contract(tokenAddress, ERC20_ABI, wallet);
    const tx = await contract.approve(spender, parseUnits(amount, 18));
    return tx.hash;
  }

  async getAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC20_ABI, this.provider);
    const allowance = await contract.allowance(owner, spender);
    return allowance.toString();
  }

  async getTransactionReceipt(
    txHash: string,
  ): Promise<TransactionReceipt | null> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) return null;

    return {
      txHash: receipt.hash,
      status: receipt.status === 1,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      logs: receipt.logs.map((log) => ({
        address: log.address,
        data: log.data,
        topics: Array.from(log.topics),
      })),
    };
  }

  async waitForTransaction(
    txHash: string,
    timeout: number = 60000,
  ): Promise<TransactionReceipt | null> {
    try {
      const receipt = await this.provider.waitForTransaction(
        txHash,
        1,
        Math.floor(timeout / 1000),
      );
      if (!receipt) return null;

      return {
        txHash: receipt.hash,
        status: receipt.status === 1,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        logs: receipt.logs.map((log) => ({
          address: log.address,
          data: log.data,
          topics: Array.from(log.topics),
        })),
      };
    } catch (error) {
      console.error("Transaction wait error:", error);
      return null;
    }
  }

  async getGasPrice(): Promise<string> {
    const fee = await this.provider.getFeeData();
    return (fee.gasPrice || BigInt(0)).toString();
  }

  async estimateGas(tx: TransactionRequest): Promise<string> {
    const estimate = await this.provider.estimateGas({
      to: tx.to,
      value: tx.value ? parseUnits(tx.value, 18) : undefined,
      data: tx.data,
    });
    return estimate.toString();
  }

  getChainId(): number {
    return this.config.chainId;
  }

  getExplorerUrl(txHash: string): string {
    return `${this.config.explorer}/tx/${txHash}`;
  }
}

export class EthereumAdapter extends ChainAdapter {
  constructor(chain: ChainName = "ethereum") {
    super(chain);
  }

  async getSwapQuote(
    sourceToken: string,
    destToken: string,
    amount: string,
    _address: string,
  ): Promise<SwapQuote | null> {
    const config = this.config;
    if (!config.contracts.uniswap || !config.contracts.quoter) {
      return null;
    }

    try {
      const quoterContract = new Contract(
        config.contracts.quoter,
        [
          "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint16 sqrtPriceLimitX96)) view returns (uint256 amountOut)",
        ],
        this.provider,
      );

      const amountIn = parseUnits(amount, 18);
      const fee = 3000;

      const destAmount = await quoterContract.quoteExactInputSingle({
        tokenIn: sourceToken,
        tokenOut: destToken,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0,
      });

      return {
        sourceToken,
        destToken,
        sourceAmount: amount,
        destAmount: formatUnits(destAmount, 18),
        priceImpact: 0.1,
        gasEstimate: "21000",
        route: [sourceToken, destToken],
        expiresAt: new Date(Date.now() + 30000),
      };
    } catch (error) {
      console.error("Quote error:", error);
      return null;
    }
  }

  async executeSwap(
    sourceToken: string,
    destToken: string,
    amountIn: string,
    minAmountOut: string,
    recipient: string,
    privateKey: string,
  ): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);

    const swapRouter = new Contract(
      this.config.contracts.uniswap!,
      [
        "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) returns (uint256 amountOut)",
      ],
      wallet,
    );

    const tx = await swapRouter.exactInputSingle({
      tokenIn: sourceToken,
      tokenOut: destToken,
      fee: 3000,
      recipient,
      deadline: Math.floor(Date.now() / 1000) + 600,
      amountIn: parseUnits(amountIn, 18),
      amountOutMinimum: parseUnits(minAmountOut, 18),
      sqrtPriceLimitX96: 0,
    });

    return tx.hash;
  }

  async getProtocolPositions(
    protocol: string,
    address: string,
  ): Promise<Array<{ token: string; amount: string; value: string }>> {
    const positions: Array<{ token: string; amount: string; value: string }> =
      [];

    if (protocol === "aave") {
    } else if (protocol === "compound") {
    }

    return positions;
  }
}

export class SolanaAdapter {
  private rpcUrl: string;

  constructor() {
    this.rpcUrl = CHAIN_CONFIG.solana.rpcUrl;
  }

  async getBalance(address: string): Promise<Balance> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    });

    const data = (await response.json()) as { result?: { value?: number } };
    const lamports = data.result?.value || 0;

    return {
      token: "SOL",
      amount: (lamports / 1e9).toString(),
      usdValue: "0",
    };
  }

  async getTokenBalance(address: string, mint: string): Promise<string> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [address, { mint }, { encoding: "jsonParsed" }],
      }),
    });

    const data = (await response.json()) as {
      result?: {
        value?: Array<{
          account?: {
            data?: {
              parsed?: { info?: { tokenAmount?: { amount?: string } } };
            };
          };
        }>;
      };
    };
    return (
      data.result?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount
        ?.amount || "0"
    );
  }

  async sendTransaction(_transaction: string): Promise<string> {
    return "simulated-tx-hash";
  }
}

export class NEARAdapter {
  private rpcUrl: string;

  constructor() {
    this.rpcUrl = CHAIN_CONFIG.near.rpcUrl;
  }

  async getBalance(accountId: string): Promise<Balance> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "query",
        params: {
          request_type: "view_account",
          account_id: accountId,
          finality: "final",
        },
      }),
    });

    const data = (await response.json()) as { result?: { amount?: string } };
    const amount = data.result?.amount || "0";

    return {
      token: "NEAR",
      amount: (parseInt(amount) / 1e24).toString(),
      usdValue: "0",
    };
  }

  async callMethod(
    contractId: string,
    method: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "query",
        params: {
          request_type: "call_function",
          account_id: contractId,
          method_name: method,
          args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
          finality: "final",
        },
      }),
    });

    const data = (await response.json()) as {
      result?: { result?: Uint8Array };
    };
    if (data.result?.result) {
      return JSON.parse(Buffer.from(data.result.result).toString());
    }
    return null;
  }

  async ftBalanceOf(accountId: string, contractId: string): Promise<string> {
    return (
      ((await this.callMethod(contractId, "ft_balance_of", {
        account_id: accountId,
      })) as string) || "0"
    );
  }
}

export class MultiChainService {
  private adapters: Map<ChainName, ChainAdapter | SolanaAdapter | NEARAdapter>;

  constructor() {
    this.adapters = new Map();
    this.adapters.set("ethereum", new EthereumAdapter("ethereum"));
    this.adapters.set("polygon", new EthereumAdapter("polygon"));
    this.adapters.set("arbitrum", new EthereumAdapter("arbitrum"));
    this.adapters.set("avalanche", new EthereumAdapter("avalanche"));
    this.adapters.set("optimism", new EthereumAdapter("optimism"));
    this.adapters.set("solana", new SolanaAdapter());
    this.adapters.set("near", new NEARAdapter());
  }

  getAdapter(
    chain: ChainName,
  ): ChainAdapter | SolanaAdapter | NEARAdapter | undefined {
    return this.adapters.get(chain);
  }

  async getBalance(
    address: string,
    chain: ChainName,
    tokenAddress?: string,
  ): Promise<Balance> {
    const adapter = this.adapters.get(chain);
    if (!adapter) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    return adapter.getBalance(address, tokenAddress);
  }

  async getAllChainBalances(
    address: string,
  ): Promise<Record<ChainName, Balance[]>> {
    const result: Record<ChainName, Balance[]> = {} as Record<
      ChainName,
      Balance[]
    >;

    for (const [chain, adapter] of this.adapters) {
      try {
        const balance = await adapter.getBalance(address);
        result[chain] = [balance];
      } catch (error) {
        console.error(`Failed to get balance for ${chain}:`, error);
        result[chain] = [];
      }
    }

    return result;
  }

  async getSwapQuote(
    chain: ChainName,
    sourceToken: string,
    destToken: string,
    amount: string,
    address: string,
  ): Promise<SwapQuote | null> {
    const adapter = this.adapters.get(chain);
    if (!adapter || !(adapter instanceof EthereumAdapter)) {
      return null;
    }
    return adapter.getSwapQuote(sourceToken, destToken, amount, address);
  }

  async crossChainTransfer(
    sourceChain: ChainName,
    destChain: ChainName,
    token: string,
    amount: string,
    recipient: string,
    privateKey: string,
  ): Promise<string> {
    return `cross-chain-tx-${Date.now()}`;
  }
}

export const multiChainService = new MultiChainService();
