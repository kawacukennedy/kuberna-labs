import { Chain, mainnet, sepolia, polygon, arbitrum, baseSepolia } from 'wagmi/chains';

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
  {
    ...baseSepolia,
    explorer: 'https://sepolia.basescan.org',
    faucet: 'https://faucet.quicknode.com/base/sepolia',
    nativeCurrency: {
      name: 'Base Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 16602,
    name: '0G Galileo Testnet',
    nativeCurrency: { name: 'A0GI', symbol: 'A0GI', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://evmrpc-testnet.0g.ai'] },
      public: { http: ['https://evmrpc-testnet.0g.ai'] },
    },
    blockExplorers: {
      default: { name: '0G Scan', url: 'https://scan-testnet.0g.ai' },
    },
    contracts: {},
    testnet: true,
    explorer: 'https://scan-testnet.0g.ai',
  },
];

export const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  POLYGON: 137,
  POLYGON_AMOY: 80002,
  ARBITRUM: 42161,
  ARBITRUM_SEPOLIA: 421614,
  BASE_SEPOLIA: 84532,
  OG_TESTNET: 16602,
} as const;

export type ChainName = keyof typeof CHAIN_IDS;

export const CHAIN_NAMES: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: 'Ethereum',
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: 'Sepolia',
  [CHAIN_IDS.POLYGON]: 'Polygon',
  [CHAIN_IDS.POLYGON_AMOY]: 'Polygon Amoy',
  [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: 'Arbitrum Sepolia',
  [CHAIN_IDS.BASE_SEPOLIA]: 'Base Sepolia',
  [CHAIN_IDS.OG_TESTNET]: '0G Galileo Testnet',
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
