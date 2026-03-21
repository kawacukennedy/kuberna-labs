import { Address } from 'viem';
import { ChainAdapter, TokenInfo } from './base';
import { EthereumAdapter } from './ethereum';
import { CHAIN_IDS } from '../chains';

export type SupportedChainId = 
  | typeof CHAIN_IDS.ETHEREUM_MAINNET
  | typeof CHAIN_IDS.ETHEREUM_SEPOLIA
  | typeof CHAIN_IDS.POLYGON
  | typeof CHAIN_IDS.ARBITRUM;

const CHAIN_ADAPTERS: Record<number, new (chainId: number, privateKey?: `0x${string}`) => ChainAdapter> = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: EthereumAdapter,
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: EthereumAdapter,
  [CHAIN_IDS.POLYGON]: EthereumAdapter,
  [CHAIN_IDS.ARBITRUM]: EthereumAdapter,
};

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_ADAPTERS).map(Number);

export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_ADAPTERS;
}

export function createChainAdapter(
  chainId: number,
  privateKey?: `0x${string}`
): ChainAdapter {
  const Adapter = CHAIN_ADAPTERS[chainId];
  
  if (!Adapter) {
    const supportedChains = SUPPORTED_CHAIN_IDS.join(', ');
    throw new Error(
      `Chain ${chainId} is not supported. Supported chains: ${supportedChains}`
    );
  }
  
  return new Adapter(chainId, privateKey);
}

export function getChainAdapter(
  chainId: number,
  privateKey?: `0x${string}`
): ChainAdapter {
  return createChainAdapter(chainId, privateKey);
}

export async function getBalance(
  chainId: number,
  address: Address,
  privateKey?: `0x${string}`
): Promise<bigint> {
  const adapter = createChainAdapter(chainId, privateKey);
  return adapter.getBalance(address);
}

export async function getTokenBalance(
  chainId: number,
  tokenAddress: Address,
  ownerAddress: Address,
  privateKey?: `0x${string}`
): Promise<bigint> {
  const adapter = createChainAdapter(chainId, privateKey);
  return adapter.getTokenBalance(tokenAddress, ownerAddress);
}

export async function getSupportedTokens(
  chainId: number
): Promise<TokenInfo[]> {
  const adapter = createChainAdapter(chainId);
  
  const tokens: TokenInfo[] = [adapter.nativeToken];
  
  const commonTokens: Record<number, TokenInfo[]> = {
    [CHAIN_IDS.ETHEREUM_MAINNET]: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        isNative: false,
      },
      {
        address: '0x6B175474E89094C44Da98b954EesADcdEF9bd2C' as Address,
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        isNative: false,
      },
    ],
    [CHAIN_IDS.ETHEREUM_SEPOLIA]: [
      {
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' as Address,
        symbol: 'USDC',
        name: 'USD Coin (Sepolia)',
        decimals: 6,
        isNative: false,
      },
    ],
    [CHAIN_IDS.POLYGON]: [
      {
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as Address,
        symbol: 'USDC',
        name: 'USD Coin (Polygon)',
        decimals: 6,
        isNative: false,
      },
    ],
    [CHAIN_IDS.ARBITRUM]: [
      {
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as Address,
        symbol: 'USDC',
        name: 'USD Coin (Arbitrum)',
        decimals: 6,
        isNative: false,
      },
    ],
  };
  
  const chainTokens = commonTokens[chainId];
  if (chainTokens) {
    tokens.push(...chainTokens);
  }
  
  return tokens;
}

export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  options?: {
    decimals?: number;
    symbol?: string;
    compact?: boolean;
  }
): string {
  const divisor = 10n ** BigInt(decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  let formatted = fractionalPart.toString().padStart(decimals, '0');
  
  if (options?.decimals && options.decimals < decimals) {
    formatted = formatted.slice(0, options.decimals);
  }
  
  const result = `${wholePart}.${formatted}`.replace(/\.?0+$/, '');
  
  if (options?.compact && wholePart > 1000n) {
    return `${result} ${options.symbol || ''}`.trim();
  }
  
  return `${result} ${options?.symbol || ''}`.trim();
}

export function parseTokenAmount(
  amount: string,
  decimals: number
): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export type { ChainAdapter, TokenInfo, CallResult } from './base';
export { EthereumAdapter } from './ethereum';
