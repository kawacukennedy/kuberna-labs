import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required in production');
}

if (!projectId) {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set. WalletConnect will not work.');
}

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum],
  connectors: [injected(), ...(projectId ? [walletConnect({ projectId })] : [])],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});

export const WALLET_CONNECT_PROJECT_ID = projectId;
