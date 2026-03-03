import { getDefaultConfig } from '@wagmi/core';
import { injected, walletConnect } from 'wagmi/connectors';
import { SUPPORTED_CHAINS } from './chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const config = getDefaultConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
    walletConnect({
      projectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [SUPPORTED_CHAINS[0].id]: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    [SUPPORTED_CHAINS[1].id]: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    [SUPPORTED_CHAINS[2].id]: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
    [SUPPORTED_CHAINS[3].id]: 'https://arb1.arbitrum.io/rpc',
  },
  ssr: false,
});

export const WALLET_CONNECT_PROJECT_ID = projectId;
