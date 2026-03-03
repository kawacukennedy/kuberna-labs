import { Chain, mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains';

export interface KubernaChain extends Chain {
  explorer: string;
  faucet?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_CHAINS: KubernaChain[] = [
  {
    ...mainnet,
    explorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    ...sepolia,
    explorer: 'https://sepolia.etherscan.io',
    faucet: 'https://faucet.sepolia.dev',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
  },
  {
    ...polygon,
    explorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  {
    ...arbitrum,
    explorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
];

export const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  POLYGON: 137,
  POLYGON_AMOY: 80002,
  ARBITRUM: 42161,
  ARBITRUM_SEPOLIA: 421614,
} as const;

export type ChainName = keyof typeof CHAIN_IDS;

export const CHAIN_NAMES: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: 'Ethereum',
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: 'Sepolia',
  [CHAIN_IDS.POLYGON]: 'Polygon',
  [CHAIN_IDS.POLYGON_AMOY]: 'Polygon Amoy',
  [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: 'Arbitrum Sepolia',
};

export const getChainById = (chainId: number): KubernaChain | undefined => {
  return SUPPORTED_CHAINS.find((chain) => chain.id === chainId);
};

export const getExplorerUrl = (chainId: number, txHash: string): string => {
  const chain = getChainById(chainId);
  if (!chain) return `https://etherscan.io/tx/${txHash}`;
  return `${chain.explorer}/tx/${txHash}`;
};

export const getExplorerAddressUrl = (chainId: number, address: string): string => {
  const chain = getChainById(chainId);
  if (!chain) return `https://etherscan.io/address/${address}`;
  return `${chain.explorer}/address/${address}`;
};
