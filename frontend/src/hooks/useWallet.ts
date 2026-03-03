import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useCallback, useMemo } from 'react';
import { Address } from 'viem';
import { SUPPORTED_CHAINS, CHAIN_NAMES, getExplorerAddressUrl } from '../lib/chains';

interface UseWalletReturn {
  address: Address | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | undefined;
  chainName: string | undefined;
  explorerUrl: string | undefined;
  connector: { name: string } | undefined;
  
  connect: (connectorId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  
  isSupportedChain: boolean;
  supportedChains: typeof SUPPORTED_CHAINS;
}

export function useWallet(): UseWalletReturn {
  const { 
    address, 
    isConnected, 
    isConnecting,
    connector,
    chainId,
  } = useAccount();
  
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  
  const chainName = useMemo(() => {
    if (!chainId) return undefined;
    return CHAIN_NAMES[chainId] || 'Unknown Chain';
  }, [chainId]);
  
  const explorerUrl = useMemo(() => {
    if (!chainId || !address) return undefined;
    return getExplorerAddressUrl(chainId, address);
  }, [chainId, address]);
  
  const isSupportedChain = useMemo(() => {
    if (!chainId) return false;
    return SUPPORTED_CHAINS.some((chain) => chain.id === chainId);
  }, [chainId]);
  
  const connect = useCallback(async (connectorId?: string) => {
    const connector = connectorId 
      ? connectors.find((c) => c.uid === connectorId)
      : connectors[0];
    
    if (!connector) {
      throw new Error('No connector found');
    }
    
    await wagmiConnect({ connector });
  }, [connectors, wagmiConnect]);
  
  const disconnect = useCallback(async () => {
    await wagmiDisconnect();
  }, [wagmiDisconnect]);
  
  const switchChain = useCallback(async (targetChainId: number) => {
    await switchChainAsync({ chainId: targetChainId });
  }, [switchChainAsync]);
  
  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    chainName,
    explorerUrl,
    connector: connector ? { name: connector.name } : undefined,
    connect,
    disconnect,
    switchChain,
    isSupportedChain,
    supportedChains: SUPPORTED_CHAINS,
  };
}
