import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const ogTestnet = {
  id: 16602,
  name: '0G Galileo Testnet',
  nativeCurrency: { name: 'A0GI', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Scan', url: 'https://scan-testnet.0g.ai' },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, baseSepolia, { ...ogTestnet }],
  connectors: [injected(), ...(projectId ? [walletConnect({ projectId })] : [])],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [ogTestnet.id]: http('https://evmrpc-testnet.0g.ai'),
  },
  ssr: true,
});

export const WALLET_CONNECT_PROJECT_ID = projectId;
